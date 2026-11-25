package com.pocketkb.android.ai

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.Closeable
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest

internal enum class ChoiceModelKind(val label: String) {
    E2B("Gemma 4 E2B"), E4B("Gemma 4 E4B"), LLAMA("llama.cpp"), OFF("固定旁白")
}

internal data class GemmaDownload(val file: String, val url: String, val bytes: Long, val sha256: String) {
    init {
        require(Regex("[a-zA-Z0-9-]+\\.litertlm").matches(file))
        require(url.startsWith("https://") && bytes > 0 && Regex("[0-9a-f]{64}").matches(sha256))
    }
}

internal val gemmaDownloads = mapOf(
    ChoiceModelKind.E2B to GemmaDownload("gemma-4-E2B-it.litertlm",
        "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/6e5c4f1e395deb959c494953478fa5cec4b8008f/gemma-4-E2B-it.litertlm",
        2_588_147_712, "181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c"),
    ChoiceModelKind.E4B to GemmaDownload("gemma-4-E4B-it.litertlm",
        "https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/28299f30ee4d43294517a4ac93abd6163412f07f/gemma-4-E4B-it.litertlm",
        3_659_530_240, "0b2a8980ce155fd97673d8e820b4d29d9c7d99b8fa6806f425d969b145bd52e0"),
)

internal class ModelTransfer(val code: Int, val range: String?, val stream: InputStream, val release: () -> Unit = {}) : Closeable {
    override fun close() { try { stream.close() } finally { release() } }
}

internal class ChoiceModelStore(
    private val directory: File, private val wifi: () -> Boolean,
    private val connect: (GemmaDownload, Long) -> ModelTransfer,
) {
    private val downloads = Mutex()
    private val confirmed = mutableMapOf<GemmaDownload, Pair<Long, Long>>()

    fun localPath(artifact: GemmaDownload): File? {
        val file = File(directory, artifact.file)
        if (!file.isFile || file.length() != artifact.bytes) return null
        val fingerprint = file.lastModified() to file.length()
        val known = synchronized(confirmed) { confirmed[artifact] }
        if (known == fingerprint) return file
        if (sha256(file) != artifact.sha256) return null
        synchronized(confirmed) { confirmed[artifact] = fingerprint }
        return file
    }

    suspend fun download(artifact: GemmaDownload, allow: Boolean, progress: (Long) -> Unit): File =
        withContext(Dispatchers.IO) {
            require(allow) { "未確認下載" }
            require(wifi()) { "需先連上 Wi-Fi" }
            downloads.withLock {
                localPath(artifact)?.let { return@withLock it }
                check(directory.mkdirs() || directory.isDirectory)
                val part = File(directory, artifact.file+".part")
                var offset = part.length()
                require(offset <= artifact.bytes) { "續傳檔案大小錯誤" }
                require(directory.usableSpace >= artifact.bytes-offset) { "可用空間不足" }
                progress(offset)
                if (offset < artifact.bytes) connect(artifact, offset).use { transfer ->
                    val resumed = transfer.code == 206
                    if (resumed) {
                        val expected = "bytes $offset-${artifact.bytes-1}/${artifact.bytes}"
                        require(transfer.range == expected) { "伺服器續傳範圍不符" }
                    } else {
                        require(transfer.code == 200) { "模型下載失敗" }
                        require(directory.usableSpace+offset >= artifact.bytes) { "可用空間不足" }
                        offset = 0
                    }
                    FileOutputStream(part, resumed).use { out ->
                        val buffer = ByteArray(128 * 1024)
                        while (true) {
                            coroutineContext.ensureActive()
                            check(wifi()) { "Wi-Fi 中斷，已保留續傳進度" }
                            val n = transfer.stream.read(buffer)
                            if (n < 0) break
                            require(offset+n <= artifact.bytes) { "模型下載位元數過多" }
                            out.write(buffer, 0, n)
                            offset += n
                            progress(offset)
                        }
                        out.fd.sync()
                    }
                }
                require(part.length() == artifact.bytes) { "模型尚未下載完整，可繼續續傳" }
                if (sha256(part) != artifact.sha256) {
                    part.delete()
                    error("模型 SHA-256 不符")
                }
                val target = File(directory, artifact.file)
                Files.move(part.toPath(), target.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
                synchronized(confirmed) { confirmed[artifact] = target.lastModified() to target.length() }
                target
            }
        }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { stream ->
            val data = ByteArray(128 * 1024)
            while (true) {
                val size = stream.read(data)
                if (size < 0) break
                digest.update(data, 0, size)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    companion object {
        fun onDevice(context: Context): ChoiceModelStore {
            val cm = context.getSystemService(ConnectivityManager::class.java)
            fun activeWifi() = cm.activeNetwork?.takeIf {
                cm.getNetworkCapabilities(it)?.let { capabilities ->
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) &&
                        capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                } == true
            }
            return ChoiceModelStore(File(context.noBackupFilesDir, "choice-models"), { activeWifi() != null }) { model, offset ->
                val network = requireNotNull(activeWifi()) { "需先連上 Wi-Fi" }
                val connection = network.openConnection(URL(model.url)) as HttpURLConnection
                try {
                    connection.connectTimeout = 12_000
                    connection.readTimeout = 20_000
                    connection.setRequestProperty("Accept-Encoding", "identity")
                    if (offset > 0) connection.setRequestProperty("Range", "bytes=$offset-")
                    val code = connection.responseCode
                    val stream = if (code in 200..299) connection.inputStream else connection.errorStream ?: ByteArrayInputStream(byteArrayOf())
                    ModelTransfer(code, connection.getHeaderField("Content-Range"), stream, connection::disconnect)
                } catch (e: Exception) {
                    connection.disconnect()
                    throw e
                }
            }
        }
    }
}
