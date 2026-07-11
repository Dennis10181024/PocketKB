package com.pocketkb.android.core

object KnowledgeBase {
    val strictJudgeSystemPrompt: String = """
        你是一個嚴格的防災演練裁判，不是安慰型聊天助理。
        每次回覆第一行必須輸出隱藏標籤，格式完全如下：
        [安全評分:Low/Medium/High/Failed][進度:+0/+1][結果:CONTINUE/SUCCESS/FAILED/TIMEOUT]

        裁判規則：
        1. 使用者必須明確說出正確的關鍵行動，才可以給 [進度:+1]。
        2. 錯誤、模糊、只說「逃跑」「不知道」「等一下」都給 [進度:+0]，並要求重新決定。
        3. 致命錯誤必須直接 [安全評分:Failed][結果:FAILED]，例如火災搭電梯、地震衝去窗邊、豪雨進地下道。
        4. 回覆要短、緊迫、指出原因，不能幫使用者自動補完正確動作。
        5. 不要讓使用者亂回答也成功逃生。
    """.trimIndent()

    private val sourceNfaEarthquake = KnowledgeSource(
        agency = "內政部消防署",
        title = "錯誤的地震「黃金三角」或「生命三角」避難動作",
        url = "https://www.nfa.gov.tw/cht/index.php?article_id=3308&code=list&flag=detail&ids=26",
        note = "地震時以趴下、掩護、穩住為核心動作。",
    )

    private val sourceNfaAftershock = KnowledgeSource(
        agency = "內政部消防署",
        title = "Precautions for aftershocks",
        url = "https://www.nfa.gov.tw/eng/index.php?article_id=9007&code=list&flag=detail&ids=1371",
        note = "地震後餘震、瓦斯、電源、撤離動線與二次災害注意事項。",
    )

    private val sourceCwaRain = KnowledgeSource(
        agency = "交通部中央氣象署",
        title = "豪(大)雨特報",
        url = "https://www.cwa.gov.tw/V8/C/P/Warning/W26.html",
        note = "大雨、豪雨、大豪雨、超大豪雨定義與積淹水、土石流、溪水暴漲風險。",
    )

    private val sourceNfaTyphoon = KnowledgeSource(
        agency = "內政部消防署",
        title = "颱風來時應注意事項",
        url = "https://www.nfa.gov.tw/cht/index.php?codeID=26&ids=281",
        note = "颱風期間注意警戒、避開危險區域與配合撤離。",
    )

    private val sourceFireEscape = KnowledgeSource(
        agency = "內政部消防署消防防災館",
        title = "火災逃生避難原則",
        url = "https://www.tfdp.com.tw/cht/index.php?article_id=152&code=list&flag=detail&ids=55",
        note = "不可收拾財物、不可搭電梯、不可躲浴室、不可穿越濃煙。",
    )

    private val sourceTaipeiFireEscape = KnowledgeSource(
        agency = "臺北市政府消防局",
        title = "火災發生時之逃生狀況及方法",
        url = "https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16",
        note = "逃生避難、室內待救、無法期待獲救三種狀況。",
    )

    private val sourceExtinguisher = KnowledgeSource(
        agency = "桃園防災教育館",
        title = "滅火器如何使用？「拉瞄壓掃」4步驟",
        url = "https://tydec.tyfd.gov.tw/Subject/Info/ch35",
        note = "乾粉滅火器拉、瞄、壓、掃操作。",
    )

    private val sourceCookingFire = KnowledgeSource(
        agency = "內政部消防署消防防災館",
        title = "常見的滅火迷思：油鍋起火快澆水滅火？",
        url = "https://www.tfdp.com.tw/cht/index.php?article_id=1005&code=list&flag=detail&ids=49",
        note = "油鍋起火不可澆水，應蓋鍋蓋並關閉爐火。",
    )

    private val sourceGasLeak = KnowledgeSource(
        agency = "內政部消防署消防防災館",
        title = "防範液化石油氣外洩及其處置方式",
        url = "https://www.tfdp.com.tw/cht/index.php?article_id=208&code=list&flag=detail&ids=67",
        note = "瓦斯外洩緊急處置要領：禁、關、推、離。",
    )

