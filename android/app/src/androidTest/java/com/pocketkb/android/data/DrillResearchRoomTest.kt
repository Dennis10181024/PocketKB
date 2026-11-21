package com.pocketkb.android.data

import androidx.room.Room
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test

class DrillResearchRoomTest {
    @Test fun exportsOnlyRequestedSessionInTurnOrder() = runBlocking<Unit> {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val database = Room.inMemoryDatabaseBuilder(context, PocketKbDatabase::class.java).build()
        try {
            val history = DrillHistoryRepository(database.drillHistoryDao())
            history.appendResearchTurn("test-session", 2, """{"turn":2,"fallbackReason":null}""")
            history.appendResearchTurn("other-session", 1, """{"turn":1,"fallbackReason":"NOT_CONFIGURED"}""")
            history.appendResearchTurn("test-session", 1, """{"turn":1,"fallbackReason":"TURN_TIMEOUT"}""")
            val turns = history.exportResearch("test-session").lineSequence().filter { it.isNotBlank() }
                .map(::JSONObject).toList()
            assertEquals(listOf(1, 2), turns.map { it.getInt("turn") })
            assertEquals("TURN_TIMEOUT", turns.first().getString("fallbackReason"))
        } finally {
            database.close()
        }
    }
}
