package com.pocketkb.android.ai

import com.pocketkb.android.BuildConfig
import com.pocketkb.android.core.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.json.JSONTokener
import java.io.EOFException
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

private class CoachHttpFailure(val status: Int, message: String) : IOException(message)

internal suspend fun coachTurnOrFallback(remote: suspend () -> Unit, offline: (String) -> Unit) {
    try {
        remote()
    } catch (error: CancellationException) {
        throw error
    } catch (error: Exception) {
        offline(when (error) {
            is CoachHttpFailure -> if (error.status >= 500) "CLIENT_API_ERROR" else "CLIENT_SYNC"
            is IOException -> "CLIENT_TRANSPORT"
            else -> "CLIENT_SYNC"
        })
    }
}

/** Talks only to our coach backend. OpenAI credentials never enter the APK. */
class OnlineCoachClient(private val baseUrl: String = BuildConfig.COACH_URL) {
    suspend fun health() = request("/api/health")
    suspend fun create(scenarioId: String) = request("/api/sessions", JSONObject().put("scenarioId", scenarioId))
    suspend fun turn(sessionId: String, body: JSONObject, onPart: (String) -> Unit = {}) =
        request("/api/sessions/$sessionId/turn/stream", body, onPart)

    private suspend fun request(path: String, body: JSONObject? = null, onPart: ((String) -> Unit)? = null): JSONObject = withContext(Dispatchers.IO) {
        val connection = URL(baseUrl.trimEnd('/') + path).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 2_000
            connection.readTimeout = if (onPart != null) 26_000 else 4_000
            connection.requestMethod = if (body == null) "GET" else "POST"
            if (body != null) {
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            }
            val status = connection.responseCode
            if (status in 200..299 && onPart != null) {
                check(connection.contentType?.startsWith("text/event-stream") == true)
                var type = ""
                connection.inputStream.bufferedReader(Charsets.UTF_8).use { reader ->
                    while (true) {
                        val line = reader.readLine() ?: break
                        when {
                            line.startsWith("event: ") -> type = line.substring(7)
                            line.startsWith("data: ") && type == "narration" -> onPart(JSONTokener(line.substring(6)).nextValue() as String)
                            line.startsWith("data: ") && type == "settled" -> return@withContext JSONObject(line.substring(6))
                        }
                    }
                }
                throw EOFException("連線在確認回合前中斷。")
            }
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val value = JSONObject(stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: "{}")
            if (status !in 200..299) throw CoachHttpFailure(status, value.optString("error", "線上教練尚未完成請求，請重試。"))
            value
        } finally { connection.disconnect() }
    }
}

data class OnlineScenarioSource(val agency: String, val title: String, val url: String)
data class OnlineScenarioLesson(val title: String, val why: String, val next: String, val sources: List<OnlineScenarioSource>)
data class OnlineScenarioPresentation(
    val task: String,
    val situation: String,
    val endingText: String,
    val keyDecisions: List<String>,
    val lessons: List<OnlineScenarioLesson>,
)

/** Decodes verified state and the presentation of a quality-assessed turn. */
object OnlineCoachState {
    fun qualityPresentation(value: JSONObject): OnlineScenarioPresentation? {
        if (value.optJSONObject("state")?.optJSONObject("quality") == null) return null
        val node = value.optJSONObject("scene")?.optJSONObject("node") ?: return null
        val ending = value.optJSONObject("ending")
        return OnlineScenarioPresentation(
            task = node.optString("task"),
            situation = node.optString("situation"),
            endingText = ending?.optString("text").orEmpty(),
            keyDecisions = ending?.strings("decisions").orEmpty(),
            lessons = ending?.objects("lessons").orEmpty().map { lesson ->
                OnlineScenarioLesson(
                    lesson.optString("title", "這個行動為什麼危險"),
                    lesson.optString("why"),
                    lesson.optString("next"),
                    lesson.objects("sources").map { source ->
                        OnlineScenarioSource(source.optString("agency"), source.optString("title"), source.optString("url"))
                    },
                )
            },
        )
    }

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
            variantId = state.optString("variantId", "base"),
            exposure = state.optJSONObject("exposure")?.let { data -> data.keys().asSequence().associateWith { data.getInt(it) } }.orEmpty(),
            injuryCauses = state.objects("injuryCauses").map {
                ExposureCauseV3(it.getString("node"), it.getString("action"), it.getString("eventId"), it.getString("exposure"), it.getInt("delta"), it.getInt("turn"))
            },
            endingType = state.optString("endingType").takeUnless { it.isBlank() || it == "null" },
            injuryLevel = state.optString("injuryLevel").takeUnless { it.isBlank() || it == "null" },
            injuryWorsened = if (state.isNull("injuryWorsened")) null else state.getBoolean("injuryWorsened"),
            npc = state.optJSONObject("npc")?.let {
                ScenarioNpcV3(it.getString("position"), it.optString("proposal").takeUnless { value -> value == "null" },
                    it.getBoolean("handled"), it.optString("emotion").takeUnless { value -> value == "null" })
            },
            hints = state.objects("hints").map { FireHint(it.getString("node"), it.getInt("level")) },
            firstAidEnabled = state.optBoolean("onlineExperience"),
            facts = facts.keys().asSequence().associateWith { facts.get(it).toString() },
            events = state.objects("events").map { event -> ScenarioEventV3(
                node = event.getString("node"), action = event.optString("action").takeIf { it.isNotBlank() && it != "null" },
                eventId = event.optString("eventId").takeUnless { it.isBlank() || it == "null" },
                kind = event.getString("kind"), message = event.optString("message").takeIf { it.isNotBlank() && it != "null" },
            ) },
        )
        return ScenarioResultV3(session, value.getString("kind"), reply(value))
    }
}
