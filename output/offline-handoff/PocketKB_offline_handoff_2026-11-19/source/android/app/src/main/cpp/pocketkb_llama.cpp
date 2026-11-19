#include <jni.h>
#include <atomic>
#include <mutex>
#include <string>
#include <vector>

#include "llama.h"
#include "ggml-backend.h"
#include "logging.h"

static std::mutex g_mutex;
static std::atomic_bool g_cancel(false);
static bool g_backend_initialized = false;
static llama_model * g_model = nullptr;
static llama_context * g_context = nullptr;
static llama_sampler * g_sampler = nullptr;
static int g_context_tokens = 0;

static void release_model_locked() {
    if (g_sampler != nullptr) {
        llama_sampler_free(g_sampler);
        g_sampler = nullptr;
    }
    if (g_context != nullptr) {
        llama_free(g_context);
        g_context = nullptr;
    }
    if (g_model != nullptr) {
        llama_model_free(g_model);
        g_model = nullptr;
    }
    g_context_tokens = 0;
}

static int clamp_int(int value, int min_value, int max_value) {
    if (value < min_value) return min_value;
    if (value > max_value) return max_value;
    return value;
}

static std::vector<llama_token> tokenize_prompt(const std::string & prompt) {
    const llama_vocab * vocab = llama_model_get_vocab(g_model);
    const int count = -llama_tokenize(
            vocab,
            prompt.c_str(),
            static_cast<int32_t>(prompt.size()),
            nullptr,
            0,
            true,
            true);
    if (count <= 0) return {};

    std::vector<llama_token> tokens(static_cast<size_t>(count));
    const int actual = llama_tokenize(
            vocab,
            prompt.c_str(),
            static_cast<int32_t>(prompt.size()),
            tokens.data(),
            static_cast<int32_t>(tokens.size()),
            true,
            true);
    if (actual < 0) return {};
    tokens.resize(static_cast<size_t>(actual));
    return tokens;
}

static std::string token_to_piece(llama_token token) {
    const llama_vocab * vocab = llama_model_get_vocab(g_model);
    char buffer[256];
    const int written = llama_token_to_piece(vocab, token, buffer, sizeof(buffer), 0, true);
    if (written < 0) return "";
    return std::string(buffer, static_cast<size_t>(written));
}

extern "C"
JNIEXPORT void JNICALL
Java_com_pocketkb_android_ai_NativeLlamaBridge_nativeInit(
        JNIEnv * env,
        jobject,
        jstring native_lib_dir) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_backend_initialized) return;

    llama_log_set(pocketkb_android_log_callback, nullptr);
    const char * path = env->GetStringUTFChars(native_lib_dir, nullptr);
    if (path != nullptr) {
        LOGi("Loading ggml backends from %s", path);
        ggml_backend_load_all_from_path(path);
        env->ReleaseStringUTFChars(native_lib_dir, path);
    }
    llama_backend_init();
    g_backend_initialized = true;
}

extern "C"
JNIEXPORT jint JNICALL
Java_com_pocketkb_android_ai_NativeLlamaBridge_nativeLoad(
        JNIEnv * env,
        jobject,
        jstring model_path,
        jint context_tokens,
        jint thread_count,
        jint batch_size) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (!g_backend_initialized) return 10;

    release_model_locked();

    const char * path = env->GetStringUTFChars(model_path, nullptr);
    if (path == nullptr) return 11;

    llama_model_params model_params = llama_model_default_params();
    model_params.n_gpu_layers = 0;
    model_params.use_mmap = true;
    model_params.use_mlock = false;

    LOGi("Loading model: %s", path);
    g_model = llama_model_load_from_file(path, model_params);
    env->ReleaseStringUTFChars(model_path, path);
    if (g_model == nullptr) return 12;

    const int safe_context = clamp_int(context_tokens, 512, 2048);
    const int safe_threads = clamp_int(thread_count, 1, 4);
    const int safe_batch = clamp_int(batch_size, 64, 256);

    llama_context_params context_params = llama_context_default_params();
    context_params.n_ctx = static_cast<uint32_t>(safe_context);
    context_params.n_batch = static_cast<uint32_t>(safe_batch);
    context_params.n_ubatch = static_cast<uint32_t>(safe_batch);
    context_params.n_threads = safe_threads;
    context_params.n_threads_batch = safe_threads;
    context_params.no_perf = true;

    g_context = llama_init_from_model(g_model, context_params);
    if (g_context == nullptr) {
        release_model_locked();
        return 13;
    }
    g_context_tokens = safe_context;

    llama_sampler_chain_params sampler_params = llama_sampler_chain_default_params();
    sampler_params.no_perf = true;
    g_sampler = llama_sampler_chain_init(sampler_params);
    llama_sampler_chain_add(g_sampler, llama_sampler_init_greedy());
    return 0;
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_pocketkb_android_ai_NativeLlamaBridge_nativeGenerate(
        JNIEnv * env,
        jobject,
        jstring prompt,
        jint max_tokens) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_model == nullptr || g_context == nullptr || g_sampler == nullptr) {
        return env->NewStringUTF("[ERROR] model is not loaded");
    }

    const char * prompt_chars = env->GetStringUTFChars(prompt, nullptr);
    if (prompt_chars == nullptr) return env->NewStringUTF("[ERROR] prompt is null");
    std::string prompt_text(prompt_chars);
    env->ReleaseStringUTFChars(prompt, prompt_chars);

    g_cancel.store(false);
    llama_memory_clear(llama_get_memory(g_context), false);
    llama_sampler_reset(g_sampler);

    std::vector<llama_token> prompt_tokens = tokenize_prompt(prompt_text);
    const int safe_max_tokens = clamp_int(max_tokens, 32, 384);
    if (prompt_tokens.empty()) {
        return env->NewStringUTF("[ERROR] failed to tokenize prompt");
    }
    if (static_cast<int>(prompt_tokens.size()) + safe_max_tokens + 4 >= g_context_tokens) {
        return env->NewStringUTF("[ERROR] prompt exceeds mobile context budget");
    }

    llama_batch batch = llama_batch_get_one(prompt_tokens.data(), static_cast<int32_t>(prompt_tokens.size()));
    if (llama_decode(g_context, batch) != 0) {
        return env->NewStringUTF("[ERROR] prompt decode failed");
    }

    const llama_vocab * vocab = llama_model_get_vocab(g_model);
    std::string output;
    output.reserve(1024);

    for (int i = 0; i < safe_max_tokens && !g_cancel.load(); ++i) {
        const llama_token next_token = llama_sampler_sample(g_sampler, g_context, -1);
        if (llama_vocab_is_eog(vocab, next_token)) {
            break;
        }

        output += token_to_piece(next_token);
        batch = llama_batch_get_one(const_cast<llama_token *>(&next_token), 1);
        if (llama_decode(g_context, batch) != 0) {
            output += "\n[ERROR] token decode failed";
            break;
        }
    }

    return env->NewStringUTF(output.c_str());
}

extern "C"
JNIEXPORT void JNICALL
Java_com_pocketkb_android_ai_NativeLlamaBridge_nativeCancel(JNIEnv *, jobject) {
    g_cancel.store(true);
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_pocketkb_android_ai_NativeLlamaBridge_nativeSystemInfo(JNIEnv * env, jobject) {
    return env->NewStringUTF(llama_print_system_info());
}
