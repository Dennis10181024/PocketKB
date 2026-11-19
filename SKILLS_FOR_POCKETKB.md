# PocketKB 開發技能選擇

日期：2026-10-29

## 結論

PocketKB 目前的 Android App 是 Kotlin + Jetpack Compose，網頁端是既有 PWA。因此應優先採用 Compose 原生技能，而不是 React Native、shadcn 或只針對網站元件庫的技能。

## 現在採用

| 技能 | 用途 | 本次狀態 |
|---|---|---|
| `compose-agent` | 撰寫與修正 Jetpack Compose：狀態、效能、生命週期、副作用、元件 API 與測試 | 已由 [hamen/compose_skill](https://github.com/hamen/compose_skill) 安裝並套用；V3 已拆成 Route／純 Content，並加入 4 個 Compose UI 測試 |
| `jetpack-compose-audit` | 對整個 Android Compose 模組產生 Compiler metrics、四類評分與修正順序 | 已由 [hamen/compose_skill](https://github.com/hamen/compose_skill) 安裝並執行；報告見 [android/COMPOSE-AUDIT-REPORT.md](android/COMPOSE-AUDIT-REPORT.md) |
| `ui-ux-pro-max` | 決定手機介面的觸控尺寸、回饋、資訊層級、無障礙與 Compose 實作方向 | 原本已安裝；本次已用 Jetpack Compose 指引檢查介面。後續情境頁以清楚回饋、48dp 觸控區、可理解文字與 `rememberSaveable` 為基準 |
| `tdd` | 先寫會失敗的劇本／裁判案例，再完成狀態機與修正 | 原本已安裝；本次以公開 UI seam 完成失敗鎖定、待救標示、重試 callback 與自由輸入／觀察測試，並增加三條教授展示路線回歸測試 |
| `research` | 逐條查核消防、地震、水災、土石流、堰塞湖等權威來源 | 原本已安裝；用於防災內容與劇本依據，不讓模型自行發明安全規則 |
| `web-design-guidelines` | PWA 上線前的網頁無障礙、表單、響應式與互動稽核 | 原本已安裝；只用於網頁版，不拿來取代 Android 原生規範 |

## 暫緩採用

| 技能／資源 | 暫緩原因 | 何時再用 |
|---|---|---|
| [Android 官方 `adaptive`](https://github.com/android/skills/tree/main/jetpack-compose/adaptive) | 官方技能目前以 Navigation 3 與 adaptive navigation 為前提；PocketKB 使用 Navigation Compose 2.9.5 | 決定升級 Navigation 3、開始平板／折疊機版面時 |
| [Google Stitch skills](https://github.com/google-labs-code/stitch-skills) | 需要 Stitch MCP；目前專案與此工作階段沒有連接 Stitch | 需要從設計稿大量產生畫面且已連接 Stitch 時 |
| [Impeccable](https://github.com/pbakaus/impeccable) | 可做視覺潤飾，但與現有 UI-UX-Pro-Max 部分重疊，且現在更優先修正可用性與狀態架構 | 核心流程穩定、要做教授展示版最後拋光時 |
| shadcn skills | shadcn 是 React/Web 元件工作流，不適用於目前原生 Compose App | 若 PWA 未來改寫成 React + shadcn 時 |
| React Native skills | PocketKB 不是 React Native 專案，導入會造成不必要的雙框架維護 | 只有團隊正式決定放棄原生 Android 時 |

## GitHub 搜尋依據

- [Android 官方 Skills](https://github.com/android/skills)：官方 Android 開發技能，內容以 Android Developers 文件為基礎。
- [Compose Skill](https://github.com/hamen/compose_skill)：提供日常撰寫用的 `compose-agent` 與全專案稽核用的 `jetpack-compose-audit`，與目前技術棧最直接相符。
- [UI-UX-Pro-Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)：可查詢手機介面、觸控、無障礙與 Jetpack Compose 指引。
- [Stitch Skills](https://github.com/google-labs-code/stitch-skills)：適合已連接 Stitch MCP 的設計到程式工作流。
- [Impeccable](https://github.com/pbakaus/impeccable)：適合功能完成後的視覺品質改善。

## 後續使用順序

1. 每個情境功能先用 `tdd` 驗證成功、失敗、待救、澄清與重試。
2. 寫 Android 畫面與狀態時使用 `compose-agent`。
3. 新增主要頁面前用 `ui-ux-pro-max` 決定資訊層級、觸控與回饋。
4. 每個里程碑跑一次 `jetpack-compose-audit`。
5. PWA 上線前跑 `web-design-guidelines`；教授展示版完成後再評估 Impeccable。
