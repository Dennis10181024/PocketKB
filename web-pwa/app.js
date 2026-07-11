const categories = {
  FIRE: "火災",
  TYPHOON: "豪雨颱風"
};

const knowledgeChunks = [
  {
    id: "fi_002",
    title: "濃煙逃生",
    category: "FIRE",
    source: "臺北市政府消防局《火災發生時之逃生狀況及方法》",
    content:
      "火災時以保命為第一目標，不收拾財物、不搭電梯、不躲浴室，也不要浪費時間找濕毛巾。若逃生路線無濃煙，立刻往下往外逃；若門把燙手或開門看見濃煙，立即關門阻煙、塞門縫，往反方向找第二出口，無法逃生時靠窗打 119 等待救援。",
    tags: ["濃煙", "摸門把", "關門阻煙", "不搭電梯", "119"]
  },
  {
    id: "ty_002",
    title: "豪雨積淹水避險",
    category: "TYPHOON",
    source: "交通部中央氣象署《豪(大)雨特報》",
    content:
      "強降雨可能造成積淹水、溪水暴漲、山崩落石與土石流；不要進入地下道、溪床、河堤、邊坡或水深不明道路。",
    tags: ["地下道", "涉水", "邊坡", "淹水"]
  },
  {
    id: "ty_003",
    title: "土石流與撤離",
    category: "TYPHOON",
    source: "交通部中央氣象署《豪(大)雨特報》",
    content:
      "豪雨期間山區坍方、落石與土石流風險會升高，低窪地區要慎防積淹水。若收到土石流、淹水或撤離警戒，要提早往高處或官方避難所移動，不要等到夜間雨勢變大才撤離。",
    tags: ["土石流", "高處", "避難所", "撤離"]
  }
];

