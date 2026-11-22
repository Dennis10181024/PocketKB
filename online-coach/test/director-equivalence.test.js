'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const Module=require('node:module');
const Director=require('../director-registry').get('drill_fire_dorm');
const cases=require('./human-replay-sets.json');
const archive=new Module('fire-director-ce5ec74',module);
archive._compile(execFileSync('git',['show','ce5ec74:online-coach/director.js'],{encoding:'utf8'}),'fire-director-ce5ec74.js');
const Legacy=archive.exports;

test('dorm-fire carries the established safety decisions into the new ending and event rules',()=>{
  const seeds=Object.values(cases).filter(group=>group.scenario==='drill_fire_dorm')
    .map(group=>group.inputs.map(entry=>typeof entry==='string'?entry:entry.text).filter(Boolean));
  seeds.push(['我去打110','跟接線員說我們有兩個人','我去打119','我躲進浴室','我拿浴室毛巾沾水','我徒手抓門把','我先收拾行李']);
  seeds.push(['我把門關緊','我打119','我們在503','我到窗邊揮衣','我跟小岑說不要開門','我保持通話','有人在這裡']);
  seeds.push(['我去搭電梯','我不搭電梯','如果我去搭電梯會怎樣？','我要跳窗','我衝進濃煙','我要跳窗']);
  seeds.push(Array(14).fill('我坐在原處'));
  let count=0;
  for(const sequence of seeds) {
    let baseline=Legacy.start();
    for(const text of [...sequence,...Array(14).fill('我想吃飯')]) {
      const before=Legacy.ruleAssessment(baseline,text);
      const now=Director.ruleAssessment(baseline,text);
      assert.deepEqual(now.matches,before.matches,text);
      assert.equal(now.danger?.id,before.danger?.id,text);
      assert.equal(now.dialed,before.dialed,text);
      const result=Legacy.apply(baseline,before);
      baseline=result.state;
      count++;
      if(result.ending) break;
    }
  }
  assert.ok(count>=50);
  console.log('Comparable pre-4.2 decisions: '+count);
  const fresh=Director.start();
  const danger='我去搭電梯';
  assert.equal(Legacy.apply(fresh,Legacy.ruleAssessment(fresh,danger)).kind,'rewind');
  const terminal=Director.apply(fresh,Director.ruleAssessment(fresh,danger));
  assert.equal(terminal.ending.type,'CRITICAL_FAILURE');
  assert.equal(terminal.state.clock,0);
  assert.match(terminal.message,/轎廂突然停住/);
  const question='如果我搭電梯會怎樣？';
  assert.equal(Director.apply(fresh,Director.ruleAssessment(fresh,question)).kind,'question');
  const repeat=['我關門','我等待','我等待','我等待'];
  let result;
  let state=fresh;
  for(const text of repeat) {
    result=Director.apply(state,Director.ruleAssessment(state,text));
    state=result.state;
  }
  assert.equal(state.facts.doorClosed,false);
  assert.ok(state.consequences.some(item=>item.id==='npc_opened_closed_door'));
  assert.ok(state.exposure.smoke>=2);
});