    private val sourceCrowd = KnowledgeSource(
        agency = "雲林縣政府",
        title = "機關安全維護宣導：身處擁擠場所如何自保？",
        url = "https://dl.yunlin.gov.tw/News_Content.aspx?n=11319&s=399484",
        note = "擁擠人潮中保持站立、控制呼吸、手環抱胸、順應人潮。",
    )

    private val sourcePolice110 = KnowledgeSource(
        agency = "內政部警政署",
        title = "110 Emergency Hotline",
        url = "https://www.npa.gov.tw/en/app/artwebsite/view?id=8033&module=artwebsite&serno=f74b8ff8-cfbd-4394-bc1c-82f95f8baca3",
        note = "發現影響公共安全的可疑事件可撥打 110。",
    )

    private val sourceCpr = KnowledgeSource(
        agency = "臺南市政府消防局",
        title = "民眾版心肺復甦術 (CPR) 操作步驟",
        url = "https://119.tainan.gov.tw/News_Content.aspx?n=25539&s=7694725&sms=21247",
        note = "確認安全、叫叫壓電、CPR 與 AED 操作重點。",
    )

    private val sourcePfa = KnowledgeSource(
        agency = "World Health Organization",
        title = "Psychological first aid: Guide for field workers",
        url = "https://www.who.int/publications/i/item/9789241548205",
        note = "心理急救以人道、支持、實際協助為核心，包含 Look, Listen and Link。",
    )

    private val sourceBousaishiBasic = KnowledgeSource(
        agency = "臺灣防災士教育訓練",
        title = "臺灣防災士教育訓練基本教材（1130927 更新）",
        url = "本機教材：臺灣防災士教育訓練基本教材_1130927更新.pdf",
        note = "使用者提供之防災士官方教材；內容依章節摘要整理，非全文轉載。",
    )

    private val sourceBousaishiSlides = KnowledgeSource(
        agency = "臺灣防災士教育訓練",
        title = "防災士課程簡報範本（112 年 12 月最新版）",
        url = "本機教材：防災士課程簡報範本(112年12月最新版).rar",
        note = "使用者提供之防災士官方課程簡報；用於補強課程架構與實作重點。",
    )

