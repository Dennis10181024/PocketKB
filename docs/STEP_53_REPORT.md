# 步驟 5.3 Android Gemma 4 整合

E2B 為開發版預設，E4B 為選配。兩個檔都從 LiteRT Community 的固定 revision 取得，由使用者在「演練設定 → 離線模型」確認大小與 Wi-Fi 後才開始或續傳。模型檔放在 app 私有且不備份的目錄。下載檔先保留為暫存檔，到齊後逐位元組核對 SHA-256，才原子移至可載入位置。APK 包含 LiteRT-LM Android 函式庫，模型權重另行取得。

| 模型 | 制品大小 | 來源 |
|---|---:|---|
| E2B | 2,588,147,712 bytes | [發布者固定 revision](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/commit/6e5c4f1e395deb959c494953478fa5cec4b8008f) |
| E4B | 3,659,530,240 bytes | [發布者固定 revision](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/commit/28299f30ee4d43294517a4ac93abd6163412f07f) |

以 LiteRT-LM Android 0.16.1 的 Kotlin `Engine` 串流接收完整輸出，設定也可選 llama.cpp 及匯入本機 GGUF。演練模型管理器序列化載入、生成與卸載，切換前先關閉前一模型。固定旁白和知識庫原文在缺檔、無網路、下載中、載入失敗、記憶體不足與模型逾時時仍可用。 [LiteRT-LM Kotlin 整合](https://github.com/google-ai-edge/LiteRT-LM/blob/v0.16.1/docs/api/kotlin/getting_started.md)

## 事實與來源

- 旁白只送這次已結算事件 ID、固定句和同一事件已審替代句。模型在原順序的候選中挑句，檢查 1–3 句、長度、常見簡體字及逐句候選歸屬。超過三句的複合事件直接保留固定版。採候選限制讓任意新增行動、傷勢或事件無法顯示。
- 問答先以現有 RagEngine 取回具官方連結且有足夠詞項重合的片段。模型只能挑段落索引，畫面顯示知識庫原文與程式附加的來源。索引失效退回首筆符合條件的原文。沒有合格片段時顯示「目前知識庫沒有相關資料」。
- 回傳比對 pack digest、session、attempt、decision、occurrence 與 requestId。換題、重來、離開或切換模型會清除待接收結果。模型回傳只改顯示文字，Kotlin FSM 及 Room 結果不受影響。

## 驗證與實機項目

- 真實 APK 已用固定 LiteRT-LM AAR 編譯。假模型涵蓋格式不符、造假、簡體、過長、缺模型、記憶體不足、限時與保留固定文字的路徑。旁白檢查使用兩包實際事件變體共 30 筆，外加針對字表及長度的獨立測試。
- 以假的 HTTP 傳輸檢查拒絕未同意下載、非 Wi-Fi、Range 續傳及 SHA-256 核對。真實模型制品未下載。
- 這台模擬器為 x86_64，總 RAM 2,531,956 KiB，當下空閒為 209,444 KiB，達不到 E2B 模型檔加 512 MiB 預留的載入門檻。本機只測 App 與既有流程。ARM64 手機仍需測 E2B／E4B 的冷啟動、正式下載／續傳、首字延遲、解碼 tokens／秒、峰值 RSS、長時間熱節流，以及下載失敗、低 RAM、取消後能否恢復。數值均未量測。
- OpenAI API 呼叫 0 次。
