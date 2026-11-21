'use strict';

const {createDirector}=require('./director-engine');
const scripts=[require('./director-scenarios/fire-dorm'),require('./director-scenarios/earthquake-school')];
module.exports=new Map(scripts.map(script=>[script.id,{...createDirector(script),opening:script.opening,sources:script.sources}]));
