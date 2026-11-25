package com.pocketkb.android.ai

import android.content.Context
import com.pocketkb.android.core.DrillScenario
import com.pocketkb.android.core.RetrievalResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

interface LocalLlmEngine {
    val isReady: Boolean
    val status: String
    suspend fun loadModel(modelPath: String): Result<Unit>
    suspend fun generate(
        prompt: String,
        scenario: DrillScenario?,
        retrievalResults: List<RetrievalResult>,
        onToken: (String) -> Unit,
    ): Result<Unit>
    fun cancel()
}

class DevelopmentLlmEngine : LocalLlmEngine {
    override val isReady: Boolean = false
    override val status: String = "未載入本地模型；目前使用內建嚴格裁判與 RAG。"

    override suspend fun loadModel(modelPath: String): Result<Unit> {
        return Result.failure(UnsupportedOperationException("Development engine does not load models."))
    }

    override suspend fun generate(
        prompt: String,
        scenario: DrillScenario?,
        retrievalResults: List<RetrievalResult>,
        onToken: (String) -> Unit,
    ): Result<Unit> = Result.failure(UnsupportedOperationException("No local model loaded."))

    override fun cancel() = Unit
}

class LlamaCppEngine(
    private val context: Context,
) : LocalLlmEngine {
    private val bridge = NativeLlamaBridge(context.applicationContext)
    private var config: LlmRuntimeConfig? = null
    private var lastStatus: String = bridge.status

    override val isReady: Boolean
        get() = bridge.isAvailable && config != null

    override val status: String
        get() = lastStatus

    override suspend fun loadModel(modelPath: String): Result<Unit> = withContext(Dispatchers.IO) {
        if (!bridge.isAvailable) {
            return@withContext Result.failure(IllegalStateException(bridge.status))
        }
        val readiness = ModelRuntimePolicy.buildSafeConfig(context, modelPath)
        if (!readiness.canRun || readiness.config == null) {
            lastStatus = readiness.message
            return@withContext Result.failure(IllegalArgumentException(readiness.message))
        }
        val safeConfig = readiness.config
        val rc = bridge.load(
            modelPath = safeConfig.modelPath,
            contextTokens = safeConfig.contextTokens,
            threadCount = safeConfig.threadCount,
            batchSize = safeConfig.batchSize,
        )
        if (rc == 0) {
            config = safeConfig
            lastStatus = "本地模型已載入。${readiness.message}"
            Result.success(Unit)
        } else {
            val explanation = ModelRuntimePolicy.explainNativeLoadError(rc)
            lastStatus = "模型載入失敗，錯誤碼 $rc。$explanation"
            Result.failure(IllegalStateException(lastStatus))
        }
    }

    override suspend fun generate(
        prompt: String,
        scenario: DrillScenario?,
        retrievalResults: List<RetrievalResult>,
        onToken: (String) -> Unit,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val safeConfig = config
            ?: return@withContext Result.failure(IllegalStateException("No GGUF model loaded."))
        val safePrompt = PromptBudgeter.fit(prompt, safeConfig.promptCharBudget)
        val text = bridge.generate(safePrompt, safeConfig.maxOutputTokens)
        if (text.startsWith("[ERROR]")) {
            Result.failure(IllegalStateException(text))
        } else {
            onToken(text)
            Result.success(Unit)
        }
    }

    override fun cancel() {
        bridge.cancel()
    }

    fun unload() {
        bridge.unload()
        config = null
    }
}
