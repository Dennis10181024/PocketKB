# 步驟 2.3｜畫面與延遲驗收

截圖來自 430px Chrome 手機視窗與已安裝 APK 的 PocketKB API 35 Android 模擬器。兩端均實際接上 GPT API，走完宿舍火災的無傷、輕傷與危急失敗路徑。成功與簡單回顧在同一畫面。

| 畫面 | Web | Android |
| --- | --- | --- |
| 內容提醒 | [Web](web/01-reminder.png) | [Android](android/01-reminder.png) |
| 一般回合 | [Web](web/02-round.png) | [Android](android/02-round.png) |
| 建議句展開 | [Web](web/03-hints.png) | [Android](android/03-hints.png) |
| 情境惡化 | [Web](web/04-escalation.png) | [Android](android/04-escalation.png) |
| 提問與接線員回答 | [Web](web/05-question.png) | [Android](android/05-question.png) |
| 危急失敗、傷勢不評定 | [Web](web/06-critical.png) | [Android](android/06-critical.png) |
| 輕傷與造成傷勢的步驟 | [Web](web/07-injury.png) | [Android](android/07-injury.png) |
| 無傷成功與簡單回顧 | [Web](web/08-success-review.png) | [Android](android/08-success-review.png) |

## 真實 API 延遲

每端用更新後的宿舍火災無傷路線重測 8 次送出，包含 1 次劇本直接回答的提問。Web 運用頁面的 Performance 時鐘從送出量到首段文字寫入與回合封包結算。Android 以單調時鐘與 Compose 畫面幀回呼量測。p50 取中位數，p95 取向上排序百分位，8 筆樣本中對應最慢一筆。

| 平台 | 首字 p50 | 首字 p95 | 整段 p50 | 整段 p95 |
| --- | ---: | ---: | ---: | ---: |
| Web | 1.50 秒 | 5.59 秒 | 4.64 秒 | 8.10 秒 |
| Android | 1.43 秒 | 5.50 秒 | 4.41 秒 | 8.15 秒 |

兩端所有送出的首字 p50 低於 2.5 秒。只計 7 筆涉及模型的回合時，Web 首字 p50 為 2.99 秒、Android 為 2.78 秒。長尾仍受模型理解與敘事驗證影響。線上教練先以 SSE 發送通過固定句檢查的引擎事實，模型後續文字通過完整檢查後才一起顯示。單一、完整命中規則的行動可直接進入敘事，歧義、改寫與複合輸入保留模型理解。

| 玩家輸入 | Web 首字／完成 ms | Android 首字／完成 ms |
| --- | ---: | ---: |
| 小岑，先別開門。 | 5593／8066 | 3945／7213 |
| 我關門 | 8／2575 | 82／3619 |
| 我撥119 | 5／2433 | 44／3048 |
| 如果打開房門會有風險嗎？ | 3／124 | 40／193 |
| 我告知地址A棟宿舍 | 4139／8097 | 5498／8148 |
| 我回報五樓503室 | 2991／5902 | 3865／7826 |
| 我等待救援 | 4／3381 | 36／3211 |
| 我保持通訊並依消防人員指示 | 4154／8069 | 2783／5198 |

## 敘事輸入 token

模型為 gpt-6.1-terra。用相同起始劇本與三筆輸入分別跑完整上下文與精簡狀態差異。表格取每回合第一次成功收到的第二段用量，數字由 API 回報，避免將重生次數差異算進縮減率。

| 輸入 | 完整上下文 | 精簡狀態差異 | 節省 |
| --- | ---: | ---: | ---: |
| 我關門 | 4,984 | 638 | 4,346 |
| 我撥119 | 5,146 | 612 | 4,534 |
| 我告知地址A棟宿舍 | 5,326 | 618 | 4,708 |
| 合計 | 15,456 | 1,868 | 13,588（87.9%） |

實際 API 使用 99／120 次。Web 首輪含 token 量測 46 次，Android 首輪 31 次，Web 與 Android 延遲重測各 11 次。

## 驗證與操作

- JS 87 項、Kotlin 37 項、宿舍火災 38／38 安全判定等價。瀏覽器測試涵蓋提示三種觸發、背景／送出中／終局暫停、退出與斷線續玩。
- Android Compose 測試涵蓋可編輯提示填入、送出、停止入口與終局不再顯示輸入。另在模擬器跑真實 API 取得上述畫面。螢幕閱讀器讀序核對基於 Web DOM 與 Compose 語意順序。
- 2.3 首輪截圖保留三個真實結局。提問與成功回顧截圖已用延遲重測時的版本更新，提問在通話接通後由接線員回答。

### Windows 啟動 Web

在專案根目錄開啟 PowerShell。

    $env:OPENAI_API_KEY = [Environment]::GetEnvironmentVariable('OPENAI_API_KEY', 'User')
    powershell -ExecutionPolicy Bypass -File .online-coachstart-online.ps1

開啟 http://127.0.0.1:5175/online.html ，選「宿舍濃煙：關門待救」。5175 已被使用時，可在啟動前設定 $env:POCKETKB_PORT = '5187'，瀏覽器使用同一個新埠。

### Android 模擬器

1. 開啟 Android Studio Device Manager 的 PocketKB_API35 模擬器。
2. 複製下方指令或使用 Android Studio 的 Run 安裝 APK。

       powershell -ExecutionPolicy Bypass -File .androiduild-local.ps1
       & .android.toolingandroid-sdkplatform-toolsadb.exe install -r .androidappuildoutputsapkdebugapp-debug.apk

3. 模擬器啟動後執行上面的 Web 啟動指令，腳本會建立 ADB reverse。下方是手動設定指令。

       & .android.toolingandroid-sdkplatform-toolsadb.exe reverse tcp:5175 tcp:5175

   使用替代埠時，將最後一個 tcp:5175 換成實際的伺服器埠。
4. 開啟 PocketKB，點「開始情境演練」，啟用「GPT 線上演練」，選宿舍濃煙並開始。
