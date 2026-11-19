import Foundation

// MARK: - Disaster Category
enum DisasterCategory: String, CaseIterable, Codable {
    case earthquake = "地震"
    case typhoon    = "颱風洪水"
    case fire       = "火災"
    case manmade    = "人為災難"
    case compound   = "複合災害"
    case firstAid   = "急救知識"   // FIX #9：新增分類，CPR/PFA 歸這裡

    var icon: String {
        switch self {
        case .earthquake: return "🏚"
        case .typhoon:    return "🌊"
        case .fire:       return "🔥"
        case .manmade:    return "⚠️"
        case .compound:   return "🆘"
        case .firstAid:   return "🩺"
        }
    }
}

// MARK: - Knowledge Chunk
struct KnowledgeChunk: Identifiable, Codable {
    let id:       String
    let title:    String
    let content:  String
    let category: DisasterCategory
    let tags:     [String]
}

// MARK: - RAG Retrieval Result
/// HybridRAGEngine 的檢索結果，包含分數與匹配詞（供 RAG 視覺化面板使用）
struct RetrievalResult: Identifiable {
    let id           = UUID()
    let chunk:       KnowledgeChunk
    let score:       Double
    let matchedTerms:[String]
}

// MARK: - Drill Scenario
struct DrillScenario: Identifiable, Codable {
    let id:           String
    let title:        String
    let category:     DisasterCategory
    let location:     String
    let openingLine:  String
    let systemPrompt: String
}

// MARK: - Emergency Quick Steps (新增：緊急一鍵引導用)
struct EmergencyStep: Identifiable {
    let id    = UUID()
    let order: Int
    let text:  String
}

struct EmergencyGuide {
    let category: DisasterCategory
    let headline: String          // e.g. "地震發生了"
    let steps:    [EmergencyStep]
    let callout:  String          // 最重要的一句話
}

// MARK: - KnowledgeBase (singleton)
final class KnowledgeBase {
    static let shared = KnowledgeBase()
    private(set) var chunks:         [KnowledgeChunk]  = []
    private(set) var scenarios:      [DrillScenario]   = []
    private(set) var emergencyGuides:[EmergencyGuide]  = []

    private init() {
        chunks          = Self.buildChunks()
        scenarios       = Self.buildScenarios()
        emergencyGuides = Self.buildEmergencyGuides()
    }

