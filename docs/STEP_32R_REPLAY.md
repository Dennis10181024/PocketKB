# 真人口吻重播

真實 OpenAI API，直接送入線上教練。句子照題組送出，每句一回合，全程未使用建議句。

重跑指令：`node online-coach/test/human-replay.js --set all`。可指定單組或逗號分隔的組別，例如 `--set A,B,C,D`。

本輪 API 呼叫 43 次。含先前 0 次，累計 43/200（包含理解、敘事及重試）。模型 `gpt-6.1-terra`。
「卡住」按有無完成遊戲目標統計，含有回答但未改變目標的提問。程式會依動作紀錄初判原因，判斷不明的行保留待核對。

| 組別 | 推進 | 已完成 | 確認 | 卡住 | 最長連續卡住 | 不靠建議句到結局 | 結局 | 傷勢 | API 呼叫數 | 評估分布（良好／可接受／次佳／危險／無關） | 重播一致 |
|---|---:|---:|---:|---:|---:|---|---|---|---:|---|---|
| A | 8 | 6 | 0 | 1 | 1 | 否 | — | — | 15 | 8／0／0／0／1／6 | 是 |
| B | 8 | 1 | 0 | 1 | 1 | 是 | SAFE_RESCUE | NONE | 9 | 8／0／0／0／0／1 | 是 |
| C | 10 | 0 | 0 | 0 | 0 | 是 | SELF_EVACUATION | NONE | 10 | 10／0／0／0／0／0 | 是 |
| D | 9 | 0 | 0 | 0 | 0 | 是 | SAFE_RESCUE | NONE | 9 | 8／0／0／0／0／1 | 是 |

## A 組 · 宿舍火災｜使用者原句

JSONL 場次 ID：`375c6e23-325d-4ebc-aeda-7fbe995e039c`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 評估與命中原則 | 來源 | 驗證 | fallbackReason | 分類與原因 | 危險比對差異 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 我會去把門關起來 並跟小岑說不能開門並找濕毛巾把門縫塞住，然後找濕毛巾摀住自己的口鼻，接著找到教室的對外窗把窗戶打開，大聲向外面呼救 | 我把房門推緊，門鎖喀一聲扣上，走廊的煙被擋在外面。小岑的手停在門把前，慢慢收了回去。我把濕毛巾壓進門縫，用腳把它踩實。手機能打119。我在A棟宿舍五樓503室，房內有我和小岑。 小岑把手收回去，低聲說：「我很怕其他同學還在走廊。」 | npc_dissuade (model) | 良好 · barrier、stop_roommate、seal_gap、signal | model | QUALITY_ASSESSED | — | 推進 · barrier、stop_roommate、seal_gap、signal、isolate、roommate（提前完成） | — |
| 2 | 跟他說，開一條縫也不行，門一定要緊閉。 | 小岑一直離門把遠遠的。 | — | 重複（不評分） · stop_roommate | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 3 | 把門關起來並找濕毛巾把門縫堵上 | 房門還緊緊關著。 | — | 重複（不評分） · barrier、seal_gap | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 4 | 打電話給 119，並跟他說我們的地址跟現在遇到的情況 | 電話接通了，接線員的聲音傳了過來。接線員問：「請告訴我地址與棟別、樓層和房號、受困人數、現場狀況。」 | — | 良好 · dial、location、condition | model | QUALITY_ASSESSED | — | 推進 · dial、location、condition | — |
| 5 | 先打 119 跟他們說現在我們遇到的情況，然後待在教室把門關緊、不要亂動，保持冷靜，降低呼吸的頻率以免氧氣消耗太快 | 我退回房間裡側，離門口遠一點。小岑把手縮回去：「我怕有同學還在走廊。」 | — | 良好 · dial、barrier、avoid_smoke | model | QUALITY_ASSESSED | — | 推進 · avoid_smoke、report | — |
| 6 | 跟裡面的人說，外面濃煙很重 | 小岑把手縮回去：「我怕有同學還在走廊。」 | — | 無關或離題 | model | QUALITY_ASSESSED | — | 卡住 · 尚未完成本情境的核心應對 | — |
| 7 | 把煙的情況告訴 119 接線員 | 我移到窗邊，空氣比門口乾淨一些。我說明走廊都是煙、我們困在房裡。 | — | 良好 · condition、avoid_more_smoke | model | QUALITY_ASSESSED | — | 推進 · avoid_more_smoke、report:condition | — |
| 8 | 跟她說絕對不行開門 | 小岑一直離門把遠遠的。 | — | 重複（不評分） · stop_roommate | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 9 | 跟他說不能開門 | 小岑一直離門把遠遠的。 | — | 重複（不評分） · stop_roommate | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 10 | 堅決不能開門 等待接線員指示 | 我留在房裡，照電話裡的指示等待。 | — | 良好 · stop_roommate、wait_inside | model | QUALITY_ASSESSED | — | 推進 · wait_inside | — |
| 11 | 我知道你擔心他們，我會陪著你 | 小岑握著我的袖子，呼吸慢慢穩下來。門底又飄進一絲焦味，還好毛巾塞得夠緊，煙只滲進一點點。 | — | 良好 · reassure | model | QUALITY_ASSESSED | — | 推進 · reassure、feelings | — |
| 12 | 我確認窗外有沒有煙 | 我隔著玻璃往外看，窗外沒有飄煙。我發現手機電量只剩一格，接線員仍在線。 | — | 良好 · check_window | model | QUALITY_ASSESSED | — | 推進 · check_window、smoke_gap、window（提前完成） | — |
| 13 | 窗外沒煙就開窗揮衣服求救 | 樓下的人已經看到我們這扇窗。 | — | 重複（不評分） · signal | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 14 | 等消防員來，配合他們的指示 | 我們一直待在房裡。 | — | 重複（不評分） · wait_inside | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 15 | 五樓503，我們兩個人 | 我報出樓層和房號。我告訴接線員房裡有兩個人。 | — | 良好 · room、condition | model | QUALITY_ASSESSED | — | 推進 · room、report:room、report:headcount | — |

