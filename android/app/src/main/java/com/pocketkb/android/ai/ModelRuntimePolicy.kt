package com.pocketkb.android.ai

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import java.io.File
import kotlin.math.max

data class LlmRuntimeConfig(
    val modelPath: String,
    val contextTokens: Int,
    val maxOutputTokens: Int,
    val threadCount: Int,
    val useGpu: Boolean,
    val batchSize: Int,
    val promptCharBudget: Int,
)

data class ModelReadiness(
    val canRun: Boolean,
    val message: String,
    val config: LlmRuntimeConfig?,
)

object ModelRuntimePolicy {
    private const val MIN_MODEL_BYTES = 200L * 1024L * 1024L
    private const val MAX_MODEL_BYTES = 2L * 1024L * 1024L * 1024L
    private const val BASELINE_MAX_MODEL_BYTES = 1600L * 1024L * 1024L

    fun buildSafeConfig(context: Context, modelPath: String): ModelReadiness {
        val file = File(modelPath)
        if (!file.exists()) {
            return ModelReadiness(false, "找不到模型檔：$modelPath", null)
        }
        if (!file.isFile || !file.canRead()) {
            return ModelReadiness(false, "模型檔無法讀取，請確認檔案權限與存放位置。", null)
        }
        if (file.extension.lowercase() != "gguf") {
            return ModelReadiness(false, "目前 Android 版只支援 GGUF 模型，請確認副檔名是 .gguf。", null)
        }
        if (file.length() !in MIN_MODEL_BYTES..MAX_MODEL_BYTES) {
            return ModelReadiness(
                false,
                "模型大小是 ${formatBytes(file.length())}，不適合手機端測試。建議先使用 Qwen2.5 0.5B/1.5B Q4 GGUF。",
                null,
            )
        }
        if (!hasGgufMagic(file)) {
            return ModelReadiness(
                false,
                "這個檔案不是有效 GGUF，或下載不完整。請重新下載，不要把 zip、safetensors、或 Hugging Face LFS 指標檔改名成 .gguf。",
                null,
            )
        }

        val activityManager = context.getSystemService(ActivityManager::class.java)
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)
        val totalGb = memoryInfo.totalMem / (1024L * 1024L * 1024L)
        val baselinePhone = activityManager.isLowRamDevice || totalGb <= 8

        val likelyRedmiNote13ProPlus =
            Build.MODEL.contains("23090RA", ignoreCase = true) ||
                Build.MODEL.contains("Note 13 Pro+", ignoreCase = true) ||
                Build.MANUFACTURER.contains("Xiaomi", ignoreCase = true) ||
                Build.BRAND.contains("Redmi", ignoreCase = true)

        if (baselinePhone && file.length() > BASELINE_MAX_MODEL_BYTES) {
            return ModelReadiness(
                false,
                "為了確保 Redmi Note 13 Pro+ 5G 的 8GB 版本穩定，請先使用 1.6GB 以下的 Q4 GGUF。",
                null,
            )
        }

        val contextTokens = when {
            baselinePhone -> 1024
            likelyRedmiNote13ProPlus -> 1280
            else -> 1536
        }
        val maxOutput = when {
            baselinePhone -> 220
            likelyRedmiNote13ProPlus -> 260
            else -> 320
        }
        val threads = when {
            baselinePhone -> 3
            likelyRedmiNote13ProPlus -> 4
            else -> max(2, Runtime.getRuntime().availableProcessors() / 2)
        }.coerceIn(2, 4)

        val config = LlmRuntimeConfig(
            modelPath = file.absolutePath,
            contextTokens = contextTokens,
            maxOutputTokens = maxOutput,
            threadCount = threads,
            useGpu = false,
            batchSize = 128,
            promptCharBudget = when {
                baselinePhone -> 1200
                likelyRedmiNote13ProPlus -> 1500
                else -> 1800
            },
        )
        return ModelReadiness(
            canRun = true,
            message = "安全設定：CPU-only, context=${config.contextTokens}, threads=${config.threadCount}, batch=${config.batchSize}, file=${formatBytes(file.length())}",
            config = config,
        )
    }

    fun explainNativeLoadError(code: Int): String {
        return when (code) {
            10 -> "llama.cpp 後端尚未初始化，請重新開啟 App。"
            11 -> "模型路徑傳入失敗，請確認檔案名稱不要包含異常符號。"
            12 -> "llama.cpp 無法解析這個 GGUF。常見原因：模型下載不完整、檔案損毀、模型架構太新、或不是 Qwen/Llama 類 GGUF。請先改用 Qwen2.5 0.5B/1.5B Instruct Q4_K_M GGUF 測試。"
            13 -> "模型可以讀取，但建立 context 失敗。請換更小模型，或降低 context。"
            else -> "未知 native 錯誤碼 $code，請用 logcat 搜尋 PocketKB-Llama。"
        }
    }

    fun findCandidateModels(context: Context): List<File> {
        val roots = listOfNotNull(
            File(context.filesDir, "models"),
            context.getExternalFilesDir("models"),
            context.getExternalFilesDir(null),
        )
        return roots
            .filter { it.exists() }
            .flatMap { root ->
                root.walkTopDown()
                    .maxDepth(2)
                    .filter { it.isFile && it.extension.lowercase() == "gguf" }
                    .toList()
            }
            .distinctBy { it.absolutePath }
            .sortedBy { it.length() }
    }

    private fun hasGgufMagic(file: File): Boolean {
        return runCatching {
            file.inputStream().use { input ->
                val header = ByteArray(4)
                input.read(header) == 4 &&
                    header[0] == 'G'.code.toByte() &&
                    header[1] == 'G'.code.toByte() &&
                    header[2] == 'U'.code.toByte() &&
                    header[3] == 'F'.code.toByte()
            }
        }.getOrDefault(false)
    }

    private fun formatBytes(bytes: Long): String {
        val mb = bytes.toDouble() / (1024.0 * 1024.0)
        return if (mb >= 1024.0) {
            "%.2f GB".format(mb / 1024.0)
        } else {
            "%.0f MB".format(mb)
        }
    }
}

object PromptBudgeter {
    fun fit(prompt: String, charBudget: Int): String {
        if (prompt.length <= charBudget) return prompt
        val headBudget = (charBudget * 0.55).toInt()
        val tailBudget = charBudget - headBudget - 80
        return prompt.take(headBudget) +
            "\n\n[中間較舊的對話已裁切，以避免手機記憶體過載]\n\n" +
            prompt.takeLast(tailBudget.coerceAtLeast(200))
    }
}
