import Foundation
import SQLite3

// MARK: - VectorStore
/// 對應計畫書：「輕量、跨平台、易整合的 VES (SQLite extension)」
/// 以 SQLite 儲存 chunk 向量索引，重啟後不需重新計算，跨平台可複用同一 DB 檔
///
/// 跨平台設計：
/// - iOS：Documents/pocketkb_vectors.db
/// - Android（未來）：同一套 SQL schema，換 Kotlin SQLite 包裝即可
final class VectorStore {

    // MARK: - 路徑
    private let dbPath: String
    private var db: OpaquePointer?

    // MARK: - 維度（all-MiniLM-L6-v2 輸出 384 維）
    // BGE-small-zh 輸出維度 = 512（all-MiniLM-L6-v2 是 384，已棄用）
    private let dim = 512

    // MARK: - Init
    init(dbName: String = "pocketkb_vectors.db") {
        let docs = FileManager.default.urls(
            for: .documentDirectory, in: .userDomainMask)[0]
        dbPath = docs.appendingPathComponent(dbName).path
        setupDatabase()
    }

    deinit { close() }

    // MARK: - 建立資料表
    private func setupDatabase() {
        guard sqlite3_open(dbPath, &db) == SQLITE_OK else {
            print("[VectorStore] 無法開啟資料庫：\(dbPath)")
            return
        }

        // chunk_vectors 表：儲存每個 chunk 的向量
        let createSQL = """
        CREATE TABLE IF NOT EXISTS chunk_vectors (
            chunk_id    TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            category    TEXT NOT NULL,
            vector_blob BLOB NOT NULL,
            created_at  INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE INDEX IF NOT EXISTS idx_chunk_id ON chunk_vectors(chunk_id);
        """
        execute(sql: createSQL)
    }

    // MARK: - 儲存向量
    func upsertVector(chunkId: String, title: String, category: String, vector: [Float]) {
        let sql = """
        INSERT OR REPLACE INTO chunk_vectors (chunk_id, title, category, vector_blob)
        VALUES (?, ?, ?, ?);
        """
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_text(stmt, 1, chunkId, -1, SQLITE_TRANSIENT)
        sqlite3_bind_text(stmt, 2, title,   -1, SQLITE_TRANSIENT)
        sqlite3_bind_text(stmt, 3, category,-1, SQLITE_TRANSIENT)

        // 向量序列化為 BLOB
        let blob = vector.withUnsafeBytes { Data($0) }
        blob.withUnsafeBytes { ptr in
            sqlite3_bind_blob(stmt, 4, ptr.baseAddress, Int32(blob.count), SQLITE_TRANSIENT)
        }
        sqlite3_step(stmt)
    }

    // MARK: - 批次儲存（建立索引時使用）
    func batchUpsert(items: [(chunkId: String, title: String, category: String, vector: [Float])]) {
        execute(sql: "BEGIN TRANSACTION;")
        for item in items {
            upsertVector(chunkId: item.chunkId, title: item.title,
                         category: item.category, vector: item.vector)
        }
        execute(sql: "COMMIT;")
    }

    // MARK: - 載入所有向量
    func loadAllVectors() -> [(chunkId: String, vector: [Float])] {
        let sql = "SELECT chunk_id, vector_blob FROM chunk_vectors ORDER BY chunk_id;"
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return [] }
        defer { sqlite3_finalize(stmt) }

        var results = [(chunkId: String, vector: [Float])]()
        while sqlite3_step(stmt) == SQLITE_ROW {
            let chunkId = String(cString: sqlite3_column_text(stmt, 0))
            let blobPtr  = sqlite3_column_blob(stmt, 1)
            let blobSize = sqlite3_column_bytes(stmt, 1)
            if let ptr = blobPtr, blobSize > 0 {
                let data = Data(bytes: ptr, count: Int(blobSize))
                let floats = data.withUnsafeBytes {
                    Array($0.bindMemory(to: Float.self))
                }
                results.append((chunkId: chunkId, vector: floats))
            }
        }
        return results
    }

    // MARK: - 向量相似度搜尋（cosine similarity）
    /// 對應計畫書：「向量資料庫需在手機端以有限的 I/O 頻寬完成毫秒級檢索」
    func search(queryVector: [Float], topK: Int = 3) -> [(chunkId: String, score: Float)] {
        let all = loadAllVectors()
        guard !all.isEmpty else { return [] }

        let scored = all.map { item -> (chunkId: String, score: Float) in
            let sim = cosineSimilarity(queryVector, item.vector)
            return (chunkId: item.chunkId, score: sim)
        }
        return scored.sorted { $0.score > $1.score }.prefix(topK).map { $0 }
    }

    // MARK: - 檢查是否已有索引
    var hasIndex: Bool {
        let sql = "SELECT COUNT(*) FROM chunk_vectors;"
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return false }
        defer { sqlite3_finalize(stmt) }
        return sqlite3_step(stmt) == SQLITE_ROW && sqlite3_column_int(stmt, 0) > 0
    }

    // MARK: - 按來源前綴刪除（PDF 匯入移除用）
    func deleteBySourcePrefix(_ prefix: String) {
        let sql = "DELETE FROM chunk_vectors WHERE chunk_id LIKE ?;"
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return }
        defer { sqlite3_finalize(stmt) }
        let pattern = "\(prefix)_%"
        sqlite3_bind_text(stmt, 1, pattern, -1, SQLITE_TRANSIENT)
        sqlite3_step(stmt)
    }

    // MARK: - 清除索引
    func clearIndex() {
        execute(sql: "DELETE FROM chunk_vectors;")
    }

    // MARK: - 取得索引統計
    func stats() -> (count: Int, dbSizeKB: Int) {
        var stmt: OpaquePointer?
        sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM chunk_vectors;", -1, &stmt, nil)
        sqlite3_step(stmt)
        let count = Int(sqlite3_column_int(stmt, 0))
        sqlite3_finalize(stmt)

        let attrs  = try? FileManager.default.attributesOfItem(atPath: dbPath)
        let size   = (attrs?[.size] as? Int ?? 0) / 1024
        return (count: count, dbSizeKB: size)
    }

    // MARK: - 數學工具
    private func cosineSimilarity(_ a: [Float], _ b: [Float]) -> Float {
        guard a.count == b.count else { return 0 }
        var dot: Float = 0; var na: Float = 0; var nb: Float = 0
        for i in 0..<a.count {
            dot += a[i] * b[i]
            na  += a[i] * a[i]
            nb  += b[i] * b[i]
        }
        let denom = sqrt(na) * sqrt(nb)
        return denom > 0 ? dot / denom : 0
    }

    // MARK: - SQLite 工具
    private func execute(sql: String) {
        var errMsg: UnsafeMutablePointer<CChar>?
        if sqlite3_exec(db, sql, nil, nil, &errMsg) != SQLITE_OK,
           let msg = errMsg {
            print("[VectorStore] SQL 錯誤：\(String(cString: msg))")
            sqlite3_free(errMsg)
        }
    }

    private func close() {
        if db != nil { sqlite3_close(db); db = nil }
    }
}
