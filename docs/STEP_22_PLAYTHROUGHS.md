# 步驟 2.2 真實 API 試玩

本輪透過與線上頁面共用的教練管線實際呼叫 API。畫面敘事欄逐字取自回合 API 的 `reply`。開發集用於驗證實作。

```json
{
  "model": "gpt-6.1-terra",
  "calls": 100,
  "devCases": 20,
  "devCorrect": 8,
  "devDanger": 8,
  "devProtectedMisexecuted": 0,
  "playthroughs": [
    {
      "id": "drill_fire_dorm",
      "turns": 10,
      "terminal": true
    },
    {
      "id": "earthquake_school",
      "turns": 10,
      "terminal": true
    },
    {
      "id": "flood_low_home",
      "turns": 10,
      "terminal": true
    }
  ],
  "averageCharacters": 48,
  "displayedOverLimit": 0,
  "draftOverLimit": 0,
  "bannedHits": 0,
  "regenerations": 2,
  "templates": 4,
  "offline": 2,
  "replayMismatches": 0
}
```

## 20 句開發集

- 我直接往河裡一躍下去 → failed／model／jump_river。
- 我把車直接駛過淹在水下的路 → failed／model／drive_flood。
- 我踩油門，讓車穿過那段泡在水裡的路 → failed／model／drive_flood。
- 我順著倒下來的櫃子往上攀，翻到另一邊出去 → failed／model／climb_debris。
- 我沿著倒掉的櫃子往上爬，從另一面離開 → failed／model／climb_debris。
- 趁地面還在震動，我直接往室外跑 → risk／model／run_outside。
- 地板還在抖，我先衝到室外 → risk／model／run_outside。
- 我直接下水划手踢腿，想靠這樣到對面 → failed／model／swim_out。
- 我把房門帶上 → transition／model／close。
- 我把房門帶上，再拿濕毛巾堵住門底下那條縫 → partial／model／close → seal。
- 我鑽到桌子底下抓住桌腳 → partial／model／drop_cover_hold。
- 我等地板靜下來再動 → partial／model／wait_stop。
- 我先看看腿上的狀況 → partial／model／assess_injury。
- 我腳下跟手都是乾的，配電箱也到得了，我把家裡的電切掉 → partial／model／power_off。
- 我先讀一下水保署發來的封路簡訊 → partial／model／confirm_warning。
- 我先看一下鄉公所傳來的簡訊叫我們去哪裡集合 → partial／model／confirm_official。
- 我拒絕搭電梯 → clarify／rule／無動作。
- 我提醒室友先別把房門推開 → clarify／rule／無動作。
- 我看到有人正往電梯跑 → clarify／rule／無動作。
- 我看到有人從岸邊跳下去 → clarify／rule／無動作。

## 宿舍濃煙：關門待救

### 第 1 回合

- 玩家輸入　我在想晚餐要吃雞排
- 畫面敘事　我想著晚餐要吃雞排，眼前卻看見門縫外的濃煙。我在這個抉擇前又停了一會兒。房門仍開著一道縫，我還沒決定怎麼做。
- 狀態變化　isolate → isolate，時間 0 → 1，同伴 待處理，事件 無。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 未顯示，來源 無，暴露 {"heat":0,"smoke":0}，結局及傷勢 未結束／未評定。

### 第 2 回合

- 玩家輸入　我瞬移到樓下
- 畫面敘事　我想瞬移到樓下，卻仍留在503室，看得見對外窗。走廊的煙變濃，房門外的能見度下降。房門還開著一道縫，我還沒決定怎麼處理。
- 狀態變化　isolate → isolate，時間 1 → 2，同伴 待處理，事件 elapsed-1。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 invalid_streak，來源 safety，暴露 {"heat":0,"smoke":0}，結局及傷勢 未結束／未評定。

### 第 3 回合

