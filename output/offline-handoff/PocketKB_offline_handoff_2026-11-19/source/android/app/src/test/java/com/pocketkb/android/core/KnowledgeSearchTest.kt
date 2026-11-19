package com.pocketkb.android.core

import org.junit.Assert.*
import org.junit.Test

class KnowledgeSearchTest {
    private val rag = RagEngine()
    @Test fun blankQueryReturnsNoResults() {
        assertTrue(rag.retrieve("   ").isEmpty())
    }
    @Test fun smokeQuestionFindsFireEscapeWithSource() {
        val hits = rag.retrieve("門外有濃煙怎麼辦", 5)
        assertTrue(hits.any { it.chunk.id == "fi_002" })
        assertTrue(hits.all { it.chunk.source.url.startsWith("https://") || it.chunk.source.url.startsWith("http://") })
    }
    @Test fun unknownLatinQueryDoesNotInventAnswer() {
        assertTrue(rag.retrieve("zzzzunknownquery").isEmpty())
    }
}