const scenarios = [
  {
    id: "drill_fire_dorm",
    title: "宿舍走廊濃煙",
    category: "FIRE",
    location: "宿舍五樓",
    openingLine: "你聞到焦味，打開房門縫看到走廊有濃煙，警報器正在響。你要怎麼做？",
    successSummary: "你先判斷門外熱煙與逃生路徑，低姿勢避煙並保留求救能力，沒有被濃煙困住。",
    steps: [
      {
        id: "fire_check_door",
        title: "確認門外風險",
        situation: "房門外已有濃煙，你必須先判斷門外是否能安全通過。",
        successKeywords: ["摸門把", "門把", "燙", "熱", "門縫", "濃煙", "確認"],
        riskyKeywords: ["直接開門", "開門看看", "衝出去", "跑出去", "收拾", "拿行李"],
        fatalKeywords: ["搭電梯", "衝進煙", "穿越濃煙", "躲衣櫃", "躲浴室"],
        requiredConcepts: ["先摸門把或確認門縫濃煙", "不直接開門衝出", "判斷逃生路線"],
        minRequiredConcepts: 1,
        concepts: [
          { id: "checkDoorHeat", label: "確認門把溫度", keywords: ["摸門把", "手背", "門把", "燙", "熱"] },
          { id: "checkDoorSmoke", label: "觀察門縫濃煙", keywords: ["門縫", "濃煙", "煙", "確認"] },
          { id: "avoidDirectOpen", label: "不直接開門衝出", keywords: ["不開門", "不要開門", "不直接開門", "先不開門", "避免開門"] }
        ],
        successFeedback: "你先確認門外熱煙狀況，沒有直接把門打開暴露在濃煙中。",
        missingHint: "先確認門把溫度與門縫濃煙，再決定逃生或待救。",
        standardAction: "用手背摸門把並觀察門縫；若門把燙或濃煙明顯，不要開門。"
      },
      {
        id: "fire_block_smoke",
        title: "阻煙與求救",
        situation: "門外濃煙阻斷逃生路線，你需要把煙擋在門外並讓外界知道位置。",
        successKeywords: ["關門", "塞門縫", "阻煙", "毛巾", "衣物", "窗邊", "119", "求救", "位置"],
        riskyKeywords: ["等一下", "睡覺", "躲起來", "大喊", "找濕毛巾"],
        fatalKeywords: ["開門衝", "搭電梯", "跳窗", "躲浴室", "穿越濃煙"],
        partialKeywords: ["吸引注意", "音響", "聲音", "播放音樂", "呼救", "求助", "敲打", "手電筒", "燈光", "讓外界知道"],
        partialFeedback: "你有讓外界注意到自己的想法，但這還不是完整逃生待救策略。濃煙阻斷時必須先關門阻煙、塞門縫，再用 119 或窗邊訊號清楚說明位置。",
        requiredConcepts: ["關門阻煙", "塞住門縫", "到窗邊或安全處求救", "撥 119 說明位置"],
        minRequiredConcepts: 3,
        concepts: [
          { id: "closeDoor", label: "關門阻煙", keywords: ["關門", "關上門", "把門關", "門關上"] },
          { id: "sealGap", label: "塞住門縫", keywords: ["塞門縫", "門縫", "阻煙", "毛巾", "衣物", "布"] },
          { id: "moveToWindow", label: "移到窗邊或可通訊處", keywords: ["窗邊", "窗口", "陽台", "可通訊", "安全處"] },
          { id: "call119", label: "撥 119 求救", keywords: ["119", "消防", "報案", "求救", "打電話"] },
          { id: "tellLocation", label: "說明樓層與位置", keywords: ["位置", "樓層", "房號", "宿舍", "五樓"] },
          { id: "signalOnly", label: "吸引外界注意", required: false, keywords: ["吸引注意", "音響", "聲音", "播放音樂", "呼救", "求助", "敲打", "手電筒", "燈光", "讓外界知道"] }
        ],
        successFeedback: "你把門關上並阻煙，保留空氣和等待救援的時間。",
        missingHint: "濃煙阻斷時要關門、塞門縫，並向 119 或窗外清楚求救。",
        standardAction: "關門、用衣物塞門縫，移到窗邊或可通訊處撥 119，說明樓層與房號。"
      },
      {
        id: "fire_stay_rescuable",
        title: "等待救援時保持可救援",
        situation: "你已完成阻煙和求救，接下來要維持呼吸安全並避免讓救援失去定位。",
        successKeywords: ["低姿勢", "窗邊", "揮衣物", "保持通訊", "等待救援", "不要返回", "不開門"],
        riskyKeywords: ["回去拿", "再開門", "拍影片", "亂跑", "一直大喊"],
        fatalKeywords: ["跳窗", "搭電梯", "衝進煙", "穿越濃煙"],
        partialKeywords: ["揮手", "呼救", "求助", "敲打", "手電筒", "燈光", "吸引注意", "發出聲音"],
        partialFeedback: "你有讓救援注意到自己的方向，但還需要維持低姿勢、保持通訊或定位，並避免再次開門進入濃煙。",
        requiredConcepts: ["低姿勢避煙", "保持可被看見或可通訊", "等待消防救援", "不再進入濃煙"],
        minRequiredConcepts: 2,
        concepts: [
          { id: "lowPosture", label: "低姿勢避煙", keywords: ["低姿勢", "趴低", "降低身體", "避煙"] },
          { id: "visibleOrConnected", label: "保持可被看見或可通訊", keywords: ["窗邊", "揮衣物", "手電筒", "燈光", "保持通訊", "手機", "定位", "吸引注意", "發出聲音"] },
          { id: "waitRescue", label: "等待消防救援", keywords: ["等待救援", "等消防", "等救援", "待救"] },
          { id: "noReentry", label: "不再進入濃煙", keywords: ["不要返回", "不返回", "不開門", "不再開門", "不進濃煙"] }
        ],
        successFeedback: "你維持在可被救援的位置，沒有再次進入濃煙或做出跳窗等致命行動。",
        missingHint: "等待救援時要低姿勢、保持通訊與定位，不要再開門進入濃煙。",
        standardAction: "保持低姿勢，在窗邊以衣物或燈光示意，維持通訊並等待救援。"
      }
    ]
  },
  {
    id: "drill_typhoon_underpass",
    title: "暴雨地下道",
    category: "TYPHOON",
    location: "校外地下道入口",
    openingLine: "豪雨已經連下兩小時，地下道入口積水快速上升，但對面就是公車站。你會怎麼做？",
    successSummary: "你放棄穿越積水區，改走高處並通報危險點，避免被暴漲水流困住。",
    steps: [
      {
        id: "underpass_stop",
        title: "停止進入積水區",
        situation: "地下道入口水位快速上升，水深與流速都無法判斷。",
        successKeywords: ["不進", "不要進", "停下", "不下去", "不涉水", "不穿越", "避開"],
        riskyKeywords: ["試試看", "快跑", "涉水", "騎過去", "走過去"],
        fatalKeywords: ["進地下道", "下去看看", "游過去", "騎車衝", "開車衝"],
        requiredConcepts: ["停止進入地下道", "不涉水", "承認水深不明"],
        minRequiredConcepts: 2,
        concepts: [
          { id: "stop", label: "停止前進", keywords: ["停下", "停止", "先停", "不走"] },
          { id: "avoidUnderpass", label: "不進入地下道", keywords: ["不進", "不要進", "不下去", "不穿越", "避開", "遠離"] },
          { id: "avoidWading", label: "不涉水試探", keywords: ["不涉水", "水深不明", "水深", "流速", "不試"] }
        ],
        successFeedback: "你沒有進入水深不明的地下道，先避開最直接的致命風險。",
        missingHint: "第一步是停止進入積水區，不要用走、騎車或開車試探。",
        standardAction: "停在安全處，不進入地下道或任何水深不明道路。"
      },
      {
        id: "underpass_reroute",
        title: "改走高處路線",
        situation: "你已避開地下道，但還需要離開低窪積水區，避免水位繼續上升。",
        successKeywords: ["繞路", "改道", "高處", "往高", "避難", "離開低窪", "等雨小"],
        riskyKeywords: ["原地等", "站入口", "靠近水邊", "拍照", "看一下"],
        fatalKeywords: ["下去", "進地下道", "涉水", "游過去", "騎車衝"],
        requiredConcepts: ["改道", "往高處移動", "遠離入口與低窪處"],
        minRequiredConcepts: 2,
        concepts: [
          { id: "reroute", label: "改道繞路", keywords: ["繞路", "改道", "換路", "改走"] },
          { id: "moveHigh", label: "往高處或安全建物移動", keywords: ["高處", "往高", "安全建物", "避難", "等雨小"] },
          { id: "leaveLowArea", label: "遠離低窪入口", keywords: ["離開低窪", "遠離入口", "不要停入口", "遠離水邊"] }
        ],
        successFeedback: "你改走高處並離開低窪入口，避免後續暴漲時被困住。",
        missingHint: "避開地下道後，要往高處或安全路線移動，不要停在入口旁。",
        standardAction: "改走高處路線或到安全建物等待，遠離地下道入口與低窪道路。"
      },
      {
        id: "underpass_report",
        title: "通報與提醒他人",
        situation: "地下道仍有人想靠近，你需要降低其他人的風險並通知權責單位。",
        successKeywords: ["通報", "提醒", "阻止", "通知", "119", "1999", "警察", "學校", "管理員"],
        riskyKeywords: ["不管", "只離開", "拍影片", "上傳", "圍觀"],
        fatalKeywords: ["帶人下去", "叫人衝", "進地下道", "涉水"],
        requiredConcepts: ["提醒他人不要進入", "通報危險地點", "等待專責單位處理"],
        minRequiredConcepts: 2,
        concepts: [
          { id: "warnOthers", label: "提醒他人不要進入", keywords: ["提醒", "阻止", "叫他不要", "不要進入", "遠離"] },
          { id: "reportHazard", label: "通報危險地點", keywords: ["通報", "通知", "報案", "回報"] },
          { id: "authority", label: "通知權責單位", keywords: ["119", "1999", "警察", "學校", "校安", "管理員", "消防"] },
          { id: "waitAuthority", label: "等待專責單位處理", keywords: ["等待", "等處理", "交給", "專責單位"] }
        ],
        successFeedback: "你不只保護自己，也通報危險點並提醒他人避開。",
        missingHint: "最後要提醒旁人並通報危險地點，避免其他人進入。",
        standardAction: "提醒他人遠離地下道，通報校安、1999、警察或消防單位。"
      }
    ]
  }
];

