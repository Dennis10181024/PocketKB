import SwiftUI
import PDFKit
import UniformTypeIdentifiers

// MARK: - PDF Import View
/// 使用者自行上傳 PDF → 自動切 chunk → BGE-small-zh 向量化 → 存入 VectorStore
/// 完全離線，不依賴任何網路
struct PDFImportView: View {
    @EnvironmentObject var state: AppState
    @Environment(\.dismiss) var dismiss

    @State private var isImporting      = false
    @State private var isProcessing     = false
    @State private var processingStatus = ""
    @State private var processedDocs:   [ImportedDocument] = []
    @State private var showError        = false
    @State private var errorMessage     = ""
    @State private var progress: Double = 0

    var body: some View {
        NavigationStack {
            ZStack {
                DS.Color.appBg.ignoresSafeArea()

                VStack(spacing: 0) {
                    // ── 說明橫幅 ──────────────────────────────────────
                    HStack(spacing: DS.Space.xs) {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(.green)
                        Text("完全離線處理・PDF 不會上傳到任何伺服器")
                            .font(DS.Type.caption())
                            .foregroundStyle(DS.Color.midGray)
                    }
                    .padding(.horizontal, DS.Space.m)
                    .padding(.vertical, DS.Space.xs)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(DS.Color.surface)

                    ScrollView {
                        VStack(spacing: DS.Space.m) {

                            // ── 上傳按鈕 ──────────────────────────────
                            Button {
                                isImporting = true
                            } label: {
                                VStack(spacing: DS.Space.m) {
                                    Image(systemName: "doc.badge.plus")
                                        .font(.system(size: 44))
                                        .foregroundStyle(DS.Color.safetyOrange)
                                    Text("選擇 PDF 檔案")
                                        .font(DS.Type.bodyLarge())
                                        .foregroundStyle(.white)
                                    Text("支援消防署防災士手冊、急救手冊等 PDF")
                                        .font(DS.Type.caption())
                                        .foregroundStyle(DS.Color.midGray)
                                        .multilineTextAlignment(.center)
                                    // 限制說明
                                    HStack(spacing: DS.Space.m) {
                                        Label("50MB 以內", systemImage: "doc.fill")
                                        Label("200 頁以內", systemImage: "book.fill")
                                        Label("需可選取文字", systemImage: "text.cursor")
                                    }
                                    .font(.system(size: 11))
                                    .foregroundStyle(DS.Color.midGray.opacity(0.7))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(DS.Space.xl)
                                .background(
                                    DS.Color.safetyOrange.opacity(0.08),
                                    in: RoundedRectangle(cornerRadius: DS.Radius.l)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: DS.Radius.l)
                                        .strokeBorder(
                                            DS.Color.safetyOrange.opacity(0.3),
                                            style: StrokeStyle(lineWidth: 1, dash: [6])
                                        )
                                )
                            }
                            .buttonStyle(.plain)
                            .disabled(isProcessing)
                            .padding(.horizontal, DS.Space.m)
                            .padding(.top, DS.Space.m)

                            // ── 處理中進度 ────────────────────────────
                            if isProcessing {
                                ProcessingCard(
                                    status:   processingStatus,
                                    progress: progress
                                )
                                .padding(.horizontal, DS.Space.m)
                            }

                            // ── 已匯入的文件清單 ──────────────────────
                            if !processedDocs.isEmpty {
                                VStack(alignment: .leading, spacing: DS.Space.xs) {
                                    HStack {
                                        Text("已匯入知識庫")
                                            .font(DS.Type.caption())
                                            .foregroundStyle(DS.Color.midGray)
                                        Spacer()
                                        Text("\(processedDocs.count) 份文件")
                                            .font(DS.Type.caption())
                                            .foregroundStyle(DS.Color.midGray)
                                    }
                                    .padding(.horizontal, DS.Space.m)

                                    ForEach(processedDocs) { doc in
                                        ImportedDocumentRow(doc: doc) {
                                            deleteDocument(doc)
                                        }
                                        .padding(.horizontal, DS.Space.m)
                                    }
                                }
                            }

                            // ── 使用說明 ──────────────────────────────
                            UsageGuideCard()
                                .padding(.horizontal, DS.Space.m)

                            Color.clear.frame(height: 40)
                        }
                    }
                }
            }
            .navigationTitle("匯入防災手冊")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("完成") { dismiss() }
                        .foregroundStyle(DS.Color.safetyOrange)
                }
            }
            // ── 檔案選擇器 ──────────────────────────────────────────
            .fileImporter(
                isPresented: $isImporting,
                allowedContentTypes: [.pdf],
                allowsMultipleSelection: false
            ) { result in
                switch result {
                case .success(let urls):
                    guard let url = urls.first else { return }
                    Task { await processPDF(url: url) }
                case .failure(let err):
                    errorMessage = err.localizedDescription
                    showError    = true
                }
            }
            .alert("匯入錯誤", isPresented: $showError) {
                Button("確定") { }
            } message: { Text(errorMessage) }
            .onAppear { loadExistingDocs() }
        }
    }

    // MARK: - 處理 PDF
    private func processPDF(url: URL) async {
        isProcessing     = true
        processingStatus = "讀取 PDF…"
        progress         = 0.05

        // 安全存取 iCloud / Files App 的檔案
        guard url.startAccessingSecurityScopedResource() else {
            await showErr("無法存取此檔案，請確認已授權")
            return
        }
        defer { url.stopAccessingSecurityScopedResource() }

        // ── 檔案大小檢查（上限 50MB）────────────────────────────
        let maxBytes = 50 * 1024 * 1024   // 50 MB
        if let attrs = try? FileManager.default.attributesOfItem(atPath: url.path),
           let size = attrs[.size] as? Int, size > maxBytes {
            let sizeMB = size / (1024 * 1024)
            await showErr("檔案大小 \(sizeMB)MB 超過上限（50MB）。\n建議將大型手冊分章節切成較小的 PDF 再匯入。")
            return
        }

        // 1. PDFKit 抽文字
        guard let pdf = PDFDocument(url: url) else {
            await showErr("無法讀取此 PDF。\n可能原因：加密保護、檔案損毀，或不是標準 PDF 格式。")
            return
        }

        // ── 加密 PDF 檢查 ────────────────────────────────────────
        if pdf.isEncrypted && !pdf.isLocked == false {
            await showErr("此 PDF 有加密保護，無法讀取內容。\n請使用未加密的版本。")
            return
        }

        // ── 頁數上限（200 頁）────────────────────────────────────
        let maxPages = 200
        if pdf.pageCount > maxPages {
            await showErr("PDF 共 \(pdf.pageCount) 頁，超過上限（\(maxPages) 頁）。\n建議分章節匯入，每次不超過 \(maxPages) 頁。")
            return
        }

        processingStatus = "抽取文字（\(pdf.pageCount) 頁）…"
        progress         = 0.15

        var fullText = ""
        for i in 0..<pdf.pageCount {
            if let page = pdf.page(at: i) {
                fullText += (page.string ?? "") + "\n"
            }
            progress = 0.15 + 0.25 * Double(i) / Double(max(pdf.pageCount, 1))
        }

        let cleanText = cleanPDFText(fullText)
        guard cleanText.count > 50 else {
            await showErr("PDF 文字內容過少（僅 \(cleanText.count) 字）。\n此 PDF 可能是掃描圖片版，目前不支援 OCR 辨識。\n請使用可選取文字的數位 PDF。")
            return
        }

        // 2. 切 chunk（參考 OnDevice-RAG-Android 的 overlap chunking）
        processingStatus = "切分知識段落…"
        progress         = 0.45

        let chunks = chunkText(
            text:     cleanText,
            fileName: url.deletingPathExtension().lastPathComponent,
            chunkSize: 300,
            overlap:   50
        )

        // 3. 向量化並存入 VectorStore
        let total = chunks.count
        processingStatus = "建立向量索引（0/\(total)）…"
        progress         = 0.50

        var vectorItems: [(chunkId: String, title: String, category: String, vector: [Float])] = []

        for (i, chunk) in chunks.enumerated() {
            // 用 HybridRAGEngine 的 encode 能力（透過 AppState）
            let vec = state.rag.encodeForImport(text: chunk.content)
            vectorItems.append((
                chunkId:  chunk.id,
                title:    chunk.title,
                category: "imported",
                vector:   vec
            ))
            processingStatus = "建立向量索引（\(i+1)/\(total)）…"
            progress = 0.50 + 0.40 * Double(i + 1) / Double(max(total, 1))
        }

        // 批次寫入 SQLite
        state.rag.importChunks(chunks, vectorItems: vectorItems)

        // 4. 記錄已匯入文件
        let doc = ImportedDocument(
            id:         UUID().uuidString,
            fileName:   url.deletingPathExtension().lastPathComponent,
            pageCount:  pdf.pageCount,
            chunkCount: chunks.count,
            importedAt: Date()
        )
        saveDocumentRecord(doc)

        await MainActor.run {
            processedDocs.append(doc)
            processingStatus = "完成！已建立 \(chunks.count) 個知識段落"
            progress         = 1.0
            isProcessing     = false
        }
    }

    // MARK: - 清理 PDF 文字
    private func cleanPDFText(_ text: String) -> String {
        var result = text
        // 移除多餘空白行
        result = result.components(separatedBy: "\n")
            .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
            .joined(separator: "\n")
        // 移除頁碼（孤立的數字行）
        result = result.components(separatedBy: "\n")
            .filter { line in
                let trimmed = line.trimmingCharacters(in: .whitespaces)
                return !(trimmed.count <= 4 && trimmed.allSatisfy { $0.isNumber })
            }
            .joined(separator: "\n")
        return result
    }

    // MARK: - Overlap Chunking（對應教授建議）
    /// chunkSize: 每段約 300 字、overlap: 50 字重疊
    /// 避免知識點剛好被切在兩個 chunk 中間
    private func chunkText(
        text:      String,
        fileName:  String,
        chunkSize: Int,
        overlap:   Int
    ) -> [DynamicChunk] {
        // 先按段落切
        let paragraphs = text.components(separatedBy: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { $0.count > 10 }

        var chunks:  [DynamicChunk] = []
        var buffer   = ""
        var chunkIdx = 0

        for para in paragraphs {
            buffer += (buffer.isEmpty ? "" : "\n") + para

            if buffer.count >= chunkSize {
                let id = "\(fileName)_\(chunkIdx)"
                chunks.append(DynamicChunk(
                    id:       id,
                    title:    "\(fileName) 第\(chunkIdx + 1)段",
                    content:  buffer,
                    source:   fileName
                ))
                chunkIdx += 1

                // Overlap：保留最後 overlap 個字符進入下一段
                let start = buffer.index(
                    buffer.endIndex,
                    offsetBy: -min(overlap, buffer.count)
                )
                buffer = String(buffer[start...])
            }
        }

        // 剩餘內容
        if buffer.count > 30 {
            chunks.append(DynamicChunk(
                id:      "\(fileName)_\(chunkIdx)",
                title:   "\(fileName) 第\(chunkIdx + 1)段",
                content: buffer,
                source:  fileName
            ))
        }
        return chunks
    }

    // MARK: - 刪除文件
    private func deleteDocument(_ doc: ImportedDocument) {
        state.rag.deleteImportedChunks(source: doc.fileName)
        processedDocs.removeAll { $0.id == doc.id }
        removeDocumentRecord(doc)
    }

    // MARK: - 持久化文件紀錄（UserDefaults）
    private let docsKey = "pocketkb_imported_docs"

    private func loadExistingDocs() {
        guard let data = UserDefaults.standard.data(forKey: docsKey),
              let docs = try? JSONDecoder().decode([ImportedDocument].self, from: data)
        else { return }
        processedDocs = docs
    }

    private func saveDocumentRecord(_ doc: ImportedDocument) {
        var docs = processedDocs
        docs.append(doc)
        if let data = try? JSONEncoder().encode(docs) {
            UserDefaults.standard.set(data, forKey: docsKey)
        }
    }

    private func removeDocumentRecord(_ doc: ImportedDocument) {
        let remaining = processedDocs.filter { $0.id != doc.id }
        if let data = try? JSONEncoder().encode(remaining) {
            UserDefaults.standard.set(data, forKey: docsKey)
        }
    }

    @MainActor
    private func showErr(_ msg: String) {
        errorMessage = msg
        showError    = true
        isProcessing = false
    }
}

