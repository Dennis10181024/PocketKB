import SwiftUI

// MARK: - Inference Mode Settings View
/// 推論模式設定：線上 API / 離線本地 LLM / 自動切換
struct InferenceModeSettingsView: View {
    @EnvironmentObject var state: AppState
    @Environment(\.dismiss) var dismiss

    @State private var apiKey     = ""
    @State private var customURL  = ""
    @State private var modelName  = ""
    @State private var showAPIKey = false
    @State private var testResult = ""
    @State private var isTesting  = false

    var body: some View {
        NavigationStack {
            ZStack {
                DS.Color.appBg.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: DS.Space.m) {

                        // ── 目前狀態 ──────────────────────────────────
                        StatusCard(state: state)
                            .padding(.horizontal, DS.Space.m)
                            .padding(.top, DS.Space.m)

                        // ── 模式選擇 ──────────────────────────────────
                        VStack(alignment: .leading, spacing: DS.Space.xs) {
                            sectionLabel("推論模式")
                            VStack(spacing: DS.Space.xs) {
                                ForEach(InferenceMode.allCases, id: \.self) { mode in
                                    ModeRow(
                                        mode:       mode,
                                        isSelected: state.inferenceMode == mode,
                                        network:    state.network
                                    ) {
                                        withAnimation { state.inferenceMode = mode }
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, DS.Space.m)

                        // ── API 供應商 ────────────────────────────────
                        VStack(alignment: .leading, spacing: DS.Space.xs) {
                            sectionLabel("API 供應商")
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: DS.Space.xs) {
                                    ForEach(OnlineAPIClient.Provider.allCases, id: \.self) { p in
                                        Button {
                                            state.apiClient.provider = p
                                            // 切換供應商時清空自訂設定
                                            if p != .custom { customURL = "" }
                                        } label: {
                                            Text(p.rawValue)
                                                .font(DS.Type.caption())
                                                .padding(.horizontal, DS.Space.m)
                                                .padding(.vertical, DS.Space.xs)
                                                .background(
                                                    state.apiClient.provider == p
                                                        ? DS.Color.safetyOrange
                                                        : DS.Color.surface,
                                                    in: Capsule())
                                                .foregroundStyle(
                                                    state.apiClient.provider == p
                                                        ? .black : .white)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                                .padding(.horizontal, DS.Space.m)
                            }
                            .padding(.horizontal, -DS.Space.m)
                        }
                        .padding(.horizontal, DS.Space.m)

                        // ── API Key 輸入 ──────────────────────────────
                        VStack(alignment: .leading, spacing: DS.Space.xs) {
                            sectionLabel("API Key")
                            HStack(spacing: DS.Space.xs) {
                                Group {
                                    if showAPIKey {
                                        TextField(
                                            state.apiClient.provider.hint,
                                            text: $apiKey)
                                    } else {
                                        SecureField(
                                            state.apiClient.provider.hint,
                                            text: $apiKey)
                                    }
                                }
                                .font(DS.Type.body())
                                .foregroundStyle(.white)
                                .tint(DS.Color.safetyOrange)
                                .padding(.horizontal, DS.Space.m)
                                .padding(.vertical, DS.Space.xs + 2)
                                .background(DS.Color.surface,
                                            in: RoundedRectangle(cornerRadius: DS.Radius.l))
                                .autocorrectionDisabled()
                                .textInputAutocapitalization(.never)

                                Button {
                                    showAPIKey.toggle()
                                } label: {
                                    Image(systemName: showAPIKey
                                          ? "eye.slash.fill" : "eye.fill")
                                        .foregroundStyle(DS.Color.midGray)
                                        .frame(width: 44, height: 44)
                                }
                            }

                            // 自訂 API URL
                            if state.apiClient.provider == .custom {
                                TextField("https://your-api.com/v1/chat/completions",
                                          text: $customURL)
                                    .font(DS.Type.caption())
                                    .foregroundStyle(.white)
                                    .tint(DS.Color.safetyOrange)
                                    .padding(.horizontal, DS.Space.m)
                                    .padding(.vertical, DS.Space.xs + 2)
                                    .background(DS.Color.surface,
                                                in: RoundedRectangle(cornerRadius: DS.Radius.l))
                                    .autocorrectionDisabled()
                                    .textInputAutocapitalization(.never)
                            }

                            // 自訂模型名稱
                            TextField("模型名稱（留空使用預設）",
                                      text: $modelName)
                                .font(DS.Type.caption())
                                .foregroundStyle(.white)
                                .tint(DS.Color.safetyOrange)
                                .padding(.horizontal, DS.Space.m)
                                .padding(.vertical, DS.Space.xs + 2)
                                .background(DS.Color.surface,
                                            in: RoundedRectangle(cornerRadius: DS.Radius.l))
                                .autocorrectionDisabled()
                                .textInputAutocapitalization(.never)
                        }
                        .padding(.horizontal, DS.Space.m)

                        // ── 測試連線 ──────────────────────────────────
                        VStack(spacing: DS.Space.xs) {
                            Button {
                                Task { await testConnection() }
                            } label: {
                                HStack(spacing: DS.Space.xs) {
                                    if isTesting {
                                        ProgressView()
                                            .tint(.black)
                                            .scaleEffect(0.8)
                                    }
                                    Text(isTesting ? "測試中…" : "測試連線")
                                        .fontWeight(.semibold)
                                }
                                .foregroundStyle(.black)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(apiKey.isEmpty
                                            ? DS.Color.midGray
                                            : DS.Color.safetyOrange,
                                            in: RoundedRectangle(cornerRadius: DS.Radius.l))
                            }
                            .buttonStyle(.plain)
                            .disabled(apiKey.isEmpty || isTesting)

                            if !testResult.isEmpty {
                                Text(testResult)
                                    .font(DS.Type.caption())
                                    .foregroundStyle(
                                        testResult.contains("✓")
                                            ? .green : DS.Color.emergencyRed)
                                    .multilineTextAlignment(.center)
                            }
                        }
                        .padding(.horizontal, DS.Space.m)

                        // ── 推薦說明 ──────────────────────────────────
                        RecommendationCard()
                            .padding(.horizontal, DS.Space.m)

                        Color.clear.frame(height: 40)
                    }
                }
            }
            .navigationTitle("推論模式設定")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("儲存") { saveAndDismiss() }
                        .foregroundStyle(DS.Color.safetyOrange)
                        .fontWeight(.semibold)
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") { dismiss() }
                        .foregroundStyle(DS.Color.midGray)
                }
            }
            .onAppear { loadSavedSettings() }
        }
    }

