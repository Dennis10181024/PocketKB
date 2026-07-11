import SwiftUI

@main
struct PocketKBApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentRoot()
                .environmentObject(appState)
                .preferredColorScheme(.dark)
        }
    }
}

// MARK: - Content Root
struct ContentRoot: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch state.selectedTab {
                case .home:      MainDashboardView()
                case .incident:  ScenarioPickerView()
                case .emergency: EmergencyGuideView()
                case .resources: ResourcesView()
                case .quick:     QuickGuideView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            BottomNavBar()
        }
        .background(DS.Color.appBg.ignoresSafeArea())
        .task {
            if state.modelStatus == .notLoaded {
                await state.loadModel()
            }
        }
    }
}

// MARK: - Bottom Nav Bar
struct BottomNavBar: View {
    @EnvironmentObject var state: AppState
    @State private var showNotReadyAlert = false

    var body: some View {
        HStack(spacing: 0) {
            ForEach(AppTab.allCases, id: \.self) { tab in
                Button {
                    // 模型未就緒時，Incident tab 顯示提示而非靜默失敗
                    if tab == .incident && state.modelStatus != .ready {
                        showNotReadyAlert = true
                        return
                    }
                    withAnimation(.spring(response: 0.25)) {
                        state.selectedTab = tab
                    }
                } label: {
                    VStack(spacing: DS.Space.xxs) {
                        Image(systemName: tab.icon)
                            .font(.system(size: tab.isEmergency ? 24 : 20))
                        Text(tab.rawValue)
                            .font(DS.Type.caption(large: state.largeBtnMode))
                    }
                    .foregroundStyle(
                        tab.isEmergency
                            ? DS.Color.emergencyRed
                            : state.selectedTab == tab
                                ? DS.Color.safetyOrange
                                : (tab == .incident && state.modelStatus != .ready)
                                    ? DS.Color.midGray.opacity(0.4)
                                    : DS.Color.midGray
                    )
                    .frame(maxWidth: .infinity)
                    .frame(height: 60)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .frame(height: 84)
        .background(DS.Color.appBg)
        .overlay(
            Rectangle()
                .fill(Color.white.opacity(0.08))
                .frame(height: 1),
            alignment: .top
        )
        .alert("模型尚未就緒", isPresented: $showNotReadyAlert) {
            Button("確定") { }
        } message: {
            Text(state.modelStatus.description + "\n請等待模型載入完成，或確認已傳入 .gguf 模型檔。")
        }
    }
}

// MARK: - Model Setup Screen
struct ModelSetupView: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        ZStack {
            DS.Color.appBg.ignoresSafeArea()
            VStack(spacing: DS.Space.l) {
                Image(systemName: "externaldrive.badge.exclamationmark")
                    .font(.system(size: 64))
                    .foregroundStyle(DS.Color.safetyOrange)

                Text("需要模型檔案")
                    .font(DS.Type.displayL())
                    .foregroundStyle(.white)

                VStack(alignment: .leading, spacing: DS.Space.m) {
                    SetupStepRow(n: "1",
                        text: "前往 HuggingFace 下載\nQwen2.5-1.5B-Instruct-Q4_K_M.gguf（約 1.0 GB）")
                    SetupStepRow(n: "2",
                        text: "Xcode → Window → Devices and Simulators\n拖曳 .gguf 至 PocketKB App Documents")
                    SetupStepRow(n: "3",
                        text: "點「重新載入」啟動離線推論")
                }
                .padding(DS.Space.m)
                .background(DS.Color.surface, in: RoundedRectangle(cornerRadius: DS.Radius.l))

                Button { Task { await state.loadModel() } } label: {
                    Text("重新載入")
                        .font(DS.Type.bodyLarge())
                        .fontWeight(.semibold)
                        .foregroundStyle(.black)
                        .frame(maxWidth: .infinity)
                        .frame(height: DS.Space.touchMin + DS.Space.m)
                        .background(DS.Color.safetyOrange,
                                    in: RoundedRectangle(cornerRadius: DS.Radius.l))
                }

                Link("前往 HuggingFace 下載模型 →",
                     destination: URL(string:
                        "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF")!)
                    .font(DS.Type.caption())
                    .foregroundStyle(.cyan)
            }
            .padding(DS.Space.l)
        }
    }
}

struct SetupStepRow: View {
    let n: String
    let text: String
    var body: some View {
        HStack(alignment: .top, spacing: DS.Space.m) {
            Text(n)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.black)
                .frame(width: 28, height: 28)
                .background(DS.Color.safetyOrange, in: Circle())
            Text(text)
                .font(DS.Type.caption())
                .foregroundStyle(.white.opacity(0.8))
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
