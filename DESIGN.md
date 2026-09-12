# PocketKB 設計規範

更新：2026-09-11

## 產品與方向

Android 為主要 App，PWA 為互動預覽與輔助使用介面。保留原生 Kotlin / Jetpack Compose 與現有 HTML / CSS / JS；兩者共用視覺規範，但尚未共用功能與資料模型。

設計主張：可信、易讀、可立即行動。深藍提供安定背景，橘色指向主要操作。首頁直接進入演練或應急指南，資料來源與系統狀態留在適當層級。

## 色彩

| Token | 色值 | 用途 |
| --- | --- | --- |
| Background | #0B1423 | 主背景、橘色按鈕上的文字 |
| Surface | #172438 | 卡片、對話、指南 |
| Muted surface | #21344C | 選取、使用者對話 |
| Text | #F4F7FC / #FFFFFF | 主文字 |
| Muted text | #B3C3D8 | 說明與次要資訊 |
| Primary | #FFAB70 | 開始演練、主要操作 |
| Info | #9CCBFF | 來源、次要操作 |
| Success | #7DDBB0 | 明確的成功狀態 |
| Error | #FF8994 | 風險或錯誤狀態 |
| Outline | #60738D | 輸入框與分隔 |

橘色按鈕採深藍文字，不用白字。風險狀態同時提供文字，不能僅靠顏色。

## 字體、間距、操作

- 使用裝置內建的繁體中文字體，不依賴下載字體。
- 主標題 28–36 sp / px，內文 16，次要文字 14；12 僅用於品牌或對話角色標籤。
- 長文行高約 1.6 倍。知識完整內容不可用省略號取代。
- 以 8 dp 間距為基礎，主要內距 24 dp，卡片圓角 24 dp。
- Android 觸控目標至少 48 dp；Web 操作至少 48 px。
- 主要按鈕與長文容器由內容決定高度，配合系統字級。
- Android 內容最寬 760 dp；PWA 在手機使用底部功能列，桌面採工作區與次要資訊欄。
- 保留原生按壓回饋、返回與對話框語意。

## 主流程

1. 首頁：開始情境演練 / 我現在需要指引。
2. 情境：分類篩選、情境摘要、使用者確認準備好後開始計時。
3. 演練：目前任務、倒數、對話、文字輸入、可展開提示、參考依據。
4. 應急：選擇情況，展開完整步驟與來源。
5. 知識：輸入問題，顯示 BM25 找到的相關片段，可展開全文。
6. 紀錄：最近 20 次演練的結果、任務位置、回合與字數。

離線搜尋是資料檢索，不宣稱為已啟用的生成式 AI。無結果時提示改用關鍵字。來源連結以外部瀏覽器開啟並標示需要網路。

## 動效

Android 使用原生 ripple 與內容展開動畫；PWA 畫面切換為短距離淡入，按鈕具 hover / focus / press 回饋。尊重 Web reduced-motion 與 Android 系統動畫設定。避免持續粒子、閃光、捲動劫持或延遲應急操作的動畫。

## 參考資源與採用方式

- UI-UX-Pro-Max：已安裝並執行設計與 Compose 查詢，採用可讀性、觸控目標、語意控制與無障礙原則。查詢回傳的行銷版型與兒童風格不適用本產品，未照搬；品牌方向是針對本專案的設計判斷。
- Web Design Guidelines：已安裝並檢查 PWA，修正標籤、選取狀態、焦點、跳至內容與中文組字送出問題。
- Stitch：參考 DESIGN.md 的設計語言集中管理方式；未設定 Stitch MCP，也未將專案上傳至 Stitch。
- shadcn：參考元件語意與一致性；現有原生 Android 不直接使用 React 元件，PWA 本輪保留現有架構。
- Impeccable / Taste：參考精簡文案、層次與避免制式介面方向；未宣稱執行其完整技能流程。
- Anime.js / Motion / Emil：參考及時回饋與克制動效；本輪未新增動畫依賴。
- HackMD 五階段流程：參考設計決策、規範、實作、修飾、檢查的順序。

資源：
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://ui.shadcn.com/docs/skills
- https://github.com/google-labs-code/stitch-skills
- https://github.com/pbakaus/impeccable
- https://github.com/Leonxlnx/taste-skill
- https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
- https://animejs.com/
- https://motion.dev/
- https://emilkowal.ski/skill
- https://hackmd.io/7jP8CQ-zTumZktaqi8aqaw

## 計畫書邊界

本次完成介面與操作改版，不代表整份研究計畫已驗收。

- 計畫書要求手機端量化模型、語意嵌入與向量資料庫；Android 目前仍以 BM25 + 規則回饋運作，本機 LLM 停用。
- 30 秒決策為現有原型設計，並非計畫書硬性要求。計畫書的介入時間為 30–45 分鐘，尚需另行設計與驗證。
- 五大災種資料存在，但只有部分情境具備完整多步驟內容。
- 模型品質、真機 TTFT / token 速度 / RAM、問卷、研究匯出與 iOS 尚未完成。
- PWA 與 Android 的情境數量及功能仍有差異。
- 本輪沒有新增或改寫防災知識內容，也沒有驗證所有內容的專業正確性。

## 驗證與待確認

Android assembleDebug 成功；13 項單元測試（10 項裁判、3 項搜尋）通過。搜尋測試先重現 RagEngine 的 stopwords 初始化空值錯誤，將索引建立移到屬性初始化後即全部通過。

PWA 的 JS 語法檢查、11 項裁判 smoke test 通過；首頁、CSS、JS、manifest、圖示及 service worker 均回傳 HTTP 200。

目前未連接 Android 裝置，故不能宣稱已完成真機操作、TalkBack、大字體、橫向與視覺驗收。PWA 本輪未做瀏覽器截圖與互動自動化驗收。正式發放研究受試者前，仍需完成這些檢查。
