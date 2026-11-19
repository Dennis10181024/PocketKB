import SwiftUI

// MARK: - Main Dashboard
struct MainDashboardView: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        NavigationStack {
            ZStack {
                DS.Color.appBg.ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {

                        // ── Top Bar ──────────────────────────────────────
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("口袋知識庫")
                                    .font(DS.Type.displayXL(large: state.largeBtnMode))
                                    .foregroundStyle(.white)
                                Text("離線防災演練系統")
                                    .font(DS.Type.caption(large: state.largeBtnMode))
                                    .foregroundStyle(DS.Color.midGray)
                            }
                            Spacer()
                            HStack(spacing: DS.Space.xs) {
                                NavigationLink {
                                    SettingsView().environmentObject(state)
                                } label: {
                                    navIconBtn("gearshape.fill")
                                }
                                navIconBtn("person.crop.circle.fill")
                            }
                        }
                        .padding(.horizontal, DS.Space.m)
                        .padding(.top, DS.Space.m)
                        .padding(.bottom, DS.Space.xs)

                        // ── Model Status ─────────────────────────────────
                        ModelStatusRow()
                            .padding(.horizontal, DS.Space.m)
                            .padding(.bottom, DS.Space.m)

                        // ── Main Action Cards ────────────────────────────
                        HStack(spacing: DS.Space.m) {
                            NavigationLink {
                                ScenarioPickerView().environmentObject(state)
                            } label: {
                                DashboardActionCard(
                                    emoji: "💬", title: "對話演練",
                                    subtitle: "5 大災種情境",
                                    bgColor: DS.Color.safetyOrange,
                                    isActive: state.modelStatus == .ready,
                                    largeBtnMode: state.largeBtnMode)
                            }
                            .buttonStyle(.plain)
                            .disabled(state.modelStatus != .ready)

                            Button {
                                state.selectedTab = .emergency
                            } label: {
                                DashboardActionCard(
                                    emoji: "🆘", title: "災時引導",
                                    subtitle: "急救步驟查詢",
                                    bgColor: DS.Color.emergencyRed,
                                    isActive: true,
                                    largeBtnMode: state.largeBtnMode)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, DS.Space.m)

                        // ── Accessibility Toggles ────────────────────────
                        VStack(spacing: DS.Space.xs) {
                            AccessibilityToggleRow(
                                icon: "arrow.up.left.and.arrow.down.right",
                                label: "大按鈕模式",
                                isOn: $state.largeBtnMode)
                            AccessibilityToggleRow(
                                icon: "speaker.wave.2.fill",
                                label: "語音導覽",
                                isOn: $state.voiceNavEnabled)
                        }
                        .padding(DS.Space.m)
                        .background(DS.Color.surface,
                                    in: RoundedRectangle(cornerRadius: DS.Radius.l))
                        .padding(.horizontal, DS.Space.m)
                        .padding(.top, DS.Space.m)

                        // ── Offline Badge ────────────────────────────────
                        HStack(spacing: DS.Space.xs) {
                            Circle().fill(.green).frame(width: 8, height: 8)
                            Text("完全離線 • 資料存於本地端")
                                .font(DS.Type.caption())
                                .foregroundStyle(DS.Color.midGray)
                        }
                        .padding(.top, DS.Space.l)
                        .padding(.bottom, 100)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }

    func navIconBtn(_ name: String) -> some View {
        Image(systemName: name)
            .font(.system(size: 20))
            .foregroundStyle(DS.Color.midGray)
            .frame(width: 48, height: 48)
            .background(DS.Color.surface,
                        in: RoundedRectangle(cornerRadius: DS.Radius.m))
    }
}

// MARK: - Dashboard Action Card
struct DashboardActionCard: View {
    let emoji:        String
    let title:        String
    let subtitle:     String
    let bgColor:      Color
    let isActive:     Bool
    let largeBtnMode: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Space.xs) {
            Text(emoji).font(.system(size: largeBtnMode ? 36 : 28))
            Spacer()
            Text(title)
                .font(DS.Type.heading(large: largeBtnMode))
                .foregroundStyle(.white)
                .lineLimit(1)
            Text(subtitle)
                .font(DS.Type.caption(large: largeBtnMode))
                .foregroundStyle(.white.opacity(0.75))
                .lineLimit(1)
        }
        .padding(DS.Space.m)
        .frame(maxWidth: .infinity,
               minHeight: largeBtnMode ? 150 : 130,
               alignment: .leading)
        .background(isActive ? bgColor : bgColor.opacity(0.3),
                    in: RoundedRectangle(cornerRadius: DS.Radius.l))
        .opacity(isActive ? 1 : 0.5)
    }
}

// MARK: - Accessibility Toggle Row
struct AccessibilityToggleRow: View {
    let icon:  String
    let label: String
    @Binding var isOn: Bool

    var body: some View {
        Toggle(isOn: $isOn) {
            HStack(spacing: DS.Space.xs) {
                Image(systemName: icon)
                    .foregroundStyle(DS.Color.safetyOrange)
                    .frame(width: 20)
                Text(label)
                    .font(DS.Type.body())
                    .foregroundStyle(.white)
            }
        }
        .tint(DS.Color.safetyOrange)
        .frame(minHeight: DS.Space.touchMin)
    }
}