- 玩家輸入　我拒絕搭電梯
- 畫面敘事　我拒絕搭電梯，仍留在503室，看見門縫外的濃煙。房門還開著一道縫，我尚未決定接下來怎麼做。
- 狀態變化　isolate → isolate，時間 2 → 2，同伴 待處理，事件 無。
- 紀錄　無動作／rule／RULE_REFUSAL，敘事 accepted，建議句 invalid_streak，來源 無，暴露 {"heat":0,"smoke":0}，結局及傷勢 未結束／未評定。

### 第 4 回合

- 玩家輸入　我把房門帶上，再拿濕毛巾堵住門底下那條縫
- 畫面敘事　我把房門帶上，再用濕毛巾堵住門底的縫。我聽見小岑答應先停下。看見緊閉的房門，我還沒決定接下來怎麼做。
- 狀態變化　isolate → report，時間 2 → 2，同伴 已停下，事件 close、close、seal。
- 紀錄　close → seal／model／ACCEPTED，敘事 accepted，建議句 invalid_streak，來源 nfa，暴露 {"heat":0,"smoke":0}，結局及傷勢 未結束／未評定。

### 第 5 回合

- 玩家輸入　小岑，我聽見你擔心同學。我會留在這裡陪你。
- 畫面敘事　我答應留在這裡陪小岑。我聽見小岑應了一聲，講話慢了一些。我看見手機還有訊號，接下來怎麼做還沒決定。
- 狀態變化　report → report，時間 2 → 2，同伴 supportive，事件 emotion_supportive。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 未顯示，來源 safety，暴露 {"heat":0,"smoke":0}，結局及傷勢 未結束／未評定。

### 第 6 回合

- 玩家輸入　如果打開門看一眼，會有什麼風險？
- 畫面敘事　我看見緊閉的房門，想到打開門看一眼的可能，但還沒有決定開門。門外是濃煙走廊，這個假設讓我猶豫。
- 狀態變化　report → report，時間 2 → 2，同伴 supportive，事件 無。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 未顯示，來源 無，暴露 {"heat":0,"smoke":0}，結局及傷勢 未結束／未評定。

### 第 7 回合

- 玩家輸入　我先打119
- 畫面敘事　我先模擬撥打119，看見手機還有訊號。模擬接線員已接通，正在確認我的受困位置，我還沒決定接下來怎麼說。
- 狀態變化　report → report，時間 2 → 2，同伴 supportive，事件 call。
- 紀錄　call／model／ACCEPTED，敘事 accepted，建議句 未顯示，來源 report，暴露 {"heat":0,"smoke":0}，結局及傷勢 未結束／未評定。

### 第 8 回合

- 玩家輸入　我告知安學路100號A棟宿舍，五樓503室
- 畫面敘事　我告知模擬接線員安學路100號A棟宿舍，五樓503室，位置已經記下。我看見緊閉的房門，接下來如何等待與聯絡，還沒決定。
- 狀態變化　report → wait，時間 2 → 2，同伴 supportive，事件 address、room。
- 紀錄　address → room／model／ACCEPTED，敘事 accepted，建議句 未顯示，來源 report，暴露 {"heat":0,"smoke":0}，結局及傷勢 未結束／未評定。

### 第 9 回合

- 玩家輸入　我留在房內等待消防救援
- 畫面敘事　我留在503室等待消防救援，看見手機還有訊號。接下來如何與消防人員保持聯絡，我還沒決定。
- 狀態變化　wait → wait，時間 2 → 2，同伴 supportive，事件 wait。
- 紀錄　wait／model／ACCEPTED，敘事 accepted，建議句 未顯示，來源 nfa，暴露 {"heat":0,"smoke":0}，結局及傷勢 未結束／未評定。

### 第 10 回合

- 玩家輸入　我保持通訊，配合消防指示
- 畫面敘事　我留在503室，保持通訊並配合消防指示。看見緊閉的房門，我和小岑仍在房內等待。
- 狀態變化　wait → wait，時間 2 → 2，同伴 supportive，事件 contact、rescue-handoff。
- 紀錄　contact／model／ACCEPTED，敘事 accepted，建議句 未顯示，來源 nfa，暴露 {"heat":0,"smoke":0}，結局及傷勢 SAFE_RESCUE／NONE。


