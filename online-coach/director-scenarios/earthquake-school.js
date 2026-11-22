'use strict';

const sources=[
  {id:'cwa-school',agency:'中央氣象署',title:'地震防護',url:'https://scweb.cwa.gov.tw/zh-tw/page/intro/11'},
  {id:'moi-earthquake',agency:'內政部',title:'機關安全宣導：地震防災預防措施',
    url:'https://ws.moi.gov.tw/Download.ashx?n=5qmf6Zec5a6J5YWo5a6j5bCOIOKAlOWcsOmch%2BmYsueBvemgkOmYsuaOquaWvS5wZGY%3D&u=LzAwMS9VcGxvYWQvNDA5L3JlbGZpbGUvMTEwNzIvMjgxODU3LzNmMGY5ZTMzLTE4MzQtNGEwZi1hNzJlLTVlZjY3YTM5MmYzNi5wZGY%3D'},
  {id:'ntfd-cover',agency:'南投縣政府消防局',title:'地震來了，立即三步驟',url:'https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=6259'},
];
const npc={name:'小維',otherNames:['阿凱'],mistake:'想衝去開門',emotion:'我真的很怕家裡那邊也在搖。'};
const opening='上課鐘剛響，我和同學小維坐在四樓教室。突然一陣劇烈搖晃——地震了！桌椅跟著地板晃動，頭頂的燈管和窗玻璃嘎嘎作響。小維抓著桌沿站起來大喊：「我去把門打開，不然等下出不去！」';
const P=(label,source,fact,ack,extra={})=>({label,source,ack,effect:fact?{facts:{[fact]:true}}:undefined,...extra});
const principles={
  cover:P('趴下、掩護、穩住，護住頭頸並遠離玻璃','ntfd-cover','covered','我在原地護住頭頸。',{
    when:({facts})=>facts.mainShake}),
  stop_npc:P('勸同伴別急著衝出去或開門','moi-earthquake','npcStopped','小維停在桌邊。',{effect:({facts})=>({
    facts:{npcStopped:true},events:facts.npcStopped?[]:[{kind:'npc_handled'}]})}),
  wait:P('搖晃停止並聽到老師指示後再移動','moi-earthquake','waited','我留在掩護處，聽老師接下來的指示。'),
  reassure:P('回應同伴的害怕（陪伴、先顧好自己、到安全處再聯絡家人）','moi-earthquake','npcCalmed','小維聽了，攥著桌腳的手放鬆一點。',{
    requires:{npcVoiced:true},effect:({facts})=>({facts:{npcCalmed:true},events:facts.npcCalmed?[]:[{kind:'npc_emotion',action:'emotion_supportive'}]})}),
  aftershock_cover:P('餘震時重新就地掩護','cwa-school','aftershockCovered','地板又動起來，我就近護住頭頸。',{requires:{aftershock:true}}),
  head:P('將手邊的物品用於保護頭頸','moi-earthquake','headProtected','我用手邊的物品護住頭頸。',{
    when:({facts})=>facts.routeReady&&!facts.outdoors}),
  orderly:P('跟著隊伍，不推擠、不奔跑','cwa-school','orderly','我跟著隊伍往前，和前面保留距離。',{
    when:({facts})=>facts.routeReady&&!facts.outdoors}),
  stairs:P('等老師確認路線，走樓梯疏散','cwa-school','usedStairs','我跟老師走上已確認能走的樓梯。',{
    requires:{routeReady:true,shaking:false},blocked:{lines:['地板還沒穩定或老師還沒確認路線，我先留在就近掩護處。'],notDone:['尚未走樓梯']}}),
  open_area:P('到空曠處集合，遠離外牆及掉落電線','cwa-school','inOpenArea','我繞過外牆和掉落的電線，走向操場空曠處。',{
    when:({facts})=>facts.outdoors&&!facts.rollCall}),
  stay_group:P('留在本班集合區，讓老師確認我的位置','moi-earthquake','stayedGroup','我留在本班的隊伍裡。',{
    when:({facts})=>facts.assembly}),
  roll_call:P('應答老師點名，或向老師回報本排人數與狀況','cwa-school','counted','老師點到我，我回了一聲。',{requires:{rollCall:true}}),
  look:P('從目前位置觀察周圍','cwa-school',null,'我從這裡看清身旁的狀況。',{bonus:true}),
  dial:P('有緊急傷病或受困時聯絡救援','moi-earthquake',null,'119 電話接通了。',{bonus:true}),
};
const teaching={
  cover:[10,'桌面能擋落物；抓牢桌腳可避免桌子移開。','教室一搖就壓低重心、躲堅固桌下、抓緊桌腳，降低被落物砸到的風險。',f=>f.mainShake],
  stop_npc:[6,'留在桌邊才有掩護，能減少小維在門邊被落物打到。','同伴想衝去開門時，從掩護處叫他就近護頭，避免他暴露在落物下。',f=>f.mainShake],
  wait:[2,'等搖晃停穩再移動，較不容易在走廊跌倒。','主震沒停先維持掩護，等搖晃停止、老師確認路線再移動。',f=>f.mainShake],
  reassure:[1,'短句陪伴能讓同伴把注意力放在手邊能做的事。','聽到同伴害怕時先表示陪伴，等到安全處再處理聯絡家人的事。',f=>f.npcVoiced],
  aftershock_cover:[9,'主震停了仍可能有餘震，重新掩護可少受家具或落物撞擊。','一感到餘震就重新就近掩護、穩住，避免家具移動時失去平衡。',f=>f.aftershock&&f.shaking],
  head:[0,'手邊物品可在疏散時增加頭頸保護。','按老師指示疏散時，可用手邊物品護住頭頸，別為了找物品離隊。',f=>f.routeReady&&!f.outdoors],
  orderly:[5,'依序下樓給前面的人留下站穩的空間。','下樓時跟住隊伍，放慢並留出間距，避免同學一失衡就碰撞。',f=>f.routeReady&&!f.outdoors],
  stairs:[8,'確認過的樓梯有可用動線，能避開受損區域。','搖晃停了，等老師確認後走可用樓梯，避開電梯及有落物的路。',f=>f.routeReady&&!f.outdoors],
  open_area:[9,'繞開電線、離開外牆，能避開感電與掉落物。','到一樓看到掉落電線時不要碰，遠離外牆，走另一側到空曠處。',f=>f.outdoors&&!f.assembly],
  stay_group:[4,'留在本班集合區，老師才能掌握我的位置。','進操場後跟本班待在原定位置，避免老師把離隊的人列入失聯。',f=>f.assembly&&!f.rollCall],
  roll_call:[7,'應答讓老師知道誰平安、誰需要協助。','集合後聽到名字就應答；有同學沒到或受傷，告知老師最後知道的位置。',f=>f.rollCall],
};
for(const [id,[priority,why,tip,eligible]] of Object.entries(teaching))
  Object.assign(principles[id],{priority,why,tip,eligibleWhen:({facts})=>eligible(facts)});