    // MARK: - 測試連線
    private func testConnection() async {
        isTesting  = true
        testResult = ""

        saveToClient()   // 先把輸入值存進 apiClient

        var result = ""
        await state.apiClient.streamChat(
            messages:     [["role": "user", "content": "請回答「連線成功」四個字"]],
            systemPrompt: "你是測試助理，只需回答「連線成功」四個字。",
            onToken: { piece in result += piece },
            onDone:  { },
            onError: { err in result = "✗ " + err }
        )

        await MainActor.run {
            testResult = result.contains("連線成功") || result.isEmpty == false && !result.contains("✗")
                ? "✓ 連線成功！回應：\(result.prefix(30))"
                : result
            isTesting = false
        }
    }

    // MARK: - 儲存
    private func saveToClient() {
        state.apiClient.apiKey    = apiKey
        state.apiClient.customURL = customURL
        state.apiClient.modelName = modelName
    }

    private func saveAndDismiss() {
        saveToClient()
        // UserDefaults 持久化
        UserDefaults.standard.set(apiKey,                    forKey: "pocketkb_api_key")
        UserDefaults.standard.set(state.apiClient.provider.rawValue, forKey: "pocketkb_provider")
        UserDefaults.standard.set(customURL,                 forKey: "pocketkb_custom_url")
        UserDefaults.standard.set(modelName,                 forKey: "pocketkb_model_name")
        UserDefaults.standard.set(state.inferenceMode.rawValue, forKey: "pocketkb_inference_mode")
        dismiss()
    }

    private func loadSavedSettings() {
        apiKey    = UserDefaults.standard.string(forKey: "pocketkb_api_key")    ?? ""
        customURL = UserDefaults.standard.string(forKey: "pocketkb_custom_url") ?? ""
        modelName = UserDefaults.standard.string(forKey: "pocketkb_model_name") ?? ""
        if let raw = UserDefaults.standard.string(forKey: "pocketkb_provider"),
           let p   = OnlineAPIClient.Provider(rawValue: raw) {
            state.apiClient.provider = p
        }
        if let raw = UserDefaults.standard.string(forKey: "pocketkb_inference_mode"),
           let m   = InferenceMode(rawValue: raw) {
            state.inferenceMode = m
        }
        saveToClient()
    }