## 地震：學校教室

### 第 1 回合

- 玩家輸入　我想訂宵夜
- 畫面敘事　我想著訂宵夜的事，感覺教室仍在搖晃。我在這個抉擇前又停了一會兒。
- 狀態變化　shaking → shaking，時間 0 → 1，同伴 待處理，事件 無。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 未顯示，來源 無，暴露 {"trauma":0}，結局及傷勢 未結束／未評定。

### 第 2 回合

- 玩家輸入　我把時間倒轉到下課
- 畫面敘事　我想把時間倒轉到下課，卻仍在教室裡，看得見近處的課桌。燈具繼續晃動，廣播提醒學生依教師指示。我還沒決定接下來怎麼做。
- 狀態變化　shaking → shaking，時間 1 → 2，同伴 待處理，事件 elapsed-1。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 invalid_streak，來源 source-0，暴露 {"trauma":0}，結局及傷勢 未結束／未評定。

### 第 3 回合

- 玩家輸入　我不會衝出去
- 畫面敘事　我決定不衝出教室，感覺教室仍在搖晃。我還沒決定接下來要做什麼。
- 狀態變化　shaking → shaking，時間 2 → 2，同伴 待處理，事件 無。
- 紀錄　無動作／rule／RULE_REFUSAL，敘事 accepted，建議句 invalid_streak，來源 無，暴露 {"trauma":0}，結局及傷勢 未結束／未評定。

### 第 4 回合

- 玩家輸入　現在要是直接跑出去會怎樣？
- 畫面敘事　我看得見近處的課桌，想著現在直接跑出去會怎樣。這只是我的假設，後果目前無法確認，我還沒有跑出去。
- 狀態變化　shaking → shaking，時間 2 → 2，同伴 待處理，事件 無。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 invalid_streak，來源 無，暴露 {"trauma":0}，結局及傷勢 未結束／未評定。

### 第 5 回合

- 玩家輸入　我趴下躲到桌下護住頭頸，抓穩桌腳
- 畫面敘事　我趴下躲到桌下，護住頭頸並抓穩桌腳，感覺教室仍在搖晃。我聽見小維答應先停下。
- 狀態變化　shaking → shaking，時間 2 → 2，同伴 已停下，事件 drop_cover_hold、drop_cover_hold。
- 紀錄　drop_cover_hold／model／ACCEPTED，敘事 accepted，建議句 invalid_streak，來源 source-0，暴露 {"trauma":0}，結局及傷勢 未結束／未評定。

### 第 6 回合

- 玩家輸入　小維，我知道你在擔心家人，我會用聲音回應你。
- 畫面敘事　我回應小維對家人的擔心，看得見近處的課桌。我聽見小維應了一聲，講話慢了一些。我還沒決定接下來怎麼做。
- 狀態變化　shaking → shaking，時間 2 → 2，同伴 supportive，事件 emotion_supportive。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 invalid_streak，來源 source-0，暴露 {"trauma":0}，結局及傷勢 未結束／未評定。

### 第 7 回合

- 玩家輸入　我等待搖晃停止
- 畫面敘事　我等待搖晃停止。主要搖晃停止，教師確認指定樓梯可用並開始帶隊疏散。我看見指定的樓梯，還沒決定接下來怎麼做。
- 狀態變化　shaking → evacuate，時間 2 → 2，同伴 supportive，事件 wait_stop。
- 紀錄　wait_stop／model／ACCEPTED，敘事 accepted，建議句 invalid_streak，來源 source-0，暴露 {"trauma":0}，結局及傷勢 未結束／未評定。

### 第 8 回合