    val chunks: List<KnowledgeChunk> = listOf(
        KnowledgeChunk(
            id = "eq_001",
            title = "地震當下 DCH",
            content = "地震強烈搖晃時以 Drop, Cover, Hold On：趴下、掩護、穩住為第一反應。保護頭頸，躲到堅固桌下或牆角，避開窗戶、吊燈、櫃子與可能掉落物；不要相信黃金三角，也不要急著衝出教室或樓梯間。",
            category = DisasterCategory.EARTHQUAKE,
            tags = listOf("趴下", "掩護", "穩住", "桌下", "窗戶"),
            source = sourceNfaEarthquake,
        ),
        KnowledgeChunk(
            id = "eq_002",
            title = "地震後撤離",
            content = "搖晃停止後先確認自身傷勢與出口安全，再檢查瓦斯、電源與水閥。若聞到瓦斯味，輕開窗、不要開關電器並撤離。撤離時走樓梯，不搭電梯，遠離玻璃、磁磚、招牌、受損建築與邊坡，並持續注意餘震。",
            category = DisasterCategory.EARTHQUAKE,
            tags = listOf("餘震", "撤離", "不要搭電梯", "關火"),
            source = sourceNfaAftershock,
        ),
        KnowledgeChunk(
            id = "eq_003",
            title = "受困求救",
            content = "若受困，節省體力，使用哨子、敲擊管線或傳訊息求救。避免大量喊叫造成缺氧，並保護口鼻避免粉塵吸入。",
            category = DisasterCategory.EARTHQUAKE,
            tags = listOf("受困", "求救", "粉塵", "哨子"),
            source = sourceNfaAftershock,
        ),
        KnowledgeChunk(
            id = "ty_001",
            title = "颱風前準備",
            content = "颱風前固定門窗與陽台物品，準備飲水、食物、手電筒、行動電源與常備藥。確認避難路線與警戒資訊。",
            category = DisasterCategory.TYPHOON,
            tags = listOf("門窗", "物資", "避難", "警戒"),
            source = sourceNfaTyphoon,
        ),
        KnowledgeChunk(
            id = "ty_002",
            title = "豪雨積淹水避險",
            content = "中央氣象署定義大雨為 24 小時 80 毫米以上或 1 小時 40 毫米以上；豪雨為 24 小時 200 毫米以上或 3 小時 100 毫米以上。強降雨可能造成積淹水、溪水暴漲、山崩落石與土石流；不要進入地下道、溪床、河堤、邊坡或水深不明道路。",
            category = DisasterCategory.TYPHOON,
            tags = listOf("地下道", "涉水", "邊坡", "淹水"),
            source = sourceCwaRain,
        ),
        KnowledgeChunk(
            id = "ty_003",
            title = "土石流與撤離",
            content = "豪雨期間山區坍方、落石與土石流風險會升高，低窪地區要慎防積淹水。若收到土石流、淹水或撤離警戒，要提早往高處或官方避難所移動，不要等到夜間雨勢變大才撤離。",
            category = DisasterCategory.TYPHOON,
            tags = listOf("土石流", "高處", "避難所", "撤離"),
            source = sourceCwaRain,
        ),
        KnowledgeChunk(
            id = "fi_001",
            title = "滅火器 PASS",
            content = "初期小火可用滅火器 PASS：拉開安全插銷、瞄準火源底部、壓握把、左右掃射。若火勢變大或有濃煙，先逃生再報案。",
            category = DisasterCategory.FIRE,
            tags = listOf("PASS", "滅火器", "火源底部", "逃生"),
            source = sourceExtinguisher,
        ),
        KnowledgeChunk(
            id = "fi_002",
            title = "濃煙逃生",
            content = "火災時以保命為第一目標，不收拾財物、不搭電梯、不躲浴室，也不要浪費時間找濕毛巾。若逃生路線無濃煙，立刻往下往外逃；若門把燙手或開門看見濃煙，立即關門阻煙、塞門縫，往反方向找第二出口，無法逃生時靠窗打 119 等待救援。",
            category = DisasterCategory.FIRE,
            tags = listOf("低姿勢", "摸門把", "關門阻煙", "不搭電梯", "119"),
            source = sourceTaipeiFireEscape,
        ),
        KnowledgeChunk(
            id = "fi_003",
            title = "廚房油鍋起火",
            content = "油鍋起火不可潑水。先關火，蓋上鍋蓋或使用滅火毯隔絕氧氣；若火勢擴大，立即離開並關門。",
            category = DisasterCategory.FIRE,
            tags = listOf("油鍋", "不可潑水", "關火", "鍋蓋", "滅火毯"),
            source = sourceCookingFire,
        ),
        KnowledgeChunk(
            id = "ma_001",
            title = "人潮推擠",
            content = "人潮壓迫時保持手臂在胸前形成呼吸空間，順著人流斜向離開，不逆向硬擠。跌倒時蜷縮護頭並盡快起身。",
            category = DisasterCategory.MANMADE,
            tags = listOf("人潮", "胸前", "呼吸空間", "斜向離開"),
            source = sourceCrowd,
        ),
        KnowledgeChunk(
            id = "ma_002",
            title = "可疑物品",
            content = "發現可疑包裹或異常物品，不觸碰、不移動、不拍近距離照片，保持距離並通知現場人員或 110。",
            category = DisasterCategory.MANMADE,
            tags = listOf("可疑物", "不觸碰", "距離", "110"),
            source = sourcePolice110,
        ),
        KnowledgeChunk(
            id = "co_001",
            title = "地震後火災",
            content = "地震後若聞到瓦斯味，使用「禁、關、推、離」：禁止開關任何電器或火源、關閉瓦斯總開關或瓦斯桶開關閥、輕推窗戶通風、離開現場到戶外並撥打 119。",
            category = DisasterCategory.COMPOUND,
            tags = listOf("瓦斯", "不開電器", "關閉瓦斯", "撤離"),
            source = sourceGasLeak,
        ),
        KnowledgeChunk(
            id = "co_002",
            title = "豪雨停電",
            content = "豪雨停電時使用手電筒，不使用明火照明。避免接觸泡水插座與電器，必要時切斷總電源並撤到高處。",
            category = DisasterCategory.COMPOUND,
            tags = listOf("停電", "手電筒", "泡水插座", "高處"),
            source = sourceCwaRain,
        ),
        KnowledgeChunk(
            id = "fa_001",
            title = "CPR 與 AED",
            content = "民眾版 CPR 口訣是「叫、叫、壓、電」。確認環境安全後叫喚拍肩並看胸部起伏；無反應且無正常呼吸時，請人打 119、拿 AED，立即胸外按壓。按壓速度每分鐘 100 到 120 下、深度約 5 到 6 公分，盡量不中斷。",
            category = DisasterCategory.FIRST_AID,
            tags = listOf("CPR", "AED", "119", "胸外按壓"),
            source = sourceCpr,
        ),
        KnowledgeChunk(
            id = "fa_002",
            title = "大量出血",
            content = "大量出血時直接加壓止血，抬高傷肢，使用乾淨紗布或布料。不要反覆掀開檢查，以免破壞凝血。",
            category = DisasterCategory.FIRST_AID,
            tags = listOf("出血", "加壓", "止血", "紗布"),
            source = sourceCpr,
        ),
        KnowledgeChunk(
            id = "pfa_001",
            title = "心理急救 PFA",
            content = "心理急救不是心理治療，而是在危機後提供人道、支持與實際協助。依 Look, Listen and Link：先看現場安全與急迫需求，再傾聽需求、協助穩定情緒，最後連結家人、服務、資訊與實際資源；不要逼迫對方詳細回憶創傷。",
            category = DisasterCategory.FIRST_AID,
            tags = listOf("心理急救", "安全", "傾聽", "資源"),
            source = sourcePfa,
        ),
        KnowledgeChunk(
            id = "bs_001",
            title = "防災士理念：自助、互助、協作",
            content = "防災士的貢獻重點在自助與互助。第一原則是先保護自身性命；平時透過訓練、知識更新與家庭整備，讓自己成為能幫助他人的人。災害規模越大，政府越難即時抵達，親友、鄰里、學校、企業與社區組織的互助就越重要。",
            category = DisasterCategory.PREPAREDNESS,
            tags = listOf("防災士", "自助", "互助", "協作", "社區"),
            source = sourceBousaishiBasic,
        ),
        KnowledgeChunk(
            id = "bs_002",
            title = "防災士任務：資訊與人際網絡",
            content = "防災士不是被動等待指令的人，而是政府與民眾之間的橋樑。平時要主動蒐集防災資訊、提升知識與行動力，從自家做起並協助社區防災；災時則協助正確資訊傳達、資源連結、疏散與收容安置。",
            category = DisasterCategory.PREPAREDNESS,
            tags = listOf("防災士", "資訊", "網絡", "疏散", "收容"),
            source = sourceBousaishiBasic,
        ),
        KnowledgeChunk(
            id = "bs_003",
            title = "災害管理四階段",
            content = "災害防救工作可分為減災、整備、應變、復原重建四階段。減災重在掌握災害潛勢與降低風險；整備重在通訊、物資、避難收容與演練；應變重在保命、通報、疏散與資源調度；復原重建重在協助居民回復生活並把經驗轉回下一輪減災。",
            category = DisasterCategory.PREPAREDNESS,
            tags = listOf("減災", "整備", "應變", "復原", "災害管理"),
            source = sourceBousaishiBasic,
        ),
        KnowledgeChunk(
            id = "bs_004",
            title = "官方資訊與謠言辨識",
            content = "災害後常出現未經證實的預言、災情流言與二次災害謠言，會造成恐慌與錯誤行動。有疑慮時應查中央氣象署、內政部消防署、土石流及大規模崩塌防災資訊網、地方政府或派出所、公所等官方管道；不要轉傳未證實訊息，也不要佔用救災優先通信線路。",
            category = DisasterCategory.PREPAREDNESS,
            tags = listOf("官方資訊", "謠言", "氣象署", "消防署", "查證"),
            source = sourceBousaishiBasic,
        ),
        KnowledgeChunk(
            id = "bs_005",
            title = "居家防震整備",
            content = "平時要減少生活空間雜物，確保房門、走廊與避難路線暢通；大型家具應固定，重物不要放在高處，床邊避免放置可能翻倒的大型家具，窗戶可貼防爆膜並在床邊備妥容易穿上的便鞋，以降低玻璃與掉落物傷害。",
            category = DisasterCategory.PREPAREDNESS,
            tags = listOf("家具固定", "逃生路線", "寢室安全", "防爆膜", "便鞋"),
            source = sourceBousaishiBasic,
        ),
        KnowledgeChunk(
            id = "bs_006",
            title = "防災包與滾動儲備",
            content = "防災物資與緊急避難包要用平時消耗、用完補足的方式滾動更新。可先準備至少 3 日份糧食與飲水，再依家庭狀況增加常備藥、急救用品、雨衣、照明、行動電源、衛生用品、嬰幼兒或長者用品與寵物用品；防災包應放在容易取得且能背著走的位置，至少每半年檢查一次。",
            category = DisasterCategory.PREPAREDNESS,
            tags = listOf("防災包", "緊急避難包", "飲水", "常備藥", "滾動儲備"),
            source = sourceBousaishiBasic,
        ),
        KnowledgeChunk(
            id = "bs_007",
            title = "社區防災與 DIG 圖上訓練",
            content = "社區防災要先了解環境特性、居民屬性與災害類型，再透過踏查找出易致災點與資源點，討論對策、建立組織、研擬計畫、訓練演習並持續評估。DIG 圖上訓練強調在地圖上標示危險場所、防災資源、弱勢民眾、地下道、邊坡、土石流潛勢溪流與避難收容處所，訓練資訊處理與決策能力。",
            category = DisasterCategory.PREPAREDNESS,
            tags = listOf("社區防災", "DIG", "防災地圖", "踏查", "演練"),
            source = sourceBousaishiSlides,
        ),
        KnowledgeChunk(
            id = "bs_008",
            title = "避難收容場所運作",
            content = "避難收容場所不是短暫躲避點，而是災民在特定期間生活的場所。運作應以避難者自治為主，設置避難者管理、資訊、物資等小隊，協助物資收發、資訊發布、垃圾與衛生管理、意見彙整。空間配置要考量家庭、弱勢族群、孕婦、嬰幼兒、長者、隱私與醫務需求，並在平時完成計畫與入住訓練。",
            category = DisasterCategory.PREPAREDNESS,
            tags = listOf("避難收容", "自治組織", "物資", "弱勢族群", "衛生"),
            source = sourceBousaishiBasic,
        ),
    )

