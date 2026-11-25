package com.pocketkb.android.ai

import android.content.Context

class NativeLlamaBridge(context: Context) {
    val isAvailable: Boolean
    val status: String

    init {
        var ready = false
        var message = "llama.cpp native library is not loaded."
        try {
            System.loadLibrary("pocketkb-llama")
            nativeInit(context.applicationInfo.nativeLibraryDir)
            ready = true
            message = "llama.cpp native bridge ready. ${nativeSystemInfo().lineSequence().firstOrNull().orEmpty()}"
        } catch (error: Throwable) {
            message = "llama.cpp native bridge unavailable: ${error.message ?: error::class.java.simpleName}"
        }
        isAvailable = ready
        status = message
    }

    fun load(modelPath: String, contextTokens: Int, threadCount: Int, batchSize: Int): Int {
        return nativeLoad(modelPath, contextTokens, threadCount, batchSize)
    }

    fun generate(prompt: String, maxTokens: Int): String {
        return nativeGenerate(prompt, maxTokens)
    }

    fun cancel() {
        nativeCancel()
    }

    fun unload() {
        if (isAvailable) nativeUnload()
    }

    private external fun nativeInit(nativeLibDir: String)
    private external fun nativeLoad(
        modelPath: String,
        contextTokens: Int,
        threadCount: Int,
        batchSize: Int,
    ): Int
    private external fun nativeGenerate(prompt: String, maxTokens: Int): String
    private external fun nativeCancel()
    private external fun nativeUnload()
    private external fun nativeSystemInfo(): String
}
