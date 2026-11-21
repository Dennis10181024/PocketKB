package com.pocketkb.android.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Update
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.pocketkb.android.core.ChatMessage
import com.pocketkb.android.core.ChatRole
import com.pocketkb.android.core.DrillAnalytics
import com.pocketkb.android.core.DrillOutcome
import com.pocketkb.android.core.SafetyLevel
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "drill_sessions")
data class DrillSessionEntity(
    @PrimaryKey val id: String,
    val scenarioId: String,
    val scenarioTitle: String,
    val category: String,
    val startedAtMs: Long,
    val endedAtMs: Long? = null,
    val outcome: String = DrillOutcome.CONTINUE.name,
    val finalSafety: String = SafetyLevel.MEDIUM.name,
    val finalStep: Int = 1,
    val totalSteps: Int = 6,
    val userTurns: Int = 0,
    val userWordCount: Int = 0,
    val timeoutCount: Int = 0,
    val fatalErrorCount: Int = 0,
)

@Entity(
    tableName = "drill_messages",
    foreignKeys = [
        ForeignKey(
            entity = DrillSessionEntity::class,
            parentColumns = ["id"],
            childColumns = ["sessionId"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [Index("sessionId")],
)
data class DrillMessageEntity(
    @PrimaryKey val id: String,
    val sessionId: String,
    val role: String,
    val content: String,
    val timestampMs: Long,
    val safety: String?,
    val progressDelta: Int?,
    val outcome: String?,
    val judgeReason: String?,
)

@Entity(tableName = "drill_turns", primaryKeys = ["sessionId", "ordinal"])
data class DrillTurnEntity(val sessionId: String, val ordinal: Int, val json: String)

@Dao
interface DrillHistoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTurn(turn: DrillTurnEntity)

    @Query("SELECT json FROM drill_turns WHERE sessionId = :id ORDER BY ordinal")
    suspend fun researchTurns(id: String): List<String>
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: DrillSessionEntity)

    @Update
    suspend fun updateSession(session: DrillSessionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: DrillMessageEntity)

    @Query("SELECT * FROM drill_sessions ORDER BY startedAtMs DESC LIMIT :limit")
    fun recentSessions(limit: Int = 20): Flow<List<DrillSessionEntity>>

    @Query("SELECT * FROM drill_messages WHERE sessionId = :sessionId ORDER BY timestampMs ASC")
    suspend fun messagesForSession(sessionId: String): List<DrillMessageEntity>

    @Query("SELECT * FROM drill_sessions WHERE id = :sessionId LIMIT 1")
    suspend fun sessionById(sessionId: String): DrillSessionEntity?
}

@Database(
    entities = [DrillSessionEntity::class, DrillMessageEntity::class, DrillTurnEntity::class],
    version = 2,
    exportSchema = false,
)
abstract class PocketKbDatabase : RoomDatabase() {
    abstract fun drillHistoryDao(): DrillHistoryDao

    companion object {
        @Volatile private var instance: PocketKbDatabase? = null

        fun get(context: Context): PocketKbDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    PocketKbDatabase::class.java,
                    "pocketkb_android.db",
                ).addMigrations(object : Migration(1, 2) {
                    override fun migrate(db: SupportSQLiteDatabase) {
                        db.execSQL("CREATE TABLE IF NOT EXISTS drill_turns (sessionId TEXT NOT NULL, ordinal INTEGER NOT NULL, json TEXT NOT NULL, PRIMARY KEY(sessionId, ordinal))")
                    }
                }).build().also { instance = it }
            }
        }
    }
}

class DrillHistoryRepository(
    private val dao: DrillHistoryDao,
) {
    fun recentSessions(): Flow<List<DrillSessionEntity>> = dao.recentSessions()
    suspend fun messagesForSession(id: String): List<DrillMessageEntity> = dao.messagesForSession(id)
    suspend fun appendResearchTurn(id: String, ordinal: Int, json: String) = dao.insertTurn(DrillTurnEntity(id, ordinal, json))
    suspend fun exportResearch(id: String): String = dao.researchTurns(id).joinToString("\n", postfix = "\n")

    suspend fun startSession(
        id: String,
        scenarioId: String,
        scenarioTitle: String,
        category: String,
        totalSteps: Int,
    ) {
        dao.insertSession(
            DrillSessionEntity(
                id = id,
                scenarioId = scenarioId,
                scenarioTitle = scenarioTitle,
                category = category,
                startedAtMs = System.currentTimeMillis(),
                totalSteps = totalSteps,
            ),
        )
    }

    suspend fun appendMessage(sessionId: String, message: ChatMessage) {
        dao.insertMessage(
            DrillMessageEntity(
                id = message.id,
                sessionId = sessionId,
                role = message.role.name,
                content = ResearchPrivacy.scrub(message.content),
                timestampMs = message.timestampMs,
                safety = message.judgeMetadata?.safety?.name,
                progressDelta = message.judgeMetadata?.progressDelta,
                outcome = message.judgeMetadata?.outcome?.name,
                judgeReason = message.judgeMetadata?.reason?.let(ResearchPrivacy::scrub),
            ),
        )
    }

    suspend fun finishSession(
        sessionId: String,
        finalStep: Int,
        totalSteps: Int,
        finalSafety: SafetyLevel,
        outcome: DrillOutcome,
        messages: List<ChatMessage>,
    ) {
        val existing = dao.sessionById(sessionId) ?: return
        val analytics = calculateAnalytics(messages, finalStep, totalSteps, finalSafety, outcome)
        dao.updateSession(
            existing.copy(
                endedAtMs = System.currentTimeMillis(),
                outcome = analytics.outcome.name,
                finalSafety = analytics.finalSafety.name,
                finalStep = finalStep,
                totalSteps = totalSteps,
                userTurns = analytics.turns,
                userWordCount = analytics.userWordCount,
                timeoutCount = analytics.timeoutCount,
                fatalErrorCount = analytics.fatalErrorCount,
            ),
        )
    }

    fun calculateAnalytics(
        messages: List<ChatMessage>,
        finalStep: Int,
        totalSteps: Int,
        finalSafety: SafetyLevel,
        outcome: DrillOutcome,
    ): DrillAnalytics {
        val userMessages = messages.filter { it.role == ChatRole.USER }
        val timeouts = messages.count { it.judgeMetadata?.outcome == DrillOutcome.TIMEOUT }
        val fatal = messages.count { it.judgeMetadata?.outcome == DrillOutcome.FAILED }
        val userWordCount = userMessages.sumOf { countWords(it.content) }
        return DrillAnalytics(
            turns = userMessages.size,
            userWordCount = userWordCount,
            timeoutCount = timeouts,
            fatalErrorCount = fatal,
            completionRate = finalStep.toDouble() / totalSteps.coerceAtLeast(1).toDouble(),
            finalSafety = finalSafety,
            outcome = outcome,
        )
    }

    private fun countWords(text: String): Int {
        val cjkCount = text.count { it.code in 0x4E00..0x9FFF }
        val latinWords = Regex("""[A-Za-z0-9]+""").findAll(text).count()
        return cjkCount + latinWords
    }
}
