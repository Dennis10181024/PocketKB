# 步驟 5.1 選擇題驗收報告

下列畫面由固定情境包與瀏覽器共用的 JS runtime 實際結算。選項排序使用固定測試種子，Web 試玩每次顯示順序會洗牌。這些是開發重播，實驗數據仍待收集。本次 OpenAI API 呼叫數為 0。

## 導演模式移植對照

| 類別 | 範圍 | 5.1 行為與原因 |
|---|---|---|
| 等價 | 宿舍隔煙、位置通報、靠窗示意與消防員接手 | 原則與來源保留。是否隔煙、是否聯絡、搜尋何時抵達仍由狀態和先前的選擇決定。 |
| 等價 | 學校主震掩護、停震後走樓梯、餘震再次掩護、避開電線與外牆、清點 | 保留條件與確定性後果。致命選擇直接進入特定結局。 |
| 等價 | 觀察、詢問、致命後重來 | 觀察與問同伴不耗時間或寫狀態。重來回復轉折前的 facts、暴露及同伴狀態，保留 session 與歷次作答。 |
| 刻意調整 | 宿舍通報、等候時間 | 通報在同題一次選擇，後續可趁通訊題補報。最早救援事件在第 7 回合，留出通報、封門縫、靠窗示意與等待回應的練習。最慢分支仍會有搜尋延誤及暴露累積。 |
| 刻意調整 | 學校集合與點名 | 新寫獨立集合題，讓玩家可選留班、找其他班朋友或回教室取物。未回應點名逐次記錄，再由教師另行找回，仍屬延誤撤離。 |
| 刻意調整 | 題目適用範圍 | 固定選項以既有 principle／hazard 為主。學校新增門邊等候、貼外牆、跨班集合和未回覆點名的專屬資料列，讓旁白與回顧能說明實際行為。無法移植的自由話語與模型語氣裁判留在舊模式。 |
| 刻意調整 | 傷勢與回顧 | 維持狀態機分級，另外列出本人及同伴的具體傷勢，回顧依實際事件和首次可作答的原則產生。挑出的危險選擇依時間排列，延誤原因優先進補強建議。 |
| 待確認 | 正式實驗與內容審查 | 傷勢、暴露門檻與救援回合為教學分支設計。官方來源支持應變原則，個別傷勢與時間表仍須內容審查。受試者是否分得出迷思選項、實際時長與跨端一致性待驗收。 |
| 待確認 | 新包准入與手機 | 固定包執行時檢查摘要及語意，發布前掃描可達性。生成內容白名單、照片處理、人工准入與 Kotlin 同 vectors 驗證列在後續階段。 |

## 重現

 - `node --test online-coach/test/choice-pack.test.js` 驗證摘要、DSL、可達性與 14 個共用 vectors。
 - `node online-coach/test/step51-report.js` 重新產出這份逐回合紀錄。
 - `node web-pwa/choice-browser-test.js` 需可用的 Chrome 與 Playwright。檢查從首頁到斷網重開、觀察、致命後重來與傷勢清單。

## 宿舍火災

包版 1.0.0，8 個決策點，8 個可達結局規則，15,529 個可達非終止狀態。

### 全部選項

