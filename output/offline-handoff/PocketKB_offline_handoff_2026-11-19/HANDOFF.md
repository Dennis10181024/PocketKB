# 組員工程交接

## 已有內容與實際入口

| 部分 | 路徑（相對 source/） | 實際能力與限制 |
|---|---|---|
| Android 語料／緊急指引 | android/app/src/main/java/com/pocketkb/android/core/KnowledgeBase.kt | 24知識、5緊急指引、15來源；本輪匯出為JSON，沒有改寫原文 |
| Android 本機檢索 | android/app/src/main/java/com/pocketkb/android/core/RagEngine.kt | 中文單字／雙字與拉丁詞的 BM25式排名；不是語意向量索引 |
| Android 查詢UI | android/app/src/main/java/com/pocketkb/android/ui/AppScreens.kt：ResourcesScreen | 共用知識庫、分類、自由文字搜尋、展開原文及來源 |
| Android 災時卡片UI | 同上：EmergencyScreen | 既定緊急步驟；不是完整災時多輪AI代理 |
| Android 對話協調 | android/app/src/main/java/com/pocketkb/android/PocketKbViewModel.kt | 舊對話可檢索及組提示；實驗性本地LLM預設關閉。新版六情境使用各自狀態機，不能說都在用此RAG |
| 本機模型整合原始碼 | android/app/src/main/java/com/pocketkb/android/ai/ 與 cpp/ | 有相關包裝；未交付模型、原生函式庫或本輪裝置驗證 |
| Swift 語料 | Models/KnowledgeBase.swift | 14筆舊知識、14個提示詞情境、5緊急指引。知識結構沒有逐筆source欄位，不與Android合併去重 |
| Swift 查詢／災時UI | Views/GuideView.swift、Views/EmergencyGuideView.swift | QuickGuideView / EmergencyGuideView；AI入口與模型狀態相關 |
| Swift 對話 | Models/AppState.swift | drill / emergency / guide 訊息分開，檢索共用HybridRAGEngine；不代表新版產品已統一 |
| Swift 混合檢索 | Models/HybridRAGEngine.swift、Models/VectorStore.swift | BM25＋ONNX／RRF及SQLite程式。缺模型／vocab可回退BM25；中文模型實跑品質本輪未驗證 |
| Swift 本地推論 | Models/LlamaInference.swift | llama.cpp包裝；硬體與推論品質未驗證 |
| 原有Web | web-pwa/app.js、styles.css、index.html | 3筆知識與舊網頁查詢；不能把它當成24筆完整共同RAG介面 |
| 六新版劇本 | web-pwa/scenarios/、fire-engine.js、scenario-engine-v3.js | 狀態機與JSON可作情境背景、風險限制參考；不要把虛構劇情當真實災情文件 |
| 可選線上原型 | online-coach/ | 僅為完整依賴參考；離線工作不必啟動、不可依賴雲端才有答案 |

## 目前沒有完成的部分

- 沒有已整合的新版本「模擬與離線輔助完全相同查詢介面」。
- 沒有可據本輪證據聲稱完成的 Android 向量RAG＋本地LLM災時多輪輔助。
- JSON匯出不是來源准入，也不是內容校正；知識與舊Swift內容仍需專業審查。
- 部分通用提示帶有演練裁判語氣，不能直接當作災時輔助system prompt。
- 固定緊急卡片不等於能判斷真實個人環境；無法確認地點、路況、電源安全或傷勢時，必須保留未知。

## 建議接手順序

1. 以Android 24筆匯出作**待審查候選語料**，保留Swift舊版供比對；不要合併相同ID的不同原文。
2. 先完成資料准入：逐條claim、官方段落／頁碼、日期、適用條件、授權與reviewStatus。8筆本機教材摘要另確認使用權。
3. 建立同一個查詢元件／同一retriever；模擬與災時模式只在外層注入context，不另外複製UI。
4. 先交付可用的離線原文查詢與來源卡，再把通過審查的片段提供給本地模型生成；沒有命中時不臆造回答。
5. 演練動作仍由唯一FSM決定；RAG查詢與AI回覆不可直接寫入演練state。
6. 最後才測設備上的語意檢索、生成、耗時、斷網及實驗介面一致性；數字只來自實跑log。

## 實驗一致性提醒

兩組至少固定：查詢欄位、入口、原文卡、來源展示、可查語料版本、檢索參數與回答不可得的呈現。若使用者想研究AI輔助效果，生成層是否出現應是明確的實驗操弄，而不是順帶更換知識庫或搜尋UI。若需scenario category filter，兩組須採同一套、並記錄filter；不要在其中一組默默回傳分類前三筆作為「檢索命中」。現有 scenarioAwareRetrieval 有同分類fallback，須與自由查詢區分。

本包是交接素材，不含對方Flutter專案的實際移植；Dart schema與元件介面尚待雙方確認。
