'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {ConversationCoach}=require('../coach');
const Director=require('../director');

const fire='drill_fire_dorm';
const m=(id,evidence)=>({id,evidence});
function provider(map,{narrate={},confirm={}}={}) {
  return {ready:true,async generate(stage,payload) {
    if (stage==='narrate_director') return {value:{reaction:narrate[payload.player] ?? ''}};
    if (stage==='confirm_danger') return {value:{executing:confirm[payload.text] ?? true}};
    assert.equal(stage,'direct');
    const {reaction,answer,...judge}=map[payload.text] || {};
    return {value:{matches:[],dialed:'',dialEvidence:'',danger:'',dangerEvidence:'',dangerIntent:'none',isQuestion:false,isObservation:false,...judge}};
  }};
}
const make=(map,extra={},opts={})=>new ConversationCoach(provider(map,opts),{formal:true,quality:true,director:true,logText:true,...extra});
let n=0;
const say=(coach,s,text,intent='action')=>coach.turn(s.sessionId,{revision:s.revision,requestId:'director-test-'+(n++),text,intent});

test('the dorm fire runs in director mode with a neutral first question',()=>{
  const coach=make({});
  const s=coach.create(fire);
  assert.ok(s.state.director);
  assert.match(s.scene.node.task,/小岑想開門/);
  assert.doesNotMatch(s.scene.node.task,/關門|119/);
  const other=coach.create('earthquake_school');
  assert.ok(!other.state.director,'other scenarios keep the existing engine');
});

test('dialing 110 is answered in the scene, and talking to a dispatcher before calling is pointed out',async()=>{
  const t1='把門關緊 並跟小岑說千萬不能開門 找濕毛巾把門縫堵住 並且拿起手機撥打 110，通報接線員我們在宿舍 5 樓 503 室';
  const t2='跟接線員說我們在 503 室，目前房間內有兩個人';
  const coach=make({
    [t1]:{matches:[m('barrier','把門關緊'),m('stop_roommate','跟小岑說千萬不能開門'),m('seal_gap','找濕毛巾把門縫堵住'),m('room','5 樓 503 室')],dialed:'110',dialEvidence:'撥打 110'},
    [t2]:{matches:[m('room','503 室'),m('headcount','兩個人')]},
  });
  let s=await say(coach,coach.create(fire),t1);
  assert.match(s.reply,/這裡是110.*119/);
  assert.equal(s.state.director.facts.called,false);
  assert.equal(s.state.director.facts.doorClosed,true);
  assert.equal(s.state.director.facts.sealed,true);
  assert.doesNotMatch(s.reply,/開門/.test(t1)&&/濃煙一下子灌進/);
  s=await say(coach,s,t2);
  assert.match(s.reply,/還沒撥出去/);
  assert.equal(s.state.director.facts.room,false,'a report only counts once 119 is on the line');
  assert.equal(s.terminal,false);
});

test('the story never stalls: unrelated answers still reach rescue, with smoke injury from the open door',async()=>{
  const coach=make({});
  let s=coach.create(fire);
  const replies=[];
  for (let i=0;i<14 && !s.terminal;i++) { s=await say(coach,s,'我在想晚餐要吃什麼'); replies.push(s.reply); }
  assert.equal(s.terminal,true,'time-driven beats end the drill even without the right words');
  assert.equal(s.state.endingType,'DELAYED_RESCUE');
  assert.equal(s.state.injuryLevel,'SEVERE');
  assert.ok(replies.some(r=>/小岑把門又拉開/.test(r)),'the roommate opens the door if nobody stops her');
  assert.ok(replies.some(r=>/敲門|503有人嗎/.test(r)));
  assert.ok(s.suggestions.length===3 || s.terminal,'stuck players get suggestions');
});

