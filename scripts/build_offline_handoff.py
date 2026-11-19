"""Export a credential-free teammate snapshot. No product files are rewritten."""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import textwrap
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "offline-handoff"
NAME = "PocketKB_offline_handoff_2026-11-19"
DEST = OUT / NAME


def save(path: str, value, *, json_data=False):
    target = DEST / path
    target.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(value, ensure_ascii=False, indent=2) + "\n" if json_data else value
    target.write_text(content, encoding="utf-8" if json_data else "utf-8-sig")


def quoted(block, key):
    match = re.search(r'\b' + key + r'\s*=\s*("(?:\\.|[^"\\])*")', block)
    if not match:
        raise ValueError("Missing string field: " + key)
    return json.loads(match[1])


def export_data():
    text = (ROOT / "android/app/src/main/java/com/pocketkb/android/core/KnowledgeBase.kt").read_text(encoding="utf-8-sig")
    sources = {}
    for match in re.finditer(r'private val (\w+) = KnowledgeSource\((.*?)\n    \)', text, re.S):
        key, block = match.groups()
        sources[key] = {"id": key, **{field: quoted(block, field) for field in ("agency", "title", "url", "note")},
                        "licenseStatus": "UNKNOWN", "claimReviewStatus": "NOT_REVIEWED_FOR_HANDOFF"}
    chunks = []
    for match in re.finditer(r'        KnowledgeChunk\((.*?)\n        \),', text, re.S):
        block = match[1]
        source_id = re.search(r'\bsource = (\w+)', block)[1]
        tags = re.search(r'tags = listOf\((.*?)\)', block, re.S)[1]
        chunks.append({**{field: quoted(block, field) for field in ("id", "title", "content")},
                       "category": re.search(r'category = DisasterCategory\.(\w+)', block)[1],
                       "tags": [json.loads(m[0]) for m in re.finditer(r'"(?:\\.|[^"\\])*"', tags)],
                       "sourceId": source_id,
                       "localMaterialReference": sources[source_id]["url"].startswith("本機教材"),
                       "reviewStatus": "NOT_REVIEWED_FOR_HANDOFF"})
    guides = []
    for match in re.finditer(r'        EmergencyGuide\((.*?)\n        \),', text, re.S):
        block = match[1]
        category = re.search(r'category = DisasterCategory\.(\w+)', block)[1]
        guides.append({"id": "android-guide-" + category.lower(), "category": category,
                       "headline": quoted(block, "headline"), "callout": quoted(block, "callout"),
                       "sourceId": re.search(r'\bsource = (\w+)', block)[1],
                       "steps": [{"order": int(m[1]), "text": json.loads(m[2])} for m in re.finditer(r'EmergencyStep\((\d+),\s*("(?:\\.|[^"\\])*")\)', block)],
                       "reviewStatus": "NOT_REVIEWED_FOR_HANDOFF"})
    assert (len(sources), len(chunks), len(guides)) == (15, 24, 5)
    assert len({c["id"] for c in chunks}) == len(chunks)
    assert all(c["sourceId"] in sources for c in chunks + guides)
    assert all(g["steps"] for g in guides)
    header = {"schemaVersion": "handoff-1", "origin": "Android KnowledgeBase.kt current working tree",
              "status": "EXPORT_ONLY_NOT_EXPERT_VALIDATED", "contentWasRewritten": False}
    save("data/android-knowledge-all.json", {**header, "chunks": chunks}, json_data=True)
    public = [c for c in chunks if not c["localMaterialReference"]]
    save("data/android-knowledge-public-reference.json", {**header, "note": "Public URL is not a reuse license or safety approval.", "chunks": public}, json_data=True)
    save("data/android-emergency-guides.json", {**header, "guides": guides}, json_data=True)
    save("data/android-sources.json", {**header, "sources": list(sources.values())}, json_data=True)
    return {"androidKnowledge": len(chunks), "publicReferenceKnowledge": len(public), "localMaterialKnowledge": len(chunks)-len(public), "androidGuides": len(guides), "androidSources": len(sources)}


README = r'''# PocketKB 離線防災輔助交接包

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
'''