    func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(DS.Type.caption())
            .foregroundStyle(DS.Color.midGray)
    }
}

// MARK: - Status Card
struct StatusCard: View {
    @ObservedObject var state: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Space.xs) {
            HStack(spacing: DS.Space.xs) {
                Circle()
                    .fill(state.effectivelyOnline ? Color.cyan : .green)
                    .frame(width: 10, height: 10)
                Text(state.effectivelyOnline ? "線上模式啟用" : "離線模式啟用")
                    .font(DS.Type.body().bold())
                    .foregroundStyle(.white)
                Spacer()
                Text(state.network.connectionType.rawValue)
                    .font(DS.Type.caption())
                    .foregroundStyle(DS.Color.midGray)
            }
            Text(state.effectivelyOnline
                 ? "使用 \(state.apiClient.provider.rawValue) API · RAG 仍在本地執行"
                 : "使用本地 Qwen2.5-1.5B · 完全離線")
                .font(DS.Type.caption())
                .foregroundStyle(DS.Color.midGray)
        }
        .padding(DS.Space.m)
        .background(DS.Color.surface, in: RoundedRectangle(cornerRadius: DS.Radius.l))
    }
}

// MARK: - Mode Row
struct ModeRow: View {
    let mode:       InferenceMode
    let isSelected: Bool
    let network:    NetworkMonitor
    let onTap:      () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: DS.Space.m) {
                Image(systemName: mode.icon)
                    .font(.system(size: 18))
                    .foregroundStyle(isSelected ? DS.Color.safetyOrange : DS.Color.midGray)
                    .frame(width: 28)

                VStack(alignment: .leading, spacing: 2) {
                    Text(modeName)
                        .font(DS.Type.body())
                        .foregroundStyle(.white)
                    Text(modeDesc)
                        .font(DS.Type.caption())
                        .foregroundStyle(DS.Color.midGray)
                }
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(DS.Color.safetyOrange)
                }
            }
            .padding(DS.Space.m)
            .background(
                isSelected
                    ? DS.Color.safetyOrange.opacity(0.08)
                    : DS.Color.surface,
                in: RoundedRectangle(cornerRadius: DS.Radius.l))
            .overlay(
                RoundedRectangle(cornerRadius: DS.Radius.l)
                    .stroke(isSelected
                            ? DS.Color.safetyOrange.opacity(0.3)
                            : Color.clear,
                            lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    var modeName: String {
        switch mode {
        case .auto:    return "自動切換"
        case .online:  return "強制線上"
        case .offline: return "強制離線"
        }
    }

    var modeDesc: String {
        switch mode {
        case .auto:
            return network.isConnected
                ? "目前有網路，將使用 API"
                : "目前無網路，將使用本地 LLM"
        case .online:  return "需要網路及 API Key，品質最佳"
        case .offline: return "完全離線，保障隱私"
        }
    }
}

// MARK: - Recommendation Card
struct RecommendationCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DS.Space.xs) {
            HStack(spacing: DS.Space.xs) {
                Image(systemName: "lightbulb.fill")
                    .foregroundStyle(DS.Color.accentYellow)
                    .font(.system(size: 14))
                Text("推薦設定")
                    .font(DS.Type.caption().bold())
                    .foregroundStyle(DS.Color.accentYellow)
            }
            Text("日常練習：使用「自動切換」，有網路時獲得更好的對話體驗")
                .font(DS.Type.caption())
                .foregroundStyle(DS.Color.midGray)
            Text("災難發生時：切換到「強制離線」，確保不依賴網路")
                .font(DS.Type.caption())
                .foregroundStyle(DS.Color.midGray)
            Text("免費 API 推薦：Groq（groq.com 申請），速度快、免費額度充足")
                .font(DS.Type.caption())
                .foregroundStyle(DS.Color.midGray)
        }
        .padding(DS.Space.m)
        .background(DS.Color.accentYellow.opacity(0.05),
                    in: RoundedRectangle(cornerRadius: DS.Radius.l))
        .overlay(
            RoundedRectangle(cornerRadius: DS.Radius.l)
                .stroke(DS.Color.accentYellow.opacity(0.15), lineWidth: 1))
    }
}
