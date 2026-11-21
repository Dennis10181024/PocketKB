'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {setTimeout:wait}=require('node:timers/promises');
const {ConversationCoach,specs}=require('../coach');
const V3=require('../../web-pwa/scenario-engine-v3');
const {fallbackNotice}=require('../../web-pwa/drill-presentation');
const intent={intent:'action',needsClarification:false,understanding:'',question:'',emotion:'none',emotionEvidence:''};
const submit=(coach,s,text)=>coach.turn(s.sessionId,{requestId:'test24-turn-'+s.revision,revision:s.revision,text});

test('independent stage deadlines preserve verified state; only interpretation failures change badge',async()=>{
  let slow=false;
  let slowNarration=false;
  const provider={ready:true,async generate(stage,payload){
    await wait(stage==='interpret' ? slow?360:140 : slowNarration?360:160);
    if(stage==='interpret') return {value:{...intent,actions:payload.text.includes('房門帶上') ? [{id:'close',evidence:payload.text}] : []}};
    const sense=payload.sensoryChoices[0];
    return {value:{reply:(sense ? '我'+sense.text+'。' : '')+payload.requiredChange,sensoryId:sense?.id || ''}};
  }};
  const coach=new ConversationCoach(provider,{turnTimeoutMs:240,narrationTimeoutMs:240});
  let s=await submit(coach,coach.create('drill_fire_dorm'),'我把房門帶上');
  assert.equal(s.state.node,'report');
  assert.equal(s.offline,false);
  assert.notEqual(s.decision.narrationFallbackReason,'NARRATION_TIMEOUT');
  slow=true;
  s=await submit(coach,s,'我待在這裡');
  assert.equal(s.fallbackReason,'TURN_TIMEOUT');
  assert.match(fallbackNotice(s.fallbackReason),/連線逾時/);
  slow=false;
  s=await submit(coach,s,'我撥119');
  assert.equal(s.onlineRecovered,true);
  assert.match(fallbackNotice(null,s.onlineRecovered),/已恢復/);
  slowNarration=true;
  s=await submit(coach,coach.create('drill_fire_dorm'),'我把房門帶上');
  assert.equal(s.state.node,'report');
  assert.equal(s.offline,false);
  assert.equal(s.decision.narrationFallbackReason,'NARRATION_TIMEOUT');
});

test('novice inputs explain refusal and conditions, accept safe window signalling, never grant towel protection',async()=>{
  const coach=new ConversationCoach({ready:false});
  let s=coach.create('drill_fire_dorm');
  assert.equal(s.scene.title,'深夜的宿舍');
  assert.match(s.scene.opening,/晚上十一點.*我和室友小岑.*宿舍五樓503室/);
  assert.doesNotMatch(s.scene.node.task,/關門|關閉房門/);
  for (const [text,id,kind,description] of [
    ['我選擇不開門','avoid_open','partial',/開著一道縫/],
    ['拿濕毛巾堵住門口','seal','blocked',/布料貼不住/],
    ['尋找對外窗打開並呼救','open_window_call','blocked',/房門還開著/],
    ['再弄一條濕毛巾遮住口鼻','towel_face','partial',/不能靠它避開.*有毒氣體/],
  ]) {
    const elapsed=s.state.elapsed || 0;
    s=await submit(coach,s,text);
    assert.equal(s.kind,kind,text);
    assert.ok(s.decision.actionIds.includes(id),text);
    assert.equal(s.state.elapsed,elapsed+1,text);
    assert.match(s.reply,description);
    assert.ok(s.decision.source_ids.length);
    assert.equal(s.state.facts.doorClosed,false);
  }
  s=await submit(coach,s,'我關門');
  assert.equal(s.state.node,'report');
  const after=await submit(coach,s,'拿濕毛巾堵住門口');
  assert.ok(after.state.accepted.includes('seal'));
  const signalled=await submit(coach,after,'尋找對外窗打開並呼救');
  assert.ok(signalled.state.accepted.includes('open_window_call'));
  assert.ok(signalled.decision.source_ids.includes('window-guide'));
  const spec=specs.get('drill_fire_dorm');
  const smokey=structuredClone(after.state);smokey.facts.windowOutsideClear=false;
  assert.equal(V3.rawStep(spec,smokey,'尋找對外窗打開並呼救').kind,'blocked');
  const initialState=V3.create(spec,{onlineExperience:true});
  assert.equal(V3.rawStep(spec,initialState,'那我把門拉回來關好').state.facts.doorClosed,true);
  assert.equal(V3.rawStep(spec,initialState,'那我把門拉回來關好，先不要跑出去').kind,'clarify');
  for (const [question, answer] of [
    ['現在外面有煙可以走樓梯嗎？',/不要穿越濃煙/],
    ['窗戶那邊有煙嗎，可以開窗嗎？',/窗外現在看不見煙，但房門還留著一道縫/],
  ]) {
    const initial=coach.create('drill_fire_dorm');
    const reply=await submit(coach,initial,question);
    assert.match(reply.reply,answer);
    assert.ok(reply.decision.source_ids.includes('nfa'));
    assert.deepEqual(reply.state,initial.state);
  }
});

test('research output includes structured turn fields and redacts arbitrary free text',async()=>{
  const rows=[];
  const coach=new ConversationCoach({ready:false},{record:row=>rows.push(row)});
  const start=coach.create('drill_fire_dorm');
  const text='私密字串 example@example.invalid 192.0.2.1';
  const first=await submit(coach,start,text);
  await submit(coach,start,text);
  assert.equal(rows.length,1);
  assert.equal(rows[0].schema,'2.2');
  assert.equal(rows[0].fallbackReason,'NOT_CONFIGURED');
  assert.equal(rows[0].controlInput,'[redacted]');
  assert.equal(first.researchRecord.turn,1);
  assert.doesNotMatch(JSON.stringify(rows),/example|192\.0\.2\.1|私密字串/);
});

test('mild outcome advances to first aid before recap; terminal hazard includes next action and sources',async()=>{
  const coach=new ConversationCoach({ready:false});
  let s=coach.create('drill_fire_dorm');
  for(const text of ['我徒手抓住熱門把','我關門','我撥119','我告知地址A棟宿舍','我回報五樓503室','我等待救援','我保持通訊並依消防人員指示']) s=await submit(coach,s,text);
  assert.equal(s.state.node,'first_aid');
  assert.equal(s.terminal,false);
  assert.equal((await submit(coach,s,'我先用冰塊')).terminal,false);
  s=coach.snapshot(coach.sessions.get(s.sessionId));
  s=await submit(coach,s,'沖脫泡蓋送');
  assert.equal(s.ending.injury,'輕傷');
  assert.ok(s.decision.source_ids.includes('burn-aid'));
  const danger=await submit(coach,coach.create('drill_fire_dorm'),'我搭電梯');
  assert.match(danger.reply,/「搭電梯」\n\n/);
  assert.ok(danger.ending.lessons[0].why && danger.ending.lessons[0].next && danger.ending.lessons[0].sources.length);
});
