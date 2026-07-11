import SwiftUI

// MARK: - Quick Guide View (底部導覽 "Quick" tab)
/// 災時引導：快速查詢急救 + 避難步驟
struct QuickGuideView: View {
    @EnvironmentObject var state: AppState
    @State private var selectedCat: DisasterCategory = .earthquake
    @State private var searchText  = ""
    @State private var showChat    = false
    @State private var chatInput   = ""
    @FocusState private var chatFocused: Bool

    var filteredChunks: [KnowledgeChunk] {
        let base = state.kb.chunks.filter { $0.category == selectedCat }
        guard !searchText.isEmpty else { return base }
        return base.filter {
            $0.title.localizedCaseInsensitiveContains(searchText) ||
            $0.content.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                DS.Color.appBg.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Category tabs
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: DS.Space.xs) {
                            ForEach(DisasterCategory.allCases, id: \.self) { cat in
                                Button {
                                    withAnimation(.spring(response: 0.25)) {
                                        selectedCat = cat
                                    }
                                } label: {
                                    VStack(spacing: 2) {
                                        Text(cat.icon).font(.title3)
                                        Text(cat.rawValue)
                                            .font(DS.Type.caption(large: state.largeBtnMode))
                                            .foregroundStyle(selectedCat == cat
                                                             ? DS.Color.safetyOrange
                                                             : DS.Color.midGray)
                                    }
                                    .padding(.horizontal, DS.Space.m)
                                    .padding(.vertical, DS.Space.xs)
                                    .background(
                                        selectedCat == cat
                                            ? DS.Color.safetyOrange.opacity(0.15)
                                            : Color.clear,
                                        in: RoundedRectangle(cornerRadius: DS.Radius.m))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, DS.Space.m)
                    }
                    .padding(.vertical, DS.Space.xs)
                    .background(DS.Color.appBg)

                    // Search bar
                    HStack(spacing: DS.Space.xs) {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(DS.Color.midGray)
                        TextField("搜尋防災知識…", text: $searchText)
                            .font(DS.Type.body(large: state.largeBtnMode))
                            .foregroundStyle(.white)
                            .tint(DS.Color.safetyOrange)
                    }
                    .padding(.horizontal, DS.Space.m)
                    .padding(.vertical, DS.Space.xs + 2)
                    .background(DS.Color.surface, in: RoundedRectangle(cornerRadius: DS.Radius.l))
                    .padding(.horizontal, DS.Space.m)
                    .padding(.bottom, DS.Space.xs)

                    // Knowledge cards
                    ScrollView {
                        LazyVStack(spacing: DS.Space.xs) {
                            ForEach(filteredChunks) { chunk in
                                ExpandableKnowledgeCard(chunk: chunk,
                                                        largeBtnMode: state.largeBtnMode)
                            }
                        }
                        .padding(.horizontal, DS.Space.m)
                        .padding(.bottom, 140) // clear bottom nav + FAB
                    }
                }

                // FAB: Ask AI
                if state.modelStatus == .ready && !showChat {
                    Button {
                        withAnimation(.spring(response: 0.35)) { showChat = true }
                    } label: {
                        HStack(spacing: DS.Space.xs) {
                            Image(systemName: "bubble.left.and.bubble.right.fill")
                            Text("問 AI")
                                .fontWeight(.semibold)
                        }
                        .font(DS.Type.bodyLarge())
                        .foregroundStyle(.black)
                        .padding(.horizontal, DS.Space.l)
                        .padding(.vertical, DS.Space.m)
                        .background(DS.Color.safetyOrange, in: Capsule())
                        .shadow(color: DS.Color.safetyOrange.opacity(0.35), radius: 12, y: 4)
                    }
                    .padding(.bottom, 90) // above bottom nav
                }

                // Chat panel
                if showChat {
                    VStack(spacing: 0) {
                        Spacer()
                        QuickChatPanel(
                            isShowing:  $showChat,
                            inputText:  $chatInput,
                            isFocused:  $chatFocused,
                            state:      state
                        )
                    }
                    .transition(.move(edge: .bottom))
                    .zIndex(10)
                }
            }
            .navigationTitle("災時引導")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            // FIX #12：進入快查頁面時切換到 guide session
            .onAppear { state.activateGuideSession() }
        }
    }
}

