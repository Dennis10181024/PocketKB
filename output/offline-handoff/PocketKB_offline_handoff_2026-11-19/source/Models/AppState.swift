import Foundation
import SwiftUI

// MARK: - Message
struct ChatMessage: Identifiable {
    let id: UUID  = UUID()
    let role:     Role
    var content:  String
    let timestamp = Date()

    enum Role { case user, assistant }
}

// MARK: - Drill Step State
struct DrillStepState {
    var currentStep: Int    = 1
    var totalSteps:  Int    = 6
    var elapsedSec:  Int    = 0
    var safetyLevel: Safety = .medium

    enum Safety: String {
        case high = "High"; case medium = "Medium"; case low = "Low"
        var color: Color {
            switch self {
            case .high:   return .green
            case .medium: return Color(hex: "FFD54F")
            case .low:    return Color(hex: "C62828")
            }
        }
    }

    var elapsedFormatted: String {
        String(format: "%02d:%02d", elapsedSec / 60, elapsedSec % 60)
    }
}

// MARK: - RAG Search State
struct RAGSearchState {
    var isSearching = false
    var results:     [RetrievalResult] = []
    var query:       String = ""
}

// MARK: - Tab
enum AppTab: String, CaseIterable {
    case home      = "Home"
    case incident  = "Incident"
    case emergency = "緊急"
    case resources = "Resources"
    case quick     = "Quick"

    var icon: String {
        switch self {
        case .home:      return "house.fill"
        case .incident:  return "brain.head.profile"
        case .emergency: return "sos.circle.fill"
        case .resources: return "books.vertical.fill"
        case .quick:     return "magnifyingglass"
        }
    }
    var isEmergency: Bool { self == .emergency }
}

// MARK: - Model Status
enum ModelStatus {
    case notLoaded
    case loading(progress: Double)
    case ready
    case error(String)

    var description: String {
        switch self {
        case .notLoaded:       return "未載入模型"
        case .loading(let p): return "載入中 \(Int(p * 100))%"
        case .ready:          return "離線模型就緒"
        case .error(let m):   return "錯誤：\(m)"
        }
    }
    var color: Color {
        switch self {
        case .notLoaded:  return .gray
        case .loading:    return Color(hex: "FFD54F")
        case .ready:      return .green
        case .error:      return Color(hex: "C62828")
        }
    }
}
extension ModelStatus: Equatable {
    static func == (lhs: ModelStatus, rhs: ModelStatus) -> Bool {
        switch (lhs, rhs) {
        case (.notLoaded, .notLoaded), (.ready, .ready): return true
        case (.loading(let a), .loading(let b)):         return a == b
        case (.error(let a),   .error(let b)):           return a == b
        default: return false
        }
    }
}

// MARK: - Inference Mode
enum InferenceMode: String, CaseIterable {
    case auto    = "自動（有網路用線上，無網路用離線）"
    case online  = "線上模式（API）"
    case offline = "離線模式（本地 LLM）"

    var icon: String {
        switch self {
        case .auto:    return "wand.and.stars"
        case .online:  return "cloud.fill"
        case .offline: return "iphone.and.arrow.forward"
        }
    }
}

// MARK: - Session Type
/// 分離不同模式的對話上下文，防止情境污染（FIX #12）
enum ChatSession { case drill, emergency, guide }

// MARK: - AppState
@MainActor
final class AppState: ObservableObject {

    @Published var selectedTab:     AppTab      = .home
    @Published var modelStatus:     ModelStatus = .notLoaded
    @Published var isGenerating                 = false

    // FIX #12：三個獨立的 messages，互不干擾
    @Published var drillMessages:     [ChatMessage] = []
    @Published var emergencyMessages: [ChatMessage] = []
    @Published var guideMessages:     [ChatMessage] = []
    @Published var activeSession:     ChatSession   = .drill

    // 向後相容：現有 View 仍可用 state.messages 存取當前 session
    var messages: [ChatMessage] {
        get {
            switch activeSession {
            case .drill:     return drillMessages
            case .emergency: return emergencyMessages
            case .guide:     return guideMessages
            }
        }
        set {
            switch activeSession {
            case .drill:     drillMessages     = newValue
            case .emergency: emergencyMessages = newValue
            case .guide:     guideMessages     = newValue
            }
        }
    }

    @Published var currentScenario: DrillScenario? = nil
    @Published var drillStep        = DrillStepState()
    @Published var ragState         = RAGSearchState()
    @Published var showRAGPanel     = false
    @Published var ragReady         = false
    @Published var largeBtnMode     = false
    @Published var modelFilesHint   = ""

    // FIX #13 已修正：語音功能現在真正可用（AVSpeechSynthesizer）
    @Published var voiceNavEnabled  = false