HANDOFF = r'''# 組員工程交接

## 已有內容與實際入口

| 部分 | 路徑（相對 source/） | 實際能力與限制 |
|---|---|---|
| Android 語料／緊急指引 | android/app/src/main/java/com/pocketkb/android/core/KnowledgeBase.kt | 24知識、5緊急指引、15來源；本輪匯出為JSON，沒有改寫原文 |
| Android 本機檢索 | android/app/src/main/java/com/pocketkb/android/core/RagEngine.kt | 中文單字／雙字與拉丁詞的 BM25式排名；不是語意向量索引 |
| Android 查詢UI | android/app/src/main/java/com/pocketkb/android/ui/AppScreens.kt：ResourcesScreen | 共用知識庫、分類、自由文字搜尋、展開原文及來源 |
| Android 災時卡片UI | 同上：EmergencyScreen | 既定緊急步驟；不是完整災時多輪AI代理 |
| Android 對話協調 | android/app/src/main/java/com/pocketkb/android/PocketKbViewModel.kt | 舊對話可檢索及組提示；實驗性本地LLM預設關閉。新版六情境使用各自狀態機，不能說都在用此RAG |
| 本機模型整合原始碼 | android/app/src/main/java/com/pocketkb/android/ai/ 與 cpp/ | 有相關包裝；未交付模型、原生函式庫或本輪裝置驗證 |
| Swift 語料 | Models/KnowledgeBase.swift | 14筆舊知識、14個提示詞情境、5緊急指引。知識結構沒有逐筆source欄位，不與Android合併去重 |
| Swift 查詢／災時UI | Views/GuideView.swift、Views/EmergencyGuideView.swift | QuickGuideView / EmergencyGuideView；AI入口與模型狀態相關 |
| Swift 對話 | Models/AppState.swift | drill / emergency / guide 訊息分開，檢索共用HybridRAGEngine；不代表新版產品已統一 |
| Swift 混合檢索 | Models/HybridRAGEngine.swift、Models/VectorStore.swift | BM25＋ONNX／RRF及SQLite程式。缺模型／vocab可回退BM25；中文模型實跑品質本輪未驗證 |
| Swift 本地推論 | Models/LlamaInference.swift | llama.cpp包裝；硬體與推論品質未驗證 |
| 原有Web | web-pwa/app.js、styles.css、index.html | 3筆知識與舊網頁查詢；不能把它當成24筆完整共同RAG介面 |
| 六新版劇本 | web-pwa/scenarios/、fire-engine.js、scenario-engine-v3.js | 狀態機與JSON可作情境背景、風險限制參考；不要把虛構劇情當真實災情文件 |
| 可選線上原型 | online-coach/ | 僅為完整依賴參考；離線工作不必啟動、不可依賴雲端才有答案 |

## 目前沒有完成的部分

- 沒有已整合的新版本「模擬與離線輔助完全相同查詢介面」。
- 沒有可據本輪證據聲稱完成的 Android 向量RAG＋本地LLM災時多輪輔助。
- JSON匯出不是來源准入，也不是內容校正；知識與舊Swift內容仍需專業審查。
- 部分通用提示帶有演練裁判語氣，不能直接當作災時輔助system prompt。
- 固定緊急卡片不等於能判斷真實個人環境；無法確認地點、路況、電源安全或傷勢時，必須保留未知。

## 建議接手順序

1. 以Android 24筆匯出作**待審查候選語料**，保留Swift舊版供比對；不要合併相同ID的不同原文。
2. 先完成資料准入：逐條claim、官方段落／頁碼、日期、適用條件、授權與reviewStatus。8筆本機教材摘要另確認使用權。
3. 建立同一個查詢元件／同一retriever；模擬與災時模式只在外層注入context，不另外複製UI。
4. 先交付可用的離線原文查詢與來源卡，再把通過審查的片段提供給本地模型生成；沒有命中時不臆造回答。
5. 演練動作仍由唯一FSM決定；RAG查詢與AI回覆不可直接寫入演練state。
6. 最後才測設備上的語意檢索、生成、耗時、斷網及實驗介面一致性；數字只來自實跑log。

## 實驗一致性提醒

兩組至少固定：查詢欄位、入口、原文卡、來源展示、可查語料版本、檢索參數與回答不可得的呈現。若使用者想研究AI輔助效果，生成層是否出現應是明確的實驗操弄，而不是順帶更換知識庫或搜尋UI。若需scenario category filter，兩組須採同一套、並記錄filter；不要在其中一組默默回傳分類前三筆作為「檢索命中」。現有 scenarioAwareRetrieval 有同分類fallback，須與自由查詢區分。

本包是交接素材，不含對方Flutter專案的實際移植；Dart schema與元件介面尚待雙方確認。
'''

