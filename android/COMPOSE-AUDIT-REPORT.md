# Jetpack Compose Audit Report

Target: `C:\Users\Denni\Desktop\PocketKB_final\android`
Date: 2026-10-29
Scope: `app/src/main/java`、`app/src/main/res`、`app/build.gradle.kts`
Excluded from scoring: `app/src/test`、產生的 Room／KSP 程式碼、Native C++、PWA
Confidence: High
Overall Score: 86/100

## Scorecard

| Category | Score | Weight | Status | Notes |
|---|---:|---:|---|---|
| Performance | 8/10 | 35% | solid | Strong Skipping 已啟用，具名 composable 皆可跳過；仍有搜尋與排序在 composition 執行 |
| State management | 9/10 | 25% | excellent | V3 已拆成 Route 接線與純 Screen；其他舊畫面仍直接依賴 ViewModel |
| Side effects | 9/10 | 20% | excellent | 主要副作用位於事件或 `LaunchedEffect`；歷史紀錄讀取仍綁在 Lazy item |
| Composable API quality | 8.5/10 | 20% | solid | V3 純 UI seam、標準 `Modifier` 與四個 UI 測試已具備；其他共用元件仍待統一 |

## Critical Findings

1. **Performance: 離線知識搜尋的索引與查詢仍從 composition 啟動**
   - Why it matters: `RagEngine()` 會建立檢索索引，`retrieve` 也會掃描資料；即使包在 `remember`，第一次進入與鍵值改變時仍會占用 UI composition 執行緒。
   - Evidence: `app/src/main/java/com/pocketkb/android/ui/AppScreens.kt:409`, `AppScreens.kt:410-413`
   - Fix direction: 讓 ViewModel 持有單一 RagEngine，將查詢與篩選結果放進 `UiState`，畫面只呈現結果。
   - References: <https://developer.android.com/develop/ui/compose/performance/bestpractices>

2. **State/API: 部分舊畫面仍直接接收整個 `PocketKbViewModel`**
   - Why it matters: 情境頁、首頁與歷史頁無法用純狀態 Preview 或小型 UI 測試，且 UI 可直接呼叫超出自身責任的動作。
   - Evidence: `app/src/main/java/com/pocketkb/android/ui/AppScreens.kt:42`, `FireChatScreen.kt:25`
   - Fix direction: V3 已完成 Route／Screen 分層；接著讓 PocketKbRoot 與 FireChatScreen 也只接收狀態與具名 callback。
   - References: <https://developer.android.com/develop/ui/compose/state-hoisting>, <https://developer.android.com/develop/ui/compose/architecture>

3. **Composable API: 部分重用元件仍缺少 `modifier`**
   - Why it matters: 呼叫端難以控制外層尺寸、語意與測試標記；參數順序也不符合 Compose 元件慣例。
   - Evidence: `app/src/main/java/com/pocketkb/android/ui/AppScreens.kt:101`, `AppScreens.kt:442`, `AppScreens.kt:474`
   - Fix direction: 逐步加入 `modifier: Modifier = Modifier` 作為第一個選填參數；ActionCard 與 V3 回顧元件已完成此調整。
   - References: <https://developer.android.com/develop/ui/compose/api-guidelines>, <https://android.googlesource.com/platform/frameworks/support/+/androidx-main/compose/docs/compose-component-api-guidelines.md>

## Adjacent Findings

### Android Launch UX

- Android 12+ splash icon status: not configured
- Evidence: `app/src/main/res/values/styles.xml` 未設定 `windowSplashScreenAnimatedIcon` 或 `postSplashScreenTheme`。
- Fix direction: 目前不是靜態 splash drawable 配錯，而是尚未導入 SplashScreen API；建立正式品牌啟動畫面時再加入 AndroidX SplashScreen 與 API 31 資源。
- References: <https://developer.android.com/develop/ui/views/launch/splash-screen>, <https://developer.android.com/reference/androidx/core/splashscreen/SplashScreen>

## Category Details

### Performance — 8/10

**Ceiling check**

- Strong Skipping: on
- Ceiling table applied: SSM-on；Kotlin Compose Compiler 回報 `StrongSkipping: true`。
- Module-wide `skippable%`: 142/205 = 69.3%（包含產生碼與匿名 composable）。
- Named-only `skippable%`: 24/24 = 100%；此值較能代表專案自行命名的 UI 函式。
- Unstable shared types from compiler: 27 inferred unstable classes；在 SSM 下未單獨扣分。
- SSM-on binding evidence: composition 內仍有查詢、排序、篩選與新集合建立。
- Qualitative score: 8/10
- Ceiling: none
- Applied score: 8/10

