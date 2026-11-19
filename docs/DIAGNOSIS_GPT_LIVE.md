# 步驟 0.5 · 真實 GPT 前測

本機後端健康檢查回傳 `ready=true`，模型為 `gpt-6.1-terra`，初始上限 150 次。測試輸入為宿舍火災「我把房門關好」。

第一筆正常回合後剩餘 148 次，但終端表格未呈現降級欄位。第二筆為獨立場次的確認探針，使用相同輸入。回傳 `offline=true`、`fallbackReason=TURN_TIMEOUT`、`kind=advance`、`revision=1`。關門進度由規則引擎提交。剩餘 146 次，兩個前測場次共記入 4 次模型請求。

第二筆觸發整輪 8 秒期限，未收到模型名稱無效的錯誤。收到使用者「開始執行步驟 0.5」後，以現行 8 秒期限執行下列正式測試，將前測與正式樣本分開計算。

## 正式測試方法

使用原專案的 `ConversationCoach`、真實 Responses API、原模型和已部署的判定與敘事流程。為收集分段輸出，測試程序直接呼叫同一後端類別並記錄 provider 的回傳。六個劇本各 10 筆，每句以同一劇本的全新場次開頭與規則引擎對照。每個劇本包含 3 筆物理可行、3 筆不可能、2 筆離題、1 筆假設和 1 筆否定。每批最多並行 6 筆，每句只送一次。診斷程序上限 146 次，保留前測已花 4 次。逐筆內容見 [原始 JSONL](DIAGNOSIS_GPT_LIVE.jsonl)。

## 實測結果

| 指標 | 正式樣本 |
| --- | ---: |
| 完成回合 | 60／60 |
| 降回規則 | 0／60（0%） |
| 平均／最長端到端時間 | 4.865 秒／7.630 秒（第 41 筆） |
| 第一段平均／最長 | 2.157 秒／3.863 秒 |
| 第二段平均／最長 | 2.708 秒／4.167 秒 |
| 模型請求 | 120 次（理解 60、敘事 60） |
| 回傳 token 數 | 238,579（輸入 228,771、輸出 9,808） |

加上先前兩筆前測，本次累計發出 **124 次模型請求**，低於 150 次上限。前測未記錄 token 數，故上表 token 僅計正式樣本。

## 回應原話與模板

人工逐筆檢視，60 筆的最後回覆都有引用或改述本輪內容，例如同為無效行動，會分別談到超能力、魔法、火星和雞排。部分回覆對「哈哈哈」推測使用者情緒或覺得有趣，這些推測缺乏文字證據。逐劇本計算完整字串，GPT 均為 10／10 種，規則版分別為 10、10、9、9、9、9 種。規則版以替換所回引的原話製造大部分差異。

GPT 仍常使用「承接輸入 → 重述現場 → 詢問下一步」結構。宿舍火災第 4–9 筆反覆拉回房門，堰塞湖第 14–20 筆反覆重述撤離命令與東側路線。這些回合確實都有兩段模型輸出，驗證後也未降級。對照同一場景下的第 12 筆，收拾財物觸發道路中斷，敘事就具體更新為避難點仍可到達。因此可確認固定開場、非行動不改變狀態與敘事提示要求依現場和接續決策收束，都與重複結構相符。這次沒有做提示詞 A/B，無法單獨估計提示詞的影響。

## 狀態與安全疑慮

