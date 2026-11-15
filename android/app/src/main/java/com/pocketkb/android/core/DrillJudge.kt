package com.pocketkb.android.core

class DrillJudge {
    fun evaluateUserAction(
        scenario: DrillScenario,
        userText: String,
        stepState: DrillStepState,
    ): DrillJudgeResult {
        val normalized = normalize(userText)
        val activeStep = scenario.steps.getOrNull(stepState.currentStep - 1)
        val rules = activeStep?.let { step ->
            ScenarioDecisionRules(
                successKeywords = step.successKeywords,
                riskyKeywords = step.riskyKeywords,
                fatalKeywords = step.fatalKeywords,
                requiredConcepts = step.requiredConcepts,
                successSummary = step.successFeedback,
            )
        } ?: scenario.decisionRules

        val fatalMatches = rules.fatalKeywords.filter {
            normalized.containsRuleTerm(it, allowNegated = false)
        }
        if (fatalMatches.isNotEmpty()) {
            return DrillJudgeResult(
                safety = SafetyLevel.FAILED,
                progressDelta = 0,
                outcome = DrillOutcome.FAILED,
                reason = fatalReason(scenario.category, fatalMatches),
                shouldAskAgain = false,
                matchedRules = fatalMatches,
            )
        }

        val riskyMatches = rules.riskyKeywords.filter {
            normalized.containsRuleTerm(it, allowNegated = false)
        }
        val successMatches = rules.successKeywords.filter {
            normalized.containsRuleTerm(it, allowNegated = true)
        }
        val isVague = normalized.length < 4 || vagueTerms.any { normalized.contains(it) }
        val stepPrefix = activeStep?.let { "任務「${it.title}」：" }.orEmpty()
        val isOffTask = isOffTaskInput(normalized, scenario, activeStep, rules)

        if (isOffTask) {
            val task = activeStep?.title ?: scenario.title
            val hint = activeStep?.missingHint ?: "請回到目前災害情境，說出一個可執行的安全行動。"
            return DrillJudgeResult(
                safety = SafetyLevel.LOW,
                progressDelta = 0,
                outcome = DrillOutcome.CONTINUE,
                reason = "${stepPrefix}這句話和目前任務「$task」沒有明確關聯，情境不會推進。$hint",
                shouldAskAgain = true,
            )
        }

        if (riskyMatches.isNotEmpty() && successMatches.isEmpty()) {
            val hint = activeStep?.missingHint ?: "請改成具體、可執行的避難動作。"
            return DrillJudgeResult(
                safety = SafetyLevel.LOW,
                progressDelta = 0,
                outcome = DrillOutcome.CONTINUE,
                reason = "${stepPrefix}這個決定很危險：${riskyMatches.joinToString("、")}。$hint",
                shouldAskAgain = true,
                matchedRules = riskyMatches,
            )
        }

        if (successMatches.isEmpty() || isVague) {
            val hint = activeStep?.missingHint ?: "請說出關鍵動作，例如避開什麼、確認什麼、如何撤離或求救。"
            return DrillJudgeResult(
                safety = SafetyLevel.LOW,
                progressDelta = 0,
                outcome = DrillOutcome.CONTINUE,
                reason = "${stepPrefix}你的回答還不夠明確。$hint",
                shouldAskAgain = true,
            )
        }

        val coverage = successMatches.size.toDouble() / rules.requiredConcepts.size.coerceAtLeast(1).toDouble()
        val canAdvance = coverage >= 0.34 || successMatches.size >= 2
        val nextStep = (stepState.currentStep + if (canAdvance) 1 else 0).coerceAtMost(stepState.totalSteps)
        val isSuccess = stepState.currentStep >= stepState.totalSteps && canAdvance

        return DrillJudgeResult(
            safety = when {
                coverage >= 0.67 || successMatches.size >= 3 -> SafetyLevel.HIGH
                canAdvance -> SafetyLevel.MEDIUM
                else -> SafetyLevel.LOW
            },
            progressDelta = if (canAdvance) 1 else 0,
            outcome = if (isSuccess) DrillOutcome.SUCCESS else DrillOutcome.CONTINUE,
            reason = if (isSuccess) {
                rules.successSummary
            } else if (canAdvance) {
                val nextTitle = scenario.steps.getOrNull(nextStep - 1)?.title
                buildString {
                    append(stepPrefix)
                    append("動作有效：${successMatches.joinToString("、")}。")
                    append(activeStep?.successFeedback ?: "你暫時降低風險。")
                    if (nextTitle != null) append(" 下一個任務：$nextTitle。")
                }
            } else {
                val hint = activeStep?.missingHint ?: "請補上更完整的安全行動。"
                "${stepPrefix}你提到部分正確方向，但還缺少關鍵步驟。$hint"
            },
            shouldAskAgain = !canAdvance,
            matchedRules = successMatches,
        )
    }