**What is working**

- Strong Skipping 與 lambda memoization 已啟用，24 個具名 composable 全部為 skippable。
- LazyColumn 的動態資料大多使用穩定 domain key。
- 結束回顧已改由 ViewModel 在結果確定時產生，畫面不再於每次重組呼叫 `reviewData`。

**What is hurting the score**

- ResourcesScreen 在 composition 建立 RagEngine 並依輸入執行檢索。
- ResourcesScreen 的搜尋仍是目前主要 composition 熱點；ScenarioPicker 的排序、分類與篩選已使用正確 key 的 `remember`。

**Animation performance signals**

- Status: clean；僅使用 `animateContentSize`，未發現 composition-phase 的逐幀動畫值讀取。

**Paging list signals**

- Status: not present

**Evidence**

- `app/build/compose_audit/debug/app_debug-module.json` — Compiler 實測 Strong Skipping 與模組指標。 · References: <https://developer.android.com/develop/ui/compose/performance/tooling>, <https://developer.android.com/develop/ui/compose/performance/stability/strongskipping>
- `app/src/main/java/com/pocketkb/android/ui/AppScreens.kt:409-413` — 索引初始化與檢索工作仍在 composition 路徑。 · References: <https://developer.android.com/develop/ui/compose/performance/bestpractices>
- `app/src/main/java/com/pocketkb/android/ui/AppScreens.kt:191-200` — 情境排序、分類與篩選已用輸入作為 `remember` key，避免無關重組重做。 · References: <https://developer.android.com/develop/ui/compose/performance/bestpractices>

### State Management — 8.5/10

**What is working**

- MainActivity 以 `collectAsStateWithLifecycle()` 收集兩個 StateFlow。
- ViewModel 對外提供不可變 `StateFlow`，Room 流使用 `WhileSubscribed(5_000)`。
- 輸入、互動種類、選項展開等本地 UI 狀態使用 `rememberSaveable` 並以 session/node 正確設 key。

**What is hurting the score**

- PocketKbRoot 與 FireChatScreen 仍直接接收 ViewModel；ScenarioV3 已完成 stateful Route + stateless Screen。
- HistoryScreen 在 Lazy item 內自行保留 Room 結果，item 離開 composition 後可能重新讀取。

**Paging load-state signals**

- Status: not present

**Evidence**

- `app/src/main/java/com/pocketkb/android/MainActivity.kt:19-20` — Android UI 使用生命週期感知收集。 · References: <https://developer.android.com/develop/ui/compose/state>
- `app/src/main/java/com/pocketkb/android/PocketKbViewModel.kt:86-91` — 單一 UI StateFlow 與 `WhileSubscribed`。 · References: <https://developer.android.com/develop/ui/compose/architecture>
- `app/src/main/java/com/pocketkb/android/ui/ScenarioV3Screen.kt:78-143` — V3 Route 將 ViewModel 轉為 UiModel 與 callback，純 Content 可獨立測試。 · References: <https://developer.android.com/develop/ui/compose/state-hoisting>
- `app/src/main/java/com/pocketkb/android/ui/AppScreens.kt:42`, `FireChatScreen.kt:25` — 其餘畫面仍直接依賴 ViewModel。 · References: <https://developer.android.com/develop/ui/compose/state-hoisting>
- `app/src/main/java/com/pocketkb/android/ui/AppScreens.kt:497-502` — Lazy item 內擁有資料載入狀態。 · References: <https://developer.android.com/develop/ui/compose/state-hoisting>

### Side Effects — 9/10

**What is working**

- 捲動動畫由以訊息數量為 key 的 `LaunchedEffect` 驅動。
- 開啟來源網址在按鈕事件中執行；劇本、Room 與檔案 IO 位於 ViewModel／資料層。
- 未發現 `GlobalScope`、composition body 直接啟動 coroutine、網路或檔案 IO。

**What is hurting the score**

- HistoryScreen 的資料庫讀取由每個展開卡片內的 `LaunchedEffect` 驅動，生命週期與 lazy item 綁定；應改為 ViewModel 快取的狀態。

**Animation side-effect signals**

- Status: clean

**Paging side-effect signals**

- Status: not present

**Evidence**