const fatal=(label,pattern,text,teach,source)=>({kind:'fatal',label,pattern,text,teach,source});
const exposure=(label,pattern,text,teach,source,extra={})=>({kind:'exposure',label,pattern,text,teach,source,
  effect:{exposure:{trauma:1},facts:{delayed:true},lines:[text]},...extra});
const hazards={
  jump_window:fatal('從樓上窗外往下逃',
    /跳窗|跳樓|(?:往外跳|往下跳|跳下去|跳下樓)|從.{0,8}(?:窗戶|窗台|窗口|窗子).{0,10}(?:跨|翻|爬|跳|逃)|(?:跨|翻|爬)(?:出|過|越)(?:窗台|窗外|窗)|(?:外牆|水管|室外機|冷氣架).{0,8}(?:溜下|爬下|踩下)|(?:攀|踩|抓|爬).{0,4}(?:外牆水管|冷氣架|室外機)/,
    '我翻出窗台，手從窗框滑開，撞在下方的平台上，再也站不起來。','應遠離窗戶，等搖晃停止後依老師指示走經確認的疏散路線。','cwa-school'),
  elevator:fatal('搭乘電梯',
    /(?:搭|坐|乘|按|衝進|跑進|進入|去|等)(?:乘|一下|那台|那部|那座|了|一部|一台|一座|去|向)?(?:電梯|升降[機梯])(?:口)?|(?:電梯|升降[機梯])(?:門).{0,14}(?:衝|跑|鑽|走|進).{0,7}(?:進去|按一樓)|(?:電梯|升降[機梯])下樓/,
    '電梯門合上後，轎廂猛地停住，樓層燈熄了。我按了開門鍵，門沒有動，我被困在裡面。','地震後避開電梯，依老師確認的路線使用樓梯。','cwa-school'),
  wire:fatal('碰觸掉落電線',
    /(?:電線|電纜).{0,22}(?:把它)?(?:踢開|撥開|移到|移開|撥到|抓起|踩過|跨過|碰它)|(?:踢|撥|摸|碰|移開|抓起|踩|跨過)(?:開|那條|地上(?:的)?|掉落(?:的)?|垂落(?:的)?|一下){0,3}(?:電線|電纜)/,
    '我碰到地上的電線，眼前一黑。旁邊有人喊我的名字，我無法起身繼續撤離。','避開掉落電線，也避開碰到電線的物體。','moi-earthquake'),
  rush_open:exposure('還在搖晃時衝出去或開門',
    /(?:衝|跑)(?:去|到|出|向|進)(?:去|教室|走廊|門口)?|(?:衝|跑)(?:去|過去).{0,10}(?:開門|門打開)|(?:把|去把)(?:教室)?(?:前|後)?門打開|(?:站起來)?(?:衝出|跑出)教室/,
    '我衝向門口，頭頂落下一截燈罩，手臂被擦得一陣刺痛。老師在桌下喊我的名字。','先就地掩護，等搖晃停止再行動。','moi-earthquake',{when:f=>f.shaking,
      blocks:['cover','aftershock_cover','stairs','@phone'],
      effect:({facts:f})=>({facts:{delayed:true},exposure:{trauma:f.aftershock?2:1},
        lines:[f.aftershock?'我一離開桌下，滑動的桌腳重重撞上小腿；再踩地時我只能一跛一跛地走。':'我衝向門口，頭頂落下一截燈罩，手臂被擦得一陣刺痛。老師在桌下喊我的名字。']})}),
  triangle:exposure('在桌旁採黃金三角姿勢',
    /黃金三角|(?:躲|蹲|縮|靠)(?:在|到|著)?(?:桌子|課桌|桌|櫃子)(?:的)?(?:旁邊|旁|桌邊|邊)/,
    '我蹲在桌旁，桌面擋不到我上方掉落的物品。','用就近可確認的堅固桌子掩護頭頸。','ntfd-cover',{when:f=>f.shaking}),
  collect:exposure('回頭收拾財物耽擱疏散',
    /(?:衝回|跑回|回頭|回去|回座位|回教室).{0,10}(?:拿|收|抓|取).{0,10}(?:筆電|MacBook|平板|電腦|手機|包|東西)|(?:把|收)(?:桌上(?:的)?)?.{0,9}(?:筆電|MacBook|平板|電腦).{0,18}(?:塞進|收進|再走|再撤)|回去收平板/i,
    '我停下來收東西，跟我同排的人已經往前走，我得等老師重新帶隊。','依疏散指示離開，避免停在動線或折返。','cwa-school',{when:f=>!f.mainShake}),
  pushing:exposure('疏散時推擠或奔跑',
    /(?:把|將).{0,14}(?:同學|前面的人|人)(?:往旁邊)?(?:推出去|推開|擠開)|(?:推開|擠開)(?:前面(?:的)?人|同學)|(?:狂奔|衝下|跑下)樓梯|用衝的|用跑的|硬擠出去|搶著先下樓|嬉戲|追逐打鬧/,
    '我在樓梯轉角踩空，腳踝一扭。後面的隊伍停了下來，同學伸手讓我扶著。','依序疏散，避免推擠與爭先。','cwa-school',{when:f=>!f.mainShake&&!f.outdoors,blocks:['orderly','stairs','@phone']}),
};
function protect(text,at,length) {
  const before=text.slice(0,at).split(/[。！？；，,]/).at(-1) || '';
  const after=text.slice(at+length).split(/[。！？；，,]/)[0];
  const noSelf=!/(?:我|我們)(?:現在|還是|先|也|直接|馬上)*(?:要|去|打算|決定|就|用|把|才)/.test(before);
  return /^(?:一定|可能)骨折/.test(after) ||
    noSelf && /有人|有同學|(?:小維|阿凱).{0,6}(?:說|想|要)/.test(before);
}
const fallback={
  cover:/趴掩穩|趴下|(?:鑽|躲|縮).{0,5}(?:桌|課桌).{0,3}(?:下|底)|護住頭(?:頸|脖子)/,
  stop_npc:/(?:小維|阿凱|同學|叫他|拉住他).{0,8}(?:別|不要|先趴|先躲)/,
  wait:/等.{0,10}(?:不搖|不晃|停|指示)|留在掩護處/,
  reassure:/陪.{0,3}(?:他|你)|擔心.{0,5}(?:家人|家裡)|一起.{0,8}聯絡|(?:先|一起)?冷靜|顧好自己|先顧|別怕|不要怕|我在這|我陪/,
  aftershock_cover:/(?:餘震|又晃|又在搖).{0,14}(?:躲|護|趴|掩護)/,
  head:/(?:書包|背包|課本|外套|書).{0,8}(?:護|保護|擋|頂|放|靠).{0,4}(?:頭|後腦)/,
  orderly:/不推|不跑|排隊|慢慢走|不要推|不擠/,
  stairs:/走(?:樓梯|安全梯|逃生梯)|(?:跟|照).{0,8}老師.{0,10}(?:下樓|疏散|樓梯)/,
  open_area:/操場|空曠|離.{0,6}外牆|繞.{0,8}電線/,
  stay_group:/留在(?:本班|隊伍|集合區)|跟著(?:本班|隊伍)等|跟本班待在一起/,
  roll_call:/點名|點到我|喊到我|回報到場|答到|應答|喊到|報數|回報.{0,6}(?:人數|老師)|(?:跟|向)老師.{0,6}(?:回報|說).{0,8}(?:人|到齊|都到)|清點/,
};
const beat=(id,at,text,effects,prevented,when)=>({id,at,normal:{text,effects},prevented,when});
const beats=[
  beat('main_shaking',1,'燈管敲了兩聲，桌上有東西掉下來。',null,
    {when:({facts:f})=>f.covered,text:'我在桌下聽見燈管敲了兩聲，頭頸仍在掩護內。'}),
  {...beat('companion',1,'小維抓著門框，聲音發抖：「我真的很怕家裡那邊也在搖。」',{facts:{npcVoiced:true}},
    {when:({facts:f})=>f.npcStopped,text:'小維把手放回桌腳，低聲說：「我真的很怕家裡那邊也在搖。」',effects:{facts:{npcVoiced:true}}}),decision:true},
  beat('main_stops',2,'地板漸穩，老師叫大家先停在原處，還沒開放疏散。',{facts:{mainShake:false,shaking:false}},
    {when:({facts:f})=>f.waited,text:'我留在掩護處等到地板漸穩，老師還在確認樓梯。',effects:{facts:{mainShake:false,shaking:false}}}),
  {...beat('aftershock',2,'桌腳突然又撞了地板兩下。老師在另一排喊：「餘震！」',{facts:{shaking:true,aftershock:true}}),decision:true},
  {...beat('route_ready',3,'餘震漸停，老師指向通往內側樓梯的門。',{facts:{shaking:false,routeReady:true}},
    {when:({facts:f})=>f.aftershockCovered,text:'我等餘震停止後聽見老師確認內側樓梯可以通行。',effects:{facts:{shaking:false,routeReady:true}}}),
    decision:true,after:{beat:'aftershock',turns:1}},
  {...beat('outside',4,'我落在隊伍最後，轉角只剩幾個同學。樓梯旁的窗戶望出去，一樓側邊垂著一條電線。',{facts:{outdoors:true,delayed:true}},
    {when:({facts:f})=>f.usedStairs,text:({facts:f})=>f.headProtected&&f.orderly?
      '我護住頭頸跟著隊伍下樓。一樓側邊垂著電線，另一側通往操場。':'我跟著隊伍到一樓，看見側邊有掉落的電線。',
     effects:{facts:{outdoors:true}}}),decision:true,after:{beat:'route_ready',turns:1}},
  {...beat('assembly',5,'我還落在後面，遠遠聽見老師在喊班級集合。',{facts:{assembly:true,delayed:true}},
    {when:({facts:f})=>f.inOpenArea,text:'我到了操場空曠處。不同班級在前方分開，老師喊出我們班的集合位置。',effects:{facts:{assembly:true}}}),
    decision:true,after:{beat:'outside',turns:1}},
  {...beat('gather',6,'老師翻開名冊，隔著隊伍喊我的名字。',{facts:{rollCall:true}},
    {id:'gather_in_group',when:({facts:f})=>f.stayedGroup,text:'我留在本班集合區，老師翻開名冊喊我的名字。',effects:{facts:{rollCall:true}}}),
    decision:true,after:{beat:'assembly',turns:1}},
];
const impact=(id,source,when,text,trauma=0,facts={},tip='')=>({
  id,source,when,text,effect:{exposure:trauma?{trauma}:{separation:1},facts:{delayed:true,...facts}},tip,
});
const consequences=[
  impact('missed_cover','ntfd-cover',({clock,facts,assessment})=>clock===1&&!facts.covered&&assessment.danger?.id!=='rush_open',
    '我還站在原地，一截燈罩擦過我的手臂，留下一陣刺痛。',1,{},principles.cover.tip),
  impact('invited_npc','ntfd-cover',({facts,assessment})=>facts.mainShake&&assessment.cues?.invite&&!facts.npcHurt,
    '小維跟我往門邊湊。碎片跌在他手旁，他捏著手腕，聲音突然發抖。老師喊了我們兩個的名字。',0,{npcHurt:true},principles.stop_npc.tip),
  impact('missed_npc','ntfd-cover',({clock,facts})=>clock===2&&!facts.npcStopped&&!facts.npcHurt,
    '小維走到門邊，窗框一震，他縮回被碎片擦到的手。老師喊了他的名字。',0,{npcHurt:true},principles.stop_npc.tip),
  impact('missed_main_cover_again','ntfd-cover',({clock,facts})=>clock===2&&!facts.covered,
    '頭頂啪一聲，燈管碎在我旁邊。我扶住桌沿時，手被碎片劃到。',2,{},principles.cover.tip),
  impact('missed_aftershock','cwa-school',({facts,assessment})=>facts.aftershock&&facts.shaking&&!facts.aftershockCovered&&assessment.danger?.id!=='rush_open',
    '滑動的桌腳撞上我的小腿，我重新站起來時，走路已經一跛一跛。',2,{},principles.aftershock_cover.tip),
  impact('missed_stairs','cwa-school',({facts,assessment})=>facts.routeReady&&!facts.outdoors&&!facts.usedStairs&&assessment.danger?.id!=='pushing',
    '隊伍轉過樓梯轉角，我卻和前一排拉開了距離。老師回頭喊我的名字，前面的腳步聲已經遠了。',0,{},principles.stairs.tip),
  impact('missed_order','cwa-school',({facts})=>facts.usedStairs&&!facts.outdoors&&!facts.orderly,
    '我貼著前面的人下樓，對方一停，我的鞋就撞上下一階，腳踝扭了一下。',1,{},principles.orderly.tip),
  impact('missed_route','moi-earthquake',({facts})=>facts.outdoors&&!facts.assembly&&!facts.inOpenArea,
    ({assessment})=>assessment.cues?.phone_play ? '我低頭滑手機，沒聽見老師叫我的名字。外牆噠一聲，一塊碎屑掉在我鞋邊。' : '我還在電線旁那側，頭頂掉下一小塊外牆碎屑。老師望向已到操場的那排，還沒看見我。',1,{},principles.open_area.tip),
  impact('left_group','moi-earthquake',({facts,assessment})=>facts.outdoors&&assessment.cues?.leave&&!facts.leftGroup,
    '我往隔壁班的方向走，跟本班隊伍隔開了。老師在名冊旁畫了記號，向旁邊的教職員問我的位置。',0,{leftGroup:true},principles.stay_group.tip),
  impact('missed_group','moi-earthquake',({facts,assessment})=>facts.assembly&&!facts.rollCall&&!facts.stayedGroup&&!assessment.cues?.leave,
    '操場上幾個班級交錯，我沒跟上本班。老師轉頭找了兩次，還沒確認我在哪裡。',0,{},principles.stay_group.tip),
  impact('missed_roll_call','moi-earthquake',({clock,facts})=>facts.rollCall&&!facts.counted&&clock===7,
    '叫到我的名字時沒有人答。老師把我記成尚未確認，請教職員留意集合區附近。',0,{},principles.roll_call.tip),
  impact('search_delay','moi-earthquake',({clock,facts})=>clock>=8&&!facts.counted,
    ({state})=>state.exposure.trauma?'教職員在隊伍邊找到我，看到我走路吃力，就呼叫校護過來。我是最後才被找到的。':
      '教職員在隊伍邊找到我。我是最後才確認位置的人，其他同學一直留在集合區等著。',0,{assisted:true},principles.roll_call.tip),
];
function scenePrompt(f) {
  if (f.rollCall) return 4;
  if (f.assembly) return 7;
  if (f.outdoors) return 3;
  if (f.routeReady) return 2;
  if (f.aftershock) return 1;
  if (f.npcVoiced && !f.npcCalmed) return 6;
  return f.npcStopped ? 5 : 0;
}
const prompts=[
  ['桌腳和窗戶都在晃，小維伸手想去開門。我現在怎麼做？',['我就近趴低，躲桌下抓桌腳，說小維別出去。','我把頭壓低，先留在這裡聽老師。','我現在衝去把門打開。']],
  ['地板又開始晃，老師還沒讓大家走。我怎麼應對？',['我重新就地掩護頭頸，抓穩桌腳。','我先蹲低，等老師的聲音。','我現在就要跑到走廊。']],
  ['老師確認了內側樓梯，走廊另一側有落物。我走哪裡、怎麼走？',['我用手邊的書包護頭，跟老師走樓梯，不推不跑。','我跟著前一排同學慢慢下樓。','我先回去拿筆電。']],
  ['一樓外側有掉落的電線，老師指著操場。我怎麼選路？',['我繞過電線，遠離外牆，往操場中間集合。','我順著老師帶的隊伍走。','我用腳把電線踢開。']],
  ['老師拿名冊喊到我們這一排，我怎麼回應？',['我留在集合區，聽到名字就答到。','我在旁邊等老師再次確認。','我先折回教室拿東西。']],
  ['地板還在劇烈搖晃，燈管跟著晃動。我現在怎麼做？',['我繼續躲在桌下抓穩桌腳，等搖晃停下來。','我趁現在站起來看看外面。','我先把桌上的筆電收進包包。']],
  ['小維很怕家裡也在搖，聲音在發抖。我要跟他說什麼？',['我知道你很擔心，我們先顧好自己，等安全了再一起聯絡家人。','別擔心，你家一定沒事的。','現在不是想這個的時候。']],
  ['操場上不同班級正在分開集合。聽見自己班級的名字，我接下來怎麼做？',[]],
].map(([text,hints],index)=>({text,hints,when:({facts:f})=>scenePrompt(f)===index}));
const injuries={NONE:'無傷',MILD:'輕傷',MODERATE:'中度（需送醫）',SEVERE:'重傷（需住院）',NOT_ASSESSED:'傷勢不評定'};
const injuryText={NONE:'老師確認我沒有受傷。',MILD:'校護先了解我的輕微不適。',MODERATE:'校護評估我需要送醫。',SEVERE:'救護人員評估我需要住院治療。'};
module.exports={id:'earthquake_school',opening,npc,sources,consequences,
  facts:{mainShake:true,shaking:true,covered:false,npcStopped:false,npcVoiced:false,npcCalmed:false,waited:false,aftershock:false,
    aftershockCovered:false,headProtected:false,orderly:false,routeReady:false,usedStairs:false,outdoors:false,inOpenArea:false,
    rollCall:false,counted:false,delayed:false,called:false},
  exposure:{trauma:0},lastQuestion:'shaking',principles,hazards,protect,fallback,
  phone:{channels:{119:{purpose:'緊急傷病或受困',principle:'dial',effect:{facts:{called:true}}},110:{purpose:'警察報案',wrong:{notDone:['尚未聯絡到消防救護。'],
    lines:['電話那端請我先告知目前安全與傷病狀況。']}}},other:{notDone:['電話未接通救援。']},
    literal:text=>/(?:打|撥)(?:給)?\s*119/.test(text)?'119':''},
  operations:['cover','stop_npc','wait','reassure','aftershock_cover','head','orderly','stairs','open_area','stay_group','roll_call','look','@phone'],
  observationPrinciples:['look'],cues:text=>({
    invite:/(?:一起|帶他|跟他).{0,8}(?:拍限動|拍影片|錄影)|(?:拍限動|拍影片|錄影).{0,8}一起/.test(text)&&!/(?:別(?!人|班)|不要|不能|不行|可以嗎)/.test(text),
    phone_play:/滑手機|玩手機|低頭(?:看|盯)手機/.test(text),
    leave:/(?:去|跑去|走去|溜去)(?:隔壁班|別班|找別人)|擅自離隊/.test(text)&&!/(?:別(?!人|班)|不要|不能|不行|可以嗎)/.test(text)
  }),questions:prompts,beats,
  npcState:f=>({handled:f.npcStopped,proposal:f.npcStopped||!f.mainShake?null:npc.mistake,emotion:f.npcCalmed?'supportive':null}),
  status:({facts:f})=>f.shaking?['警示：搖晃仍在持續']:f.rollCall?['集合：老師正在清點']:f.routeReady?['疏散：老師已確認內側樓梯']:[],
  narrationEvidence:true,
  narrationFacts:state=>({...state.facts,place:'學校四樓教室、經老師確認的內側樓梯與操場',npc:npc.name}),
  checkReaction:(reaction,f,out)=>!(!f.routeReady&&/(?:樓梯|走廊).{0,5}(?:已確認|可通行)|我走下樓/.test(reaction) ||
    !f.outdoors&&/我.{0,5}(?:到|抵達|走到)操場/.test(reaction) ||
    !f.rollCall&&/(?:老師|同學).{0,5}點名/.test(reaction) ||
    /(?:約好|約定|答應|承諾).{0,16}(?:聯絡|聯繫|打給)/.test(reaction) &&
      !out.acceptedEvidence?.some(item=>item.id==='reassure' && /聯絡|聯繫|打給/.test(item.evidence))),
  answer:({facts:f,assessment:a})=>/電梯|升降機/.test(a.inputEvidence||'')?'電梯在搖晃過後可能停住；老師目前沒有使用電梯疏散。':f.rollCall?'老師正在操場依名冊確認人數。':f.shaking?'地板還在動，老師還沒讓大家疏散。':
    f.routeReady?'老師已確認內側樓梯，另一側有落物。':'搖晃暫停，老師還在查看動線。',
  look:state=>state.facts.rollCall?'我看見老師拿著名冊，側邊靠外牆的區域已被隔開。':
    state.facts.outdoors?'側邊有落下的電線，操場中間看起來空曠。':
      state.facts.shaking?'桌腳和燈管還在晃，教室內側有堅固課桌。':'老師正在查看樓梯，玻璃附近散著碎片。',
  idle:({facts:f})=>f.shaking?'我聽見燈管還在響，桌沿也跟著輕顫。':f.rollCall?'老師翻過一頁名冊，操場上的隊伍還留在原地。':'我聽見隊伍往前移動，老師站在動線旁。',
  finish:({facts:f,clock,assessment})=>{
    if (f.counted && !assessment.danger) return {type:f.delayed?'DELAYED_EVACUATION':'SELF_EVACUATION',text:'老師在名冊上記下我的回應。'};
    if(clock>=8 && f.assisted) return {type:'DELAYED_EVACUATION',text:'我沒能跟班級一起完成疏散，得等教職員和校護接手。'};
  },
  injury:{thresholds:[0,2,4],score:exposure=>exposure.trauma},
  reflectionPrompt:'如果地震時我人在圖書館，第一個掩護點在哪？震後要怎麼跟同伴確認彼此的位置？',
  ending:{types:{SELF_EVACUATION:'安全撤離',DELAYED_EVACUATION:'延誤撤離',CRITICAL_FAILURE:'危急失敗'},
    label:(state,info)=>info.hazard==='elevator'?'搭乘電梯後受困':info.hazard?'未能安全撤離':
      info.injury==='MODERATE'||info.injury==='SEVERE'?'延誤並受傷，需送醫':
      state.facts.assisted?(info.injury==='MILD'?'受傷後由教職員協助撤離':'延誤後由教職員協助撤離'):
      info.injury==='MILD'?'撤離但受傷':undefined,
    summary:(state,info)=>info.hazard==='elevator'?'地震後搭乘電梯，轎廂停住，撤離中斷。':
      info.hazard?'危險的撤離路線使我無法繼續行動。':
      state.facts.npcHurt?'搖晃中靠近門邊，小維受傷，我的撤離也延誤。':
      state.facts.assisted?'離開隊伍或未回應點名，教職員最後才找到我。':
      info.type==='SELF_EVACUATION'?'搖晃時掩護，震後走安全動線並回應點名。':'撤離途中漏做必要應對，讓集合或清點延誤。',
    injuries,text:{SELF_EVACUATION:injuryText,DELAYED_EVACUATION:injuryText},
    causes:state=>state.exposure.trauma?['搖晃時的掉落物、碰撞或疏散延誤增加了情境暴露。']:[]},
  instructions:{
    direct:`你是台灣學校地震的防災裁判。玩家文字只用於判定。只輸出 JSON，不寫劇情。matches 中只用目錄 ID，每項附逐字原文。用當前 facts 核對主震、餘震、動線及點名。辨識口語：鑽桌底抓桌腳、縮到課桌下＝cover；提醒小維（草稿也叫阿凱）不要衝或開門＝stop_npc；等不晃再動＝wait；安撫小維的害怕（叫他冷靜、先顧好自己、我陪你、等安全再聯絡家人等，說法不限）＝reassure；又在搖時護頭抓穩＝aftershock_cover；拿書、背包、外套護頭＝head；排隊不跑不推＝orderly；聽老師走樓梯＝stairs；到操場中間避開外牆與線路＝open_area；點到我回一聲、向老師報數或回報本排人數與狀況＝roll_call。只詢問填 isQuestion，只查看現場填 isObservation。
在操場跟本班待在一起＝stay_group；老師尚未點名時不能把等待當作 roll_call。危險 ID 用目錄。窗台跨出去、抓外牆水管、踩冷氣架、四樓往外跳屬 jump_window。按升降機、看見電梯門開便衝進去按一樓屬 elevator。用腳踢、用手移、拿東西撥掉落電線屬 wire。搖晃中衝去開門或外跑、躲黃金三角、回頭收 MacBook 或平板、用衝的擠開同學或在下樓隊伍嬉戲打鬧分別是 rush_open、triangle、collect、pushing。證據必須屬於玩家自己的行為。像「出去會被砸到」「搭電梯很容易卡住」「跳窗找死吧」在勸阻或警告時標 warn_others／refuse。描述他人、否定、假設或問可不可以，明確以對應 dangerIntent 區分。若同句勸別人不要但自己接著做，要標 execute。報案號碼填實際說出的號碼，沒有報案留空。`,
    narrate_director:`以臺灣繁體中文寫最多兩句玩家第一人稱反應。只描述 accepted 中實際發生的動作及 facts 確定的內容。acceptedEvidence 是玩家說話的原文，原則名稱有多種可行做法時，以原句中的具體做法為準。只說陪同伴等候就只寫陪伴。提問只按現有事實回答。不宣告新事件、不代教師下指示、不自行宣布疏散或傷勢。accepted 為空時，用一句寫出玩家說這句話或做這個動作的當下，以及小維或老師自然的反應，但不要寫成已經完成某件事；不要寫「我看不清楚」。只有回答提問而事實不足時，才說從這裡看不清楚。不要教學或評分。`,
    confirm_danger:`只回答 executing。台灣大學生若明確決定自己去做指定危險行為，包含已定的條件式計畫，回 true。否定、純詢問、假設、勸同伴、警告、轉述與差點做卻停下回 false。獨立檢查同一句中後半段自己真的要做的情況。`,
  },
};
