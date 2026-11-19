package com.pocketkb.android.ai

import com.pocketkb.android.BuildConfig
import com.pocketkb.android.core.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

internal suspend fun coachTurnOrFallback(remote: suspend () -> Unit, offline: () -> Unit) {
    try {
        remote()
    } catch (error: CancellationException) {
        throw error
    } catch (_: Exception) {
        offline()
    }
}

/** Talks only to our coach backend. OpenAI credentials never enter the APK. */
class OnlineCoachClient(private val baseUrl: String = BuildConfig.COACH_URL) {
    suspend fun health() = request("/api/health")
    suspend fun create(scenarioId: String) = request("/api/sessions", JSONObject().put("scenarioId", scenarioId))
    suspend fun turn(sessionId: String, body: JSONObject) = request("/api/sessions/$sessionId/turn", body)

    private suspend fun request(path: String, body: JSONObject? = null): JSONObject = withContext(Dispatchers.IO) {
        val connection = URL(baseUrl.trimEnd('/') + path).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 2_000
            connection.readTimeout = if (path.endsWith("/turn")) 8_500 else 4_000
            connection.requestMethod = if (body == null) "GET" else "POST"
            if (body != null) {
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val value = JSONObject(stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: "{}")
            check(status in 200..299) { value.optString("error", "線上教練尚未完成請求，請重試。") }
            value
        } finally { connection.disconnect() }
    }
}

/** Decodes backend state; local UI/review rendering continues to use the shared spec. */
object OnlineCoachState {
    private fun reply(value: JSONObject): String {
        val sources = value.objects("citations").joinToString("\n") { "${it.getString("title")} · ${it.getString("url")}" }
        return value.getString("reply") + if (sources.isEmpty()) "" else "\n\n來源\n$sources"
    }

    fun fire(value: JSONObject): FireResult {
        val state = value.getJSONObject("state")
        val fire = FireState(
            version = state.getString("version"), node = state.getInt("node"),
            completed = state.strings("completed"), accepted = state.strings("accepted"),
            hints = state.objects("hints").map { FireHint(it.getString("node"), it.getInt("level")) },
            events = state.objects("events").map { FireEvent(it.getString("node"), it.getString("kind"), it.strings("labels")) },
            outcome = DrillOutcome.valueOf(state.getString("outcome")),
            elapsed = state.optInt("elapsed"), consecutiveQuestions = state.optInt("consecutiveQuestions"),
        )
        return FireResult(fire, value.getString("kind"), reply(value), delta = value.getJSONObject("result").optInt("progressDelta", 0))
    }
    fun v3(value: JSONObject): ScenarioResultV3 {
        val state = value.getJSONObject("state")
        val facts = state.getJSONObject("facts")
        val resources = state.getJSONObject("resources")
        val session = ScenarioStateV3(
            scenarioId = state.getString("scenarioId"), version = state.getString("version"), node = state.getString("node"),
            sessionStatus = state.getString("sessionStatus"), physicalStatus = state.getString("physicalStatus"),
            completionKind = if (state.isNull("completionKind")) null else state.getString("completionKind"),
            nodeTurn = state.getInt("nodeTurn"), accepted = state.strings("accepted"),
            elapsed = state.optInt("elapsed"), consecutiveQuestions = state.optInt("consecutiveQuestions"),
            resources = resources.keys().asSequence().associateWith { resources.getInt(it) },
            facts = facts.keys().asSequence().associateWith { facts.get(it).toString() },
            events = state.objects("events").map { event -> ScenarioEventV3(
                node = event.getString("node"), action = event.optString("action").takeIf { it.isNotBlank() && it != "null" },
                kind = event.getString("kind"), message = event.optString("message").takeIf { it.isNotBlank() && it != "null" },
            ) },
        )
        return ScenarioResultV3(session, value.getString("kind"), reply(value))
    }
}
