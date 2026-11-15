package com.pocketkb.android.ui

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.pocketkb.android.ai.OnlineCoachClient
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

/** Local demo server must run on 5175; adb reverse tcp:5175 tcp:5175. No paid calls. */
@RunWith(AndroidJUnit4::class)
class OnlineCoachConnectionTest {
    @Test fun emulatorConnectsToBackendAndCanObserveWithoutCallingGpt() = runBlocking {
        val client = OnlineCoachClient()
        val health = client.health()
        assertTrue(health.has("ready"))
        assertFalse(health.toString().contains("OPENAI_API_KEY"))
        val session = client.create("drill_fire_dorm")
        val request = JSONObject().put("requestId", UUID.randomUUID().toString())
            .put("revision", 0).put("text", "").put("intent", "observe")
        val result = client.turn(session.getString("sessionId"), request)
        assertEquals("observe", result.getString("kind"))
        assertEquals(0, result.getJSONObject("state").getInt("node"))
        assertEquals(1, result.getInt("revision"))
        assertFalse(result.getBoolean("terminal"))
    }
}
