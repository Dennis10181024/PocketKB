'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const directors=require('../director-registry');
const school=directors.get('earthquake_school');
const fire=directors.get('drill_fire_dorm');
const {ConversationCoach}=require('../coach');

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
  assert.ok(ending.lessons.find(l=>l.title==='關鍵轉折')?.next);
  assert.ok(ending.lessons.find(l=>l.title==='官方依據').sources.length);
  assert.doesNotMatch(last.message,/這樣很危險|你應該|回到當下/);
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
