# 防災 Edge Intelligence Android 版

這是大專生研究計畫的 Android 研究原型，目標是讓使用者在手機上進行防災知識查詢、情境演練與演練紀錄分析。現階段採用「雙模式」定位：平時有網路時可接線上 AI 教練強化教學回饋；災時或離線時則以本地知識庫、BM25/RAG 檢索、規則式安全裁判與應急指南確保穩定可用。

## 雙模式架構

### 離線應急模式（目前 Android 核心）

設計理念是穩定、快速、可信，不追求手機端生成式 AI 的自由對話能力。

- 不依賴網路即可使用。
- 不自動載入本地 GGUF/LLM，避免中階手機卡頓或記憶體壓力。
- 使用內建官方知識庫與 BM25 本地檢索。
- 使用規則式安全裁判處理情境演練。
- 應急指南與演練回饋會顯示官方來源。
- 演練紀錄保存到 Room/SQLite，供後續研究分析。

適合情境：災時查詢、離線應急、課堂展示、研究實驗中的穩定流程。

### 線上 AI 教練模式（後續加值方向）

設計理念是提升平時訓練的互動品質，而不是取代離線安全裁判。

- 有網路時可接雲端 LLM。
- AI 只根據規則裁判結果、官方資料與情境狀態生成教練式回饋。
- AI 不負責判定安全與否，避免高風險情境中的幻覺問題。
- 可用於長版演練報告、個人化反思問題、劇情敘事強化。

適合情境：平時訓練、課堂互動、研究介入中的反思回饋。

## 與大專生計畫書的對應

| 計畫書目標 | Android 目前定位 |
| --- | --- |
| 離線知識庫 | 已內建官方資料摘要與來源欄位。 |
| 離線 RAG | 已實作 BM25 本地檢索，災時不依賴網路。 |
| 情境式對話演練 | 已實作核心情境、倒數決策、規則式安全裁判。 |
| 手機端 SLM/LLM | llama.cpp native runtime 保留為實驗選項；主流程停用，避免中階手機卡頓。 |
| 災時查詢 | 已提供應急指南與知識庫查詢，回覆不依賴模型生成。 |
| 對話紀錄分析 | 已保存回合數、字數、完成率、逾時、致命錯誤與安全等級。 |
| AI 個人化回饋 | 規劃放在線上 AI 教練模式，AI 不作安全裁判。 |

可在報告中說明：原計畫規劃手機端量化模型完整離線生成；實測後發現中階手機長時間本地推論可能造成卡頓，因此將災時核心改為更可靠的本地知識庫、RAG 檢索與規則式安全裁判。此調整仍保留「平時演練、災時查詢、資料駐留、本地可用」的研究目標，並降低生成式 AI 幻覺與裝置效能不足的風險。

## 目前進度

- 使用 Kotlin + Jetpack Compose 開發 Android 介面。
- 目前先實作 6 個核心演練情境，涵蓋地震、火災、颱風豪雨、人為災害與複合災害。
- 演練裁判已改成嚴格模式：錯誤、模糊、危險回答不會推進進度。
- 致命錯誤會直接造成演練失敗，例如火災搭電梯、豪雨進地下道。
- 每個決策點有 30 秒倒數，用來模擬災害中的凍結反應。
- 本地 RAG 使用 BM25 檢索，不需要網路。
- 知識庫已加入官方來源欄位，App 會在知識卡與 RAG 參考中顯示來源。
- 演練回饋已改為固定格式：判定、原因、官方依據、下一步、標準方向。
- 演練紀錄會保存到 Room/SQLite。
- 已記錄回合數、回應字數、完成率、逾時次數、致命錯誤次數與安全等級。
- 已接入 llama.cpp native runtime，但目前主流程停用本地 LLM 推論。

## 目標手機

最低驗收手機：Redmi Note 13 Pro+ 5G 或更高階 Android 手機。

目前 APK 只編譯 `arm64-v8a`，符合 Redmi Note 13 Pro+ 5G 與多數近年 Android 手機。Android 主流程不再自動載入本地 LLM，因此中階手機也能維持穩定操作。若未來要測試本地 LLM，請只作為實驗資料收集，不要放入災時主流程。

## 內建防災資料來源

目前 Android 版的內建知識庫以官方公開資料整理為短知識片段，App 內會顯示來源機關、來源標題與網址。

