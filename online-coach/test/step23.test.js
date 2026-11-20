'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ConversationCoach,specs}=require('../coach');
const {createServer}=require('../server');
const Experience=require('../experience');
const Presentation=require('../../web-pwa/drill-presentation');

test('SSE starts with a checked engine fact and keeps the settled display consistent',async()=>{
  let release, narratorInput;
  const blocked=new Promise(resolve=>{release=resolve;});
  const stages=[];
  const coach=new ConversationCoach({ready:true, async generate(stage,payload) {
    stages.push(stage);
    narratorInput=payload;
    await blocked;
    return {value:{reply:'我加造了一條新出口。',sensoryId:''},usage:{input_tokens:400}};
  }});
  const session=coach.create('drill_fire_dorm');
  const server=createServer(coach);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/sessions/'+session.sessionId+'/turn/stream',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:'step23-stream',revision:0,text:'我關門'}),
    });
    const reader=response.body.pipeThrough(new TextDecoderStream()).getReader();
    const {value}=await reader.read();
    assert.match(value,/event: narration/);
    assert.match(value,/小岑又問/);
    assert.doesNotMatch(value,/新出口|settled/);
    assert.deepEqual(stages,['narrate']);
    assert.ok(narratorInput.context && !narratorInput.before && !narratorInput.after && !narratorInput.history);
    release();
    let all=value;
    for(let frame=await reader.read();!frame.done;frame=await reader.read()) all+=frame.value;
    const parts=all.split('\n\n').filter(chunk=>chunk.startsWith('event: narration')).map(chunk=>JSON.parse(chunk.split('\n')[1].slice(6)));
    const settled=JSON.parse(all.split('\n\n').find(chunk=>chunk.startsWith('event: settled')).split('\n')[1].slice(6));
    assert.equal(parts.join(''),settled.reply);
    assert.equal(settled.decision.validation,'RULE_EXACT_INPUT');
    assert.equal(settled.state.node,'report');
    assert.doesNotMatch(settled.reply,/新出口/);
  } finally {release();await new Promise(resolve=>server.close(resolve));}
});

test('scene words and repeated author lines use the same checker as generated narration',()=>{
  const detail={id:'door',text:'聽見門板扣上的聲音'};
  const opts={text:'我按一下',details:[detail],previous:[],change:'',strict:true,priorLines:['我聽見門板扣上的聲音。'],unsupported:()=>false};
  const answer=Experience.checkNarration({reply:'我聽見門板扣上的聲音。這是一次演練。',sensoryId:'door'},opts);
  assert.ok(answer.failures.includes('out_of_scene') && answer.failures.includes('repeated_line'));
  assert.doesNotMatch(Presentation.sceneText('我模擬通報。'),/演練|模擬/);
  for(const spec of specs.values()) for(const category of ['supportive','unsupportive','neutral'])
    assert.equal(new Set(spec.npc.online.emotionVariants[category]).size,3);
});