const vagueTerms = ["不知道", "隨便", "等一下", "發呆", "睡覺", "看情況", "逃跑"];
const disasterTerms = [
  "地震", "火災", "濃煙", "煙", "瓦斯", "逃生", "避難", "撤離", "求救", "119", "110",
  "門把", "門", "窗", "低姿勢", "阻煙", "電梯", "樓梯", "水", "積水", "豪雨", "颱風",
  "地下道", "高處", "通報", "人潮", "CPR", "AED", "防災", "安全", "校安", "1999"
];
const negationPrefixes = ["不", "不要", "別", "避免", "避開", "遠離", "禁止", "不可", "不能", "不會"];

const state = {
  tab: "drill",
  selectedScenarioId: scenarios[0].id,
  activeScenario: null,
  currentStep: 1,
  messages: [],
  lastResult: null,
  records: loadRecords(),
  searchTerm: ""
};

const app = document.querySelector("#app");

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。,．.、!！?？:：；;]/g, "");
}

function containsRuleTerm(normalizedText, term, allowNegated) {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm || !normalizedText.includes(normalizedTerm)) return false;
  if (allowNegated) return true;
  return !negationPrefixes.some((prefix) => normalizedText.includes(prefix + normalizedTerm));
}

function evaluateUserAction(scenario, userText) {
  const normalized = normalize(userText);
  const step = scenario.steps[state.currentStep - 1];
  const fatalMatches = step.fatalKeywords.filter((keyword) => containsRuleTerm(normalized, keyword, false));
  if (fatalMatches.length > 0) {
    return {
      safety: "FAILED",
      verdictLabel: "致命錯誤",
      progressDelta: 0,
      outcome: "FAILED",
      reason: `致命錯誤：${fatalMatches.join("、")}。${fatalReason(scenario.category)}`,
      shouldAskAgain: false,
      matchedRules: fatalMatches
    };
  }

  const riskyMatches = step.riskyKeywords.filter((keyword) => containsRuleTerm(normalized, keyword, false));
  const conceptResult = evaluateConcepts(normalized, step);
  const isVague = normalized.length < 4 || vagueTerms.some((term) => normalized.includes(term));
  const isOffTask = isOffTaskInput(normalized, scenario, step);

  if (isOffTask) {
    return {
      safety: "LOW",
      verdictLabel: "沒有明確關聯",
      progressDelta: 0,
      outcome: "CONTINUE",
      reason: `任務「${step.title}」：這句話和目前情境沒有明確關聯，情境不會推進。${step.missingHint}`,
      shouldAskAgain: true,
      matchedRules: []
    };
  }

  if (riskyMatches.length > 0 && conceptResult.allMatches.length === 0) {
    return {
      safety: "LOW",
      verdictLabel: "危險行動",
      progressDelta: 0,
      outcome: "CONTINUE",
      reason: `任務「${step.title}」：這個決定很危險：${riskyMatches.join("、")}。${step.missingHint}`,
      shouldAskAgain: true,
      matchedRules: riskyMatches
    };
  }

  if (conceptResult.requiredMatches.length === 0 && conceptResult.supportMatches.length > 0) {
    const supportLabels = labels(conceptResult.supportMatches);
    const feedback = step.partialFeedback || `你提到「${supportLabels}」，這和任務有關，但還不足以完成安全行動。還缺：${missingConceptText(conceptResult.missingRequired)}。`;
    return {
      safety: "LOW",
      verdictLabel: "有創意但需補強",
      progressDelta: 0,
      outcome: "CONTINUE",
      reason: `任務「${step.title}」：${feedback}`,
      shouldAskAgain: true,
      matchedRules: supportLabels ? supportLabels.split("、") : []
    };
  }

  if (conceptResult.requiredMatches.length === 0 || isVague) {
    return {
      safety: "LOW",
      verdictLabel: "不夠明確",
      progressDelta: 0,
      outcome: "CONTINUE",
      reason: `任務「${step.title}」：你的回答還不夠明確。${step.missingHint}`,
      shouldAskAgain: true,
      matchedRules: []
    };
  }

  const requiredCount = conceptResult.requiredConcepts.length;
  const threshold = step.minRequiredConcepts || Math.min(2, requiredCount || 1);
  const canAdvance = conceptResult.requiredMatches.length >= threshold;
  const coverage = conceptResult.requiredMatches.length / Math.max(requiredCount, 1);
  const isSuccess = state.currentStep >= scenario.steps.length && canAdvance;
  const nextStep = scenario.steps[Math.min(state.currentStep, scenario.steps.length - 1)];
  const matchedText = labels(conceptResult.requiredMatches);
  const missingText = missingConceptText(conceptResult.missingRequired);

  const incompleteLabel = conceptResult.supportMatches.length > 0 ? "有創意但需補強" : "部分正確但不足";

  return {
    safety: !canAdvance ? "LOW" : coverage >= 0.8 ? "HIGH" : "MEDIUM",
    verdictLabel: isSuccess ? "演練完成" : canAdvance ? "安全可推進" : incompleteLabel,
    progressDelta: canAdvance ? 1 : 0,
    outcome: isSuccess ? "SUCCESS" : "CONTINUE",
    reason: isSuccess
      ? scenario.successSummary
      : canAdvance
        ? `任務「${step.title}」：動作有效，已涵蓋：${matchedText}。${step.successFeedback} 下一個任務：${nextStep.title}。`
        : conceptResult.supportMatches.length > 0
          ? `任務「${step.title}」：你的創意做法可作為輔助：${labels(conceptResult.supportMatches)}；你也有提到：${matchedText}。但還缺：${missingText}，所以情境不推進。${step.missingHint}`
          : `任務「${step.title}」：你有提到：${matchedText}，但還缺：${missingText}，所以情境不推進。${step.missingHint}`,
    shouldAskAgain: !canAdvance,
    matchedRules: conceptResult.allMatches.map((concept) => concept.label)
  };
}

