'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const directors=require('../director-registry');
const school=directors.get('earthquake_school');
const fire=directors.get('drill_fire_dorm');
const {ConversationCoach,createOpenAIProvider}=require('../coach');
const {correct}=require('./step42-live');

test('a rejected danger confirmation restores the question without spending a turn',()=>{
  const state=school.start();
  const proposal={matches:[],danger:'elevator',dangerIntent:'question',isQuestion:true};
  const assessment=school.validate(state,'搭電梯可以嗎？',proposal);
  assert.ok(assessment.pendingDanger);
  const out=school.apply(state,school.resolveDanger(assessment,false));
  assert.equal(out.kind,'question');
  assert.equal(out.state.clock,0);
  assert.equal(out.state.rewinds,undefined);
});

test('a model cannot turn negation or someone else’s action into a fatal player action',()=>{
  for(const text of ['我不搭電梯','小維說他想搭電梯','我勸小維不要去搭電梯']){
    const result=school.validate(school.start(),text,{danger:'elevator',dangerIntent:'execute',dangerEvidence:text});
    assert.equal(result.danger,null,text);
    assert.equal(result.pendingDanger,null,text);
  }
});

test('landing and roll call are separate chances to act, with recorded omissions',()=>{
  let state=school.start();
  let end;
  for(let i=0;i<9&&!end;i++){
    const out=school.apply(state,school.ruleAssessment(state,'我低頭玩手機不理老師'));
    state=out.state;
    end=out.ending;
  }
  const times=id=>state.beats.find(b=>b.id===id)?.t;
  assert.ok(times('outside')<times('gather'));
  assert.ok(state.consequences.some(c=>c.id==='missed_aftershock'));
  assert.ok(state.consequences.some(c=>c.id==='missed_roll_call'));
  assert.notEqual(end.type,'SELF_EVACUATION');
});

test('rough play causes escalating consequences, including harm to a persuaded classmate',()=>{
  let state=school.start();
  const advance=text=>{
    const out=school.apply(state,school.ruleAssessment(state,text));state=out.state;return out;
  };
  assert.match(advance('感覺超好玩 趕緊衝出去拍個限動').message,/手臂.*刺痛/);
  assert.match(advance('跟他說來一起拍限動 超好玩的').message,/小維.*捏著手腕/);
  assert.ok(state.facts.npcHurt);
  assert.match(advance('餘震有甚麼好怕 超小的 直接衝出去').message,/小腿.*一跛一跛/);
  assert.match(advance('一邊跟同學嬉戲 一邊走路一邊唱歌').message,/腳踝一扭/);
  assert.match(advance('低頭玩手機 不理老師').message,/低頭滑手機.*外牆/);
  assert.match(advance('去隔壁班找別人玩').message,/隔壁班.*找|名冊旁畫了記號/);
  assert.deepEqual(state.beats.find(beat=>beat.id==='gather'),{id:'gather',t:6});
  advance('低頭玩手機 不理老師');
  const last=advance('繼續不回話');
  const ending=school.ending(state,last.ending,last.message);
  assert.match(ending.type,/需送醫/);
  const turning=ending.lessons.find(l=>l.title==='關鍵轉折');
  assert.equal(turning.why.split(' → ').length,3);
  assert.match(turning.why,/^「感覺超好玩 趕緊衝出去拍個限動」/);
  assert.doesNotMatch(turning.why,/名冊|我一離開桌下|教職員在隊伍邊找到我/);
  const dangers=ending.lessons.find(l=>l.title==='這次的危險選擇與後果').why.split('\n');
  assert.equal(dangers.length,4);
  assert.match(dangers[0],/逐步累積/);
  assert.ok(dangers.slice(1).every(line=>line.split(' → ').length===3));
  assert.match(dangers.join('\n'),/餘震有甚麼好怕 超小的 直接衝出去/);
  assert.match(dangers.join('\n'),/跟他說來一起拍限動 超好玩/);
  const missing=ending.lessons.find(l=>l.title==='下次可以補上的')?.why || '';
  for(const line of dangers.slice(1)) assert.ok(!missing.includes(line.split(' → ')[2]));
  assert.ok(ending.lessons.find(l=>l.title==='官方依據').sources.length);
  assert.doesNotMatch(last.message,/這樣很危險|你應該|回到當下/);
});

