# 方案 B｜低窪淹水正式介入情境報告

草稿，待人工審查。2.0.0 已列入正式介入配置，預設可見且標示「待審查」。此報告使用固定向量重播，OpenAI API 呼叫 0 次。

## 八個決策與完整選項

最長、實字最多、動作最多、最短與實字最少為正確的題數依序為 1/8、1/8、2/8、2/8、2/8。計入並列。最大同題字差 4 字，未命中自我否定用語。

| 題幹 | 選項 | 判定 | 字數 | 動作數 | 行為 ID | 來源 |
| --- | --- | --- | ---: | ---: | --- | --- |
| 雨聲蓋過排水口的聲音，屋內地板、手和總開關一帶仍乾燥。我先處理什麼？ | 我確認乾燥，再切斷屋內總電源。 | 正確 | 15 | 1 | flood_power_act_ok | [power-flood](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) |
| 雨聲蓋過排水口的聲音，屋內地板、手和總開關一帶仍乾燥。我先處理什麼？ | 我搬高延長線，再整理插頭。 | 迷思 | 13 | 2 | flood_power_act_myth | [power-flood](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) |
| 雨聲蓋過排水口的聲音，屋內地板、手和總開關一帶仍乾燥。我先處理什麼？ | 我開著電器先收拾物品，等雨停下。 | 危險／延誤 | 16 | 2 | flood_power_act_risk | [power-flood](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) |
| 門縫冒進一線混水，電箱前方已有積水；乾側的梯口仍看得見。我怎麼選？ | 我避開電箱，往乾側梯口退。 | 正確 | 13 | 1 | flood_wet_panel_act_ok | [power-flood](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) |
| 門縫冒進一線混水，電箱前方已有積水；乾側的梯口仍看得見。我怎麼選？ | 我在玄關鋪毛巾，再拿拖把吸水。 | 迷思 | 15 | 2 | flood_wet_panel_act_myth | [power-flood](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) |
| 門縫冒進一線混水，電箱前方已有積水；乾側的梯口仍看得見。我怎麼選？ | 我踩水走到電箱，想確認開關位置。 | 危險／延誤 | 16 | 2 | flood_wet_panel_act_risk、flood_wet_panel_slip | [power-flood](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html)、[wet-flood](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D) |
| 坡道底湧出水聲。阿哲攥著車鑰匙，說再晚就來不及移車。我怎麼回他？ | 我陪阿哲退到梯口，請他留在乾處。 | 正確 | 16 | 2 | flood_basement_act_ok | [wet-flood](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D)、[county-flood](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=4837) |
| 坡道底湧出水聲。阿哲攥著車鑰匙，說再晚就來不及移車。我怎麼回他？ | 我站在乾處，先讓阿哲下去看。 | 迷思 | 14 | 2 | flood_basement_act_myth | [wet-flood](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D)、[county-flood](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=4837) |
| 坡道底湧出水聲。阿哲攥著車鑰匙，說再晚就來不及移車。我怎麼回他？ | 我跟他走下車庫，想趁水淺把車移走。 | 危險／延誤 | 17 | 2 | flood_basement_act_risk | [wet-flood](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D)、[county-flood](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=4837) |
| 巷口一輛車停下，水流遮住路面標線。鄰居喊說外面也許還能開出去。我怎麼判斷？ | 我留在乾側，再找可走的樓梯。 | 正確 | 14 | 1 | flood_road_act_ok | [road-flood](https://bear.emic.gov.tw/MY2/topic/takeShelter/flood) |
| 巷口一輛車停下，水流遮住路面標線。鄰居喊說外面也許還能開出去。我怎麼判斷？ | 我留在門邊，等別的車先試。 | 迷思 | 13 | 2 | flood_road_act_myth | [road-flood](https://bear.emic.gov.tw/MY2/topic/takeShelter/flood) |
| 巷口一輛車停下，水流遮住路面標線。鄰居喊說外面也許還能開出去。我怎麼判斷？ | 我去開車，沿別人的車道穿過積水。 | 危險／延誤 | 16 | 2 | flood_road_act_risk | [road-flood](https://bear.emic.gov.tw/MY2/topic/takeShelter/flood) |
| 原本的出入口已被水截斷；這棟樓外觀無可見損壞，室內兩段高度可到。我怎麼選停留位置？ | 我從乾燥的樓梯直接走上二樓。 | 正確 | 14 | 1 | flood_vertical_act_ok | [wet-flood](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D) |
| 原本的出入口已被水截斷；這棟樓外觀無可見損壞，室內兩段高度可到。我怎麼選停留位置？ | 我停在半層等水退，再考慮往上。 | 迷思 | 15 | 2 | flood_vertical_act_myth | [wet-flood](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D) |
| 原本的出入口已被水截斷；這棟樓外觀無可見損壞，室內兩段高度可到。我怎麼選停留位置？ | 我回頭繞向門口，再找地方墊高等候。 | 危險／延誤 | 17 | 2 | flood_vertical_act_risk | [wet-flood](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D) |
| 我到二樓了，巷口的水隔斷外出動線。手機還有訊號，現在怎麼聯絡外面？ | 我打119，報地址和兩人受困位置。 | 正確 | 17 | 2 | flood_call_act_ok | [call-flood](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| 我到二樓了，巷口的水隔斷外出動線。手機還有訊號，現在怎麼聯絡外面？ | 我拍下水位，傳房東後再通話。 | 迷思 | 14 | 2 | flood_call_act_myth | [call-flood](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| 我到二樓了，巷口的水隔斷外出動線。手機還有訊號，現在怎麼聯絡外面？ | 我拍下上漲的積水，貼社群請人轉報。 | 危險／延誤 | 17 | 2 | flood_call_act_risk | [call-flood](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| 我聽見外面有人喊話，樓下仍有水聲；窗邊和樓梯口都看得到。我怎麼回應？ | 我在二樓安全的窗內向外示意。 | 正確 | 14 | 1 | flood_signal_act_ok | [wet-flood](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D) |
| 我聽見外面有人喊話，樓下仍有水聲；窗邊和樓梯口都看得到。我怎麼回應？ | 我往樓下走，看誰在喊我。 | 迷思 | 12 | 2 | flood_signal_act_myth | [wet-flood](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D) |
| 我聽見外面有人喊話，樓下仍有水聲；窗邊和樓梯口都看得到。我怎麼回應？ | 我往地面入口移動，想在門口接應。 | 危險／延誤 | 16 | 2 | flood_signal_act_risk | [wet-flood](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D) |
| 救援人員已接手。水退時留下的水線還在插座旁；有人提議試電，我怎麼處理？ | 我保持設備原狀，等合格電工檢查。 | 正確 | 16 | 1 | flood_recovery_act_ok | [power-flood](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) |
| 救援人員已接手。水退時留下的水線還在插座旁；有人提議試電，我怎麼處理？ | 我確認插座外面乾了，請房東先復電。 | 迷思 | 17 | 2 | flood_recovery_act_myth | [power-flood](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) |
| 救援人員已接手。水退時留下的水線還在插座旁；有人提議試電，我怎麼處理？ | 我插回延長線，想測樓下的電力。 | 危險／延誤 | 15 | 2 | flood_recovery_act_risk | [power-flood](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) |

## 六種可達結局

下列為驗證達到各結局的代表路徑。危急終止的傷勢不評定。

| 結局與傷勢 | 路徑與觸發 |
| --- | --- |
| 在高處平安待救（無傷） | 我確認乾燥，再切斷屋內總電源 → 我避開電箱，往乾側梯口退 → 我陪阿哲退到梯口，請他留在乾處 → 我留在乾側，再找可走的樓梯 → 我沿乾梯登上二樓，在平台等阿哲 → 我打119，報地址和兩人受困位置 → 我留在二樓窗內示意，等候接應 → 我保持設備原狀，等合格電工檢查。結局規則 `safe`，結算回合 8。 |
| 延誤後由救援人員協助（中度） | 我搬高延長線，再整理插頭 → 我在玄關鋪毛巾，再拿拖把吸水 → 我站在乾處，先讓阿哲下去看 → 我留在門邊，等別的車先試 → 我停在半層等水退，再考慮往上 → 我拍下水位，傳房東後再通話 → 我往樓下走，看誰在喊我 → 我確認插座外面乾了，請房東先復電。結局規則 `delayed`，結算回合 8。 |
| 感電危機，演練中止（不評定） | 我搬高延長線，再整理插頭 → 我踩水走到電箱，想確認開關位置。結局規則 `flood_wet_panel_act_risk_ending`，結算回合 1。 |
| 受困地下車庫（不評定） | 我確認乾燥，再切斷屋內總電源 → 我避開電箱，往乾側梯口退 → 我跟他走下車庫，想趁水淺把車移走。結局規則 `flood_basement_act_risk_ending`，結算回合 2。 |
| 車輛受困積水（不評定） | 我確認乾燥，再切斷屋內總電源 → 我避開電箱，往乾側梯口退 → 我陪阿哲退到梯口，請他留在乾處 → 我去開車，沿別人的車道穿過積水。結局規則 `flood_road_act_risk_ending`，結算回合 3。 |
| 已獲救，復電檢查延後（無傷） | 我確認乾燥，再切斷屋內總電源 → 我避開電箱，往乾側梯口退 → 我陪阿哲退到梯口，請他留在乾處 → 我留在乾側，再找可走的樓梯 → 我沿乾梯登上二樓，在平台等阿哲 → 我打119，報地址和兩人受困位置 → 我留在二樓窗內示意，等候接應 → 我確認插座外面乾了，請房東先復電。結局規則 `recovery_check_delay`，結算回合 8。 |

- 沒有在乾燥時斷電：同一個涉水動作觸發感電危急終局。先完成乾燥時斷電：同一動作記錄滑倒擦傷，而且仍需轉回乾路。安全留在乾側不因前一題漏做斷電而被判觸電。
- 從車輛受困終局重來，回到第 4 題作答前，保留斷電及成功勸阻阿哲。完成後可獲救無傷。

## 回顧原文

### 全對

傷勢清單｜無紀錄傷勢。

#### 結果

在高處平安待救。本人傷勢分級為無傷。

避開積水、報出位置，在高處等到協助。

#### 做對的決定

- 「我確認乾燥，再切斷屋內總電源。」 乾燥可及時，提前隔離電源可減少進水後的感電疑慮。
- 「我避開電箱，往乾側梯口退。」 只要到電箱要經過積水，就不能自行接近。
- 「我陪阿哲退到梯口，請他留在乾處。」 地下室可能快速進水，同行上樓也便於互相照應。

#### 下次可以補上的

本場無此項。

#### 這次的危險選擇與後果

本場無此項。

#### 關鍵轉折

- 「我確認乾燥，再切斷屋內總電源。」 → 我在乾燥位置關掉總開關，屋內的電器停了 → 可以維持「我確認乾燥，再切斷屋內總電源。」 乾燥可及時，提前隔離電源可減少進水後的感電疑慮。

#### 官方依據

- [CDC：災後預防用電危險](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html)
- [臺南市政府：淹水避難須知](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D)
- [南投縣政府消防局：防颱檢查與災時應變](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=4837)

#### 帶走一個思考題

- 如果住在有地下車道的大樓，遇到對外動線被水切斷，我會先找哪處安全高點？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 關鍵轉折 | 我確認乾燥，再切斷屋內總電源。 |  | — |


### 逐步升級

傷勢清單｜本人：手掌擦傷、阿哲：手肘挫傷、本人：腳踝扭傷、本人：小腿撞傷。

#### 結果

延誤後由救援人員協助。最嚴重的傷勢為腳踝扭傷。本人傷勢分級為中度傷勢・需送醫。撤離或救援延誤：整理插頭耽擱乾燥時斷電、在玄關清水錯過及早上樓。

最早因整理插頭耽擱乾燥時斷電造成延誤，過程中出現腳踝扭傷。

#### 做對的決定

本場無此項。

#### 下次可以補上的

- 通話先報門牌和所在樓層，接著回報人數、水勢及傷勢。
- 避開積水道路，在可及的高處待救。

#### 這次的危險選擇與後果

- 第 1 回合「我搬高延長線，再整理插頭。」 我整理延長線，總開關還沒動，門外水又漲了一些。 優先處理乾燥且安全可及的總開關。
- 第 5 回合「我停在半層等水退，再考慮往上。」 水聲追到半層下方，我急著轉身往上時腳踝一扭，扶著乾側欄杆到二樓（本回合傷勢：腳踝扭傷）。 在樓梯乾燥可通時先到二樓，不停在低處平台。
- 第 7 回合「我往樓下走，看誰在喊我。」 我下到水邊，腳一滑撞到台階（本回合傷勢：小腿撞傷）。 留在乾燥高處示意，不走到水邊。

#### 關鍵轉折

- 「我搬高延長線，再整理插頭。」 → 我整理延長線，總開關還沒動，門外水又漲了一些 → 可改選「我確認乾燥，再切斷屋內總電源。」 優先處理乾燥且安全可及的總開關。

#### 官方依據

- [CDC：災後預防用電危險](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html)
- [臺南市政府：淹水避難須知](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D)
- [內政部消防署：119 報案要領](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68)
- [消防署全民防災 e 點通：淹水警報](https://bear.emic.gov.tw/MY2/topic/takeShelter/flood)

#### 帶走一個思考題

- 如果住在有地下車道的大樓，遇到對外動線被水切斷，我會先找哪處安全高點？

#### 因果核對

| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |
|---|---|---|---|
| 第 1 回合 | 我搬高延長線，再整理插頭。 | flood_power_act_myth | — |
| 第 5 回合 | 我停在半層等水退，再考慮往上。 | flood_vertical_act_myth | 腳踝扭傷 |
| 第 7 回合 | 我往樓下走，看誰在喊我。 | flood_signal_act_myth | 小腿撞傷 |
| 關鍵轉折 | 我搬高延長線，再整理插頭。 | flood_power_act_myth | — |


本場阿哲與接應各升級兩次。以下是事件原文。

- 第 3 回合｜阿哲從坡道口往前探，急水在他的鞋邊轉了一圈。他還想再看一眼。
- 第 4 回合｜阿哲回來時鞋子在濕階一滑，手肘碰上牆。他終於肯沿乾側撤。
- 第 6 回合｜外頭的燈光掃到隔壁。我聽見有人在重新問位置。
- 第 7 回合｜接應人員又折回來核對門牌。樓下的水聲沒停，我們在高處多等了一輪。

來源適用範圍與專業審查待辦見[低窪淹水內容審查清單](CONTENT_REVIEW_CHECKLIST.md)。

## 驗證範圍

低窪淹水有 10 組共用向量及 58 個逐回合檢查點，包含全對、逐步升級、三種危急終局、回顧後重來、進水前斷電、進水後的兩種供電／行動分支，以及救援後的復電誤判。方案 B 的盲測題本由情境包產生，共 23 題；前後測知識題另寫 20 題，兩種題幹與演練題幹及選項均無完全重複。

定版驗證通過：252 項 Node 測試、Web 規則及 Chrome 回歸、52 項 Kotlin 測試、Android 模擬器一般回歸及 pack-lint。全九包的 55 組向量與 385 個逐回合檢查點在 JS／Kotlin 一致。Web 與 Android 預設顯示低窪淹水並標示「待審查」。
