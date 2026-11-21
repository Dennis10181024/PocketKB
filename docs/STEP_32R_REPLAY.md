# 真人口吻重播

真實 OpenAI API，直接送入線上教練。句子照題組送出，每句一回合，全程未使用建議句。

重跑指令：`node online-coach/test/human-replay.js --set all`。可指定單組或逗號分隔的組別，例如 `--set A,B,C,D`。

本輪 API 呼叫 37 次。含先前 132 次，累計 169/200（包含理解、敘事及重試）。模型 `gpt-6.1-terra`。
「卡住」按有無完成遊戲目標統計，含有回答但未改變目標的提問。程式會依動作紀錄初判原因，判斷不明的行保留待核對。

| 組別 | 推進 | 已完成 | 確認 | 卡住 | 最長連續卡住 | 不靠建議句到結局 | 結局 | 傷勢 | API 呼叫數 | 評估分布（良好／可接受／次佳／危險／無關） | 重播一致 |
|---|---:|---:|---:|---:|---:|---|---|---|---:|---|---|
| A | 5 | 5 | 0 | 0 | 0 | 是 | SAFE_RESCUE | NONE | 10 | 1／1／8／0／0 | 是 |
| B | 7 | 1 | 0 | 1 | 1 | 是 | SAFE_RESCUE | NONE | 8 | 3／0／5／0／0 | 是 |
| C | 10 | 0 | 0 | 0 | 0 | 是 | SELF_EVACUATION | NONE | 10 | 6／3／1／0／0 | 是 |
| D | 7 | 2 | 0 | 0 | 0 | 是 | SAFE_RESCUE | NONE | 9 | 1／3／5／0／0 | 是 |

## A 組 · 宿舍火災｜使用者原句

JSONL 場次 ID：`16126da9-3fd4-4168-a90e-70f943c38d37`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 評估與命中原則 | 來源 | 驗證 | fallbackReason | 分類與原因 | 危險比對差異 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 我會去把門關起來 並跟小岑說不能開門並找濕毛巾把門縫塞住，然後找濕毛巾摀住自己的口鼻，接著找到教室的對外窗把窗戶打開，大聲向外面呼救 | 手機能打119。我在A棟宿舍五樓503室，房內有我和小岑。 小岑把手收回去，低聲說：「我很怕其他同學還在走廊。」 | npc_dissuade (model) | 良好 · barrier、stop_roommate、seal_gap、signal | model | QUALITY_ASSESSED | — | 推進 · barrier、stop_roommate、seal_gap、signal、isolate、roommate（提前完成） | — |
| 2 | 跟他說，開一條縫也不行，門一定要緊閉。 | 我記得剛才已做過這些，眼前的情況仍在變化。 | — | 次佳 · stop_roommate | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 3 | 把門關起來並找濕毛巾把門縫堵上 | 我記得剛才已做過這些，眼前的情況仍在變化。 | — | 次佳 · barrier、seal_gap | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 4 | 打電話給 119，並跟他說我們的地址跟現在遇到的情況 | 電話接通了。接線員問：「請告訴我樓層和房號、受困人數。」 | — | 可接受 · dial、location、condition | model | QUALITY_ASSESSED | — | 推進 · dial、location、condition、report:address、report:condition | — |
| 5 | 先打 119 跟他們說現在我們遇到的情況，然後待在教室把門關緊、不要亂動，保持冷靜，降低呼吸的頻率以免氧氣消耗太快 | 小岑把手縮回去：「我怕有同學還在走廊。」 | — | 次佳 · dial、barrier、avoid_smoke | model | QUALITY_ASSESSED | — | 推進 · avoid_smoke、report | — |
| 6 | 跟裡面的人說，外面濃煙很重 | 還好我先前已塞好門縫。我聽見消防員隔著房門喊：「503有人嗎？」電話裡請我留在房內回應。 | — | 次佳 | model | QUALITY_ASSESSED | — | 推進 · feelings、smoke_gap（提前完成）、window（提前完成）、battery | — |
| 7 | 把煙的情況告訴 119 接線員 | 我記得剛才已做過這些，眼前的情況仍在變化。 | — | 次佳 · condition | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 8 | 跟她說絕對不行開門 | 我記得剛才已做過這些，眼前的情況仍在變化。 | — | 次佳 · stop_roommate | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 9 | 跟他說不能開門 | 我記得剛才已做過這些，眼前的情況仍在變化。 | — | 次佳 · stop_roommate | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 10 | 堅決不能開門 等待接線員指示 | 我留在房內照指示，電話還接得通。消防員確認了我們的位置，接著接手救援。 | handoff_fire (rule) | 次佳 · wait_inside | model | QUALITY_ASSESSED | — | 推進 · wait | — |

