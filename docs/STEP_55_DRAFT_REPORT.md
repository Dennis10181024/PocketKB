# 步驟 5.5 情境包草稿驗收

草稿，待人工審查。預設隱藏，可由「演練設定 → 顯示草稿情境」開啟。以下為固定情境包的規則重播，OpenAI API 呼叫 0 次。傷勢、升級節點與救援時間是合成的教學情境設定。

## 板南線車廂的突發騷動

7 題，4 種可達結局，231 個可達非終止狀態。

- 公開查證：警政署彙編頁 10 的跑、躲、告及專案收錄原文頁 16、26–27。北捷設備頁確認板南線所用的高運量車廂緊急對講機接通司機員。各重播終局的回顧都列出北捷列車安全設備頁。危險選項以嘗試自行離車呈現，無操作細節。
- 待人工查證：請北捷或演練教官確認板南線各車型廣播與引導的措辭。暫時無退路且無法躲藏的阻擋選項只呈現保護與等候安全離開。

| 檢查 | 數據 |
|---|---|
| 最長＝正確（標點計入） | 0/7（0.0%） |
| 最長＝正確（忽略標點） | 0/7（0.0%） |
| 動作最多＝正確 | 1/7（14.3%） |
| 最短＝正確（標點計入） | 2/7（28.6%） |
| 最短＝正確（忽略標點） | 0/7（0.0%） |
| 自我否定用詞 | 0/21 |
| 同題最大字差 | 4 字 |

比例含並列。動作數為按原文核對的可見行動標註。