## B 組 · 宿舍火災｜口語

JSONL 場次 ID：`d468af75-a640-4c10-9a24-a192d1add6d6`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 評估與命中原則 | 來源 | 驗證 | fallbackReason | 分類與原因 | 危險比對差異 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 小岑你先不要開門！外面都是煙，我先把門關緊 | 小岑的手停在門把前，慢慢收了回去。我把房門推緊，門鎖喀一聲扣上，走廊的煙被擋在外面。手機能打119。我在A棟宿舍五樓503室，房內有我和小岑。 小岑把手收回去，低聲說：「我很怕其他同學還在走廊。」 | npc_dissuade (model) | 良好 · stop_roommate、barrier | model | QUALITY_ASSESSED | — | 推進 · stop_roommate、barrier、isolate、roommate（提前完成） | — |
| 2 | 我知道你很擔心他們，但現在出去太危險了，我們先待在房間 | 小岑握著我的袖子，呼吸慢慢穩下來。小岑點點頭，眼神從門口移回我身上。 | — | 良好 · reassure、ground | model | QUALITY_ASSESSED | — | 推進 · reassure、ground | — |
| 3 | 我拿浴室的毛巾沾水塞在門下面 | 我把濕毛巾壓進門縫，用腳把它踩實。 | — | 良好 · seal_gap | model | QUALITY_ASSESSED | — | 推進 · seal_gap | — |
| 4 | 打119 | 電話接通了，接線員的聲音傳了過來。接線員問：「請告訴我地址與棟別、樓層和房號、受困人數、現場狀況。」 | — | 良好 · dial | model | QUALITY_ASSESSED | — | 推進 · dial | — |
| 5 | 跟消防說我們在安學路100號A棟五樓503，兩個人困在房間，走廊都是煙 | 我把宿舍地址和棟別告訴接線員。我報出樓層和房號。我告訴接線員房裡有兩個人。門底又飄進一絲焦味，還好毛巾塞得夠緊，煙只滲進一點點。 | — | 良好 · location、room、condition | model | QUALITY_ASSESSED | — | 推進 · location、room、condition、report:address、report:room、report:headcount、report:condition、report、feelings（提前完成） | — |
| 6 | 窗外有煙嗎？ | 接線員說：「窗外現在看不見煙，房門也關好了。可以從房內開窗向外呼救，別翻出窗外。」 | — |  | rule | RULE_ONLY | — | 卡住 · 已回答提問；本回合沒有完成目標 | — |
| 7 | 沒煙的話我就開窗跟下面的人揮手喊救命 | 我在窗邊揮著衣服大喊，樓下有人抬頭指向這裡。我發現手機電量只剩一格，接線員仍在線。 | — | 良好 · signal | model | QUALITY_ASSESSED | — | 推進 · signal、smoke_gap、window（提前完成） | — |
| 8 | 門下面好像又有煙跑進來了，我再多塞一條毛巾 | 門縫的毛巾還貼著，焦味淡了一些。 | — | 重複（不評分） · seal_gap | model | QUALITY_ASSESSED | — | 已完成 · 承接已完成原則，沒有要求重做 | — |
| 9 | 手機快沒電了，我先把其他app關掉，電話不要掛 | 我把用不到的程式全關了，螢幕調暗。我把手機貼在耳邊，跟接線員保持通話。我聽見消防員隔著房門喊：「503有人嗎？」電話裡請我留在房內回應。 | — | 良好 · save_power、keep_contact | model | QUALITY_ASSESSED | — | 推進 · save_power、keep_contact、battery | — |
| 10 | 消防員到了，我大聲回應他們我們在這裡 | 門外的警報還響著，我聽見消防員叫出房號。我回了一聲，他們確認了我們的位置並接手。 | handoff_fire (rule) | 良好 · handoff | model | QUALITY_ASSESSED | — | 推進 · wait | — |

