import SwiftUI

// MARK: - Emergency Guide View
/// 災時一鍵引導：完全不依賴 LLM，硬編碼步驟，零延遲顯示
/// 對應計畫書：「災時切換為離線知識查詢模式，以自然語言提供避難與急救指引」
struct EmergencyGuideView: View {
    @EnvironmentObject var state: AppState
    @State private var selected:  EmergencyGuide? = nil
    @State private var showAIChat = false
    @State private var chatInput  = ""
    @FocusState private var chatFocused: Bool

    var guides: [EmergencyGuide] { state.kb.emergencyGuides }

    var body: some View {
        NavigationStack {
            ZStack {
                DS.Color.appBg.ignoresSafeArea()

                VStack(spacing: 0) {
                    // ── 緊急警示橫幅 ────────────────────────────────
                    EmergencyBanner()

                    ScrollView(showsIndicators: false) {
                        VStack(spacing: DS.Space.m) {

                            // ── 選擇災種（大按鈕） ─────────────────────
                            VStack(alignment: .leading, spacing: DS.Space.xs) {
                                SectionLabel(text: "現在遇到什麼情況？")

                                LazyVGrid(
                                    columns: [GridItem(.flexible()), GridItem(.flexible())],
                                    spacing: DS.Space.xs
                                ) {
                                    ForEach(guides, id: \.category) { guide in
                                        DisasterButton(
                                            guide:      guide,
                                            isSelected: selected?.category == guide.category,
                                            largeBtnMode: state.largeBtnMode
                                        ) {
                                            withAnimation(.spring(response: 0.25)) {
                                                selected = selected?.category == guide.category
                                                    ? nil : guide
                                            }
                                        }
                                    }
                                }
                            }

                            // ── 步驟卡（選擇後展開） ───────────────────
                            if let guide = selected {
                                StepsCard(
                                    guide:        guide,
                                    largeBtnMode: state.largeBtnMode
                                )
                                .transition(.asymmetric(
                                    insertion: .move(edge: .top).combined(with: .opacity),
                                    removal:   .opacity
                                ))

                                // 詢問 AI 按鈕（模型已載入才顯示）
                                if state.modelStatus == .ready {
                                    AskAIButton(largeBtnMode: state.largeBtnMode) {
                                        withAnimation { showAIChat = true }
                                    }
                                    .transition(.opacity)
                                }
                            }

                            // ── 急救快查 ─────────────────────────────
                            VStack(alignment: .leading, spacing: DS.Space.xs) {
                                SectionLabel(text: "急救快查")
                                FirstAidQuickCards(largeBtnMode: state.largeBtnMode)
                            }

                            Color.clear.frame(height: 100)
                        }
                        .padding(DS.Space.m)
                    }
                }

                // ── AI 對話浮層 ────────────────────────────────────
                if showAIChat {
                    Color.black.opacity(0.4)
                        .ignoresSafeArea()
                        .onTapGesture {
                            withAnimation { showAIChat = false }
                        }

                    VStack {
                        Spacer()
                        EmergencyAIPanel(
                            isShowing:  $showAIChat,
                            inputText:  $chatInput,
                            isFocused:  $chatFocused,
                            guide:      selected,
                            state:      state
                        )
                    }
                    .transition(.move(edge: .bottom))
                    .zIndex(10)
                }
            }
            .navigationTitle("緊急引導")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            // FIX #12：進入緊急頁面時切換到 emergency session
            .onAppear { state.activateEmergencySession() }
            .animation(.spring(response: 0.3), value: selected?.category)
            .animation(.spring(response: 0.3), value: showAIChat)
        }
    }
}