function getStepConcepts(step) {
  if (Array.isArray(step.concepts) && step.concepts.length > 0) return step.concepts;
  return step.successKeywords.map((keyword) => ({
    id: keyword,
    label: keyword,
    keywords: [keyword]
  }));
}

function evaluateConcepts(normalizedText, step) {
  const concepts = getStepConcepts(step);
  const requiredConcepts = concepts.filter((concept) => concept.required !== false);
  const matched = concepts.filter((concept) =>
    concept.keywords.some((keyword) => containsRuleTerm(normalizedText, keyword, true))
  );
  const requiredMatches = matched.filter((concept) => concept.required !== false);
  const supportMatches = matched.filter((concept) => concept.required === false);
  const missingRequired = requiredConcepts.filter(
    (concept) => !requiredMatches.some((matchedConcept) => matchedConcept.id === concept.id)
  );
  return {
    allMatches: matched,
    requiredConcepts,
    requiredMatches,
    supportMatches,
    missingRequired
  };
}

function labels(concepts) {
  return concepts.map((concept) => concept.label).join("、");
}

function missingConceptText(concepts) {
  return concepts.slice(0, 3).map((concept) => concept.label).join("、") || "更完整的安全行動";
}

function isOffTaskInput(normalizedText, scenario, step) {
  if (normalizedText.length < 4) return false;
  const conceptTerms = getStepConcepts(step).flatMap((concept) => [concept.label, ...concept.keywords]);
  const knownTerms = [
    ...step.successKeywords,
    ...step.riskyKeywords,
    ...step.fatalKeywords,
    ...(step.partialKeywords || []),
    ...step.requiredConcepts,
    ...conceptTerms,
    scenario.title,
    scenario.location,
    categories[scenario.category],
    step.title,
    step.situation,
    step.standardAction,
    ...disasterTerms
  ]
    .map(normalize)
    .filter((term) => term.length >= 2);
  return knownTerms.every((term) => !normalizedText.includes(term));
}