未送出的原始回合：11。

## C 組 · 學校地震｜口語

JSONL 場次 ID：`4aa97ed0-22f8-4bea-a4c3-b497c7bab1af`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 評估與命中原則 | 來源 | 驗證 | fallbackReason | 分類與原因 | 危險比對差異 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 地震了！我趕快躲到桌子下面抓住桌腳 | 我鑽進課桌底下，手臂護住頭頸。我抓緊桌腳，跟著桌子一起晃。小維扶著桌沿喊：「我想現在跑出去！」 | — | 良好 · cover、hold | model | QUALITY_ASSESSED | — | 推進 · cover、hold、shaking | — |
| 2 | 小維你不要跑！現在跑出去很危險，先躲桌子下 | 小維停下腳步，蹲回桌子旁邊。小維留在課桌旁：「我很擔心家裡的人。」 | npc_dissuade (model) | 良好 · stop_classmate | model | QUALITY_ASSESSED | — | 推進 · stop_classmate、classmate | — |
| 3 | 我知道你擔心家人，等地震停了我們再一起聯絡他們 | 小岑握著我的袖子，呼吸慢慢穩下來。小岑點點頭，眼神從門口移回我身上。桌腳的聲音變小，吊燈仍晃著，老師還沒叫大家起身。 | — | 良好 · reassure、ground | model | QUALITY_ASSESSED | — | 推進 · reassure、ground、worry | — |
| 4 | 等搖晃停下來再說 | 我繼續躲在桌下，等搖晃真的停下來。桌腳又敲了一下地板，老師示意先停住。 | — | 良好 · remain_covered | model | QUALITY_ASSESSED | — | 推進 · remain_covered、main_stop | — |
| 5 | 又在搖了，我繼續躲著保護頭 | 我立刻縮回桌下，再把頭護住。老師說這一側暫時安全。同學坐著，清醒並說腳踝很痛。 | — | 良好 · cover_again、cover | model | QUALITY_ASSESSED | — | 推進 · cover_again、aftershock | — |
| 6 | 旁邊同學好像受傷了，我先看他傷到哪裡 | 我蹲到同學旁邊，問他哪裡痛、還能不能動。老師已確認指定樓梯可通行，另一側落物還沒清除。 | — | 良好 · assess | model | QUALITY_ASSESSED | — | 推進 · assess、injured | — |
| 7 | 他手在流血，我拿乾淨的布壓住傷口，然後跟老師說 | 我舉手大聲告訴老師有人受傷。我把受傷同學的情況告訴老師。 | — | 良好 · tell_teacher、injuries | model | QUALITY_ASSESSED | — | 推進 · tell_teacher、injuries | — |
| 8 | 老師說可以走了，我跟著老師走樓梯下去，不要走有玻璃的那邊 | 我跟著老師走指定的樓梯，避開掉滿碎片的那一側。操場上老師拿著班級名冊，正在清點。 | — | 良好 · safe_route | model | QUALITY_ASSESSED | — | 推進 · safe_route、evacuate | — |
| 9 | 到操場後跟老師說我們這排人都到了，有一個同學手受傷 | 我舉手讓老師看到我們班站的位置。老師點到我們這排，我回報人都到了。廣播說教室尚未開放，小維想回去拿手機。 | — | 良好 · where、roster、injuries、tell_teacher | model | QUALITY_ASSESSED | — | 推進 · where、roster、assembly | — |
| 10 | 小維說要回去拿手機，我跟他說不行，等老師說可以再回去 | 我跟著確認過的動線走到集合點。老師喊到我的名字，我回了一聲，也把同學的狀況報給老師。 | stay_assembly (rule) | 良好 · stay_group、stop_return | model | QUALITY_ASSESSED | — | 推進 · return_choice | — |

