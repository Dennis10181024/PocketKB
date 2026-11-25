# iPhone 16 Pro 原生版可行性

截至 2026-11-26。工時為一位熟悉專案的開發者之粗估，含基本測試，依簽署、模型與實機結果調整。劇情與實驗用途為草稿，待人工審查。

| 方案 | 設備與前置 | 工時粗估 | 風險和驗收 |
| --- | --- | --- | --- |
| PWA | 現有 Windows、iPhone Safari、取得可信任 HTTPS 的靜態來源；快速區網試玩可用 HTTP | 試玩入口已開發；HTTPS 設定與 iPhone 驗收另估半天至一天 | 先載入情境資源，才能用飛航模式重開試玩。另測「加入主畫面」、儲存空間清除與 iOS 後台關閉。旁白用情境包固定文字。 |
| SwiftUI ＋ LiteRT-LM Swift | 可跑新版 Xcode 的 Mac、實機 iPhone 16 Pro、簽署與 App 散佈方式。LiteRT-LM Swift API 上游標為 Early Preview | 不帶模型的選擇題原型約 5–8 人日；接模型、下載管理、研究匯出及門檻實測約再 5–10 人日 | 以共享 vectors 對照 Swift 的 DSL、傷勢與重播；確認 Gemma 4 E2B 能在目標機型載入、實測記憶體與電池，模型失敗仍能走完情境。E4B 另外評估。 |
| Kotlin Multiplatform ＋ SwiftUI 或 Compose Multiplatform | Mac、Xcode、iPhone。將可共用邏輯抽到 commonMain，再接 iOS 儲存、模型與生命週期 | 抽取及雙端 vectors 約 5–10 人日；iOS 畫面、簽署、測試約再 5–10 人日 | 可共用純規則；Android 的 Room、模型 JNI、權限與資產載入須逐一處理。LiteRT-LM Android Kotlin API 對應 JVM／Android，iOS 經獨立橋接。 |

目前 checkout 內的 Swift 檔案可作原生開發起點。根目錄 `PocketKBApp.swift` 的 SwiftUI 入口、導覽與 `DesignTokens.swift` 可參考。現有導覽要求模型就緒才允許進演練，選擇題版需把模型改為選用能力。`Views/DrillView.swift` 是舊對話 UI，可沿用畫面元素。`Models/LlamaInference.swift` 匯入 `llama`，`Models/HybridRAGEngine.swift` 匯入 `OnnxRuntime`。工作樹查無可直接以 Xcode 或 SwiftPM 建置這個 App 的專案描述。iOS 原生建置、依賴相容性、Gemma 實機表現均尚未測試。

目前先以 PWA 給組員驗收。若研究需要在 iPhone 上比較本地模型，優先做 Swift＋LiteRT-LM 的單機驗證，先跑固定情境包的 vectors，再驗證單一 Gemma 4 E2B 模型。

- [Apple 安裝 Xcode 與 iOS 模擬器](https://developer.apple.com/documentation/safari-developer-tools/installing-xcode-and-simulators)
- [Apple iPhone 將網站加入主畫面](https://support.apple.com/en-mide/guide/iphone/iph42ab2f3a7/27/ios/27)
- [Google LiteRT-LM 上游平台與 API 狀態](https://github.com/google-ai-edge/LiteRT-LM#-supported-language-apis)
- [JetBrains Kotlin Multiplatform 入門](https://kotlinlang.org/docs/multiplatform/quickstart.html)
- [MDN Service Worker 安全環境要求](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