CONTRACT = r'''# 共同查詢介面契約（提案，未實作於產品）

## 單一資料與單一元件

```text
演練頁 ───────┐
              ├─ SharedKnowledgePanel ─ OfflineRetriever ─ 同版本本機語料
災時輔助頁 ───┘          │
                        └─ 可選 LocalAnswerGenerator（只能讀取已核准hits）
```

Flutter可實作成同一個Widget；本包提供的Compose／SwiftUI／Web是參考來源，不可稱為現成Dart元件。

QueryRequest:
`requestId, query, corpusVersion, topK, categoryFilter?, context{mode, scenarioId?, observedFacts?}`

QueryResponse:
`requestId, corpusVersion, retrieverVersion, status(hits|no_match|unavailable), hits[{chunkId, title, content, score, matchedTerms, sourceIds, reviewStatus}]`

Source:
`sourceId, agency, title, urlOrBibliography, publicationDate?, checkedAt?, supportingExcerpt?, page?, licenseStatus, reviewStatus`

Answer（可選）:
`text, citedChunkIds, citedSourceIds, missingConditions, generationStatus, modelVersion`

所有欄位為建議，不代表原產品已實作。handoff-1 JSON保留原欄位與NOT_REVIEWED狀態，不虛構出版日期／支持段落。

## 行為規則

- 原文查詢可在無模型、無網路下操作。來源URL可顯示，但點開可能需要網路；關鍵摘錄須隨核准語料本機保存。
- 所有模式使用同一個query輸入、分類與來源元件。mode不是另一份UI。
- 同語料、參數與問題須產生同一排序；同分採固定順序，記錄版本與filter。
- topK限制、空查詢、無命中、來源缺失、模型不可用都有明確狀態；不把同分類任意三筆假裝成相關命中。
- 生成器只使用准入片段；本包未審語料不應直接投入正式災時生成。來源不足時明示無法確認。
- 模擬的虛構路況與現實災情分開。檢索是read-only；AI不得宣告已救援或自行推進FSM。
- 不以未經確認的現場條件推導開關電源、路線可通行等結論。
- 不把舊的「嚴格演練裁判」提示直接用於真實災時協助。

## 接手驗收（待執行，不是本包測試成績）

1. 模擬與離線輔助兩入口引用同一元件與語料版本；固定問題的hit ID／來源一致。
2. 飛航模式冷啟動、無模型、無命中仍可操作原文查詢。
3. 有模型時回答可追溯到核准片段；未知現場條件不被補寫。
4. 查詢與生成失敗不改動劇情狀態。
5. 記錄輸入、版本、hit ID、filter、延遲及錯誤；不得記錄憑證。
6. 逐項測大字、來源展開、閱讀器標籤與返回行為。
'''

REVIEW = r'''# 內容與授權審查邊界

所有匯出皆保留原文，NOT_REVIEWED_FOR_HANDOFF。Source ID存在不等於claim受到該來源支持，也不代表可以公開再利用。

- Android：24知識、5緊急指引、15來源。8筆知識及1組整備指引引用本機防災士教材，未附原PDF/RAR。完整摘要為組內盤點用途；納入對方系統前確認使用權。範例retriever預設排除這8筆知識。
- 16筆具公開連結的候選知識仍須內容／授權審查，沒有被標成「已核准」；相關來源可能是概括指引。
- Swift：14筆知識及5緊急指引缺逐筆source。保留原始碼供追查，**不自動加入新系統生成語料**。
- Swift／Android相同chunk ID的內容並不相同，禁止只按ID覆蓋或當成同一版本。
- 六情境JSON中的封路、電量、時間與災況是合成設定；不得作真實事故機率、預報或生存模型。

## 優先人工查核清單（保留原文，不在本輪擅自修成新建議）

- Swift舊文有玻璃貼X膠帶、72小時敘述、特定求救節奏、簡訊報警等具體說法；逐條查證現行官方資料、地區適用條件與支持段落後再決定是否保留。
- Android原文中的掩護位置、電源／瓦斯操作、缺氧因果等，也需釐清前置條件與支持證據；有來源欄位仍不足以證明每一句安全正確。
- 知識摘要、緊急卡與新版劇本的行動教學需交叉比對，避免同一問題給出互相衝突或過度概括的說明。
- Swift舊prompt及AppState的步數進度不是安全正確性的證據。
- iOS ONNX與中文embedding程式有模型名稱註解不一致；是否載入正確模型、tokenizer、索引版本與真正使用語意檢索，本輪未實測。

建議准入狀態：RAW → SOURCE_TRACED → EXPERT_REVIEWED → APPROVED_FOR_SCOPE。記錄原文hash、claim、支持段落、來源版本、授權、適用對象與審查者。此流程是接手建議，尚未宣稱專案已完成。
'''


