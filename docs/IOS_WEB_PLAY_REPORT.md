# iPhone 尺寸網頁試玩

劇情與評分為草稿，待人工審查。

## 開啟

在專案根目錄執行 `node scripts/play-server.js --lan`。把 Windows 和 iPhone 接到同一個 Wi-Fi，使用 iPhone 掃終端機 QR code 或直接輸入顯示的網址。若有多張網卡，可用 `--lan --host <電腦的私人 IPv4>` 選擇；校園網路可能隔離裝置，這時可改到自己的 Wi-Fi。預設 `node scripts/play-server.js` 只接受本機連線，預設連接埠 4173。可用 `--port` 指定其他連接埠。終端機 QR 使用本機內建程式產生。

區網入口只提供選擇題。以 HTTP 開啟可以試玩，但瀏覽器不會安裝 Service Worker，因此切斷 Wi-Fi 後無法保證重開。要安裝及斷網重開，使用 iPhone 信任且網址相符的 HTTPS 憑證，以 `--lan --host <私人 IPv4> --cert <憑證 PEM 路徑> --key <私鑰 PEM 路徑>` 啟動，或以 HTTPS 靜態站提供同一份試玩網站。憑證私鑰留在電腦本機資料夾。Safari 等畫面顯示「可離線遊玩」，再使用分享選單的「加入主畫面」，開啟「以 Web App 打開」。HTTPS 站台必須提供 `play.html` 及其相對路徑資源。

## Chrome 驗收

Chrome 行動裝置模擬使用 402 × 874 CSS px、行動觸控事件，並檢查按鈕文字至少 16px、按鈕高度至少 48px、頁面不會橫向溢出。使用本機安全環境預載，將網頁切成離線後重新載入，從頭玩學校地震到結局與回顧。另以私人 IPv4 的 HTTP 路徑檢查瀏覽器仍可載入情境並驗證情境包 SHA-256。這些是 Chrome 自動化結果，iPhone 16 Pro 的 Safari、憑證信任和實際加入主畫面仍待實機驗收。

「閱讀設定」提供標準、大、特大與高對比，會保留在目前瀏覽器。Chrome 另在 320px 下啟用特大及高對比，重開後確認偏好仍在，各草稿可斷網開啟，畫面沒有橫向溢出。自動測試檢查題目與選項群組的無障礙標籤。VoiceOver 的實際朗讀順序待 iPhone 驗收。

截圖：

- [情境清單](./ios-web-screens/01-情境清單.png)
- [內容提醒](./ios-web-screens/02-內容提醒.png)
- [斷網重新載入後作答](./ios-web-screens/03-離線作答.png)
- [結局、傷勢與回顧](./ios-web-screens/04-結局與回顧.png)

[Safari 加入主畫面的官方操作](https://support.apple.com/en-mide/guide/iphone/iph42ab2f3a7/27/ios/27) · [Service Worker 安全環境要求](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