    val scenarios: List<DrillScenario> = listOf(
        DrillScenario(
            id = "drill_eq_classroom",
            title = "教室強震",
            category = DisasterCategory.EARTHQUAKE,
            location = "大學教室三樓",
            openingLine = "地板突然劇烈搖晃，投影機和日光燈開始晃動，窗邊玻璃發出聲響。你只有 30 秒決定第一步。",
            decisionRules = ScenarioDecisionRules(
                successKeywords = listOf("趴下", "掩護", "桌下", "穩住", "保護頭", "遠離窗"),
                riskyKeywords = listOf("跑出去", "衝出去", "樓梯", "拍照", "站著"),
                fatalKeywords = listOf("跳窗", "搭電梯", "靠窗", "衝到窗邊"),
                requiredConcepts = listOf("趴下", "掩護", "穩住"),
                successSummary = "你先降低重心並找到掩護，避開窗戶與掉落物，第一波搖晃中保住了行動能力。",
            ),
            systemPrompt = strictJudgeSystemPrompt,
        ),
        DrillScenario(
            id = "drill_fire_dorm",
            title = "宿舍走廊濃煙",
            category = DisasterCategory.FIRE,
            location = "宿舍五樓",
            openingLine = "你聞到焦味，打開房門縫看到走廊有濃煙，警報器正在響。你要怎麼做？",
            decisionRules = ScenarioDecisionRules(
                successKeywords = listOf("摸門把", "低姿勢", "關門", "阻煙", "119", "避難", "不搭電梯"),
                riskyKeywords = listOf("收拾", "拿行李", "回房拿", "拍影片", "大喊", "趴下", "掩護", "穩住", "桌下", "DCH"),
                fatalKeywords = listOf("搭電梯", "衝進煙", "打開熱門", "躲衣櫃"),
                requiredConcepts = listOf("確認門把", "低姿勢", "阻煙或求救"),
                successSummary = "你先判斷門外熱煙與逃生路徑，低姿勢避煙並保留求救能力，沒有被濃煙困住。",
            ),
            systemPrompt = strictJudgeSystemPrompt,
            steps = listOf(
                ScenarioStep(
                    id = "fire_check_door",
                    title = "確認門外風險",
                    situation = "房門外已有濃煙，你必須先判斷門外是否能安全通過。",
                    successKeywords = listOf("摸門把", "門把", "燙", "熱", "門縫", "濃煙", "確認"),
                    riskyKeywords = listOf("直接開門", "開門看看", "衝出去", "跑出去", "收拾", "拿行李"),
                    fatalKeywords = listOf("搭電梯", "衝進煙", "穿越濃煙", "躲衣櫃", "躲浴室"),
                    requiredConcepts = listOf("先摸門把或確認門縫濃煙", "不直接開門衝出", "判斷逃生路線"),
                    successFeedback = "你先確認門外熱煙狀況，沒有直接把門打開暴露在濃煙中。",
                    missingHint = "先確認門把溫度與門縫濃煙，再決定逃生或待救。",
                    standardAction = "用手背摸門把並觀察門縫；若門把燙或濃煙明顯，不要開門。",
                ),
                ScenarioStep(
                    id = "fire_block_smoke",
                    title = "阻煙與求救",
                    situation = "門外濃煙阻斷逃生路線，你需要把煙擋在門外並讓外界知道位置。",
                    successKeywords = listOf("關門", "塞門縫", "阻煙", "毛巾", "衣物", "窗邊", "119", "求救", "位置"),
                    riskyKeywords = listOf("等一下", "睡覺", "躲起來", "大喊", "找濕毛巾"),
                    fatalKeywords = listOf("開門衝", "搭電梯", "跳窗", "躲浴室", "穿越濃煙"),
                    requiredConcepts = listOf("關門阻煙", "塞住門縫", "到窗邊或安全處求救", "撥 119 說明位置"),
                    successFeedback = "你把門關上並阻煙，保留空氣和等待救援的時間。",
                    missingHint = "濃煙阻斷時要關門、塞門縫，並向 119 或窗外清楚求救。",
                    standardAction = "關門、用衣物塞門縫，移到窗邊或可通訊處撥 119，說明樓層與房號。",
                ),
                ScenarioStep(
                    id = "fire_stay_rescuable",
                    title = "等待救援時保持可救援",
                    situation = "你已完成阻煙和求救，接下來要維持呼吸安全並避免讓救援失去定位。",
                    successKeywords = listOf("低姿勢", "窗邊", "揮衣物", "保持通訊", "等待救援", "不要返回", "不開門"),
                    riskyKeywords = listOf("回去拿", "再開門", "拍影片", "亂跑", "一直大喊"),
                    fatalKeywords = listOf("跳窗", "搭電梯", "衝進煙", "穿越濃煙"),
                    requiredConcepts = listOf("低姿勢避煙", "保持可被看見或可通訊", "等待消防救援", "不再進入濃煙"),
                    successFeedback = "你維持在可被救援的位置，沒有再次進入濃煙或做出跳窗等致命行動。",
                    missingHint = "等待救援時要低姿勢、保持通訊與定位，不要再開門進入濃煙。",
                    standardAction = "保持低姿勢，在窗邊以衣物或燈光示意，維持通訊並等待救援。",
                ),
            ),
        ),
        DrillScenario(
            id = "drill_typhoon_underpass",
            title = "暴雨地下道",
            category = DisasterCategory.TYPHOON,
            location = "校外地下道入口",
            openingLine = "豪雨已經連下兩小時，地下道入口積水快速上升，但對面就是公車站。你會怎麼做？",
            decisionRules = ScenarioDecisionRules(
                successKeywords = listOf("不進地下道", "繞路", "高處", "通報", "等雨小", "避難"),
                riskyKeywords = listOf("涉水", "騎過去", "快跑過去", "試試看"),
                fatalKeywords = listOf("進地下道", "游過去", "騎車衝", "下去看看"),
                requiredConcepts = listOf("避開地下道", "移往高處", "通報或改道"),
                successSummary = "你放棄穿越積水區，改走高處並通報危險點，避免被暴漲水流困住。",
            ),
            systemPrompt = strictJudgeSystemPrompt,
            steps = listOf(
                ScenarioStep(
                    id = "underpass_stop",
                    title = "停止進入積水區",
                    situation = "地下道入口水位快速上升，水深與流速都無法判斷。",
                    successKeywords = listOf("不進", "不要進", "停下", "不下去", "不涉水", "不穿越", "避開"),
                    riskyKeywords = listOf("試試看", "快跑", "涉水", "騎過去", "走過去"),
                    fatalKeywords = listOf("進地下道", "下去看看", "游過去", "騎車衝", "開車衝"),
                    requiredConcepts = listOf("停止進入地下道", "不涉水", "承認水深不明"),
                    successFeedback = "你沒有進入水深不明的地下道，先避開最直接的致命風險。",
                    missingHint = "第一步是停止進入積水區，不要用走、騎車或開車試探。",
                    standardAction = "停在安全處，不進入地下道或任何水深不明道路。",
                ),
                ScenarioStep(
                    id = "underpass_reroute",
                    title = "改走高處路線",
                    situation = "你已避開地下道，但還需要離開低窪積水區，避免水位繼續上升。",
                    successKeywords = listOf("繞路", "改道", "高處", "往高", "避難", "離開低窪", "等雨小"),
                    riskyKeywords = listOf("原地等", "站入口", "靠近水邊", "拍照", "看一下"),
                    fatalKeywords = listOf("下去", "進地下道", "涉水", "游過去", "騎車衝"),
                    requiredConcepts = listOf("改道", "往高處移動", "遠離入口與低窪處"),
                    successFeedback = "你改走高處並離開低窪入口，避免後續暴漲時被困住。",
                    missingHint = "避開地下道後，要往高處或安全路線移動，不要停在入口旁。",
                    standardAction = "改走高處路線或到安全建物等待，遠離地下道入口與低窪道路。",
                ),
                ScenarioStep(
                    id = "underpass_report",
                    title = "通報與提醒他人",
                    situation = "地下道仍有人想靠近，你需要降低其他人的風險並通知權責單位。",
                    successKeywords = listOf("通報", "提醒", "阻止", "通知", "119", "1999", "警察", "學校", "管理員"),
                    riskyKeywords = listOf("不管", "只離開", "拍影片", "上傳", "圍觀"),
                    fatalKeywords = listOf("帶人下去", "叫人衝", "進地下道", "涉水"),
                    requiredConcepts = listOf("提醒他人不要進入", "通報危險地點", "等待專責單位處理"),
                    successFeedback = "你不只保護自己，也通報危險點並提醒他人避開。",
                    missingHint = "最後要提醒旁人並通報危險地點，避免其他人進入。",
                    standardAction = "提醒他人遠離地下道，通報校安、1999、警察或消防單位。",
                ),
            ),
        ),
        DrillScenario(
            id = "drill_kitchen_oil",
            title = "廚房油鍋起火",
            category = DisasterCategory.FIRE,
            location = "租屋處廚房",
            openingLine = "油鍋突然起火，火焰約半公尺高，旁邊有水槽、鍋蓋和滅火器。你第一步做什麼？",
            decisionRules = ScenarioDecisionRules(
                successKeywords = listOf("關火", "鍋蓋", "滅火毯", "滅火器", "隔絕氧氣", "離開"),
                riskyKeywords = listOf("用水", "端出去", "吹熄", "拿布亂揮", "趴下", "掩護", "穩住", "桌下", "DCH"),
                fatalKeywords = listOf("潑水", "倒水", "端鍋", "拿油"),
                requiredConcepts = listOf("關火", "隔絕氧氣", "判斷撤離"),
                successSummary = "你沒有潑水，先切斷熱源並隔絕氧氣，火勢沒有爆燃擴大。",
            ),
            systemPrompt = strictJudgeSystemPrompt,
        ),
        DrillScenario(
            id = "drill_crowd_station",
            title = "捷運站人潮推擠",
            category = DisasterCategory.MANMADE,
            location = "大型活動散場捷運站",
            openingLine = "人潮突然往前擠，你胸口被壓住，身邊有人跌倒。你怎麼保護自己並離開？",
            decisionRules = ScenarioDecisionRules(
                successKeywords = listOf("胸前", "呼吸空間", "順人流", "斜向", "不逆行", "護頭"),
                riskyKeywords = listOf("逆向", "硬擠", "蹲下", "停下拍照"),
                fatalKeywords = listOf("逆著衝", "趴下", "坐下", "撿東西"),
                requiredConcepts = listOf("保護呼吸", "順流", "斜向離開"),
                successSummary = "你保住胸前空間並順著人流斜向移動，降低跌倒和窒息風險。",
            ),
            systemPrompt = strictJudgeSystemPrompt,
        ),
        DrillScenario(
            id = "drill_compound_gas",
            title = "地震後瓦斯味",
            category = DisasterCategory.COMPOUND,
            location = "實驗室走廊",
            openingLine = "地震剛停，你聞到瓦斯味，走廊燈忽明忽暗，同學想開燈查看。你會怎麼做？",
            decisionRules = ScenarioDecisionRules(
                successKeywords = listOf("不要開燈", "不開電器", "關瓦斯", "開窗", "撤離", "通知"),
                riskyKeywords = listOf("開燈", "打火機", "插電", "回去拿"),
                fatalKeywords = listOf("點火", "開關電器", "開燈", "抽菸"),
                requiredConcepts = listOf("不產生火花", "通風", "撤離通報"),
                successSummary = "你阻止開關電器，先避免火花並撤離通報，降低爆燃風險。",
            ),
            systemPrompt = strictJudgeSystemPrompt,
        ),
    )

