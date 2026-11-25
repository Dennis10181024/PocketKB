# PocketKB 情境包撰寫指南

草稿，待人工審查。目標讀者是要新增防災選擇題劇本的組員。以 `web-pwa/scenarios/choice/schema-v1.json` 與實際執行器為準。情境包是共用 JSON 資料，Web 與 Android 不各寫一份。

## 1. 先確定使用範圍

從現有包找一個相近的結構，建立新的 `<scenario>-draft.json`；設定穩定的情境 ID 與獨立版號，`meta.status` 必須為 `draft`。Android 與 Web 只在勾選「顯示草稿情境」後列出。開場用第一人稱交代地點、時間、身分及同伴。若有受傷、受困或攻擊內容，另填清楚的 `meta.contentNotice`，保留跳過與停止。標題及題幹不先透露正解。

先查官方來源原文，記下機關、頁名、URL 與能支持的原則。包內填 `meta.sources`，在每個原則、危險步驟、後果和選項使用實際引用 ID。官方原則不足以支持特定受傷情節或時間機率時，將該情節記為合成教學分支。無法證實的安全建議先移出計分選項並列「待查證」。劇本放進選單前仍需人工審查。

## 2. JSON 區塊

| 區塊 | 要填的內容 |
| --- | --- |
| `schemaVersion`、`meta` | 目前 schema 為 1。包內另有 `version`、`skeletonVersion`、情境 ID、標題、災種、來源與草稿狀態。 |
| `initial` | 已宣告的 facts、NPC 欄位、各暴露項目初值，首題與開場旁白 ID。 |
| `catalog` | `principles`、`hazards` 和 `channels`。各步驟備 guard、效果、來源與說明。致命 hazard 指定 `fatalEndingId`。 |
| `decisions` | 具體的情境問題、出現條件、3–4 個選項。各選項使用穩定 ID、`class`、`safety`、`steps`、`sourceIds` 與旁白。 |
| `beats`、`phaseRules` | 事件最早的 `at`、相對 `after`、條件與是否可重複。沒發生的 beat 不可用作已知時間。先試 `prevented`，再按既定順序試其他變體。 |
| `consequences` | `missed`、`reckless`、`world` 的確定性效果。階段依計數升級。只新增直接由本步造成的傷勢、事實或延誤。 |
| `endings`、`injury`、`limits` | 同一階段由前往後取第一個符合條件的結局。在上限內每條路徑都需有終點。由引擎用事件紀錄分級。 |
| `presentation`、`review` | 事件至少兩種已撰寫的固定旁白；觀察與問同伴只提供線索。回顧提供 `why`、`tip`、`eligibleWhen`、`reflectionPrompt`。 |

## 3. 條件、事件與傷勢

用純資料 DSL。這個條件要門已關，且時序至少處理了三回合：

```json
{"all":[{"fact":"doorClosed","eq":true},{"clock":{"gte":3}}]}
```

用 `{"has":{"set":"seenBeats","id":"radio_notice"}}` 判斷前置事件，或設定 `"after":{"beat":"radio_notice","turns":1}`。可用 `all`、`any`、`not`、`compare` 與 `eq/ne/gt/gte/lt/lte`；完整參照與運算見架構文件第 1 節。只讀合法 facts、NPC、暴露、事件與回合欄位。 `effect.set` 用於已宣告的 facts／NPC 欄位，`effect.add` 只增加非負整數暴露值。結局、實際時間、亂數與模型輸出不能當成任意程式去操作。

- 一個教學失誤的一個受傷事件，給 `injuries` 穩定 ID、當事者、具體中性名稱及等級 `MILD/MODERATE/SEVERE`。同一直接或累積來源用清楚的條件控制，避免重複將同一事件當兩處傷勢。
- 正常與延誤終局用 `fromInjuries`：只以 `subject: "player"` 的最高已結算傷勢分級，沒有玩家傷勢為 `NONE`；同伴獨立列出。立即危急終止用 `NOT_ASSESSED`，保留先前確實發生的事件。 `exposure` 可觸發具體傷勢／後果，數值本身不替代實際傷勢清單。
- 後果要有前情與直接因果，例如路線遭阻使撤離延誤。回顧選需當時有機會完成的事項，避免用別回合的傷勢解釋本題錯誤。合成傷勢資料用於教學回饋。

## 4. 題幹、線索與干擾選項

- 一題保留 3–4 個自然且可比較的第一人稱選項，至少各有一個正確、常見迷思、危險或延誤；若有不完整選項，文字呈現合理的做法，靠少一步區別並填 `missingStep`。 `class` 表示教學判定，`safety` 表示安全性，兩者各有用途。
- 迷思或危險應有讓人考慮的理由，例如走道另一端看得見照明、聽到有人叫自己，避免為了湊選項編造情境中不存在的物件。每個選項文字與使用的 principle／hazard 一步步核對，至少兩個看起來可行。
- 題幹可交代玩家當下看到或聽到的相關事實。關鍵物品如果只有正確選項照詞原樣引用，人工確認有沒有成為提示。可用與兩種看似可行做法有關的現場線索，別為了平衡提示加入不存在或無意義的物品。
- 所有選項禁用自我揭露性的文字，例如「沒有」「只」「暫時不」「不做其他」「先不」。一題字元差與剔除標點後的實字差皆不得超過 4。
- 同一題最長或可見動作最多，只要正確選項並列極值也計入；最長、實字最多、動作最多的比例各不得超過 35%。既有基準情境合計檢查，草稿逐包檢查，全部再合計檢查。草稿也檢查最短及實字最少，避免從反向猜題。
- `online-coach/test/step51b-option-audit.json` 為每個選項保留原文與 `visibleActions`。計數採玩家看得見且可各自作出的動作，緊密相連的物理子步驟可視為同一動作。不要用 `steps.length` 代替；改字要重新對照原文及計數。

## 5. 登記與驗證

1. 在 `manifest.json` 同步 ID、檔名、標題、草稿狀態、提醒及檔案位元組的 SHA-256。包檔採 UTF-8、LF，避免換行轉換使摘要改變。選單從 manifest 讀取。Android 建置同步同份目錄。
2. 在 `test-vectors.json` 加入相同摘要與四條手寫預期：全對、逐步升級、致命、轉折重來。必要條件另加檢查點。終局預期包含時序、結局、傷勢及暴露；重來要驗證原 sessionId、attempt 和指定決策狀態。用獨立預期驗證引擎，不能把引擎第一次輸出直接當正解。
3. 補選項動作註記，執行下列驗證。JS 產出的 parity 預期供 Kotlin 逐回合對照，須先確認 vectors 再重建。

```powershell
node scripts/pack-lint
node online-coach/test/step52-parity.js
node --test online-coach/test/choice-pack.test.js
```

再執行 Android 的 `gradlew.bat :app:testDebugUnitTest --offline`、裝置測試及 Web 試玩；更新 `web-pwa/play-sw.js` 的資產快取版本和舊入口的 `web-pwa/sw.js` 快取版號。若加入的包先當草稿，在 Web 與 Android 各確認一次預設隱藏、可開啟、可離線載入。

`pack-lint` 會驗證來源格式與准入網域。頁面是否可開啟、發布日期及原文含意需另查。提示用詞報告是人工審查線索，來源能否支持各個安全行為、干擾項是否合理與受傷敘事是否恰當仍須個別審查。 [人工審查清單](CONTENT_REVIEW_CHECKLIST.md) · [離線架構](OFFLINE_CHOICE_ARCHITECTURE.md)
