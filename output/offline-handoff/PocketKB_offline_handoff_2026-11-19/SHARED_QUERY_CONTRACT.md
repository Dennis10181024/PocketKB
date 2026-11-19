# 共同查詢介面契約（提案，未實作於產品）

## 單一資料與單一元件

```text
演練頁 ───────┐
              ├─ SharedKnowledgePanel ─ OfflineRetriever ─ 同版本本機語料
災時輔助頁 ───┘          │
                        └─ 可選 LocalAnswerGenerator（只能讀取已核准hits）
```

Flutter可實作成同一個Widget；本包提供的Compose／SwiftUI／Web是參考來源，不可稱為現成Dart元件。

QueryRequest:
`requestId, query, corpusVersion, topK, categoryFilter?, context{mode, scenarioId?, observedFacts?}`

QueryResponse:
`requestId, corpusVersion, retrieverVersion, status(hits|no_match|unavailable), hits[{chunkId, title, content, score, matchedTerms, sourceIds, reviewStatus}]`

Source:
`sourceId, agency, title, urlOrBibliography, publicationDate?, checkedAt?, supportingExcerpt?, page?, licenseStatus, reviewStatus`

Answer（可選）:
`text, citedChunkIds, citedSourceIds, missingConditions, generationStatus, modelVersion`

所有欄位為建議，不代表原產品已實作。handoff-1 JSON保留原欄位與NOT_REVIEWED狀態，不虛構出版日期／支持段落。

## 行為規則

- 原文查詢可在無模型、無網路下操作。來源URL可顯示，但點開可能需要網路；關鍵摘錄須隨核准語料本機保存。
- 所有模式使用同一個query輸入、分類與來源元件。mode不是另一份UI。
- 同語料、參數與問題須產生同一排序；同分採固定順序，記錄版本與filter。
- topK限制、空查詢、無命中、來源缺失、模型不可用都有明確狀態；不把同分類任意三筆假裝成相關命中。
- 生成器只使用准入片段；本包未審語料不應直接投入正式災時生成。來源不足時明示無法確認。
- 模擬的虛構路況與現實災情分開。檢索是read-only；AI不得宣告已救援或自行推進FSM。
- 不以未經確認的現場條件推導開關電源、路線可通行等結論。
- 不把舊的「嚴格演練裁判」提示直接用於真實災時協助。

## 接手驗收（待執行，不是本包測試成績）

1. 模擬與離線輔助兩入口引用同一元件與語料版本；固定問題的hit ID／來源一致。
2. 飛航模式冷啟動、無模型、無命中仍可操作原文查詢。
3. 有模型時回答可追溯到核准片段；未知現場條件不被補寫。
4. 查詢與生成失敗不改動劇情狀態。
5. 記錄輸入、版本、hit ID、filter、延遲及錯誤；不得記錄憑證。
6. 逐項測大字、來源展開、閱讀器標籤與返回行為。