- 臺灣防災士教育訓練基本教材（1130927 更新）：防災士理念、任務、災害管理四階段、官方資訊與謠言辨識、居家整備、避難收容場所運作。
- 防災士課程簡報範本（112 年 12 月最新版）：課程章節架構、社區防災、DIG 圖上訓練與實作重點。
- 內政部消防署：地震「趴下、掩護、穩住」、餘震與二次災害注意事項、防颱注意事項。
- 內政部消防署消防防災館：火災逃生避難原則、瓦斯外洩「禁、關、推、離」、油鍋起火與火災迷思。
- 交通部中央氣象署：大雨、豪雨、大豪雨、超大豪雨定義，以及強降雨造成積淹水、溪水暴漲、山崩落石與土石流風險。
- 桃園防災教育館：滅火器「拉、瞄、壓、掃」操作。
- 臺北市政府消防局：火災逃生、室內待救與撥打 119 求援。
- 臺南市政府消防局：民眾版 CPR「叫、叫、壓、電」與 AED 操作。
- 內政部警政署：110 報案與可疑公共安全事件通報。
- WHO：心理急救 PFA 的 Look, Listen and Link 原則。

注意：App 內文字是依上述資料「整理摘要」，不是全文轉載。正式報告若要引用，請以來源網址的原文為準。

## 組員電腦編譯方式

組員可以用 Android Studio 編譯，也可以用專案內的可攜式工具編譯。推薦先用 Android Studio，因為比較容易安裝 SDK、NDK 和 CMake。

## 方法一：使用 Android Studio

1. 安裝 Android Studio。
2. 開啟 Android Studio 的 SDK Manager。
3. 安裝以下項目：
   - Android SDK Platform 36
   - Android SDK Build-Tools 36.0.0 或 35.0.0
   - Android SDK Platform-Tools
   - NDK Side by side：27.0.12077973
   - CMake：3.22.1
4. 用 Android Studio 開啟這個資料夾：

```text
android
```

5. 如果 Android Studio 提示 `local.properties` 裡的 SDK 路徑不存在，請刪掉 `local.properties`，讓 Android Studio 自動重新產生。
6. 等 Gradle Sync 完成。
7. 點選 `Build > Make Project` 或 `Build > Build Bundle(s) / APK(s) > Build APK(s)`。

編譯完成後 APK 位置：

```text
app/build/outputs/apk/debug/app-debug.apk
```

## 方法二：使用專案內建工具

如果整個 `android/.tooling` 資料夾也一起複製過去，可以直接用 PowerShell 編譯。

在 `android` 資料夾執行：

```powershell
powershell -ExecutionPolicy Bypass -File .\build-local.ps1
```

這個 script 會自動設定：

- `ANDROID_SDK_ROOT`
- `ANDROID_HOME`
- `GRADLE_USER_HOME`
- `local.properties`

APK 位置同樣是：

```text
app/build/outputs/apk/debug/app-debug.apk
```

## 安裝到 Android 手機

1. 手機開啟「開發人員選項」。
2. 開啟「USB 偵錯」。
3. 用 USB 線連接電腦和手機。
4. 手機跳出授權視窗時，允許這台電腦偵錯。
5. 在 `android` 資料夾執行：

```powershell
.\.tooling\android-sdk\platform-tools\adb.exe devices
```

如果看到裝置序號，代表連線成功。

安裝 APK：

```powershell
.\.tooling\android-sdk\platform-tools\adb.exe install -r app\build\outputs\apk\debug\app-debug.apk
```

如果使用 Android Studio，也可以直接選擇連接的手機，按 Run 安裝。

## 本地 LLM 實驗選項

目前 Android 主流程已停用手機端 LLM 推論，避免中階手機卡頓。`llama.cpp` native runtime 仍保留在專案中，只供後續效能測試或高階手機實驗使用。

若要重新啟用，需在 `PocketKbViewModel.kt` 將：

```kotlin
private const val ENABLE_EXPERIMENTAL_LOCAL_LLM = false
```

改為：

```kotlin
private const val ENABLE_EXPERIMENTAL_LOCAL_LLM = true
```

注意：啟用後 App 可能因模型大小、CPU 推論或記憶體壓力造成卡頓。研究展示與災時流程不建議依賴此功能。

## 常見問題

### adb devices 看不到手機

- 換 USB 線，有些線只能充電不能傳輸。
- 手機 USB 模式改成檔案傳輸。
- 確認手機已允許 USB 偵錯授權。
- 執行：

```powershell
.\.tooling\android-sdk\platform-tools\adb.exe kill-server
.\.tooling\android-sdk\platform-tools\adb.exe start-server
.\.tooling\android-sdk\platform-tools\adb.exe devices
```

### 安裝時出現 INSTALL_FAILED_UPDATE_INCOMPATIBLE

手機上可能已有不同簽章的舊版 App，先移除再裝：

```powershell
.\.tooling\android-sdk\platform-tools\adb.exe uninstall com.pocketkb.android
.\.tooling\android-sdk\platform-tools\adb.exe install app\build\outputs\apk\debug\app-debug.apk
```

### App 可以開，但回覆不是 AI 長文

這是目前設計。Android 離線核心使用規則式安全裁判與本地 RAG，重點是穩定、可信、可追溯來源。線上 AI 教練會作為後續加值功能，而不是災時安全判斷核心。
