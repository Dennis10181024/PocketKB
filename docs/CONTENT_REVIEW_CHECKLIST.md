# 劇本內容審查清單

草稿，待人工審查。每包填寫審查人、日期、資料版本與 SHA-256 摘要。以實際跑出的情緒提醒、題目、選項、結局和回顧逐項核對。

- [ ] 查閱原始官方資料，確認版本、適用地點及可取得性。來源只支持一般原則時，註明情境中的時間、傷勢與救援配置屬教學假設。
- [ ] 題幹呈現當下可知的線索，包含可判斷的前置事實。檢查是否先說出應採取的動作，或只點名正解的物品。干擾物應自然且能被觀察。
- [ ] 檢查每題所有選項的文意與採用 ID。共用來源須真能支持該情境。若合理但不完整，說明缺少哪一步。若錯誤，說明行為的直接後果。
- [ ] 檢查字數差、最長答案率、動作數與自我否定字詞。盲測時另外觀察最短是否變成提示。
- [ ] 每一項傷勢都有當回合事件、受傷人、等級與作用機制。本人結局等級等於本人已記錄的最高一級。陪同者傷勢另列，危急終止不評定本人傷勢。
- [ ] 保留延誤與傷勢區別。確認失敗、待援與安全撤離都能被合理辨認。只在確定符合前置事實時觸發危險分支。
- [ ] 攻擊草稿的提醒與跳過入口在開場前可見。文字用聲音、人流與距離呈現，無血腥情節。請教官核對北捷設備與廣播。
- [ ] 停電請核對 1911、119 與冷藏食品的適用情境。
- [ ] 紀錄建議及回歸向量，確認 Web 和 Android 重播一致。實驗用包由教授同意後另外定版。

審查結果可填「待補證據」、「需修訂」或「建議採用」。目前尚無人工審查簽核。

## 方案 B｜低窪淹水

情境包 2.0.0 已加入預設選單，狀態為待審查。下列資料支持行動原則，劇情的傷勢、事件順序與接應過程仍需人工核對。

| 決策 | 查證來源及採用範圍 |
| --- | --- |
| 進水前斷電 | 美國 CDC 的居家用電指引要求避免站在水中操作，也不可涉水往總開關。劇中提供手、地板與開關一帶乾燥而且可安全抵達的條件。[CDC 居家用電指引](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) |
| 進水後遠離電箱 | 走道已積水便不靠近；先斷開住宅總電源也不視為積水可安全通行。[CDC 居家用電指引](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) · [消防署淹水警報](https://bear.emic.gov.tw/MY2/topic/takeShelter/flood) |
| 勸阻下地下室移車 | 已淹水的地下室有溺水與觸電風險。阿哲的焦急、探看與滑倒是合成分支。[南投消防局防颱應變](https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=4837) |
| 不開車涉水 | 積淹水地下道或低窪道路不應冒險穿越。車輛在本場失去動線是合成事件。[消防署淹水警報](https://bear.emic.gov.tw/MY2/topic/takeShelter/flood) |
| 垂直避難 | 出口受阻時，場景明示樓梯乾燥可通行且建物無可見損壞，才使用樓上安全位置。[臺南市淹水避難須知](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D) |
| 打 119 | 安全處使用手機通報時先提供可定位的資訊，再依詢問補充水況、人數與傷勢。[消防署報案要領](https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68) |
| 窗內示意待援 | 指引支持在明顯、安全處等候。可安全站立的窗內位置為劇本設計，無須探身或跨窗。[臺南市淹水避難須知](https://w3fs.tainan.gov.tw/Download.ashx?n=5re55rC06YG%2F6Zuj6aCI55%2BlLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNzAvcmVsZmlsZS8xMTQ1NC8xMTc5MzU5LzMyYWMxZjhhLTIwYWUtNGQ1Ny05ZWI3LTlhYzY3MjUwY2NlZi5wZGY%3D) |
| 退水後勿試電 | 受淹設備由合格電氣人員檢查，外觀乾燥不足以判定可用。[CDC 居家用電指引](https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-from-electrical-hazards.html) |

- [ ] 電氣人員核對住宅總開關的可及性、外部或備援供電，以及退水後專業復電程序。劇中的 `powerOff` 只代表住宅情境所設定的供電路徑。
- [ ] 防災人員複核樓梯、樓上待援點、窗內可見性、119 詢問與接應順序。若實際建物、樓梯或窗邊不安全，劇中條件不適用。
- [ ] 複核阿哲的行為、水位與接應時序、各次傷勢與臨床分級。模擬分級用於回顧，不可推估真實傷害機率。
