# PocketKB 災前離線選擇題演練架構

狀態：設計草案｜Scenario Pack schema v1｜基準 `288e4e5`

Android 是正式執行端。斷網、無模型時可開始、完成、回顧和重來。連網用來準備和下載情境包，也可在使用者主動選「其他」時解析文字。Android 的 Kotlin runtime 與開發用 Web JS runtime 都只接受已驗證的選擇，並以同一份情境包計算結果。

基準採 [導演引擎](../online-coach/director-engine.js)、[宿舍火災](../online-coach/director-scenarios/fire-dorm.js) 與 [學校地震](../online-coach/director-scenarios/earthquake-school.js)。[Gemini 檢閱包](GEMINI_REVIEW_PACKET_v2.md) 的部分紀錄早於 4.2b，[最新回顧樣張](STEP_42_REVIEW_SAMPLES.md) 中的 4.2b 為本機規則重播，真實 API 補驗仍待完成。下列規格保留致命行動立即結束、回顧後才可重來、未應對有代價、每回合至多一個待決事件。

## 1. 情境包 v1

### 內容與欄位

| 區塊 | 責任 |
|---|---|
| `schemaVersion`、`meta` | 格式版與劇本版分開。穩定 `id`、`title`、`hazard`、`version`、`skeletonVersion`，及 `sources[{id,title,url}]`。來源 ID 對應已審的骨架原則與來源版本，網址供溯源。 |
| `initial` | 起始 `facts`、各類暴露值 `exposure`、NPC 狀態及首題、開場旁白。初始值也宣告欄位可讀寫的域，包含 nullable 時間欄位。 |
| `catalog` | 已審 `principles`、`hazards`、通報 `channels`。每項有適用條件、效果、可選的有序變體、來源與回顧。危險可阻止同選項內其他步驟。致命危險指定 `fatalEndingId`。通報只改演練資料。 |
| `decisions` | 第一個符合 `when` 的決策點有優先權。每題有 `prompt` 與 3–4 個計分選項。選項用穩定 ID，保存來源、教學類型、獨立安全標記、按順序執行的 catalog 參照及已審的額外效果。單題可覆寫反思問題。 |
| `beats`、`phaseRules` | 時間軸事件用 `at`、`after`、`when`、`repeat`。先選變體，再執行基礎及該變體效果。 `prevented` 有自己的 ID。 `overrides` 支援其他有序變體。決策事件可指出要展示哪一題。階段規則表示先結算定位、等待或暫緩事件。 |
| `consequences` | `missed`、`reckless`、`world` 各用明確條件。符合且真的結算時累計該規則的觸發次數，選取 `fromCount` 最大且不超過次數的階層。階層可改 facts、暴露與 NPC 狀態，並選對應旁白；階層的 `cases` 可依條件改用其他已審效果／旁白。第一階必從 1 起，後續嚴格遞增。 |
| `endings`、`injury`、`limits` | 同一階段依陣列順序取第一個符合的結局。致命結局的傷勢預設明定 `NOT_ASSESSED`，UI 隱藏傷勢欄。其他結局以包內傷勢分數與門檻推導，分別是 ≤ `noneMax`、≤ `mildMax`、≤ `moderateMax` 和以上，門檻單調遞增。上限必有確定的劇本收場規則，缺少就拒裝。 |
| `review`、`presentation`、`assets` | 事件與動作由 `why/tip/eligibleWhen` 及來源做回顧。每個可見旁白 ID 至少含兩種作者核准的寫法。靜態圖片用封包內相對路徑、hash、MIME、替代文字。純文字也能完成演練。 |

### 條件與值 DSL 完整清單

| 語法 | 語意 |
|---|---|
| `{"always":true}`、`all`、`any`、`not` | 固定真、全部成立、任一成立、反相。 |
| `{"fact":"doorClosed","eq":true}`、`{"clock":{"gte":3}}` | 簡寫。比較符 `eq/ne/gt/gte/lt/lte`。`eq` 採型別和值皆相等，`ne` 為其反相，因此 nullable 欄位能直接和 null 比較。順序比較兩側須是整數。 |
| `{"compare":{"left":{"ref":"clock"},"op":"gte","right":{"ref":"facts.arriveAt"}}}` | 比較兩個值，含時間、暴露和其他欄位。nullable 值的順序比較回 false，算術需先排除 null 或使用 `coalesce`。 |
| `{"has":{"set":"seenBeats","id":"arrival"}}` | 查成員。集合白名單為 `met`、`turnPrinciples`、`turnHazards`、`turnCues`、`seenBeats`、`seenVariants`。 |
| 字面值、`{"ref":"clock"}`、`{"op":"add","args":[{"ref":"clock"},1]}` | 值可為布林、字串、null、32 位有號整數。引用白名單為 `clock`、`turn.nextClock`、`turn.channelId`、`turn.hazardCount`、`beat.lastVisibleId`、`facts.<key>`、`npc.<id>.<key>`、`exposure.<key>`、`beat.<id>.firstTurn`、`beat.<id>.lastTurn`、`beat.<id>.count`、`counter.<consequenceId>`、`ending.type/injury/hazardId`、`impact.injury/anyInjury`。尚未發生事件的時間為 null，次數為 0。結局及 impact 欄位只能在對應投影環境讀取。 |
| `add`、`sum`、`min`、`max`、`mod`、`coalesce` | 整數加總、取最小或最大、正整數除數的非負餘數、從左取首個非 null 值。`add/sum` 同為加總。限制 AST 深度 ≤ 16，運算溢位或不合法參照拒裝。 |
| `effect.set/add/emit/credit` | 同一個效果的 RHS 讀同一份效果前狀態。`set` 只寫 facts/NPC，`add` 只為已宣告暴露值加非負整數，`emit` 記錄資料事件，`credit` 完成已核准 principle。`clock`、終局、計數和事件世代由 runtime 寫入。 |

複合例 `{"all":[{"fact":"doorClosed","eq":true},{"clock":{"gte":3}}]}`。DSL 只解析有版的物件樹。包內禁止 JS、Kotlin、正則、回呼、遠端規則引用、任意函式名、遞迴或動態路徑。字串按文字顯示，素材路徑解析後必須留在包內。`turnCues` 只接受已審選項附帶的 cue，避免文字分類偷渡狀態變更。

### JSON Schema（Draft 2020-12）