    // MARK: - 推論模式
    @Published var inferenceMode: InferenceMode = .auto
    @Published var currentlyUsingOnline = false   // 實際使用中的模式

    // 線上 API 設定
    let apiClient = OnlineAPIClient()
    let network   = NetworkMonitor.shared

    var effectivelyOnline: Bool {
        switch inferenceMode {
        case .auto:    return network.isConnected && apiClient.isConfigured
        case .online:  return apiClient.isConfigured
        case .offline: return false
        }
    }

    // Services
    let rag   = HybridRAGEngine()   // 混合檢索：BM25 + BGE-small-zh 語意向量
    let llama = LlamaInference()
    let kb    = KnowledgeBase.shared

    private var timer: Timer?

    // FIX #2：buildIndex 移到背景執行緒，不再阻塞主執行緒
    init() {
        Task.detached(priority: .userInitiated) { [weak self] in
            guard let self else { return }
            let chunks = KnowledgeBase.shared.chunks

            // 支援從 Documents 傳入或是打包進 App Bundle
            let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let docOnnx  = docs.appendingPathComponent("bge-small-zh.onnx").path
            let docVocab = docs.appendingPathComponent("vocab.txt").path
            
            let onnxPath  = FileManager.default.fileExists(atPath: docOnnx) ? docOnnx : Bundle.main.path(forResource: "bge-small-zh", ofType: "onnx")
            let vocabPath = FileManager.default.fileExists(atPath: docVocab) ? docVocab : Bundle.main.path(forResource: "vocab", ofType: "txt")

            // 有 ONNX + vocab → 真正的語意混合檢索
            // 只有 ONNX 沒有 vocab → 退回 BM25（避免假向量污染結果）
            // 兩者都沒有 → 純 BM25
            self.rag.buildIndex(from: chunks, modelPath: onnxPath, vocabPath: vocabPath)

            await MainActor.run {
                self.ragReady = true
                self.refreshModelFilesHint()
            }
        }
    }

    // MARK: - Model Loading
    // ─────────────────────────────────────────────────────────────
    // FIX #3：動態掃描 Documents 內第一個 .gguf，不再硬編碼檔名
    // ─────────────────────────────────────────────────────────────
    func loadModel() async {
        modelStatus = .loading(progress: 0)

        let docs = FileManager.default.urls(
            for: .documentDirectory, in: .userDomainMask)[0]

        let ggufURL = (try? FileManager.default.contentsOfDirectory(
            at: docs, includingPropertiesForKeys: nil
        ))?.first(where: { $0.pathExtension.lowercased() == "gguf" })

        guard let modelURL = ggufURL else {
            modelStatus = .error("Documents 資料夾內找不到 .gguf 模型檔\n請用 Xcode 的裝置管理傳入")
            refreshModelFilesHint()
            return
        }

        do {
            modelStatus = .loading(progress: 0.3)
            try await llama.load(modelPath: modelURL.path)
            modelStatus = .loading(progress: 1.0)
            try? await Task.sleep(for: .milliseconds(200))
            modelStatus = .ready
        } catch {
            modelStatus = .error(error.localizedDescription)
        }
        refreshModelFilesHint()
    }