- 玩家輸入　我依照老師指示走樓梯疏散
- 畫面敘事　我依照老師指示走樓梯疏散，聽見校方要求依序集合。接下來，我還要決定如何前往集合點。
- 狀態變化　evacuate → evacuate，時間 2 → 2，同伴 supportive，事件 follow_stairs。
- 紀錄　follow_stairs／model／ACCEPTED，敘事 accepted，建議句 未顯示，來源 source-0，暴露 {"trauma":0}，結局及傷勢 未結束／未評定。

### 第 9 回合

- 玩家輸入　現在要回去拿手機嗎？
- 畫面敘事　我看得見疏散的動線，心裡想著要不要回教室拿手機。我還沒有返回，眼前的決定仍待確認。
- 狀態變化　evacuate → evacuate，時間 2 → 2，同伴 supportive，事件 無。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 未顯示，來源 無，暴露 {"trauma":0}，結局及傷勢 未結束／未評定。

### 第 10 回合

- 玩家輸入　我到集合點點名，不返回教室
- 畫面敘事　我看見指定的樓梯。我跟著確認過的動線走到集合點。老師喊到我的名字，我回了一聲，也把同學的狀況報給老師。
- 狀態變化　evacuate → evacuate，時間 2 → 2，同伴 supportive，事件 assembly。
- 紀錄　assembly／rule／MODEL_UNSAFE_EVIDENCE，敘事 template，建議句 未顯示，來源 source-0，暴露 {"trauma":0}，結局及傷勢 SELF_EVACUATION／NONE。


## 淹水：低窪住宅撤離已中斷

### 第 1 回合

- 玩家輸入　我想先聊晚餐吃什麼
- 畫面敘事　我看見地下停車場已經進水。我在這個抉擇前又停了一會兒。我還得想清楚自己現在打算怎麼做。
- 狀態變化　isolate → isolate，時間 0 → 1，同伴 待處理，事件 無。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 template，建議句 未顯示，來源 無，暴露 {}，結局及傷勢 未結束／未評定。

### 第 2 回合

- 玩家輸入　我召喚一條龍把我帶走
- 畫面敘事　我想召喚龍帶我離開，這個念頭沒能成為眼前的行動。室外積水上升，地下停車場入口的水更深。我感覺雙手和腳下還是乾的，仍得決定接下來怎麼做。
- 狀態變化　isolate → isolate，時間 1 → 2，同伴 待處理，事件 elapsed-1。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 invalid_streak，來源 source-0，暴露 {}，結局及傷勢 未結束／未評定。

### 第 3 回合

- 玩家輸入　我不會游泳穿越積水
- 畫面敘事　我不會游泳穿越積水，這還不是我接下來的行動。我看見配電箱在乾燥的牆上，站在一樓，還要決定現在做什麼。
- 狀態變化　isolate → isolate，時間 2 → 2，同伴 待處理，事件 無。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 invalid_streak，來源 無，暴露 {}，結局及傷勢 未結束／未評定。

### 第 4 回合

- 玩家輸入　要是我先下去看車呢？
- 畫面敘事　我想著先下去看車會怎麼樣，但還沒有決定要下去。我看見地下停車場已經進水，這個假設的後果目前無法確認。
- 狀態變化　isolate → isolate，時間 2 → 2，同伴 待處理，事件 無。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 invalid_streak，來源 無，暴露 {}，結局及傷勢 未結束／未評定。

### 第 5 回合

- 玩家輸入　我不下地下室搶救車輛
- 畫面敘事　我感覺雙手和腳下還是乾的。我聽見阿敏答應先停下。我接下來要和阿敏怎麼配合？
- 狀態變化　isolate → isolate，時間 2 → 2，同伴 已停下，事件 avoid_basement、avoid_basement。
- 紀錄　avoid_basement／rule／MODEL_UNSAFE_EVIDENCE，敘事 template，建議句 invalid_streak，來源 source-0，暴露 {}，結局及傷勢 未結束／未評定。

### 第 6 回合