// MARK: - Model Status Row
struct ModelStatusRow: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        VStack(spacing: DS.Space.xxs) {
            // LLM 狀態
            HStack(spacing: DS.Space.xs) {
                Circle()
                    .fill(state.modelStatus.color)
                    .frame(width: 10, height: 10)
                Text(state.modelStatus.description)
                    .font(DS.Type.caption())
                    .foregroundStyle(DS.Color.midGray)

                if case .loading(let p) = state.modelStatus {
                    ProgressView(value: p)
                        .progressViewStyle(.linear)
                        .tint(DS.Color.accentYellow)
                        .frame(width: 80)
                }
                Spacer()
                if case .error(_) = state.modelStatus {
                    Button("重試") { Task { await state.loadModel() } }
                        .font(DS.Type.caption().bold())
                        .foregroundStyle(DS.Color.emergencyRed)
                }
            }

            // 推論模式狀態
            HStack(spacing: DS.Space.xs) {
                Circle()
                    .fill(state.effectivelyOnline ? Color.cyan : .green)
                    .frame(width: 8, height: 8)
                Text(state.effectivelyOnline
                     ? "線上：\(state.apiClient.provider.rawValue)"
                     : "離線：本地 LLM")
                    .font(.system(size: 10))
                    .foregroundStyle(DS.Color.midGray)
                Spacer()
            }

            HStack(spacing: DS.Space.xs) {
                Circle()
                    .fill(state.modelFilesHint == "模型檔案完整" ? .green : DS.Color.accentYellow)
                    .frame(width: 8, height: 8)
                Text(state.modelFilesHint)
                    .font(.system(size: 10))
                    .foregroundStyle(DS.Color.midGray)
                Spacer()
            }
        }
        .padding(.horizontal, DS.Space.m)
        .padding(.vertical, DS.Space.xs)
        .background(DS.Color.surface,
                    in: RoundedRectangle(cornerRadius: DS.Radius.pill))
        .onAppear { state.refreshModelFilesHint() }
    }
}

// MARK: - Settings View
struct SettingsView: View {
    @EnvironmentObject var state: AppState
    @State private var showPDFImport      = false
    @State private var showInferenceMode  = false

    var body: some View {
        ZStack {
            DS.Color.appBg.ignoresSafeArea()
            VStack(alignment: .leading, spacing: DS.Space.l) {
                VStack(spacing: DS.Space.xs) {
                    AccessibilityToggleRow(
                        icon: "arrow.up.left.and.arrow.down.right",
                        label: "大按鈕模式",
                        isOn: $state.largeBtnMode)
                    AccessibilityToggleRow(
                        icon: "speaker.wave.2.fill",
                        label: "語音導覽",
                        isOn: $state.voiceNavEnabled)
                }
                .padding(DS.Space.m)
                .background(DS.Color.surface,
                            in: RoundedRectangle(cornerRadius: DS.Radius.l))
                .padding(.horizontal)

                // 推論模式設定
                Button { showInferenceMode = true } label: {
                    HStack(spacing: DS.Space.m) {
                        Image(systemName: state.inferenceMode.icon)
                            .font(.system(size: 20))
                            .foregroundStyle(
                                state.effectivelyOnline ? Color.cyan : DS.Color.safetyOrange)
                            .frame(width: 36, height: 36)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("推論模式")
                                .font(DS.Type.body())
                                .foregroundStyle(.white)
                            Text(state.effectivelyOnline
                                 ? "線上：\(state.apiClient.provider.rawValue)"
                                 : "離線：本地 Qwen2.5-1.5B")
                                .font(DS.Type.caption())
                                .foregroundStyle(DS.Color.midGray)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(DS.Color.midGray)
                    }
                    .padding(DS.Space.m)
                    .background(DS.Color.surface,
                                in: RoundedRectangle(cornerRadius: DS.Radius.l))
                }
                .buttonStyle(.plain)
                .padding(.horizontal)

                // PDF 匯入入口
                Button { showPDFImport = true } label: {
                    HStack(spacing: DS.Space.m) {
                        Image(systemName: "doc.badge.plus")
                            .font(.system(size: 20))
                            .foregroundStyle(DS.Color.safetyOrange)
                            .frame(width: 36, height: 36)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("匯入防災手冊 PDF")
                                .font(DS.Type.body())
                                .foregroundStyle(.white)
                            Text("上傳官方手冊以擴充知識庫")
                                .font(DS.Type.caption())
                                .foregroundStyle(DS.Color.midGray)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(DS.Color.midGray)
                    }
                    .padding(DS.Space.m)
                    .background(DS.Color.surface,
                                in: RoundedRectangle(cornerRadius: DS.Radius.l))
                }
                .buttonStyle(.plain)
                .padding(.horizontal)

                VStack(alignment: .leading, spacing: DS.Space.xs) {
                    Text("模型資訊")
                        .font(DS.Type.caption())
                        .foregroundStyle(DS.Color.midGray)
                    Text("Qwen2.5-1.5B-Instruct Q4_K_M")
                        .font(DS.Type.body()).foregroundStyle(.white)
                    Text(state.ragModeDescription + " · 完全離線 · 資料駐留本地")
                        .font(DS.Type.caption()).foregroundStyle(DS.Color.midGray)
                }
                .padding(DS.Space.m)
                .background(DS.Color.surface,
                            in: RoundedRectangle(cornerRadius: DS.Radius.l))
                .padding(.horizontal)

                Spacer()
            }
            .padding(.top, DS.Space.l)
        }
        .navigationTitle("設定")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .sheet(isPresented: $showPDFImport) {
            PDFImportView().environmentObject(state)
        }
        .sheet(isPresented: $showInferenceMode) {
            InferenceModeSettingsView().environmentObject(state)
        }
    }
}