    // MARK: - Send Message
    func send(userText: String) async {
        let trimmed = userText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        guard await llama.isLoaded else { return }

        // ─────────────────────────────────────────────────────────
        // FIX #4：Race condition 防護，isGenerating 時不允許重複觸發
        // ─────────────────────────────────────────────────────────
        guard !isGenerating else { return }

        messages.append(ChatMessage(role: .user, content: trimmed))

        // RAG retrieval
        ragState = RAGSearchState(isSearching: true, results: [], query: trimmed)
        let results = rag.retrieve(query: trimmed, topK: 3)
        ragState = RAGSearchState(isSearching: false, results: results, query: trimmed)

        // ─────────────────────────────────────────────────────────
        // FIX #5 加強版：動態計算可用 history 長度
        // 避免 RAG context + system prompt + history 超過 nCtx=2048
        // 估算：1 個中文字 ≈ 1.5 tokens
        // ─────────────────────────────────────────────────────────
        let sys = currentScenario?.systemPrompt ?? defaultSystemPrompt
        let ctxLimit    = 2048
        let ragTokens   = results.reduce(0) { $0 + Int(Double($1.chunk.content.count) * 1.5) }
        let sysTokens   = Int(Double(sys.count) * 1.5)
        let maxTokens   = 400
        let budgetLeft  = ctxLimit - ragTokens - sysTokens - maxTokens - 50  // 50 保留緩衝

        // 從最近的訊息往前選，直到超過 budget
        var selectedHistory: [ChatMessage] = []
        var usedTokens = 0
        for msg in messages.dropLast().reversed() {
            let t = Int(Double(msg.content.count) * 1.5)
            if usedTokens + t > max(budgetLeft, 200) { break }  // 至少保留 200 tokens 給 history
            selectedHistory.insert(msg, at: 0)
            usedTokens += t
        }
        let history = selectedHistory
        let prompt = rag.buildPrompt(
            query:        trimmed,
            results:      results,
            systemPrompt: sys,
            history:      history
        )

        // ─────────────────────────────────────────────────────────
        // FIX #1：用 UUID 追蹤訊息位置，非陣列 index
        // clearConversation() 在 generate 進行中被呼叫也不會 crash
        // ─────────────────────────────────────────────────────────
        let assistantId = UUID()
        messages.append(ChatMessage(id: assistantId, role: .assistant, content: ""))

        isGenerating = true

        if currentScenario != nil {
            drillStep.currentStep = min(drillStep.currentStep + 1, drillStep.totalSteps)
            drillStep.safetyLevel = drillStep.currentStep < 3 ? .low :
                                    drillStep.currentStep < 5 ? .medium : .high
        }

        #if targetEnvironment(simulator)
        let isSimulator = true
        #else
        let isSimulator = false
        #endif

        // ── 路由：根據模式選擇線上 API 或本地 LLM ──────────────────
        if effectivelyOnline {
            // 線上模式：呼叫外部 API，RAG context 注入 systemPrompt
            currentlyUsingOnline = true
            let historyMessages = history.map { msg -> [String: String] in
                ["role":    msg.role == .user ? "user" : "assistant",
                 "content": msg.content]
            }

            let contextContext = results.enumerated().map { i, r in
                "【參考資料\\(i+1)：\\(r.chunk.title)】\n\\(r.chunk.content)"
            }.joined(separator: "\n\n")

            await apiClient.streamChat(
                messages:     historyMessages,
                systemPrompt: sys + "\n\n以下是從本地知識庫檢索到的參考資料：\n\n" + contextContext,
                onToken: { [weak self] piece in
                    Task { @MainActor [weak self] in
                        guard let self else { return }
                        if let idx = self.messages.firstIndex(where: { $0.id == assistantId }) {
                            self.messages[idx].content += piece
                        }
                    }
                },
                onDone: { [weak self] in
                    Task { @MainActor [weak self] in
                        self?.isGenerating = false
                    }
                },
                onError: { [weak self] errMsg in
                    Task { @MainActor [weak self] in
                        guard let self else { return }
                        // API 失敗：在訊息中顯示錯誤，並標記切換回離線
                        if let idx = self.messages.firstIndex(where: { $0.id == assistantId }) {
                            self.messages[idx].content = "⚠️ 線上 API 發生錯誤：\\(errMsg)\n\n正在切換至離線模式重新回答…"
                        }
                        self.currentlyUsingOnline = false
                        // 自動 fallback 到本地 LLM
                        await self.fallbackToLocal(
                            prompt: prompt, assistantId: assistantId)
                    }
                }
            )
        } else if isSimulator || !(await llama.isLoaded) {
            // Simulator or No Model Fallback to Ollama
            currentlyUsingOnline = true
            apiClient.provider = .ollama
            var apiMessages: [[String: String]] = []
            for msg in history {
                apiMessages.append(["role": msg.role == .user ? "user" : "assistant",
                                    "content": msg.content])
            }
            apiMessages.append(["role": "user", "content": trimmed])
            
            let contextContext = results.enumerated().map { i, r in
                "【參考資料\\(i+1)：\\(r.chunk.title)】\n\\(r.chunk.content)"
            }.joined(separator: "\n\n")
            
            let finalSystemPrompt = sys + "\n\n以下是從本地知識庫檢索到的參考資料：\n" + contextContext

            await apiClient.streamChat(
                messages: apiMessages,
                systemPrompt: finalSystemPrompt,
                onToken: { [weak self] piece in
                    Task { @MainActor [weak self] in
                        guard let self else { return }
                        if let idx = self.messages.firstIndex(where: { $0.id == assistantId }) {
                            self.messages[idx].content += piece
                        }
                    }
                },
                onDone: { [weak self] in
                    Task { @MainActor [weak self] in
                        self?.isGenerating = false
                    }
                },
                onError: { [weak self] err in
                    Task { @MainActor [weak self] in
                        guard let self else { return }
                        if let idx = self.messages.firstIndex(where: { $0.id == assistantId }) {
                            self.messages[idx].content = "[Ollama 錯誤] " + err
                        }
                        self.isGenerating = false
                    }
                }
            )
        } else {
            // 完全斷網、100% 離線模式：本地 llama.cpp 推論
            currentlyUsingOnline = false
            guard await llama.isLoaded else {
                if let idx = messages.firstIndex(where: { $0.id == assistantId }) {
                    messages[idx].content = "⚠️ 本地模型尚未載入，請確認已傳入 .gguf 模型檔。"
                }
                isGenerating = false
                return
            }
            await llama.generate(prompt: prompt, maxTokens: 400) { [weak self] piece in
                Task { @MainActor [weak self] in
                    guard let self else { return }
                    // UUID lookup：安全，不依賴 index
                    if let idx = self.messages.firstIndex(where: { $0.id == assistantId }) {
                        self.messages[idx].content += piece
                    }
                    // index 找不到代表對話已被清除，靜默忽略，不 crash
                }
            }
            isGenerating = false
        }
    }