    // ─────────────────────────────────────────────────────────────
    // MARK: Knowledge Chunks
    // ─────────────────────────────────────────────────────────────
    private static func buildChunks() -> [KnowledgeChunk] {[

        // ── 地震 ────────────────────────────────────────────────
        KnowledgeChunk(id:"eq_001", title:"地震發生時基本動作",
            content:"""
            地震發生時立即採取「趴下、掩護、穩住（Drop, Cover, Hold On）」：
            1. 趴下：迅速蹲低或趴地，降低重心避免跌倒。
            2. 掩護：躲到堅固桌子下，或靠近建築物內牆，雙手護頭頸。
            3. 穩住：抓緊掩護物直到搖晃停止。
            避免：衝向門口、衝到戶外、搭電梯逃生。
            室外時：遠離建築物、電線桿、圍牆，蹲在空曠處護頭。
            車內時：慢慢靠邊停車，避開橋樑及高架橋，留在車內等搖晃停止。
            """,
            category:.earthquake, tags:["DCH","趴下掩護","基本動作","室內","室外"]),

        KnowledgeChunk(id:"eq_002", title:"地震後自救程序",
            content:"""
            地震停止後的行動步驟：
            1. 確認自身安全：檢查是否受傷，有出血先止血。
            2. 關閉瓦斯：立即關閉瓦斯總開關，預防火災。
            3. 斷電預防：若電線裸露或出現火花，關閉電源總開關。
            4. 穿上鞋子：避免踩到玻璃碎片。
            5. 疏散評估：檢查建築物裂縫或傾斜，決定是否疏散。
            6. 通報求助：撥打119（火災/急救）或110（警察）。
            7. 避免餘震：移至開放空間，遠離危險建物。
            8. 協助鄰居：確認老弱鄰居狀況。
            """,
            category:.earthquake, tags:["地震後","自救","瓦斯","疏散"]),

        KnowledgeChunk(id:"eq_003", title:"被困廢墟求生技巧",
            content:"""
            被困建築廢墟時的存活要點：
            呼救：用硬物敲擊管道或牆壁，三短三長三短節奏；避免大聲呼喊（消耗體力、吸入粉塵）。
            保護呼吸：用衣物遮住口鼻，防止粉塵吸入。
            保存體力：減少不必要移動，維持平穩呼吸。
            找支撐：確認上方無鬆動重物，移至相對安全空間。
            保持意識：持續輕拍或活動腳趾，防止失去知覺。
            等待救援：搜救人員通常在72小時內展開密集搜索，黃金72小時要保持求生意志。
            """,
            category:.earthquake, tags:["廢墟","被困","求生","SOS","72小時"]),

        // ── 颱風洪水 ────────────────────────────────────────────
        KnowledgeChunk(id:"ty_001", title:"颱風來臨前防範準備",
            content:"""
            颱風警報發布後的準備清單：
            1. 儲水：儲備飲用水至少3天份（每人每日2公升）。
            2. 儲糧：準備免煮或易保存食物（餅乾、罐頭、泡麵）。
            3. 加固門窗：用膠帶貼X型於玻璃（減少碎裂），固定鬆動物品。
            4. 清理陽台：移除花盆、曬衣架等可能飛落傷人物品。
            5. 緊急背包：手電筒、備用電池、藥品、重要文件、現金。
            6. 充電設備：手機、行動電源充飽電。
            7. 瞭解避難所：查詢最近的公立避難收容所位置。
            """,
            category:.typhoon, tags:["颱風準備","儲水","緊急背包","避難收容所"]),

        KnowledgeChunk(id:"ty_002", title:"洪水疏散與自救",
            content:"""
            洪水或土石流來臨時的應對：
            疏散時機：接到撤離通知立即行動；水位淹及腳踝即有危險。
            疏散路線：往高處移動，避免穿越急流（30公分深急流可沖倒成人）。
            車輛：勿強行穿越淹水路面，水深超過排氣管即有熄火風險。
            被困車內：水迅速淹入時立即開窗逃出（電動窗失效用頭枕刺破玻璃）。
            就地避難：若無法疏散，移至建築物最高樓層等待救援。
            土石流警示：聽到異常流水聲或地鳴聲立即向垂直山坡方向逃跑。
            通報：撥打119或1999市民服務熱線。
            """,
            category:.typhoon, tags:["洪水","疏散","土石流","淹水","撤離"]),

        // ── 火災 ────────────────────────────────────────────────
        KnowledgeChunk(id:"fi_001", title:"火災初期滅火與逃生判斷",
            content:"""
            火災黃金90秒決策：
            初期火災（火焰小於1公尺）：立即使用滅火器（PASS：拔銷、瞄準、壓握、掃射）。
            火勢擴大（火焰超過1公尺或煙霧瀰漫）：放棄滅火，立即逃生。
            逃生步驟：
            1. 大聲通知他人火災。
            2. 關閉火場門（減少煙霧擴散）。
            3. 觸摸逃生門把：若燙手代表門外有火，不可開門。
            4. 走安全梯，絕對不搭電梯。
            5. 低姿勢逃生（煙霧上飄，接近地面空氣較清潔）。
            6. 用濕毛巾掩口鼻。
            """,
            category:.fire, tags:["初期火災","滅火器","PASS","逃生","90秒"]),

        KnowledgeChunk(id:"fi_002", title:"被困火場中的求生",
            content:"""
            被困火場無法逃脫時的求生技巧：
            1. 通報位置：大聲呼救，向窗外揮動衣物或手電筒。
            2. 封閉縫隙：用衣物、毛巾塞住門縫，防止煙霧進入。
            3. 向窗口移動：打開窗戶但不要跳樓（一二樓除外）。
            4. 保持低姿勢：等待救援時貼近地面呼吸。
            5. 持續通報：撥119告知位置，或用力敲打牆壁。
            重要：濃煙中的一氧化碳才是最大殺手，非火焰本身。
            禁止：不搭電梯、不躲入衣櫥或廁所（容易被困）。
            """,
            category:.fire, tags:["被困火場","封閉縫隙","濃煙","一氧化碳"]),

        // ── 基礎急救 ────────────────────────────────────────────
        KnowledgeChunk(id:"fa_001", title:"CPR 心肺復甦術步驟",
            content:"""
            CPR 正確步驟（成人）：
            1. 評估環境安全後，輕拍雙肩並呼喊「你還好嗎？」
            2. 無反應：呼叫旁人撥打119，取得AED。
            3. 確認呼吸：觀察胸部起伏不超過10秒。
            4. 胸外按壓：
               - 位置：胸骨下半部（兩乳頭連線中間）
               - 深度：至少5公分（勿超過6公分）
               - 頻率：100〜120次/分鐘（跟著「staying alive」節拍）
               - 讓胸部完全回彈後再按
            5. 人工呼吸（受訓者）：30次按壓搭配2次人工呼吸。
            6. 持續執行直到AED到達、傷患有反應或救護人員接手。
            AED：開機後依語音指示，貼片貼妥後分析，電擊前確認無人接觸傷者。
            """,
            category:.firstAid, tags:["CPR","心肺復甦術","AED","急救"]),

        KnowledgeChunk(id:"fa_002", title:"外傷止血與固定",
            content:"""
            外傷急救：
            止血：直接加壓傷口持續5〜10分鐘；抬高患肢；大量出血在近心端施壓。
            止血帶：距傷口5〜8公分近心端綁緊，記錄施用時間。
            骨折固定：用夾板（木板、捲起雜誌）固定，保持自然姿勢。
            燙傷：立即大量流動冷水沖洗15〜20分鐘（勿用冰塊）。
            禁止：不可用酒精、牙膏、醬油塗抹傷口。
            """,
            category:.firstAid, tags:["止血","骨折","外傷","急救","燙傷"]),

        // ── 心理急救 ────────────────────────────────────────────
        KnowledgeChunk(id:"pfa_001", title:"心理急救基本原則",
            content:"""
            心理急救（PFA）五核心：安全、安靜、自我效能、連結、希望
            1. 確保安全：帶離危險環境，安排穩定休息空間。
            2. 提供安慰：主動陪伴，使用溫和語氣，避免強迫訴說。
            3. 傾聽不評判：讓倖存者以自己步調說話。
            4. 實際協助：提供食物、水、毛毯等基本需求。
            5. 連結支持：協助聯繫家人或社會資源。
            避免說：「你要堅強」「別哭了」「一切都會沒事的」
            建議說：「你現在安全了」「我在這裡陪你」「有什麼需要我可以幫忙的」
            """,
            category:.firstAid, tags:["心理急救","PFA","創傷","情緒支持"]),

        // ── 人為災難 ────────────────────────────────────────────
        KnowledgeChunk(id:"mm_001", title:"公共場所暴力事件應對",
            content:"""
            公共場所突發暴力（Run-Hide-Fight 原則）：
            第一優先：逃跑（RUN）— 立即向遠離攻擊者方向逃跑；拋棄隨身物品；撥打110。
            第二選擇：躲藏（HIDE）— 進入可上鎖房間，鎖門堵門；關燈安靜；關閉手機聲音。
            最後手段：反擊（FIGHT）— 只在無法逃跑且生命受威脅時；多人合作，使用滅火器、椅子。
            等待救援：確認警察到達後才開門（確認制服與證件）。
            """,
            category:.manmade, tags:["暴力事件","公共場所","RHF","逃生"]),

        // ── 複合災害 ────────────────────────────────────────────
        KnowledgeChunk(id:"cp_001", title:"地震後火災複合應對",
            content:"""
            地震引發火災時的複合應對策略：
            優先順序：人身安全 > 滅火 > 財物。
            立即行動：趴下掩護穩住等搖晃停止 → 評估火源大小 → 小火立即用滅火器；大火立即逃生。
            特殊注意：地震後瓦斯管線可能破裂，禁止使用明火或電燈開關（可能引燃外洩瓦斯）。
            疏散：走安全梯，絕對不搭電梯（地震可能損壞電梯結構）。
            通報：逃出後立即撥打119，告知地址與火勢規模。
            餘震警覺：疏散至室外開放空間後仍需注意餘震，遠離建築物。
            """,
            category:.compound, tags:["地震火災","複合災害","瓦斯","逃生","餘震"]),

        KnowledgeChunk(id:"cp_002", title:"颱風停電複合應對",
            content:"""
            颱風造成停電時的應對：
            照明：備用手電筒優先（蠟燭有火災風險）；行動電源保持充電。
            食物安全：停電後冰箱食物安全期：冷藏4小時、冷凍24〜48小時（不頻繁開門）。
            避難決策：停電加上颱風期間不建議外出；若需疏散，白天且風雨稍歇時移動。
            醫療設備：依賴電力維生設備者（如氧氣機）需提前聯繫醫療機構。
            通訊：停電時減少手機使用頻率保留電力；優先傳訊息（耗電少於通話）。
            恢復後：恢復供電時注意電器突然通電引發的火災風險，逐一確認電器狀態。
            """,
            category:.compound, tags:["颱風","停電","複合災害","食物安全","通訊"]),

        KnowledgeChunk(id:"cp_003", title:"戰時封鎖斷網斷電應對",
            content:"""
            軍事封鎖或重大基礎設施攻擊時的民眾應對：
            資訊獲取：收音機（電池式）是斷網斷電下最可靠的資訊來源；收聽政府廣播頻道。
            物資儲備：維持至少14天的糧食、飲水與藥品（戰時補給鏈不穩定）。
            通訊替代：斷網時可嘗試簡訊（比語音通話更容易穿透壅塞網路）；Meshtastic離線網狀通訊。
            避難所：政府指定的防空避難所通常位於地下室或堅固建築，提前查詢位置。
            黑暗管制：可能實施燈火管制，備妥遮光窗簾；夜間避免照明洩露位置。
            心理準備：長期封鎖需維持日常作息與社群連結，預防心理崩潰。
            """,
            category:.compound, tags:["戰時","斷網","斷電","封鎖","複合災害","民防"]),
    ]}

