# 口袋知識庫（PocketKB）iOS App

> 基於離線 RAG 與邊緣運算之防災對話演練與災時引導系統  
> 逢甲大學｜指導老師：劉明機｜競賽類別：智慧大數據及行動 APP 類

---

## 檔案清單

```
PocketKB/
├── PocketKBApp.swift              # App 入口 + 底部五個 Tab 導覽
├── DesignTokens.swift             # 設計系統（顏色/間距/字體）
├── evaluate.py                    # Rouge-L / BLEU 評估腳本（含 Phi3-mini 比較）
├── Models/
│   ├── LlamaInference.swift       # llama.cpp C API 包裝（Metal GPU，streaming）
│   ├── HybridRAGEngine.swift      # 混合檢索：BM25 + BGE-small-zh ONNX + RRF
│   ├── VectorStore.swift          # SQLite 向量資料庫（持久化索引）
│   ├── KnowledgeBase.swift        # 知識庫（15 chunks + 14 情境 + 5 緊急引導）
│   └── AppState.swift             # 全域狀態管理
└── Views/
    ├── MainDashboardView.swift    # 主選單
    ├── DrillView.swift            # 情境演練聊天介面
    ├── GuideView.swift            # 知識卡片 + AI 問答
    └── EmergencyGuideView.swift   # 緊急一鍵引導（不依賴 LLM）
```

---

## Xcode 設定步驟

### 1. 建立 iOS App 專案
```
File → New → Project → iOS → App
Product Name:        PocketKB
Interface:           SwiftUI
Language:            Swift
Minimum Deployments: iOS 17.0
```

### 2. 加入所有 Swift 檔案
刪掉預設的 `ContentView.swift`，然後把所有 .swift 拖進 Xcode，勾選：
- ☑ Copy items if needed
- ☑ Add to target: PocketKB → Finish

### 3. 加入兩個 SPM 套件

**llama.cpp：**
```
File → Add Package Dependencies…
URL:    https://github.com/ggml-org/llama.cpp
Branch: master
勾選：  llama → Add to Target: PocketKB
```

**ONNX Runtime：**
```
File → Add Package Dependencies…
URL:   https://github.com/microsoft/onnxruntime
勾選： OnnxRuntime → Add to Target: PocketKB
```

### 4. 設定 Info.plist
點 PocketKB（藍色圖示）→ Info → 右鍵 Add Row，加入：

| Key | Type | Value |
|-----|------|-------|
| Application supports iTunes file sharing | Boolean | YES |
| Supports opening documents in place | Boolean | YES |

### 5. Signing
```
PocketKB（藍色圖示）→ Signing & Capabilities
Team:              選你的 Apple ID
Bundle Identifier: com.yourname.pocketkb
```

### 6. 先用模擬器測試（建議）
```
左上角選 iPhone 16 Pro (Simulator) → ▶ Run
確認：5個 Tab、14個情境、緊急引導步驟 均正常顯示
出現紅色錯誤 → 截圖給 Claude
```

### 7. 部署到 iPhone
```
連接 iPhone → 左上角選你的裝置 → ▶ Run
iPhone：設定 → 一般 → VPN 與裝置管理 → 信任你的 Apple ID
```

---

## 傳入 AI 模型

### 模型一：LLM（必要，約 1GB）
```
https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/
qwen2.5-1.5b-instruct-q4_k_m.gguf
```

### 模型二：BGE-small-zh 語意向量（建議，約 24MB）
```
https://huggingface.co/BAAI/bge-small-zh/resolve/main/onnx/model.onnx
下載後改名為：bge-small-zh.onnx
```

### 傳入方式
```
Xcode → Window → Devices and Simulators
→ 選 iPhone → Installed Apps → PocketKB
→ 齒輪 → 上傳箭頭 → 兩個模型檔都傳入
```

---

## 完成確認

主畫面狀態列顯示：
- `🟢 離線模型就緒` + `🔵 混合檢索就緒` → 完整功能
- `🟢 離線模型就緒` + `🟡 BM25 檢索就緒` → 未傳入 .onnx，仍可使用

---

## 效能預期（iPhone 16 Pro）

| 指標 | 預期 | 計畫書門檻 |
|------|------|-----------|
| 模型載入 | 3–6 秒 | — |
| TTFT | < 2 秒 | < 3 秒 ✓ |
| Token 速度 | 10–20 tok/s | ≥ 8 tok/s ✓ |
| RAM | 1.2–1.8 GB | < 8 GB ✓ |

---

## 情境劇本（14 個）

| 災種 | 情境 |
|------|------|
| 地震（4） | 辦公室、深夜家中、戶外街道、捷運車廂 |
| 颱風洪水（3） | 社區低窪、山區土石流、地下室閃洪 |
| 火災（3） | 住宅大樓、百貨公司、高樓 28 樓 |
| 人為災難（2） | 捷運站暴力、化學物質外洩 |
| 複合災害（3） | 地震+火災、颱風停電、戰時斷網斷電 |

---

## 常見問題

| 錯誤 | 解法 |
|------|------|
| Cannot find type 'llama_model' | 重做步驟 3，確認 llama 套件加入 Target |
| Cannot find type 'ORTSession' | 重做步驟 3，確認 OnnxRuntime 套件加入 Target |
| Signing requires a development team | 步驟 5，Team 選 Apple ID |
| 狀態列顯示「BM25 純關鍵字」 | 確認 bge-small-zh.onnx 已傳入且檔名正確 |
| 找不到 .gguf 模型檔 | 確認 .gguf 已傳入 PocketKB Documents |
| App 打開閃退 | 截圖 Xcode Console 錯誤 Log 給 Claude |

---

## Bug 修正紀錄

| # | 問題 | 修法 |
|---|------|------|
| FIX #1 | async callback 陣列 index crash | UUID 查找 |
| FIX #2 | buildIndex 阻塞主執行緒 | Task.detached 背景執行 |
| FIX #3 | 模型檔名硬編碼 | 動態掃描 .gguf |
| FIX #4 | 重複觸發推理 | guard !isGenerating |
| FIX #5 | Context Window OOM | 滑動視窗 8 則 |
| FIX #6 | 串流不自動捲動 | onChange(last?.content) |
| FIX #7 | 鍵盤遮擋輸入框 | .ignoresSafeArea(.keyboard) |
| FIX #8 | 返回時 GPU 持續消耗 | llama.cancel() |
| FIX #9 | CPR/PFA 分類錯誤 | 新增 firstAid 分類 |
| FIX #10 | 浮層鍵盤遮擋 | .ignoresSafeArea(.keyboard) |
| FIX #11 | evaluate.py 分類不對齊 | 統一為「急救知識」 |
| FIX #12 | 三個頁面對話污染 | 獨立 session 分離 |
| FIX #13 | 語音導覽按下無反應 | Alert 提示「開發中」 |