// MARK: - Supporting Types

struct DynamicChunk: Identifiable {
    let id:      String
    let title:   String
    let content: String
    let source:  String
}

struct ImportedDocument: Identifiable, Codable {
    let id:         String
    let fileName:   String
    let pageCount:  Int
    let chunkCount: Int
    let importedAt: Date
}

// MARK: - Processing Card
struct ProcessingCard: View {
    let status:   String
    let progress: Double

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Space.m) {
            HStack(spacing: DS.Space.xs) {
                ProgressView()
                    .tint(DS.Color.safetyOrange)
                    .scaleEffect(0.8)
                Text(status)
                    .font(DS.Type.caption())
                    .foregroundStyle(.white)
            }
            ProgressView(value: progress)
                .progressViewStyle(.linear)
                .tint(DS.Color.safetyOrange)
                .background(DS.Color.surface)
                .clipShape(Capsule())
            Text("\(Int(progress * 100))%")
                .font(.system(size: 11, design: .monospaced))
                .foregroundStyle(DS.Color.midGray)
        }
        .padding(DS.Space.m)
        .background(DS.Color.surface, in: RoundedRectangle(cornerRadius: DS.Radius.l))
    }
}

// MARK: - Imported Document Row
struct ImportedDocumentRow: View {
    let doc:      ImportedDocument
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: DS.Space.m) {
            Image(systemName: "doc.text.fill")
                .font(.system(size: 20))
                .foregroundStyle(DS.Color.safetyOrange)
                .frame(width: 40, height: 40)
                .background(DS.Color.safetyOrange.opacity(0.1),
                            in: RoundedRectangle(cornerRadius: DS.Radius.sm))

            VStack(alignment: .leading, spacing: DS.Space.xxs) {
                Text(doc.fileName)
                    .font(DS.Type.body())
                    .foregroundStyle(.white)
                    .lineLimit(1)
                Text("\(doc.pageCount) 頁・\(doc.chunkCount) 個知識段落")
                    .font(DS.Type.caption())
                    .foregroundStyle(DS.Color.midGray)
            }

            Spacer()

            Button {
                onDelete()
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 14))
                    .foregroundStyle(DS.Color.emergencyRed)
                    .frame(width: 36, height: 36)
            }
        }
        .padding(DS.Space.m)
        .background(DS.Color.surface, in: RoundedRectangle(cornerRadius: DS.Radius.l))
    }
}

