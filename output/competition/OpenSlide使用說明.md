# PocketKB Edge｜OpenSlide 可編輯簡報

## 開啟與編輯

1. 雙擊本資料夾的「啟動OpenSlide.cmd」。伺服器啟動後保留視窗。
2. 瀏覽器開啟 http://127.0.0.1:5173/s/pocketkb-edge 。若程式顯示不同連接埠，使用畫面顯示的網址加上 /s/pocketkb-edge。
3. 選右上方鉛筆 Edit。雙擊文字直接修改；點選物件後可在 Format 調字級、顏色及排列。
4. 按 Ctrl+Enter 完成文字修改，再按 Ctrl+S 儲存。內容存回 slides/pocketkb-edge/index.tsx。
5. 透過左側縮圖切頁；Present 開始播放。Notes 內保留各頁證據與限制說明。

這是12頁 React 原生文字、表格與架構圖簡報。新版主軸是台灣華語／台語驅動的自主災時Agent：主動觀察、規劃、執行、驗證與重規劃，並依長者可用性設計語音指引。12頁皆完成畫布與建置檢查。

## 檔案位置與備份

- 專案：工作區根目錄 open-slide-deck。
- 簡報原始碼：open-slide-deck/slides/pocketkb-edge/index.tsx。
- 發送給他人：使用 PocketKB_Edge_OpenSlide_災時語音Agent定稿可編輯專案.zip。解壓縮後保留資料夾結構，使用 output/competition 內的啟動檔。
- 其他電腦須有 Node.js 22 以上、npm；首次安裝套件需要網路。這台電腦會優先使用既有的 Node.js 24。
- 若手動啟動：進入 open-slide-deck，先 npm ci，再 npm run dev -- --host 127.0.0.1。

原始碼與 package-lock.json 已包含在壓縮檔；node_modules 與建置快取不打包。靜態 build 供瀏覽使用，自行編輯請使用 dev 模式。

## 匯出與報名

右上 Download 提供匯出選項。不同 OpenSlide 版本的 PPTX 編輯能力可能不同；此交付已驗證的是本機 OpenSlide 原始碼編輯。現有可編輯 PowerPoint 仍保留供備用。

修改 OpenSlide 後，既有 PDF／PPTX 不會自動更新。請重新匯出並逐頁核對，送件 PDF 必須不超過12頁、20MB，且不能加入官網禁止的外部連結。正式隊名、隊員與實績須依真實資料更新。

## 版本與文件

本次安裝 @open-slide/core 2.0.1；套件鎖定檔保留實際版本。
官方入門：https://open-slide.dev/docs/getting-started
官方原始碼：https://github.com/open-slide/open-slide

驗證時間：2026/09/30。這份簡報保留「已完成」與「預計完成」的界線；災時Agent、設備串接、NVIDIA硬體成績與試點成果不能直接改寫為已達成。
