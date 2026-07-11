import SwiftUI

// MARK: - Design Tokens
// Source: AI-on-Divice-master/tokens/ (Penpot design system)
enum DS {

    enum Color {
        static let safetyOrange   = SwiftUI.Color(hex: "FF6A00")
        static let emergencyRed   = SwiftUI.Color(hex: "C62828")
        static let charcoal       = SwiftUI.Color(hex: "111213")
        static let appBg          = SwiftUI.Color(hex: "0B0B0B")
        static let surface        = SwiftUI.Color(hex: "1F1F1F")
        static let neutralBg      = SwiftUI.Color(hex: "F5F5F5")
        static let midGray        = SwiftUI.Color(hex: "9E9E9E")
        static let accentYellow   = SwiftUI.Color(hex: "FFD54F")
        static let statusOrangeBg = SwiftUI.Color(hex: "FFF3E0")
    }

    enum Space {
        static let xxs: CGFloat = 4
        static let xs:  CGFloat = 8
        static let m:   CGFloat = 16
        static let l:   CGFloat = 24
        static let xl:  CGFloat = 32
        static let touchMin: CGFloat = 44
        static let touchPad: CGFloat = 12
    }

    enum Type {
        static func displayXL()  -> Font { .system(size: 28, weight: .bold) }
        static func displayL()   -> Font { .system(size: 22, weight: .semibold) }
        static func heading()    -> Font { .system(size: 20, weight: .semibold) }
        static func bodyLarge()  -> Font { .system(size: 18, weight: .medium) }
        static func body()       -> Font { .system(size: 16, weight: .regular) }
        static func caption()    -> Font { .system(size: 14, weight: .regular) }

        static func displayXL(large: Bool) -> Font { large ? .system(size: 32, weight: .bold)    : displayXL() }
        static func heading(large: Bool)   -> Font { large ? .system(size: 24, weight: .semibold) : heading() }
        static func body(large: Bool)      -> Font { large ? .system(size: 20, weight: .regular)  : body() }
        static func caption(large: Bool)   -> Font { large ? .system(size: 16, weight: .regular)  : caption() }
    }

    enum Radius {
        static let sm:  CGFloat = 8
        static let m:   CGFloat = 12
        static let l:   CGFloat = 16
        static let xl:  CGFloat = 24
        static let pill:CGFloat = 100
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >>  8) & 0xFF) / 255
        let b = Double( int        & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