// MARK: - Usage Guide Card
struct UsageGuideCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DS.Space.xs) {
            HStack(spacing: DS.Space.xs) {
                Image(systemName: "lightbulb.fill")
                    .foregroundStyle(DS.Color.accentYellow)
                    .font(.system(size: 14))
                Text("建議匯入的文件")
                    .font(DS.Type.caption().bold())
                    .foregroundStyle(DS.Color.accentYellow)
            }

            ForEach([
                "消防署防災士訓練教材（官方 PDF）",
                "急救技術手冊",
                "各縣市災害防救計畫",
                "住宅防火逃生手冊"
            ], id: \.self) { item in
                HStack(spacing: DS.Space.xs) {
                    Circle()
                        .fill(DS.Color.midGray)
                        .frame(width: 4, height: 4)
                    Text(item)
                        .font(DS.Type.caption())
                        .foregroundStyle(DS.Color.midGray)
                }
            }

            Text("匯入後，AI 對話與災時引導會自動使用手冊內容回答問題")
                .font(.system(size: 11))
                .foregroundStyle(DS.Color.midGray.opacity(0.7))
                .padding(.top, DS.Space.xxs)
        }
        .padding(DS.Space.m)
        .background(DS.Color.accentYellow.opacity(0.05),
                    in: RoundedRectangle(cornerRadius: DS.Radius.l))
        .overlay(
            RoundedRectangle(cornerRadius: DS.Radius.l)
                .stroke(DS.Color.accentYellow.opacity(0.15), lineWidth: 1)
        )
    }
}