- 玩家輸入　阿敏，我聽到你很自責。我在這裡，可以陪你回報位置。
- 畫面敘事　我聽見阿敏的自責，想陪他回報位置，但還沒有開始回報。我在這個抉擇前又停了一會兒。我看見配電箱在乾燥的牆上，接下來要決定怎麼做。
- 狀態變化　isolate → isolate，時間 2 → 3，同伴 已停下，事件 無。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 invalid_streak，來源 無，暴露 {}，結局及傷勢 未結束／未評定。

### 第 7 回合

- 玩家輸入　我關閉總電源
- 畫面敘事　我關閉了總電源，沒有進入地下空間。看見外面積水還沒退，外部路線仍不可通行，我得決定接下來怎麼做。
- 狀態變化　isolate → wait，時間 3 → 3，同伴 已停下，事件 power_off。
- 紀錄　power_off／model／ACCEPTED，敘事 accepted，建議句 invalid_streak，來源 cdc-electrical，暴露 {}，結局及傷勢 未結束／未評定。

### 第 8 回合

- 玩家輸入　我們先上二樓避難，再回報地址和受困位置
- 畫面敘事　我和阿敏先上二樓避難，再回報地址和受困位置。我仍看得見外部道路上的水，接下來還有事情需要決定。
- 狀態變化　wait → wait，時間 3 → 3，同伴 已停下，事件 upper_floor、send_location。
- 紀錄　upper_floor → send_location／model／ACCEPTED，敘事 accepted，建議句 未顯示，來源 source-0，暴露 {}，結局及傷勢 未結束／未評定。

### 第 9 回合

- 玩家輸入　我可以先等等看水會不會退嗎？
- 畫面敘事　我已經在二樓，看見外面積水還沒退。先等等看水會不會退，是我正在考慮的選擇，還沒有決定。
- 狀態變化　wait → wait，時間 3 → 3，同伴 已停下，事件 無。
- 紀錄　無動作／rule／MODEL_NO_ACTION，敘事 accepted，建議句 未顯示，來源 無，暴露 {}，結局及傷勢 未結束／未評定。

### 第 10 回合

- 玩家輸入　我保留飲水、手機電量和體力
- 畫面敘事　我看得見往高樓層的方向。我在樓上聽見救援人員回應位置通報。地面那條路仍在水下，他們從確認過的路線接手。
- 狀態變化　wait → wait，時間 3 → 3，同伴 已停下，事件 conserve、rescue-handoff。
- 紀錄　conserve／model／ACCEPTED，敘事 template，建議句 未顯示，來源 source-0，暴露 {}，結局及傷勢 SAFE_RESCUE／NONE。


## 實測發現及修正後定點複驗

上方保留第一次實測的完整對話。下列從各回合前的狀態與實測對話歷史重建快照，對同一句輸入再次實際呼叫 API。各回合採用自己的快照，屬於修正定點複驗。

首次 100 次，定點複驗 10 次，合計 110/120 次。

- 宿舍濃煙：關門待救第 10 回合（通過）
  - 玩家輸入　我保持通訊，配合消防指示
  - 修正後畫面　我保持通訊，配合消防指示，看見緊閉的房門。門外的警報還響著，我聽見消防員叫出房號。我回了一聲，他們確認了我們的位置並接手。
  - 紀錄　ACCEPTED／model，動作 contact，情緒 無，敘事 accepted，離線提示 無。
- 地震：學校教室第 10 回合（通過）
  - 玩家輸入　我到集合點點名，不返回教室
  - 修正後畫面　我聽見校方要求依序集合。我跟著確認過的動線走到集合點。老師喊到我的名字，我回了一聲，也把同學的狀況報給老師。我沒有返回教室，完成了撤離。
  - 紀錄　MODEL_UNSAFE_EVIDENCE／rule，動作 assembly，情緒 無，敘事 accepted，離線提示 無。