以下 schema 以結構檢查為主。語意 validator 另核對 ID 唯一、跨引用、數值範圍、各題選項型別覆蓋、分支可達、固定旁白可用及來源准入。每個正式選項至少引用一項 principle 或 hazard，報案可另帶 channel。JSON parser 先拒絕重複鍵。可見事件引用的每個旁白 ID 均需有兩種寫法，隱藏事件不顯示旁白。變體優先序為 prevented 優先、接著第一個符合的 overrides、最後 normal，同一 beat 只結算一個變體。要在 prevented 路徑區分兩種情況，可將 prevented 的條件限縮至較具體的一支，另一支置於 overrides。 [Draft 2020-12 規格](https://json-schema.org/draft/2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:pocketkb:scenario-pack:v1",
  "type": "object",
  "required": ["schemaVersion","meta","initial","limits","catalog","beats","decisions","consequences","phaseRules","endings","injury","review","presentation","assets"],
  "properties": {"schemaVersion":{"const":1},"meta":{"type":"object","required":["id","title","version","hazard","sources","skeletonVersion"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"title":{"type":"string","minLength":1,"maxLength":500},"version":{"type":"string","pattern":"^[0-9]+\\.[0-9]+\\.[0-9]+$"},"hazard":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"sources":{"type":"array","items":{"$ref":"#/$defs/source"},"minItems":1,"maxItems":128},"skeletonVersion":{"type":"string","minLength":1,"maxLength":500}},"additionalProperties":false},"initial":{"type":"object","required":["facts","exposure","npc","openingNarration","decisionId"],"properties":{"facts":{"type":"object","propertyNames":{"type":"string","pattern":"^[A-Za-z][A-Za-z0-9_]{0,63}$"},"additionalProperties":{"$ref":"#/$defs/scalar"},"maxProperties":128},"exposure":{"type":"object","propertyNames":{"type":"string","pattern":"^[A-Za-z][A-Za-z0-9_]{0,63}$"},"additionalProperties":{"type":"integer","minimum":0,"maximum":2147483647},"maxProperties":128},"npc":{"type":"object","propertyNames":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"additionalProperties":{"type":"object","propertyNames":{"type":"string","pattern":"^[A-Za-z][A-Za-z0-9_]{0,63}$"},"additionalProperties":{"$ref":"#/$defs/scalar"},"maxProperties":128},"maxProperties":128},"openingNarration":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"decisionId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"}},"additionalProperties":false},"limits":{"type":"object","required":["maxTurns"],"properties":{"maxTurns":{"type":"integer","minimum":1,"maximum":128}},"additionalProperties":false},"catalog":{"type":"object","required":["principles","hazards","channels"],"properties":{"principles":{"type":"array","items":{"$ref":"#/$defs/action"},"minItems":1,"maxItems":128},"hazards":{"type":"array","items":{"$ref":"#/$defs/action"},"minItems":0,"maxItems":128},"channels":{"type":"array","items":{"$ref":"#/$defs/action"},"minItems":0,"maxItems":128}},"additionalProperties":false},"beats":{"type":"array","items":{"$ref":"#/$defs/beat"},"minItems":0,"maxItems":128},"decisions":{"type":"array","items":{"$ref":"#/$defs/decision"},"minItems":1,"maxItems":128},"consequences":{"type":"array","items":{"$ref":"#/$defs/consequence"},"minItems":0,"maxItems":128},"phaseRules":{"type":"array","items":{"$ref":"#/$defs/phaseRule"},"minItems":0,"maxItems":128},"endings":{"type":"array","items":{"$ref":"#/$defs/ending"},"minItems":1,"maxItems":128},"injury":{"type":"object","required":["score","noneMax","mildMax","moderateMax"],"properties":{"score":{"$ref":"#/$defs/expr"},"noneMax":{"type":"integer","minimum":0,"maximum":2147483647},"mildMax":{"type":"integer","minimum":0,"maximum":2147483647},"moderateMax":{"type":"integer","minimum":0,"maximum":2147483647}},"additionalProperties":false},"review":{"type":"object","required":["reflectionPrompt"],"properties":{"reflectionPrompt":{"type":"string","minLength":1,"maxLength":500}},"additionalProperties":false},"presentation":{"type":"object","required":["narration","look","askCompanion","idle","status"],"properties":{"narration":{"type":"object","propertyNames":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"additionalProperties":{"type":"array","items":{"type":"string","minLength":1,"maxLength":500},"minItems":2,"maxItems":8,"uniqueItems":true},"maxProperties":128},"look":{"type":"array","items":{"$ref":"#/$defs/projection"},"minItems":1,"maxItems":128},"askCompanion":{"type":"array","items":{"$ref":"#/$defs/projection"},"minItems":1,"maxItems":128},"idle":{"type":"array","items":{"$ref":"#/$defs/projection"},"minItems":1,"maxItems":128},"status":{"type":"array","items":{"$ref":"#/$defs/textCase"},"minItems":0,"maxItems":128}},"additionalProperties":false},"assets":{"type":"array","items":{"$ref":"#/$defs/asset"},"minItems":0,"maxItems":128}},
  "additionalProperties": false,
  "$defs": {
    "id": {"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},
    "scalar": {"anyOf":[{"type":"string","minLength":1,"maxLength":500},{"type":"integer","minimum":-2147483648,"maximum":2147483647},{"type":"boolean"},{"type":"null"}]},
    "expr": {"oneOf":[{"$ref":"#/$defs/scalar"},{"type":"object","required":["ref"],"properties":{"ref":{"type":"string","pattern":"^[a-zA-Z][a-zA-Z0-9_:-]*(\\.[a-zA-Z][a-zA-Z0-9_:-]*)*$","maxLength":160}},"additionalProperties":false},{"type":"object","required":["op","args"],"properties":{"op":{"enum":["add","min","max","sum","coalesce"]},"args":{"type":"array","items":{"$ref":"#/$defs/expr"},"minItems":2,"maxItems":16}},"additionalProperties":false},{"type":"object","required":["op","args"],"properties":{"op":{"const":"mod"},"args":{"type":"array","items":{"$ref":"#/$defs/expr"},"minItems":2,"maxItems":2}},"additionalProperties":false}]},
    "cmp": {"enum":["eq","ne","gt","gte","lt","lte"]},
    "rel": {"oneOf":[{"type":"object","required":["eq"],"properties":{"eq":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["ne"],"properties":{"ne":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["gt"],"properties":{"gt":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["gte"],"properties":{"gte":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["lt"],"properties":{"lt":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["lte"],"properties":{"lte":{"$ref":"#/$defs/scalar"}},"additionalProperties":false}]},
    "when": {"oneOf":[{"type":"object","required":["always"],"properties":{"always":{"const":true}},"additionalProperties":false},{"type":"object","required":["all"],"properties":{"all":{"type":"array","items":{"$ref":"#/$defs/when"},"minItems":1,"maxItems":16}},"additionalProperties":false},{"type":"object","required":["any"],"properties":{"any":{"type":"array","items":{"$ref":"#/$defs/when"},"minItems":1,"maxItems":16}},"additionalProperties":false},{"type":"object","required":["not"],"properties":{"not":{"$ref":"#/$defs/when"}},"additionalProperties":false},{"type":"object","required":["fact","eq"],"properties":{"fact":{"type":"string","minLength":1,"maxLength":500},"eq":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["fact","ne"],"properties":{"fact":{"type":"string","minLength":1,"maxLength":500},"ne":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["fact","gt"],"properties":{"fact":{"type":"string","minLength":1,"maxLength":500},"gt":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["fact","gte"],"properties":{"fact":{"type":"string","minLength":1,"maxLength":500},"gte":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["fact","lt"],"properties":{"fact":{"type":"string","minLength":1,"maxLength":500},"lt":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["fact","lte"],"properties":{"fact":{"type":"string","minLength":1,"maxLength":500},"lte":{"$ref":"#/$defs/scalar"}},"additionalProperties":false},{"type":"object","required":["clock"],"properties":{"clock":{"$ref":"#/$defs/rel"}},"additionalProperties":false},{"type":"object","required":["compare"],"properties":{"compare":{"type":"object","required":["left","op","right"],"properties":{"left":{"$ref":"#/$defs/expr"},"op":{"$ref":"#/$defs/cmp"},"right":{"$ref":"#/$defs/expr"}},"additionalProperties":false}},"additionalProperties":false},{"type":"object","required":["has"],"properties":{"has":{"type":"object","required":["set","id"],"properties":{"set":{"enum":["met","turnPrinciples","turnHazards","turnCues","seenBeats","seenVariants"]},"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"}},"additionalProperties":false}},"additionalProperties":false}]},
    "set": {"type":"object","propertyNames":{"type":"string","pattern":"^[a-zA-Z][a-zA-Z0-9_:-]*(\\.[a-zA-Z][a-zA-Z0-9_:-]*)*$","maxLength":160},"additionalProperties":{"$ref":"#/$defs/expr"},"maxProperties":64},
    "effect": {"type":"object","required":[],"properties":{"set":{"$ref":"#/$defs/set"},"add":{"$ref":"#/$defs/set"},"emit":{"type":"array","items":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"minItems":0,"maxItems":128},"credit":{"type":"array","items":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"minItems":0,"maxItems":128},"injuries":{"type":"array","maxItems":8,"items":{"$ref":"#/$defs/injuryIncident"}},"delay":{"type":"string","minLength":1,"maxLength":500}},"additionalProperties":false},
    "result": {"type":"object","required":["effect","narration"],"properties":{"effect":{"$ref":"#/$defs/effect"},"narration":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"}},"additionalProperties":false},
    "variant": {"type":"object","required":["when","result"],"properties":{"when":{"$ref":"#/$defs/when"},"result":{"$ref":"#/$defs/result"}},"additionalProperties":false},
    "after": {"type":"object","required":["beat","turns"],"properties":{"beat":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"turns":{"type":"integer","minimum":0,"maximum":2147483647}},"additionalProperties":false},
    "prevented": {"type":"object","required":["id","when","result"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"when":{"$ref":"#/$defs/when"},"result":{"$ref":"#/$defs/result"}},"additionalProperties":false},
    "beat": {"type":"object","required":["id","at","when","repeat","normal"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"at":{"type":"integer","minimum":0,"maximum":2147483647},"after":{"$ref":"#/$defs/after"},"when":{"$ref":"#/$defs/when"},"repeat":{"type":"boolean"},"hidden":{"type":"boolean"},"decisionId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"baseEffect":{"$ref":"#/$defs/effect"},"normal":{"$ref":"#/$defs/result"},"prevented":{"$ref":"#/$defs/prevented"},"overrides":{"type":"array","items":{"$ref":"#/$defs/variant"},"minItems":0,"maxItems":128}},"additionalProperties":false},
    "source": {"type":"object","required":["id","title","url"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"title":{"type":"string","minLength":1,"maxLength":500},"url":{"type":"string","format":"uri","pattern":"^https://","maxLength":2000}},"additionalProperties":false},
    "review": {"type":"object","required":["why","tip","eligibleWhen","priority"],"properties":{"why":{"type":"string","minLength":1,"maxLength":500},"tip":{"type":"string","minLength":1,"maxLength":500},"eligibleWhen":{"$ref":"#/$defs/when"},"priority":{"type":"integer","minimum":0,"maximum":2147483647},"outcome":{"type":"string","minLength":1,"maxLength":500},"principleId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"companion":{"type":"boolean"}},"additionalProperties":false},
    "actionRef": {"type":"object","required":["kind","id"],"properties":{"kind":{"enum":["principle","hazard","channel"]},"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"}},"additionalProperties":false},
    "action": {"type":"object","required":["id","sourceIds","when","review","normal"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"sourceIds":{"type":"array","items":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"minItems":1,"maxItems":128},"when":{"$ref":"#/$defs/when"},"review":{"$ref":"#/$defs/review"},"normal":{"$ref":"#/$defs/result"},"cases":{"type":"array","items":{"$ref":"#/$defs/variant"},"minItems":0,"maxItems":128},"blocked":{"$ref":"#/$defs/result"},"bonus":{"type":"boolean"},"fatalEndingId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"blocks":{"type":"array","items":{"$ref":"#/$defs/actionRef"},"minItems":0,"maxItems":128}},"additionalProperties":false},
    "option": {"type":"object","required":["id","text","class","safety","sourceIds","steps","cues","effect","narration"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"text":{"type":"string","minLength":1,"maxLength":500},"class":{"enum":["correct","misconception","risk_or_delay","partial"]},"safety":{"enum":["safe","unsafe"]},"sourceIds":{"type":"array","items":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"minItems":1,"maxItems":128},"steps":{"type":"array","items":{"$ref":"#/$defs/actionRef"},"minItems":1,"maxItems":8},"cues":{"type":"array","items":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"minItems":0,"maxItems":8},"effect":{"$ref":"#/$defs/effect"},"missingStep":{"type":"string","minLength":1,"maxLength":500},"narration":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"}},"additionalProperties":false},
    "decision": {"type":"object","required":["id","prompt","when","options"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"prompt":{"type":"string","minLength":1,"maxLength":500},"when":{"$ref":"#/$defs/when"},"options":{"type":"array","items":{"$ref":"#/$defs/option"},"minItems":3,"maxItems":4},"reflectionPrompt":{"type":"string","minLength":1,"maxLength":500}},"additionalProperties":false},
    "escalation": {"type":"object","required":["fromCount","result"],"properties":{"fromCount":{"type":"integer","minimum":1},"result":{"$ref":"#/$defs/result"},"cases":{"type":"array","items":{"$ref":"#/$defs/variant"},"maxItems":128}},"additionalProperties":false},
    "consequence": {"type":"object","required":["id","kind","decisionId","when","tiers","sourceIds","review"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"kind":{"enum":["missed","reckless","world"]},"decisionId":{"anyOf":[{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},{"type":"null"}]},"when":{"$ref":"#/$defs/when"},"tiers":{"type":"array","items":{"$ref":"#/$defs/escalation"},"minItems":1,"maxItems":8},"sourceIds":{"type":"array","items":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"minItems":1,"maxItems":128},"review":{"$ref":"#/$defs/review"}},"additionalProperties":false},
    "ending": {"type":"object","required":["id","type","phase","when","injury","narration"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"type":{"enum":["SAFE_RESCUE","DELAYED_RESCUE","SELF_EVACUATION","DELAYED_EVACUATION","CRITICAL_FAILURE"]},"phase":{"enum":["fatal","beforeBeats","afterBeats"]},"when":{"$ref":"#/$defs/when"},"injury":{"enum":["fromThresholds","NOT_ASSESSED","NONE","MILD","MODERATE","SEVERE"]},"narration":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"labels":{"type":"array","items":{"$ref":"#/$defs/textCase"},"minItems":0,"maxItems":128},"summaries":{"type":"array","items":{"$ref":"#/$defs/textCase"},"minItems":0,"maxItems":128},"causes":{"type":"array","items":{"$ref":"#/$defs/textCase"},"minItems":0,"maxItems":128}},"additionalProperties":false},
    "textCase": {"type":"object","required":["when","text"],"properties":{"when":{"$ref":"#/$defs/when"},"text":{"type":"string","minLength":1,"maxLength":500}},"additionalProperties":false},
    "projection": {"type":"object","required":["when","narration"],"properties":{"when":{"$ref":"#/$defs/when"},"narration":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"}},"additionalProperties":false},
    "phaseRule": {"type":"object","required":["id","phase","when","result","skipBeats"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"phase":{"enum":["afterActions","beforeBeats"]},"when":{"$ref":"#/$defs/when"},"result":{"$ref":"#/$defs/result"},"skipBeats":{"type":"boolean"}},"additionalProperties":false},
    "asset": {"type":"object","required":["id","path","sha256","mime","alt"],"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"path":{"type":"string","minLength":1,"maxLength":160},"sha256":{"type":"string","pattern":"^[a-f0-9]{64}$"},"mime":{"enum":["image/png","image/webp","image/jpeg"]},"alt":{"type":"string","minLength":1,"maxLength":500}},"additionalProperties":false},
    "injuryIncident": {"type":"object","required":["id","subject","label","severity"],"additionalProperties":false,"properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"subject":{"type":"string","pattern":"^[a-z][a-z0-9_-]{0,63}$"},"label":{"type":"string","minLength":1,"maxLength":500},"severity":{"enum":["MILD","MODERATE","SEVERE"]}}}
  }
}
```

### JSON 範例

以下單題包供結構與時序測試，含合成 ID 與強制結束，維持與正式教材分離。正式包的所有可執行動作均須存在於當版核准的 catalog。

```json
{
  "schemaVersion": 1,
  "meta": {"id":"drill_fire_dorm_fixture","title":"宿舍火災結構測試","version":"0.1.0","hazard":"fire","skeletonVersion":"fixture.1","sources":[{"id":"nfa","title":"消防署來源識別示意","url":"https://www.nfa.gov.tw/"}]},
  "initial": {"facts":{"doorClosed":false},"exposure":{"smoke":0},"npc":{"roommate":{"state":"by_door"}},"openingNarration":"opening","decisionId":"door"},
  "limits": {"maxTurns":1},
  "catalog": {"principles":[{"id":"barrier","sourceIds":["nfa"],"when":{"always":true},"review":{"why":"關門可阻隔走廊濃煙。","tip":"在此情境把房門關緊。","eligibleWhen":{"always":true},"priority":1},"normal":{"effect":{"set":{"facts.doorClosed":true}},"narration":"closed"}}],"hazards":[{"id":"open","sourceIds":["nfa"],"when":{"always":true},"review":{"why":"打開房門讓煙進入。","tip":"先處理已知濃煙的隔離。","eligibleWhen":{"always":true},"priority":1},"normal":{"effect":{"add":{"exposure.smoke":2}},"narration":"opened"}},{"id":"fixture_delay","sourceIds":["nfa"],"when":{"always":true},"review":{"why":"時間過去，房門仍然敞開。","tip":"優先處理眼前的風險。","eligibleWhen":{"always":true},"priority":1},"normal":{"effect":{"add":{"exposure.smoke":1}},"narration":"delayed"}}],"channels":[]},
  "beats": [{"id":"smoke_in","at":1,"when":{"always":true},"repeat":false,"normal":{"effect":{},"narration":"beat"},"prevented":{"id":"smoke_reduced","when":{"fact":"doorClosed","eq":true},"result":{"effect":{},"narration":"prevented"}}}],
  "decisions": [{"id":"door","prompt":"走廊有煙，小岑停在門邊，我要怎麼做？","when":{"always":true},"options":[{"id":"close_door","text":"我先把房門關緊，和小岑留在房內。","class":"correct","safety":"safe","sourceIds":["nfa"],"steps":[{"kind":"principle","id":"barrier"}],"cues":[],"effect":{"set":{"npc.roommate.state":"stays_inside"}},"narration":"closed"},{"id":"peek_out","text":"我把房門拉開一點，先確認走廊狀況。","class":"misconception","safety":"unsafe","sourceIds":["nfa"],"steps":[{"kind":"hazard","id":"open"}],"cues":[],"effect":{},"narration":"opened"},{"id":"wait_door","text":"我先留在門邊等通知，再處理房門。","class":"risk_or_delay","safety":"unsafe","sourceIds":["nfa"],"steps":[{"kind":"hazard","id":"fixture_delay"}],"cues":[],"effect":{},"narration":"delayed"}]}],
  "consequences": [],
  "phaseRules": [],
  "endings": [{"id":"fixture_stop","type":"CRITICAL_FAILURE","phase":"afterBeats","when":{"clock":{"gte":1}},"injury":"NOT_ASSESSED","narration":"finish"}],
  "injury": {"score":{"ref":"exposure.smoke"},"noneMax":1,"mildMax":3,"moderateMax":5},
  "review": {"reflectionPrompt":"如果在租屋處遇到同樣情境，我會先確認什麼？"},
  "presentation": {"narration":{"opening":["我聽見警報，走廊飄來焦味。","警報聲從門外傳來，我聞到一股焦味。"],"closed":["房門闔上了。","我把房門關緊。"],"opened":["門一拉開，煙灌入房內。","房門開了，煙猛地湧進來。"],"delayed":["小岑停在門邊，焦味變重。","小岑沒有動，門邊的焦味更濃了。"],"beat":["警報聲仍在走廊迴響。","走廊的警報還沒停。"],"prevented":["門外的警報隔著門傳來。","房門關著，我還聽得見警報。"],"finish":["畫面停在這一刻。","這一段情境到此結束。"],"look":["我看向門邊與窗戶。","我掃了一眼門邊和窗戶。"],"ask":["小岑說，她有些害怕。","小岑低聲告訴我她很害怕。"]},"look":[{"when":{"always":true},"narration":"look"}],"askCompanion":[{"when":{"always":true},"narration":"ask"}],"idle":[{"when":{"always":true},"narration":"beat"}],"status":[]},
  "assets": []
}
```

### Runtime 結算順序

1. 鎖定 `packDigest`、引擎規則版、目前 `decisionId` 和決策出現次序。核對只提交目前顯示過的 `optionId`，以 `inputId` 去重。觀察／問同伴只讀同一狀態並返回原題。無效的提交或取消不耗時間。
2. 先以選題前狀態決定適用 hazard。若致命則寫入危險事件並直接取對應終局，不加時，不執行同題其他步驟。其餘適用危險先結算，並阻擋其 `blocks` 中的步驟。然後依步驟順序處理原則與模擬通報，逐步檢查前置條件，最後在同次 commit 中套用經骨架白名單核准的額外效果。被阻擋或未通過的步驟不能透過選項效果補寫。條件變體取第一個符合項，否則用 `normal`。
3. 跑 `afterActions` 規則。有效行動或明示「先等」選項推進一個時間單位，保留決定前的 `eligibleWhen` 結果，再用行動後事實結算遺漏、亂來和環境後果。錯過是已出現題目提供的機會有明確未達成條件，不以真實作答秒數或退出推定。每種後果同一回合最多計一次。
4. 跑 `beforeBeats` 規則及結局表對應階段。若未終結且未要求 `skipBeats`，依作者陣列順序檢查 beats。 `at` 是最早時間，`after` 以原始 beat ID 的首次時刻加上 `turns`。已預防也記原始 ID、變體 ID、時刻。只讓一個帶 `decisionId` 的事件占用待決位置，其餘延後。隱藏事件無待決位置，可更新已宣告事實。隨後檢查 `afterBeats` 結局。若未結束，優先呈現待決位置指定的有效題目，沒有待決位置才用有序題表。語意驗證拒絕後續事件會令待決題失效的包。
5. 產生結算事件、固定旁白、回顧及可恢復快照。旁白變體依事件出現次數固定輪替，選項顯示順序使用另一個僅限呈現的亂數序列。存檔與重播使用 option ID、實際顯示順序、版本及事件序號。跳轉、重試、模型回傳及圖片載入不會改寫已結算回合。

## 2. 現有兩劇本逐項轉換

表內 `F(key)` 表示 `{"ref":"facts.key"}`，`B(id)` 表示該 beat 的 `firstTurn`。比較、與／或和否定均按 §1 展開。射影類條件放 presentation/review，維持相同優先次序。

### 宿舍火災

| 現有函式／條件 | v1 對照 |
|---|---|
| `freshFacts`、`teaching.eligibleWhen` | 初始表照列。補宣告稍後才寫入的 `npcSmoke=false`。barrier/dial/signal 為消防員未到；stop_roommate 加尚未勸阻；seal_gap 加門已關；room 加電話已接；handoff 為消防員已到。 |
| `question` 與 `questions.map` | 有序決策表：消防員到場 → 最後可見 beat 為 npc_fear 且已表達害怕、未安撫且未完成 reassure → 門未關 → 未通報 → 地址／房號／人數／現況任一缺 → 門縫已出煙且未封 → 電量低且未保持通話 → 等救援。最後可見 beat 用 `beat.lastVisibleId` 比對原始 ID；同一時刻多個可見事件依陣列提交順序決定。題目比對用 ID。 |
| `barrier.when`、`seal_gap.requires/blocked`、報告欄位、`keep_contact` | barrier 要求本次無已採用的危險。seal 檢查門已關，否則顯示固定阻擋原因。四個報告欄位與保持通話都要求 called。通報 119 可在同選項先結算 channel 再填四項。 |
| `stop_roommate.effect`、`reassure.effect`、`check_window`、`signal.effect` | 未勸阻／未安撫時分別發第一回事件，效果才改 NPC 標記，安撫要求已表達害怕。 `signalAt=coalesce(signalAt,turn.nextClock)`。現有觀察可以寫 `windowChecked/met`；v1 固定觀察鍵不變更劇情或計分，若要保留顯式查窗行動，作者安排到正式選項，兩條路徑分開記錄。 |
| `phone.normalize`、`operations` 的未接通／`handoff`／`locatedAt` | 119、110 和其他號碼映射到固定 channel ID，通報口語否定留在文字 adapter。已選報告而未接通且未撥 110 時顯示未執行。消防員到場、無危險且選 handoff 才交接。`called && room && locatedAt==null` 時寫 `turn.nextClock`。兩個函式改成有序 `afterActions` 規則。 |
| `HAZARDS.open/bathroom/smoke/collect/hot_handle`、致命項 | open 只在消防員未到時啟用並清門／封縫。浴室躲避與取毛巾是不同選項。跟隨消防員與自行進濃煙分成兩個 ID，`modelWhen` 的文字例外留 adapter。collect 以 sealed 選取煙暴露 +0／+1，hot_handle 熱暴露 +2。elevator、jump、climb_window、smoke 直接映射各自終局與固定後果。 |
| `npc_opens`、`smoke_in`、`npc_insists`、`npc_fear` | 分別是 `t≥2 && !doorClosed && !npcStopped`（重複數區分第一次與後續、煙 +2）、`!doorClosed && (npcStopped || t<2)`（煙 +1）、`t≥2 && doorClosed && !npcStopped`、`npcStopped && !npcVoiced`。末兩個有待決位置。 |
| `seep_more`、`seep`、`nudge` | seep_more 先判 `t≥4 && doorClosed && !sealed && seepShown && mod(t,2)==0`，煙 +1。seep 後判 `t≥3 && doorClosed && !seepShown` 並置旗；若 sealed 用 `seep_mild` 變體。nudge 為 `t≥3 && !called && !nudged`。陣列次序防止首次 seep 同時觸發追加暴露。 |
| `dispatcher_ask`、`dispatcher_again`、`seen`、`battery` | 首次為 called、有任一報告欄缺、計數 0。追問為 called、缺房號、計數 1，加 `after:{beat:"dispatcher_ask",turns:2}`。兩次各寫入計數 1／2。seen 為 signaled；battery 為 `t≥5 && called && !phoneLow`。 |
| `plan_arrival`、`arrival` | 見下方救援時序。到場要求 `arriveAt!=null && t>=arriveAt && !firefightersHere`，保存 arrivedAt，依有無定位選到場台詞。 |
| 四個 `consequences` | `npc_opened_closed_door`＝未解決室友提議、關門、消防員未到、`t>B(npc_insists)`；`left_barrier_open`＝第 1 回合門開且消防員未到；`unsealed_gap`＝`t≥3`、關門未封、尚無 seep、消防員未到；`no_rescuer_reply`＝消防員到場、無交接、`t==arrivedAt+1`。發生時保留原有煙增量與 NPC 影響。 |
| `settle`、`ending.label/summary/causes`、`debriefSummary` | 已交接且 `arriveAt≤7 && !npcSmoke` 先取安全獲救，其餘已交接取延誤獲救；無危險且到場後第 1 次未答重問並 skipBeats，之後強制延誤獲救。結局標籤／主因依 elevator、其他 fatal、傷勢、npcSmoke 或結果有序選文；`smoke≥2` 加煙暴露原因。傷勢 `sum(smoke,heat)`，門檻 1/3/5。 |
| `npcState`、`look`、`idle`、`answer`、模型輸入與 `checkReaction` | NPC proposal、handled、emotion 由旗標作投影。look 的門、電話、窗外及 NPC 四段可展開為有限狀態對照或受控片段；固定回答與 idle 放入 presentation。模型欄位白名單保留 door/called/消防員等事實，文字驗證留模型 adapter。 |

救援排程等價表示：在消防員未到時依序評估四個隱藏更新規則，每個候選成立時寫 `arriveAt=min(coalesce(arriveAt,candidate),candidate)`。候選為 `locatedAt != null → max(locatedAt+2,6)`、`signalAt != null && t>=signalAt+3 → max(t,8)`、`called && t>=9 → t`、`t>=11 → t`。可在原 `plan_arrival` 的位置展開成四個隱藏 beats，仍在 `arrival` 之前。所有候選未成立時保持 null。驗收應覆蓋補報房號能提前救援，以及先前算出的較早時間不得延後。

### 學校地震

| 現有函式／條件 | v1 對照 |
|---|---|
| 初始表、`P`、`eligibleWhen` | 初始表補後寫入的 `assembly/stayedGroup/npcHurt/leftGroup/assisted=false`、`separation=0`。cover/stop_npc/wait 的機會為主震；reassure 為 npcVoiced；aftershock_cover 為餘震且搖晃；head/orderly/stairs 為路線可用且未到戶外；open_area 為戶外未集合；stay_group 為集合未點名；roll_call 為已點名。 |
| 各原則 `when/requires/effect` | cover 主震；stop_npc 首次發 handled；wait 寫 waited；reassure 要先表達害怕，首次才發情緒事件；aftershock_cover 要餘震；head/orderly 要 routeReady 且未到戶外；stairs 要路線可用且不搖晃，否則固定阻擋說明；open_area 要戶外且未點名；stay_group 要集合；roll_call 要點名。look 走觀察鍵，dial 由固定通報 channel 處理。 |
| 各 hazard `when/effect/blocks` | jump_window/elevator/wire 對應獨立致命終局；只在有對應場景的題目提供選項。rush_open 限搖晃，餘震 trauma +2、主震 +1，阻擋 cover/aftershock_cover/stairs/通報；triangle 限搖晃；collect 限非主震；pushing 限非主震且未到戶外，阻擋 orderly/stairs/通報。后三者 trauma +1 且 delayed。 |
| `main_shaking`、`companion`、`main_stops`、`aftershock` | 分別在 t=1（已掩護的 prevented）、t=1（已勸阻的 prevented，兩路都 npcVoiced）、t=2（waited 的 prevented，兩路皆停止主震）、t=2（開啟餘震且需決策）。 |
| `route_ready`、`outside`、`assembly`、`gather` | 最早 t=3/4/5/6，且各自在前驅 aftershock/route_ready/outside/assembly 之後至少 1 回合。變體分別取 aftershockCovered、usedStairs、inOpenArea、stayedGroup。outside 在 usedStairs 分支再按 headProtected 與 orderly 選兩組旁白，可用有序覆寫展平。gather 記原始 ID 與 `gather_in_group`。 |
| `impact`、主震／同伴後果 | `missed_cover`＝t=1 未掩護且不是 rush_open（trauma +1）；`invited_npc`＝主震邀同伴且 NPC 未傷；`missed_npc`＝t=2 未勸阻且 NPC 未傷，兩項都設 npcHurt；`missed_main_cover_again`＝t=2 仍未掩護（+2）。可保留兩個舊事件 ID，映射同一升級序列做回顧。 |
| 餘震／疏散後果 | `missed_aftershock`＝餘震搖晃、未重新掩護且不是 rush_open（+2）；`missed_stairs`＝路線可用、未到戶外、沒走樓梯且不是 pushing；`missed_order`＝走樓梯、未到戶外、沒守秩序（+1）；`missed_route`＝已到戶外、未開始集合且未到空地（+1），依 phone_play cue 選旁白。 |
| 集合／點名後果 | `left_group`＝戶外、本輪有離隊 cue 且尚未離開；`missed_group`＝集合未點名、未留下且本輪沒有離隊 cue；`missed_roll_call`＝已開始點名且 t=7 未答；`search_delay`＝t≥8 未答，設 assisted，依 trauma 是否大於 0 選旁白。上述與其他沒有 trauma 的 `impact` 加 separation +1，所有 `impact` 設 delayed。 |
| `scenePrompt`、`prompts.map`、`npcState/status` | 有序題表：點名 → 集合 → 戶外 → 動線可用 → 餘震 → 已表達未安撫 → 已勸阻 → 開場。現有集合題的選項清單為空，需新寫 3–4 個審查選項。NPC、狀態列由旗標投影，固定問答和觀察按 rollCall/outdoors/shaking/routeReady 的既有優先次序給文案。 |
| `finish`、`injury.score`、回顧函式 | 先比對 counted 且本回合無危險，再以 delayed 分安全或延誤撤離。次序第二是 t≥8 且 assisted 的延誤撤離。傷勢只算 trauma，門檻 0/2/4。 `debrief.rush_open` 用當事件 trauma 增量>1 分餘震；標籤、主因和傷害原因按 elevator、其他 fatal、傷勢、npcHurt/assisted 或結局的既有順序查表。 |
| `protect`、`fallback`、`phone.literal`、`cues`、`checkReaction` | 規則文字流程留原 adapter。邀同伴、滑手機、離隊改由核准選項帶 cue。模型可引用經確認的原始事實與行為證據；旁白不允許憑空承諾聯絡家人、提前下樓、到操場或點名。 |

### DSL 表示不了的部分與處理

- **語言行為**：兩個劇本的 regex、否定／條件意圖、口語報案、原文證據查找、提示詞建構與旁白文字檢查，放在 GPT／Gemma／舊文字 adapter 或程式本身。它們的輸出只是當前題目的候選 ID 式提議。包格式禁止塞入 regex 或模型 prompt。
- **把任意文字函式搬進包**：旁白串接、多事件回顧排序和引用截句用通用 presentation/review 模組。回顧作者只提供文案與來源，選擇題回顧引用既有選項文字。維持單一關鍵轉折、最高三則危險與不重複改善項。
- **已審語意和歷史瑕疵**：多動作語句要拆成合適的同題選項與步驟序列，需要題目作者判斷。原火災 `collect` 在已封門縫時可沒有煙增量，旁白卻仍寫煙變多。固定文案分兩個變體，標記為呈現修正。舊學校 `outside` 與 `gather` 的相隔回合、雙階段 fire `settle`、決策順序不得平移成單一結局查表而改變本意。5.1 建「等價、刻意調整、待確認」對照向量，實作時按該表驗收。

## 3. 選擇題與操作

- 每題 3–4 個實際情境選項，至少各有一個正確、常見迷思、危險或延誤。多出的選項可為合理但不完整。教學類型與安全標記分開，有些不完整選擇仍可安全。全用第一人稱，長度相近，錯項有現場理由，避免搞笑或靠句長猜答案。
- 每次題目出現洗牌一次，同一畫面重繪與程式重啟沿用該次順序。研究版保存 seed 或實際排列，重來另開 attempt 並寫入新排列，分析首答時辨別是否已見過同題。
- 「先看看四周」「問同伴」固定放在選項旁，以目前 facts 選固定文案，兩鍵不耗時間，不計作答且無遊戲狀態副作用。如要跟同伴分工、請他真的做事，必須選正式行動。
- 「其他（自己輸入）」為額外的輸入入口，不占 3–4 個計分選項。連網且使用者同意時走既有 GPT 裁判 adapter，離線用實驗性的 Gemma 4 adapter。兩者都回傳穩定候選選項 ID 或 abstain，原規則／證據驗證通過且玩家確認明確的選項後，仍走同一狀態機。置信不足、過期、找不到等價選項或模型不可用時，保留目前題目並請玩家改選。正式實驗是否開放由組別固定，預設關閉。
- 演練過程只呈現後果。回顧要能從精確的選項、直接後果、改善行動及其來源說明關鍵轉折。重來由玩家主動選擇，恢復關鍵轉折前的快照並保留 sessionId，另記 attempt。

## 4. 兩端執行與 Gemma 4

| 模組 | 介面與責任 |
|---|---|
| Android Kotlin pack runtime | `loadVerifiedPack → start → observe/ask 或 submitChoice → debrief → retry`。Kotlin 是手機上的結果權威。驗證、保存、狀態機與 Compose 呈現可各自測試，飛航模式不需要後端。 |
| Web JS runtime | 保留原 `director-engine.js` 作歷史對照。增加讀同一份 pack 的 JS 參考 runtime，給作者預覽和 CI。Web 不依賴 Android runtime 或 LiteRT-LM。 |
| 共用向量 | 同一 `schemaVersion`、pack digest、選擇序列與預期狀態，逐回合比對 canonical JSON 與事件順序。時鐘、facts、exposure、NPC、完成原則、事件、後果、結局、傷勢皆比較。顯示亂數、原文、實測秒數及生成文字排除於狀態等價斷言。 |
| LiteRT-LM Android Kotlin | E2B 優先，E4B 由可用裝置與明示設定啟用。模型在決策結算後才能讀取經核准的事實和敘事片段，輸出僅供潤飾。回顧問答使用口袋知識庫同版核准來源卡，逐條核對引用與適用條件。取不到、逾時、取消、品質不合格或缺模型時，即時用固定旁白／原文卡。 |
| 現有 llama.cpp 元件 | 過渡期並存，保留目前的 `LocalLlmEngine`／`NativeLlamaBridge` 舊流程方便回歸。選擇題主路徑用獨立 LiteRT-LM adapter，復用狀態、取消與錯誤對接概念，模型檔和 native runtime 各自管理。同裝置同一時間只載一套生成模型。等裝置驗收後再決定是否移除舊 runtime。 |

模型潤飾僅能重述已結算事實，要求第一人稱、繁中、可證據核對，禁止新增行為、傷勢、醫療判定或後果。潤飾與自由文字提議互相隔離，照片辨識是準備階段的第三條獨立路徑。所有非同步回傳綁定 pack digest、session、attempt、decision occurrence 及 requestId，晚到或跨模式結果丟棄。Gemma 4 E2B/E4B 與 Kotlin 支援以官方文件為據，手機實際可用性留待 5.3。 [Gemma 4 官方指南](https://developers.google.com/edge/litert-lm/models/gemma-4) · [LiteRT-LM Kotlin 指南](https://github.com/google-ai-edge/LiteRT-LM/blob/main/docs/api/kotlin/getting_started.md)

共用向量格式示意，使用 §1 的測試包，正式向量再補整個 state 投影和審定結局：

```json
{
  "packId": "drill_fire_dorm_fixture",
  "packVersion": "0.1.0",
  "input": [{"decisionId":"door","optionId":"close_door"}],
  "expects": [{"clock":1,"facts":{"doorClosed":true},"exposure":{"smoke":0},"npc":{"roommate":{"state":"stays_inside"}},"beats":[{"id":"smoke_in","variantId":"smoke_reduced","at":1}],"ending":"CRITICAL_FAILURE","injury":"NOT_ASSESSED"}]
}
```

測試包的硬終止是結構測試收場；正式火災救援與地震撤離用完整審定包另驗。向量繫結 digest 與 evaluator 版。其他必驗：首次火災延誤逐級、補報提前到場、地震主震／餘震差異、未回應點名、致命不加時、回顧後重來、排序改變仍同結果、觀察問答零副作用、重複送出不重複結算。

## 5. 線上準備、驗證與發布

1. 取得已審骨架的版本與可改欄位。GPT 回傳結構化候選，只填地點、人物、容許調換的事件順序與誤導選項文案。順序只在同一優先層、保持 `after`、安全前置與因果的已列候選內調整。誤導選項沿用已核准的 misconception/hazard ID 與後果，模型不改效果、正解、來源、傷勢門檻、核心題目或結局。
2. 需要圖片時，經同意拍照後先用手機上的 Gemma 4 做離線視覺辨識，只產生作者可驗證的候選。模型不相容或偵測不確定時，允許不拍照、用固定圖或人工描述。災難示意圖由連網準備 API 產生。v1 只送刪減後的描述；v2 原照上傳須待知情同意條款確定，並獨立明示確認，先去除 EXIF，提醒避開人物、地址等個資，採最小範圍與明確保留期限。
3. Validator 依序驗 JSON schema、封包大小和資產摘要，再驗 ID、欄位型別、效果權限、決策覆蓋、結局唯一性、時間軸依賴、可達性、官方來源版本與適用條件。正確選項由已審骨架的原則 ID／原文條件核對。變更文字需來自白名單模板或通過人工查核，不能只以另一個模型評分作發布依據。拒絕不合規內容、把迷思冒充正解、個資、以及與情境真值矛盾的生成圖。
4. 通過才由可信發行端打包。v1 不做簽章，手機先暫存並對可信清冊核對 schema、SHA-256 digest、資產和空間後再原子啟用，新版失敗保留仍有效的版本。選擇題執行不連網補資料，可用已下載的包或預載經審固定包。正式實驗使用固定包，已審變體供實驗後自主練習。

## 6. 研究指標與紀錄

| 指標 | 運算 |
|---|---|
| 首次決策安全率 | session 首次有效作答中，每個首次出現的決策 ID 只計一筆，分子為已採用的 `safety=safe`，分母為有有效首答的決策數。初次未答、退出、無法判讀另記，不放入分母。重來的答題另做修正分析，不覆蓋初始資料。 |
| 致命錯誤次數 | 觸發致命結局的已採用選擇次數，以實際結算事件去重，同時記 attempt 及 session 累計。純提問、取消、模型建議均不計。 |
| 重來後完成率與結局 | 分母為實際啟動的重來 attempts，分子為依骨架到達完成型結局的 attempts。危急失敗、退出與未完各自列出，同時保存 ending type、injury 與耗時，不將所有終局合併為成功。 |

每筆記錄 pseudonymous `sessionId`、`attempt`、`decisionId`、`occurrence`、`optionId`、`displayOrderOptionIds`、單調鐘計算的 `responseTimeMs`、`inputSource`（choice/other_gpt/other_gemma）、實際採用步驟、是否安全／致命、事件與結局、包及評分器版本、fallback 和重來來源。作答時間自選項首次可操作到確認，另記背景暫停與觀察／問同伴耗時供分層，絕不用真實秒數推進劇情。預設不保存照片、原始自由輸入、模型全文或憑證。口袋知識庫查詢使用獨立模式與查詢紀錄，不能指向可寫的演練狀態。

## 7. 已定事項、風險與待確認

- 正式實驗使用固定情境包，變體僅用於實驗後的自主練習。
- 正式實驗預設關閉「其他（自己輸入）」，另做小規模測試。
- v1 只上傳刪減後的場景描述；原照待知情同意條款確定後才納入 v2。
- v1 用可信清冊鎖定 SHA-256 digest 檢查完整性。簽章列為後續選項；digest 無法單獨證明發行者。

- **硬體與下載**：Google 公布的 LiteRT-LM 模型制品列表中 E2B 約 2.58 GB，E4B 約 3.65 GB；這些是檔案大小，裝置效能、RAM 和安裝空間另測。記錄確切工件、量化、digest、runtime、ABI 和 CPU/GPU 後端。模型不進 APK，規劃 Wi-Fi 下載與續傳，下載前顯示所需空間，核對 hash／授權後才啟用。缺模型也能玩。 [Google 官方模型清單與測試環境](https://developers.google.com/edge/litert-lm/overview#supported_models)
- **繁中品質**：用台灣口語測敘事、三到四句易混淆選項、拒絕／提問、否認及有條件指令。測固定場景涵蓋中階裝置的冷暖啟動、首字與完成時間、記憶體、熱、耗電及取消。裝置門檻和 Gemma 4 繁中驗收值待試點後定，先封住新增事實或錯引的發布路徑。
- **照片與研究資料**：外傳照片、手動下載、裝置存檔、刪除同步與研究使用分開取得同意。預設不送原圖，固定圖片替代不影響實驗完成。AI 圖不作為現場安全事實或模型判分依據。
- **待確認**：目標驗收手機、模型發放方式與 E4B 的放行條件。

## 8. 分階段計畫

5.1 的發行清冊、schema 與共用向量位於 `web-pwa/scenarios/choice/`。瀏覽器先核對包摘要，再驗證結構與語意。發布測試另用 `verifyReachability` 遍歷固定包的選擇分支，拒絕不可達的題目及結局。新生成的內容、資產准入與來源適用性審查依 §5 後續實作。 [步驟 5.1 驗收報告](STEP_51_REPORT.md)

| 階段 | 交付與驗收 |
|---|---|
| **5.1 資料契約與移植** | 固定 schema 與 DSL v1，以現有宿舍及學校劇本完成條件、來源、結局逐項對照。兩包通過 schema/語意 validator，涵蓋正確、延誤、致命與重來；歷史等價或刻意差異有對照 fixture。 |
| **5.2 離線選擇題主路徑** | Kotlin pack runtime、Compose、Web JS 驗證器和同一組 vectors。兩端逐回合狀態／終局／傷勢一致。Android 飛航冷啟動、無模型能完整玩兩包，關閉後恢復、兩個免耗時按鈕、排序和重來都驗證。 |
| **5.3 Gemma 4 與知識庫** | 在目標 ARM64 手機運行確版 E2B，完成同版來源卡及固定文字備援；E4B 另做可用性驗收。有效輸出無新增行動／結果，錯引、過期、取消、缺檔與低記憶體均可安全降級。實驗性「其他」用保護與等價選項測資單獨評估。 |
| **5.4 線上準備與圖片** | 同一骨架產生至少兩個不同且合法的變體，違反因果、捏造正解或未知 ID 的候選一律被擋。拍照辨識可在受支援裝置離線運行；拒絕上傳、逾時或圖片失敗仍能使用固定包，雙端結果不變。 |
| **5.5 研究驗收與釋出** | 用合成 log 重算三項指標，核對退出與未答分母、排序、作答時間與重來世代。鎖定正式實驗的包與模型版本、同意與留存設定，跑實機飛航驗收和目標裝置測試。單獨留存模型／API 實測以補工程驗證，計畫不以舊 API 或合成結果作新版本實測。 |