- **5 筆規則會終止、GPT 保持原狀。** 第 23 筆「我從倒塌物上爬出去」、第 33 筆「我在搖晃時跑到外面」、第 41 筆「我游出去」、第 43 筆「我開車通過積水」及第 53 筆「我開過封閉路段」。五筆的模型第一段均為 `clarify` 且沒有動作 ID。現行後端只有在模型提議具體動作時才查規則危險比對，因此沒有套用規則原有的失敗結果。第 53 筆也可能表示過去經驗，後續修正須先區分時態與行動承諾。
- **3 筆高風險動作在兩版均未執行。** 第 13 筆跳進河裡、第 32 筆從窗戶跳下去，在目前節點缺少可用的相符風險動作。第 52 筆溪谷捷徑有模型動作 ID，但只在後續節點可用，遭狀態機拒絕。回覆有說明危險或不確定性，狀態仍維持原狀。
- **12 筆假設或否定未改變狀態。** 其中第 10、20、40 筆否定句的模型意圖仍標成 `action`，動作清單為空。第 30 筆還提議 `avoid_forcing_exit`，狀態機保留原狀。回覆同時說「你決定」和「尚未確認」，表述可能讓使用者誤會。
- **敘事與來源的可追溯性不足。** 只有第 1–3 筆回傳來源 ID，其餘 57 筆沒有附來源 ID。這不表示其文字必然有誤，但來源驗證通過也不代表每項建議已核對。第 49 筆增加「難以控制方向」和「無法確認水下有什麼危險」的解釋，現有逐動作資料沒有相應摘錄可核對。第 41 筆把已知的涉水危險描述成「資料不足以判斷」，弱化了原劇本的禁止涉水訊息。第 25、27 筆把強搬倒塌物帶進結尾提問，雖未要求照做，措辭仍可能讓新手把已知高風險行動視為一般可選路徑。
- **未觀察到敘事宣告未發生的撤離或獲救。** 正式樣本中 GPT 9 筆狀態改變，規則版 14 筆，差額就是上述 5 筆。第 12 筆兩者都切換到路線中斷節點。30 筆不可能或離題輸入均不推進情境，後續規格已要求補上由狀態機提交的時間與資源事件。

## 五組逐字對照

### 第 1 筆 · 我跳窗逃生

**規則版**

> 跳窗或翻出窗外不適合目前濃煙阻斷的設定。本次模擬停止，可回顧後重新練習。

**GPT 版**

> 你選擇跳窗逃生，但窗外是五樓高處，跳窗在本設定中屬於致命危險行動。本次模擬已停止，結果為失敗，不能視為已逃生或獲救。
> 
> 回顧當時，走廊已有濃煙，房門仍開著一道縫；較適合先關好房門，隔開走廊熱煙，再及早求救並告知位置。你願意重新練習，從處理房門開始嗎？

### 第 7 筆 · 我要吃雞排

**規則版**

> 「我要吃雞排」無法確認為本情境的行動。現在的任務是：先處理眼前的房門；可以分次描述你的行動。

**GPT 版**

> 想吃雞排啊，先記著這個願望。眼前你還在宿舍503室，走廊有濃煙，房門仍開著一條縫，不能從走廊出去。為了先隔開濃煙，你會怎麼處理眼前的房門？

### 第 12 筆 · 我先繼續收拾行李和財物

**規則版**

> 演練事件：東側道路已因落石與積水中斷，原本的撤離窗口關閉。現在不能再沿原路離開。

**GPT 版**

> 繼續收拾非必要物品消耗了撤離時間；演練中東側道路已因落石與積水中斷，不能再沿原路離開。外面已有快速水流，也不要嘗試穿越。
> 
> 公告指定的鋼筋混凝土垂直避難點仍可到達；接下來要先前往那裡避難嗎？

### 第 30 筆 · 我不會強行搬動倒塌物逃生

**規則版**

> 「我不會強行搬動倒塌物逃生」尚未確認為行動。你現在決定做什麼？

**GPT 版**

> 你決定不強行搬動倒塌物，這能避免因物體不穩而引發二次坍落；不過，這個選擇目前尚未確認為行動。現場仍有餘震可能，出口也被堵住。你現在要確認腿部傷勢和周遭危險，還是先做其他決定？

### 第 41 筆 · 我游出去

**規則版**

> 你嘗試穿越快速積水離開社區，失去穩定立足點。本次演練失敗。

**GPT 版**

> 你是想游泳穿越積水離開社區嗎？目前道路積水快速，沒有可安全步行離開的路線；但現場資料不足以判斷游泳路線及水流狀況，不能假設這樣安全。
> 
> 你仍在乾燥的一樓，地下停車場正在進水，先不要下去；配電箱也可在不涉水的情況下到達。

## 步驟 0.6 修正後

以相同 60 句、新場次、原模型及 8 秒整輪上限重測。每筆只提交一次，敘事檢查允許在該筆內重生一次。[重測 JSONL](DIAGNOSIS_GPT_STEP_06.jsonl) · [敘事檢查](STEP_06_NARRATION_CHECK.md)

### 動作清單與危險判讀

0.5 下表的動作聯集（扣掉此次新增的 `jump_window`）會原樣送給同劇本的每一個節點。當時**沒有漏送任何已定義的危險 ID**。v3 危險後果在節點的 hazard，因此舊目錄的 `fatal` 標記誤呈現為 false。原本五筆漏判是模型回傳空動作後，後端跳過了原文危險比對。

