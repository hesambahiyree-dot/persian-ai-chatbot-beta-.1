package ai.nova.app

import org.json.JSONArray

/**
 * Gemma 3 chat template. Keep in sync with src/lib/inference/gemma-template.ts
 * Roles are user/model. System text is folded into the first user turn.
 */
object GemmaTemplate {
    const val SYSTEM_PROMPT =
        "تو نوا (NOVA) هستی؛ دستیار هوشمند فارسی. پاسخ را به فارسی روان، دقیق و مفید بنویس. لحن گرم و حرفه‌ای است. از زیاده‌گویی و ادعاهای ساختگی پرهیز کن. اگر چیزی را نمی‌دانی صریح بگو."

    fun apply(messagesJson: String, addGenerationPrompt: Boolean = true): String {
        val arr = try {
            JSONArray(messagesJson)
        } catch (_: Exception) {
            JSONArray()
        }
        val turns = mutableListOf<Pair<String, String>>()
        var pendingSystem = SYSTEM_PROMPT.trim()

        for (i in 0 until arr.length()) {
            val obj = arr.optJSONObject(i) ?: continue
            val roleIn = obj.optString("role")
            val content = obj.optString("content").trim()
            if (content.isEmpty() && roleIn != "system") continue
            if (roleIn == "system") {
                pendingSystem = listOf(pendingSystem, content).filter { it.isNotEmpty() }.joinToString("\n\n")
                continue
            }
            val role = if (roleIn == "assistant" || roleIn == "model") "model" else "user"
            var body = content
            if (role == "user" && pendingSystem.isNotEmpty()) {
                body = "$pendingSystem\n\n$body"
                pendingSystem = ""
            }
            val last = turns.lastOrNull()
            if (last != null && last.first == role) {
                turns[turns.lastIndex] = role to (last.second + "\n" + body)
            } else {
                turns += role to body
            }
        }

        if (pendingSystem.isNotEmpty()) {
            if (turns.isEmpty()) {
                turns += "user" to pendingSystem
            } else if (turns.first().first == "user") {
                turns[0] = "user" to pendingSystem + "\n\n" + turns.first().second
            }
        }

        val out = StringBuilder()
        for ((role, body) in turns) {
            out.append("<start_of_turn>").append(role).append('\n')
            out.append(body).append("<end_of_turn>\n")
        }
        if (addGenerationPrompt) {
            out.append("<start_of_turn>model\n")
        }
        return out.toString()
    }
}