function fatalReason(category) {
  if (category === "FIRE") return "火災中這可能讓你吸入濃煙、被困在電梯或失去待救位置。";
  return "豪雨積水流速和深度不可預測，地下道與低窪道路都可能瞬間變成致命區域。";
}

function composeAssistantReply(scenario, result) {
  const step = scenario.steps[state.currentStep - 1];
  const evidence = bestEvidence(scenario.category);
  const verdictLabel = result.verdictLabel || {
    HIGH: "安全",
    MEDIUM: "可接受，但還要補強",
    LOW: "有風險",
    FAILED: "致命錯誤"
  }[result.safety];
  const nextAction = {
    FAILED: "停止目前做法，回到情境重新練習，優先避開上面的致命錯誤。",
    SUCCESS: "演練完成。請回顧這次的關鍵安全動作，確認災時能照順序執行。",
    CONTINUE: result.shouldAskAgain
      ? result.verdictLabel === "有創意但需補強"
        ? "請保留這個輔助做法，並補上主要安全行動：先避開核心危險，再說明如何求救或定位。"
        : "請改用一句具體行動回答：你要避開什麼、確認什麼、往哪裡移動或如何求救。"
      : "繼續判斷下一個威脅，並說出你的下一步具體行動。"
  }[result.outcome];

  return [
    `任務：${step.title}`,
    `情境：${step.situation}`,
    `判定：${verdictLabel}`,
    `原因：${result.reason}`,
    `依據：${evidence.source} - ${evidence.title}`,
    `下一步：${nextAction}`,
    `標準動作：${step.standardAction}`
  ].join("\n");
}