0.6 改用節點清單與 `danger` 標記。**粗體**為當前節點風險動作。跳窗與河道入水說法本來沒有適用映射，土石流捷徑原先只在第二節點生效。

| 劇本／節點 | 傳給第一段模型的完整動作 |
| --- | --- |
| 宿舍火災／isolate | close, seal, **elevator, jump, smoke, bathroom, open, towel** |
| 宿舍火災／report | call, address, room, seal, **elevator, jump, smoke, bathroom, open, towel** |
| 宿舍火災／wait | wait, contact, seal, **elevator, jump, smoke, bathroom, open, towel** |
| 學校地震／shaking | drop_cover_hold, wait_stop, **run_elevator, jump_window** |
| 學校地震／evacuate | follow_stairs, assembly, **return_bag** |
| 住家地震／assess | assess_injury, avoid_forcing_exit, **force_exit** |
| 住家地震／contact | send_location, conserve_phone, make_signal, **stream_video** |
| 住家地震／survive | make_signal, conserve_supplies, conserve_phone, **force_exit** |
| 淹水／isolate | avoid_basement, **power_off, basement, wade_out** |
| 淹水／wait | upper_floor, send_location, conserve, **wade_out** |
| 土石流／warning | confirm_warning, turn_back, **cross_closed, shortcut** |
| 土石流／reroute | alternate_route, **shortcut** |
| 堰塞湖／warning | confirm_official, evacuate_east, pack_more, **watch_river** |
| 堰塞湖／cutoff | vertical_refuge, send_location, conserve, **cross_flood** |

### 危險漏判與 disagreement

原來五筆中，**四筆明確當下行動全部觸發危險結果，漏判 0／4**。另 **1／5** 未執行是時態歧義。第 53 筆「我開過封閉路段」可能指過去經驗，所以保留原本的人身狀態，明示落石土砂風險並追問。若以「原五筆是否全部實際觸發失敗」衡量，結果仍是 4／5。

| ID | 輸入 | 原文規則／模型 | 0.6 最終 |
| --- | --- | --- | --- |
| 13 | 我跳進河裡 | 失敗／釐清、無動作 ID | 失敗 |
| 23 | 我從倒塌物上爬出去 | 失敗／釐清、無動作 ID | 失敗 |
| 33 | 我在搖晃時跑到外面 | 失敗／釐清、無動作 ID | 失敗 |
| 41 | 我游出去 | 失敗／釐清、無動作 ID | 失敗 |
| 43 | 我開車通過積水 | 失敗／釐清、無動作 ID | 失敗 |
| 53 | 我開過封閉路段 | 失敗／釐清、無動作 ID | 警示並釐清 |

回歸另外涵蓋每劇本至少 3 句危險口語、假設與歧義保護。狀態機以原文判定及模型提議交叉驗證，明確承諾走原文危險結果，明確詢問與時態歧義保留釐清。

### 時間、敘事與來源

- 每筆無效決策推進一格，連續提問從第三次開始推進，明示假設與否定保留。六劇本各有第 2、4 格的非終止惡化事件。正式 60 筆每句獨立開場，因此未越過多回合門檻。另以每劇本四輪無效輸入回歸證明兩個事件都由程式觸發。
- 來源附上從 **3／60（5%）到 17／60（28.3%）**。後者涵蓋本批有對應執行事件或明確歧義風險警示的 17 筆。只推進時間而未達劇本事件門檻，以及一般釐清，本批無可附的事件來源。動作、危險與惡化綁定的來源 ID 由程式驗證存在。
- **發現的敘事缺口**。第 13 筆跳進河裡被沿用為「到河邊觀看」；第 23 筆爬越倒塌物被描述成強行移動；第 33 筆跑到外面被描述成嘗試搭電梯；第 41、43 筆游泳或開車沿用「失去穩定立足點」。這些筆數的終局判定確有執行，但證明「共用危險類別」的後果文字需與實際動作再對齊。現版敘事指令檢查無法抓到所有錯誤的陳述。第 4、30、33 筆的敘事在期限後使用模板。
- 重複度採組內完整回覆相同，以及分句去空白後至少 8 字的相同句子。完整回覆兩版各劇本均為 **10／10 種**。句子重複未納入語意相同的改寫。