未送出的原始回合：11、12、13、14、15。

## B 組 · 宿舍火災｜口語

JSONL 場次 ID：`3ab0dc53-0b21-485a-a51b-ba394974c45f`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 評估與命中原則 | 來源 | 驗證 | fallbackReason | 分類與原因 | 危險比對差異 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 小岑你先不要開門！外面都是煙，我先把門關緊 | 手機能打119。我在A棟宿舍五樓503室，房內有我和小岑。 小岑把手收回去，低聲說：「我很怕其他同學還在走廊。」 | npc_dissuade (model) | 良好 · stop_roommate、barrier | model | QUALITY_ASSESSED | — | 推進 · stop_roommate、barrier、isolate、roommate（提前完成） | — |
| 2 | 我知道你很擔心他們，但現在出去太危險了，我們先待在房間 | 接線員已收到這次回報。 | — | 次佳 · reassure、ground、avoid_smoke | model | QUALITY_ASSESSED | — | 推進 · reassure、ground、avoid_smoke | — |
| 3 | 我拿浴室的毛巾沾水塞在門下面 | 接線員已收到這次回報。 | — | 次佳 · seal_gap | model | QUALITY_ASSESSED | — | 推進 · seal_gap | — |
| 4 | 打119 | 電話接通了。接線員問：「請告訴我地址與棟別、樓層和房號、受困人數、現場狀況。」 | — | 次佳 · dial | model | QUALITY_ASSESSED | — | 推進 · dial | — |
| 5 | 跟消防說我們在安學路100號A棟五樓503，兩個人困在房間，走廊都是煙 | 還好我先前已塞好門縫。我從室內看向對外窗，窗外目前沒有煙，窗下是五樓高處。 | — | 良好 · location、room、condition | model | QUALITY_ASSESSED | — | 推進 · location、room、condition、report:address、report:room、report:headcount、report:condition、report、feelings（提前完成）、smoke_gap（提前完成） | — |
| 6 | 窗外有煙嗎？ | 接線員說：「窗外現在看不見煙，房門也關好了。可以從房內開窗向外呼救，別翻出窗外。」 | — |  | rule | RULE_ONLY | — | 卡住 · 已回答提問；本回合沒有完成目標 | — |
| 7 | 沒煙的話我就開窗跟下面的人揮手喊救命 | 我聽見消防員隔著房門喊：「503有人嗎？」電話裡請我留在房內回應。 | — | 良好 · signal | model | QUALITY_ASSESSED | — | 推進 · signal、window、battery | — |
| 8 | 門下面好像又有煙跑進來了，我再多塞一條毛巾 | 我記得剛才已做過這些，眼前的情況仍在變化。 | — | 次佳 · seal_gap | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 9 | 手機快沒電了，我先把其他app關掉，電話不要掛 | 我留在房內照指示，電話還接得通。消防員確認了我們的位置，接著接手救援。 | handoff_fire (rule) | 次佳 · save_power、keep_contact | model | QUALITY_ASSESSED | — | 推進 · wait | — |

未送出的原始回合：10、11。

## C 組 · 學校地震｜口語