未送出的原始回合：11。

## D 組 · 宿舍火災｜最新使用者實測

JSONL 場次 ID：`6100734a-0909-4f26-8583-4d73f49429d6`

| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 評估與命中原則 | 來源 | 驗證 | fallbackReason | 分類與原因 | 危險比對差異 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 跟小岑說千萬不能開門 並把門關緊 先用手機撥通119 然後找濕毛巾或來堵住門縫跟口鼻<br>並找宿舍的對外窗 將窗戶打開大聲呼救 | 電話接通了，接線員的聲音傳了過來。小岑的手停在門把前，慢慢收了回去。我把房門推緊，門鎖喀一聲扣上，走廊的煙被擋在外面。接線員問：「請告訴我地址與棟別、樓層和房號、受困人數、現場狀況。」 小岑把手收回去，低聲說：「我很怕其他同學還在走廊。」 | npc_dissuade (model) | 良好 · stop_roommate、barrier、dial、signal | model | QUALITY_ASSESSED | — | 推進 · stop_roommate、barrier、dial、signal、isolate、roommate（提前完成） | — |
| 2 | 跟接線員說明現在情況 外面有濃煙 不知道是否還有其他同學在外面<br>同時跟小岑說我們先顧好自己就好 沒有餘力擔心外面的人 | 我移到窗邊，空氣比門口乾淨一些。小岑點點頭，眼神從門口移回我身上。我說明走廊都是煙、我們困在房裡。門底又飄進一絲焦味，還好毛巾塞得夠緊，煙只滲進一點點。 | — | 良好 · condition、avoid_more_smoke、ground | model | QUALITY_ASSESSED | — | 推進 · condition、avoid_more_smoke、ground、report:condition、report、feelings（提前完成） | — |
| 3 | 打電話給119 | 電話還接通著。我發現手機電量只剩一格，接線員仍在線。 | — | 重複（不評分） · dial | model | QUALITY_ASSESSED | — | 推進 · smoke_gap、window（提前完成） | — |
| 4 | 跟接線員說明現在的地址跟發生的處境 | 我把宿舍地址和棟別告訴接線員。 | — | 良好 · location、condition | model | QUALITY_ASSESSED | — | 推進 · location、report:address | — |
| 5 | 5樓 503 | 我報出樓層和房號。 | — | 良好 · room | model | QUALITY_ASSESSED | — | 推進 · room、report:room | — |
| 6 | 回復2人 | 我告訴接線員房裡有兩個人。 | — | 良好 · condition | model | QUALITY_ASSESSED | — | 推進 · report:headcount | — |
| 7 | 用濕布堵住門縫 | 我把濕毛巾壓進門縫，用腳把它踩實。 | — | 良好 · seal_gap | model | QUALITY_ASSESSED | — | 推進 · seal_gap | — |
| 8 | 開啟省電模式 盡可能延長手機撥通時間 | 我把用不到的程式全關了，螢幕調暗。我把手機貼在耳邊，跟接線員保持通話。我聽見消防員隔著房門喊：「503有人嗎？」電話裡請我留在房內回應。 | — | 良好 · save_power、keep_contact | model | QUALITY_ASSESSED | — | 推進 · save_power、keep_contact、battery | — |
| 9 | 依照指示留在房間內 | 我留在房內照指示回應，電話還接得通。消防員確認了我們的位置，接著接手救援。 | handoff_fire (rule) | 良好 · wait_inside | model | QUALITY_ASSESSED | — | 推進 · wait | — |

未送出的原始回合：10、11、12、13。