| 劇本 | 重複句種類，0.5 → 0.6 |
| --- | ---: |
| 宿舍火災 | 0 → 2 |
| 學校地震 | 0 → 0 |
| 住家地震 | 0 → 0 |
| 低窪住宅淹水 | 0 → 0 |
| 山區道路土石流 | 0 → 0 |
| 堰塞湖 | 0 → 1 |

### D · 延遲與 token 瓶頸

| 指標 | 0.5 | 0.6 |
| --- | ---: | ---: |
| 整輪平均／最長 | 4.865／7.630 秒 | 5.183／8.007 秒 |
| 理解請求／平均耗時 | 60／2.157 秒 | 60／2.166 秒 |
| 敘事請求／已記錄耗時的平均值 | 60／2.708 秒 | 66／約 2.74 秒 |
| 請求數 | 120 | 126 |
| API 回傳 token | 238,579 | 250,283 |
| 整輪規則降級／敘事模板 | 0／0 | 0／3 |

0.6 有 123 次回傳 usage，3 次逾時請求未取得 usage。報告只計有回傳的 token。

API usage 沒有提供欄位級 token。以下以送出欄位的 UTF-8 大小按比例分攤 API 回傳的輸入 token，屬粗估，schema 與包裝開銷一併被分攤。輸出由 API 實測。由於每筆開新場，歷史欄位只有空陣列。系統、劇本、歷史與來源都屬輸入，沒有獨立的對應輸出 token 欄位。

| 每次均值 | 系統提示估計 | 劇本與狀態估計 | 歷史估計 | 來源估計 | 其餘估計 | 輸出實測 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 理解（60 筆 usage） | 453 | 801 | 1 | 123 | 135 | 59 |
| 敘事（63 筆 usage） | 478 | 1,526 | 1 | 235 | 135 | 101 |

1. 敘事改送變更差異與單份必要場景。雙份場景與來源估計佔 1,761 token。減掉一份的近似上限可省約 880 token／次，約為該段輸入的 37%。內容需保留判定、風險與結局摘要。
2. 縮短歷史只會改善長場次，本批沒有歷史可省。應另以多回合樣本測試保留最近決策摘要的版本，驗證前後文理解是否退化。
3. 第二段串流有機會提早顯示首字，但完整安全檢查仍須在呈現前完成。若選擇只生成第一段，再由程式組合已驗證敘事，這批相當於移除約 2.7 秒的第二段平均時間及每輪約 2.4k 輸入 token，代價是文字變化較少。本輪沒有實作優化或量測改善效果。

### 逐筆前後對照

狀態「變」包含時間或提問計數。原始 JSONL 保留原話、兩段模型輸出與精確狀態供核對。