JSONL 場次 ID：`0c2ebb29-3381-499c-a588-a3b21e4f1b9d`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 評估與命中原則 | 來源 | 驗證 | fallbackReason | 分類與原因 | 危險比對差異 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 地震了！我趕快躲到桌子下面抓住桌腳 | 小維扶著桌沿喊：「我想現在跑出去！」 | — | 良好 · cover、hold | model | QUALITY_ASSESSED | — | 推進 · cover、hold、shaking | — |
| 2 | 小維你不要跑！現在跑出去很危險，先躲桌子下 | 小維留在課桌旁：「我很擔心家裡的人。」 | npc_dissuade (model) | 良好 · stop_classmate | model | QUALITY_ASSESSED | — | 推進 · stop_classmate、classmate | — |
| 3 | 我知道你擔心家人，等地震停了我們再一起聯絡他們 | 桌腳的聲音變小，吊燈仍晃著，老師還沒叫大家起身。 | — | 良好 · reassure、ground | model | QUALITY_ASSESSED | — | 推進 · reassure、ground、worry | — |
| 4 | 等搖晃停下來再說 | 桌腳又敲了一下地板，老師示意先停住。 | — | 可接受 · remain_covered | model | QUALITY_ASSESSED | — | 推進 · remain_covered、main_stop | — |
| 5 | 又在搖了，我繼續躲著保護頭 | 老師說這一側暫時安全。同學坐著，清醒並說腳踝很痛。 | — | 可接受 · cover_again、cover | model | QUALITY_ASSESSED | — | 推進 · cover_again、aftershock | — |
| 6 | 旁邊同學好像受傷了，我先看他傷到哪裡 | 老師已確認指定樓梯可通行，另一側落物還沒清除。 | — | 可接受 · assess | model | QUALITY_ASSESSED | — | 推進 · assess、injured | — |
| 7 | 他手在流血，我拿乾淨的布壓住傷口，然後跟老師說 | 老師已確認指定樓梯可通行，另一側落物還沒清除。 | — | 次佳 · tell_teacher、injuries | model | QUALITY_ASSESSED | — | 推進 · tell_teacher、injuries | — |
| 8 | 老師說可以走了，我跟著老師走樓梯下去，不要走有玻璃的那邊 | 操場上老師拿著班級名冊，正在清點。 | — | 良好 · safe_route、listen_teacher | model | QUALITY_ASSESSED | — | 推進 · safe_route、listen_teacher、evacuate | — |
| 9 | 到操場後跟老師說我們這排人都到了，有一個同學手受傷 | 廣播說教室尚未開放，小維想回去拿手機。 | — | 良好 · where、roster、injuries、tell_teacher | model | QUALITY_ASSESSED | — | 推進 · where、roster、assembly | — |
| 10 | 小維說要回去拿手機，我跟他說不行，等老師說可以再回去 | 我跟著確認過的動線走到集合點。老師喊到我的名字，我回了一聲，也把同學的狀況報給老師。 | stay_assembly (rule) | 良好 · stay_group、stop_return | model | QUALITY_ASSESSED | — | 推進 · return_choice | — |

未送出的原始回合：11。

## D 組 · 宿舍火災｜最新使用者實測