def build():
    if DEST.exists() or (OUT / (NAME + ".zip")).exists():
        raise SystemExit("Output already exists; choose a new version instead of overwriting.")
    paths = set()
    for folder in ("Models", "Views"):
        paths.update((ROOT / folder).glob("*.swift"))
    for folder in ("android/app/src/main", "android/app/src/test"):
        paths.update(p for p in (ROOT / folder).rglob("*") if p.is_file() and p.suffix in {".kt", ".xml", ".cpp", ".h", ".txt"})
    for folder in ("web-pwa", "online-coach"):
        paths.update(p for p in (ROOT / folder).rglob("*") if p.is_file() and p.suffix in {".js", ".json", ".html", ".css", ".svg", ".webmanifest", ".md", ".ps1"} and not any(x in {"node_modules", "test-results", "test"} for x in p.parts))
    for name in ("PocketKBApp.swift", "DesignTokens.swift", "README.md", "DESIGN.md", "SCENARIO_AUTHORING_STANDARD.md", "SCENARIO_CONVERSATION_DESIGN.md", "SCENARIO_V3_IMPLEMENTATION.md", "SCENARIO_LOCATION_RESEARCH.md", "SCENARIO_TRAINING_EDUCATION_RESEARCH.md", "FIRE_DRILL_IMPLEMENTATION.md", "android/build.gradle.kts", "android/settings.gradle.kts", "android/gradle.properties", "android/app/build.gradle.kts", "android/README.md", "android/build-local.ps1", "docs/EXPERIENCE_SPEC.md"):
        if (ROOT / name).is_file():
            paths.add(ROOT / name)
    secret = re.compile(r'sk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')
    for path in sorted(paths):
        relative = path.relative_to(ROOT).as_posix()
        if path.name in {"local.properties", ".env"} or path.suffix in {".env", ".secret", ".keystore"}:
            raise ValueError("Forbidden path: " + relative)
        data = path.read_bytes()
        text = data.decode("utf-8-sig")
        if secret.search(text):
            raise ValueError("Credential-like content detected; export stopped. File: " + relative)
    for path in sorted(paths):
        relative = path.relative_to(ROOT).as_posix()
        data = path.read_bytes()
        target = DEST / "source" / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    counts = export_data()
    for name, content in [("README_先讀我.md", README), ("HANDOFF.md", HANDOFF), ("SHARED_QUERY_CONTRACT.md", CONTRACT), ("CONTENT_REVIEW.md", REVIEW)]:
        save(name, content)
    example = ROOT / "scripts/offline_handoff_query.cjs"
    save("examples/query.cjs", example.read_text(encoding="utf-8-sig"))
    save("tools/build_offline_handoff.py", Path(__file__).read_text(encoding="utf-8-sig"))
    save("tools/offline_handoff_query.cjs", example.read_text(encoding="utf-8-sig"))
    queries = ["門外有濃煙怎麼辦", "地震後怎麼撤離", "豪雨地下道", "zzzzunknownquery", ""]
    results = []
    for query in queries:
        run = subprocess.run(["node", str(DEST / "examples/query.cjs"), query], capture_output=True, text=True, encoding="utf-8", check=True)
        result = json.loads(run.stdout)
        results.append({"query": query, "hits": [hit["chunkId"] for hit in result["hits"]], "status": result["status"]})
    assert "fi_002" in results[0]["hits"]
    assert "eq_002" in results[1]["hits"]
    assert "ty_002" in results[2]["hits"]
    assert not results[3]["hits"] and not results[4]["hits"]
    save("VALIDATION.json", {"counts": counts, "tests": results,
         "contentRoundtrip": "Every exported Android chunk/guide field is extracted from unchanged source snapshot; schema counts and source IDs checked.",
         "notRun": ["Android/iOS build or device run", "browser UI/offline cold start", "LLM inference", "vector retrieval", "Kotlin/JS retrieval parity", "professional content or license review"],
         "credentialScan": {"status": "PASS", "scope": "all packaged UTF-8 text", "patterns": "API credential shape and private-key header; no matched secret values logged"}}, json_data=True)
    files = []
    for p in sorted(DEST.rglob("*")):
        if p.is_file():
            data = p.read_bytes()
            if secret.search(data.decode("utf-8-sig")):
                raise ValueError("Final credential scan failed. File: " + p.relative_to(DEST).as_posix())
            files.append({"path": p.relative_to(DEST).as_posix(), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
    save("MANIFEST.json", {"name": NAME, "createdAt": datetime.now(timezone.utc).isoformat(), "gitHead": commit,
         "snapshot": "current-working-tree-not-HEAD; manifest excludes itself", "counts": counts, "files": files}, json_data=True)
    archive = OUT / (NAME + ".zip")
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for p in sorted(DEST.rglob("*")):
            if p.is_file():
                z.write(p, (Path(NAME) / p.relative_to(DEST)).as_posix())
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        for p in DEST.rglob("*"):
            if p.is_file():
                assert z.read((Path(NAME) / p.relative_to(DEST)).as_posix()) == p.read_bytes()
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (OUT / (NAME + ".zip.sha256.txt")).write_text(digest + "  " + archive.name + "\n", encoding="utf-8-sig")
    print(json.dumps({"archive": str(archive), "files": len(files)+1, "bytes": archive.stat().st_size, "counts": counts, "queries": results, "zipIntegrity": "PASS", "secretScan": "PASS"}, ensure_ascii=False))


if __name__ == "__main__":
    build()
