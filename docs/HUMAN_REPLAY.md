# 真人口吻重播

真實 OpenAI API，直接送入線上教練。句子照題組送出，每句一回合，全程未使用建議句。

重跑指令：`node online-coach/test/human-replay.js --set all`。單組可將 `all` 換成 `A`、`B` 或 `C`。

本輪 API 呼叫 37 次。含先前 93 次，累計 130/150（包含理解、敘事及重試）。模型 `gpt-6.1-terra`。
「卡住」按有無完成遊戲目標統計，含有回答但未改變目標的提問。程式會依動作紀錄初判原因，判斷不明的行保留待核對。

| 組別 | 推進 | 已完成 | 確認 | 卡住 | 最長連續卡住 | 不靠建議句到結局 | 結局 | 傷勢 | API 呼叫數 |
|---|---:|---:|---:|---:|---:|---|---|---|---:|
| A | 5 | 8 | 0 | 1 | 1 | 否 | — | — | 14 |
| B | 8 | 1 | 0 | 1 | 1 | 是 | SAFE_RESCUE | NONE | 10 |
| C | 10 | 0 | 0 | 0 | 0 | 是 | SELF_EVACUATION | NONE | 13 |

## A 組 · 宿舍火災｜使用者原句

JSONL 場次 ID：`b62fbfe8-2f83-4034-91c6-8b11ac13a863`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 模型信心、角色確認及驗證結果 | 來源 | 驗證 | fallbackReason | 分類與原因 |
|---:|---|---|---|---|---|---|---|---|
| 1 | 我會去把門關起來 並跟小岑說不能開門並找濕毛巾把門縫塞住，然後找濕毛巾摀住自己的口鼻，接著找到教室的對外窗把窗戶打開，大聲向外面呼救 | 我看見緊閉的房門。小岑點點頭，把手從門邊收回。我把房門關緊。我用手邊的濕毛巾塞住門縫。我用濕毛巾遮住口鼻，煙仍有毒。我留在房內，向窗外喊話求救。我手上的手機還能聯絡119。小岑把手收回去，低聲說：「我很怕其他同學還在走廊。」 | close (model)、seal (model)、towel_face (model)、open_window_call (model)、npc_dissuade (model) | close high／確認否／ACCEPTED、npc_dissuade high／確認否／ACCEPTED、seal high／確認否／ACCEPTED、towel_face high／確認否／ACCEPTED、open_window_call high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · npc_handled、close、seal、towel_face、open_window_call |
| 2 | 跟他說，開一條縫也不行，門一定要緊閉。 | 我看見手機還有訊號。小岑記得我的提醒，手仍離開門把。我手上的手機還能聯絡119。走廊的煙變濃，房門外的能見度下降。接線員需要受困的位置。 | — | npc_dissuade high／確認否／ACCEPTED | model | ACCEPTED | — | 已完成 · 勸阻或動作目標先前已完成 |
| 3 | 把門關起來並找濕毛巾把門縫堵上 | 我看得見對外窗。房門已經關緊，我沒有再次開門。毛巾已塞在門縫，仍貼著門底。我手上的手機還能聯絡119。手機在我手邊，我要怎麼讓外面的人知道這裡的情況？ | — | close high／確認否／ALREADY_COMPLETE、seal high／確認否／ALREADY_COMPLETE | model | MODEL_NO_ACTION | — | 已完成 · 勸阻或動作目標先前已完成 |
| 4 | 打電話給 119，並跟他說我們的地址跟現在遇到的情況 | 我看見緊閉的房門。電話接通，接線員回了我一聲。我把畫面上宿舍的地址報給接線員。我說明走廊已有濃煙、我們還受困在房內。接線員問：「在幾樓、哪一間？」門外能見度繼續下降，走廊仍不能視為安全路線。 | call (model)、address (model)、smoke_report (model) | call high／確認否／ACCEPTED、address high／確認否／ACCEPTED、smoke_report high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · call、address、smoke_report |
| 5 | 先打 119 跟他們說現在我們遇到的情況，然後待在教室把門關緊、不要亂動，保持冷靜，降低呼吸的頻率以免氧氣消耗太快 | 我看見手機還有訊號。電話仍接通。接線員已記下濃煙與受困情況。房門已經關緊，我沒有再次開門。我留在房內等候，手機還留在手邊。我沒有刻意憋氣或放慢呼吸來省氧。接線員問：「在幾樓、哪一間？」接線員需要受困的位置。 | wait (model) | call high／確認否／ALREADY_COMPLETE、smoke_report high／確認否／ALREADY_COMPLETE、wait high／確認否／ACCEPTED、close high／確認否／ALREADY_COMPLETE | model | ACCEPTED | — | 推進 · wait |
| 6 | 跟裡面的人說，外面濃煙很重 | 我看得見對外窗。我的話是對房內的人說的；電話那頭還沒聽到這段話。接線員問：「在幾樓、哪一間？」手機在我手邊，我要怎麼讓外面的人知道這裡的情況？ | — | — | model | MODEL_NO_ACTION | — | 卡住 · 模型未提出動作（MODEL_NO_ACTION）；是否屬劇本缺項需查對原句 |
| 7 | 把煙的情況告訴 119 接線員 | 我看見緊閉的房門。接線員已記下濃煙與受困情況。接線員問：「在幾樓、哪一間？」 | — | smoke_report high／確認否／ALREADY_COMPLETE | model | MODEL_NO_ACTION | — | 已完成 · 勸阻或動作目標先前已完成 |
| 8 | 跟她說絕對不行開門 | 我看見手機還有訊號。小岑記得我的提醒，手仍離開門把。接線員問：「在幾樓、哪一間？」接線員需要受困的位置。 | — | npc_dissuade high／確認否／ACCEPTED | model | ACCEPTED | — | 已完成 · 勸阻或動作目標先前已完成 |
| 9 | 跟他說不能開門 | 我看得見對外窗。小岑記得我的提醒，手仍離開門把。接線員問：「在幾樓、哪一間？」手機在我手邊，我要怎麼讓外面的人知道這裡的情況？ | — | npc_dissuade high／確認否／ACCEPTED | model | ACCEPTED | — | 已完成 · 勸阻或動作目標先前已完成 |
| 10 | 堅決不能開門 等待接線員指示 | 我看見緊閉的房門。小岑記得我的提醒，手仍離開門把。接線員問：「在幾樓、哪一間？」 | — | npc_dissuade high／確認否／ACCEPTED、wait high／確認否／ALREADY_COMPLETE | model | ACCEPTED | — | 已完成 · 勸阻或動作目標先前已完成 |
| 11 | 我知道你擔心他們，我會陪著你 | 接線員問：「在幾樓、哪一間？」我聽見小岑用比較平穩的聲音回了我一聲。 | emotion_supportive (model) | — | model | MODEL_NO_ACTION | — | 推進 · emotion_supportive |
| 12 | 我確認窗外有沒有煙 | 我看見手機還有訊號。我從室內查看窗外的煙況。接線員問：「在幾樓、哪一間？」接線員需要受困的位置。 | inspect_window (model) | inspect_window high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · inspect_window |
| 13 | 窗外沒煙就開窗揮衣服求救 | 我看見緊閉的房門。接線員問：「在幾樓、哪一間？」手機在我手邊，我要怎麼讓外面的人知道這裡的情況？ | — | open_window_call high／確認否／ALREADY_COMPLETE | model | MODEL_NO_ACTION | — | 已完成 · 勸阻或動作目標先前已完成 |
| 14 | 等消防員來，配合他們的指示 | 我看得見對外窗。接線員問：「在幾樓、哪一間？」 | — | wait high／確認否／ALREADY_COMPLETE | model | MODEL_NO_ACTION | — | 已完成 · 勸阻或動作目標先前已完成 |