// MARK: - Emergency Banner
struct EmergencyBanner: View {
    @State private var pulse = false
    var body: some View {
        HStack(spacing: DS.Space.xs) {
            Circle()
                .fill(DS.Color.emergencyRed)
                .frame(width: 10, height: 10)
                .scaleEffect(pulse ? 1.3 : 1.0)
                .animation(.easeInOut(duration: 0.8).repeatForever(), value: pulse)

            Text("選擇你遇到的災種，立即取得應對步驟")
                .font(DS.Type.caption())
                .foregroundStyle(.white.opacity(0.85))

            Spacer()
        }
        .padding(.horizontal, DS.Space.m)
        .padding(.vertical, DS.Space.xs + 2)
        .background(DS.Color.emergencyRed.opacity(0.18))
        .overlay(
            Rectangle()
                .fill(DS.Color.emergencyRed.opacity(0.4))
                .frame(height: 1),
            alignment: .bottom
        )
        .onAppear { pulse = true }
    }
}

// MARK: - Disaster Button（大按鈕，44pt 以上觸控面積）
struct DisasterButton: View {
    let guide:        EmergencyGuide
    let isSelected:   Bool
    let largeBtnMode: Bool
    let action:       () -> Void

    var bgColor: Color {
        switch guide.category {
        case .earthquake: return DS.Color.safetyOrange
        case .fire:       return DS.Color.emergencyRed
        case .typhoon:    return Color(hex: "1565C0")
        case .manmade:    return Color(hex: "4A148C")
        case .compound:   return Color(hex: "3E2723")
        }
    }