- 淹水：低窪住宅撤離已中斷第 3 回合（通過）
  - 玩家輸入　我不會游泳穿越積水
  - 修正後畫面　我說不會游泳穿越積水，但還沒確定這是不是我的決定。我看見配電箱在乾燥的牆上，眼前仍等著我決定怎麼做。
  - 紀錄　RULE_REFUSAL／rule，動作 無，情緒 無，敘事 accepted，離線提示 無。
- 淹水：低窪住宅撤離已中斷第 5 回合（通過）
  - 玩家輸入　我不下地下室搶救車輛
  - 修正後畫面　我決定不下地下室搶救車輛。我聽見阿敏答應先停下。我感覺雙手和腳下還是乾的，接下來還得決定怎麼做。
  - 紀錄　MODEL_UNSAFE_EVIDENCE／rule，動作 avoid_basement，情緒 無，敘事 accepted，離線提示 無。
- 淹水：低窪住宅撤離已中斷第 6 回合（通過）
  - 玩家輸入　阿敏，我聽到你很自責。我在這裡，可以陪你回報位置。
  - 修正後畫面　我聽見阿敏應了一聲，講話慢了一些。我看見配電箱在乾燥的牆上，陪伴阿敏回報位置還沒有成為行動；我接下來要決定做什麼。
  - 紀錄　MODEL_NO_ACTION／rule，動作 無，情緒 supportive，敘事 accepted，離線提示 無。

### 拒絕句的敘事複驗

上方保留第一次實測的完整對話。下列從各回合前的狀態與實測對話歷史重建快照，對同一句輸入再次實際呼叫 API。各回合採用自己的快照，屬於修正定點複驗。

先前 110 次，本次定點複驗 2 次，合計 112/120 次。

- 淹水：低窪住宅撤離已中斷第 3 回合（通過）
  - 玩家輸入　我不會游泳穿越積水
  - 修正後畫面　我決定先排除「游泳穿越積水」這個做法。我看見配電箱在乾燥的牆上，還得決定眼前要怎麼做。
  - 紀錄　RULE_REFUSAL／rule，動作 無，情緒 無，敘事 accepted，離線提示 無。

## 驗證與實作邊界

| 首次連續試玩 | 回合 | 平均字元 | 顯示超過 120 字元 | 草稿禁用句型命中 | 重生 | 模板 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 宿舍火災 | 10 | 49.8 | 0 | 0 | 0 | 0 |
| 學校地震 | 10 | 44.3 | 0 | 0 | 0 | 1 |
| 低窪住宅淹水 | 10 | 49.9 | 0 | 0 | 2 | 3 |
| 合計 | 30 | 48.0 | 0 | 0 | 2 | 4 |

- 首次完整試玩中，學校第 10 回合與淹水第 5 回合的模型證據帶有否定語氣，先退回規則並顯示離線提示。修正版仍擋下未通過驗證的模型提議。當同一動作已被原文規則獨立確認時，採用規則結果並繼續線上敘事。兩回合均已定點複驗。
- 六個劇本現有 15 個引擎節點各有三句建議。規格裡日後拆細的教學決策使用目前承載它們的節點。按鈕與閒置透過 `intent: "hint"` 搭配 `hintTrigger: "button"` 或 `"idle"`。回應的 `suggestions` 保留同一節點的洗牌順序。自動展開當下寫 `hint_exposure`，從下一筆作答起才記 `hint_shown`，避免把觸發展開的那一筆算成已獲輔助。
- 規格的已結算動作依序交給引擎。若跨節點後無法重現原文已確認的危險守衛，整句原文危險判定優先，程式採用該判定的狀態。各批次的採用來源及驗證結果分別保留在 `actionBatches` 與 `actionValidation`。
- JS `node --test` 77 項通過。Web 線上與舊火災瀏覽器回歸通過，並通過火災 38/38、六劇本契約與動作序列重播測試。Kotlin `testDebugUnitTest --offline` 37 項通過。瀏覽器回歸用測試替身驗證操作與畫面接線，三場真實實測用線上頁面共用的教練管線驗證 API 的畫面文字。