    fun evaluateTimeout(scenario: DrillScenario, stepState: DrillStepState): DrillJudgeResult {
        val fatal = stepState.currentStep <= 2 || stepState.safetyLevel == SafetyLevel.LOW
        return DrillJudgeResult(
            safety = if (fatal) SafetyLevel.FAILED else SafetyLevel.LOW,
            progressDelta = 0,
            outcome = if (fatal) DrillOutcome.FAILED else DrillOutcome.TIMEOUT,
            reason = if (fatal) {
                timeoutFatalMessage(scenario.category)
            } else {
                "你停頓太久，危險已經升高。這一回合不推進，請立刻重新決定。"
            },
            shouldAskAgain = !fatal,
            matchedRules = listOf("timeout"),
        )
    }

    fun parseHiddenTag(modelText: String): Pair<DrillJudgeResult?, String> {
        val regex = Regex(
            pattern = """^\s*\[安全評分:\s*(Low|Medium|High|Failed)\]\[進度:\s*([+-]?\d+)\]\[結果:\s*(CONTINUE|SUCCESS|FAILED|TIMEOUT)\]\s*""",
            option = RegexOption.IGNORE_CASE,
        )
        val match = regex.find(modelText) ?: return null to modelText
        val safety = when (match.groupValues[1].lowercase()) {
            "high" -> SafetyLevel.HIGH
            "medium" -> SafetyLevel.MEDIUM
            "failed" -> SafetyLevel.FAILED
            else -> SafetyLevel.LOW
        }
        val delta = match.groupValues[2].toIntOrNull() ?: 0
        val outcome = runCatching { DrillOutcome.valueOf(match.groupValues[3].uppercase()) }
            .getOrDefault(DrillOutcome.CONTINUE)
        val cleaned = modelText.removeRange(match.range).trim()
        val result = DrillJudgeResult(
            safety = safety,
            progressDelta = delta.coerceIn(0, 1),
            outcome = outcome,
            reason = cleaned.ifBlank { "模型已完成裁判，但沒有提供說明。" },
            shouldAskAgain = delta <= 0 && outcome == DrillOutcome.CONTINUE,
        )
        return result to cleaned
    }

    fun enforceLocalGuardrails(
        scenario: DrillScenario,
        userText: String,
        stepState: DrillStepState,
        modelResult: DrillJudgeResult,
    ): DrillJudgeResult {
        val local = evaluateUserAction(scenario, userText, stepState)
        return when {
            local.outcome == DrillOutcome.FAILED -> local
            local.progressDelta == 0 && modelResult.progressDelta > 0 -> local
            modelResult.outcome == DrillOutcome.SUCCESS && stepState.currentStep < stepState.totalSteps - 1 -> {
                modelResult.copy(outcome = DrillOutcome.CONTINUE, progressDelta = 1)
            }
            else -> modelResult
        }
    }