| 決策點 | 選項 | 判定 | 採用 ID | 來源 |
|---|---|---|---|---|
| door｜走廊已經看不清，小岑想把房門拉開。我先做什麼？ | 我把房門關緊，提醒小岑別再打開。 | 正確 | barrier、stop_roommate | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| door｜走廊已經看不清，小岑想把房門拉開。我先做什麼？ | 我把房門拉開一點，確認走廊能不能走。 | 迷思 | open | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| door｜走廊已經看不清，小岑想把房門拉開。我先做什麼？ | 我沿著走廊前往最近的電梯，打算下樓。 | 危險／延誤 | elevator | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| door｜走廊已經看不清，小岑想把房門拉開。我先做什麼？ | 我先把房門關緊，沒有和小岑說明。 | 不完整 | barrier | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| roommate｜小岑還站在門附近，擔心其他人沒收到警報。我怎麼回應？ | 我請小岑別開門，和我一起確認房號。 | 正確 | stop_roommate、reassure | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| roommate｜小岑還站在門附近，擔心其他人沒收到警報。我怎麼回應？ | 我和小岑把門拉開，看看能不能叫到隔壁的人。 | 迷思 | open | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| roommate｜小岑還站在門附近，擔心其他人沒收到警報。我怎麼回應？ | 我請小岑和我進浴室關門，避開眼前的煙。 | 危險／延誤 | bathroom | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| roommate｜小岑還站在門附近，擔心其他人沒收到警報。我怎麼回應？ | 我提醒小岑別開門，接著自己留意房內狀況。 | 不完整 | stop_roommate | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| report｜手機在手上，外面還不知道我們在哪一間。我怎麼通報？ | 我打 119，報 A 棟五樓 503 室、地址、人數和走廊煙況。 | 正確 | call_119、dial、address、room、headcount、condition | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[report](https://fsm.119.gov.taipei/w/fsm119/Fire_21103023504653530) |
| report｜手機在手上，外面還不知道我們在哪一間。我怎麼通報？ | 我先從安全窗邊揮衣，等樓下的人替我報位置。 | 迷思 | check_window、signal | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| report｜手機在手上，外面還不知道我們在哪一間。我怎麼通報？ | 我先找身分證和房卡，再拿起手機通報。 | 危險／延誤 | collect | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| report｜手機在手上，外面還不知道我們在哪一間。我怎麼通報？ | 我打 119，只說兩人困在宿舍裡。 | 不完整 | call_119、dial、headcount | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[report](https://fsm.119.gov.taipei/w/fsm119/Fire_21103023504653530) |
| seal｜門底附近有焦味，手邊有可拿到的布。我怎麼處理？ | 我先確認門關緊，再用手邊的布塞住門縫。 | 正確 | barrier、seal_gap | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| seal｜門底附近有焦味，手邊有可拿到的布。我怎麼處理？ | 我直接握緊已經發燙的門把，試著拉一下。 | 迷思 | hot_handle | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| seal｜門底附近有焦味，手邊有可拿到的布。我怎麼處理？ | 我打開一點房門，確認焦味是不是從走廊來的。 | 危險／延誤 | open | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| seal｜門底附近有焦味，手邊有可拿到的布。我怎麼處理？ | 我確認房門緊閉，先留在安全的位置。 | 不完整 | barrier | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| window｜外面的人可能看不到房裡的我們。我怎麼讓對方找到房間？ | 我從室內確認窗外狀況，再留在窗內揮衣呼救。 | 正確 | check_window、signal | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| window｜外面的人可能看不到房裡的我們。我怎麼讓對方找到房間？ | 我攀上窗外的架子，想讓下面的人看得更清楚。 | 迷思 | climb_window | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| window｜外面的人可能看不到房裡的我們。我怎麼讓對方找到房間？ | 我從窗台往下跳，避開被煙堵住的走廊。 | 危險／延誤 | jump | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| window｜外面的人可能看不到房裡的我們。我怎麼讓對方找到房間？ | 我先從室內確認窗外情況，暫時不做其他動作。 | 不完整 | check_window | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| contact｜手機電量不多，外面仍在確認位置。我怎麼安排通訊？ | 我打 119 或持續通話，補報樓層房號並保持聯絡。 | 正確 | call_119、dial、room、keep_contact | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[report](https://fsm.119.gov.taipei/w/fsm119/Fire_21103023504653530) |
| contact｜手機電量不多，外面仍在確認位置。我怎麼安排通訊？ | 我先將手機留著省電，暫時不聯絡接線員。 | 迷思 | save_power | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[report](https://fsm.119.gov.taipei/w/fsm119/Fire_21103023504653530) |
| contact｜手機電量不多，外面仍在確認位置。我怎麼安排通訊？ | 我先帶手機躲進浴室，再決定如何通報。 | 危險／延誤 | bathroom | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| contact｜手機電量不多，外面仍在確認位置。我怎麼安排通訊？ | 我留在房裡，關掉不必要的程式。 | 不完整 | wait_inside、save_power | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[report](https://fsm.119.gov.taipei/w/fsm119/Fire_21103023504653530) |
| handoff｜門外有人喊「503 有人嗎？」我怎麼回應？ | 我回應房號與人數，留在房內等指示。 | 正確 | handoff | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| handoff｜門外有人喊「503 有人嗎？」我怎麼回應？ | 我先安靜等在房內，等對方再確認。 | 迷思 | wait_inside | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| handoff｜門外有人喊「503 有人嗎？」我怎麼回應？ | 我先把東西收好，再答覆門外的人。 | 危險／延誤 | collect | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| wait｜走廊視線仍被濃煙遮住，門外還沒敲門。我接下來怎麼做？ | 我先關緊門、留在房內，準備回應救援人員。 | 正確 | barrier、wait_inside | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| wait｜走廊視線仍被濃煙遮住，門外還沒敲門。我接下來怎麼做？ | 我先躲到沒有對外窗的浴室，等煙退再說。 | 迷思 | bathroom | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| wait｜走廊視線仍被濃煙遮住，門外還沒敲門。我接下來怎麼做？ | 我趁門外安靜，沿著走廊去找樓梯。 | 危險／延誤 | smoke | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)、[safety](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16) |
| wait｜走廊視線仍被濃煙遮住，門外還沒敲門。我接下來怎麼做？ | 我留在房間裡，只聽外面的聲音。 | 不完整 | wait_inside | [nfa](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |

### 全對

內容提醒「演練中可能出現受傷的結果，你可以隨時停止。」

#### 第 1 回合

> 我和小岑在 A 棟五樓 503 室，警報響起，半開房門外的走廊已被濃煙遮住。

現場狀態｜房門仍開著

**走廊已經看不清，小岑想把房門拉開。我先做什麼？**

 - 我沿著走廊前往最近的電梯，打算下樓。
 - 我把房門關緊，提醒小岑別再打開。 **← 本次選擇**
 - 我先把房門關緊，沒有和小岑說明。
 - 我把房門拉開一點，確認走廊能不能走。

結算後｜時間 1，smoke 0、heat 0

#### 第 2 回合

> 我把房門關緊。
> 小岑把手從門把收回來。
> 小岑低聲說她很擔心隔壁的人。

**小岑還站在門附近，擔心其他人沒收到警報。我怎麼回應？**

 - 我請小岑和我進浴室關門，避開眼前的煙。
 - 我請小岑別開門，和我一起確認房號。 **← 本次選擇**
 - 我提醒小岑別開門，接著自己留意房內狀況。
 - 我和小岑把門拉開，看看能不能叫到隔壁的人。

結算後｜時間 2，smoke 0、heat 0

#### 第 3 回合

> 小岑點頭，站回我旁邊。

**手機在手上，外面還不知道我們在哪一間。我怎麼通報？**

 - 我先找身分證和房卡，再拿起手機通報。
 - 我打 119，報 A 棟五樓 503 室、地址、人數和走廊煙況。 **← 本次選擇**
 - 我打 119，只說兩人困在宿舍裡。
 - 我先從安全窗邊揮衣，等樓下的人替我報位置。

結算後｜時間 3，smoke 1、heat 0

#### 第 4 回合

> 電話接通。
> 我向接線員報出地址與棟別。
> 我向接線員報出樓層與房號。
> 我向接線員報出受困人數。
> 我向接線員報出現場煙況。
> 煙從門底貼著地面進來。
> 門底傳來一陣焦味。

現場狀態｜已通報

**門底附近有焦味，手邊有可拿到的布。我怎麼處理？**

 - 我打開一點房門，確認焦味是不是從走廊來的。
 - 我先確認門關緊，再用手邊的布塞住門縫。 **← 本次選擇**
 - 我確認房門緊閉，先留在安全的位置。
 - 我直接握緊已經發燙的門把，試著拉一下。

結算後｜時間 4，smoke 1、heat 0

#### 第 5 回合

> 我把手邊的濕布壓在門縫。

現場狀態｜已通報

**外面的人可能看不到房裡的我們。我怎麼讓對方找到房間？**

 - 我從窗台往下跳，避開被煙堵住的走廊。
 - 我從室內確認窗外狀況，再留在窗內揮衣呼救。 **← 本次選擇**
 - 我先從室內確認窗外情況，暫時不做其他動作。
 - 我攀上窗外的架子，想讓下面的人看得更清楚。

結算後｜時間 5，smoke 1、heat 0

#### 第 6 回合

> 我從室內看見窗外沒有煙。
> 我留在窗內揮衣呼救。
> 手機顯示低電量。

現場狀態｜已通報

**手機電量不多，外面仍在確認位置。我怎麼安排通訊？**

 - 我先帶手機躲進浴室，再決定如何通報。
 - 我打 119 或持續通話，補報樓層房號並保持聯絡。 **← 本次選擇**
 - 我留在房裡，關掉不必要的程式。
 - 我先將手機留著省電，暫時不聯絡接線員。

結算後｜時間 6，smoke 1、heat 0

#### 第 7 回合

> 我聽見接線員的聲音。
> 我保持和接線員聯絡。

現場狀態｜已通報

**走廊視線仍被濃煙遮住，門外還沒敲門。我接下來怎麼做？**

 - 我趁門外安靜，沿著走廊去找樓梯。
 - 我先關緊門、留在房內，準備回應救援人員。 **← 本次選擇**
 - 我留在房間裡，只聽外面的聲音。
 - 我先躲到沒有對外窗的浴室，等煙退再說。

結算後｜時間 7，smoke 1、heat 0

#### 第 8 回合

> 我留在房內。
> 消防員敲門喊：「房裡有人嗎？」

現場狀態｜已通報

**門外有人喊「503 有人嗎？」我怎麼回應？**

 - 我先把東西收好，再答覆門外的人。
 - 我回應房號與人數，留在房內等指示。 **← 本次選擇**
 - 我先安靜等在房內，等對方再確認。

結算後｜時間 8，smoke 1、heat 0

#### 結局畫面

安全待救獲救｜本人傷勢 無傷

> 我回應消防員，說明房裡有兩個人。
> 消防員確認房號，把我和小岑帶出房間。

**傷勢清單**

本場無紀錄的傷勢事件。

#### 回顧全文

安全待救獲救。本人傷勢分級為無傷。

隔煙、通報位置並回應消防員，救援得以接手。

**做對的決定**

 - 「我把房門關緊，提醒小岑別再打開。」關門能減慢濃煙進入房間。
 - 「我請小岑別開門，和我一起確認房號。」阻止室友再開門，可維持隔煙。
 - 「我打 119，報 A 棟五樓 503 室、地址、人數和走廊煙況。」通報可讓消防單位知道有人受困。

**下次可以補上的**

（本場無此項）

**這次的危險選擇與後果**

 - 第 3 回合「我打 119，報 A 棟五樓 503 室、地址、人數和走廊煙況。」門縫未封使煙持續滲入。 關門後塞住手邊可及的門縫。

**關鍵轉折**

「我把房門關緊，提醒小岑別再打開。」
關門能減慢濃煙進入房間。
走廊已被濃煙阻斷時，關門隔煙。

**官方依據**

 - [消防署：火災不可躲廁所，受困請關門、靠窗打119求救](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)
 - [臺北市消防局：火災發生時之逃生狀況及方法（電梯、濃煙與跳樓禁忌）](https://www.119.gov.taipei/News_Content.aspx?n=6EEFD6ACA51B8E33&s=6FB1F286840AC217&sms=87415A8B9CE81B16)
 - [臺北市消防局防災科學教育館：報案時機](https://fsm.119.gov.taipei/w/fsm119/Fire_21103023504653530)

**帶走一個思考題**

如果換成租屋處，我能說出哪些位置資訊，讓消防員知道要找哪間房？

### 亂玩

內容提醒「演練中可能出現受傷的結果，你可以隨時停止。」

#### 第 1 回合

> 我和小岑在 A 棟五樓 503 室，警報響起，半開房門外的走廊已被濃煙遮住。

現場狀態｜房門仍開著

**走廊已經看不清，小岑想把房門拉開。我先做什麼？**

 - 我沿著走廊前往最近的電梯，打算下樓。
 - 我把房門關緊，提醒小岑別再打開。
 - 我先把房門關緊，沒有和小岑說明。 **← 本次選擇**
 - 我把房門拉開一點，確認走廊能不能走。

結算後｜時間 1，smoke 0、heat 0

#### 第 2 回合

> 我把房門關緊。
> 小岑低聲說她很擔心隔壁的人。

**小岑還站在門附近，擔心其他人沒收到警報。我怎麼回應？**

 - 我請小岑和我進浴室關門，避開眼前的煙。 **← 本次選擇**
 - 我請小岑別開門，和我一起確認房號。
 - 我提醒小岑別開門，接著自己留意房內狀況。
 - 我和小岑把門拉開，看看能不能叫到隔壁的人。

結算後｜時間 2，smoke 4、heat 0

#### 第 3 回合

> 浴室沒有對外窗，我失去窗邊示警的位置。
> 小岑把門拉開，煙一下灌入，她劇烈咳嗽。
> 我的眼睛刺痛，喉嚨也開始發乾。
> 半開的門一直進煙。

現場狀態｜房門仍開著

**手機在手上，外面還不知道我們在哪一間。我怎麼通報？**

 - 我先找身分證和房卡，再拿起手機通報。 **← 本次選擇**
 - 我打 119，報 A 棟五樓 503 室、地址、人數和走廊煙況。
 - 我打 119，只說兩人困在宿舍裡。
 - 我先從安全窗邊揮衣，等樓下的人替我報位置。

結算後｜時間 3，smoke 6、heat 0

#### 第 4 回合

> 我找物品時，煙繼續從門縫飄進來。
> 我咳個不停，說話得停下喘氣。
> 煙從門邊斷續飄進房間。

現場狀態｜房門仍開著

**門底附近有焦味，手邊有可拿到的布。我怎麼處理？**

 - 我打開一點房門，確認焦味是不是從走廊來的。
 - 我先確認門關緊，再用手邊的布塞住門縫。
 - 我確認房門緊閉，先留在安全的位置。
 - 我直接握緊已經發燙的門把，試著拉一下。 **← 本次選擇**

結算後｜時間 4，smoke 7、heat 2

#### 第 5 回合

> 門把燙得我立刻縮手。
> 我呼吸變得吃力，已說不出完整的句子。
> 半開的門一直進煙。

現場狀態｜房門仍開著

**外面的人可能看不到房裡的我們。我怎麼讓對方找到房間？**

 - 我從窗台往下跳，避開被煙堵住的走廊。
 - 我從室內確認窗外狀況，再留在窗內揮衣呼救。
 - 我先從室內確認窗外情況，暫時不做其他動作。 **← 本次選擇**
 - 我攀上窗外的架子，想讓下面的人看得更清楚。

結算後｜時間 5，smoke 8、heat 2

#### 第 6 回合

> 我從室內看見窗外沒有煙。
> 煙從門邊斷續飄進房間。
> 手機顯示低電量。

現場狀態｜房門仍開著

**手機電量不多，外面仍在確認位置。我怎麼安排通訊？**

 - 我先帶手機躲進浴室，再決定如何通報。
 - 我打 119 或持續通話，補報樓層房號並保持聯絡。
 - 我留在房裡，關掉不必要的程式。
 - 我先將手機留著省電，暫時不聯絡接線員。 **← 本次選擇**

結算後｜時間 6，smoke 9、heat 2

#### 第 7 回合

> 我把不使用的程式關掉。
> 半開的門一直進煙。

現場狀態｜房門仍開著

**走廊視線仍被濃煙遮住，門外還沒敲門。我接下來怎麼做？**

 - 我趁門外安靜，沿著走廊去找樓梯。
 - 我先關緊門、留在房內，準備回應救援人員。
 - 我留在房間裡，只聽外面的聲音。
 - 我先躲到沒有對外窗的浴室，等煙退再說。 **← 本次選擇**

結算後｜時間 7，smoke 11、heat 2

#### 第 8 回合

> 我走進浴室，外面的人看不見我。
> 煙從門邊斷續飄進房間。

現場狀態｜房門仍開著

**走廊視線仍被濃煙遮住，門外還沒敲門。我接下來怎麼做？**

 - 我趁門外安靜，沿著走廊去找樓梯。
 - 我先關緊門、留在房內，準備回應救援人員。
 - 我留在房間裡，只聽外面的聲音。
 - 我先躲到沒有對外窗的浴室，等煙退再說。 **← 本次選擇**

結算後｜時間 8，smoke 13、heat 2

#### 第 9 回合

> 浴室沒有對外窗，我失去窗邊示警的位置。
> 半開的門一直進煙。

現場狀態｜房門仍開著

**走廊視線仍被濃煙遮住，門外還沒敲門。我接下來怎麼做？**

 - 我趁門外安靜，沿著走廊去找樓梯。
 - 我先關緊門、留在房內，準備回應救援人員。
 - 我留在房間裡，只聽外面的聲音。
 - 我先躲到沒有對外窗的浴室，等煙退再說。 **← 本次選擇**

結算後｜時間 9，smoke 15、heat 2

#### 第 10 回合

> 我走進浴室，外面的人看不見我。
> 煙從門邊斷續飄進房間。

現場狀態｜房門仍開著

**走廊視線仍被濃煙遮住，門外還沒敲門。我接下來怎麼做？**

 - 我趁門外安靜，沿著走廊去找樓梯。
 - 我先關緊門、留在房內，準備回應救援人員。
 - 我留在房間裡，只聽外面的聲音。
 - 我先躲到沒有對外窗的浴室，等煙退再說。 **← 本次選擇**

結算後｜時間 10，smoke 17、heat 2

#### 第 11 回合

> 浴室沒有對外窗，我失去窗邊示警的位置。
> 半開的門一直進煙。

現場狀態｜房門仍開著

**走廊視線仍被濃煙遮住，門外還沒敲門。我接下來怎麼做？**

 - 我趁門外安靜，沿著走廊去找樓梯。
 - 我先關緊門、留在房內，準備回應救援人員。
 - 我留在房間裡，只聽外面的聲音。
 - 我先躲到沒有對外窗的浴室，等煙退再說。 **← 本次選擇**

結算後｜時間 11，smoke 19、heat 2

#### 第 12 回合

> 我走進浴室，外面的人看不見我。
> 煙從門邊斷續飄進房間。
> 消防員敲門喊：「房裡有人嗎？」

現場狀態｜房門仍開著

**門外有人喊「503 有人嗎？」我怎麼回應？**

 - 我先把東西收好，再答覆門外的人。
 - 我回應房號與人數，留在房內等指示。
 - 我先安靜等在房內，等對方再確認。 **← 本次選擇**

結算後｜時間 12，smoke 20、heat 2

#### 第 13 回合

> 我留在房內。
> 門外沒有聽到回應，消防員又喊了一次。
> 半開的門一直進煙。

現場狀態｜房門仍開著

**門外有人喊「503 有人嗎？」我怎麼回應？**

 - 我先把東西收好，再答覆門外的人。
 - 我回應房號與人數，留在房內等指示。
 - 我先安靜等在房內，等對方再確認。 **← 本次選擇**

結算後｜時間 13，smoke 21、heat 2

#### 結局畫面

延誤後獲救｜本人傷勢 重傷・需住院

> 我沒有出聲。
> 消防員等不到回音，得逐一確認房間。
> 煙從門邊斷續飄進房間。
> 搜尋隊最後找到房間並安排撤離。

**傷勢清單**

 - 第 2 回合｜小岑｜吸入濃煙後咳嗽
 - 第 2 回合｜本人｜眼與喉嚨受濃煙刺激
 - 第 3 回合｜本人｜吸入濃煙後持續咳嗽
 - 第 4 回合｜本人｜掌心接觸燙傷
 - 第 4 回合｜本人｜吸入濃煙後呼吸困難

#### 回顧全文

延誤後獲救。最嚴重的傷勢為吸入濃煙後呼吸困難。本人傷勢分級為重傷・需住院。撤離或救援延誤：躲入浴室耽誤定位、未勸阻室友再次開門、收拾物品耽誤阻煙、熱門把造成燙傷、未及時保持聯絡、沒有即時回應消防員、未回應使消防員需逐間確認。

最早因躲入浴室耽誤定位造成延誤，過程中出現吸入濃煙後呼吸困難。

**做對的決定**

 - 「我先把房門關緊，沒有和小岑說明。」關門能減慢濃煙進入房間。
 - 「我先從室內確認窗外情況，暫時不做其他動作。」先了解窗外現況可避免貿然接近。

**下次可以補上的**

 - 受困時撥 119 並報出位置。
 - 在房內安全窗邊向外示意。

**這次的危險選擇與後果**

 - 第 2 回合「我請小岑和我進浴室關門，避開眼前的煙。」室友再次開門，兩人暴露在濃煙中。 留在隔煙處並勸室友別開門。
 - 第 3 回合「我先找身分證和房卡，再拿起手機通報。」吸入濃煙後持續咳嗽。 及早阻煙，確認位置並聯絡消防單位。
 - 第 4 回合「我直接握緊已經發燙的門把，試著拉一下。」吸入濃煙後呼吸困難。 及早阻煙，確認位置並聯絡消防單位。

**關鍵轉折**

「我請小岑和我進浴室關門，避開眼前的煙。」
延誤後獲救
回到能隔煙並可對外聯絡的位置。

**官方依據**

 - [消防署：火災不可躲廁所，受困請關門、靠窗打119求救](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)
 - [臺北市消防局防災科學教育館：報案時機](https://fsm.119.gov.taipei/w/fsm119/Fire_21103023504653530)

**帶走一個思考題**

如果換成租屋處，我能說出哪些位置資訊，讓消防員知道要找哪間房？

## 學校地震

包版 1.0.0，7 個決策點，6 個可達結局規則，2,104 個可達非終止狀態。

### 全部選項

| 決策點 | 選項 | 判定 | 採用 ID | 來源 |
|---|---|---|---|---|
| main｜教室突然劇烈搖晃，桌椅開始移動。我第一步做什麼？ | 我趴在桌下護住頭頸，抓牢桌腳。 | 正確 | cover | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[ntfd-cover](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=6259) |
| main｜教室突然劇烈搖晃，桌椅開始移動。我第一步做什麼？ | 我貼在櫃旁蹲下，利用櫃子旁的空間。 | 迷思 | triangle | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[ntfd-cover](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=6259) |
| main｜教室突然劇烈搖晃，桌椅開始移動。我第一步做什麼？ | 我趁門還開著，先跑到走廊。 | 危險／延誤 | rush_open | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| main｜教室突然劇烈搖晃，桌椅開始移動。我第一步做什麼？ | 我縮到桌下護頭，空出手扶自己的身體。 | 不完整 | cover | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[ntfd-cover](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=6259) |
| companion｜小維說：「我想拉開後門，叫隔壁班一起走。」我怎麼回他？ | 我請小維留在掩護處，答應停震後一起確認情況。 | 正確 | stop_npc、reassure、wait | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| companion｜小維說：「我想拉開後門，叫隔壁班一起走。」我怎麼回他？ | 我叫他先站到門邊，等搖晃變小再開。 | 迷思 | send_peer_to_door | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| companion｜小維說：「我想拉開後門，叫隔壁班一起走。」我怎麼回他？ | 我跟小維一起往門邊走，看看隔壁班。 | 危險／延誤 | rush_open | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| companion｜小維說：「我想拉開後門，叫隔壁班一起走。」我怎麼回他？ | 我請小維先回桌下，自己暫時不離開。 | 不完整 | stop_npc | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| aftershock｜剛要起身，教室又晃了起來，桌腳在地上滑。我怎麼應對？ | 我重新趴下護頭、抓牢桌腳，等搖晃過去。 | 正確 | aftershock_cover | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| aftershock｜剛要起身，教室又晃了起來，桌腳在地上滑。我怎麼應對？ | 我蹲在櫃旁，想等一停就能移動。 | 迷思 | triangle | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[ntfd-cover](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=6259) |
| aftershock｜剛要起身，教室又晃了起來，桌腳在地上滑。我怎麼應對？ | 我趁這波搖晃較短先跑出教室。 | 危險／延誤 | rush_open | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| aftershock｜剛要起身，教室又晃了起來，桌腳在地上滑。我怎麼應對？ | 我先跨出窗台，想在外牆找地方落腳。 | 危險／延誤 | jump_window | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| stairs｜老師說可以疏散。樓梯前已排了幾個班，另一側有電梯。我怎麼離開？ | 我護住頭頸，保持距離，跟隊伍走樓梯。 | 正確 | head、orderly、stairs | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| stairs｜老師說可以疏散。樓梯前已排了幾個班，另一側有電梯。我怎麼離開？ | 我趁人還少先往下快跑，免得後面更擠。 | 迷思 | pushing | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| stairs｜老師說可以疏散。樓梯前已排了幾個班，另一側有電梯。我怎麼離開？ | 我搭電梯先到一樓，再到外面跟大家會合。 | 危險／延誤 | elevator | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| stairs｜老師說可以疏散。樓梯前已排了幾個班，另一側有電梯。我怎麼離開？ | 我跟著班級走樓梯，留著距離慢慢走。 | 不完整 | orderly、stairs | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| outside｜出口外牆掉了幾塊碎片，前方還垂著一條線。我選哪條路？ | 我繞開電線和外牆，往操場空地走。 | 正確 | open_area | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| outside｜出口外牆掉了幾塊碎片，前方還垂著一條線。我選哪條路？ | 我貼著外牆走過去，想避開正前方的電線。 | 迷思 | stay_at_wall | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| outside｜出口外牆掉了幾塊碎片，前方還垂著一條線。我選哪條路？ | 我先把垂下的電線挪開，讓同學能通過。 | 危險／延誤 | wire | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| assembly｜操場上幾個班正在集合，熟識的同學朝我招手。我在哪裡等？ | 我找到自己班的集合位置，留在老師看得到的地方。 | 正確 | stay_group | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| assembly｜操場上幾個班正在集合，熟識的同學朝我招手。我在哪裡等？ | 我先站到朋友那一班，等老師找我再回去。 | 迷思 | leave_assembly | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| assembly｜操場上幾個班正在集合，熟識的同學朝我招手。我在哪裡等？ | 我趁點名前回教室拿手機，再趕回操場。 | 危險／延誤 | collect | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| roll_call｜老師正喊我的名字，小維還沒被確認。我回應什麼？ | 我回應到，說清小維最後的位置及是否受傷。 | 正確 | roll_call | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| roll_call｜老師正喊我的名字，小維還沒被確認。我回應什麼？ | 我先等老師再喊一次，免得聽錯名單。 | 迷思 | miss_roll_call | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| roll_call｜老師正喊我的名字，小維還沒被確認。我回應什麼？ | 我先離開隊伍找小維，等找到再一起回報。 | 危險／延誤 | collect | [cwa-school](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)、[moi-earthquake](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |

### 全對

內容提醒「演練中可能出現受傷的結果，你可以隨時停止。」

#### 第 1 回合

> 我是上午上課的學生，小維坐在隔壁桌。椅腳猛地刮過地板，窗邊也在響。老師的聲音被桌椅碰撞蓋住。

現場狀態｜教室仍在搖晃

**教室突然劇烈搖晃，桌椅開始移動。我第一步做什麼？**

 - 我趁門還開著，先跑到走廊。
 - 我趴在桌下護住頭頸，抓牢桌腳。 **← 本次選擇**
 - 我縮到桌下護頭，空出手扶自己的身體。
 - 我貼在櫃旁蹲下，利用櫃子旁的空間。

結算後｜時間 1，trauma 0、separation 0

#### 第 2 回合

> 我縮到桌下，抓住桌腳。
> 小維挪開椅子，說想拉開後門去叫人。

現場狀態｜教室仍在搖晃

**小維說：「我想拉開後門，叫隔壁班一起走。」我怎麼回他？**

 - 我跟小維一起往門邊走，看看隔壁班。
 - 我請小維留在掩護處，答應停震後一起確認情況。 **← 本次選擇**
 - 我請小維先回桌下，自己暫時不離開。
 - 我叫他先站到門邊，等搖晃變小再開。

結算後｜時間 2，trauma 0、separation 0

#### 第 3 回合

> 小維縮回跨向走道的腳。
> 小維聽完，把手放回桌腳。
> 我留在原處，聽著桌椅的聲音慢下來。
> 主震鬆了不到一會，窗玻璃又震出一陣低聲。

現場狀態｜教室仍在搖晃、已出現餘震

**剛要起身，教室又晃了起來，桌腳在地上滑。我怎麼應對？**

 - 我趁這波搖晃較短先跑出教室。
 - 我重新趴下護頭、抓牢桌腳，等搖晃過去。 **← 本次選擇**
 - 我先跨出窗台，想在外牆找地方落腳。
 - 我蹲在櫃旁，想等一停就能移動。

結算後｜時間 3，trauma 0、separation 0

#### 第 4 回合

> 我再次低下身子，穩住桌腳。
> 地板慢慢停住，老師在門口集結班級。

現場狀態｜已出現餘震

**老師說可以疏散。樓梯前已排了幾個班，另一側有電梯。我怎麼離開？**

 - 我搭電梯先到一樓，再到外面跟大家會合。
 - 我護住頭頸，保持距離，跟隊伍走樓梯。 **← 本次選擇**
 - 我跟著班級走樓梯，留著距離慢慢走。
 - 我趁人還少先往下快跑，免得後面更擠。

結算後｜時間 4，trauma 0、separation 0

#### 第 5 回合

> 我護著頭頸跟上隊伍。
> 我和前方同學留著距離。
> 我跟著班級從樓梯下樓。
> 出口外有碎屑，前方電線低垂。

現場狀態｜已出現餘震

**出口外牆掉了幾塊碎片，前方還垂著一條線。我選哪條路？**

 - 我先把垂下的電線挪開，讓同學能通過。
 - 我繞開電線和外牆，往操場空地走。 **← 本次選擇**
 - 我貼著外牆走過去，想避開正前方的電線。

結算後｜時間 5，trauma 0、separation 0

#### 第 6 回合

> 我避開外牆和垂落的電線，往開闊處走。
> 操場上傳來各班老師集合的聲音。

現場狀態｜已出現餘震

**操場上幾個班正在集合，熟識的同學朝我招手。我在哪裡等？**

 - 我趁點名前回教室拿手機，再趕回操場。
 - 我找到自己班的集合位置，留在老師看得到的地方。 **← 本次選擇**
 - 我先站到朋友那一班，等老師找我再回去。

結算後｜時間 6，trauma 0、separation 0

#### 第 7 回合

> 我留在班級指定位置。
> 名單翻動，老師開始叫名字。

現場狀態｜已出現餘震

**老師正喊我的名字，小維還沒被確認。我回應什麼？**

 - 我先離開隊伍找小維，等找到再一起回報。
 - 我回應到，說清小維最後的位置及是否受傷。 **← 本次選擇**
 - 我先等老師再喊一次，免得聽錯名單。

結算後｜時間 7，trauma 0、separation 0

#### 結局畫面

安全撤離｜本人傷勢 無傷

> 我回應自己的名字，說明同伴的位置。
> 老師在我的名字旁畫了勾，我留在操場上和大家等候。

**傷勢清單**

本場無紀錄的傷勢事件。

#### 回顧全文

安全撤離。本人傷勢分級為無傷。

我跟隊到集合處並完成點名。

**做對的決定**

 - 「我趴在桌下護住頭頸，抓牢桌腳。」桌下的掩護可減少掉落物造成的傷害。
 - 「我請小維留在掩護處，答應停震後一起確認情況。」主震中一起留在掩護處，可減少掉落物暴露。
 - 「我重新趴下護頭、抓牢桌腳，等搖晃過去。」餘震也可能讓物品移動或掉落。

**下次可以補上的**

（本場無此項）

**這次的危險選擇與後果**

（本場無此項）

**關鍵轉折**

「我趴在桌下護住頭頸，抓牢桌腳。」
桌下的掩護可減少掉落物造成的傷害。
一搖晃就趴下、掩護、穩住。

**官方依據**

 - [地震來了，立即三步驟](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=6259)
 - [地震防護](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)

**帶走一個思考題**

如果地點換成圖書館，搖晃停止後，我要如何確認路線與同行者？

### 亂玩

內容提醒「演練中可能出現受傷的結果，你可以隨時停止。」

#### 第 1 回合

> 我是上午上課的學生，小維坐在隔壁桌。椅腳猛地刮過地板，窗邊也在響。老師的聲音被桌椅碰撞蓋住。

現場狀態｜教室仍在搖晃

**教室突然劇烈搖晃，桌椅開始移動。我第一步做什麼？**

 - 我趁門還開著，先跑到走廊。 **← 本次選擇**
 - 我趴在桌下護住頭頸，抓牢桌腳。
 - 我縮到桌下護頭，空出手扶自己的身體。
 - 我貼在櫃旁蹲下，利用櫃子旁的空間。

結算後｜時間 1，trauma 2、separation 0

#### 第 2 回合

> 門框旁的物品掉下來，擦過我手臂。
> 有碎物擦過我的手臂。
> 小維挪開椅子，說想拉開後門去叫人。

現場狀態｜教室仍在搖晃

**小維說：「我想拉開後門，叫隔壁班一起走。」我怎麼回他？**

 - 我跟小維一起往門邊走，看看隔壁班。 **← 本次選擇**
 - 我請小維留在掩護處，答應停震後一起確認情況。
 - 我請小維先回桌下，自己暫時不離開。
 - 我叫他先站到門邊，等搖晃變小再開。

結算後｜時間 2，trauma 5、separation 0

#### 第 3 回合

> 我離開桌邊，一件掉落的物品擦到手臂。
> 頭頂響了一聲，燈具碎片落到我伸手就碰得到的位置。
> 小維跟我走出桌邊，踉蹌時用手撐住門框，手腕痛得縮了回去。
> 主震鬆了不到一會，窗玻璃又震出一陣低聲。

現場狀態｜教室仍在搖晃、已出現餘震

**剛要起身，教室又晃了起來，桌腳在地上滑。我怎麼應對？**

 - 我趁這波搖晃較短先跑出教室。 **← 本次選擇**
 - 我重新趴下護頭、抓牢桌腳，等搖晃過去。
 - 我先跨出窗台，想在外牆找地方落腳。
 - 我蹲在櫃旁，想等一停就能移動。

結算後｜時間 3，trauma 7、separation 0

#### 第 4 回合

> 地板再次晃動，滑過來的桌子撞上我的小腿。
> 地板慢慢停住，老師在門口集結班級。

現場狀態｜已出現餘震

**老師說可以疏散。樓梯前已排了幾個班，另一側有電梯。我怎麼離開？**

 - 我搭電梯先到一樓，再到外面跟大家會合。
 - 我護住頭頸，保持距離，跟隊伍走樓梯。
 - 我跟著班級走樓梯，留著距離慢慢走。
 - 我趁人還少先往下快跑，免得後面更擠。 **← 本次選擇**

結算後｜時間 4，trauma 9、separation 0

#### 第 5 回合

> 樓梯轉角有人停下，我收不住腳，腳踝一拐。
> 出口外有碎屑，前方電線低垂。

現場狀態｜已出現餘震

**出口外牆掉了幾塊碎片，前方還垂著一條線。我選哪條路？**

 - 我先把垂下的電線挪開，讓同學能通過。
 - 我繞開電線和外牆，往操場空地走。
 - 我貼著外牆走過去，想避開正前方的電線。 **← 本次選擇**

結算後｜時間 5，trauma 9、separation 1

#### 第 6 回合

> 我走近了外牆。
> 外牆落下小碎片，我只好折回再繞。
> 操場上傳來各班老師集合的聲音。

現場狀態｜已出現餘震

**操場上幾個班正在集合，熟識的同學朝我招手。我在哪裡等？**

 - 我趁點名前回教室拿手機，再趕回操場。
 - 我找到自己班的集合位置，留在老師看得到的地方。
 - 我先站到朋友那一班，等老師找我再回去。 **← 本次選擇**

結算後｜時間 6，trauma 9、separation 2

#### 第 7 回合

> 我走到另一班。
> 我離開了自己班的位置，老師清點不到我。
> 名單翻動，老師開始叫名字。

現場狀態｜已出現餘震

**老師正喊我的名字，小維還沒被確認。我回應什麼？**

 - 我先離開隊伍找小維，等找到再一起回報。
 - 我回應到，說清小維最後的位置及是否受傷。
 - 我先等老師再喊一次，免得聽錯名單。 **← 本次選擇**

結算後｜時間 7，trauma 9、separation 3

#### 第 8 回合

> 名單上我的狀態仍待確認。
> 老師停下點名，重新掃視隊伍。

現場狀態｜已出現餘震

**老師正喊我的名字，小維還沒被確認。我回應什麼？**

 - 我先離開隊伍找小維，等找到再一起回報。
 - 我回應到，說清小維最後的位置及是否受傷。
 - 我先等老師再喊一次，免得聽錯名單。 **← 本次選擇**

結算後｜時間 8，trauma 9、separation 5

#### 結局畫面

延誤後由老師協助撤離｜本人傷勢 重傷・需住院

> 老師叫了下一個名字。
> 老師花時間在隊伍外找到我，才確認沒有人失聯。
> 老師在集合處外找到我，叫同學過來協助，我這才和班級會合。

**傷勢清單**

 - 第 1 回合｜本人｜手臂擦傷
 - 第 1 回合｜本人｜手臂擦傷
 - 第 2 回合｜本人｜手臂擦傷
 - 第 2 回合｜本人｜落物造成手臂受傷
 - 第 2 回合｜小維｜手腕受傷
 - 第 3 回合｜本人｜小腿撞傷
 - 第 4 回合｜本人｜腳踝扭傷

#### 回顧全文

延誤後由老師協助撤離。最嚴重的傷勢為落物造成手臂受傷、小腿撞傷、腳踝扭傷。本人傷勢分級為重傷・需住院。撤離或救援延誤：搖晃中離開掩護處、主震未掩護、持續未取得掩護、同伴受傷後需要協助、餘震中移動撞傷小腿、樓梯踩空後需放慢腳步、貼外牆後折返繞行、離開班級集合處、點名沒有回應、老師另外查找後才確認人員。

最早因搖晃中離開掩護處造成延誤，過程中出現落物造成手臂受傷。

**做對的決定**

（本場無此項）

**下次可以補上的**

 - 提醒同伴先就地掩護。
 - 到戶外後遠離外牆及掉落的電線。

**這次的危險選擇與後果**

 - 第 2 回合「我跟小維一起往門邊走，看看隔壁班。」主震未掩護使落物接連打到身旁。 搖晃一開始就趴低、掩護、穩住。
 - 第 3 回合「我趁這波搖晃較短先跑出教室。」搖晃中跑動時，掉落物擦傷手臂。 先趴下、掩護、穩住，等搖晃停止再移動。
 - 第 4 回合「我趁人還少先往下快跑，免得後面更擠。」樓梯推擠奔跑導致跌倒及腳踝扭傷。 不推不跑，等前方有空間再走。

**關鍵轉折**

「我趁門還開著，先跑到走廊。」
延誤後由老師協助撤離
先趴下、掩護、穩住，等搖晃停止再移動。

**官方依據**

 - [地震來了，立即三步驟](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=6259)
 - [地震防護](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)
 - [機關安全宣導：地震防災預防措施](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D)

**帶走一個思考題**

如果地點換成圖書館，搖晃停止後，我要如何確認路線與同行者？
