import Foundation
import Network

// MARK: - Network Monitor
/// 即時監控網路狀態，自動通知 AppState 切換推論模式
final class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()

    private let monitor = NWPathMonitor()
    private let queue   = DispatchQueue(label: "NetworkMonitor")

    @Published private(set) var isConnected = false
    @Published private(set) var connectionType: ConnectionType = .none

    enum ConnectionType: String {
        case wifi     = "Wi-Fi"
        case cellular = "行動數據"
        case none     = "無網路"
    }

    private init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
                if path.usesInterfaceType(.wifi) {
                    self?.connectionType = .wifi
                } else if path.usesInterfaceType(.cellular) {
                    self?.connectionType = .cellular
                } else {
                    self?.connectionType = .none
                }
            }
        }
        monitor.start(queue: queue)
    }
}

// MARK: - Online API Client
/// 支援 OpenAI 相容 API（OpenAI、Groq、Together AI、自架 Ollama 等）
final class OnlineAPIClient {

    // MARK: - 支援的 API 供應商
    enum Provider: String, CaseIterable {
        case openai   = "OpenAI"
        case groq     = "Groq（免費，速度快）"
        case together = "Together AI"
        case ollama   = "Ollama（本機離線）"
        case custom   = "自訂 API"

        var baseURL: String {
            switch self {
            case .openai:   return "https://api.openai.com/v1/chat/completions"
            case .groq:     return "https://api.groq.com/openai/v1/chat/completions"
            case .together: return "https://api.together.xyz/v1/chat/completions"
            case .ollama:   return "http://localhost:11434/v1/chat/completions"
            case .custom:   return ""
            }
        }

        var defaultModel: String {
            switch self {
            case .openai:   return "gpt-4o-mini"
            case .groq:     return "llama-3.3-70b-versatile"
            case .together: return "meta-llama/Llama-3-8b-chat-hf"
            case .ollama:   return "qwen2.5:1.5b-instruct"
            case .custom:   return "gpt-3.5-turbo"
            }
        }

        var hint: String {
            switch self {
            case .openai:   return "sk-..."
            case .groq:     return "gsk_... （groq.com 免費申請）"
            case .together: return "together.ai API Key"
            case .ollama:   return "無須金鑰（本機執行）"
            case .custom:   return "你的 API Key"
            }
        }
    }

    // MARK: - 設定
    var provider:   Provider = .groq
    var apiKey:     String   = ""
    var customURL:  String   = ""
    var modelName:  String   = ""

    private var effectiveURL: String {
        provider == .custom ? customURL : provider.baseURL
    }

    private var effectiveModel: String {
        modelName.isEmpty ? provider.defaultModel : modelName
    }

    var isConfigured: Bool { 
        if provider == .ollama { return true }
        return !apiKey.trimmingCharacters(in: .whitespaces).isEmpty 
    }

    // MARK: - 串流對話
    func streamChat(
        messages:     [[String: String]],
        systemPrompt: String,
        onToken:      @escaping (String) -> Void,
        onDone:       @escaping () -> Void,
        onError:      @escaping (String) -> Void
    ) async {
        guard isConfigured else {
            onError("尚未設定 API Key")
            return
        }

        guard let url = URL(string: effectiveURL) else {
            onError("API URL 格式錯誤")
            return
        }

        // 組裝 messages 陣列（system + history）
        var msgs: [[String: String]] = [["role": "system", "content": systemPrompt]]
        msgs.append(contentsOf: messages)

        let body: [String: Any] = [
            "model":       effectiveModel,
            "messages":    msgs,
            "stream":      true,
            "max_tokens":  600,
            "temperature": 0.7
        ]

        var request        = URLRequest(url: url)
        request.httpMethod = "POST"
        if provider != .ollama {
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        }
        request.setValue("application/json",  forHTTPHeaderField: "Content-Type")
        request.httpBody   = try? JSONSerialization.data(withJSONObject: body)
        request.timeoutInterval = 30

        do {
            let (stream, response) = try await URLSession.shared.bytes(for: request)

            guard let httpResp = response as? HTTPURLResponse else {
                onError("無效的伺服器回應")
                return
            }
            guard httpResp.statusCode == 200 else {
                onError("API 錯誤（HTTP \(httpResp.statusCode)）\n請確認 API Key 是否正確")
                return
            }

            // 解析 SSE 串流
            for try await line in stream.lines {
                guard line.hasPrefix("data: ") else { continue }
                let data = line.dropFirst(6)
                guard data != "[DONE]" else { break }

                if let json = try? JSONSerialization.jsonObject(with: Data(data.utf8)) as? [String: Any],
                   let choices = json["choices"] as? [[String: Any]],
                   let delta   = choices.first?["delta"] as? [String: Any],
                   let content = delta["content"] as? String,
                   !content.isEmpty {
                    onToken(content)
                }
            }
            onDone()
        } catch {
            onError("網路錯誤：\(error.localizedDescription)")
        }
    }
}
