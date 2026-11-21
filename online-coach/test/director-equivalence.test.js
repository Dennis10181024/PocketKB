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

test('dorm-fire director matches the published monolith on every applied turn',()=>{
  const seeds=Object.values(cases).filter(group=>group.scenario==='drill_fire_dorm').map(group=>group.inputs.map(entry=>typeof entry==='string'?entry:entry.text).filter(Boolean));
  seeds.push(['我去搭電梯','我不搭電梯','如果我去搭電梯會怎樣？','我要跳窗','我衝進濃煙','我要跳窗']);
  seeds.push(['我去打110','跟接線員說我們有兩個人','我去打119','我躲進浴室','我拿浴室毛巾沾水','我徒手抓門把','我先收拾行李']);
  seeds.push(['我把門關緊','我打119','我們在503','我到窗邊揮衣','我跟小岑說不要開門','我保持通話','有人在這裡']);
  seeds.push(Array(14).fill('我坐在原處'));
  let count=0;
  for(const sequence of seeds) {
    let old=Legacy.start(), current=Director.start();
    assert.deepEqual(current,old);
    for(const text of [...sequence,...Array(14).fill('我想吃飯')]) {
      const judge=Legacy.ruleAssessment(old,text);
      assert.deepEqual(Director.ruleAssessment(current,text),judge,text);
      const expected=Legacy.apply(old,judge);
      const actual=Director.apply(current,judge);
      assert.deepEqual(actual,expected,text);
      assert.equal(Director.question(actual.state),Legacy.question(expected.state));
      assert.deepEqual(Director.hints(actual.state),Legacy.hints(expected.state));
      assert.equal(Director.look(actual.state),Legacy.look(expected.state));
      count++;
      old=expected.state;current=actual.state;
      if(expected.ending) {
        assert.deepEqual(Director.ending(current,actual.ending,actual.message,[]),Legacy.ending(old,expected.ending,expected.message,[]));
        break;
      }
    }
  }
  console.log('Fire equivalence turns: '+count);
  assert.ok(count>=65);
});