    val emergencyGuides: List<EmergencyGuide> = listOf(
        EmergencyGuide(
            category = DisasterCategory.EARTHQUAKE,
            headline = "地震當下",
            callout = "先保護自己，不要急著衝出去。",
            steps = listOf(
                EmergencyStep(1, "趴下、掩護、穩住。"),
                EmergencyStep(2, "遠離窗戶、櫃子與吊掛物。"),
                EmergencyStep(3, "搖晃停止後再檢查傷勢並撤離。"),
            ),
            source = sourceNfaEarthquake,
        ),
        EmergencyGuide(
            category = DisasterCategory.FIRE,
            headline = "火災濃煙",
            callout = "煙比火更快致命。",
            steps = listOf(
                EmergencyStep(1, "摸門把確認熱度。"),
                EmergencyStep(2, "不穿越濃煙，受阻就關門阻煙。"),
                EmergencyStep(3, "不要搭電梯，安全後撥 119。"),
            ),
            source = sourceFireEscape,
        ),
        EmergencyGuide(
            category = DisasterCategory.TYPHOON,
            headline = "豪雨淹水",
            callout = "水深不明就不要通過。",
            steps = listOf(
                EmergencyStep(1, "遠離地下道、河道、邊坡。"),
                EmergencyStep(2, "移往高處或官方避難所。"),
                EmergencyStep(3, "通報危險路段並等待救援。"),
            ),
            source = sourceCwaRain,
        ),
        EmergencyGuide(
            category = DisasterCategory.PREPAREDNESS,
            headline = "防災士整備",
            callout = "平時準備，災時才有選擇。",
            steps = listOf(
                EmergencyStep(1, "確認家庭防災卡、避難路線與集合點。"),
                EmergencyStep(2, "固定家具，檢查防災包與 3 日份物資。"),
                EmergencyStep(3, "只依官方資訊行動，不轉傳未證實災害訊息。"),
            ),
            source = sourceBousaishiBasic,
        ),
        EmergencyGuide(
            category = DisasterCategory.FIRST_AID,
            headline = "CPR/AED",
            callout = "確認環境安全再急救。",
            steps = listOf(
                EmergencyStep(1, "叫喚拍肩確認反應。"),
                EmergencyStep(2, "請人打 119 並拿 AED。"),
                EmergencyStep(3, "開始胸外按壓，每分鐘 100 到 120 下。"),
            ),
            source = sourceCpr,
        ),
    )
}

