package com.pocketkb.android.data

import org.json.JSONArray
import org.json.JSONObject

internal object ResearchPrivacy {
    private val key = Regex("sk-[A-Za-z0-9_-]{16,}", RegexOption.IGNORE_CASE)
    private val ipv4 = Regex("\\b\\d{1,3}(?:\\.\\d{1,3}){3}\\b")
    private val ipv6 = Regex("[0-9a-f:.]*:[0-9a-f:.]+(?:%[a-z0-9_.-]+)?", RegexOption.IGNORE_CASE)

    fun scrub(text: String): String = ipv6.replace(ipv4.replace(key.replace(text, "[redacted]"), "[redacted]")) {
        val address = it.value.removeSuffix(".")
        if (address.count { char -> char == ':' } >= 2 && (address.contains("::") || address.count { char -> char == ':' } >= 7))
            "[redacted]" + it.value.removePrefix(address)
        else it.value
    }

    fun protect(record: JSONObject, keepText: Boolean): JSONObject {
        if (!keepText) {
            listOf("input_text", "reply_text", "suggestion_texts", "npc_lines", "model_actions").forEach(record::remove)
            listOf("controlInput", "npcInput").filter(record::has).forEach { record.put(it, "[redacted]") }
            record.optJSONObject("emotion")?.put("evidence", "[redacted]")
            record.optJSONArray("actionValidation")?.let { items ->
                for (i in 0 until items.length()) items.optJSONObject(i)?.put("evidence", "[redacted]")
            }
        }
        cleanObject(record)
        return record
    }

    private fun cleanObject(value: JSONObject) {
        value.keys().forEach { name -> value.put(name, cleaned(value.get(name))) }
    }

    private fun cleaned(value: Any): Any = when (value) {
        is String -> scrub(value)
        is JSONObject -> value.also(::cleanObject)
        is JSONArray -> value.also { items ->
            for (i in 0 until items.length()) items.put(i, cleaned(items.get(i)))
        }
        else -> value
    }
}