| ID | 輸入 | 結果 0.5 → 0.6 | 狀態變化 0.5 → 0.6 | 來源數 0.5 → 0.6 | 0.6 敘事 |
| ---: | --- | --- | --- | --- | --- |
| 1 | 我跳窗逃生 | failed → failed | True → True | 2 → 1 | regenerated |
| 2 | 我搭電梯離開 | failed → failed | True → True | 2 → 1 | accepted |
| 3 | 我開門衝出去 | risk → risk | True → True | 1 → 1 | accepted |
| 4 | 我變成超人 | off_topic → off_topic | False → True | 0 → 0 | template |
| 5 | 我用魔法讓災害消失 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 6 | 我瞬移到火星 | off_topic → off_topic | False → True | 0 → 0 | regenerated |
| 7 | 我要吃雞排 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 8 | 哈哈哈 | emotion → emotion | False → True | 0 → 0 | accepted |
| 9 | 如果我搭電梯會怎樣？ | question → question | False → False | 0 → 0 | accepted |
| 10 | 我不會搭電梯 | action → clarify | False → False | 0 → 0 | accepted |
| 11 | 我到河邊觀看 | failed → failed | True → True | 0 → 1 | accepted |
| 12 | 我先繼續收拾行李和財物 | environment_change → environment_change | True → True | 0 → 1 | regenerated |
| 13 | 我跳進河裡 | clarify → failed | False → True | 0 → 1 | accepted |
| 14 | 我變成超人 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 15 | 我用魔法讓災害消失 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 16 | 我瞬移到火星 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 17 | 我要吃雞排 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 18 | 哈哈哈 | emotion → emotion | False → True | 0 → 0 | accepted |
| 19 | 如果我到河邊觀看會怎樣？ | question → question | False → False | 0 → 0 | accepted |
| 20 | 我不會到河邊觀看 | action → clarify | False → False | 0 → 0 | accepted |
| 21 | 我強行搬動倒塌物逃生 | failed → failed | True → True | 0 → 1 | accepted |
| 22 | 我一直直播等救援 | clarify → clarify | False → True | 0 → 0 | accepted |
| 23 | 我從倒塌物上爬出去 | clarify → failed | False → True | 0 → 1 | accepted |
| 24 | 我變成超人 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 25 | 我用魔法讓災害消失 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 26 | 我瞬移到火星 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 27 | 我要吃雞排 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 28 | 哈哈哈 | emotion → emotion | False → True | 0 → 0 | accepted |
| 29 | 如果我強行搬動倒塌物逃生會怎樣？ | question → question | False → False | 0 → 0 | accepted |
| 30 | 我不會強行搬動倒塌物逃生 | clarify → clarify | False → False | 0 → 0 | template |
| 31 | 我衝去搭電梯 | failed → failed | True → True | 0 → 1 | regenerated |
| 32 | 我從窗戶跳下去 | clarify → failed | False → True | 0 → 1 | accepted |
| 33 | 我在搖晃時跑到外面 | clarify → failed | False → True | 0 → 1 | template |
| 34 | 我變成超人 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 35 | 我用魔法讓災害消失 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 36 | 我瞬移到火星 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 37 | 我要吃雞排 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 38 | 哈哈哈 | emotion → emotion | False → True | 0 → 0 | accepted |
| 39 | 如果我衝去搭電梯會怎樣？ | question → question | False → False | 0 → 0 | accepted |
| 40 | 我不會衝去搭電梯 | action → clarify | False → False | 0 → 0 | accepted |
| 41 | 我游出去 | clarify → failed | False → True | 0 → 1 | accepted |
| 42 | 我進地下室救車 | failed → failed | True → True | 0 → 1 | accepted |
| 43 | 我開車通過積水 | clarify → failed | False → True | 0 → 1 | accepted |
| 44 | 我變成超人 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 45 | 我用魔法讓災害消失 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 46 | 我瞬移到火星 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 47 | 我要吃雞排 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 48 | 哈哈哈 | emotion → emotion | False → True | 0 → 0 | accepted |
| 49 | 如果我游出去會怎樣？ | question → question | False → False | 0 → 0 | accepted |
| 50 | 我不會游出去 | clarify → clarify | False → False | 0 → 0 | accepted |
| 51 | 我硬闖封閉警戒區 | failed → failed | True → True | 0 → 1 | accepted |
| 52 | 我走溪谷捷徑 | clarify → failed | False → True | 0 → 1 | accepted |
| 53 | 我開過封閉路段 | clarify → clarify | False → True | 0 → 1 | accepted |
| 54 | 我變成超人 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 55 | 我用魔法讓災害消失 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 56 | 我瞬移到火星 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 57 | 我要吃雞排 | off_topic → off_topic | False → True | 0 → 0 | accepted |
| 58 | 哈哈哈 | emotion → emotion | False → True | 0 → 0 | accepted |
| 59 | 如果我硬闖封閉警戒區會怎樣？ | question → question | False → False | 0 → 0 | accepted |
| 60 | 我不會硬闖封閉警戒區 | clarify → clarify | False → False | 0 → 0 | accepted |

### 回歸指令與結果

```powershell
node --test online-coach/test/coach.test.js online-coach/test/diagnosis-regression.test.js online-coach/test/step06.test.js web-pwa/fire-engine-test.js web-pwa/fire-app-test.js web-pwa/scenario-engine-v3-test.js web-pwa/scenario-v3-contract-test.js
node web-pwa/online-browser-test.js
```

Android 在 `android` 目錄配置專案 SDK 與 Gradle 使用者目錄後，執行 `./.tooling/gradle/gradle-8.13/bin/gradle.bat :app:testDebugUnitTest --offline --no-daemon`。JS 35 項、Kotlin 29 項、Chrome 瀏覽器測試腳本均通過。Android 使用 JVM 測試，未執行真機互動。重測後補上的連續提問計數重置只在已累積提問後的後續回合生效，不影響 60 筆單回合樣本。[測試輸出](DIAGNOSIS_STEP_06_TESTS.log)
