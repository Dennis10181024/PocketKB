# PocketKB 情境演練教育設計與研究評估依據

更新日期：2026-10-29
用途：供 PocketKB 線上情境演練的教育設計、研究方法與下週指導教授討論。
邊界：本文件整理的是教育與研究設計依據，不表示 App 已完成，也不證明數位演練可取代實體演練。

## 一、先說結論

PocketKB 不應被設計成「AI 講一段災害故事，使用者答對關鍵字就過關」，而應形成以下學習循環：

```text
清楚目標與安全說明
→ 觀察情境
→ 做出決策
→ 看見可解釋的後果
→ 收到針對行為的回饋
→ 回顧理由與官方依據
→ 立即重練或在新情境遷移
```

最重要的六項決策是：

1. **學習模式預設不倒數；挑戰模式在先完成學習模式後才開放。**
2. **一次只練少數明確能力，允許暫停、詢問、提示與重試。**
3. **回饋針對可觀察行動與因果，不用人格化評語或羞辱式扣分。**
4. **每次演練必須有結構化回顧與可執行的下一步。**
5. **主要研究結果量測未見過情境中的安全行為，不只量知識、自信或完成時間。**
6. **LLM負責理解和敘事；狀態、正確行動、危險判定與評分由可驗證規則控制。**

以上是綜合官方指引與原始研究後，對 PocketKB 的**設計推論**。各項證據與限制如下。

## 二、證據怎麼解讀

### 2.1 模擬有價值，但不會自動產生學習

