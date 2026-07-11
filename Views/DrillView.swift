import SwiftUI

// MARK: - Scenario Picker
struct ScenarioPickerView: View {
    @EnvironmentObject var state: AppState
    @State private var selectedCat: DisasterCategory? = nil

    var filtered: [DrillScenario] {
        guard let cat = selectedCat else { return state.kb.scenarios }
        return state.kb.scenarios.filter { $0.category == cat }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                DS.Color.appBg.ignoresSafeArea()
                VStack(spacing: 0) {
                    // Category filter pills
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: DS.Space.xs) {
                            FilterPill(label: "全部",
                                       isSelected: selectedCat == nil) {
                                selectedCat = nil
                            }
                            ForEach(DisasterCategory.allCases, id: \.self) { cat in
                                FilterPill(
                                    label: "\(cat.icon) \(cat.rawValue)",
                                    isSelected: selectedCat == cat
                                ) { selectedCat = selectedCat == cat ? nil : cat }
                            }
                        }
                        .padding(.horizontal, DS.Space.m)
                    }
                    .padding(.vertical, DS.Space.xs)

                    ScrollView {
                        LazyVStack(spacing: DS.Space.xs) {
                            ForEach(filtered) { scenario in
                                NavigationLink {
                                    DrillChatView(scenario: scenario)
                                        .environmentObject(state)
                                } label: {
                                    ScenarioRow(scenario: scenario,
                                                largeBtnMode: state.largeBtnMode)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, DS.Space.m)
                        .padding(.bottom, 100)
                    }
                }
            }
            .navigationTitle("選擇演練情境")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }
}

struct FilterPill: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(label)
                .font(DS.Type.caption())
                .fontWeight(isSelected ? .semibold : .regular)
                .padding(.horizontal, DS.Space.m)
                .padding(.vertical, DS.Space.xs - 1)
                .background(isSelected ? DS.Color.safetyOrange : DS.Color.surface,
                            in: Capsule())
                .foregroundStyle(isSelected ? .black : .white)
        }
    }
}

struct ScenarioRow: View {
    let scenario:     DrillScenario
    let largeBtnMode: Bool
    var body: some View {
        HStack(spacing: DS.Space.m) {
            Text(scenario.category.icon)
                .font(.system(size: largeBtnMode ? 36 : 28))
                .frame(width: largeBtnMode ? 60 : 50,
                       height: largeBtnMode ? 60 : 50)
                .background(DS.Color.surface,
                            in: RoundedRectangle(cornerRadius: DS.Radius.m))
            VStack(alignment: .leading, spacing: DS.Space.xxs) {
                Text(scenario.title)
                    .font(DS.Type.body(large: largeBtnMode))
                    .foregroundStyle(.white)
                Text("📍 \(scenario.location)")
                    .font(DS.Type.caption(large: largeBtnMode))
                    .foregroundStyle(DS.Color.midGray)
            }
            Spacer()
            Image(systemName: "play.circle.fill")
                .font(.title2)
                .foregroundStyle(DS.Color.safetyOrange)
        }
        .padding(DS.Space.m)
        .background(DS.Color.surface,
                    in: RoundedRectangle(cornerRadius: DS.Radius.l))
        .frame(minHeight: DS.Space.touchMin + DS.Space.l)
    }
}

// MARK: - Drill Chat View
struct DrillChatView: View {
    @EnvironmentObject var state: AppState
    let scenario: DrillScenario

    @State private var inputText = ""
    @State private var showRAG   = false
    @FocusState private var inputFocused: Bool

    var body: some View {
        ZStack {
            DS.Color.appBg.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                DrillHeader(scenario: scenario, showRAG: $showRAG)

                // Status Box
                StatusBox(step: state.drillStep,
                          scenario: scenario,
                          largeBtnMode: state.largeBtnMode)

                // RAG Panel
                if showRAG {
                    RAGVisualizationPanel(ragState: state.ragState)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }

                // Chat Area — FIX #6: auto-scroll on new messages & streaming
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: DS.Space.xs) {
                            ForEach(state.messages) { msg in
                                DrillBubble(message: msg,
                                            largeBtnMode: state.largeBtnMode)
                            }
                            if state.isGenerating { TypingDots() }
                            Color.clear.frame(height: 1).id("scrollBottom")
                        }
                        .padding(DS.Space.m)
                    }
                    .onChange(of: state.messages.count) { _, _ in
                        withAnimation(.easeOut(duration: 0.2)) {
                            proxy.scrollTo("scrollBottom", anchor: .bottom)
                        }
                    }
                    .onChange(of: state.messages.last?.content) { _, _ in
                        proxy.scrollTo("scrollBottom", anchor: .bottom)
                    }
                }
                .background(DS.Color.appBg)

                // Input Bar
                DrillInputBar(
                    text: $inputText,
                    isFocused: $inputFocused,
                    isGenerating: state.isGenerating
                ) {
                    let t = inputText; inputText = ""
                    Task { await state.send(userText: t) }
                }
            }
        }
        .navigationBarHidden(true)
        .animation(.spring(response: 0.3), value: showRAG)
        // FIX #7: 鍵盤彈出時不遮擋輸入框
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .onAppear { state.startScenario(scenario) }
        .onDisappear { state.clearConversation() }
    }
}