    /// API 失敗時 fallback 到本地 LLM
    private func fallbackToLocal(prompt: String, assistantId: UUID) async {
        guard await llama.isLoaded else {
            isGenerating = false
            return
        }
        // 清除錯誤訊息，重新開始
        if let idx = messages.firstIndex(where: { $0.id == assistantId }) {
            messages[idx].content = ""
        }
        await llama.generate(prompt: prompt, maxTokens: 400) { [weak self] piece in
            Task { @MainActor [weak self] in
                guard let self else { return }
                if let idx = self.messages.firstIndex(where: { $0.id == assistantId }) {
                    self.messages[idx].content += piece
                }
            }
        }
        isGenerating = false
    }

    // MARK: - Drill Control
    func startScenario(_ scenario: DrillScenario) {
        // FIX #12：切換到 drill session，不污染其他 session
        activeSession   = .drill
        currentScenario = scenario
        drillMessages   = []
        ragState        = RAGSearchState()
        drillStep       = DrillStepState()
        drillMessages.append(ChatMessage(role: .assistant, content: scenario.openingLine))
        startTimer()
    }

    /// 切換到緊急 session（EmergencyGuideView 使用）
    func activateEmergencySession() {
        activeSession = .emergency
    }

    /// 切換到快查 session（QuickGuideView 使用）
    func activateGuideSession() {
        activeSession = .guide
    }

    func clearConversation() {
        // FIX #8：先取消底層推論，釋放 GPU 資源，防止發燙
        Task { await llama.cancel() }
        isGenerating    = false
        // FIX #12：只清除當前 session，不動其他 session
        switch activeSession {
        case .drill:
            drillMessages   = []
            currentScenario = nil
            drillStep       = DrillStepState()
            stopTimer()
        case .emergency:
            emergencyMessages = []
        case .guide:
            guideMessages = []
        }
        ragState = RAGSearchState()
    }

    /// 完全重置所有 session（例如登出或重置 App）
    func clearAllSessions() {
        Task { await llama.cancel() }
        isGenerating      = false
        drillMessages     = []
        emergencyMessages = []
        guideMessages     = []
        currentScenario   = nil
        ragState          = RAGSearchState()
        drillStep         = DrillStepState()
        stopTimer()
    }

    // MARK: - Timer
    private func startTimer() {
        stopTimer()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.drillStep.elapsedSec += 1
            }
        }
    }

    func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    // MARK: - Helpers
    private let defaultSystemPrompt = """
    你是「口袋知識庫」防災助理，完全離線運行於手機端。
    根據知識庫資料，以繁體中文提供簡潔、可操作的防災指引。
    優先列出具體行動步驟，回答控制在200字以內。
    """

    // MARK: - Runtime readiness hints
    var ragModeDescription: String {
        rag.isSemanticReady
            ? "混合檢索就緒（BM25 + 語意向量）"
            : "BM25 檢索就緒（缺少 onnx 或 vocab）"
    }

    func refreshModelFilesHint() {
        let docs = FileManager.default.urls(
            for: .documentDirectory, in: .userDomainMask)[0]
        let files = (try? FileManager.default.contentsOfDirectory(
            at: docs, includingPropertiesForKeys: nil
        )) ?? []

        let hasGGUF = files.contains { $0.pathExtension.lowercased() == "gguf" }
        let hasONNX = FileManager.default.fileExists(
            atPath: docs.appendingPathComponent("bge-small-zh.onnx").path)
        let hasVocab = FileManager.default.fileExists(
            atPath: docs.appendingPathComponent("vocab.txt").path)

        var missing: [String] = []
        if !hasGGUF { missing.append(".gguf") }
        if !hasONNX { missing.append("bge-small-zh.onnx") }
        if !hasVocab { missing.append("vocab.txt") }
        modelFilesHint = missing.isEmpty ? "模型檔案完整" : "缺少：\(missing.joined(separator: "、"))"
    }
}