JSONL 場次 ID：`95a982c2-72e7-441e-97b2-d77722a3141b`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 評估與命中原則 | 來源 | 驗證 | fallbackReason | 分類與原因 | 危險比對差異 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 跟小岑說千萬不能開門 並把門關緊 先用手機撥通119 然後找濕毛巾或來堵住門縫跟口鼻<br>並找宿舍的對外窗 將窗戶打開大聲呼救 | 房門和門縫都已隔住，我撥通了119。接線員問：「請告訴我地址與棟別、樓層和房號、受困人數、現場狀況。」 小岑把手收回去，低聲說：「我很怕其他同學還在走廊。」 | npc_dissuade (model) | 良好 · stop_roommate、barrier、dial、seal_gap、signal | model | QUALITY_ASSESSED | — | 推進 · stop_roommate、barrier、dial、seal_gap、signal、isolate、roommate（提前完成） | — |
| 2 | 跟接線員說明現在情況 外面有濃煙 不知道是否還有其他同學在外面<br>同時跟小岑說我們先顧好自己就好 沒有餘力擔心外面的人 | 還好我先前已塞好門縫。我聽見消防員隔著房門喊：「503有人嗎？」電話裡請我留在房內回應。 | — | 可接受 · condition、ground | model | QUALITY_ASSESSED | — | 推進 · condition、ground、report:condition、report、feelings（提前完成）、smoke_gap（提前完成）、window（提前完成）、battery | — |
| 3 | 打電話給119 | 我記得剛才已做過這些，眼前的情況仍在變化。 | — | 次佳 · dial | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 4 | 跟接線員說明現在的地址跟發生的處境 | 我補報了地址與棟別。我聽見消防員隔著房門喊：「503有人嗎？」電話裡請我留在房內回應。 | — | 次佳 · location、condition | model | QUALITY_ASSESSED | — | 推進 · location、report:address | — |
| 5 | 5樓 503 | 我補報了樓層和房號。我聽見消防員隔著房門喊：「503有人嗎？」電話裡請我留在房內回應。 | — | 可接受 · room | model | QUALITY_ASSESSED | — | 推進 · room、report:room | — |
| 6 | 回復2人 | 我補報了受困人數。我聽見消防員隔著房門喊：「503有人嗎？」電話裡請我留在房內回應。 | — | 次佳 · condition | model | QUALITY_ASSESSED | — | 推進 · report:headcount | — |
| 7 | 用濕布堵住門縫 | 我記得剛才已做過這些，眼前的情況仍在變化。 | — | 次佳 · seal_gap | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 8 | 開啟省電模式 盡可能延長手機撥通時間 | 我聽見消防員隔著房門喊：「503有人嗎？」電話裡請我留在房內回應。 | — | 次佳 · save_power | model | QUALITY_ASSESSED | — | 推進 · save_power | — |
| 9 | 依照指示留在房間內 | 我留在房內照指示，電話還接得通。消防員確認了我們的位置，接著接手救援。 | handoff_fire (rule) | 可接受 · wait_inside | model | QUALITY_ASSESSED | — | 推進 · wait | — |

未送出的原始回合：10、11、12、13。

## 欄位與重播判讀

- A–D 為第三輪完整驗收。表中的「已完成」表示記憶承接的回合，未要求重做。D1 在一次回覆內關門、勸阻、撥通119、塞縫與向窗外求援；D2 完成通報階段並承接先前已完成的塞縫與窗邊求援；D3 重提撥號、D7 重提塞縫，均保留先前結果。D5、D6 完成補報，直到 D9 表示依指示留在房內才成立接手。D11–D13 未送出，當時已終局；D13 的文字原是建議句，沒有用於達成結局。
- 複核通報只追問一次。後續可以補資料，缺漏進入回顧。A 在到達結局時仍缺房號及人數，已記入回顧。
- 用每回合的評估類別、經驗證命中的原則與欄位，以及危險子類型重播。A–D 的最終結局、傷勢、暴露與評估歷程全部一致。純文字證據不參與重播。
- 安全差異案例：第二輪 C2 的「現在跑出去很危險」曾被原文規則誤認為玩家下一步，GPT 判為良好。收緊規則後，第三輪 C2 正確識別勸阻，並以無傷自行撤離結束。第三輪 A–D 與第二輪 E 均無 GPT 與原文危險規則不一致。另有本機回歸驗證 GPT 判良好時，原文的實際危險仍優先執行。
- E 為第二輪的 34 次真實 API 評估。良好 19、可接受 15、次佳 0、危險 0、無關 0。第三輪針對完整對話重跑 A–D；E 保留第二輪逐題實測。總呼叫數包含三輪，61＋71＋37＝169。

## E 組 · 每決策點的兩句異詞同義

通過 34/34，以真實模型判為良好或可接受為準。