test('seven correct rule turns narrate each fixed action only when fresh and finish at roll call',()=>{
  let state=school.start();
  let ending;
  const lines=Object.values(school.PRINCIPLES).map(p=>p.ack).filter(Boolean);
  const observed=new Set();
  assert.equal(correct.length,7);
  for(const [index,input] of correct.entries()){
    const out=school.apply(state,school.ruleAssessment(state,input));
    for(const line of lines.filter(line=>out.message.includes(line))){
      assert.ok(!observed.has(line),`turn ${index+1} repeated ${line}`);
      observed.add(line);
    }
    if(index===3) assert.doesNotMatch(out.message,/我在原地護住頭頸|我壓低身子縮進/);
    if(index<6) assert.equal(out.ending,null);
    state=out.state;
    ending=out.ending;
  }
  assert.equal(ending.type,'SELF_EVACUATION');
  assert.equal(ending.injury,'NONE');
  assert.ok(state.facts.counted);
  const initial=fire.start();
  const assessment=fire.ruleAssessment(initial,'我先把門關緊');
  const once=fire.apply(initial,assessment);
  const twice=fire.apply(once.state,assessment);
  assert.match(twice.message,/我維持剛才的做法/);
  assert.ok(!twice.message.includes(fire.PRINCIPLES.barrier.ack));
});

test('elevator endings hide unassessed injury and use a single quote from the relevant decision in both scenarios',()=>{
  for(const director of [school,fire]){
    const state=director.start();
    const prefix='我先說明狀況'.repeat(15);
    const text=prefix+'，我決定搭電梯';
    const out=director.apply(state,director.ruleAssessment(state,text));
    assert.equal(out.ending.injury,'NOT_ASSESSED');
    const end=director.ending(out.state,out.ending,out.message);
    assert.equal(end.type,'受困電梯，等待救援');
    assert.equal(end.injury,null);
    assert.match(end.text,/救援還需要時間/);
    const turning=end.lessons.find(l=>l.title==='關鍵轉折');
    const [quote,consequence,tip]=turning.why.split(' → ');
    assert.match(quote,/我決定搭電梯/);
    assert.ok([...quote.slice(1,-1)].length<=40);
    assert.match(consequence,/受困在轎廂內/);
    assert.ok(tip);
  }
});

test('429 diagnostics record only provider type and code, even with research text off',async()=>{
  for(const detail of [{type:'insufficient_quota',code:'credit_balance_exhausted'},
    {type:'rate_limit_error',code:'rate_limit_exceeded'}]){
    const key='unit-test-private-key';
    const provider=createOpenAIProvider({apiKey:key,fetchImpl:async()=>new Response(
      JSON.stringify({error:{...detail,message:'private '+key,headers:{Authorization:key}}}),{status:429})});
    const records=[];
    const coach=new ConversationCoach(provider,{director:true,logText:false,record:row=>records.push(row)});
    const s=coach.create('earthquake_school');
    const turn=await coach.turn(s.sessionId,{requestId:'rate-limit-test',revision:0,text:'我躲在桌下'});
    assert.equal(turn.fallbackReason,'MODEL_UNAVAILABLE');
    assert.deepEqual(records[0].provider_errors,[{stage:'direct',http_status:429,error_type:detail.type,error_code:detail.code}]);
    assert.doesNotMatch(JSON.stringify(records),/unit-test-private-key|Authorization|headers/);
  }
});

test('a dangerous interruption blocks the call and the declared principles in the same turn',()=>{
  const state=school.start();
  const input='我衝出去，然後躲桌下並打119';
  const out=school.apply(state,school.ruleAssessment(state,input));
  assert.equal(out.kind,'risk');
  assert.equal(out.state.facts.called,false);
  assert.equal(out.state.facts.covered,false);
  assert.ok(!out.state.met.dial);
});

test('the alternate beat is recorded once and unlocks its successor using the original ID',()=>{
  let state=school.start();
  for(const input of ['我躲桌下抓住桌腳，叫小維不要跑','我陪小維留在掩護處，等搖晃停了再走','餘震時我就地護頭',
    '我用書包護頭，跟老師走樓梯，不推不跑','我繞開電線到操場','我留在本班集合處','老師點名我答到']){
    state=school.apply(state,school.ruleAssessment(state,input)).state;
  }
  assert.deepEqual(state.beats.filter(beat=>beat.id==='gather'),[{id:'gather',variantId:'gather_in_group',t:6}]);
  assert.equal(state.facts.counted,true);
  const early=fire.apply(fire.start(),fire.ruleAssessment(fire.start(),'我跳窗'));
  const debrief=fire.ending(early.state,early.ending,early.message);
  assert.ok(!debrief.lessons.some(l=>l.title==='下次可以補上的'),'a fatal first turn provided no opportunity for later principles');
});

test('director exercises ask for hints explicitly and display only the neutral decision question',async()=>{
  const coach=new ConversationCoach({ready:false,generate(){throw new Error('offline regression');}},{director:true});
  let state=coach.create('earthquake_school');
  const send=(text,intent='action',hintTrigger)=>coach.turn(state.sessionId,{
    requestId:'hint-step42-'+state.revision,revision:state.revision,text,intent,hintTrigger});
  state=await send('我要寫作業');
  state=await send('晚餐吃什麼');
  assert.deepEqual(state.suggestions,[]);
  state=await send('','hint','idle');
  assert.deepEqual(state.suggestions,[]);
  const prompt=state.scene.node.task;
  state=await send('','hint','button');
  assert.deepEqual(state.suggestions,[prompt]);
});