function bestEvidence(category) {
  return knowledgeChunks.find((chunk) => chunk.category === category) || knowledgeChunks[0];
}

function startScenario(id = state.selectedScenarioId) {
  const scenario = scenarios.find((item) => item.id === id) || scenarios[0];
  state.selectedScenarioId = scenario.id;
  state.activeScenario = scenario;
  state.currentStep = 1;
  state.lastResult = null;
  state.messages = [
    {
      role: "system",
      text: `${scenario.openingLine}\n\n任務：${scenario.steps[0].title}\n${scenario.steps[0].situation}`
    }
  ];
  render();
}

function submitAction() {
  if (!state.activeScenario) startScenario();
  const input = document.querySelector("#actionInput");
  const text = input.value.trim();
  if (!text) return;

  const scenario = state.activeScenario;
  const result = evaluateUserAction(scenario, text);
  const reply = composeAssistantReply(scenario, result);
  state.messages.push({ role: "user", text });
  state.messages.push({ role: result.outcome === "FAILED" ? "failed" : "system", text: reply });
  state.lastResult = result;

  if (result.progressDelta > 0 && result.outcome !== "SUCCESS") {
    state.currentStep = Math.min(state.currentStep + 1, scenario.steps.length);
  }

  if (result.outcome === "FAILED" || result.outcome === "SUCCESS") {
    saveRecord(result.outcome, scenario, result);
  }

  input.value = "";
  render();
}

function saveRecord(outcome, scenario, result) {
  const record = {
    id: `${Date.now()}`,
    time: new Date().toLocaleString("zh-TW"),
    scenarioTitle: scenario.title,
    outcome,
    safety: result.safety,
    step: state.currentStep,
    totalSteps: scenario.steps.length,
    summary: result.reason
  };
  state.records = [record, ...state.records].slice(0, 20);
  localStorage.setItem("pocketkb-records", JSON.stringify(state.records));
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem("pocketkb-records") || "[]");
  } catch {
    return [];
  }
}

function clearRecords() {
  state.records = [];
  localStorage.removeItem("pocketkb-records");
  render();
}