test('good choices in any order lead to a quick, uninjured rescue; prepared escalations are milder',async()=>{
  const a='小岑你先不要開門！外面都是煙，我先把門關緊';
  const b='我拿浴室的毛巾沾水塞在門下面';
  const c='打119，說我們在安學路100號A棟五樓503，兩個人困在房間，走廊都是煙';
  const d='我知道你很擔心，我們先顧好自己，我會陪你';
  const e='電話不要掛，保持通話，留在房間等';
  const f='我們在這裡！503有人！';
  const coach=make({
    [a]:{matches:[m('stop_roommate','小岑你先不要開門'),m('barrier','我先把門關緊')]},
    [b]:{matches:[m('seal_gap','塞在門下面')]},
    [c]:{matches:[m('dial','打119'),m('address','安學路100號A棟'),m('room','五樓503'),m('headcount','兩個人'),m('condition','走廊都是煙')],dialed:'119',dialEvidence:'打119'},
    [d]:{matches:[m('reassure','我知道你很擔心')]},
    [e]:{matches:[m('keep_contact','電話不要掛'),m('wait_inside','留在房間等')]},
    [f]:{matches:[m('handoff','503有人')]},
  },{},{narrate:{[a]:'小岑愣了一下，手從門把上縮回來。'}});
  let s=coach.create(fire);
  const replies=[];
  for (const text of [a,d,b,c,e,e,f]) { if (s.terminal) break; s=await say(coach,s,text); replies.push(s.reply); }
  assert.match(replies[0],/小岑愣了一下/,'GPT reaction is shown when it fits the facts');
  assert.ok(replies.some(r=>/很怕其他同學/.test(r)),'the roommate voices her fear after being stopped');
  assert.ok(replies.some(r=>/毛巾塞得夠緊/.test(r)),'sealing early makes the seep milder');
  assert.ok(replies.some(r=>/503有人嗎/.test(r)));
  assert.equal(s.terminal,true);
  assert.equal(s.state.endingType,'SAFE_RESCUE');
  assert.equal(s.state.injuryLevel,'NONE');
  assert.ok(s.ending.lessons.some(l=>l.title==='做得好的地方'));
  const replayed=Director.replay(s.decisions);
  const {lastText,...live}=s.state.director;
  assert.deepEqual(replayed,live,'outcomes replay from logged assessments');
});

test('fatal choices rewind to that moment (ending only after repeated attempts); warnings, refusals and questions do not',async()=>{
  const coach=make({},{},{confirm:{'如果我搭電梯會怎樣？':false}});
  let s=await say(coach,coach.create(fire),'我去搭電梯');
  assert.equal(s.terminal,false,'the player gets to go back and choose again');
  assert.equal(s.kind,'rewind');
  assert.match(s.reply,/電梯.*回到剛才那一刻/s);
  assert.equal(s.state.director.clock,0,'rewinding costs no time');
  for (let i=0;i<3;i++) s=await say(coach,s,'我去搭電梯');
  assert.equal(s.state.endingType,'CRITICAL_FAILURE');
  assert.equal(s.ending.injury,'傷勢不評定');
  for (const text of ['跑出去很危險，我們留在房間','跟小岑說千萬不能開門','我不會搭電梯','如果我搭電梯會怎樣？','有人在搭電梯']) {
    const t=await say(coach,coach.create(fire),text);
    assert.notEqual(t.kind,'rewind',text);
  }
  const lied=make({'我把門關好':{danger:'jump',dangerEvidence:'不存在的原文',dangerIntent:'execute'}});
  const safe=await say(lied,lied.create(fire),'我把門關好');
  assert.notEqual(safe.kind,'rewind','model danger needs real evidence');
  const edge='我才不要搭電梯咧，樓梯比較快';
  const asked=make({[edge]:{danger:'elevator',dangerEvidence:'搭電梯',dangerIntent:'refuse'}},{},{confirm:{[edge]:false}});
  const kept=await say(asked,asked.create(fire),edge);
  assert.notEqual(kept.kind,'rewind','a rule hit the model reads as refusal is confirmed with a yes/no check');
});

test('a narrator sentence that contradicts the facts is replaced by our own acknowledgement',async()=>{
  const text='我叫小岑別開門';
  const coach=make({[text]:{matches:[m('stop_roommate','叫小岑別開門')]}},{},{narrate:{[text]:'我向電話那頭說明房號，門也關上了。'}});
  const s=await say(coach,coach.create(fire),text);
  assert.doesNotMatch(s.reply,/電話那頭|門也關上/);
  assert.match(s.reply,/小岑的手停在門把前/);
});