// MARK: - Expandable Knowledge Card
struct ExpandableKnowledgeCard: View {
    let chunk:        KnowledgeChunk
    let largeBtnMode: Bool
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Space.xs) {
            HStack {
                Text(chunk.category.icon)
                Text(chunk.title)
                    .font(DS.Type.body(large: largeBtnMode).bold())
                    .foregroundStyle(.white)
                Spacer()
                Image(systemName: expanded ? "chevron.up" : "chevron.down")
                    .font(.caption)
                    .foregroundStyle(DS.Color.midGray)
            }

            if expanded {
                Text(chunk.content)
                    .font(DS.Type.body(large: largeBtnMode))
                    .foregroundStyle(.white.opacity(0.85))
                    .lineSpacing(DS.Space.xxs)
                    .transition(.opacity.combined(with: .move(edge: .top)))

                // Tags
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: DS.Space.xxs) {
                        ForEach(chunk.tags, id: \.self) { tag in
                            Text(tag)
                                .font(DS.Type.caption(large: false))
                                .padding(.horizontal, DS.Space.xs)
                                .padding(.vertical, DS.Space.xxs)
                                .background(DS.Color.safetyOrange.opacity(0.12), in: Capsule())
                                .foregroundStyle(DS.Color.safetyOrange)
                        }
                    }
                }
            } else {
                Text(chunk.content.prefix(65) + "…")
                    .font(DS.Type.caption(large: largeBtnMode))
                    .foregroundStyle(DS.Color.midGray)
                    .lineLimit(2)
            }
        }
        .padding(DS.Space.m)
        .background(DS.Color.surface, in: RoundedRectangle(cornerRadius: DS.Radius.l))
        .overlay(RoundedRectangle(cornerRadius: DS.Radius.l)
            .stroke(Color.white.opacity(0.05), lineWidth: 1))
        .onTapGesture {
            withAnimation(.spring(response: 0.3)) { expanded.toggle() }
        }
        .frame(minHeight: DS.Space.touchMin)
    }
}

// MARK: - Quick Chat Panel
struct QuickChatPanel: View {
    @Binding var isShowing:  Bool
    @Binding var inputText:  String
    var isFocused:           FocusState<Bool>.Binding
    let state:               AppState

    var body: some View {
        VStack(spacing: 0) {
            // Drag handle
            Capsule()
                .fill(Color.white.opacity(0.2))
                .frame(width: 36, height: 4)
                .padding(.top, DS.Space.xs)

            // Header
            HStack {
                Button {
                    withAnimation { isShowing = false }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(DS.Color.midGray)
                }
                Spacer()
                Text("詢問防災 AI")
                    .font(DS.Type.body().bold())
                    .foregroundStyle(.white)
                Spacer()
                // RAG status dot
                Circle()
                    .fill(state.ragState.isSearching ? DS.Color.accentYellow : .green)
                    .frame(width: 8, height: 8)
            }
            .padding(.horizontal, DS.Space.m)
            .padding(.vertical, DS.Space.xs)

            // RAG results if any
            if !state.ragState.results.isEmpty {
                RAGVisualizationPanel(ragState: state.ragState)
            }

            // Messages
            ScrollView {
                LazyVStack(spacing: DS.Space.xs) {
                    ForEach(state.messages) { msg in
                        DrillBubble(message: msg, largeBtnMode: state.largeBtnMode)
                    }
                    if state.isGenerating { TypingDots() }
                }
                .padding(DS.Space.m)
            }
            .frame(maxHeight: 280)
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
        .shadow(color: .black.opacity(0.4), radius: 30, y: -10)
        .padding(.bottom, 84)
        // FIX #10：ZStack 浮層鍵盤迴避
        .ignoresSafeArea(.keyboard, edges: .bottom) // above bottom nav
    }
}

// MARK: - Resources View ("Resources" tab)
struct ResourcesView: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        NavigationStack {
            ZStack {
                DS.Color.appBg.ignoresSafeArea()
                ScrollView {
                    LazyVStack(spacing: DS.Space.xs) {
                        ForEach(DisasterCategory.allCases, id: \.self) { cat in
                            let chunks = state.kb.chunks.filter { $0.category == cat }
                            if !chunks.isEmpty {
                                Section {
                                    ForEach(chunks) { chunk in
                                        ExpandableKnowledgeCard(chunk: chunk,
                                                                largeBtnMode: state.largeBtnMode)
                                    }
                                } header: {
                                    HStack {
                                        Text(cat.icon)
                                        Text(cat.rawValue)
                                            .font(DS.Type.heading(large: state.largeBtnMode))
                                            .foregroundStyle(.white)
                                        Spacer()
                                        Text("\(chunks.count) 篇")
                                            .font(DS.Type.caption())
                                            .foregroundStyle(DS.Color.midGray)
                                    }
                                    .padding(.horizontal, DS.Space.m)
                                    .padding(.top, DS.Space.m)
                                    .padding(.bottom, DS.Space.xxs)
                                }
                            }
                        }
                        Color.clear.frame(height: 100)
                    }
                    .padding(.horizontal, DS.Space.m)
                }
            }
            .navigationTitle("防災資源庫")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }
}