    fun composeAssistantReply(
        scenario: DrillScenario,
        result: DrillJudgeResult,
        retrievalResults: List<RetrievalResult>,
        modelText: String? = null,
        stepState: DrillStepState? = null,
    ): String {
        val activeStep = stepState?.let { scenario.steps.getOrNull(it.currentStep - 1) }
        val evidence = retrievalResults.firstOrNull { it.chunk.category == scenario.category }?.chunk
        val verdict = modelText?.ifBlank { null } ?: result.reason
        val verdictLabel = when (result.safety) {
            SafetyLevel.HIGH -> "安全"
            SafetyLevel.MEDIUM -> "可接受，但還要補強"
            SafetyLevel.LOW -> "有風險"
            SafetyLevel.FAILED -> "致命錯誤"
        }
        val nextAction = when (result.outcome) {
            DrillOutcome.FAILED -> "停止目前做法，回到情境重新練習，優先避開上面的致命錯誤。"
            DrillOutcome.SUCCESS -> "演練完成。請回顧這次的關鍵安全動作，確認災時能照順序執行。"
            DrillOutcome.EVACUATED -> "你已到達劇本指定的相對安全地點；仍應依官方指示等待解除。"
            DrillOutcome.WAITING_RESCUE -> "你尚未脫離災區，但已採取待救與保存資源措施；不要把演練完成誤認為已獲救。"
            DrillOutcome.SHELTERED -> "你已完成目前可行的就地掩蔽，仍需持續接收官方資訊。"
            DrillOutcome.RESCUED -> "只有劇本明示救援人員已接觸時才可使用此結果。"
            DrillOutcome.TIMEOUT -> "立刻補上一個具體行動，不要停留在原地等待。"
            DrillOutcome.CONTINUE -> if (result.shouldAskAgain) {
                "請改用一句具體行動回答：你要避開什麼、確認什麼、往哪裡移動或如何求救。"
            } else {
                "繼續判斷下一個威脅，並說出你的下一步具體行動。"
            }
        }
        val standardDirection = activeStep?.standardAction ?: scenario.decisionRules.requiredConcepts
            .take(4)
            .joinToString("、")
            .ifBlank { scenario.decisionRules.successSummary }
        val taskLine = activeStep?.let { "任務：${it.title}\n情境：${it.situation}" }
        val source = evidence?.let {
            "依據：${it.source.agency}《${it.source.title}》 - ${it.title}"
        } ?: "依據：本情境內建安全規則"

        return listOfNotNull(
            taskLine,
            "判定：$verdictLabel",
            "原因：$verdict",
            source,
            "下一步：$nextAction",
            "標準動作：$standardDirection",
        ).joinToString("\n")
    }

    private fun isOffTaskInput(
        normalized: String,
        scenario: DrillScenario,
        activeStep: ScenarioStep?,
        rules: ScenarioDecisionRules,
    ): Boolean {
        if (normalized.length < 4) return false
        val knownTerms = buildList {
            addAll(rules.successKeywords)
            addAll(rules.riskyKeywords)
            addAll(rules.fatalKeywords)
            addAll(rules.requiredConcepts)
            add(scenario.title)
            add(scenario.location)
            add(scenario.category.label)
            activeStep?.let { step ->
                add(step.title)
                add(step.situation)
                add(step.standardAction)
            }
            addAll(disasterTerms)
        }.map { normalize(it) }.filter { it.length >= 2 }
        return knownTerms.none { normalized.contains(it) }
    }

    private fun String.containsRuleTerm(term: String, allowNegated: Boolean): Boolean {
        val normalizedTerm = normalize(term)
        if (normalizedTerm.isBlank() || !contains(normalizedTerm)) return false
        if (allowNegated) return true
        return !isNegatedRuleTerm(normalizedTerm)
    }

    private fun String.isNegatedRuleTerm(normalizedTerm: String): Boolean {
        val negationPrefixes = listOf("不", "不要", "別", "避免", "避開", "遠離", "禁止", "不可", "不能", "不會")
        return negationPrefixes.any { prefix -> contains(prefix + normalizedTerm) }
    }