- `app/src/main/java/com/pocketkb/android/ui/ScenarioV3Screen.kt:55-57` — 動畫捲動放在正確 key 的 `LaunchedEffect`。 · References: <https://developer.android.com/develop/ui/compose/side-effects>
- `app/src/main/java/com/pocketkb/android/ui/AppScreens.kt:499` — 資料載入 effect 位在可被 LazyColumn 移除的 item 內。 · References: <https://developer.android.com/develop/ui/compose/side-effects>, <https://developer.android.com/develop/ui/compose/architecture>

### Composable API Quality — 8.5/10

**What is working**

- ReviewSectionCard 與 ReviewTimelineCard 已接受 `modifier: Modifier = Modifier` 並套用到最外層 Card。
- ScenarioV3Content 是純狀態＋callback API，可在沒有 ViewModel、Room 或 Activity graph 的情況下測試。
- ActionCard 已修正必填 callback 順序並支援外部 modifier。
- 互動元件使用 Material Button、IconButton、FilterChip 等原生語意元件；重要結果標題已設定 heading semantics。

**What is hurting the score**

- PageHeading、ExpandablePanel、CategoryChip 等重用元件仍缺少 modifier。
- V3 已加入 375dp 的進行中與待救回顧 Preview；其他主要畫面仍缺 Preview，且尚無 screenshot test。

**Evidence**

- `app/src/main/java/com/pocketkb/android/ui/ScenarioV3Screen.kt:125-313` — 純 ScenarioV3Content 使用標準 modifier、UiModel 與事件 callback。 · References: <https://developer.android.com/develop/ui/compose/api-guidelines>
- `app/src/main/java/com/pocketkb/android/ui/AppScreens.kt:101`, `AppScreens.kt:442`, `AppScreens.kt:474` — 其餘重用元件仍缺少 modifier。 · References: <https://android.googlesource.com/platform/frameworks/support/+/androidx-main/compose/docs/compose-component-api-guidelines.md>
- `app/src/androidTest/java/com/pocketkb/android/ui/ScenarioV3ContentTest.kt` — 四個 UI 契約直接測試純 Content；目前已編譯成測試 APK。 · References: <https://developer.android.com/develop/ui/compose/testing>
- `app/src/main/java/com/pocketkb/android/ui/ScenarioV3Screen.kt` — 已提供進行中與待救回顧的 375dp Preview；其餘主要頁面待補。 · References: <https://developer.android.com/develop/ui/compose/tooling/previews>

## Prioritized Fixes

1. 把 RagEngine、搜尋、分類與情境排序移到 ViewModel／UiState，避免 composition 做資料處理。
2. 依 V3 已完成的方式，將 PocketKbRoot 與 FireChatScreen 拆成 Route 與純 Screen。
3. 統一 PageHeading、ExpandablePanel、CategoryChip 的 modifier，補主要狀態 Preview。
4. 連接 Android 裝置後執行已建立的四個 Compose UI instrumentation tests。

## Notes And Limits

- 只評分 Android `app` 模組；PWA 與原生 C++ 不在本報告分數內。
- Adjacent coverage notes: 目前有 24 個已通過的 JVM 單元測試、4 個已成功編譯打包的 Compose UI instrumentation tests，以及 2 個 V3 手機 Preview；尚未連接 Android 裝置執行。未發現 screenshot test、鍵盤／D-pad 測試或 KMP/CMP source set。
- Android Launch UX resources: not configured；`app/src/main/res/values/styles.xml` 沒有 SplashScreen API 屬性。
- Strong Skipping mode: on；未發現模組層級 opt-out。
- Weight choice: default 35/25/20/20。
- Renormalization: none。
- Compiler diagnostics used: yes；`app/build/compose_audit/app_debug-composables.csv` 與 `debug/app_debug-module.json`，涵蓋 `app` debug Kotlin 編譯。
- UI-UX-Pro-Max 的小手機、橫向、最大字體、TalkBack 與實機觸控檢查尚未執行；這些不能由 JVM 建置替代。

## Suggested Follow-Up

- 核心流程穩定後執行 Material 3／視覺系統稽核。
- 連接手機或模擬器後執行 `ScenarioV3ContentTest`，並視需要增加 screenshot test。
- 若未來加入鍵盤、D-pad、平板或 ChromeOS 操作，再使用 `compose-agent focus on focus`。
- 本專案未使用 Paging 3、Navigation 3 或 KMP，因此目前不需要相應專項稽核。