    var body: some View {
        Button(action: action) {
            VStack(spacing: DS.Space.xs) {
                Text(guide.category.icon)
                    .font(.system(size: largeBtnMode ? 40 : 32))

                Text(guide.category.rawValue)
                    .font(DS.Type.body(large: largeBtnMode))
                    .foregroundStyle(.white)
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
            .frame(height: largeBtnMode ? 110 : 90)
            .background(
                isSelected ? bgColor : bgColor.opacity(0.35),
                in: RoundedRectangle(cornerRadius: DS.Radius.l)
            )
            .overlay(
                RoundedRectangle(cornerRadius: DS.Radius.l)
                    .stroke(isSelected ? bgColor : Color.clear, lineWidth: 2)
            )
            .scaleEffect(isSelected ? 1.03 : 1.0)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Steps Card
struct StepsCard: View {
    let guide:        EmergencyGuide
    let largeBtnMode: Bool
    private let voice = VoiceService.shared

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Space.m) {

            // 標題列 + 語音按鈕
            HStack(spacing: DS.Space.xs) {
                Text(guide.category.icon).font(.title2)
                Text(guide.headline)
                    .font(DS.Type.heading(large: largeBtnMode))
                    .foregroundStyle(.white)
                Spacer()
                // 一鍵朗讀所有步驟
                Button {
                    voice.isSpeaking ? voice.stop() : voice.speakSteps(guide.steps)
                } label: {
                    Image(systemName: voice.isSpeaking
                          ? "speaker.slash.fill"
                          : "speaker.wave.2.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(voice.isSpeaking
                                         ? DS.Color.emergencyRed
                                         : DS.Color.safetyOrange)
                        .frame(width: 36, height: 36)
                        .background(DS.Color.safetyOrange.opacity(0.1),
                                    in: Circle())
                }
            }

            // 最重要一句話
            Text(guide.callout)
                .font(DS.Type.bodyLarge())
                .foregroundStyle(DS.Color.safetyOrange)
                .fontWeight(.semibold)
                .padding(DS.Space.xs + 2)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(DS.Color.safetyOrange.opacity(0.12),
                            in: RoundedRectangle(cornerRadius: DS.Radius.m))

            // 步驟列表
            VStack(spacing: DS.Space.xs) {
                ForEach(guide.steps) { step in
                    StepRow(step: step, largeBtnMode: largeBtnMode)
                }
            }
        }
        .padding(DS.Space.m)
        .background(DS.Color.surface, in: RoundedRectangle(cornerRadius: DS.Radius.l))
        .overlay(
            RoundedRectangle(cornerRadius: DS.Radius.l)
                .stroke(DS.Color.safetyOrange.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Step Row
struct StepRow: View {
    let step:         EmergencyStep
    let largeBtnMode: Bool

    var body: some View {
        HStack(alignment: .center, spacing: DS.Space.m) {
            // 步驟圓圈
            Text("\(step.order)")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.black)
                .frame(width: 28, height: 28)
                .background(DS.Color.safetyOrange, in: Circle())

            Text(step.text)
                .font(DS.Type.body(large: largeBtnMode))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()
        }
        .padding(.vertical, DS.Space.xxs)
        .frame(minHeight: DS.Space.touchMin)
    }
}

// MARK: - Ask AI Button
struct AskAIButton: View {
    let largeBtnMode: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: DS.Space.xs) {
                Image(systemName: "bubble.left.and.bubble.right.fill")
                Text("需要更多細節？詢問離線 AI")
                    .fontWeight(.medium)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
            }
            .font(DS.Type.body(large: largeBtnMode))
            .foregroundStyle(DS.Color.safetyOrange)
            .padding(DS.Space.m)
            .background(DS.Color.safetyOrange.opacity(0.1),
                        in: RoundedRectangle(cornerRadius: DS.Radius.l))
            .overlay(
                RoundedRectangle(cornerRadius: DS.Radius.l)
                    .stroke(DS.Color.safetyOrange.opacity(0.25), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - First Aid Quick Cards（急救快查，無需 LLM）
struct FirstAidQuickCards: View {
    let largeBtnMode: Bool

    private let items: [(icon: String, title: String, content: String)] = [
        ("❤️", "CPR 按壓頻率", "100–120次/分鐘\n深度至少5公分\n讓胸部完全回彈"),
        ("🩸", "止血", "直接加壓5–10分鐘\n抬高患肢\n大量出血用止血帶"),
        ("🔥", "燙傷", "流動冷水沖15–20分鐘\n勿用冰塊\n勿塗抹任何東西"),
        ("💊", "哽噎", "成人：5次背部拍擊\n+ 5次腹部推壓\n無效立即撥119"),
    ]

    var body: some View {
        LazyVGrid(
            columns: [GridItem(.flexible()), GridItem(.flexible())],
            spacing: DS.Space.xs
        ) {
            ForEach(items, id: \.title) { item in
                VStack(alignment: .leading, spacing: DS.Space.xs) {
                    HStack(spacing: DS.Space.xxs) {
                        Text(item.icon).font(.system(size: 16))
                        Text(item.title)
                            .font(DS.Type.caption(large: largeBtnMode).bold())
                            .foregroundStyle(.white)
                    }
                    Text(item.content)
                        .font(.system(size: largeBtnMode ? 14 : 12))
                        .foregroundStyle(DS.Color.midGray)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(DS.Space.xs + 2)
                .frame(maxWidth: .infinity, minHeight: DS.Space.touchMin + DS.Space.xl,
                       alignment: .topLeading)
                .background(DS.Color.surface,
                            in: RoundedRectangle(cornerRadius: DS.Radius.m))
            }
        }
    }
}

// MARK: - Section Label
struct SectionLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .font(DS.Type.caption())
            .foregroundStyle(DS.Color.midGray)
            .padding(.bottom, DS.Space.xxs)
    }
}

// MARK: - Emergency AI Panel
struct EmergencyAIPanel: View {
    @Binding var isShowing: Bool
    @Binding var inputText: String
    var isFocused: FocusState<Bool>.Binding
    let guide: EmergencyGuide?
    let state: AppState

    var body: some View {
        VStack(spacing: 0) {
            // Handle
            Capsule()
                .fill(Color.white.opacity(0.2))
                .frame(width: 36, height: 4)
                .padding(.top, DS.Space.xs)

            // Header
            HStack {
                Button { withAnimation { isShowing = false } } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(DS.Color.midGray)
                        .frame(width: 44, height: 44)
                }
                Spacer()
                VStack(spacing: 2) {
                    Text("詢問離線 AI")
                        .font(DS.Type.body().bold())
                        .foregroundStyle(.white)
                    if let guide = guide {
                        Text("關於：\(guide.category.rawValue)")
                            .font(DS.Type.caption())
                            .foregroundStyle(DS.Color.midGray)
                    }
                }
                Spacer()
                // RAG status
                HStack(spacing: 4) {
                    Circle()
                        .fill(state.ragState.isSearching
                              ? DS.Color.accentYellow : .green)
                        .frame(width: 8, height: 8)
                    Text("RAG")
                        .font(.system(size: 10))
                        .foregroundStyle(DS.Color.midGray)
                }
                .frame(width: 44)
            }
            .padding(.horizontal, DS.Space.m)

            // RAG results strip
            if !state.ragState.results.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: DS.Space.xs) {
                        ForEach(state.ragState.results) { r in
                            HStack(spacing: 4) {
                                Text(r.chunk.category.icon).font(.system(size: 12))
                                Text(r.chunk.title)
                                    .font(.system(size: 11))
                                    .foregroundStyle(.white.opacity(0.7))
                                Text(String(format: "%.1f", r.score))
                                    .font(.system(size: 10, design: .monospaced))
                                    .foregroundStyle(.green)
                            }
                            .padding(.horizontal, DS.Space.xs)
                            .padding(.vertical, 4)
                            .background(DS.Color.surface,
                                        in: Capsule())
                        }
                    }
                    .padding(.horizontal, DS.Space.m)
                }
                .padding(.vertical, DS.Space.xs)
                .background(Color(hex: "0A1F2A"))
            }

            // Messages
            ScrollView {
                LazyVStack(spacing: DS.Space.xs) {
                    if state.messages.isEmpty {
                        // 預設提示問題
                        if let guide = guide {
                            VStack(spacing: DS.Space.xs) {
                                Text("你可以問我：")
                                    .font(DS.Type.caption())
                                    .foregroundStyle(DS.Color.midGray)
                                ForEach(suggestedQuestions(for: guide.category), id: \.self) { q in
                                    Button {
                                        inputText = q
                                    } label: {
                                        Text(q)
                                            .font(DS.Type.caption())
                                            .foregroundStyle(DS.Color.safetyOrange)
                                            .padding(.horizontal, DS.Space.xs + 2)
                                            .padding(.vertical, DS.Space.xxs + 2)
                                            .background(DS.Color.safetyOrange.opacity(0.1),
                                                        in: RoundedRectangle(cornerRadius: DS.Radius.m))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(DS.Space.m)
                        }
                    } else {
                        ForEach(state.messages) { msg in
                            DrillBubble(message: msg, largeBtnMode: state.largeBtnMode)
                        }
                        if state.isGenerating { TypingDots() }
                    }
                }
                .padding(DS.Space.m)
            }
            .frame(maxHeight: 240)
            .background(DS.Color.appBg)

            // Input
            DrillInputBar(
                text:         $inputText,
                isFocused:    isFocused,
                isGenerating: state.isGenerating
            ) {
                let t = inputText; inputText = ""
                Task { await state.send(userText: t) }
            }
        }
        .background(DS.Color.surface)
        .clipShape(RoundedRectangle(cornerRadius: DS.Radius.xl, style: .continuous))
        .padding(.bottom, 84)
        // FIX #10：ZStack 浮層鍵盤迴避
        .ignoresSafeArea(.keyboard, edges: .bottom)
    }

    // 每個災種的建議問題
    func suggestedQuestions(for cat: DisasterCategory) -> [String] {
        switch cat {
        case .earthquake:
            return ["地震時我在車上怎麼辦？", "地震後瓦斯怎麼處理？", "被困廢墟如何求救？"]
        case .fire:
            return ["火災時電梯為什麼不能用？", "被困高樓該怎麼辦？", "如何正確使用滅火器？"]
        case .typhoon:
            return ["洪水來了多快需要疏散？", "被困地下室積水怎麼辦？", "土石流來了往哪個方向跑？"]
        case .manmade:
            return ["遇到暴徒第一步做什麼？", "躲藏時如何通報110？", "什麼情況才考慮反擊？"]
        case .compound:
            return ["地震後聞到瓦斯味怎麼辦？", "停電超過24小時怎麼應對？", "怎麼在斷網情況下獲取資訊？"]
        }
    }
}
