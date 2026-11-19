package com.pocketkb.android.core

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class FireDrillTest {
    private fun read(name: String) = javaClass.classLoader!!.getResourceAsStream(name)!!.bufferedReader(Charsets.UTF_8).use { it.readText() }
    private val engine = FireDrill(JSONObject(read("fire-dorm.json")))
    @Test fun sharedDialogueFixtures() {
        val cases = JSONArray(read("fire-cases.json"))
        for (i in 0 until cases.length()) {
            val case = cases.getJSONObject(i)
            var state = engine.create()
            for (turn in case.objects("turns")) {
                val result = engine.step(state, turn.getString("text"), turn.optString("intent", "action"))
                assertEquals(case.getString("name") + turn.getString("text"), turn.getString("kind"), result.kind)
                assertEquals(case.getString("name"), turn.getInt("node"), result.state.node)
                assertEquals(turn.optString("outcome", "CONTINUE"), result.state.outcome.name)
                state = result.state
            }
        }
    }
    @Test fun guidedPathAndReview() {
        var state = engine.create()
        engine.nodes.forEach { node -> node.strings("choices").filterNot { Regex("衝出去|浴室|跳窗").containsMatchIn(it) }.forEach {
            state = engine.step(state, it).state
        } }
        assertEquals(DrillOutcome.SUCCESS, state.outcome)
        assertEquals(3, state.completed.size)
        assertTrue(engine.review(state).contains("必要決策皆已完成"))
        assertEquals(0, engine.create().completed.size)
    }
}
