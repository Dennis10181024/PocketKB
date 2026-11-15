package com.pocketkb.android.core

import com.pocketkb.android.ai.OnlineCoachState
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class OnlineCoachStateTest {
    @Test fun fireResponsePreservesWaitingAndFailureInsteadOfInventingRescue() {
        for (outcome in listOf("SUCCESS", "FAILED")) {
            val value = JSONObject("""{"kind":"test","reply":"測試回覆","result":{"progressDelta":1},"state":{"version":"2.0.0","node":2,"completed":["a","b"],"accepted":[],"hints":[],"events":[],"outcome":"$outcome"}}""")
            val result = OnlineCoachState.fire(value)
            assertEquals(DrillOutcome.valueOf(outcome), result.state.outcome)
            assertEquals("測試回覆", result.message)
            assertEquals(1, result.delta)
        }
    }
    @Test fun v3ResponsePreservesServerFactsResourcesAndTerminalState() {
        val value = JSONObject("""{"kind":"completed","reply":"測試回覆","state":{"scenarioId":"test","version":"3.0.0","node":"shelter","sessionStatus":"COMPLETED","physicalStatus":"WAITING_RESCUE","completionKind":"STABLE_WAITING","nodeTurn":1,"accepted":["conserve"],"resources":{"battery":20,"water":1},"facts":{"routeOpen":false},"events":[{"node":"warning","kind":"environment_change","message":"道路中斷"},{"node":"shelter","kind":"action","action":"conserve"}]}}""")
        val result = OnlineCoachState.v3(value)
        assertEquals("WAITING_RESCUE", result.state.physicalStatus)
        assertEquals("COMPLETED", result.state.sessionStatus)
        assertEquals("false", result.state.facts["routeOpen"])
        assertEquals(20, result.state.resources["battery"])
        assertNull(result.state.events.first().action)
        assertEquals("道路中斷", result.state.events.first().message)
        assertEquals("conserve", result.state.events.last().action)
    }
}