    // ─────────────────────────────────────────────────────────────
    // MARK: Drill Scenarios（計畫書圖4全部實作）
    // 地震4個、颱風3個、火災3個、人為2個、複合2個 = 14個
    // ─────────────────────────────────────────────────────────────
    private static func buildScenarios() -> [DrillScenario] {[

        // ══ 地震 ══════════════════════════════════════════════════

        DrillScenario(
            id: "eq_office",
            title: "辦公室地震演練",
            category: .earthquake, location: "辦公室",
            openingLine: "現在是下午三點，你正在辦公室開會。突然整棟大樓開始劇烈搖晃，天花板燈具在晃動，同事們紛紛驚叫起來……",
            systemPrompt: """
            你是防災訓練AI，引導「辦公室地震」第一人稱情境演練。
            情境：使用者在辦公室，地震剛開始搖晃。
            教學重點：DCH（趴下掩護穩住）、桌子下的正確姿勢、搖晃停止後的程序（瓦斯、電源、疏散）。
            每個決策點詢問使用者會怎麼做，根據回答給予即時回饋。
            當使用者做出危險選擇（如衝向門口）立即糾正並說明原因。
            使用繁體中文，保持臨場感，每次回覆不超過150字。
            """),

        DrillScenario(
            id: "eq_home_night",
            title: "深夜家中地震演練",
            category: .earthquake, location: "家中（夜間）",
            openingLine: "凌晨兩點，你從睡夢中被劇烈搖晃驚醒。窗外傳來玻璃破碎聲，你的孩子在隔壁房間哭喊，房間裡一片漆黑……",
            systemPrompt: """
            你是防災訓練AI，引導「深夜家中地震」第一人稱演練。
            特殊情境：黑暗環境、家中有孩子、可能停電。
            教學重點：黑暗中的安全動作（不要開燈開關）、照顧家人的優先順序、徒手找路逃生。
            使用繁體中文，第二人稱敘事，製造緊張感但保持引導清晰。
            """),

        DrillScenario(
            id: "eq_outdoor",
            title: "戶外地震演練",
            category: .earthquake, location: "戶外街道",
            openingLine: "你正走在市區街道上，突然腳下的地面開始搖晃。路旁的招牌劇烈晃動，前方一棟老舊建築的外牆碎片開始掉落……",
            systemPrompt: """
            你是防災訓練AI，引導「戶外地震」第一人稱演練。
            情境：使用者在市區街道，四周有建築物、招牌、電線桿。
            教學重點：戶外DCH、遠離建築物牆面與玻璃帷幕、找到開放空間、避免慌亂跑動。
            強調：戶外地震比室內更危險的原因是掉落物，而非地面裂縫。
            使用繁體中文，每次回覆不超過150字。
            """),

        DrillScenario(
            id: "eq_transit",
            title: "捷運車廂地震演練",
            category: .earthquake, location: "大眾交通工具",
            openingLine: "你坐在捷運車廂內，列車正在高架橋上行駛。突然劇烈搖晃，車廂燈光閃爍，列車緊急煞車，乘客們驚慌失措……",
            systemPrompt: """
            你是防災訓練AI，引導「大眾運輸工具地震」第一人稱演練。
            情境：捷運或公車行進中遇到地震，可能停在高架橋或隧道。
            教學重點：抓緊扶手蹲低、等列車完全停止後聽從廣播指示、不擅自開門跳車、隧道疏散注意事項。
            強調：高架橋上不要自行離開車廂，靜待工作人員引導。
            使用繁體中文，製造適度緊張感。
            """),

        // ══ 颱風洪水 ══════════════════════════════════════════════

        DrillScenario(
            id: "ty_community",
            title: "社區低窪地區颱風演練",
            category: .typhoon, location: "社區低窪地區",
            openingLine: "颱風警報升至陸上颱風警報，外面雨越下越大。你家附近排水溝開始逆流，電視新聞說你所在區域已發出撤離通報……",
            systemPrompt: """
            你是防災訓練AI，引導「低窪社區颱風洪水疏散」演練。
            情境：颱風來襲，所在區域發出疏散通報。
            教學重點：立即疏散決策（不可猶豫）、緊急背包物品確認、安全疏散路線、避免走低窪或地下道。
            強調：收到撤離通知必須立即行動，「等看看」是最危險的選擇。
            使用繁體中文。
            """),

        DrillScenario(
            id: "ty_mountain",
            title: "山區土石流演練",
            category: .typhoon, location: "山區道路",
            openingLine: "你開車在山區道路上，突然連續大雨讓能見度幾乎為零。廣播傳來土石流警戒通報，遠處山坡傳來低沉的轟鳴聲……",
            systemPrompt: """
            你是防災訓練AI，引導「山區土石流」第一人稱演練。
            情境：使用者在山區道路，車輛行進中，土石流警戒發布。
            教學重點：土石流的聽覺警兆（地鳴聲、異常水流聲）、垂直山坡方向逃跑、不要順著溪谷跑、車輛應對。
            強調：土石流移動速度極快，判斷後必須立即行動，不能等確認。
            使用繁體中文，製造緊迫感。
            """),

        DrillScenario(
            id: "ty_flash_flood",
            title: "市區閃洪被困演練",
            category: .typhoon, location: "市區地下室/地下停車場",
            openingLine: "你在地下停車場取車，突然發現入口處湧入大量積水，水位正在快速上升，出口已被淹沒，你的車停在最深處……",
            systemPrompt: """
            你是防災訓練AI，引導「市區閃洪地下室被困」演練。
            情境：地下停車場或地下室閃洪，出入口被淹沒。
            教學重點：不要試圖開車衝出（水阻力遠超引擎馬力）、尋找緊急逃生梯、水中行走姿勢、求救方式。
            強調：若無法逃脫，移至最高樓層（停車場頂層坡道）等待救援，保持冷靜。
            使用繁體中文。
            """),

        // ══ 火災 ══════════════════════════════════════════════════

        DrillScenario(
            id: "fi_apartment",
            title: "住宅大樓火災演練",
            category: .fire, location: "公寓大樓",
            openingLine: "你聽到走廊的煙霧警報大響，推開門縫聞到一股濃煙味道。你住在10樓，電梯就在走廊盡頭……",
            systemPrompt: """
            你是防災訓練AI，引導「住宅大樓火災」演練。
            教學重點：觸摸門把溫度判斷、選擇安全梯而非電梯、低姿勢逃生、被困時如何等待救援。
            強調：電梯絕對不可用；煙霧的危險性大於火焰。
            使用繁體中文，製造緊迫感。
            """),

        DrillScenario(
            id: "fi_public",
            title: "公共場所火災演練",
            category: .fire, location: "百貨公司/賣場",
            openingLine: "你正在地下一樓的百貨公司美食街用餐，突然聽到火災警報大響，廣播要求立即疏散。四周的人開始慌亂地四處跑動……",
            systemPrompt: """
            你是防災訓練AI，引導「公共場所火災疏散」演練。
            情境：在地下樓層的公共場所，人群慌亂。
            教學重點：不要跟著人群盲目跑動（踩踏風險）、找到緊急出口指示燈、不使用電梯、地下室火災煙霧往上竄的特性。
            強調：保持冷靜是最重要的，恐慌本身比火災更危險。
            使用繁體中文。
            """),

        DrillScenario(
            id: "fi_highrise",
            title: "高樓層火災演練",
            category: .fire, location: "高樓辦公室（20樓以上）",
            openingLine: "你在28樓的辦公室工作，消防廣播通報15樓發生火災，要求所有人員立即疏散。外面的走廊已飄入淡淡煙霧……",
            systemPrompt: """
            你是防災訓練AI，引導「高樓層火災疏散」演練。
            情境：28樓，火源在15樓，需要向下疏散超過10個樓層。
            教學重點：高樓疏散體力消耗管理、是否向上疏散至屋頂等待救援的判斷、安全梯加壓排煙功能、119高樓救援流程。
            強調：高樓火災疏散是馬拉松不是短跑，保留體力比速度更重要。
            使用繁體中文。
            """),

        // ══ 人為災難 ══════════════════════════════════════════════

        DrillScenario(
            id: "mm_metro",
            title: "捷運站暴力事件演練",
            category: .manmade, location: "捷運站月台",
            openingLine: "你正在捷運站月台等車，突然遠處傳來尖叫聲，人群開始朝你的方向奔跑。你隱約看到有人手持武器在人群中……",
            systemPrompt: """
            你是防災訓練AI，引導「公共場所突發暴力」演練。
            教學重點：Run-Hide-Fight的判斷與執行順序、撥打110的時機與說話內容、不要拍影片（延誤逃跑）。
            保持沉穩引導，協助建立清晰行動腳本，減少真實事件中的凍結反應。
            使用繁體中文。
            """),

        DrillScenario(
            id: "mm_chemical",
            title: "化學物質外洩演練",
            category: .manmade, location: "工業區/道路",
            openingLine: "你開車經過工業區，突然聞到一股刺激性異味，路邊一輛槽車旁冒出白色煙霧，附近的人開始咳嗽和逃跑……",
            systemPrompt: """
            你是防災訓練AI，引導「化學物質外洩」第一人稱演練。
            情境：疑似有毒氣體外洩，使用者在車輛內或戶外。
            教學重點：逃跑方向（垂直於風向）、不要在車內開冷氣（吸入外部空氣）、用濕布掩口鼻、不要圍觀、通報119時需說明「化學外洩」。
            強調：逃離時要向側風方向跑，不要順風也不要逆風。
            使用繁體中文。
            """),

        // ══ 複合災害 ══════════════════════════════════════════════

        DrillScenario(
            id: "cp_eq_fire",
            title: "地震引發火災複合演練",
            category: .compound, location: "住宅區",
            openingLine: "地震剛停止，你發現廚房傳來異味——瓦斯管線可能破裂了。同時，鄰居大喊他們家的天然氣爐具因地震翻倒，火苗已經竄起……",
            systemPrompt: """
            你是防災訓練AI，引導「地震引發火災」複合災害演練。
            情境：地震剛結束，同時發生火災，需要同時處理兩種威脅。
            教學重點：優先順序（先逃生再報警，不要試圖滅火）、瓦斯外洩時禁止使用電器開關、地震後安全梯可能受損的判斷、餘震風險。
            強調：複合災害中判斷力比任何技術都重要，先保命才能救人。
            使用繁體中文。
            """),

        DrillScenario(
            id: "cp_typhoon_power",
            title: "颱風停電複合演練",
            category: .compound, location: "市區公寓（停電）",
            openingLine: "強颱登陸後第三小時，你所在的市區全區停電。外面風雨交加，手機訊號時斷時續，冰箱食物開始有疑慮，你的家中還有一位年邁的祖父需要照顧……",
            systemPrompt: """
            你是防災訓練AI，引導「颱風造成長時間停電」複合演練。
            情境：颱風來襲導致全區停電超過3小時，家中有需要照顧的長輩。
            教學重點：停電時的照明替代（手電筒優先於蠟燭）、冰箱食物安全期判斷（冷藏4小時、冷凍24-48小時）、長輩醫療設備（氧氣機等）的緊急應對、通訊保留策略（簡訊耗電少於通話）、停電後電器突然通電的火災風險。
            特別強調：有依賴電力維生設備的長輩，應提前聯繫醫療機構或社區關懷系統。
            使用繁體中文，製造適度緊迫感但保持引導清晰。
            """),
    ]}

