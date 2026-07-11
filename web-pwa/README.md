# PocketKB PWA 測試版

這是給 iPhone + Windows 開發流程使用的靜態 PWA 版本。第一版聚焦在計畫書核心：離線知識庫、情境式演練、規則裁判與演練紀錄。

## Windows 本機啟動

在專案根目錄執行：

```powershell
cd C:\Users\Denni\Desktop\PocketKB_final\web-pwa
python -m http.server 5173 --bind 0.0.0.0
```

Windows 本機開：

```text
http://localhost:5173/
```

iPhone 與 Windows 連同一個 Wi-Fi 時，使用 Windows 的區網 IP 開啟，例如：

```text
http://192.168.1.109:5173/
```

## iPhone 測試方式

1. 用 Safari 開啟區網網址。
2. 先測「演練」流程：宿舍走廊濃煙、暴雨地下道。
3. 測幾種回答：
   - 正確：我不進地下道，先停下並避開積水入口。
   - 危險：我快跑穿過地下道試試看。
   - 離題：我今天想吃拉麵。
   - 模糊：看情況。
4. 測「查詢」：搜尋濃煙、地下道、119、高處。
5. 測「紀錄」：完成或失敗的演練會存到瀏覽器 localStorage。

## PWA 離線限制

Safari 的 service worker 離線快取需要安全來源：

- `localhost`：Windows 本機測可以。
- `https://...`：iPhone 正式測離線需要。
- `http://192.168.x.x`：可測畫面和流程，但通常不能完整測離線快取。

要在 iPhone 測完整離線 PWA，建議把 `web-pwa` 部署到 GitHub Pages、Netlify、Cloudflare Pages 或其他 HTTPS 靜態網站。

## 目前功能邊界

- 離線應急核心：已做。
- 情境式規則裁判：已做兩個三步驟情境。
- 離題、模糊、危險、致命回答處理：已做。
- 線上 AI 教練：只保留頁面入口，尚未接 API。
- 本地端 LLM：不放入 PWA 第一版，避免手機卡住。
