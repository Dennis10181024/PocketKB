# PocketKB 離線防災輔助交接包

這是 2026-11-19 **目前工作樹快照**，不是 GitHub HEAD 的同義詞。交付對象：接手離線查詢、離線 AI 與實驗共同查詢介面的組員。保留原始內容，不代表內容已通過防災專家審查。

## 先看哪裡

1. `HANDOFF.md`：能力、缺口與接手順序。
2. `SHARED_QUERY_CONTRACT.md`：兩種模式共用查詢介面的建議契約；這是規格，尚未整合進產品。
3. `CONTENT_REVIEW.md`：舊內容、來源及授權限制。
4. `data/`：可跨語言讀取的 Android 原文 JSON，24 筆知識、5 組緊急指引、15 筆來源。
5. `source/`：Android、Web、Swift 與相關文件原始快照。
6. `MANIFEST.json`：每個交付檔的 SHA-256、來源位置與打包版本。
7. `VALIDATION.json`：本包實際執行的檢查；沒有做的測試會明示。

## 不用手機就能先讀取資料

需既有 Node.js 20.19+；不需要套件安裝、金鑰、模型或網路。在**解壓後本資料夾**執行：

```powershell
node examples/query.cjs '門外有濃煙怎麼辦'
node examples/query.cjs 'zzzzunknownquery'
```

第一個指令回傳可核對來源的**原文檢索結果**；第二個不命中應回傳空陣列。這不是生成式逃生回答，也不修改劇本或保證安全。預設查詢16筆具公開來源連結的知識；8筆引用本機教材的摘要保留在全量 JSON，未放入這個範例預設語料。公開連結不等於可任意再利用。

## 原本 Web 介面參考

```powershell
python -m http.server 5173 --bind 127.0.0.1 --directory source/web-pwa
```

開啟 http://127.0.0.1:5173/ 。這是原有靜態 PWA，含舊版知識與演練；不是六情境新版共同 RAG 介面的完成品。初次載入由本機伺服器提供資產，之後瀏覽器快取的完整離線行為本輪未驗證。`online.html` / `setup.html` 是另需後端的線上原型，離線交接不必設定 API。

## 原始碼的建置邊界

Android 原始檔可供抽取，不是獨立可建置的 Android 發布包：未包含 Gradle 快取、SDK/NDK、簽章、原生 llama.cpp 依賴與模型。原 CMake 及 Gradle 仍可能引用這些外部依賴。Swift 亦是需建立 Xcode 專案及相應依賴的原型，本包不含可直接安裝的 iOS App。

未收錄 .env、金鑰、憑證、local.properties、個人對話紀錄、資料庫、模型、原始防災士 PDF/RAR、APK、第三方原生函式庫或 Git 歷史。本包未上傳至 GitHub；可直接將 ZIP 私下交給組員。若需要公開散布，先處理內容與授權審查。