| 劇本 | 決策點 | 輸入 | 評估 | 命中原則 | 危險比對差異 |
|---|---|---|---|---|---|
| drill_fire_dorm | isolate | 把開口合上，讓走廊的煙留在外面。 | good | barrier | — |
| drill_fire_dorm | isolate | 我扳回那片門板，讓它確實扣進門框。 | good | barrier | — |
| drill_fire_dorm | roommate | 我叫她把手從門把收回來，別讓煙進來。 | acceptable | stop_roommate | — |
| drill_fire_dorm | roommate | 我攔住小岑，說那條縫不能再拉大。 | acceptable | stop_roommate | — |
| drill_fire_dorm | report | 我聯絡消防救援，報安學路100號A棟五樓503，兩個人被煙困住。 | acceptable | location、room、condition | — |
| drill_fire_dorm | report | 我撥119說安學路100號的A棟，503在五樓，我跟室友都在，走道煙很重。 | good | dial、location、room、condition | — |
| drill_fire_dorm | feelings | 我跟她說我也理解她掛念朋友，我會在這陪她。 | acceptable | reassure | — |
| drill_fire_dorm | feelings | 我聽她把擔心說完，告訴她我們可以把走廊的情形交給救援隊。 | good | reassure、ground | — |
| drill_fire_dorm | smoke_gap | 我把身邊的衣料壓進門底漏煙的地方。 | acceptable | seal_gap | — |
| drill_fire_dorm | smoke_gap | 我用衣物把關緊的門和地板間的空隙填起來。 | acceptable | seal_gap | — |
| drill_fire_dorm | window | 我留在房裡，靠玻璃處朝樓下舉起衣服讓人看見。 | good | signal、wait_inside | — |
| drill_fire_dorm | window | 我待在房間裡，先看看玻璃外有沒有煙，再從室內向下方比手勢。 | good | check_window、signal | — |
| drill_fire_dorm | battery | 我先不結束這通電話，把手機留給救援聯繫。 | acceptable | keep_contact | — |
| drill_fire_dorm | battery | 我把用不著的程式都收掉，手機繼續留在通話畫面。 | good | save_power、keep_contact | — |
| drill_fire_dorm | wait | 我待在原地，聽門外的人叫我怎麼配合。 | acceptable | wait_inside | — |
| drill_fire_dorm | wait | 我跟門外回一聲，照他們的話留在房間等接手。 | good | handoff、wait_inside | — |
| earthquake_school | shaking | 我縮到課桌底，用手臂護住頭，再扣著桌腳。 | good | cover、hold | — |
| earthquake_school | shaking | 我壓低身子鑽進桌下，雙手扶牢桌腿，頭不要露出去。 | good | cover、hold | — |
| earthquake_school | classmate | 我叫小維先別離開桌下，外頭還在搖。 | good | stop_classmate | — |
| earthquake_school | classmate | 我大聲請他穩住，留在課桌底下，不要往走廊去。 | acceptable | stop_classmate | — |
| earthquake_school | worry | 我知道他惦記家裡，我說等安全了可以一起想怎麼聯絡。 | acceptable | ground | — |
| earthquake_school | worry | 我先聽他說完，告訴他現在有人陪他一起等。 | acceptable | reassure | — |
| earthquake_school | main_stop | 我在原來躲的位置待著，等地面不再晃。 | acceptable | remain_covered | — |
| earthquake_school | main_stop | 我先護著後腦，等老師確認才站起來。 | acceptable | cover、listen_teacher | — |
| earthquake_school | aftershock | 我又縮回課桌下，把頭頸包住，手抓住支撐物。 | good | cover_again、stay_stable、cover、hold | — |
| earthquake_school | aftershock | 地板又動了，我就地蹲低往掩護靠，不急著走。 | acceptable | cover_again | — |
| earthquake_school | injured | 我從安全處問他能不能回話，把腳痛的情形喊給老師。 | good | assess、tell_teacher | — |
| earthquake_school | injured | 我沒有拉他起來，跟校護說前方坐著的同學在喊痛。 | acceptable | no_move、tell_teacher | — |
| earthquake_school | evacuate | 我走老師確認過的那側樓梯，避開還有碎玻璃的走道。 | good | safe_route | — |
| earthquake_school | evacuate | 我隨班排隊從老師帶的方向下樓，和前面的人留一點空間。 | good | safe_route、spacing | — |
| earthquake_school | assembly | 我跟拿名冊的老師應聲，說這排同學都到操場了。 | good | roster、where | — |
| earthquake_school | assembly | 我把班上的到場人數和有同學需要校護的情形告訴帶隊老師。 | good | roster、injuries、tell_teacher | — |
| earthquake_school | return_choice | 我勸他先留在集合區，等廣播說能進去再處理手機。 | good | stay_group、stop_return | — |
| earthquake_school | return_choice | 我不跟著回教室，在操場等老師通知，提醒小維也先留下。 | good | stay_group、stop_return | — |