## B 組 · 宿舍火災｜口語

JSONL 場次 ID：`da40f650-cd4b-46a1-b7d7-4fb7c7877b5b`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 模型信心、角色確認及驗證結果 | 來源 | 驗證 | fallbackReason | 分類與原因 |
|---:|---|---|---|---|---|---|---|---|
| 1 | 小岑你先不要開門！外面都是煙，我先把門關緊 | 我看見緊閉的房門。小岑點點頭，把手從門邊收回。我把房門關緊。我手上的手機還能聯絡119。房門關上後，我仍在 A 棟五樓503室，手機還有訊號。小岑把手收回去，低聲說：「我很怕其他同學還在走廊。」接線員需要受困的位置。 | close (model)、npc_dissuade (model) | npc_dissuade high／確認否／ACCEPTED、close high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · npc_handled、close |
| 2 | 我知道你很擔心他們，但現在出去太危險了，我們先待在房間 | 我留在房內等候，手機還留在手邊。我手上的手機還能聯絡119。我聽見小岑用比較平穩的聲音回了我一聲。 | wait (model)、emotion_supportive (model) | wait high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · wait、emotion_supportive |
| 3 | 我拿浴室的毛巾沾水塞在門下面 | 我看得見對外窗。我用手邊的濕毛巾塞住門縫。我手上的手機還能聯絡119。走廊的煙變濃，房門外的能見度下降。手機在我手邊，我要怎麼讓外面的人知道這裡的情況？ | seal (model) | seal high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · seal |
| 4 | 打119 | 我看見緊閉的房門。電話接通，接線員回了我一聲。接線員問：「宿舍在哪條路，幾號？」接線員需要受困的位置。 | call (model) | call high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · call |
| 5 | 跟消防說我們在安學路100號A棟五樓503，兩個人困在房間，走廊都是煙 | 我看得見窗外的燈光。我把畫面上宿舍的地址報給接線員。接線員記下五樓503室。我回報房裡有兩人。我說明走廊已有濃煙、我們還受困在房內。我隔著對外窗看見樓下的燈光，沒有看到窗外飄煙。門外能見度繼續下降，走廊仍不能視為安全路線。 | address (model)、room (model)、headcount (model)、smoke_report (model) | address high／確認否／ACCEPTED、room high／確認否／ACCEPTED、headcount high／確認否／ACCEPTED、smoke_report high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · address、room、headcount、smoke_report |
| 6 | 窗外有煙嗎？ | 接線員說：「窗外現在看不見煙，房門也關好了。可以從房內開窗向外呼救，別翻出窗外。」 | — | — | rule | RULE_ONLY | — | 卡住 · 已回答提問；本回合沒有完成目標 |
| 7 | 沒煙的話我就開窗跟下面的人揮手喊救命 | 我看見電池圖示剩一格。我留在房內，向窗外喊話求救。我看見手機跳出低電量提示，電話那頭仍在確認房內狀況。我怎麼安排手上的手機？ | open_window_call (model) | open_window_call high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · open_window_call |
| 8 | 門下面好像又有煙跑進來了，我再多塞一條毛巾 | 我把注意力拉回眼前。毛巾已塞在門縫，仍貼著門底。 | — | seal high／確認否／ALREADY_COMPLETE | model | MODEL_NO_ACTION | — | 已完成 · 勸阻或動作目標先前已完成 |
| 9 | 手機快沒電了，我先把其他app關掉，電話不要掛 | 我聽見消防員喊出房號。我把電話保持在可以聯絡的狀態。我聽見消防員喊出503，電話裡請我們留在房內回應。我現在怎麼配合？ | hold_line (model) | hold_line high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · hold_line |
| 10 | 消防員到了，我大聲回應他們我們在這裡 | 門外的警報還響著，我聽見消防員叫出房號。我回了一聲，他們確認了我們的位置並接手。 | handoff_fire (model) | handoff_fire high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · handoff_fire |