// MARK: - Drill Header
struct DrillHeader: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var state: AppState
    let scenario: DrillScenario
    @Binding var showRAG: Bool

    private let voice = VoiceService.shared

    var body: some View {
        HStack(spacing: DS.Space.xs) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
            }
            Text(scenario.title)
                .font(DS.Type.body().bold())
                .foregroundStyle(.white)
            Spacer()

            // 語音朗讀 toggle
            if state.voiceNavEnabled {
                Button {
                    if let last = state.messages.last(where: { $0.role == .assistant }) {
                        voice.toggle(text: last.content)
                    }
                } label: {
                    Image(systemName: voice.isSpeaking
                          ? "speaker.wave.3.fill"
                          : "speaker.fill")
                        .font(.system(size: 16))
                        .padding(.horizontal, DS.Space.xs + 2)
                        .padding(.vertical, DS.Space.xxs + 2)
                        .background(voice.isSpeaking
                                    ? DS.Color.safetyOrange.opacity(0.2)
                                    : DS.Color.surface,
                                    in: Capsule())
                        .foregroundStyle(voice.isSpeaking
                                         ? DS.Color.safetyOrange
                                         : DS.Color.midGray)
                }
            }

            // RAG toggle
            Button { withAnimation { showRAG.toggle() } } label: {
                Label("RAG", systemImage: "brain")
                    .font(DS.Type.caption())
                    .padding(.horizontal, DS.Space.xs + 2)
                    .padding(.vertical, DS.Space.xxs + 2)
                    .background(showRAG ? Color.cyan.opacity(0.2) : DS.Color.surface,
                                in: Capsule())
                    .foregroundStyle(showRAG ? .cyan : DS.Color.midGray)
            }
        }
        .padding(.horizontal, DS.Space.m)
        .frame(height: 56)
        .background(DS.Color.appBg)
        .onDisappear { voice.stop() }  // 離開頁面停止朗讀
    }
}

// MARK: - Status Box
struct StatusBox: View {
    let step:         DrillStepState
    let scenario:     DrillScenario
    let largeBtnMode: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Space.xxs) {
            Text("演練主題")
                .font(DS.Type.caption(large: largeBtnMode))
                .foregroundStyle(DS.Color.safetyOrange)
                .fontWeight(.semibold)

            Text(scenario.openingLine.prefix(60) + "…")
                .font(DS.Type.caption(large: largeBtnMode))
                .foregroundStyle(DS.Color.charcoal)
                .lineLimit(1)

            HStack(spacing: DS.Space.xs) {
                Label("Step \(step.currentStep)/\(step.totalSteps)",
                      systemImage: "flag.fill")
                    .font(DS.Type.caption(large: false))
                    .foregroundStyle(DS.Color.charcoal.opacity(0.7))
                Text("•").foregroundStyle(DS.Color.midGray)
                Label("Time \(step.elapsedFormatted)", systemImage: "clock")
                    .font(DS.Type.caption(large: false))
                    .foregroundStyle(DS.Color.charcoal.opacity(0.7))
                Text("•").foregroundStyle(DS.Color.midGray)
                Label("Safety: \(step.safetyLevel.rawValue)",
                      systemImage: "shield.fill")
                    .font(DS.Type.caption(large: false))
                    .foregroundStyle(step.safetyLevel.color)
            }
        }
        .padding(.horizontal, DS.Space.m)
        .padding(.vertical, DS.Space.xs)
        .frame(minHeight: 72, maxWidth: .infinity, alignment: .leading)
        .background(DS.Color.statusOrangeBg)
    }
}

// MARK: - Chat Bubble
struct DrillBubble: View {
    let message:      ChatMessage
    let largeBtnMode: Bool

    var isUser: Bool { message.role == .user }

    var body: some View {
        HStack(alignment: .bottom, spacing: DS.Space.xs) {
            if isUser { Spacer(minLength: 60) }

            if !isUser {
                Image(systemName: "shield.fill")
                    .font(.caption)
                    .foregroundStyle(DS.Color.safetyOrange)
                    .frame(width: 28, height: 28)
                    .background(DS.Color.safetyOrange.opacity(0.15), in: Circle())
            }

            Text(message.content.isEmpty ? " " : message.content)
                .font(DS.Type.body(large: largeBtnMode))
                .foregroundStyle(.white)
                .padding(.horizontal, DS.Space.m)
                .padding(.vertical, DS.Space.xs + 2)
                .background(
                    isUser ? DS.Color.safetyOrange : DS.Color.surface,
                    in: RoundedRectangle(cornerRadius: DS.Radius.l,
                                         style: .continuous))
                .contextMenu {
                    Button("複製", systemImage: "doc.on.doc") {
                        UIPasteboard.general.string = message.content
                    }
                }

            if !isUser { Spacer(minLength: 60) }
        }
    }
}

