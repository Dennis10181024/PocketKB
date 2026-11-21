'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ConversationCoach,specs}=require('../coach');
const Experience=require('../experience');
const V3=require('../../web-pwa/scenario-engine-v3');
const run=(coach,state,data)=>coach.turn(state.sessionId,{requestId:'step26-'+state.revision,revision:state.revision,...data});

test('text logging is opt-in, keeps displayed text and evidence, and scrubs keys and IPs',async()=>{
  const rows=[];
  const provider={ready:true,async generate(stage,payload){
    if(stage==='interpret') return {value:{intent:'action',needsClarification:false,understanding:'',question:'',
      actions:[{id:'close',evidence:'把房門帶上'}],emotion:'none',emotionEvidence:''}};
    return {value:{reply:payload.requiredChange}};
  }};
  const fake=['sk','test','development_secret_00000000'].join('-');
  const personal=fake+' 192.0.2.1 [2001:db8::98] IP:2001:db8:0:0:0:ff00:42:8329';
  const coach=new ConversationCoach(provider,{logText:true,record:row=>rows.push(row)});
  const start=coach.create('drill_fire_dorm');
  const hints=await run(coach,start,{intent:'hint',hintTrigger:'button'});
  assert.deepEqual(rows[0].suggestion_texts,hints.suggestions);
  assert.equal(rows[0].reply_text,start.scene.opening);
  assert.ok(rows[0].npc_lines.some(line=>line.includes('小岑')));
  await run(coach,hints,{text:'  我把房門帶上 '+personal+'  ',researchText:false});
  assert.match(rows[1].input_text,/^  我把房門帶上 \[redacted\] \[redacted\] \[\[redacted\]\] IP\[redacted\]  $/);
  assert.deepEqual(rows[1].model_actions,[{id:'close',evidence:'把房門帶上'}]);
  assert.ok(rows[1].reply_text);
  assert.ok(rows.every(row=>row.npc_state.proposal_shown));
  const plain=new ConversationCoach(provider,{logText:false,record:row=>rows.push(row)});
  const optedIn=await run(plain,plain.create('drill_fire_dorm'),{text:'我把房門帶上',researchText:true});
  assert.equal(optedIn.researchRecord.input_text,'我把房門帶上');
  assert.equal(rows[2].input_text,undefined);
  assert.equal(rows[2].reply_text,undefined);
  assert.ok(rows[2].actionValidation.every(item=>item.evidence==='[redacted]'));
});

test('historical action ID sequence cannot reach best rescue while the NPC is ignored',async()=>{
  const spec=specs.get('drill_fire_dorm');
  const actions=[['open_window_call'],['close'],['call','address','signal_window'],['room'],['seal'],['wait','contact']];
  const sequence=actions.map(ids=>({intent:'action',onlineExperience:true,actionIds:ids,actionBatches:ids.map(id=>({ids:[id],source:'rule'}))}));
  const replayed=V3.replayDecisions(spec,sequence);
  assert.equal(replayed.sessionStatus,'COMPLETED');
  assert.equal(replayed.endingType,'DELAYED_RESCUE');
  assert.equal(replayed.npc.handled,false);
  assert.ok(replayed.events.some(event=>event.eventId==='npc-unhandled-rescue'));
  assert.equal(replayed.npc.emotion,null);
  assert.match(spec.opening,/小岑說：「我開門/);
  const coach=new ConversationCoach({ready:false});
  let state=await run(coach,coach.create(spec.id),{text:'小岑不要把門打開'});
  assert.equal(state.researchRecord.npc_state.handled,true);
  assert.equal(state.researchRecord.npc_state.emotion_triggered,true);
  for (const text of ['我關門','我撥119','安學路100號A棟','五樓503室','我等待救援','我保持通訊']) state=await run(coach,state,{text});
  assert.equal(state.state.endingType,'SAFE_RESCUE');
});

test('a completed phase rejects B12 and similar waiting language, but active waiting can use it',()=>{
  const detail={id:'radio',text:'聽到房號'};
  const options={text:'我保持聯絡',details:[detail],previous:[],change:'消防員確認房號後接手。',unsupported:()=>false};
  for(const phrase of ['我望向窗外，還沒看見消防人員。','我還在房裡等消防隊來。','救援人員還沒到。','我還沒撤離。']){
    const value={reply:'我聽到房號。消防員確認房號後接手。'+phrase,sensoryId:'radio'};
    assert.ok(Experience.checkNarration(value,{...options,completed:true}).failures.includes('waiting_after_handoff'),phrase);
    assert.doesNotMatch(Experience.checkNarration(value,options).failures.join(','),/waiting_after_handoff/);
  }
});