## C 組 · 學校地震｜口語

JSONL 場次 ID：`796839a1-fb0a-4673-9dc3-0db44ecf30ab`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 模型信心、角色確認及驗證結果 | 來源 | 驗證 | fallbackReason | 分類與原因 |
|---:|---|---|---|---|---|---|---|---|
| 1 | 地震了！我趕快躲到桌子下面抓住桌腳 | 我躲進桌下，抓住桌腳，聽見小維在桌子另一側喊話。我還感覺得到地板在晃。小維撐住桌緣喊：「我想現在跑出去！」我聽見小維又問：「現在就往外跑，好不好？」 | drop_cover_hold (model) | drop_cover_hold high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · drop_cover_hold |
| 2 | 小維你不要跑！現在跑出去很危險，先躲桌子下 | 我聽見小維說話的聲音發緊。小維聽到我的聲音，留在課桌旁。燈具繼續晃動，廣播提醒學生依教師指示。小維留在原處，聲音發緊：「我好擔心家裡的人。」我怎麼回應他？ | npc_dissuade (model) | npc_dissuade high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · npc_handled |
| 3 | 我知道你擔心家人，等地震停了我們再一起聯絡他們 | 桌腳的聲音變小，但吊燈仍在動。老師還沒叫大家起身。小維沉默了片刻，再接上我的話。 | emotion_supportive (model) | — | model | MODEL_NO_ACTION | — | 推進 · emotion_supportive |
| 4 | 等搖晃停下來再說 | 我正準備起身，桌腳又敲了一下地板，老師示意先停住。我感到地板又晃了一下，便停在原處。 | wait_stop (model) | wait_stop high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · wait_stop |
| 5 | 又在搖了，我繼續躲著保護頭 | 我聽見同學說腳踝疼。餘震掩護直到停止。我聽見老師說這一側暫時安全，有一位同學清醒，坐在旁邊說腳踝很痛。廣播更新，仍需由校方確認指定動線。我怎麼回應身旁的同學？ | aftershock_cover (model) | aftershock_cover high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · aftershock_cover |
| 6 | 旁邊同學好像受傷了，我先看他傷到哪裡 | 我把注意力拉回眼前。我從這裡看見同學清醒，坐著說腳踝痛。 | assess_classmate (model) | assess_classmate high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · assess_classmate |
| 7 | 他手在流血，我拿乾淨的布壓住傷口，然後跟老師說 | 我看見指定樓梯上的隊伍。我告訴老師有同學受傷，讓老師和校護確認狀況。我聽見老師說前方動線有落物，另一側指定樓梯已確認，老師正帶隊。我要選哪一條路？ | check_injured (model) | check_injured high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · check_injured |
| 8 | 老師說可以走了，我跟著老師走樓梯下去，不要走有玻璃的那邊 | 我聽見老師喊班級和名字。老師問：「你是哪一班？」我到了操場的二年二班集合區。老師要同學報到，並問有沒有人受傷。我準備向老師說什麼？ | follow_stairs (model) | follow_stairs high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · follow_stairs |
| 9 | 到操場後跟老師說我們這排人都到了，有一個同學手受傷 | 我聽見廣播說教室還沒開放。老師核對我回報的隊伍，記下是二年二班。老師確認我們到了操場集合區。我回報有一位同學受傷，由老師核對傷勢。我聽見廣播說教室尚未開放，有同學問能不能回去拿自己的東西。 | school_class (model)、school_location (model)、school_injury (model) | school_location high／確認否／ACCEPTED、school_class high／確認否／ACCEPTED、school_injury high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · school_class、school_location、school_injury |
| 10 | 小維說要回去拿手機，我跟他說不行，等老師說可以再回去 | 我跟著確認過的動線走到集合點。老師喊到我的名字，我回了一聲，也把同學的狀況報給老師。 | stay_assembly (model) | npc_dissuade high／確認否／ACCEPTED、stay_assembly high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · stay_assembly |