// MARK: - RAG Visualization Panel
struct RAGVisualizationPanel: View {
    let ragState: RAGSearchState

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Space.xs) {
            HStack {
                Image(systemName: "brain").foregroundStyle(.cyan)
                Text("知識庫 BM25 檢索")
                    .font(DS.Type.caption().bold())
                    .foregroundStyle(.cyan)
                Spacer()
                if ragState.isSearching {
                    ProgressView().tint(.cyan).scaleEffect(0.7)
                } else if !ragState.results.isEmpty {
                    Text("找到 \(ragState.results.count) 筆")
                        .font(DS.Type.caption())
                        .foregroundStyle(DS.Color.midGray)
                }
            }

            ForEach(ragState.results) { result in
                HStack(alignment: .top, spacing: DS.Space.xs) {
                    Text(String(format: "%.1f", result.score))
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundStyle(result.score > 3 ? .green : DS.Color.accentYellow)
                        .frame(width: 32)

                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(result.chunk.category.icon)
                            Text(result.chunk.title)
                                .font(DS.Type.caption().bold())
                                .foregroundStyle(.white.opacity(0.9))
                        }
                        Text(result.chunk.content.prefix(70) + "…")
                            .font(.system(size: 11))
                            .foregroundStyle(DS.Color.midGray)
                            .lineLimit(2)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 4) {
                                ForEach(result.matchedTerms.prefix(5), id: \.self) { term in
                                    Text(term)
                                        .font(.system(size: 10))
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color.cyan.opacity(0.12), in: Capsule())
                                        .foregroundStyle(.cyan)
                                }
                            }
                        }
                    }
                }
                .padding(DS.Space.xs)
                .background(DS.Color.surface,
                            in: RoundedRectangle(cornerRadius: DS.Radius.sm))
            }
        }
        .padding(DS.Space.m)
        .background(Color(hex: "0A1F2A"))
        .overlay(Rectangle().fill(Color.cyan.opacity(0.2)).frame(height: 1),
                 alignment: .bottom)
    }
}

// MARK: - Typing Dots
struct TypingDots: View {
    @State private var animating = false
    var body: some View {
        HStack(alignment: .bottom, spacing: DS.Space.xs) {
            Image(systemName: "shield.fill")
                .font(.caption)
                .foregroundStyle(DS.Color.safetyOrange)
                .frame(width: 28, height: 28)
                .background(DS.Color.safetyOrange.opacity(0.15), in: Circle())

            HStack(spacing: 5) {
                ForEach(0..<3) { i in
                    Circle()
                        .fill(DS.Color.midGray)
                        .frame(width: 7, height: 7)
                        .scaleEffect(animating ? 1 : 0.5)
                        .animation(
                            .easeInOut(duration: 0.5)
                                .repeatForever()
                                .delay(Double(i) * 0.15),
                            value: animating)
                }
            }
            .padding(.horizontal, DS.Space.m)
            .padding(.vertical, DS.Space.xs + 2)
            .background(DS.Color.surface,
                        in: RoundedRectangle(cornerRadius: DS.Radius.l))

            Spacer()
        }
        .onAppear { animating = true }
    }
}

// MARK: - Input Bar
struct DrillInputBar: View {
    @Binding var text:        String
    var isFocused:            FocusState<Bool>.Binding
    let isGenerating:         Bool
    let onSend:               () -> Void

    var body: some View {
        HStack(spacing: DS.Space.xs) {
            TextField("我會…", text: $text, axis: .vertical)
                .font(DS.Type.body())
                .foregroundStyle(.black)
                .tint(DS.Color.safetyOrange)
                .lineLimit(1...3)
                .padding(.horizontal, DS.Space.m)
                .padding(.vertical, DS.Space.xs + 2)
                .background(.white,
                            in: RoundedRectangle(cornerRadius: DS.Radius.l))
                .focused(isFocused)

            Button(action: onSend) {
                Image(systemName: isGenerating ? "stop.circle.fill" : "arrow.up")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(text.isEmpty ? DS.Color.midGray : .white)
                    .frame(width: 64, height: 48)
                    .background(
                        text.isEmpty ? DS.Color.surface : DS.Color.safetyOrange,
                        in: RoundedRectangle(cornerRadius: DS.Radius.l))
            }
            // FIX #4: 防止重複觸發
            .disabled(text.isEmpty || isGenerating)
        }
        .padding(.horizontal, DS.Space.m)
        .padding(.vertical, DS.Space.xs)
        .frame(minHeight: 72)
        .background(DS.Color.appBg)
        .overlay(
            Rectangle()
                .fill(Color.white.opacity(0.06))
                .frame(height: 1),
            alignment: .top)
    }
}