    // ─────────────────────────────────────────────────────────────
    // MARK: Emergency Quick Guides（緊急一鍵引導，不依賴 LLM）
    // ─────────────────────────────────────────────────────────────
    private static func buildEmergencyGuides() -> [EmergencyGuide] {[

        EmergencyGuide(
            category: .earthquake,
            headline: "地震發生了",
            steps: [
                EmergencyStep(order:1, text:"趴下、找掩護（桌下或內牆旁）、穩住不動"),
                EmergencyStep(order:2, text:"等搖晃完全停止再起身"),
                EmergencyStep(order:3, text:"關閉瓦斯、穿鞋、確認逃生路線"),
                EmergencyStep(order:4, text:"走安全梯疏散至戶外開放空間"),
                EmergencyStep(order:5, text:"撥打119，注意餘震"),
            ],
            callout:"搖晃時不要跑！趴下掩護穩住。"),

        EmergencyGuide(
            category: .fire,
            headline: "發現火災了",
            steps: [
                EmergencyStep(order:1, text:"觸摸房門：燙手就不要開門"),
                EmergencyStep(order:2, text:"大聲呼喊「失火了！」通知他人"),
                EmergencyStep(order:3, text:"低姿勢、用濕布掩口鼻、走安全梯"),
                EmergencyStep(order:4, text:"絕對不搭電梯"),
                EmergencyStep(order:5, text:"逃出後撥打119，不要回頭取物"),
            ],
            callout:"電梯絕對不能用！走安全梯。"),

        EmergencyGuide(
            category: .typhoon,
            headline: "洪水來了",
            steps: [
                EmergencyStep(order:1, text:"立即往高處移動，不要猶豫"),
                EmergencyStep(order:2, text:"絕對不要試圖穿越急流"),
                EmergencyStep(order:3, text:"若在車內水位上升，立即開窗逃出"),
                EmergencyStep(order:4, text:"無法疏散時移至建築物最高樓層"),
                EmergencyStep(order:5, text:"撥打119或1999，等待救援"),
            ],
            callout:"收到撤離通知要立刻走，不要等！"),

        EmergencyGuide(
            category: .manmade,
            headline: "遭遇暴力攻擊",
            steps: [
                EmergencyStep(order:1, text:"第一選擇：逃跑，拋棄所有物品"),
                EmergencyStep(order:2, text:"無法逃跑：躲進可上鎖的房間，鎖門堵門"),
                EmergencyStep(order:3, text:"關燈、安靜、手機靜音"),
                EmergencyStep(order:4, text:"用簡訊撥打110（說明位置與人數）"),
                EmergencyStep(order:5, text:"確認是警察後才開門"),
            ],
            callout:"逃跑優先！拋棄一切，往反方向跑。"),

        EmergencyGuide(
            category: .compound,
            headline: "複合災害發生",
            steps: [
                EmergencyStep(order:1, text:"先確認當前最緊迫的威脅是什麼"),
                EmergencyStep(order:2, text:"人身安全絕對優先於財物"),
                EmergencyStep(order:3, text:"打開電池收音機收聽政府廣播"),
                EmergencyStep(order:4, text:"與家人或鄰居確認彼此安全"),
                EmergencyStep(order:5, text:"等待官方指示，不要相信謠言"),
            ],
            callout:"複合災害優先保命，等待官方指示。"),
    ]}
}
