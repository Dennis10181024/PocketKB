import Foundation
import AVFoundation

// MARK: - Voice Service
/// 語音導覽：使用 iOS 內建 AVSpeechSynthesizer，完全離線
/// 對應計畫書圖 1：「Chat interface + Voice Optional」
@MainActor
final class VoiceService: NSObject, ObservableObject {

    static let shared = VoiceService()

    private let synthesizer = AVSpeechSynthesizer()
    @Published private(set) var isSpeaking = false

    override init() {
        super.init()
        synthesizer.delegate = self
        configureAudioSession()
    }

    // MARK: - 朗讀文字
    func speak(_ text: String) {
        guard !text.isEmpty else { return }

        // 若正在說話，先停止
        if synthesizer.isSpeaking { synthesizer.stopSpeaking(at: .immediate) }

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = bestChineseVoice()
        utterance.rate  = AVSpeechUtteranceDefaultSpeechRate * 0.9   // 稍慢，適合緊急情境
        utterance.pitchMultiplier = 1.0
        utterance.volume = 1.0

        synthesizer.speak(utterance)
        isSpeaking = true
    }

    // MARK: - 朗讀緊急步驟（逐步驟朗讀，帶停頓）
    func speakSteps(_ steps: [EmergencyStep]) {
        if synthesizer.isSpeaking { synthesizer.stopSpeaking(at: .immediate) }

        for (i, step) in steps.enumerated() {
            let utterance = AVSpeechUtterance(string: "第\(chineseNumber(i+1))步。\(step.text)")
            utterance.voice           = bestChineseVoice()
            utterance.rate            = AVSpeechUtteranceDefaultSpeechRate * 0.85
            utterance.preUtteranceDelay  = i == 0 ? 0 : 0.3
            utterance.postUtteranceDelay = 0.5
            synthesizer.speak(utterance)
        }
        isSpeaking = true
    }

    // MARK: - 停止
    func stop() {
        synthesizer.stopSpeaking(at: .word)
        isSpeaking = false
    }

    // MARK: - 語音切換
    func toggle(text: String) {
        if isSpeaking { stop() } else { speak(text) }
    }

    // MARK: - 選取最佳中文語音
    private func bestChineseVoice() -> AVSpeechSynthesisVoice? {
        // 優先台灣中文，其次大陸中文，再其次任何中文
        let preferred = ["zh-TW", "zh-HK", "zh-CN"]
        for lang in preferred {
            if let voice = AVSpeechSynthesisVoice(language: lang) {
                return voice
            }
        }
        return AVSpeechSynthesisVoice.speechVoices()
            .first { $0.language.hasPrefix("zh") }
    }

    // MARK: - Audio Session 設定（允許與背景音樂混合）
    private func configureAudioSession() {
        try? AVAudioSession.sharedInstance().setCategory(
            .playback,
            mode: .spokenAudio,
            options: [.duckOthers, .allowBluetooth]
        )
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    // MARK: - 中文數字
    private func chineseNumber(_ n: Int) -> String {
        ["一","二","三","四","五","六","七","八","九","十"][safe: n-1] ?? "\(n)"
    }
}

// MARK: - AVSpeechSynthesizerDelegate
extension VoiceService: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                        didFinish utterance: AVSpeechUtterance) {
        if !synthesizer.isSpeaking {
            Task { @MainActor in self.isSpeaking = false }
        }
    }
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                        didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = false }
    }
}

// MARK: - Array safe subscript
private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