| 決策點／問題 | 選項 | 判定 | 字數 | 動作數 | 採用 ID | 來源 |
|---|---|---|---:|---:|---|---|
| metro_distance／騷動在後方，前面車廂仍能走。小宇轉身想看，我怎麼做？ | 我叫小宇，帶他往前拉開距離。 | 正確 | 14 | 2 | metro_distance_act_ok | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_distance／騷動在後方，前面車廂仍能走。小宇轉身想看，我怎麼做？ | 我靠扶手，拿手機拍下後方。 | 迷思 | 13 | 2 | metro_distance_act_myth | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_distance／騷動在後方，前面車廂仍能走。小宇轉身想看，我怎麼做？ | 我朝騷動走去，想先讓衝突停下來。 | 危險／延誤 | 16 | 1 | metro_distance_act_risk | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_distance 字差 | — | — | 3 | — | — | — |
| metro_intercom／前一節車廂的聲音小了一些。門旁有緊急設備，我手上還握著手機。我要怎麼讓別人知道情況？ | 我用對講機回報車廂位置與現況。 | 正確 | 15 | 1 | metro_intercom_act_ok | [metro](https://www.metro.taipei/cp.aspx?n=C4B618682DB27979&s=7AB21391531CA32D) |
| metro_intercom／前一節車廂的聲音小了一些。門旁有緊急設備，我手上還握著手機。我要怎麼讓別人知道情況？ | 我傳影片給朋友，等他來回報。 | 迷思 | 14 | 2 | metro_intercom_act_myth | [metro](https://www.metro.taipei/cp.aspx?n=C4B618682DB27979&s=7AB21391531CA32D) |
| metro_intercom／前一節車廂的聲音小了一些。門旁有緊急設備，我手上還握著手機。我要怎麼讓別人知道情況？ | 我往車廂後方走，大聲找人幫忙通報。 | 危險／延誤 | 17 | 2 | metro_intercom_act_risk | [metro](https://www.metro.taipei/cp.aspx?n=C4B618682DB27979&s=7AB21391531CA32D) |
| metro_intercom 字差 | — | — | 3 | — | — | — |
| metro_doors／列車速度慢下來，車門邊有人移動。我站在扶手旁，聽到廣播聲。這時我怎麼做？ | 我留在原位等停車廣播指示。 | 正確 | 13 | 1 | metro_doors_act_ok | [metro](https://www.metro.taipei/cp.aspx?n=C4B618682DB27979&s=7AB21391531CA32D) |
| metro_doors／列車速度慢下來，車門邊有人移動。我站在扶手旁，聽到廣播聲。這時我怎麼做？ | 我握欄杆，卡在門邊等開門。 | 迷思 | 13 | 2 | metro_doors_act_myth | [metro](https://www.metro.taipei/cp.aspx?n=C4B618682DB27979&s=7AB21391531CA32D) |
| metro_doors／列車速度慢下來，車門邊有人移動。我站在扶手旁，聽到廣播聲。這時我怎麼做？ | 我想自行開車門，從軌道旁繞過。 | 危險／延誤 | 15 | 2 | metro_doors_act_risk | [metro](https://www.metro.taipei/cp.aspx?n=C4B618682DB27979&s=7AB21391531CA32D) |
| metro_doors 字差 | — | — | 2 | — | — | — |
| metro_platform／車門已開。小宇的耳機掉在門邊，後面的人正往月台移動。我要怎麼走？ | 我叫小宇順著人流走到月台。 | 正確 | 13 | 2 | metro_platform_act_ok | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_platform／車門已開。小宇的耳機掉在門邊，後面的人正往月台移動。我要怎麼走？ | 我停下，幫小宇撿耳機再走。 | 迷思 | 13 | 3 | metro_platform_act_myth | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_platform／車門已開。小宇的耳機掉在門邊，後面的人正往月台移動。我要怎麼走？ | 我擠到前排，推開比較慢的人先出去。 | 危險／延誤 | 17 | 2 | metro_platform_act_risk | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_platform 字差 | — | — | 4 | — | — | — |
| metro_hide／樓梯前的人停住了，旁邊有牆和轉角。後方的聲音傳了過來，我可以怎麼做？ | 我退到厚牆後，關手機保持安靜。 | 正確 | 15 | 2 | metro_hide_act_ok | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_hide／樓梯前的人停住了，旁邊有牆和轉角。後方的聲音傳了過來，我可以怎麼做？ | 我靠牆開擴音，再請旁人報案。 | 迷思 | 14 | 3 | metro_hide_act_myth | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_hide／樓梯前的人停住了，旁邊有牆和轉角。後方的聲音傳了過來，我可以怎麼做？ | 我擠往樓梯口，請人群讓出一條路。 | 危險／延誤 | 16 | 2 | metro_hide_act_risk | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_hide 字差 | — | — | 2 | — | — | — |
| metro_barrier／我跟著站務人員走到轉角，前方再次停住，附近沒有能遮住身體的空間。我怎麼做？ | 我和旁人一起用包包保持距離。 | 正確 | 14 | 1 | metro_barrier_act_ok | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_barrier／我跟著站務人員走到轉角，前方再次停住，附近沒有能遮住身體的空間。我怎麼做？ | 我放下包包，側身往堵住的出口擠去。 | 迷思 | 17 | 2 | metro_barrier_act_myth | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_barrier／我跟著站務人員走到轉角，前方再次停住，附近沒有能遮住身體的空間。我怎麼做？ | 我朝聲音走去，想喊話叫停。 | 危險／延誤 | 13 | 2 | metro_barrier_act_risk | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_barrier 字差 | — | — | 4 | — | — | — |
| metro_report／站務人員引導我到站外安全區，小宇也到了。接下來我向誰回報？ | 我打110，回報站名和現場的情況。 | 正確 | 17 | 2 | metro_report_act_ok | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_report／站務人員引導我到站外安全區，小宇也到了。接下來我向誰回報？ | 我先上傳影片，等轉發的人幫忙。 | 迷思 | 15 | 2 | metro_report_act_myth | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_report／站務人員引導我到站外安全區，小宇也到了。接下來我向誰回報？ | 我回月台找站務核對，查清再向警方回報。 | 危險／延誤 | 19 | 3 | metro_report_act_risk | [npa](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s) |
| metro_report 字差 | — | — | 4 | — | — | — |

### 全對重播回顧全文

結局傷勢清單｜無紀錄傷勢。

#### 結果

平安離開並完成通報。本人傷勢分級為無傷。

及早拉開距離、依指示撤離後通報。

#### 做對的決定

- 「我叫小宇，帶他往前拉開距離。」 及早離開可減少留在威脅附近的時間。
- 「我用對講機回報車廂位置與現況。」 高運量列車的緊急對講機接通司機員，能直接回報車廂狀況。
- 「我留在原位等停車廣播指示。」 依列車廣播和站務指示移動，可避免錯過指定動線。

#### 下次可以補上的

本場無此項。

#### 這次的危險選擇與後果

本場無此項。

#### 關鍵轉折

- 「我叫小宇，帶他往前拉開距離。」 → 我和小宇朝前方移動，後方的聲音遠了一些。 → 可以維持「我叫小宇，帶他往前拉開距離。」 及早離開可減少留在威脅附近的時間。

#### 官方依據

- [警政署《民眾自我安全防護常識彙編》頁 10、16、26–27](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s)
- [臺北捷運公司：列車安全設備](https://www.metro.taipei/cp.aspx?n=C4B618682DB27979&s=7AB21391531CA32D)

#### 帶走一個思考題

- 如果離開教室的大門一時被堵住，我要如何先判斷有沒有安全路線？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 關鍵轉折 | 我叫小宇，帶他往前拉開距離。 |  | — |


### 亂玩重播回顧全文

結局傷勢清單｜本人：肩膀撞傷、本人：手腕挫傷、小宇：手腕受傷、本人：手肘挫傷。

#### 結果

延誤後在站務協助下撤離。最嚴重的傷勢為肩膀撞傷。本人傷勢分級為輕傷。撤離或救援延誤：停留拍攝耽誤離開、等朋友代報延誤司機員接獲通知。

最早因停留拍攝耽誤離開造成延誤，過程中出現肩膀撞傷。

#### 做對的決定

本場無此項。

#### 下次可以補上的

- 在確認安全後撥110，回報確定的資訊。
- 有機會就離開，最後手段只用來保護與爭取離開。

#### 這次的危險選擇與後果

- 第 1 回合「我靠扶手，拿手機拍下後方。」 我停在扶手旁，人群掠過我身邊（本回合傷勢：肩膀撞傷）。 把注意力放回可通行的方向。
- 第 3 回合「我握欄杆，卡在門邊等開門。」 人群聚到車門邊，我的手腕碰到扶手（本回合傷勢：手腕挫傷）。 扶穩腳步並留出門邊空間。
- 第 4 回合「我停下，幫小宇撿耳機再走。」 我停下時人群靠上來，小宇扶住門框，手腕發痛（本回合傷勢：手腕受傷）。 跟著人流離開，等站務確認安全後再處理失物。

#### 關鍵轉折

- 「我靠扶手，拿手機拍下後方。」 → 我停在扶手旁，人群掠過我身邊（本回合傷勢：肩膀撞傷）。 → 可改選「我叫小宇，帶他往前拉開距離。」 把注意力放回可通行的方向。

#### 官方依據

- [警政署《民眾自我安全防護常識彙編》頁 10、16、26–27](https://www.npa.gov.tw/ch/app/data/doc?detailNo=1402849470051258368&module=wg071&type=s)
- [臺北捷運公司：列車安全設備](https://www.metro.taipei/cp.aspx?n=C4B618682DB27979&s=7AB21391531CA32D)

#### 帶走一個思考題

- 如果離開教室的大門一時被堵住，我要如何先判斷有沒有安全路線？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 第 1 回合 | 我靠扶手，拿手機拍下後方。 | metro_distance_act_myth | 肩膀撞傷 |
| 第 3 回合 | 我握欄杆，卡在門邊等開門。 | metro_doors_act_myth | 手腕挫傷 |
| 第 4 回合 | 我停下，幫小宇撿耳機再走。 | metro_platform_act_myth | 手腕受傷（同伴） |
| 關鍵轉折 | 我靠扶手，拿手機拍下後方。 | metro_distance_act_myth | 肩膀撞傷 |

## 颱風夜，租屋處停電

7 題，5 種可達結局，334 個可達非終止狀態。

- 公開查證：消防防災館停電應變由區公所刊載，另以消防署 119、地方消防局一氧化碳宣導核對通報與燃燒設備。
- 待人工查證：食品保存依品項與實測溫度而異。本包省略分鐘數、藥品可否繼續使用與再復電時的設備操作細節。

| 檢查 | 數據 |
|---|---|
| 最長＝正確（標點計入） | 2/7（28.6%） |
| 最長＝正確（忽略標點） | 2/7（28.6%） |
| 動作最多＝正確 | 0/7（0.0%） |
| 最短＝正確（標點計入） | 1/7（14.3%） |
| 最短＝正確（忽略標點） | 1/7（14.3%） |
| 自我否定用詞 | 0/22 |
| 同題最大字差 | 4 字 |

比例含並列。動作數為按原文核對的可見行動標註。

| 決策點／問題 | 選項 | 判定 | 字數 | 動作數 | 採用 ID | 來源 |
|---|---|---|---:|---:|---|---|
| typhoon_light／室內突然變暗。桌邊放著平常用的東西，走道比房內更暗。我怎麼處理照明？ | 我開手電筒，先照亮眼前的通道。 | 正確 | 15 | 2 | typhoon_light_act_ok | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_light／室內突然變暗。桌邊放著平常用的東西，走道比房內更暗。我怎麼處理照明？ | 我點一支蠟燭照走廊，再回房找東西。 | 迷思 | 17 | 3 | typhoon_light_act_myth | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_light／室內突然變暗。桌邊放著平常用的東西，走道比房內更暗。我怎麼處理照明？ | 我摸黑走進走廊，找應急燈。 | 危險／延誤 | 13 | 2 | typhoon_light_act_risk | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_light 字差 | — | — | 4 | — | — | — |
| typhoon_plugs／我和小晴準備移到隔壁房間。剛才使用過的家電還留在原處，附近地面乾燥。我先怎麼處理？ | 我拔下乾燥處的電暖器與吹風機插頭。 | 正確 | 17 | 1 | typhoon_plugs_act_ok | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_plugs／我和小晴準備移到隔壁房間。剛才使用過的家電還留在原處，附近地面乾燥。我先怎麼處理？ | 我關掉暖器，把吹風機留著等復電。 | 迷思 | 16 | 2 | typhoon_plugs_act_myth | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_plugs／我和小晴準備移到隔壁房間。剛才使用過的家電還留在原處，附近地面乾燥。我先怎麼處理？ | 我留著暖器加熱檔，用外套蓋住。 | 危險／延誤 | 15 | 2 | typhoon_plugs_act_risk | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_plugs 字差 | — | — | 2 | — | — | — |
| typhoon_fumes／屋外風雨強，門窗關著。小晴看見收納間有發電機和卡式爐，問晚餐怎麼辦？ | 我選常溫備糧，和小晴待在安全處。 | 正確 | 16 | 2 | typhoon_fumes_act_ok | [co](https://www.tyfd.gov.tw/cht/index.php?act=article&article_id=1080&code=detail&ids=152) |
| typhoon_fumes／屋外風雨強，門窗關著。小晴看見收納間有發電機和卡式爐，問晚餐怎麼辦？ | 我在客廳用卡式爐煮一點熱食。 | 迷思 | 14 | 1 | typhoon_fumes_act_myth | [co](https://www.tyfd.gov.tw/cht/index.php?act=article&article_id=1080&code=detail&ids=152) |
| typhoon_fumes／屋外風雨強，門窗關著。小晴看見收納間有發電機和卡式爐，問晚餐怎麼辦？ | 我把發電機放在窗邊，啟動來接電扇。 | 危險／延誤 | 17 | 3 | typhoon_fumes_act_risk | [co](https://www.tyfd.gov.tw/cht/index.php?act=article&article_id=1080&code=detail&ids=152) |
| typhoon_fumes／屋外風雨強，門窗關著。小晴看見收納間有發電機和卡式爐，問晚餐怎麼辦？ | 我叫小晴等一下，去翻櫃子再找晚餐。 | 危險／延誤 | 17 | 3 | typhoon_fumes_act_other | [co](https://www.tyfd.gov.tw/cht/index.php?act=article&article_id=1080&code=detail&ids=152) |
| typhoon_fumes 字差 | — | — | 3 | — | — | — |
| typhoon_outage／透過窗看見附近街廓也停電，眼前沒有火煙或傷者。要回報給誰？ | 我撥1911通報區域停電和地址。 | 正確 | 16 | 1 | typhoon_outage_act_ok | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_outage／透過窗看見附近街廓也停電，眼前沒有火煙或傷者。要回報給誰？ | 我打119查復電，再請他轉報。 | 迷思 | 15 | 2 | typhoon_outage_act_myth | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_outage／透過窗看見附近街廓也停電，眼前沒有火煙或傷者。要回報給誰？ | 我到大門口察看，再問鄰居是否有人報修。 | 危險／延誤 | 19 | 3 | typhoon_outage_act_risk | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_outage 字差 | — | — | 4 | — | — | — |
| typhoon_help／隔戶有人喊頭暈，說自己站不穩。我站在屋外的樓梯口，屋內還有機器運轉的聲音。我要怎麼做？ | 我在安全處撥119，回報位置與不適。 | 正確 | 18 | 2 | typhoon_help_act_ok | [urgent](https://www.nfa.gov.tw/cht/?code=list&ids=66) |
| typhoon_help／隔戶有人喊頭暈，說自己站不穩。我站在屋外的樓梯口，屋內還有機器運轉的聲音。我要怎麼做？ | 我先打1911問停電狀況，再找人求助。 | 迷思 | 19 | 3 | typhoon_help_act_myth | [urgent](https://www.nfa.gov.tw/cht/?code=list&ids=66) |
| typhoon_help／隔戶有人喊頭暈，說自己站不穩。我站在屋外的樓梯口，屋內還有機器運轉的聲音。我要怎麼做？ | 我進隔戶查看，再把住戶帶出來。 | 危險／延誤 | 15 | 2 | typhoon_help_act_risk | [co](https://www.tyfd.gov.tw/cht/index.php?act=article&article_id=1080&code=detail&ids=152) |
| typhoon_help 字差 | — | — | 4 | — | — | — |
| typhoon_fridge／我回到屋內，冰箱停電一段時間了。桌上的食物有些原本需要冷藏，有些不用。我接下來怎麼安排？ | 我關好冰箱，改吃常溫保存的備糧。 | 正確 | 16 | 2 | typhoon_fridge_act_ok | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_fridge／我回到屋內，冰箱停電一段時間了。桌上的食物有些原本需要冷藏，有些不用。我接下來怎麼安排？ | 我打開冰箱逐層查看，先挑冷飲補充水分。 | 迷思 | 19 | 3 | typhoon_fridge_act_myth | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_fridge／我回到屋內，冰箱停電一段時間了。桌上的食物有些原本需要冷藏，有些不用。我接下來怎麼安排？ | 我聞聞回溫牛奶，喝幾口確認味道。 | 危險／延誤 | 16 | 2 | typhoon_fridge_act_risk | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_fridge 字差 | — | — | 3 | — | — | — |
| typhoon_wire／從室內看到巷口一條電線掉下來，旁邊仍有風雨，暫時沒人靠近。最後我要怎麼處理？ | 我留在安全處打1911，報電線位置。 | 正確 | 18 | 2 | typhoon_wire_act_ok | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_wire／從室內看到巷口一條電線掉下來，旁邊仍有風雨，暫時沒人靠近。最後我要怎麼處理？ | 我到門外拍照，傳給鄰居確認是哪一條。 | 迷思 | 18 | 3 | typhoon_wire_act_myth | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_wire／從室內看到巷口一條電線掉下來，旁邊仍有風雨，暫時沒人靠近。最後我要怎麼處理？ | 我用手把路上的電線移開，讓人好走。 | 危險／延誤 | 17 | 1 | typhoon_wire_act_risk | [outage](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699) |
| typhoon_wire 字差 | — | — | 1 | — | — | — |

### 全對重播回顧全文

結局傷勢清單｜無紀錄傷勢。

#### 結果

安全應變並交接。本人傷勢分級為無傷。

照明、用電與報案分流都已處理。

#### 做對的決定

- 「我開手電筒，先照亮眼前的通道。」 電池照明沒有明火。
- 「我拔下乾燥處的電暖器與吹風機插頭。」 乾燥可安全操作時，可避免設備復電後意外啟動。
- 「我選常溫備糧，和小晴待在安全處。」 密閉空間要避免燃料設備不完全燃燒的風險。

#### 下次可以補上的

本場無此項。

#### 這次的危險選擇與後果

本場無此項。

#### 關鍵轉折

- 「我開手電筒，先照亮眼前的通道。」 → 手電筒照亮地板，小晴看得見腳下。 → 可以維持「我開手電筒，先照亮眼前的通道。」 電池照明沒有明火。

#### 官方依據

- [消防防災館《停電應變》（高雄市鹽埕區公所刊載）](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699)
- [桃園市消防局：一氧化碳中毒與居家防範](https://www.tyfd.gov.tw/cht/index.php?act=article&article_id=1080&code=detail&ids=152)

#### 帶走一個思考題

- 下次如果在宿舍遇到停電，我要如何確認該找台電還是消防？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 關鍵轉折 | 我開手電筒，先照亮眼前的通道。 |  | — |


### 亂玩重播回顧全文

結局傷勢清單｜小晴：手指燙傷。

#### 結果

延誤後完成應變交接。本人傷勢分級為無傷。撤離或救援延誤：為處理明火反覆往返、整理電器後須折返確認插頭。

最早因為處理明火反覆往返造成延誤。

#### 做對的決定

本場無此項。

#### 下次可以補上的

- 在安全距離通報1911，提醒他人遠離。
- 保持冰箱關閉，改用可安全在常溫保存的食物。

#### 這次的危險選擇與後果

- 第 1 回合「我點一支蠟燭照走廊，再回房找東西。」 蠟燭留在走道，小晴挪它時手指被燙到（本回合傷勢：手指燙傷）。 走道用手電筒照明，避免無人照看的火源。
- 第 2 回合「我關掉暖器，把吹風機留著等復電。」 暖器已關，但吹風機還接著電。 插座與手部乾燥時拔下插頭。
- 第 3 回合「我叫小晴等一下，去翻櫃子再找晚餐。」 我留在昏暗的收納間翻找，耽擱了留意屋外狀況。 優先取用在手邊且無需用火的備糧。

#### 關鍵轉折

- 「我點一支蠟燭照走廊，再回房找東西。」 → 蠟燭留在走道，小晴挪它時手指被燙到（本回合傷勢：手指燙傷）。 → 可改選「我開手電筒，先照亮眼前的通道。」 走道用手電筒照明，避免無人照看的火源。

#### 官方依據

- [消防防災館《停電應變》（高雄市鹽埕區公所刊載）](https://yancheng.kcg.gov.tw/News_Content.aspx?n=29B3D06675FAF607&s=100A98A0F122872C&sms=52EBA08E597C8699)
- [桃園市消防局：一氧化碳中毒與居家防範](https://www.tyfd.gov.tw/cht/index.php?act=article&article_id=1080&code=detail&ids=152)

#### 帶走一個思考題

- 下次如果在宿舍遇到停電，我要如何確認該找台電還是消防？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 第 1 回合 | 我點一支蠟燭照走廊，再回房找東西。 | typhoon_light_act_myth | 手指燙傷（同伴） |
| 第 2 回合 | 我關掉暖器，把吹風機留著等復電。 | typhoon_plugs_act_myth | — |
| 第 3 回合 | 我叫小晴等一下，去翻櫃子再找晚餐。 | typhoon_fumes_act_other | — |
| 關鍵轉折 | 我點一支蠟燭照走廊，再回房找東西。 | typhoon_light_act_myth | 手指燙傷（同伴） |

## 住宅裡的第二次震動

7 題，3 種可達結局，382 個可達非終止狀態。

- 草稿，待人工審查。中央氣象署與內政部支持就地掩護、震後評估及敲擊求救，消防署報案要領支持通報位置。出入口是否安全依題內已呈現的狀態。
- 待人工查證：公寓格局、斜櫃阻礙、餘震時點與各處傷勢均為合成情節。原舊包的 NCDR 大型 PDF 未能以網頁工具逐頁核對，本草稿不以其背書。

| 檢查 | 數據 |
|---|---|
| 最長＝正確（標點計入） | 1/7（14.3%） |
| 最長＝正確（忽略標點） | 1/7（14.3%） |
| 動作最多＝正確 | 1/7（14.3%） |
| 最短＝正確（標點計入） | 2/7（28.6%） |
| 最短＝正確（忽略標點） | 2/7（28.6%） |
| 自我否定用詞 | 0/21 |
| 同題最大字差 | 4 字 |

比例含並列。動作數為按原文核對的可見行動標註。

| 決策點／問題 | 選項 | 判定 | 字數 | 動作數 | 採用 ID | 來源 |
|---|---|---|---:|---:|---|---|
| home_cover／餐具從桌邊滾落，門口也傳來木頭碰撞聲。我第一步怎麼做？ | 我伏到矮桌下護頭，抓緊桌腳。 | 正確 | 14 | 1 | home_cover_act_ok | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| home_cover／餐具從桌邊滾落，門口也傳來木頭碰撞聲。我第一步怎麼做？ | 我抓穩窗邊立櫃，叫阿哲也靠過來。 | 迷思 | 16 | 2 | home_cover_act_myth | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| home_cover／餐具從桌邊滾落，門口也傳來木頭碰撞聲。我第一步怎麼做？ | 我扶著餐桌起身，往門邊查看走道。 | 危險／延誤 | 16 | 2 | home_cover_act_risk | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| home_cover 字差 | — | — | 2 | — | — | — |
| home_assess／地板停晃後，櫃子橫斜在門口。阿哲叫了我的名字。我先確認什麼？ | 我原地查看傷勢和可見的出口。 | 正確 | 14 | 1 | home_assess_act_ok | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_assess／地板停晃後，櫃子橫斜在門口。阿哲叫了我的名字。我先確認什麼？ | 我快步走近門邊，招手叫阿哲跟上。 | 迷思 | 16 | 2 | home_assess_act_myth | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_assess／地板停晃後，櫃子橫斜在門口。阿哲叫了我的名字。我先確認什麼？ | 我側身鑽進斜櫃後面，再伸手撐住櫃面。 | 危險／延誤 | 18 | 2 | home_assess_act_risk | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_assess 字差 | — | — | 4 | — | — | — |
| home_call／手機出現短暫訊號。街上的聲音離得很遠。我把這次聯絡用在哪裡？ | 我打給一一九，報門牌和兩人正受困。 | 正確 | 17 | 1 | home_call_act_ok | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| home_call／手機出現短暫訊號。街上的聲音離得很遠。我把這次聯絡用在哪裡？ | 我打給樓下鄰居，請他敲門看情況。 | 迷思 | 16 | 2 | home_call_act_myth | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| home_call／手機出現短暫訊號。街上的聲音離得很遠。我把這次聯絡用在哪裡？ | 我先錄下房裡的畫面，再傳給群組好友。 | 危險／延誤 | 18 | 2 | home_call_act_risk | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| home_call 字差 | — | — | 2 | — | — | — |
| home_signal／手機訊號中斷。我聽見外頭短暫靜了下來。現在怎麼讓外面注意到我們？ | 我在原地敲響金屬椅腳，停下聽回音。 | 正確 | 17 | 2 | home_signal_act_ok | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_signal／手機訊號中斷。我聽見外頭短暫靜了下來。現在怎麼讓外面注意到我們？ | 我一直朝門口喊，叫阿哲也一起喊。 | 迷思 | 16 | 2 | home_signal_act_myth | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_signal／手機訊號中斷。我聽見外頭短暫靜了下來。現在怎麼讓外面注意到我們？ | 我踢了幾下門旁櫃角，想把聲音傳出去。 | 危險／延誤 | 18 | 1 | home_signal_act_risk | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_signal 字差 | — | — | 2 | — | — | — |
| home_shock／天花板又傳來碎響，腳下重新晃動。我接著怎麼做？ | 我趴回桌下護住頭頸，雙手抓緊桌腳。 | 正確 | 17 | 1 | home_shock_act_ok | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| home_shock／天花板又傳來碎響，腳下重新晃動。我接著怎麼做？ | 我站在桌沿旁，伸手接快掉的物品。 | 迷思 | 16 | 2 | home_shock_act_myth | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| home_shock／天花板又傳來碎響，腳下重新晃動。我接著怎麼做？ | 我走向窗邊觀察，再回頭找阿哲的位置。 | 危險／延誤 | 18 | 2 | home_shock_act_risk | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| home_shock 字差 | — | — | 2 | — | — | — |
| home_wait／震動暫停，阿哲放低音量。樓外偶爾傳來人聲。我怎麼安排接下來的等待？ | 我在原地保存體力，留意接近門口的回聲。 | 正確 | 19 | 1 | home_wait_act_ok | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_wait／震動暫停，阿哲放低音量。樓外偶爾傳來人聲。我怎麼安排接下來的等待？ | 我敲兩下散落玻璃，叫阿哲再去找物品。 | 迷思 | 18 | 2 | home_wait_act_myth | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_wait／震動暫停，阿哲放低音量。樓外偶爾傳來人聲。我怎麼安排接下來的等待？ | 我一面大聲報數，一面對門邊持續喊話。 | 危險／延誤 | 18 | 2 | home_wait_act_risk | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_wait 字差 | — | — | 1 | — | — | — |
| home_handoff／門外的聲音開始逐戶詢問。阿哲往較亮的地方探頭。我現在怎麼回應？ | 我從原位回答，照救援人員指示配合。 | 正確 | 17 | 1 | home_handoff_act_ok | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_handoff／門外的聲音開始逐戶詢問。阿哲往較亮的地方探頭。我現在怎麼回應？ | 我等人到門前，再請阿哲回應。 | 迷思 | 14 | 2 | home_handoff_act_myth | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_handoff／門外的聲音開始逐戶詢問。阿哲往較亮的地方探頭。我現在怎麼回應？ | 我貼近斜櫃探頭，再催阿哲一起靠過來。 | 危險／延誤 | 18 | 2 | home_handoff_act_risk | [moi](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D) |
| home_handoff 字差 | — | — | 4 | — | — | — |

### 全對重播回顧全文

結局傷勢清單｜無紀錄傷勢。

#### 結果

依定位獲救。本人傷勢分級為無傷。

位置已確認，救援人員依序接手。

#### 做對的決定

- 「我伏到矮桌下護頭，抓緊桌腳。」 就地趴下、掩護、穩住可減少落物風險。
- 「我原地查看傷勢和可見的出口。」 震後先看傷勢與安全出口，避免在不穩定物件旁冒進。
- 「我打給一一九，報門牌和兩人正受困。」 先報具體位置能讓接線員定位。

#### 下次可以補上的

本場無此項。

#### 這次的危險選擇與後果

本場無此項。

#### 關鍵轉折

- 「我伏到矮桌下護頭，抓緊桌腳。」 → 我縮到桌下護住頭，手指牢牢扣住桌腳。 → 可以維持「我伏到矮桌下護頭，抓緊桌腳。」 就地趴下、掩護、穩住可減少落物風險。

#### 官方依據

- [中央氣象署：地震防護](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)
- [內政部：地震防災預防措施](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D)
- [內政部消防署：119 報案要領](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68)

#### 帶走一個思考題

- 在朋友家遇到地震，我會先確認哪兩件事，才能報出有用的位置？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 關鍵轉折 | 我伏到矮桌下護頭，抓緊桌腳。 |  | — |


### 亂玩重播回顧全文

結局傷勢清單｜本人：前臂擦傷、阿哲：手背擦傷、本人：肩部撞傷。

#### 結果

延誤後獲救。最嚴重的傷勢為肩部撞傷。本人傷勢分級為中度傷勢・需送醫。撤離或救援延誤：站在搖動的高櫃旁、前往不穩定的門邊。

最早因站在搖動的高櫃旁造成延誤，過程中出現肩部撞傷。

#### 做對的決定

本場無此項。

#### 下次可以補上的

- 有救援呼喊時清楚回應位置；聽指示後再移動。
- 固定在較安全位置，聽到有人靠近再短聲回應。

#### 這次的危險選擇與後果

- 第 1 回合「我抓穩窗邊立櫃，叫阿哲也靠過來。」 窗邊的層板掉下一個盒子，擦過我的前臂（本回合傷勢：前臂擦傷）。 晃動尚未停止時，改到手邊可及的堅固掩護。
- 第 2 回合「我快步走近門邊，招手叫阿哲跟上。」 木板邊緣擦到阿哲的手背，我聽到他吸了一口氣（本回合傷勢：手背擦傷）。 先在原位詢問同伴狀況，不把人帶到不穩定的門口。
- 第 5 回合「我站在桌沿旁，伸手接快掉的物品。」 一個鬆開的燈件打到我肩上，我動手時肩膀發痛（本回合傷勢：肩部撞傷）。 先保護自己，等晃動停下才處理物品。

#### 關鍵轉折

- 「我抓穩窗邊立櫃，叫阿哲也靠過來。」 → 窗邊的層板掉下一個盒子，擦過我的前臂（本回合傷勢：前臂擦傷）。 → 可改選「我伏到矮桌下護頭，抓緊桌腳。」 晃動尚未停止時，改到手邊可及的堅固掩護。

#### 官方依據

- [中央氣象署：地震防護](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)
- [內政部：地震防災預防措施](https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D)

#### 帶走一個思考題

- 在朋友家遇到地震，我會先確認哪兩件事，才能報出有用的位置？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 第 1 回合 | 我抓穩窗邊立櫃，叫阿哲也靠過來。 | home_cover_act_myth | 前臂擦傷 |
| 第 2 回合 | 我快步走近門邊，招手叫阿哲跟上。 | home_assess_act_myth | 手背擦傷（同伴） |
| 第 5 回合 | 我站在桌沿旁，伸手接快掉的物品。 | home_shock_act_myth | 肩部撞傷 |
| 關鍵轉折 | 我抓穩窗邊立櫃，叫阿哲也靠過來。 | home_cover_act_myth | 前臂擦傷 |

## 山路上的雨聲

7 題，3 種可達結局，255 個可達非終止狀態。

- 草稿，待人工審查。農村水保署土石流指引及徵兆提供警戒、遠離危險區與撤離依據；公路局支援依最新交通管制選路。
- 待人工查證：服務站、迴轉點與接應時機均為合成設定；任何真實路段應以當下公告和可用動線判斷。傷勢為教學事件。

| 檢查 | 數據 |
|---|---|
| 最長＝正確（標點計入） | 2/7（28.6%） |
| 最長＝正確（忽略標點） | 2/7（28.6%） |
| 動作最多＝正確 | 0/7（0.0%） |
| 最短＝正確（標點計入） | 2/7（28.6%） |
| 最短＝正確（忽略標點） | 2/7（28.6%） |
| 自我否定用詞 | 0/21 |
| 同題最大字差 | 4 字 |

比例含並列。動作數為按原文核對的可見行動標註。

| 決策點／問題 | 選項 | 判定 | 字數 | 動作數 | 採用 ID | 來源 |
|---|---|---|---:|---:|---|---|
| slide_alert／手機跳出警訊，地圖上只有部分路段變色。我先怎麼判斷？ | 我對照所在地和官方警戒範圍。 | 正確 | 14 | 1 | slide_alert_act_ok | [slide](https://246.ardswc.gov.tw/SelfPreparedness/Guide) |
| slide_alert／手機跳出警訊，地圖上只有部分路段變色。我先怎麼判斷？ | 我比照去年的警訊，問朋友這裡穩不穩。 | 迷思 | 18 | 2 | slide_alert_act_myth | [slide](https://246.ardswc.gov.tw/SelfPreparedness/Guide) |
| slide_alert／手機跳出警訊，地圖上只有部分路段變色。我先怎麼判斷？ | 我看遠處雨勢較弱，請小安照原路出發。 | 危險／延誤 | 18 | 2 | slide_alert_act_risk | [slide](https://246.ardswc.gov.tw/SelfPreparedness/Guide) |
| slide_alert 字差 | — | — | 4 | — | — | — |
| slide_barrier／前方的路障亮起警示燈，公路人員往這裡走來。我們怎麼安排這段路？ | 我停在服務站，確認封路通知。 | 正確 | 14 | 1 | slide_barrier_act_ok | [road](https://168.thb.gov.tw/) |
| slide_barrier／前方的路障亮起警示燈，公路人員往這裡走來。我們怎麼安排這段路？ | 我走到路障內側，拍給小安看路況。 | 迷思 | 16 | 2 | slide_barrier_act_myth | [road](https://168.thb.gov.tw/) |
| slide_barrier／前方的路障亮起警示燈，公路人員往這裡走來。我們怎麼安排這段路？ | 我移開路障，催小安沿山壁把車開過去。 | 危險／延誤 | 18 | 2 | slide_barrier_act_risk | [road](https://168.thb.gov.tw/) |
| slide_barrier 字差 | — | — | 4 | — | — | — |
| slide_return／工作人員說入口內側可以迴轉，原上山路線已封。我選哪條動線？ | 我按人員指示在站內迴轉，走公告路線。 | 正確 | 18 | 1 | slide_return_act_ok | [road](https://168.thb.gov.tw/) |
| slide_return／工作人員說入口內側可以迴轉，原上山路線已封。我選哪條動線？ | 我靠站牌停等，再刷新舊地圖。 | 迷思 | 14 | 2 | slide_return_act_myth | [road](https://168.thb.gov.tw/) |
| slide_return／工作人員說入口內側可以迴轉，原上山路線已封。我選哪條動線？ | 我請小安改開支線，沿著溪邊找會車處。 | 危險／延誤 | 18 | 2 | slide_return_act_risk | [road](https://168.thb.gov.tw/) |
| slide_return 字差 | — | — | 4 | — | — | — |
| slide_creek／小安說溪邊那條路看來更短。遠處水聲變得很大。我怎麼回應？ | 我請小安別靠近溪邊，留在較高路段。 | 正確 | 17 | 1 | slide_creek_act_ok | [signs](https://246.ardswc.gov.tw/DebrisFlow/Features) |
| slide_creek／小安說溪邊那條路看來更短。遠處水聲變得很大。我怎麼回應？ | 我帶小安走到橋頭，先看水有多深。 | 迷思 | 16 | 2 | slide_creek_act_myth | [signs](https://246.ardswc.gov.tw/DebrisFlow/Features) |
| slide_creek／小安說溪邊那條路看來更短。遠處水聲變得很大。我怎麼回應？ | 我讓小安在路邊等，自己下到溪邊拍照。 | 危險／延誤 | 18 | 2 | slide_creek_act_risk | [signs](https://246.ardswc.gov.tw/DebrisFlow/Features) |
| slide_creek 字差 | — | — | 2 | — | — | — |
| slide_block／替代路線的一段也封閉了，廣播剛更新。接下來怎麼安排？ | 我依新管制去指定等待點，讓人接應。 | 正確 | 17 | 1 | slide_block_act_ok | [road](https://168.thb.gov.tw/) |
| slide_block／替代路線的一段也封閉了，廣播剛更新。接下來怎麼安排？ | 我跨過滑濕路肩，去找另一側的入口。 | 迷思 | 17 | 2 | slide_block_act_myth | [road](https://168.thb.gov.tw/) |
| slide_block／替代路線的一段也封閉了，廣播剛更新。接下來怎麼安排？ | 我往原路多走一段，再回來等人。 | 危險／延誤 | 15 | 2 | slide_block_act_risk | [road](https://168.thb.gov.tw/) |
| slide_block 字差 | — | — | 2 | — | — | — |
| slide_report／有地方可以打電話，另一側的落石也阻斷了道路。我把哪些資訊傳出去？ | 我向一一九報位置、人數與落石路段。 | 正確 | 17 | 1 | slide_report_act_ok | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| slide_report／有地方可以打電話，另一側的落石也阻斷了道路。我把哪些資訊傳出去？ | 我告訴朋友雨勢大，請他轉傳。 | 迷思 | 14 | 2 | slide_report_act_myth | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| slide_report／有地方可以打電話，另一側的落石也阻斷了道路。我把哪些資訊傳出去？ | 我拍下前方路牌位置，再上傳給群組看。 | 危險／延誤 | 18 | 2 | slide_report_act_risk | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| slide_report 字差 | — | — | 4 | — | — | — |
| slide_shelter／接應的人帶我們到指定避難處，入口正在核對到場者。我怎麼回應？ | 我向服務人員報到，再確認小安的狀況。 | 正確 | 18 | 1 | slide_shelter_act_ok | [slide](https://246.ardswc.gov.tw/SelfPreparedness/Guide) |
| slide_shelter／接應的人帶我們到指定避難處，入口正在核對到場者。我怎麼回應？ | 我先跟小安去找位子，再回門口。 | 迷思 | 15 | 2 | slide_shelter_act_myth | [slide](https://246.ardswc.gov.tw/SelfPreparedness/Guide) |
| slide_shelter／接應的人帶我們到指定避難處，入口正在核對到場者。我怎麼回應？ | 我到戶外迎接下一批車，招手叫小安過來。 | 危險／延誤 | 19 | 2 | slide_shelter_act_risk | [slide](https://246.ardswc.gov.tw/SelfPreparedness/Guide) |
| slide_shelter 字差 | — | — | 4 | — | — | — |

### 全對重播回顧全文

結局傷勢清單｜無紀錄傷勢。

#### 結果

依管制抵達避難處。本人傷勢分級為無傷。

避開中斷路段後，兩人向服務點完成清點。

#### 做對的決定

- 「我對照所在地和官方警戒範圍。」 以所在地和主管機關警報判斷是否受影響。
- 「我停在服務站，確認封路通知。」 封路後不能以肉眼猜測下一段安全。
- 「我按人員指示在站內迴轉，走公告路線。」 只有當下確認可走的替代動線可採用。

#### 下次可以補上的

本場無此項。

#### 這次的危險選擇與後果

本場無此項。

#### 關鍵轉折

- 「我對照所在地和官方警戒範圍。」 → 我核對所在路段，發現我們在警戒範圍。 → 可以維持「我對照所在地和官方警戒範圍。」 以所在地和主管機關警報判斷是否受影響。

#### 官方依據

- [農村水保署：土石流自主防災指引](https://246.ardswc.gov.tw/SelfPreparedness/Guide)
- [公路局：省道即時交通資訊](https://168.thb.gov.tw/)

#### 帶走一個思考題

- 若出遊時看不到前方路況，我可以從哪些管道確認交通管制？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 關鍵轉折 | 我對照所在地和官方警戒範圍。 |  | — |


### 亂玩重播回顧全文

結局傷勢清單｜小安：小腿撞傷、本人：腳踝扭傷。

#### 結果

延後抵達避難處。最嚴重的傷勢為腳踝扭傷。本人傷勢分級為中度傷勢・需送醫。撤離或救援延誤：以往年消息代替此次公告、進到管制區觀察。

最早因以往年消息代替此次公告造成延誤，過程中出現腳踝扭傷。

#### 做對的決定

本場無此項。

#### 下次可以補上的

- 抵達時向服務人員報到，補位置、人數與傷勢。
- 在安全處回報路名或里程、人數、是否受傷及阻路位置。

#### 這次的危險選擇與後果

- 第 1 回合「我比照去年的警訊，問朋友這裡穩不穩。」 朋友不在這條路上，回話時已過一段時間。 改查此次官方公告與精確位置。
- 第 4 回合「我帶小安走到橋頭，先看水有多深。」 小安踩到濕石滑了一下，小腿撞到路緣（本回合傷勢：小腿撞傷）。 在高處遠離橋頭，由安全位置聽公告。
- 第 5 回合「我跨過滑濕路肩，去找另一側的入口。」 我在濕路肩滑倒，腳踝痛到難以正常站立（本回合傷勢：腳踝扭傷）。 退出不穩動線，留在有核對接應資訊的安全位置。

#### 關鍵轉折

- 「我比照去年的警訊，問朋友這裡穩不穩。」 → 朋友不在這條路上，回話時已過一段時間。 → 可改選「我對照所在地和官方警戒範圍。」 改查此次官方公告與精確位置。

#### 官方依據

- [農村水保署：土石流自主防災指引](https://246.ardswc.gov.tw/SelfPreparedness/Guide)
- [農村水保署：土石流發生前兆](https://246.ardswc.gov.tw/DebrisFlow/Features)
- [公路局：省道即時交通資訊](https://168.thb.gov.tw/)
- [消防署：119 報案要領](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68)

#### 帶走一個思考題

- 若出遊時看不到前方路況，我可以從哪些管道確認交通管制？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 第 1 回合 | 我比照去年的警訊，問朋友這裡穩不穩。 | slide_alert_act_myth | — |
| 第 4 回合 | 我帶小安走到橋頭，先看水有多深。 | slide_creek_act_myth | 小腿撞傷（同伴） |
| 第 5 回合 | 我跨過滑濕路肩，去找另一側的入口。 | slide_block_act_myth | 腳踝扭傷 |
| 關鍵轉折 | 我比照去年的警訊，問朋友這裡穩不穩。 | slide_alert_act_myth | — |

## 河谷聚落的廣播

7 題，3 種可達結局，255 個可達非終止狀態。

- 草稿，待人工審查。依林業保育署應變程序及地方公告區分河段禁入與指定社區撤離，轉線以主管機關指示為準。
- 待人工查證：封橋時點、同岸替代道路與高地的安全性由劇本宣告，不能套用到真實地點；各處傷勢為合成分支。

| 檢查 | 數據 |
|---|---|
| 最長＝正確（標點計入） | 1/7（14.3%） |
| 最長＝正確（忽略標點） | 1/7（14.3%） |
| 動作最多＝正確 | 0/7（0.0%） |
| 最短＝正確（標點計入） | 2/7（28.6%） |
| 最短＝正確（忽略標點） | 2/7（28.6%） |
| 自我否定用詞 | 0/21 |
| 同題最大字差 | 3 字 |

比例含並列。動作數為按原文核對的可見行動標註。

| 決策點／問題 | 選項 | 判定 | 字數 | 動作數 | 採用 ID | 來源 |
|---|---|---|---:|---:|---|---|
| lake_alert／廣播逐段念出撤離區，有幾個地名相似。我先做哪一件事？ | 我對照門牌和官方撤離範圍。 | 正確 | 13 | 1 | lake_alert_act_ok | [county](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454) |
| lake_alert／廣播逐段念出撤離區，有幾個地名相似。我先做哪一件事？ | 我聽鄰居說還早，請他晚點再通知。 | 迷思 | 16 | 2 | lake_alert_act_myth | [county](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454) |
| lake_alert／廣播逐段念出撤離區，有幾個地名相似。我先做哪一件事？ | 我從窗邊看河水，請阿蘭幫忙判斷。 | 危險／延誤 | 16 | 2 | lake_alert_act_risk | [county](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454) |
| lake_alert 字差 | — | — | 3 | — | — | — |
| lake_leave／里內廣播要求這段街道撤離。阿蘭轉身去找家中的物品。我怎麼和她商量？ | 我請阿蘭和我走，沿指定路線離開。 | 正確 | 16 | 1 | lake_leave_act_ok | [public](https://prepare.mnd.gov.tw/emergency-responses) |
| lake_leave／里內廣播要求這段街道撤離。阿蘭轉身去找家中的物品。我怎麼和她商量？ | 我等阿蘭整理袋子，在門邊看。 | 迷思 | 14 | 2 | lake_leave_act_myth | [public](https://prepare.mnd.gov.tw/emergency-responses) |
| lake_leave／里內廣播要求這段街道撤離。阿蘭轉身去找家中的物品。我怎麼和她商量？ | 我回房拿證件，並請她去找其他東西。 | 危險／延誤 | 17 | 2 | lake_leave_act_risk | [public](https://prepare.mnd.gov.tw/emergency-responses) |
| lake_leave 字差 | — | — | 3 | — | — | — |
| lake_bridge／橋頭架起管制線。出發前我們原本打算穿過橋，現在怎麼選方向？ | 我依更新指示，改走同岸的替代路線。 | 正確 | 17 | 1 | lake_bridge_act_ok | [lake](https://www.forest.gov.tw/file/66794) |
| lake_bridge／橋頭架起管制線。出發前我們原本打算穿過橋，現在怎麼選方向？ | 我在封鎖線外等，再查看群組消息。 | 迷思 | 16 | 2 | lake_bridge_act_myth | [lake](https://www.forest.gov.tw/file/66794) |
| lake_bridge／橋頭架起管制線。出發前我們原本打算穿過橋，現在怎麼選方向？ | 我趁橋面看起來乾，帶阿蘭跨過管制線。 | 危險／延誤 | 18 | 2 | lake_bridge_act_risk | [lake](https://www.forest.gov.tw/file/66794) |
| lake_bridge 字差 | — | — | 2 | — | — | — |
| lake_water／我看見河水變濁，水上帶著樹枝。旁邊有人停下來看。我怎麼做？ | 我勸阿蘭離開水岸，沿著指示往外走。 | 正確 | 17 | 1 | lake_water_act_ok | [public](https://prepare.mnd.gov.tw/emergency-responses) |
| lake_water／我看見河水變濁，水上帶著樹枝。旁邊有人停下來看。我怎麼做？ | 我帶她靠近濕地，想看清水的位置。 | 迷思 | 16 | 2 | lake_water_act_myth | [public](https://prepare.mnd.gov.tw/emergency-responses) |
| lake_water／我看見河水變濁，水上帶著樹枝。旁邊有人停下來看。我怎麼做？ | 我拍下河面變化，再沿人群走到欄杆旁。 | 危險／延誤 | 18 | 2 | lake_water_act_risk | [public](https://prepare.mnd.gov.tw/emergency-responses) |
| lake_water 字差 | — | — | 2 | — | — | — |
| lake_high／前方平面道路不能走了，廣播指定同岸的高處待援點。我如何改變去向？ | 我沿官方指示走到同岸高處的待援點。 | 正確 | 17 | 1 | lake_high_act_ok | [county](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454) |
| lake_high／前方平面道路不能走了，廣播指定同岸的高處待援點。我如何改變去向？ | 我跨過濕滑的矮牆，想走較短的小徑。 | 迷思 | 17 | 2 | lake_high_act_myth | [county](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454) |
| lake_high／前方平面道路不能走了，廣播指定同岸的高處待援點。我如何改變去向？ | 我往堤頂走一段，找有空的接應處。 | 危險／延誤 | 16 | 2 | lake_high_act_risk | [county](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454) |
| lake_high 字差 | — | — | 1 | — | — | — |
| lake_report／從高處看得到地名標誌，手機也有訊號。我怎麼讓外界知道我們在哪裡？ | 我向一一九報高地位置、人數及阻路。 | 正確 | 17 | 1 | lake_report_act_ok | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| lake_report／從高處看得到地名標誌，手機也有訊號。我怎麼讓外界知道我們在哪裡？ | 我在家人群組說平安，等大家回應。 | 迷思 | 16 | 2 | lake_report_act_myth | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| lake_report／從高處看得到地名標誌，手機也有訊號。我怎麼讓外界知道我們在哪裡？ | 我先拍地名和低處道路，再把照片上傳。 | 危險／延誤 | 18 | 2 | lake_report_act_risk | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| lake_report 字差 | — | — | 2 | — | — | — |
| lake_wait／雨勢變小了，阿蘭提到想回家看看；廣播還沒解除限制。我怎麼處理？ | 我和阿蘭留在高地，等官方通知。 | 正確 | 15 | 1 | lake_wait_act_ok | [county](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454) |
| lake_wait／雨勢變小了，阿蘭提到想回家看看；廣播還沒解除限制。我怎麼處理？ | 我去看原路狀況，再回來找阿蘭。 | 迷思 | 15 | 2 | lake_wait_act_myth | [county](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454) |
| lake_wait／雨勢變小了，阿蘭提到想回家看看；廣播還沒解除限制。我怎麼處理？ | 我和她先回住家附近，再聽下一輪廣播。 | 危險／延誤 | 18 | 2 | lake_wait_act_risk | [county](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454) |
| lake_wait 字差 | — | — | 3 | — | — | — |

### 全對重播回顧全文

結局傷勢清單｜無紀錄傷勢。

#### 結果

在指定高地獲得接應。本人傷勢分級為無傷。

依更新避難路線抵達安全待救點，回報位置與人數。

#### 做對的決定

- 「我對照門牌和官方撤離範圍。」 河段禁入與特定地區撤離是不同通知。
- 「我請阿蘭和我走，沿指定路線離開。」 正式撤離已發布時，延後出門可能錯過可用路線。
- 「我依更新指示，改走同岸的替代路線。」 橋梁封閉後，仍乾的橋面不能代表安全。

#### 下次可以補上的

本場無此項。

#### 這次的危險選擇與後果

本場無此項。

#### 關鍵轉折

- 「我對照門牌和官方撤離範圍。」 → 門牌對上正式撤離的區域。 → 可以維持「我對照門牌和官方撤離範圍。」 河段禁入與特定地區撤離是不同通知。

#### 官方依據

- [花蓮縣政府：馬太鞍溪堰塞湖警戒與疏散](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454)
- [全民安全指引：緊急應變](https://prepare.mnd.gov.tw/emergency-responses)
- [林業保育署：國有林地堰塞湖應變標準作業程序](https://www.forest.gov.tw/file/66794)

#### 帶走一個思考題

- 如果我到陌生河谷旅行，收到警訊時如何確認自己是否在撤離範圍？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 關鍵轉折 | 我對照門牌和官方撤離範圍。 |  | — |


### 亂玩重播回顧全文

結局傷勢清單｜阿蘭：手掌擦傷、本人：腳踝扭傷。

#### 結果

延誤後在高地獲得接應。最嚴重的傷勢為腳踝扭傷。本人傷勢分級為中度傷勢・需送醫。撤離或救援延誤：等鄰居轉述最新訊息、等同伴整理物品。

最早因等鄰居轉述最新訊息造成延誤，過程中出現腳踝扭傷。

#### 做對的決定

本場無此項。

#### 下次可以補上的

- 直到主管單位解除，留在指定地方並維持聯絡。
- 報出可辨識地名、多少人、傷勢及無法通行的地點。

#### 這次的危險選擇與後果

- 第 1 回合「我聽鄰居說還早，請他晚點再通知。」 鄰居轉身後，廣播已開始通知下一批。 優先核對官方警報及本戶位置。
- 第 4 回合「我帶她靠近濕地，想看清水的位置。」 靠岸處濕又滑，阿蘭跌了一下，手掌被地面擦傷（本回合傷勢：手掌擦傷）。 遠離濕滑水岸，在安全位置查看官方訊息。
- 第 5 回合「我跨過濕滑的矮牆，想走較短的小徑。」 鞋子在濕牆上打滑，我的腳踝疼得不好走（本回合傷勢：腳踝扭傷）。 循現場指定的確認路線，別跨越積水或濕牆。

#### 關鍵轉折

- 「我聽鄰居說還早，請他晚點再通知。」 → 鄰居轉身後，廣播已開始通知下一批。 → 可改選「我對照門牌和官方撤離範圍。」 優先核對官方警報及本戶位置。

#### 官方依據

- [花蓮縣政府：馬太鞍溪堰塞湖警戒與疏散](https://www.hl.gov.tw/News_Content.aspx?n=32725&s=214454)
- [全民安全指引：緊急應變](https://prepare.mnd.gov.tw/emergency-responses)
- [消防署：119 報案要領](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68)

#### 帶走一個思考題

- 如果我到陌生河谷旅行，收到警訊時如何確認自己是否在撤離範圍？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 第 1 回合 | 我聽鄰居說還早，請他晚點再通知。 | lake_alert_act_myth | — |
| 第 4 回合 | 我帶她靠近濕地，想看清水的位置。 | lake_water_act_myth | 手掌擦傷（同伴） |
| 第 5 回合 | 我跨過濕滑的矮牆，想走較短的小徑。 | lake_high_act_myth | 腳踝扭傷 |
| 關鍵轉折 | 我聽鄰居說還早，請他晚點再通知。 | lake_alert_act_myth | — |

## 震後樓道裡的焦味

7 題，3 種可達結局，367 個可達非終止狀態。

- 草稿，待人工審查。氣象署說明震後火災成因、臺南消防局說明疑似瓦斯時避開電器開關，消防署受困與通報資料支援煙況阻路的決策。
- 待人工查證：瓦斯氣味與其他樓層的煙來源沒有直接因果宣稱。煙蔓延、室內動線、餘震時點與傷勢是合成情節，需消防專業複核。

| 檢查 | 數據 |
|---|---|
| 最長＝正確（標點計入） | 2/7（28.6%） |
| 最長＝正確（忽略標點） | 2/7（28.6%） |
| 動作最多＝正確 | 0/7（0.0%） |
| 最短＝正確（標點計入） | 2/7（28.6%） |
| 最短＝正確（忽略標點） | 2/7（28.6%） |
| 自我否定用詞 | 0/21 |
| 同題最大字差 | 4 字 |

比例含並列。動作數為按原文核對的可見行動標註。

| 決策點／問題 | 選項 | 判定 | 字數 | 動作數 | 採用 ID | 來源 |
|---|---|---|---:|---:|---|---|
| quakefire_cover／屋子開始左右晃，架上的杯子往外滑。我的第一步是什麼？ | 我到堅固桌下護頭，抓穩桌腳。 | 正確 | 14 | 1 | quakefire_cover_act_ok | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| quakefire_cover／屋子開始左右晃，架上的杯子往外滑。我的第一步是什麼？ | 我伸手接住架上杯子，叫怡安也過來。 | 迷思 | 17 | 2 | quakefire_cover_act_myth | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| quakefire_cover／屋子開始左右晃，架上的杯子往外滑。我的第一步是什麼？ | 我扶著牆往門口跑，叫怡安拿鑰匙。 | 危險／延誤 | 16 | 2 | quakefire_cover_act_risk | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| quakefire_cover 字差 | — | — | 3 | — | — | — |
| quakefire_assess／搖晃暫時停了，走道另一頭有焦味。屋內地板也散著物品。我先判斷什麼？ | 我從原處查看煙況、人和可用動線。 | 正確 | 16 | 1 | quakefire_assess_act_ok | [cause](https://scweb.cwa.gov.tw/zh-tw/guidance/faqdetail/85) |
| quakefire_assess／搖晃暫時停了，走道另一頭有焦味。屋內地板也散著物品。我先判斷什麼？ | 我叫怡安去聞，自己留在門邊。 | 迷思 | 14 | 2 | quakefire_assess_act_myth | [cause](https://scweb.cwa.gov.tw/zh-tw/guidance/faqdetail/85) |
| quakefire_assess／搖晃暫時停了，走道另一頭有焦味。屋內地板也散著物品。我先判斷什麼？ | 我回內側先找手機，再跟怡安走出去看。 | 危險／延誤 | 18 | 2 | quakefire_assess_act_risk | [cause](https://scweb.cwa.gov.tw/zh-tw/guidance/faqdetail/85) |
| quakefire_assess 字差 | — | — | 4 | — | — | — |
| quakefire_gas／離廚房一段距離有疑似瓦斯味，可通行的前側沒有煙。怡安伸手要開燈，我怎麼回她？ | 我勸怡安把手收回，沿無煙的一側走。 | 正確 | 17 | 1 | quakefire_gas_act_ok | [gas](https://119.tainan.gov.tw/News_Content.aspx?n=25533&s=8693793) |
| quakefire_gas／離廚房一段距離有疑似瓦斯味，可通行的前側沒有煙。怡安伸手要開燈，我怎麼回她？ | 我請她開廚房燈，先查看爐子。 | 迷思 | 14 | 2 | quakefire_gas_act_myth | [gas](https://119.tainan.gov.tw/News_Content.aspx?n=25533&s=8693793) |
| quakefire_gas／離廚房一段距離有疑似瓦斯味，可通行的前側沒有煙。怡安伸手要開燈，我怎麼回她？ | 我往廚房裡走去查味道，再示意她等候。 | 危險／延誤 | 18 | 2 | quakefire_gas_act_risk | [gas](https://119.tainan.gov.tw/News_Content.aspx?n=25533&s=8693793) |
| quakefire_gas 字差 | — | — | 4 | — | — | — |
| quakefire_route／門外有兩條方向。內側出口遠端已見煙，前側的樓梯門外還看得清。我選哪邊？ | 我走向看得清的樓梯入口，沿途再確認。 | 正確 | 18 | 1 | quakefire_route_act_ok | [fire](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| quakefire_route／門外有兩條方向。內側出口遠端已見煙，前側的樓梯門外還看得清。我選哪邊？ | 我走熟悉的內側，想趁還認得路出去。 | 迷思 | 17 | 2 | quakefire_route_act_myth | [fire](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| quakefire_route／門外有兩條方向。內側出口遠端已見煙，前側的樓梯門外還看得清。我選哪邊？ | 我留在樓梯口看舊圖，再聽怡安的想法。 | 危險／延誤 | 18 | 2 | quakefire_route_act_risk | [fire](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| quakefire_route 字差 | — | — | 1 | — | — | — |
| quakefire_smoke／走到可見範圍邊緣，樓梯門外忽然被濃煙遮住。我退後還能回到較清楚的一側。我怎麼選？ | 我退回可隔煙的房內，把門帶緊。 | 正確 | 15 | 1 | quakefire_smoke_act_ok | [fire](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| quakefire_smoke／走到可見範圍邊緣，樓梯門外忽然被濃煙遮住。我退後還能回到較清楚的一側。我怎麼選？ | 我靠樓梯邊等一陣，看看煙會不會變薄。 | 迷思 | 18 | 2 | quakefire_smoke_act_myth | [fire](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| quakefire_smoke／走到可見範圍邊緣，樓梯門外忽然被濃煙遮住。我退後還能回到較清楚的一側。我怎麼選？ | 我貼著牆進樓梯間，想摸出下一層。 | 危險／延誤 | 16 | 2 | quakefire_smoke_act_risk | [fire](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113) |
| quakefire_smoke 字差 | — | — | 3 | — | — | — |
| quakefire_after／回到較清楚的一側，我又感到一次搖晃。窗邊和桌旁都在眼前。這一刻我怎麼做？ | 我就地伏低護頭頸，穩住手邊的桌腳。 | 正確 | 17 | 1 | quakefire_after_act_ok | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| quakefire_after／回到較清楚的一側，我又感到一次搖晃。窗邊和桌旁都在眼前。這一刻我怎麼做？ | 我走到玻璃窗旁，拉怡安來看下面。 | 迷思 | 16 | 2 | quakefire_after_act_myth | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| quakefire_after／回到較清楚的一側，我又感到一次搖晃。窗邊和桌旁都在眼前。這一刻我怎麼做？ | 我先打亮手機，再四處尋找屋裡的東西。 | 危險／延誤 | 18 | 2 | quakefire_after_act_risk | [eq](https://scweb.cwa.gov.tw/zh-tw/page/intro/11) |
| quakefire_after 字差 | — | — | 2 | — | — | — |
| quakefire_call／搖晃又停了，這一側能通話，前方的煙仍沒退。我先傳達哪些訊息？ | 我打給一一九，報地址、房號和受困人數。 | 正確 | 19 | 1 | quakefire_call_act_ok | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| quakefire_call／搖晃又停了，這一側能通話，前方的煙仍沒退。我先傳達哪些訊息？ | 我傳訊給朋友，請他看看樓下動靜。 | 迷思 | 16 | 2 | quakefire_call_act_myth | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| quakefire_call／搖晃又停了，這一側能通話，前方的煙仍沒退。我先傳達哪些訊息？ | 我繼續看走道煙況，和怡安等下一步。 | 危險／延誤 | 17 | 2 | quakefire_call_act_risk | [call](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| quakefire_call 字差 | — | — | 3 | — | — | — |

### 全對重播回顧全文

結局傷勢清單｜無紀錄傷勢。

#### 結果

隔煙待援後獲救。本人傷勢分級為無傷。

在安全一側避開煙與餘震，救援人員依位置接手。

#### 做對的決定

- 「我到堅固桌下護頭，抓穩桌腳。」 就近掩護可減少落物傷害。
- 「我從原處查看煙況、人和可用動線。」 震後可能有次生災害，先查現場而不是假定原因。
- 「我勸怡安把手收回，沿無煙的一側走。」 疑似瓦斯外洩時開關電器可能有火花，安全動線可用應離開。

#### 下次可以補上的

本場無此項。

#### 這次的危險選擇與後果

本場無此項。

#### 關鍵轉折

- 「我到堅固桌下護頭，抓穩桌腳。」 → 我貼低身體抓牢桌腳，杯子從遠一點落下。 → 可以維持「我到堅固桌下護頭，抓穩桌腳。」 就近掩護可減少落物傷害。

#### 官方依據

- [中央氣象署：地震防護](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)
- [中央氣象署：地震為何會引發火災](https://scweb.cwa.gov.tw/zh-tw/guidance/faqdetail/85)
- [臺南市消防局：瓦斯外洩的四步驟](https://119.tainan.gov.tw/News_Content.aspx?n=25533&s=8693793)

#### 帶走一個思考題

- 如果我在陌生大樓先遇到地震又聞到焦味，哪些現場線索會改變我原本的出路？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 關鍵轉折 | 我到堅固桌下護頭，抓穩桌腳。 |  | — |


### 亂玩重播回顧全文

結局傷勢清單｜本人：前臂擦傷、怡安：手背擦傷、本人：短暫煙霧刺激、本人：濃煙吸入後呼吸不適。

#### 結果

延誤後獲救。最嚴重的傷勢為濃煙吸入後呼吸不適。本人傷勢分級為中度傷勢・需送醫。撤離或救援延誤：搖晃時靠近置物架、讓同伴靠近未確認區域。

最早因搖晃時靠近置物架造成延誤，過程中出現濃煙吸入後呼吸不適。

#### 做對的決定

本場無此項。

#### 下次可以補上的

- 從可通話的安全位置急報地址、樓層與房號、人數和是否受困。
- 等到再次穩定後才確認靠窗或撤離動線。

#### 這次的危險選擇與後果

- 第 1 回合「我伸手接住架上杯子，叫怡安也過來。」 杯子撞到我的前臂，另一個滑到腳邊（本回合傷勢：前臂擦傷）。 先護住頭頸，不要在搖晃時接掉物。
- 第 2 回合「我叫怡安去聞，自己留在門邊。」 怡安忙著穿過散落物時滑了一下，手背擦到牆（本回合傷勢：手背擦傷）。 在可辨識的安全位置由遠觀察，和同伴一起重新判斷。
- 第 5 回合「我靠樓梯邊等一陣，看看煙會不會變薄。」 煙沒有立刻變薄，我持續咳嗽，胸口緊得不好說話（本回合傷勢：濃煙吸入後呼吸不適）。 一確認煙阻斷，就退回遠離煙的一側並隔煙。

#### 關鍵轉折

- 「我伸手接住架上杯子，叫怡安也過來。」 → 杯子撞到我的前臂，另一個滑到腳邊（本回合傷勢：前臂擦傷）。 → 可改選「我到堅固桌下護頭，抓穩桌腳。」 先護住頭頸，不要在搖晃時接掉物。

#### 官方依據

- [中央氣象署：地震防護](https://scweb.cwa.gov.tw/zh-tw/page/intro/11)
- [中央氣象署：地震為何會引發火災](https://scweb.cwa.gov.tw/zh-tw/guidance/faqdetail/85)
- [消防署：火場受困時關門、靠窗通報](https://www.nfa.gov.tw/pro/index.php?article_id=5720&code=list&flag=detail&ids=113)
- [消防署：119 報案要領](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68)

#### 帶走一個思考題

- 如果我在陌生大樓先遇到地震又聞到焦味，哪些現場線索會改變我原本的出路？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 第 1 回合 | 我伸手接住架上杯子，叫怡安也過來。 | quakefire_cover_act_myth | 前臂擦傷 |
| 第 2 回合 | 我叫怡安去聞，自己留在門邊。 | quakefire_assess_act_myth | 手背擦傷（同伴） |
| 第 5 回合 | 我靠樓梯邊等一陣，看看煙會不會變薄。 | quakefire_smoke_act_myth | 濃煙吸入後呼吸不適 |
| 關鍵轉折 | 我伸手接住架上杯子，叫怡安也過來。 | quakefire_cover_act_myth | 前臂擦傷 |