function searchKnowledge(term) {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return knowledgeChunks;
  return knowledgeChunks
    .map((chunk) => {
      const text = normalize(`${chunk.title}${chunk.content}${chunk.tags.join("")}${chunk.source}`);
      const score = chunk.tags.filter((tag) => normalize(tag).includes(normalizedTerm) || normalizedTerm.includes(normalize(tag))).length
        + (text.includes(normalizedTerm) ? 2 : 0);
      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.chunk);
}

function render() {
  app.innerHTML = `
    <main class="app-shell">
      <div class="app-frame">
        <header class="topbar">
          <div class="brand">
            <img src="./icon.svg" alt="" aria-hidden="true">
            <div>
              <h1 class="brand-title">PocketKB 防災演練</h1>
              <div class="brand-subtitle">離線應急核心 + 情境式規則裁判</div>
            </div>
          </div>
          <div class="status-pill">● 離線核心可用</div>
        </header>

        <div class="layout">
          <section class="workspace">
            <nav class="tabs" aria-label="主要功能">
              ${tabButton("drill", "演練")}
              ${tabButton("guide", "查詢")}
              ${tabButton("records", "紀錄")}
              ${tabButton("online", "AI 教練")}
            </nav>
            ${renderDrillView()}
            ${renderGuideView()}
            ${renderRecordsView()}
            ${renderOnlineView()}
          </section>

          <aside class="side-panel">
            <h2 class="section-title">模式邊界</h2>
            <p class="section-note">目前先把能離線可靠運作的功能做紮實，AI 只作為有網路時的教練層。</p>
            <div class="mode-list">
              <div class="mode-item ready">
                <strong>離線應急核心</strong>
                <div class="tiny">官方知識摘要、情境腳本、規則裁判、演練紀錄。手機沒網路也應可用。</div>
              </div>
              <div class="mode-item planned">
                <strong>線上 AI 教練</strong>
                <div class="tiny">用於長回饋、反思報告、不同回答改寫。安全判定仍由離線規則守住。</div>
              </div>
            </div>
            <div class="button-row">
              <button class="ghost" id="installHintBtn" type="button">＋ 安裝提示</button>
            </div>
            <p class="tiny" id="secureNotice"></p>
          </aside>
        </div>
      </div>
    </main>
  `;

  bindEvents();
  renderSecureNotice();
  scrollChat();
}

function tabButton(id, label) {
  return `<button class="tab ${state.tab === id ? "active" : ""}" data-tab="${id}" type="button">${label}</button>`;
}

function renderDrillView() {
  const scenario = state.activeScenario || scenarios.find((item) => item.id === state.selectedScenarioId);
  const step = state.activeScenario?.steps[state.currentStep - 1] || scenario.steps[0];
  const isComplete = state.lastResult?.outcome === "SUCCESS";
  const completedSteps = isComplete ? scenario.steps.length : state.currentStep - 1;
  const progress = state.activeScenario ? Math.round((completedSteps / scenario.steps.length) * 100) : 0;
  return `
    <div class="view ${state.tab === "drill" ? "active" : ""}" id="view-drill">
      <h2 class="section-title">離線情境演練</h2>
      <p class="section-note">每一步都要回答具體動作。離題、模糊、危險動作不會推進。</p>
      <div class="scenario-grid">
        ${scenarios.map(renderScenarioCard).join("")}
      </div>
      <div class="button-row">
        <button class="primary" id="startBtn" type="button">▶ 開始 / 重來</button>
      </div>

      <div class="drill-panel">
        <div class="drill-header">
          <div>
            <h3 class="scenario-title">${escapeHtml(scenario.title)}</h3>
            <div class="meta">${escapeHtml(categories[scenario.category])} · ${escapeHtml(scenario.location)}</div>
          </div>
          <div class="progress-wrap">
            <div class="progress-text">任務 ${state.activeScenario ? state.currentStep : 0} / ${scenario.steps.length}</div>
            <div class="progress"><div class="progress-bar" style="width:${progress}%"></div></div>
          </div>
        </div>
        <div class="task-box">
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(state.activeScenario ? step.situation : scenario.openingLine)}</p>
        </div>
        <div class="chat-log" id="chatLog">
          ${(state.messages.length ? state.messages : [{ role: "system", text: "請先選擇情境並按下開始。" }])
            .map((message) => `<div class="message ${message.role}">${escapeHtml(message.text)}</div>`)
            .join("")}
        </div>
        <div class="input-area">
          <textarea id="actionInput" placeholder="輸入你的下一步，例如：我不進地下道，先停下並避開積水入口。" ${!state.activeScenario ? "disabled" : ""}></textarea>
          <button class="primary" id="submitBtn" type="button" ${!state.activeScenario ? "disabled" : ""}>送出</button>
        </div>
      </div>
      ${state.lastResult ? renderJudgeBox(state.lastResult) : ""}
    </div>
  `;
}

function renderScenarioCard(scenario) {
  const selected = state.selectedScenarioId === scenario.id;
  return `
    <button class="scenario-card ${selected ? "selected" : ""}" data-scenario="${scenario.id}" type="button">
      <div class="scenario-top">
        <h3 class="scenario-title">${escapeHtml(scenario.title)}</h3>
        <span class="badge">${escapeHtml(categories[scenario.category])}</span>
      </div>
      <div class="meta">${escapeHtml(scenario.location)} · ${scenario.steps.length} 步驟</div>
      <p class="section-note">${escapeHtml(scenario.openingLine)}</p>
    </button>
  `;
}

function renderJudgeBox(result) {
  const className = result.safety.toLowerCase();
  return `
    <div class="judge-box ${className}">
      <h3>裁判結果：${escapeHtml(result.verdictLabel || result.safety)}</h3>
      <p>${escapeHtml(result.reason)}</p>
    </div>
  `;
}

function renderGuideView() {
  const results = searchKnowledge(state.searchTerm);
  return `
    <div class="view ${state.tab === "guide" ? "active" : ""}" id="view-guide">
      <h2 class="section-title">離線應急查詢</h2>
      <p class="section-note">目前收錄演練需要的核心知識。之後可擴充成完整官方知識庫。</p>
      <div class="search-box">
        <input id="searchInput" value="${escapeHtml(state.searchTerm)}" placeholder="搜尋：濃煙、地下道、119、高處">
        <button class="primary" id="searchBtn" type="button">搜尋</button>
      </div>
      <div class="guide-list">
        ${results.length ? results.map(renderGuideItem).join("") : `<div class="empty">找不到明確結果，請換成災害、地點或動作關鍵字。</div>`}
      </div>
    </div>
  `;
}

function renderGuideItem(chunk) {
  return `
    <article class="guide-item">
      <h3 class="guide-title">${escapeHtml(chunk.title)}</h3>
      <div class="meta">${escapeHtml(categories[chunk.category])} · ${escapeHtml(chunk.source)}</div>
      <p>${escapeHtml(chunk.content)}</p>
      <div class="meta">關鍵字：${chunk.tags.map(escapeHtml).join("、")}</div>
    </article>
  `;
}

function renderRecordsView() {
  return `
    <div class="view ${state.tab === "records" ? "active" : ""}" id="view-records">
      <h2 class="section-title">研究紀錄</h2>
      <p class="section-note">保存在此裝置瀏覽器內，可用來整理前後測、錯誤類型和劇情實用性。</p>
      <div class="button-row">
        <button class="danger" id="clearRecordsBtn" type="button" ${state.records.length ? "" : "disabled"}>清除紀錄</button>
      </div>
      <div class="record-list">
        ${state.records.length ? state.records.map(renderRecordItem).join("") : `<div class="empty">尚無演練紀錄。</div>`}
      </div>
    </div>
  `;
}

function renderRecordItem(record) {
  return `
    <article class="record-card">
      <h3 class="record-title">${escapeHtml(record.scenarioTitle)} · ${escapeHtml(record.outcome)}</h3>
      <div class="meta">${escapeHtml(record.time)} · 安全評分 ${escapeHtml(record.safety)} · 任務 ${record.step}/${record.totalSteps}</div>
      <p>${escapeHtml(record.summary)}</p>
    </article>
  `;
}

function renderOnlineView() {
  return `
    <div class="view ${state.tab === "online" ? "active" : ""}" id="view-online">
      <h2 class="section-title">線上 AI 教練</h2>
      <p class="section-note">這一層預留給有網路時使用，不放進離線安全判定。</p>
      <div class="tool-panel" style="padding:14px;">
        <h3 class="guide-title">規劃中的用途</h3>
        <p>整理使用者演練紀錄、產生反思報告、改寫更自然的情境回饋、比較不同災害情境的表現。</p>
        <p class="tiny">目前版本刻意不呼叫雲端 API，方便先做 iPhone 實測與研究流程驗證。</p>
      </div>
    </div>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      render();
    });
  });

  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedScenarioId = button.dataset.scenario;
      state.activeScenario = null;
      state.messages = [];
      state.lastResult = null;
      render();
    });
  });

  document.querySelector("#startBtn")?.addEventListener("click", () => startScenario());
  document.querySelector("#submitBtn")?.addEventListener("click", submitAction);
  document.querySelector("#actionInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitAction();
    }
  });
  document.querySelector("#searchBtn")?.addEventListener("click", () => {
    state.searchTerm = document.querySelector("#searchInput").value;
    render();
  });
  document.querySelector("#searchInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      state.searchTerm = event.currentTarget.value;
      render();
    }
  });
  document.querySelector("#clearRecordsBtn")?.addEventListener("click", clearRecords);
  document.querySelector("#installHintBtn")?.addEventListener("click", () => {
    alert("iPhone 測試：用 Safari 開啟 HTTPS 網址，按分享按鈕，再選「加入主畫面」。若只是 Windows 區網 http 測試，可先測流程，離線快取需 HTTPS。");
  });
}

function renderSecureNotice() {
  const notice = document.querySelector("#secureNotice");
  if (!notice) return;
  const canUseServiceWorker = "serviceWorker" in navigator && window.isSecureContext;
  notice.textContent = canUseServiceWorker
    ? "目前環境支援 PWA 離線快取。"
    : "目前環境可測流程；iPhone 離線快取需要 HTTPS 網址。";
}

function scrollChat() {
  const log = document.querySelector("#chatLog");
  if (log) log.scrollTop = log.scrollHeight;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("./sw.js");
}

render();