## 原三組重播人工核對

- A6「跟裡面的人說，外面濃煙很重」的收話對象在房內，敘事已說明接線員沒有收到這段話，因此沒有填寫119欄位或新增目標。A 組結束時已通報地址與受困現況，接線員仍在等樓層／房號和人數。題組後續沒有補上，停在通報節點。這兩個欄位維持由玩家回報，避免把場景背景當成接線員已收到的資訊。[消防署119報案要領](https://www.nfa.gov.tw/cht/index.php?code=list&ids=68)
- B6 問窗外有沒有煙，接線員依場景回答，沒有完成新目標，所以按這次驗收分類計入一筆卡住。接續的 B7 執行開窗求援，B10 無傷獲救。B11 因終局未送出。B1 三輪均執行勸阻與關門。
- C9 補齊本班、集合地點及有人受傷的回報。傷勢由老師查證，未把玩家提到的手傷當作已確認的場景事實。C10 依等老師許可的意圖留在集合區，無傷撤離。C11 因終局未送出。[師大附中地震避難掩護疏散演練計畫](https://www.hs.ntnu.edu.tw/static/webroot/G162269152981136/application/NW175800402062082.pdf)
- 第二輪驗出 C9 位置漏填、C11 被送去確認。第三輪讓已到操場的玩家可以直接回報集合點，也補上同一句先完成回報、再等待老師的回歸案例。三輪合計 56＋37＋37＝130 次 API 呼叫。
- 線上教練 JS 79/79、Web 引擎 32/32、Kotlin 45/45，以及兩套既有 Web 瀏覽器測試通過。宿舍火災舊版基線 38/38，既有危險回歸無漏判。
- 3.1b 檢查點為 `5452ed3`。A 組未達到結局，因此 3.1c 保留於工作區，未建立 commit。

## A 組補句驗收

原三組驗收結果保留在上方。這次只重跑 A 組，原有 14 句保持不變，末尾加入「五樓503，我們兩個人」。全程未使用建議句。

A15 以高信心採用 room 與 headcount，完整結束通報。關門、塞縫、安撫與窗邊求援等已完成的目標被保留，劇情直接進到「手機電量與通訊」。題組在此用完；維持通訊和回應消防員接手的兩個決策尚未完成，因此仍未到結局。已停在提交前，3.1c 沒有建立 commit。

真實 OpenAI API，直接送入線上教練。句子照題組送出，每句一回合，全程未使用建議句。

重跑指令：`node online-coach/test/human-replay.js --set all`。單組可將 `all` 換成 `A`、`B` 或 `C`。

本輪 API 呼叫 15 次。含先前 0 次，累計 15/30（包含理解、敘事及重試）。模型 `gpt-6.1-terra`。
「卡住」按有無完成遊戲目標統計，含有回答但未改變目標的提問。程式會依動作紀錄初判原因，判斷不明的行保留待核對。

| 組別 | 推進 | 已完成 | 確認 | 卡住 | 最長連續卡住 | 不靠建議句到結局 | 結局 | 傷勢 | API 呼叫數 |
|---|---:|---:|---:|---:|---:|---|---|---|---:|
| A | 6 | 8 | 0 | 1 | 1 | 否 | — | — | 15 |

## A 組 · 宿舍火災｜使用者原句

JSONL 場次 ID：`3517a9ac-d135-4578-a627-6715b534a65a`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 模型信心、角色確認及驗證結果 | 來源 | 驗證 | fallbackReason | 分類與原因 |
|---:|---|---|---|---|---|---|---|---|
| 1 | 我會去把門關起來 並跟小岑說不能開門並找濕毛巾把門縫塞住，然後找濕毛巾摀住自己的口鼻，接著找到教室的對外窗把窗戶打開，大聲向外面呼救 | 我看見緊閉的房門。小岑點點頭，把手從門邊收回。我把房門關緊。我用手邊的濕毛巾塞住門縫。我用濕毛巾遮住口鼻，煙仍有毒。我留在房內，向窗外喊話求救。我手上的手機還能聯絡119。小岑把手收回去，低聲說：「我很怕其他同學還在走廊。」 | close (model)、seal (model)、towel_face (model)、open_window_call (model)、npc_dissuade (model) | close high／確認否／ACCEPTED、npc_dissuade high／確認否／ACCEPTED、seal high／確認否／ACCEPTED、towel_face high／確認否／ACCEPTED、open_window_call high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · npc_handled、close、seal、towel_face、open_window_call |
| 2 | 跟他說，開一條縫也不行，門一定要緊閉。 | 我看見手機還有訊號。小岑記得我的提醒，手仍離開門把。我手上的手機還能聯絡119。走廊的煙變濃，房門外的能見度下降。接線員需要受困的位置。 | — | npc_dissuade high／確認否／ACCEPTED | model | ACCEPTED | — | 已完成 · 勸阻或動作目標先前已完成 |
| 3 | 把門關起來並找濕毛巾把門縫堵上 | 我看得見對外窗。房門已經關緊，我沒有再次開門。毛巾已塞在門縫，仍貼著門底。我手上的手機還能聯絡119。手機在我手邊，我要怎麼讓外面的人知道這裡的情況？ | — | close high／確認否／ALREADY_COMPLETE、seal high／確認否／ALREADY_COMPLETE | model | MODEL_NO_ACTION | — | 已完成 · 勸阻或動作目標先前已完成 |
| 4 | 打電話給 119，並跟他說我們的地址跟現在遇到的情況 | 我看見緊閉的房門。電話接通，接線員回了我一聲。我把畫面上宿舍的地址報給接線員。我說明走廊已有濃煙、我們還受困在房內。接線員問：「在幾樓、哪一間？」門外能見度繼續下降，走廊仍不能視為安全路線。 | call (model)、address (model)、smoke_report (model) | call high／確認否／ACCEPTED、address high／確認否／ACCEPTED、smoke_report high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · call、address、smoke_report |
| 5 | 先打 119 跟他們說現在我們遇到的情況，然後待在教室把門關緊、不要亂動，保持冷靜，降低呼吸的頻率以免氧氣消耗太快 | 我看見手機還有訊號。電話仍接通。接線員已記下濃煙與受困情況。房門已經關緊，我沒有再次開門。我留在房內等候，手機還留在手邊。我沒有刻意憋氣或放慢呼吸來省氧。接線員問：「在幾樓、哪一間？」接線員需要受困的位置。 | wait (model) | call high／確認否／ALREADY_COMPLETE、smoke_report high／確認否／ALREADY_COMPLETE、wait high／確認否／ACCEPTED、close high／確認否／ALREADY_COMPLETE | model | ACCEPTED | — | 推進 · wait |
| 6 | 跟裡面的人說，外面濃煙很重 | 我看得見對外窗。我的話是對房內的人說的；電話那頭還沒聽到這段話。接線員問：「在幾樓、哪一間？」手機在我手邊，我要怎麼讓外面的人知道這裡的情況？ | — | — | model | MODEL_NO_ACTION | — | 卡住 · 模型未提出動作（MODEL_NO_ACTION）；是否屬劇本缺項需查對原句 |
| 7 | 把煙的情況告訴 119 接線員 | 我看見緊閉的房門。接線員已記下濃煙與受困情況。接線員問：「在幾樓、哪一間？」 | — | smoke_report high／確認否／ALREADY_COMPLETE | model | MODEL_NO_ACTION | — | 已完成 · 勸阻或動作目標先前已完成 |
| 8 | 跟她說絕對不行開門 | 我看見手機還有訊號。小岑記得我的提醒，手仍離開門把。接線員問：「在幾樓、哪一間？」接線員需要受困的位置。 | — | npc_dissuade high／確認否／ACCEPTED | model | ACCEPTED | — | 已完成 · 勸阻或動作目標先前已完成 |
| 9 | 跟他說不能開門 | 我看得見對外窗。小岑記得我的提醒，手仍離開門把。接線員問：「在幾樓、哪一間？」手機在我手邊，我要怎麼讓外面的人知道這裡的情況？ | — | npc_dissuade high／確認否／ACCEPTED | model | ACCEPTED | — | 已完成 · 勸阻或動作目標先前已完成 |
| 10 | 堅決不能開門 等待接線員指示 | 我看見緊閉的房門。小岑記得我的提醒，手仍離開門把。接線員問：「在幾樓、哪一間？」 | — | npc_dissuade high／確認否／ACCEPTED、wait high／確認否／ALREADY_COMPLETE | model | ACCEPTED | — | 已完成 · 勸阻或動作目標先前已完成 |
| 11 | 我知道你擔心他們，我會陪著你 | 接線員問：「在幾樓、哪一間？」我聽見小岑用比較平穩的聲音回了我一聲。 | emotion_supportive (model) | — | model | MODEL_NO_ACTION | — | 推進 · emotion_supportive |
| 12 | 我確認窗外有沒有煙 | 我看見手機還有訊號。我從室內查看窗外的煙況。接線員問：「在幾樓、哪一間？」接線員需要受困的位置。 | inspect_window (model) | inspect_window high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · inspect_window |
| 13 | 窗外沒煙就開窗揮衣服求救 | 我看見緊閉的房門。接線員問：「在幾樓、哪一間？」手機在我手邊，我要怎麼讓外面的人知道這裡的情況？ | — | open_window_call high／確認否／ALREADY_COMPLETE | model | MODEL_NO_ACTION | — | 已完成 · 勸阻或動作目標先前已完成 |
| 14 | 等消防員來，配合他們的指示 | 我看得見對外窗。接線員問：「在幾樓、哪一間？」 | — | wait high／確認否／ALREADY_COMPLETE | model | MODEL_NO_ACTION | — | 已完成 · 勸阻或動作目標先前已完成 |
| 15 | 五樓503，我們兩個人 | 我看見電池圖示剩一格。接線員記下五樓503室。我回報房裡有兩人。我看見手機跳出低電量提示，電話那頭仍在確認房內狀況。我怎麼安排手上的手機？ | room (model)、headcount (model) | room high／確認否／ACCEPTED、headcount high／確認否／ACCEPTED | model | ACCEPTED | — | 推進 · room、headcount |

## 後續敘事待辦

逐項交代執行結果時，敘事讀起來偏條列化；許多回合反覆以「我看見緊閉的房門」「我看見手機還有訊號」「我看得見對外窗」開頭。這次只記錄觀察，未調整敘事。