**證據：** WHO把模擬演習定位為練習角色、測試程序、找出能力與資源缺口的工具，而不是單純呈現逼真畫面。[WHO Simulation Exercise Manual](https://www.who.int/publications/i/item/WHO-WHE-CPI-2017.10)、[WHO Simulation Exercises](https://www.who.int/emergencies/operations/simulation-exercises)

一項災害整備課程隨機試驗將護理學員分成講授、案例學習與模擬演練；短期知識結果中，案例學習優於模擬，模擬並未顯示相對控制組的顯著知識提升。這表示「有演練」不等於「一定學得比較好」。[Aluisio et al., 2016 RCT](https://pubmed.ncbi.nlm.nih.gov/27491847/)

另有災害教育研究發現線上與實體桌上模擬後，知識與信心皆提高，但兩種傳遞方式沒有顯著優劣；它支持線上訓練可作補充，不能單憑此研究宣稱取代實體訓練。[線上與實體模擬比較研究](https://pubmed.ncbi.nlm.nih.gov/39026156/)

2026年的三組隨機研究則顯示，多階段災害鏈情境相較單一情境及講授，在部分災害應變自我效能與理論成績上較佳；但研究對象為護理學生，且並非一般民眾手機 App。[Gou et al., 2026 三組 RCT](https://www.sciencedirect.com/science/article/pii/S0260691726000377)

**PocketKB 設計推論：**

- 不用「沉浸感」「AI」或「動畫」作為教育效果的代理指標。
- 每個劇本先寫學習目標、可觀察行為和錯誤模式，再寫故事。
- 官方知識卡與簡短案例仍應保留，並與情境演練互補。
- 研究中比較的是完整介入方案，而不是預設「情境模擬一定勝過閱讀教材」。

### 2.2 體驗式／情境式學習需要完整閉環

**證據：** WHO說明，模擬演習應讓參與者在假設緊急事件中執行回應，並用來檢驗計畫、程序、角色與能力；演習結束後還需要回顧和改進。[WHO Simulation Exercises](https://www.who.int/emergencies/operations/simulation-exercises)

WHO的After Action Review要求系統性檢視：事前有哪些準備、實際發生什麼、哪些做得好或不足、原因為何，以及如何改善。[WHO After Action Review](https://www.who.int/emergencies/operations/emergency-response-reviews/after-action-review)

**PocketKB 設計推論：** 一個有效回合至少包含「情境線索—使用者決策—環境後果—理由回饋」。只顯示下一段文字或加減分，尚未構成可反思的情境學習。

每個完整劇本應定義：

- 2～4個本次明確學習目標。
- 使用者可觀察與尚未知的資訊。
- 安全、次佳、危險與無法判定的行動。
- 每個行動造成的狀態改變與原因。
- 何時提示、何時要求釐清、何時允許修正。
- 演練結束後的遷移題或重練分支。

### 2.3 刻意練習不是重玩同一關，而是針對弱點反覆修正

**證據：** Ericsson等人的原始研究與理論把刻意練習描述為專門為提升目前表現所設計、需要投入努力，並依據結果與教師回饋逐步改善的活動；它不同於工作、競賽或只是重複遊玩。[Ericsson, Krampe & Tesch-Römer, 1993](https://cir.nii.ac.jp/crid/1363670319559953152?lang=en)

**限制：** 原研究主要討論專業技能與專家表現，並未直接測試一般民眾的災害 App；把原則套用到 PocketKB 是**設計推論**，不能宣稱已被該研究直接驗證。

**PocketKB 設計推論：**

- 把大劇本拆成可重練的微技能，例如「先辨識濃煙路徑」「正確回報119位置」「地震後判斷是否有海嘯風險」。
- 錯誤後提供精確到行動層的回饋，再讓使用者重做同一決策或相似變體。
- 下一次演練應針對使用者上一輪漏掉的能力調整，而不是只隨機換背景。
- 重練時改變非關鍵表面條件，檢查使用者是否真正理解，而非記住答案位置。
- 不把「演練次數」單獨當成精熟；必須同時看表現、提示依賴和新情境遷移。

## 三、心理安全與情緒邊界

### 3.1 允許犯錯、提問與中止

**證據：** Edmondson對51個工作團隊的多方法研究發現，團隊心理安全與學習行為相關；心理安全指的是成員相信承擔人際風險是安全的。[Edmondson, 1999](https://dash.harvard.edu/entities/publication/13a7b031-0fdd-45ec-a7e0-2b80e2bc679f)

WHO的演習教材也要求參與者能安全地指出優點、缺口與改善機會；演習後的回顧可讓參與者從演習壓力中緩和。[WHO Off-the-shelf exercise handbook](https://iris.who.int/bitstream/handle/10665/344221/WHO-UHL-IHS-2021.01-eng.pdf)、[WHO Exercise JADE report](https://iris.who.int/bitstream/handle/10665/367969/WHO-EURO-2023-7327-47093-68880-eng.pdf?sequence=1)

**限制：** Edmondson研究不是手機災害模擬實驗。對 App 的做法屬於合理但仍待測試的推論。

**PocketKB 實作原則：**

- 開始前明確寫「這是學習演練，不是真實警報；錯誤是練習的一部分」。
- 先告知可能內容，例如火焰、傷者、暴力或災害音效；允許跳過特定類別。
- 隨時暫停、離開、靜音或降低動態效果，退出不記為失敗。
- 不用「你害死了室友」「你很自私」等羞辱或人格判斷。
- 改寫成「這個行動會增加煙霧暴露，原因是……；你可以重新選擇」。
- 不以突然尖銳聲、閃爍、逼真死亡畫面或無法關閉的震動製造壓力。
- 挑戰模式開始前再次確認，且可隨時切回學習模式。

### 3.2 教育回顧不等於心理治療式晤談

**證據：** WHO明確不建議對近期真實創傷暴露者使用單次「心理解說／心理晤談式 debriefing」來預防創傷後壓力、焦慮或憂鬱。[WHO mhGAP：Psychological debriefing](https://www.who.int/teams/mental-health-and-substance-use/treatment-care/mental-health-gap-action-programme/evidence-centre/other-significant-emotional-and-medical-unexplained-somatic-complaints/psychological-debriefing-in-people-exposed-to-a-recent-traumatic-event)

WHO心理急救指引也強調不要強迫當事人講述經歷、不要評判、不要提供虛假保證，資訊應誠實且容易理解。[WHO Psychological First Aid](https://www.who.int/publications/i/item/9789241548205)

**PocketKB 設計推論：**

- App的「演練回顧」只檢視模擬中的決策與學習，不要求使用者回想或描述自身真實創傷。
- 情緒問題只能選填，例如「這段是否讓你不舒服？」；不診斷PTSD、不宣稱治療。
- 若使用者表示強烈不適，停止情境、提供一般性休息和求助資訊，不繼續追問細節。

## 四、回饋與演練後回顧

### 4.1 回饋必須存在，而且要具體

**證據：** 一項42名麻醉住院醫師的隨機試驗比較無回顧、口頭回饋、錄影輔助口頭回饋。兩種有口頭回饋的組別在後測非技術能力皆進步，無回顧組沒有；錄影沒有顯示額外優勢。[Savoldelli et al. 隨機試驗](https://pubmed.ncbi.nlm.nih.gov/16871061/)

另一項50名醫學生的隨機試驗發現，情境結束後回顧與中途「停下—回饋—繼續」在四週後技能表現沒有顯著差異，支持依學習需要調整回饋時機，而非僵化規定只能結束後回饋。[Stop-and-go vs post-scenario RCT](https://pubmed.ncbi.nlm.nih.gov/31488113/)

**PocketKB 設計推論：**

- 危險且不可逆的概念錯誤，可在學習模式中立即攔截、簡短說明並讓使用者重選。
- 一般次佳決策可先呈現後果，留到階段末回顧，避免每一步都打斷沉浸。
- 不需第一版就做昂貴的錄影回放；清楚的行動時間軸已能支援有效回顧。

### 4.2 建議的 PocketKB 回顧結構

WHO的AAR重視「實際發生什麼、做得好與不足、原因、如何改善」；AHRQ官方模擬指引則將教育回顧整理為反應／描述、分析、應用／總結。[WHO AAR](https://www.who.int/emergencies/operations/emergency-response-reviews/after-action-review)、[AHRQ Debriefing for Clinical Learning](https://psnet.ahrq.gov/primer/debriefing-clinical-learning)

PocketKB可採用五段式回顧：

1. **離開情境**：明確顯示演練已結束，提供安靜畫面與跳過選項。
2. **還原行動**：用時間軸列出使用者實際觀察、詢問、行動、提示與環境變化。
3. **分析理由**：先列做對的決策，再列需要改善的決策；比較「當時資訊—你的行動—造成後果—官方依據」。
4. **形成規則**：濃縮成2～4個可記住、可轉移的行動原則。
5. **下一步**：選擇立即重做該分支、稍後複習或進入一個變化情境。

推薦回饋句型：

```text
當時你已知道：＿＿＿＿
你採取了：＿＿＿＿
因此環境變成：＿＿＿＿
較安全的原則是：＿＿＿＿
依據：＿＿＿＿官方資料
下一次遇到相似情況，你可以先：＿＿＿＿
```

## 五、學習模式與挑戰模式的時間設計

### 5.1 證據支持漸進增加壓力，而非新手一開始就倒數

**證據：** FEMA的演習設計建議採漸進方案，從簡單桌上推演與單項操演開始，再逐步增加複雜度。[FEMA：Progressive Exercise Program](https://emilms.fema.gov/is_0360/groups/400.html)

WHO把桌上演習描述為非正式、低壓的討論環境；全規模演習則用來測試更廣泛的實際能力。這支持依學習階段選擇壓力，而不是所有演練都採相同倒數。[WHO SimEx types](https://extranet.who.int/sph/simex)

一般決策實驗顯示，時間壓力在複雜線索環境中可能使認知控制變差；另一實驗發現限時者更焦慮，且會依任務結構改變資訊處理與風險選擇。[Rothstein, 1986](https://www.sciencedirect.com/science/article/pii/0749597886900452)、[Maule et al., 2000](https://pubmed.ncbi.nlm.nih.gov/10900697/)

**限制：** 上述時間壓力實驗不是災害 App；因此它支持保守設計與實驗驗證，不能直接決定某個劇本應給幾秒。

### 5.2 建議模式規格

| 項目 | 學習模式（預設） | 挑戰模式（解鎖後） |
|---|---|---|
| 目的 | 建立正確心智模型與安全行動 | 檢查在有限資訊與壓力下的遷移 |
| 倒數 | 預設無；真實時間變化可暫停 | 只在有官方或劇本理由的決策使用 |
| 提示 | 分層提示，隨時可用 | 可用但記錄提示依賴，或先延遲顯示 |
| 回饋 | 關鍵危險可立即攔截 | 通常階段結束後回饋，除非涉及內容安全 |
| 重試 | 可立即回到關鍵節點 | 一輪結束後重試，另存紀錄 |
| 完成條件 | 做出並理解核心安全決策 | 在新變體中達成預定行為標準 |
| 無障礙 | 可延長／取消時間，不影響內容取得 | 必須提供時間調整；不得排除需要輔助者 |

**不得把完成時間當作唯一分數。** 快速但危險的決策不能高分；安全性、順序與是否根據可用資訊應優先於速度。

## 六、可理解性、無障礙與風險溝通

### 6.1 官方依據

WCAG 2.2要求內容可感知、可操作、可理解且穩健，並包含鍵盤操作、焦點可見、可預測操作、非文字內容替代、時間調整等要求。[W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

CDC Clear Communication Index要求先界定主要受眾、溝通目的和主訊息，將主訊息及行動放在前面，使用受眾熟悉的字詞、短區塊、標題、清楚視覺，並說明已知與未知。[CDC Clear Communication Index](https://www.cdc.gov/ccindex/tool/how-to-use.html)

UNDRR的包容性早期預警指引要求預警與行動系統納入性別與身心障礙需求，並以人為中心、可依情境調整。[UNDRR Inclusive Early Warning and Early Action](https://www.undrr.org/publication/documents-and-publications/inclusive-early-warning-early-action-checklist-and-0)

### 6.2 PocketKB最低驗收要求

- 主要行動出現在第一個畫面，不先顯示長篇背景。
- 一個畫面只呈現一個主要問題；長內容分層展開。
- 使用一般民眾用語，例如「離開地下室」，不要只寫「執行垂直疏散」。
- 專有詞第一次出現時附白話解釋。
- 重要狀態不能只靠紅／綠色，也要有文字、圖示或形狀。
- 圖片和2D場景提供文字替代；警報音提供字幕／視覺提示。
- 全程可用螢幕閱讀器、鍵盤／Switch Access及足夠大的觸控目標。
- 支援系統字體放大；不因放大而遮住「離開」「求助」「下一步」。
- 動畫可暫停，支援減少動態，不使用可能引發不適的閃爍。
- 語音輸入不是唯一入口；所有語音內容也可用文字完成。
- 有時間限制時，可關閉、延長或改用無倒數版本。
- 錯誤訊息直接指出如何修正，不只顯示「錯誤」。
- 風險數字搭配文字與視覺解釋，未知狀況明確說「目前不知道」。

**建議內容流程：** 每個畫面先回答三件事：「發生什麼」「現在最重要的是什麼」「你可以做什麼」。

## 七、適合大專生研究計畫的評估設計

### 7.1 不建議只做單組前後測

如果所有人使用App後只比較知識前後分數，無法排除重複作答、研究者提醒或單純閱讀資料的效果。若資源許可，建議採平行兩組：

- **介入組**：官方短教材＋PocketKB情境演練＋結構化回顧。
- **對照組**：內容等量的官方短教材＋案例題，不使用互動模擬。
- **時間點**：前測、立即後測、1～2週延後測。
- **遷移測試**：使用沒有練過的地點或條件變體，不重複原劇本。

若樣本很小，研究定位應改成「可行性／使用性先導研究」，不要宣稱教育成效已被充分驗證。樣本數應依主要結果、預期效果與統計方法做事前檢定力分析，而不是先決定一個方便人數。

### 7.2 建議結果指標

| 層級 | 指標 | 量測方式 | 研究解讀 |
|---|---|---|---|
| 主要 | 未見情境的安全行為表現 | 事前定義、專家審查的行為檢核表；盲評操作紀錄 | 是否能把原則用到新情境 |
| 主要 | 嚴重危險行動率 | 每人是否做出預定高風險行動、修正需要幾次 | 是否降低關鍵錯誤 |
| 次要 | 知識 | 平行版本選擇題／情境判斷題 | 是否理解原則；不等同真實行為 |
| 次要 | 保留效果 | 1～2週後再測 | 是否只是短期記憶 |
| 次要 | 任務自我效能 | 針對本研究目標的簡短題項 | 主觀信心，必須與行為分開報告 |
| 次要 | 認知負荷 | NASA-TLX六面向或精簡、事先決定的版本 | 是否因介面或倒數造成過度負荷 |
| 次要 | 使用性 | SUS或任務成功率、錯誤率與訪談 | App是否容易使用，不代表教育有效 |
| 過程 | 提示、重試、釐清、離線降級 | 系統事件紀錄 | 解釋學習過程與技術問題 |
| 安全 | 不適、提前退出、內容跳過 | 非強迫式簡短問卷與事件紀錄 | 監測心理與可近用性風險 |

NASA-TLX由NASA研究發展，從心智需求、身體需求、時間需求、表現、努力與挫折等面向估計主觀工作負荷。[NASA TLX 官方頁面](https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/)、[Hart & Staveland 原始研究](https://humansystems.arc.nasa.gov/groups/tlx/downloads/Hart_Staveland_ORIGINAL_1.pdf)

災害應變自我效能量表DRSES有19題、三因子版本，曾在中國護理系大學生樣本做心理計量檢驗；但它針對護理專業應變，不適合直接當作一般大學生PocketKB研究的主要量表。[Li et al., 2017 DRSES](https://pubmed.ncbi.nlm.nih.gov/28917131/)

**PocketKB研究建議：** 自我效能只作次要結果，題項限定在一般民眾能執行的明確任務，例如「我有信心在宿舍火災受困時完整回報位置」。若自行改寫或翻譯量表，必須說是研究自編／改編工具，做專家內容效度與小規模認知訪談，不得直接宣稱沿用原量表效度。

### 7.3 行為評分範例

以「地震後沿海海嘯風險」為例，檢核表可事先定義：

- 搖晃時先採取保護行動。
- 搖晃停止後辨識自己位於沿海風險區。
- 不等待看到海浪才開始移動。
- 選擇往高處或內陸，而非沿河道前進。
- 未解除警報前不返回。

每項評為「自行完成／提示後完成／未完成／做出相反危險行動」，比單一總分更能解釋介入效果。評分規則應在收資料前固定，並抽取部分紀錄由第二位評分者盲評，以檢查一致性。

### 7.4 研究中必須分開報告的概念

- 情境內表現 ≠ 真實災害中的行為。
- 知識提升 ≠ 能正確行動。
- 自信提升 ≠ 能力提升。
- 完成更快 ≠ 更安全。
- 覺得好玩 ≠ 教育有效。
- 使用者接受度 ≠ 防災內容正確。
- LLM理解成功率 ≠ 整體演練有效。

## 八、建議的第一輪教育設計驗收

第一輪不必立刻完成所有災種，應先用三個差異大的情境驗證教育框架：

1. **宿舍火災**：室內、濃煙、通報、受困待救。
2. **學校地震**：集體掩護、疏散、餘震與點名。
3. **山區豪雨土石流**：警戒判讀、預防性撤離、路線受阻。

這不是最終只做三種，而是用三種不同決策結構確認：

- 同一套學習循環能否跨災種運作。
- 回顧是否真的對應行動和官方依據。
- 學習模式是否容易理解。
- 挑戰模式是否增加合理壓力而非只是讓人來不及讀。
- 未見變體是否能測到遷移。

通過後，再將既定的災種×地點矩陣批次擴充。

## 九、下週與教授討論的具體建議

### 建議先取得教授同意的六項決策

1. **研究定位**：是驗證「手機情境演練的可行性與初步學習效果」，還是宣稱取代傳統演練？建議採前者；目前證據不足以支持全面取代。
2. **比較條件**：介入組是否與等量官方教材／案例學習比較，而不是只做單組前後測？建議要有對照組。
3. **主要結果**：是否同意以未見情境的行為檢核表作主要結果，知識和自我效能作次要結果？建議同意。
4. **模式分工**：學習模式預設無倒數；挑戰模式完成基礎學習後解鎖。建議採用。
5. **回顧框架**：是否採「離開情境—行動還原—原因分析—形成規則—立即重練」？建議採用。
6. **研究邊界**：是否明確寫「線上模擬是日常補充，不能證明真實災害表現，也不取代實體演練」？建議寫入計畫修正版。

### 可直接對教授說的一分鐘版本

> 我們不會把情境演練只做成AI聊天或倒數答題，而是讓使用者觀察、決策、看見後果、接受有官方依據的回饋，再針對弱點重練。研究上不只測知識或自信，而以沒看過的變化情境中，能不能做出正確安全行動作主要結果。學習模式先不計時，完成後才進入有壓力的挑戰模式；演練回顧只討論模擬決策，不做心理治療式晤談。第一輪先用宿舍火災、學校地震和山區土石流驗證框架，再擴充所有災種與地點。

## 十、來源清單（僅列本文件實際採用的原始研究與官方資料）

### 官方資料

- [WHO Simulation Exercise Manual](https://www.who.int/publications/i/item/WHO-WHE-CPI-2017.10)
- [WHO Simulation Exercises](https://www.who.int/emergencies/operations/simulation-exercises)
- [WHO After Action Review](https://www.who.int/emergencies/operations/emergency-response-reviews/after-action-review)
- [WHO Psychological First Aid](https://www.who.int/publications/i/item/9789241548205)
- [WHO mhGAP recommendation on psychological debriefing](https://www.who.int/teams/mental-health-and-substance-use/treatment-care/mental-health-gap-action-programme/evidence-centre/other-significant-emotional-and-medical-unexplained-somatic-complaints/psychological-debriefing-in-people-exposed-to-a-recent-traumatic-event)
- [FEMA progressive exercise guidance](https://emilms.fema.gov/is_0360/groups/400.html)
- [AHRQ Debriefing for Clinical Learning](https://psnet.ahrq.gov/primer/debriefing-clinical-learning)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [CDC Clear Communication Index](https://www.cdc.gov/ccindex/tool/how-to-use.html)
- [UNDRR Inclusive Early Warning and Early Action](https://www.undrr.org/publication/documents-and-publications/inclusive-early-warning-early-action-checklist-and-0)
- [NASA Task Load Index](https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/)

### 原始研究

- [Aluisio et al. (2016), disaster preparedness CBL vs simulation RCT](https://pubmed.ncbi.nlm.nih.gov/27491847/)
- [Savoldelli et al., oral/video debriefing RCT](https://pubmed.ncbi.nlm.nih.gov/16871061/)
- [Post-scenario vs stop-and-go debriefing RCT](https://pubmed.ncbi.nlm.nih.gov/31488113/)
- [Edmondson (1999), psychological safety field study](https://dash.harvard.edu/entities/publication/13a7b031-0fdd-45ec-a7e0-2b80e2bc679f)
- [Ericsson, Krampe & Tesch-Römer (1993), deliberate practice](https://cir.nii.ac.jp/crid/1363670319559953152?lang=en)
- [Rothstein (1986), time pressure and judgment](https://www.sciencedirect.com/science/article/pii/0749597886900452)
- [Maule, Hockey & Bdzola (2000), time pressure and decision strategy](https://pubmed.ncbi.nlm.nih.gov/10900697/)
- [Hart & Staveland (1988), NASA-TLX](https://humansystems.arc.nasa.gov/groups/tlx/downloads/Hart_Staveland_ORIGINAL_1.pdf)
- [Li, Bi & Zhong (2017), DRSES development](https://pubmed.ncbi.nlm.nih.gov/28917131/)
- [Gou et al. (2026), disaster-chain simulation RCT](https://www.sciencedirect.com/science/article/pii/S0260691726000377)