    private fun fatalReason(category: DisasterCategory, matches: List<String>): String {
        val trigger = matches.joinToString("、")
        val message = when (category) {
            DisasterCategory.FIRE -> "火災中這可能讓你吸入濃煙、被困在電梯或造成爆燃。"
            DisasterCategory.EARTHQUAKE -> "地震中這會讓你暴露在掉落物、玻璃或樓梯推擠風險下。"
            DisasterCategory.TYPHOON -> "豪雨積水流速和深度不可預測，地下道與邊坡都可能瞬間變致命。"
            DisasterCategory.FLOOD -> "淹水時地下空間、快速水流與電氣設備都可能造成致命風險。"
            DisasterCategory.LANDSLIDE -> "土石流與崩塌可能瞬間阻斷道路，進入警戒區會失去撤離窗口。"
            DisasterCategory.BARRIER_LAKE -> "堰塞湖上下游風險依個案警戒而異，延誤或進入管制區可能造成致命暴露。"
            DisasterCategory.MANMADE -> "人潮或可疑物情境中，錯誤移動會增加窒息、踩踏或爆炸風險。"
            DisasterCategory.COMPOUND -> "複合災害需要先避免二次災害，錯誤動作可能引發火花、觸電或受困。"
            DisasterCategory.PREPAREDNESS -> "整備與資訊判斷錯誤，會讓災時失去判斷依據、物資與互助支援。"
            DisasterCategory.FIRST_AID -> "急救前沒有確認安全或做錯處置，可能讓傷者和施救者都更危險。"
        }
        return "致命錯誤：$trigger。$message"
    }

    private fun timeoutFatalMessage(category: DisasterCategory): String {
        return when (category) {
            DisasterCategory.FIRE -> "你因為停頓錯失逃生時機，濃煙已經壓低到呼吸高度。演練失敗。"
            DisasterCategory.EARTHQUAKE -> "你沒有立刻避開掉落物，第一波強震已造成受傷風險。演練失敗。"
            DisasterCategory.TYPHOON -> "你在積水或警戒區停留太久，水位和落石風險已失控。演練失敗。"
            DisasterCategory.FLOOD -> "你在淹水地下空間或快速水流旁停留太久，安全移動條件已消失。演練失敗。"
            DisasterCategory.LANDSLIDE -> "你沒有及時離開土石流或崩塌警戒區，原有路線已中斷。演練失敗。"
            DisasterCategory.BARRIER_LAKE -> "你未依個案撤離命令行動，原有撤離窗口已關閉。演練失敗。"
            DisasterCategory.MANMADE -> "你在人潮或可疑物旁停留太久，已失去安全距離和撤離窗口。演練失敗。"
            DisasterCategory.COMPOUND -> "你沒有及時處理二次災害風險，瓦斯、觸電或火勢已升高。演練失敗。"
            DisasterCategory.PREPAREDNESS -> "你沒有及時確認官方資訊或啟動整備流程，已錯過安全決策窗口。演練失敗。"
            DisasterCategory.FIRST_AID -> "你延誤急救與求援，傷者狀況惡化。演練失敗。"
        }
    }

    private fun normalize(text: String): String {
        return text.lowercase()
            .replace(Regex("""\s+"""), "")
            .replace("，", "")
            .replace("。", "")
            .replace(",", "")
            .replace(".", "")
    }

    private val vagueTerms = setOf("不知道", "隨便", "等一下", "發呆", "睡覺", "看情況", "逃跑")

    private val disasterTerms = setOf(
        "地震", "火災", "濃煙", "煙", "瓦斯", "逃生", "避難", "撤離", "求救", "119", "110",
        "門把", "門", "窗", "低姿勢", "阻煙", "電梯", "樓梯", "水", "積水", "豪雨", "颱風",
        "地下道", "高處", "通報", "人潮", "胸前", "呼吸", "CPR", "AED", "防災", "安全",
    )
}








