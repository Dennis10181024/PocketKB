import Foundation
// OnnxRuntime: https://github.com/microsoft/onnxruntime (SPM: onnxruntime-swift-package-manager)
import OnnxRuntime

// MARK: - Hybrid RAG Engine
/// 混合檢索：BM25（關鍵字）+ MiniLM ONNX（語意向量）
/// 用 Reciprocal Rank Fusion (RRF) 融合兩個分數
///
/// 跨平台設計：
/// - iOS：同一個 .onnx 模型檔
/// - Android（未來）：同一個 .onnx 模型檔，換 Kotlin 包裝即可
/// 模型：all-MiniLM-L6-v2（22MB，對應計畫書備選方案）
final class HybridRAGEngine {

    // MARK: - BM25 參數
    private let k1: Double = 1.5
    private let b:  Double = 0.75

    // MARK: - 語料狀態
    private var corpus:     [KnowledgeChunk]   = []
    private var bm25TF:     [[String: Double]] = []
    private var bm25IDF:    [String: Double]   = [:]
    private var avgDocLen:  Double             = 0

    // MARK: - ONNX 推論
    private var ortEnv:      ORTEnvironment?
    private var ortSession:  ORTSession?

    // 嵌入維度：BGE-small-zh = 512 維（中文優化）
    // 注意：all-MiniLM-L6-v2 是 384 維英文模型，不適合中文，已棄用
    private let embDim = 512

    // MARK: - VES SQLite 向量資料庫（對應計畫書）
    private let vectorStore = VectorStore()

    // MARK: - RRF 參數
    private let rrfK: Double = 60

    // MARK: - 是否已就緒
    private(set) var isSemanticReady = false

    // ─────────────────────────────────────────────────────────────
    // MARK: 初始化（背景執行緒呼叫）
    // ─────────────────────────────────────────────────────────────