test('looking around costs no time, and telling a roommate not to open the door does not end the rescue',async()=>{
  const look='我先看一下窗外有沒有煙';
  const coach=make({[look]:{matches:[m('check_window','看一下窗外有沒有煙')],isObservation:true}});
  const s=await say(coach,coach.create(fire),look);
  assert.equal(s.state.director.clock,0);
  assert.ok(s.state.director.met.check_window!==undefined);
  let st=Director.start(); st.facts.firefightersHere=true; st.facts.arrivedAt=st.clock;
  const r=Director.apply(st,{matches:[m('stop_roommate','跟他說不能開門')],dialed:'',danger:null,cues:{respond:false}});
  assert.equal(r.ending,null,'only responding to the firefighters counts as the handoff');
});

test('questions are answered without spending time',async()=>{
  const q='窗戶那邊有煙嗎？';
  const coach=make({[q]:{isQuestion:true}},{},{narrate:{[q]:'小岑看了看窗外：「外面沒有煙。」'}});
  const s=await say(coach,coach.create(fire),q);
  assert.equal(s.kind,'question');
  assert.equal(s.state.director.clock,0);
  assert.match(s.reply,/外面沒有煙/);
});

test('rule layer: Gemini red-team sentences and earlier regressions',()=>{
  const facts=Director.start().facts;
  const danger=['我本來不想搭電梯，但現在只好搭電梯了','雖然衝出去很危險，但我還是要衝出去','小岑想開門，那乾脆我把門打開看看好了',
    '我衝去按電梯下樓','我乾脆從五樓往下跳好了','我踩上冷氣室外機爬出去','我用濕毛巾摀住口鼻，低姿勢快步走出房間往樓梯間跑','我去搭電梯','我跳窗','我衝進走廊'];
  const check=['如果煙越來越大，我就直接跳窗','我去搭電梯逃生，這樣可以嗎？','如果我搭電梯會怎樣？'];
  const safe=['我跑進浴室把毛巾弄濕，拿來塞門縫','搭電梯絕對不行，我們要待在房間','我阻止小岑去把房門打開','我絕對不讓任何人把門打開',
    '我剛才差點跑出去，還好忍住了','跑出去很危險，我們留在房間','跟小岑說千萬不能開門','我不會搭電梯','有人在搭電梯',
    '小岑你先不要開門！外面都是煙，我先把門關緊','我把門關緊並找濕毛巾把門縫堵上'];
  for (const t of danger) { const r=Director.literalDanger(t,facts); assert.ok(r && !r.soft,t); }
  for (const t of check) { const r=Director.literalDanger(t,facts); assert.ok(r && r.soft,'goes to the yes/no check: '+t); }
  for (const t of safe) assert.equal(Director.literalDanger(t,facts),null,t);
  const st=Director.start();
  const none={dialEvidence:'',danger:'',dangerEvidence:'',dangerIntent:'none',isQuestion:false,isObservation:false};
  assert.equal(Director.validate(st,'不要打 110，趕快打給消防隊',{...none,matches:[{id:'dial',evidence:'打給消防隊'}],dialed:'110'}).dialed,'119');
  assert.deepEqual(Director.validate(st,'我沒有關門，但我現在把門關起來',{...none,matches:[{id:'barrier',evidence:'把門關起來'}],dialed:''}).matches.map(x=>x.id),['barrier']);
  assert.deepEqual(Director.validate(st,'我用濕毛巾摀住口鼻',{...none,matches:[{id:'cloth_limit',evidence:'濕毛巾摀住口鼻'}],dialed:''}).matches,[]);
  const parents=Director.apply(st,Director.validate(st,'我打電話給我爸媽',{...none,matches:[{id:'dial',evidence:'打電話'}],dialed:'other'}));
  assert.equal(parents.state.facts.called,false,'calling someone else is not calling 119');
});

test('waiting silently is not answering the firefighters; they call again, then force entry',()=>{
  let st=Director.start(); st.facts.firefightersHere=true; st.facts.arrivedAt=0;
  const wait={matches:[{id:'wait_inside',evidence:'留在房間'}],dialed:'',danger:null,cues:{respond:false}};
  let r=Director.apply(st,wait);
  assert.equal(r.ending,null); assert.match(r.message,/有人就回答/);
  r=Director.apply(r.state,wait);
  assert.equal(r.ending.type,'DELAYED_RESCUE');
  st=Director.start(); st.facts.firefightersHere=true; st.facts.arrivedAt=0; st.facts.arriveAt=6;
  r=Director.apply(st,{matches:[],dialed:'',danger:null,cues:{respond:true}});
  assert.ok(r.ending,'answering ends with the handoff');
});
