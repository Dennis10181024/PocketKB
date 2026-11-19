# PocketKB GPT 線上情境演練

更新：2026-11-01。此版提供本機後端、網頁及 Android 模擬器接線；真實 GPT 回覆品質仍需有效 API 金鑰驗收。

步驟 0.5 更新見 [診斷與驗證](../docs/DIAGNOSIS.md)。兩段模型請求共用 8 秒期限。模型未就緒、錯誤或逾時時，後端改用規則處理同一筆。客戶端無法連線時從最後確認的狀態在本機繼續這個場次。

## 現在如何使用

1. 在專案根目錄執行 `node online-coach/server.js`。需要 Node.js 20.19 或更新版本，沒有額外 npm 依賴。
2. 電腦開啟 <http://127.0.0.1:5175/setup.html>，自行輸入 OpenAI API 金鑰。輸入會以密碼欄位隱藏，僅傳到這台電腦的後端。金鑰不寫入檔案、APK、Git 或瀏覽器儲存空間；服務重啟後需重新輸入。若電腦已有 `OPENAI_API_KEY` 環境變數，直接使用它。
3. 開啟 <http://127.0.0.1:5175/online.html>。提供六個劇本：宿舍火災、學校地震、住家地震受困、低窪住宅淹水、山區道路土石流、堰塞湖下游。
4. Android 模擬器先執行 `android\.tooling\android-sdk\platform-tools\adb.exe reverse tcp:5175 tcp:5175`。App「演練」頁開啟「GPT 線上演練」，再選火災或五個新版劇本。

也可使用 `online-coach/start-online.ps1`，在終端機隱藏輸入金鑰並建立 ADB reverse。不能同時啟動兩個5175服務；原服務用 Ctrl+C 停止。

金鑰格式通過只代表已設定，不代表模型權限、額度或付款已驗證。真正送出第一輪回答才會呼叫 OpenAI。設定頁本身不呼叫付費 API。

## 線上與離線

- GPT 線上模式：理解自由回答、根據最近對話與可信現場回饋；需要電腦服務及網路。
- 離線模式：保留原有確定性規則演練、應急資料與紀錄，不宣稱具備 GPT 的自然語言能力。
- Android 模式在開始前選擇，演練中不直接切換引擎。未支援線上的舊版劇本會使用離線規則。
- 網頁的新線上頁面有自己的紀錄區；沒有把線上紀錄混進原本的離線紀錄。完成／失敗場次保存至該瀏覽器 localStorage，最多30筆。

## 實作流程

`Android／網頁 → 本機後端 → GPT 語意理解 → 劇本驗證 → GPT 回饋 → 原子提交回合`

- 使用 Responses API、嚴格 JSON schema、`store:false`，預設模型 `gpt-6.1-terra`。模型名稱可由後端 `OPENAI_MODEL` 環境變數調整，但相容能力需另外確認。
- 原文證據與行動ID檢查；額外攔截已知明確否定與詢問語氣。模型仍可能理解錯誤，這些檢查不等於完整語意正確性保證。
- GPT 不直接指定結局；共享 JS 引擎控制危險、路線、資源、階段與待救／撤離／失敗。Android 解析後端狀態，再用本地相同版本劇本呈現。
- 每輪先產生候選狀態，兩次模型處理均成功才提交模型路徑。失敗後規則從最後確認狀態算一次，並回報 `offline` 和 `fallbackReason`。
- 請求 ID 和版本序號防止連點、重送與跨回合覆寫。若客戶端未收到回覆便轉入本機判讀，該場次後續不再採用原遠端場次。
- Android 離開或另開演練會取消客戶端工作，晚到回覆不套用到新場次。
- 回饋依劇本現場、行動規則、後果與已有來源資料。沒有自動讀取來源網址全文，不得宣稱完成官方全文檢索或專業審查。
- 模型可回應新的合理想法，但只有劇本可驗證的行動才會執行。未建模的行動須追問條件或說明限制，不能臨時生成出口或救援。

## 用量與服務範圍

- `POCKETKB_MAX_CALLS` 預設100次模型請求／每次啟動；一輪通常兩次，觀察／內建提示不呼叫模型。這是請求數限制，不是美元硬上限。
- 每次最多 2000 字；每個遠端場次最多 80 回合。模型每次輸出上限 1200 tokens，兩階段合計 8 秒。客戶端回合請求等待約 8.5 秒後採本機判讀。
- 提供最近12則對話及目前狀態；後端保留最近24則，完整對話由兩端各自保存。此版未實作長期語意記憶。
- 場次暫存在後端記憶體，4小時未互動過期，最多100場。服務重啟或網頁重新載入後，尚未完成的線上場次不會自動恢復；網頁會先提醒。
- 服務只監聽127.0.0.1，檢查Host與Origin，不是公開部署版本。朋友手機直接安裝 APK 尚不能跨網路使用此電腦的後端；正式分享前需部署HTTPS後端並加入使用者授權及持久化。
- Android正式後端可在建置時傳入 `-PpocketkbCoachUrl=https://...`。HTTP明文例外僅在debug版允許127.0.0.1。

## 測試與實際 GPT 驗收

```powershell
node --test online-coach/test/coach.test.js
node web-pwa/fire-engine-test.js
node web-pwa/fire-app-test.js
node web-pwa/scenario-engine-v3-test.js
node web-pwa/scenario-v3-contract-test.js
```

`web-pwa/online-browser-test.js` 使用 Playwright、獨立Chrome設定與明確標示的測試替身，驗證六個劇本入口、等待、草稿重試、失敗鎖定、單次紀錄、小螢幕及大字體。測試中的示範回覆不能當成真實 GPT 能力證據。

Android `OnlineCoachConnectionTest` 要求本機5175服務及ADB reverse；只測連線和觀察，不呼叫付費 GPT。Compose測試包含線上入口及失敗後草稿保留。

有效金鑰設定後，優先人工驗收：

1. 同一動作換三種口語說法，結果應一致。
2. 分別問兩個不同問題，應直接回答各自疑問，不重複階段說明。
3. 否定、假設、引用別人、矛盾與混合意圖不能誤執行。
4. 害怕、離題、亂碼與重複卡住，應有符合當次內容的回應。
5. 受困、路線關閉與危險決策仍能到達待救或失敗結局。
6. 提出未建模的方法，確認模型不假裝已有出口、物資或救援。

記錄每個錯誤輸入、模型、劇本版本、預期與實際結果，逐項修正。現在尚未取得真實模型的速度、中文回應品質及防災內容專業正確性結果。

官方接法：[Responses API](https://developers.openai.com/api/docs/guides/text)、[Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)、[模型資料](https://developers.openai.com/api/docs/models/gpt-6.1-terra)。