    /// 建立索引。傳入 modelPath 為 all-MiniLM-L6-v2.onnx 的路徑。
    /// 若 modelPath 為 nil，退回純 BM25。
    func buildIndex(from chunks: [KnowledgeChunk], modelPath: String? = nil, vocabPath: String? = nil) {
        corpus = chunks
        buildBM25Index(chunks: chunks)

        if let path = modelPath {
            do {
                try loadONNX(modelPath: path)

                // vocab.txt 必須存在才能啟用語意檢索
                // 沒有 vocab → 假向量反而拉低 BM25 準確率，直接退回純 BM25
                if let vPath = vocabPath {
                    loadVocab(path: vPath)
                } else {
                    print("[HybridRAG] 缺少 vocab.txt，退回純 BM25（請同時傳入 vocab.txt）")
                    isSemanticReady = false
                    return
                }

                guard vocabLoaded else {
                    isSemanticReady = false
                    return
                }

                // 若 VectorStore 已有索引（重啟後不需重算）直接使用
                if !vectorStore.hasIndex {
                    let items = chunks.map { chunk in (
                        chunkId:  chunk.id,
                        title:    chunk.title,
                        category: chunk.category.rawValue,
                        vector:   encode(text: chunk.title + " " + chunk.content)
                    )}
                    vectorStore.batchUpsert(items: items)
                    let stats = vectorStore.stats()
                    print("[HybridRAG] 向量索引建立完成：\(stats.count) 筆，\(stats.dbSizeKB) KB")
                } else {
                    print("[HybridRAG] 載入已有向量索引（SQLite 持久化）")
                }
                isSemanticReady = true
            } catch {
                print("[HybridRAG] ONNX 載入失敗，退回 BM25：\(error)")
                isSemanticReady = false
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // MARK: 檢索
    // ─────────────────────────────────────────────────────────────

    func retrieve(query: String, topK: Int = 3) -> [RetrievalResult] {
        if isSemanticReady {
            return hybridRetrieve(query: query, topK: topK)
        } else {
            return bm25Retrieve(query: query, topK: topK)
        }
    }

    // ─────────────────────────────────────────────────────────────
    // MARK: 混合檢索（BM25 + 語意向量 + RRF）
    // ─────────────────────────────────────────────────────────────

    private func hybridRetrieve(query: String, topK: Int) -> [RetrievalResult] {
        // 1. BM25 排名
        let bm25Ranked = bm25RankedIndices(query: query)

        // 2. 語意向量排名
        let queryVec     = encode(text: query)
        let semanticRanked = semanticRankedIndices(queryVec: queryVec)

        // 3. RRF 融合
        var rrfScores = [Int: Double]()
        for (rank, idx) in bm25Ranked.enumerated() {
            rrfScores[idx, default: 0] += 1.0 / (rrfK + Double(rank + 1))
        }
        for (rank, idx) in semanticRanked.enumerated() {
            rrfScores[idx, default: 0] += 1.0 / (rrfK + Double(rank + 1))
        }

        // 4. 取 Top-K
        let sorted = rrfScores.sorted { $0.value > $1.value }.prefix(topK)

        return sorted.map { (docIdx, score) in
            let chunk   = corpus[docIdx]
            let terms   = bm25QueryTerms(query).filter { (bm25TF[docIdx][$0] ?? 0) > 0 }
            return RetrievalResult(chunk: chunk,
                                   score: score * 100,   // 放大方便 UI 顯示
                                   matchedTerms: Array(Set(terms)))
        }
    }

    // ─────────────────────────────────────────────────────────────
    // MARK: BM25 內部
    // ─────────────────────────────────────────────────────────────

    private func buildBM25Index(chunks: [KnowledgeChunk]) {
        bm25TF = chunks.map { termFrequencies(for: $0.content + " " + $0.title) }
        let N  = Double(chunks.count)
        guard N > 0 else { return }
        avgDocLen = bm25TF.map { $0.values.reduce(0, +) }.reduce(0, +) / N

        var df: [String: Int] = [:]
        for docTF in bm25TF { for term in docTF.keys { df[term, default: 0] += 1 } }
        bm25IDF = df.mapValues { df_t in
            log((N - Double(df_t) + 0.5) / (Double(df_t) + 0.5) + 1)
        }
    }

    private func bm25RankedIndices(query: String) -> [Int] {
        let queryTerms = bm25QueryTerms(query)
        var scores = [(idx: Int, score: Double)]()
        for (docIdx, docTF) in bm25TF.enumerated() {
            let docLen = docTF.values.reduce(0, +)
            var score: Double = 0
            for term in queryTerms {
                let tf_td  = docTF[term] ?? 0
                let idfVal = bm25IDF[term] ?? 0
                let num = tf_td * (k1 + 1)
                let den = tf_td + k1 * (1 - b + b * docLen / max(avgDocLen, 1))
                score += idfVal * (num / den)
            }
            scores.append((docIdx, score))
        }
        return scores.sorted { $0.score > $1.score }.map { $0.idx }
    }

    func bm25Retrieve(query: String, topK: Int) -> [RetrievalResult] {
        let ranked = bm25RankedIndices(query: query)
        return ranked.prefix(topK).compactMap { docIdx in
            let score = bm25TF[docIdx].keys
                .compactMap { term -> Double? in
                    guard let idf = bm25IDF[term] else { return nil }
                    let tf  = bm25TF[docIdx][term] ?? 0
                    let len = bm25TF[docIdx].values.reduce(0, +)
                    let num = tf * (k1 + 1)
                    let den = tf + k1 * (1 - b + b * len / max(avgDocLen, 1))
                    return idf * (num / den)
                }.reduce(0, +)
            guard score > 0 else { return nil }
            let chunk = corpus[docIdx]
            let terms = bm25QueryTerms(query).filter { (bm25TF[docIdx][$0] ?? 0) > 0 }
            return RetrievalResult(chunk: chunk, score: score,
                                   matchedTerms: Array(Set(terms)))
        }
    }

    private func bm25QueryTerms(_ query: String) -> [String] {
        tokenise(query)
    }

    // ─────────────────────────────────────────────────────────────
    // MARK: ONNX 語意向量
    // ─────────────────────────────────────────────────────────────

    private func loadONNX(modelPath: String) throws {
        ortEnv     = try ORTEnvironment(loggingLevel: .warning)
        let opts   = try ORTSessionOptions()
        try opts.setIntraOpNumThreads(2)       // 手機省電：限制執行緒數
        ortSession = try ORTSession(env: ortEnv!,
                                    modelPath: modelPath,
                                    sessionOptions: opts)
    }

    /// 將文字編碼為向量（BGE-small-zh：512維，中文優化）
    private func encode(text: String) -> [Float] {
        guard let session = ortSession, let env = ortEnv else {
            return [Float](repeating: 0, count: embDim)
        }
        // 若 vocab 未載入，退回零向量（BM25 仍正常運作）
        guard vocabLoaded else {
            return [Float](repeating: 0, count: embDim)
        }

        // 正確的 BERT WordPiece tokenization（查詞表）
        let tokens   = bertTokenize(text: text, maxLen: 128)
        let inputIds = tokens.inputIds
        let mask     = tokens.attentionMask

        do {
            // 建立 ONNX 輸入 tensor
            let batchSize: NSNumber = 1
            let seqLen    = NSNumber(value: inputIds.count)
            let shape     = [batchSize, seqLen]

            let inputIdsTensor = try ORTValue(
                tensorData: NSMutableData(bytes: inputIds.map { Int64($0) },
                                          length: inputIds.count * MemoryLayout<Int64>.size),
                elementType: .int64, shape: shape)

            let maskTensor = try ORTValue(
                tensorData: NSMutableData(bytes: mask.map { Int64($0) },
                                          length: mask.count * MemoryLayout<Int64>.size),
                elementType: .int64, shape: shape)

            let tokenTypeTensor = try ORTValue(
                tensorData: NSMutableData(bytes: [Int64](repeating: 0, count: inputIds.count),
                                          length: inputIds.count * MemoryLayout<Int64>.size),
                elementType: .int64, shape: shape)

            // 推論
            let outputs = try session.run(
                withInputs: ["input_ids":      inputIdsTensor,
                             "attention_mask": maskTensor,
                             "token_type_ids":tokenTypeTensor],
                outputNames: ["last_hidden_state"],
                runOptions: nil)

            // Mean pooling（對 sequence 維度取平均）
            guard let hiddenState = outputs["last_hidden_state"] else {
                return [Float](repeating: 0, count: embDim)
            }
            let data  = try hiddenState.tensorData() as Data
            let count = data.count / MemoryLayout<Float>.size
            var floats = [Float](repeating: 0, count: count)
            _ = floats.withUnsafeMutableBytes { data.copyBytes(to: $0) }

            // floats shape: [1, seqLen, embDim] → mean over seqLen
            let hidDim  = embDim
            let seqL    = inputIds.count
            var pooled  = [Float](repeating: 0, count: hidDim)
            for t in 0..<seqL {
                for d in 0..<hidDim {
                    pooled[d] += floats[t * hidDim + d]
                }
            }
            let scale = Float(seqL)
            pooled = pooled.map { $0 / scale }

            return normalise(pooled)

        } catch {
            return [Float](repeating: 0, count: embDim)
        }
    }

    private func semanticRankedIndices(queryVec: [Float]) -> [Int] {
        // 從 SQLite VectorStore 搜尋，取全部結果後依 chunk_id 對應 corpus index
        let results = vectorStore.search(queryVector: queryVec, topK: corpus.count)
        return results.compactMap { item in
            corpus.firstIndex(where: { $0.id == item.chunkId })
        }
    }

    // ─────────────────────────────────────────────────────────────
    // MARK: 數學工具
    // ─────────────────────────────────────────────────────────────

    private func cosineSimilarity(_ a: [Float], _ b: [Float]) -> Float {
        guard a.count == b.count else { return 0 }
        var dot: Float = 0; var na: Float = 0; var nb: Float = 0
        for i in 0..<a.count { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i] }
        let denom = sqrt(na) * sqrt(nb)
        return denom > 0 ? dot / denom : 0
    }

    private func normalise(_ v: [Float]) -> [Float] {
        let norm = sqrt(v.reduce(0) { $0 + $1 * $1 })
        return norm > 0 ? v.map { $0 / norm } : v
    }

    // ─────────────────────────────────────────────────────────────
    // MARK: 正確的 BERT WordPiece Tokenizer
    // BGE-small-zh 使用 BERT 詞表：每個中文字對應詞表中的精確 ID
    // 詞表檔案：vocab.txt（和 bge-small-zh.onnx 一起下載，約 100KB）
    // ─────────────────────────────────────────────────────────────
    private var vocab: [String: Int] = [:]
    private var vocabLoaded = false

    /// 載入 vocab.txt（BERT 標準格式，每行一個 token）
    func loadVocab(path: String) {
        guard let content = try? String(contentsOfFile: path, encoding: .utf8) else {
            print("[HybridRAG] vocab.txt 載入失敗，語意檢索將退回 BM25")
            return
        }
        var map: [String: Int] = [:]
        for (idx, line) in content.components(separatedBy: "\n").enumerated() {
            let token = line.trimmingCharacters(in: .whitespacesAndNewlines)
            if !token.isEmpty { map[token] = idx }
        }
        vocab = map
        vocabLoaded = !map.isEmpty
        print("[HybridRAG] vocab.txt 載入成功：\(map.count) 個 token")
    }

    private struct TokenizeResult {
        let inputIds:      [Int]
        let attentionMask: [Int]
    }

    /// BERT WordPiece tokenization（中文字符級 + 英文詞彙查表）
    private func bertTokenize(text: String, maxLen: Int) -> TokenizeResult {
        let clsId = vocab["[CLS]"] ?? 101
        let sepId = vocab["[SEP]"] ?? 102
        let unkId = vocab["[UNK]"] ?? 100
        let padId = 0

        var ids = [clsId]

        for scalar in text.unicodeScalars.prefix(maxLen - 2) {
            let char = String(scalar)
            let v = scalar.value

            if v >= 0x4E00 && v <= 0x9FFF {
                // CJK 字符：直接查詞表
                ids.append(vocab[char] ?? unkId)
            } else if v >= 0x0041 && v <= 0x007A || v >= 0x0061 && v <= 0x007A {
                // ASCII 英文：小寫後查詞表
                ids.append(vocab[char.lowercased()] ?? unkId)
            } else if v == 0x0020 {
                // 空格：跳過
                continue
            } else {
                ids.append(vocab[char] ?? unkId)
            }
        }
        ids.append(sepId)

        // Padding 到 maxLen
        let mask = [Int](repeating: 1, count: ids.count)
            + [Int](repeating: 0, count: max(0, maxLen - ids.count))
        let paddedIds = ids + [Int](repeating: padId, count: max(0, maxLen - ids.count))

        return TokenizeResult(
            inputIds:      Array(paddedIds.prefix(maxLen)),
            attentionMask: Array(mask.prefix(maxLen))
        )
    }

    // ─────────────────────────────────────────────────────────────
    // MARK: BM25 Tokenizer（中文 bigram + 英文詞）
    // ─────────────────────────────────────────────────────────────
    private func tokenise(_ text: String) -> [String] {
        let lower = text.lowercased()
        var tokens: [String] = []
        var buf = ""
        for char in lower {
            if char.isLetter || char.isNumber { buf.append(char) }
            else { if !buf.isEmpty { tokens.append(buf); buf = "" } }
        }
        if !buf.isEmpty { tokens.append(buf) }

        let cjk = lower.unicodeScalars
            .filter { $0.value >= 0x4E00 && $0.value <= 0x9FFF }
            .map { String($0) }
        let bigrams = stride(from: 0, to: cjk.count - 1, by: 1)
            .map { cjk[$0] + cjk[$0 + 1] }

        return (tokens + bigrams).filter { !stopwords.contains($0) }
    }

    private func termFrequencies(for text: String) -> [String: Double] {
        var freq: [String: Double] = [:]
        tokenise(text).forEach { freq[$0, default: 0] += 1 }
        return freq
    }

    private let stopwords: Set<String> = [
        "的","了","在","是","我","有","和","就","不","人","都","一",
        "上","也","很","到","說","要","去","你","會","著","看","好",
        "自己","這","那","些","但","從","以","為","對","或","及","等",
        "與","因","讓","後","前","中","外","內","時","當","而","再","被"
    ]

    // ─────────────────────────────────────────────────────────────
    // MARK: Prompt 組裝（與原 RAGEngine 相同介面）
    // ─────────────────────────────────────────────────────────────
    // MARK: - PDF 匯入支援
    // ─────────────────────────────────────────────────────────────
    // PDFImportView 使用的三個公開方法
    // ─────────────────────────────────────────────────────────────

    /// 對外公開的 encode 方法，供 PDFImportView 向量化 chunk
    func encodeForImport(text: String) -> [Float] {
        guard isSemanticReady else { return [Float](repeating: 0, count: embDim) }
        return encode(text: text)
    }

    /// 批次寫入動態 chunk + 向量到 corpus 和 VectorStore
    func importChunks(_ chunks: [DynamicChunk],
                      vectorItems: [(chunkId: String, title: String,
                                     category: String, vector: [Float])]) {
        // 轉換成 KnowledgeChunk 格式加入 corpus
        let newChunks = chunks.map { dc in
            KnowledgeChunk(
                id:       dc.id,
                title:    dc.title,
                content:  dc.content,
                category: .firstAid,   // 匯入的文件統一歸類為急救知識
                tags:     ["匯入", dc.source]
            )
        }

        // 更新 BM25 索引（重新對整個 corpus 建立）
        corpus.append(contentsOf: newChunks)
        buildBM25Index(chunks: corpus)

        // 寫入 SQLite 向量索引
        if isSemanticReady {
            vectorStore.batchUpsert(items: vectorItems)
        }
    }

    /// 刪除指定來源的所有動態 chunk
    func deleteImportedChunks(source: String) {
        corpus.removeAll { $0.tags.contains(source) }
        buildBM25Index(chunks: corpus)
        // SQLite 側用 source 前綴刪除
        vectorStore.deleteBySourcePrefix(source)
    }

    // MARK: - Prompt 組裝
    func buildPrompt(query: String, results: [RetrievalResult],
                     systemPrompt: String, history: [ChatMessage] = []) -> String {
        let context = results.enumerated().map { i, r in
            "【參考資料\(i+1)：\(r.chunk.title)】\n\(r.chunk.content)"
        }.joined(separator: "\n\n")

        let historyText = history
            .filter { !$0.content.isEmpty }
            .dropLast()
            .map { $0.role == .user
                ? "<|user|>\n\($0.content)<|end|>"
                : "<|assistant|>\n\($0.content)<|end|>" }
            .joined(separator: "\n")

        return """
        <|system|>
        \(systemPrompt)

        以下是從本地防災知識庫檢索到的相關資料，請根據這些資料回答：
        \(context)
        <|end|>
        \(historyText)
        <|user|>
        \(query)
        <|assistant|>
        """
    }
}
