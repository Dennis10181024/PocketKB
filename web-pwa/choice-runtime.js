'use strict';
(function publish(root){
  const {matches,evaluate}=typeof module==='object'&&module.exports?require('./choice-pack'):root.PocketChoicePack;
  const copy=value=>structuredClone(value);
  const bounded=value=>Number.isInteger(value)&&value>=0&&value<=2147483647;
  const byId=list=>new Map(list.map(value=>[value.id,value]));
  const pick=(rows,ctx)=>rows?.find(row=>matches(row.when,ctx));
  const severity={NONE:0,MILD:1,MODERATE:2,SEVERE:3};
  const grades={NONE:'無傷',MILD:'輕傷',MODERATE:'中度傷勢・需送醫',SEVERE:'重傷・需住院'};
  const labels={SAFE_RESCUE:'安全待救獲救',DELAYED_RESCUE:'延誤後獲救',SELF_EVACUATION:'安全撤離',
    DELAYED_EVACUATION:'延誤撤離',CRITICAL_FAILURE:'危急失敗'};

  function createRuntime(pack,{random=Math.random}={}){
    const actions={principle:byId(pack.catalog.principles),hazard:byId(pack.catalog.hazards),channel:byId(pack.catalog.channels)};
    const decisions=byId(pack.decisions);
    const endings=byId(pack.endings);
    const sources=byId(pack.meta.sources);
    const path=(step)=>step.kind+':'+step.id;
    const sessionLookup=new WeakMap();
    let sequence=0;

    function context(state,turn={},impact={}){
      const currentHazards=turn.hazards||[];
      const currentPrinciples=turn.principles||[];
      const nextClock=turn.nextClock??state.clock+1;
      return {
        read(ref){
          const [group,name,field]=ref.split('.');
          if(ref==='clock')return state.clock;
          if(ref==='beat.lastVisibleId')return state.beats.findLast(beat=>!beat.hidden)?.id??null;
          if(group==='beat'){
            const hits=state.beats.filter(beat=>beat.id===name);
            return field==='count'?hits.length:(field==='firstTurn'?hits[0]:hits.at(-1))?.at??null;
          }
          if(group==='turn')return name==='nextClock'?nextClock:name==='channelId'?turn.channelId??null:currentHazards.length;
          if(group==='counter')return state.counters[name]||0;
          if(group==='ending')return state.ending?.[name]??null;
          if(group==='impact')return name==='anyInjury'?state.injuries.length>0:impact.injury??0;
          if(group==='npc')return state.npc[name][field];
          return state[group][name];
        },
        has(set,id){
          switch(set){
            case 'met':return Object.hasOwn(state.met,id);
            case 'turnPrinciples':return currentPrinciples.includes(id);
            case 'turnHazards':return currentHazards.includes(id);
            case 'turnCues':return (turn.cues||[]).includes(id);
            case 'seenBeats':return state.beats.some(beat=>beat.id===id);
            case 'seenVariants':return state.beats.some(beat=>beat.variantId===id);
          }
          throw new TypeError('Unknown set '+set);
        },
      };
    }
    function advance(packState,decision,option){
      const state=copy(packState);
      const turn={hazards:[],principles:[],cues:option.cues,channelId:null,nextClock:state.clock+1};
      const ctx=context(state,turn);
      const lines=[];
      const actionLines=[];
      const impacts=[];
      const delta=(kind,amount)=>state.exposure[kind]=(state.exposure[kind]||0)+amount;
      function say(id){
        const variants=pack.presentation.narration[id];
        const count=state.narrationCounts[id]||0;
        state.narrationCounts[id]=count+1;
        const line=variants[count%variants.length];
        lines.push(line);
        return line;
      }
      function credit(id){
        if(!turn.principles.includes(id))turn.principles.push(id);
        state.met[id]??=turn.nextClock;
      }
      function apply(effect,{injuryContext=null}={}){
        const writes=Object.entries(effect.set||{}).map(([field,expr])=>[field,evaluate(expr,ctx)]);
        const exposure=Object.entries(effect.add||{}).map(([field,expr])=>[field.split('.')[1],evaluate(expr,ctx)]);
        for(const [ref,value] of writes){
          const [group,name,npcField]=ref.split('.');
          const owner=group==='npc'?state.npc[name]:state.facts;
          const key=group==='npc'?npcField:name;
          const initial=group==='npc'?pack.initial.npc[name][key]:pack.initial.facts[key];
          if(initial===null?value!==null&&!bounded(value):typeof value!==typeof initial||
            typeof value==='number'&&!Number.isInteger(value)) throw new TypeError('Invalid effect value for '+ref);
          owner[key]=value;
        }
        for(const [kind,amount] of exposure){
          if(!bounded(amount)||!bounded(state.exposure[kind]+amount))throw new TypeError('Invalid exposure increment');
          delta(kind,amount);
        }
        for(const id of effect.emit||[])state.events.push({id,at:state.clock});
        for(const id of effect.credit||[])credit(id);
        for(const entry of effect.injuries||[])state.injuries.push({...entry,at:turn.nextClock,decisionId:decision.id,optionId:option.id});
        if(effect.delay)state.delays.push({reason:effect.delay,at:turn.nextClock,decisionId:decision.id,optionId:option.id});
        if(injuryContext)injuryContext.severity=Math.max(0,...(effect.injuries||[]).map(entry=>severity[entry.severity]));
      }
      function impact(id,definition,result,{fatal=false,direct=true}={}){
        const entry={id,decisionId:decision.id,optionId:option.id,at:fatal?state.clock:turn.nextClock,fatal,
          companion:Boolean(definition.review.companion||(result.effect.injuries||[]).some(i=>i.subject!=='player')),
          direct,severity:0,delay:result.effect.delay??null,review:definition.review,sourceIds:definition.sourceIds,
          injuries:result.effect.injuries||[]};
        apply(result.effect,{injuryContext:entry});
        entry.outcome=say(result.narration);
        state.events.push({id,at:entry.at});
        impacts.push(entry);
      }
      function consequenceResult(tier){return pick(tier.cases,ctx)?.result||tier.result;}
      function ending(rule,hazardId=null){
        const injuryScore=rule.injury==='fromThresholds'?evaluate(pack.injury.score,ctx):0;
        if(!bounded(injuryScore))throw new TypeError('Invalid injury score');
        const levels=pack.injury;
        const injury=rule.injury!=='fromThresholds'?rule.injury:injuryScore<=levels.noneMax?'NONE':injuryScore<=levels.mildMax?'MILD':
          injuryScore<=levels.moderateMax?'MODERATE':'SEVERE';
        state.ending={id:rule.id,type:rule.type,injury,hazardId};
        say(rule.narration);
      }
      function selectedResult(rule){return pick(rule.cases,ctx)?.result||rule.normal;}
      function projected(){
        return {state,lines:lines.length?lines:[pack.presentation.narration[pick(pack.presentation.idle,ctx).narration][0]],
          impacts,actionLines,principles:turn.principles,hazards:turn.hazards};
      }

      // Guard hazards and teaching opportunities against the pre-choice state.
      const available=option.steps.filter(step=>step.kind==='hazard'&&matches(actions.hazard.get(step.id).when,ctx));
      const fatal=available.find(step=>actions.hazard.get(step.id).fatalEndingId);
      if(fatal){
        const rule=actions.hazard.get(fatal.id);
        turn.nextClock=state.clock;
        turn.hazards.push(fatal.id);
        impact(fatal.id,rule,selectedResult(rule),{fatal:true});
        const fatalEnding=endings.get(rule.fatalEndingId);
        if(!matches(fatalEnding.when,ctx))throw new TypeError('Fatal ending guard is false');
        ending(fatalEnding,fatal.id);
        return projected();
      }
      const reachablePrinciples=new Set([...decision.options.flatMap(candidate=>candidate.steps
        .filter(step=>step.kind==='principle').map(step=>step.id))]);
      for(const id of reachablePrinciples){
        const principle=actions.principle.get(id);
        if(!principle.bonus&&matches(principle.review.eligibleWhen,ctx))state.opportunities[id]=true;
      }

      const blocked=new Set(available.flatMap(step=>(actions.hazard.get(step.id).blocks||[]).map(path)));
      turn.hazards.push(...available.map(step=>step.id));
      for(const step of available){
        const hazard=actions.hazard.get(step.id);
        impact(step.id,hazard,selectedResult(hazard));
      }
      let allStepsApplied=available.length===option.steps.filter(step=>step.kind==='hazard').length;
      for(const step of option.steps){
        if(step.kind==='hazard')continue;
        if(blocked.has(path(step))){allStepsApplied=false;continue;}
        const rule=actions[step.kind].get(step.id);
        if(!matches(rule.when,ctx)){
          allStepsApplied=false;
          if(rule.blocked)say(rule.blocked.narration);
          continue;
        }
        const result=selectedResult(rule);
        if(step.kind==='channel')turn.channelId=step.id;
        const fresh=step.kind==='channel'||!Object.hasOwn(state.met,step.id);
        apply(result.effect);
        if(step.kind==='principle')credit(step.id);
        if(fresh && result.narration!==option.narration)say(result.narration);
      }
      if(allStepsApplied){
        if(option.effect.delay){
          const correction=decision.options.find(candidate=>candidate.class==='correct');
          impact(option.id,{sourceIds:option.sourceIds,review:{tip:'當時可改選「'+correction.text+'」'}},
            {narration:option.narration,effect:option.effect});
        }else{
          apply(option.effect);
          if(!lines.length)say(option.narration);
        }
      }
      const actionText=lines.filter(line=>!impacts.some(item=>item.outcome===line));
      actionLines.push(...actionText);

      function phase(name){
        let skip=false;
        for(const rule of pack.phaseRules){
          if(rule.phase!==name||!matches(rule.when,ctx))continue;
          apply(rule.result.effect);
          if(rule.skipBeats)say(rule.result.narration);
          skip ||=rule.skipBeats;
        }
        return skip;
      }
      phase('afterActions');
      state.clock=turn.nextClock;
      for(const rule of pack.consequences){
        if(rule.decisionId!==null&&rule.decisionId!==decision.id || !matches(rule.when,ctx))continue;
        const count=(state.counters[rule.id]||0)+1;
        state.counters[rule.id]=count;
        impact(rule.id,rule,consequenceResult(rule.tiers.findLast(tier=>tier.fromCount<=count)),{direct:rule.decisionId===decision.id});
      }
      const skipBeats=phase('beforeBeats');
      const before=pack.endings.find(rule=>rule.phase==='beforeBeats'&&matches(rule.when,ctx));
      if(before){ending(before);return projected();}

      let pending=null;
      if(!skipBeats)for(const beat of pack.beats){
        if(beat.decisionId&&pending||state.clock<beat.at||!beat.repeat&&ctx.has('seenBeats',beat.id)||!matches(beat.when,ctx))continue;
        if(beat.after){
          const first=ctx.read('beat.'+beat.after.beat+'.firstTurn');
          if(first===null||state.clock<first+beat.after.turns)continue;
        }
        const prevented=beat.prevented&&matches(beat.prevented.when,ctx)?beat.prevented:null;
        const result=prevented?.result||pick(beat.overrides,ctx)?.result||beat.normal;
        if(beat.baseEffect)apply(beat.baseEffect);
        apply(result.effect);
        state.beats.push({id:beat.id,variantId:prevented?.id??null,at:state.clock,hidden:Boolean(beat.hidden)});
        if(!beat.hidden)say(result.narration);
        pending=beat.decisionId||pending;
      }
      const after=pack.endings.find(rule=>rule.phase==='afterBeats'&&matches(rule.when,ctx));
      if(after){ending(after);return projected();}
      if(state.clock>=pack.limits.maxTurns)throw new TypeError('Pack exceeded its turn limit');
      const next=pending?decisions.get(pending):pick(pack.decisions,ctx);
      if(!next||!matches(next.when,ctx))throw new TypeError('No reachable decision after '+decision.id);
      state.decisionId=next.id;
      return projected();
    }
    function shuffle(options){
      const list=options.map(option=>option.id);
      for(let i=list.length-1;i>0;i--){
        const j=Math.floor(random()*(i+1));
        if(j<0||j>i)throw new TypeError('Invalid shuffle random value');
        [list[i],list[j]]=[list[j],list[i]];
      }
      return list;
    }
    function current(session){
      const data=sessionLookup.get(session);
      if(!data)throw new TypeError('Unknown session');
      return data;
    }
    function snapshot(session){
      const {state,lines,order,revision,attempt,retryFrom}=current(session);
      const decision=state.ending?null:decisions.get(state.decisionId);
      return copy({sessionId:session.id,attempt,revision,retryFrom,state,lines,
        status:pack.presentation.status.filter(row=>matches(row.when,context(state))).map(row=>row.text),
        decision:decision&&{id:decision.id,prompt:decision.prompt,options:order.map(id=>{
          const {text}=decision.options.find(option=>option.id===id);return {id,text};
        })}});
    }
    function initialState(){
      return {clock:0,decisionId:pack.initial.decisionId,facts:copy(pack.initial.facts),npc:copy(pack.initial.npc),
        exposure:copy(pack.initial.exposure),met:{},opportunities:{},counters:{},beats:[],events:[],injuries:[],delays:[],ending:null,narrationCounts:{}};
    }
    function start(){
      const state=initialState();
      if(!matches(decisions.get(state.decisionId).when,context(state)))throw new TypeError('Initial decision guard is false');
      const session=Object.freeze({id:root.crypto?.randomUUID?.()||'choice-'+(++sequence)});
      sessionLookup.set(session,{state,lines:[pack.presentation.narration[pack.initial.openingNarration][0]],
        order:shuffle(decisions.get(state.decisionId).options),attempt:1,revision:0,history:[],log:[],requests:new Map(),retryFrom:null});
      return session;
    }
    function inspect(session,kind){
      const {state}=current(session);
      if(state.ending)throw new TypeError('Session ended');
      const row=pick(pack.presentation[kind],context(state));
      return pack.presentation.narration[row.narration][0];
    }
    function submitChoice(session,{decisionId,optionId,inputId,revision,responseTimeMs=null}){
      const data=current(session);
      if(typeof inputId!=='string'||!inputId)throw new TypeError('inputId is required');
      const fingerprint=JSON.stringify([decisionId,optionId,revision,responseTimeMs]);
      const prior=data.requests.get(inputId);
      if(prior){
        if(prior.fingerprint!==fingerprint)throw new TypeError('Conflicting inputId');
        return copy(prior.result);
      }
      if(data.state.ending||revision!==data.revision||decisionId!==data.state.decisionId)throw new TypeError('Stale or ended decision');
      if(!data.order.includes(optionId))throw new TypeError('Option was not displayed');
      if(responseTimeMs!==null&&!bounded(responseTimeMs))throw new TypeError('Invalid response time');
      const decision=decisions.get(decisionId);
      const option=decision.options.find(candidate=>candidate.id===optionId);
      const before=data.state;
      const result=advance(before,decision,option);
      const occurrence=1+data.history.filter(row=>row.decisionId===decisionId).length;
      const order=result.state.ending?[]:shuffle(decisions.get(result.state.decisionId).options);
      const row={sessionId:session.id,scenarioId:pack.meta.id,packVersion:pack.meta.version,inputSource:'choice',
        attempt:data.attempt,decisionId,occurrence,optionId,optionClass:option.class,text:option.text,displayOrderOptionIds:[...data.order],
        responseTimeMs,sourceIds:option.sourceIds,safety:option.safety,fatal:result.impacts.some(impact=>impact.fatal),
        ending:result.state.ending,clock:result.state.clock,principles:result.principles,hazards:result.hazards,
        actionLines:result.actionLines,impacts:result.impacts,
        delays:result.state.delays.slice(before.delays.length),before};
      data.history.push(row);
      const {before:discard,...record}=row;
      data.log.push(record);
      data.state=result.state;
      data.lines=result.lines;
      data.order=order;
      data.revision++;
      const view=snapshot(session);
      data.requests.set(inputId,{fingerprint,result:view});
      return copy(view);
    }
    function turningPoint(history){
      return history.findLast(row=>row.fatal)||
        history.find(row=>row.safety==='unsafe'&&row.impacts.some(i=>i.direct&&(i.severity||i.delay)))||
        history.find(row=>row.safety==='unsafe'&&row.impacts.some(i=>i.direct))||
        history.find(row=>row.actionLines.length)||history[0];
    }
    function impactPriority(a,b){
      return Number(b.fatal)-Number(a.fatal)||Number(b.companion)-Number(a.companion)||
        b.severity-a.severity||Number(Boolean(b.delay))-Number(Boolean(a.delay));
    }
    function directReview(row,impact){
      const events=row.impacts.filter(item=>item.direct);
      const outcomes=events.map(item=>{
        const recorded=item.injuries.map(injury=>injury.label).filter(label=>!item.outcome.includes(label));
        return item.outcome.replace(/。$/u,'')+(recorded.length?'（本回合傷勢：'+recorded.join('、')+'）':'')+'。';
      });
      return {at:impact.at,decisionId:row.decisionId,optionId:row.optionId,eventId:impact.id,optionText:row.text,
        eventIds:events.map(item=>item.id),outcome:[...new Set(outcomes)].join(''),
        tip:impact.review.tip,principleId:impact.review.principleId,sourceIds:[...new Set(events.flatMap(item=>item.sourceIds))]};
    }
    function debrief(session){
      const {state,history,attempt}=current(session);
      if(!state.ending)throw new TypeError('Debrief requires a finished session');
      const ending=state.ending;
      const rule=endings.get(ending.id);
      const ctx=context(state);
      const steps=history.flatMap(row=>row.impacts.map(impact=>({...impact,optionText:row.text})));
      const injuries=state.injuries.map(item=>({...item,subjectName:item.subject==='player'?'本人':state.npc[item.subject].name}));
      const severe=injuries.reduce((level,item)=>severity[item.severity]>severity[level]?item.severity:level,'NONE');
      const worstInjuries=injuries.filter(item=>item.severity===severe);
      const delays=[];
      // Choose concrete, attributable causes first. Keep all events in records.
      const delayEvidence=steps.filter(item=>item.direct&&item.delay).sort(impactPriority);
      for(const reason of [...delayEvidence.map(item=>item.delay),...state.delays.map(item=>item.reason)]){
        if(!delays.includes(reason))delays.push(reason);
        if(delays.length===2)break;
      }
      const featured=history.filter(row=>row.safety==='unsafe').flatMap(row=>
        row.impacts.filter(item=>item.direct).map(impact=>({row,impact}))).sort((a,b)=>impactPriority(a.impact,b.impact));
      const selected=[];
      const seenOptions=new Set(), seenTips=new Set();
      for(const {row,impact} of featured){
        if(seenOptions.has(row.optionId)||seenTips.has(impact.review.tip))continue;
        seenOptions.add(row.optionId);
        seenTips.add(impact.review.tip);
        selected.push(directReview(row,impact));
        if(selected.length===3)break;
      }
      selected.sort((a,b)=>a.at-b.at);
      const riskIdeas=new Set(selected.map(item=>item.principleId));
      const encountered=new Set(history.map(row=>row.decisionId));
      const delayIdeas=[...new Set(steps.filter(i=>i.delay&&i.review.principleId).map(i=>i.review.principleId))];
      const decisionOption=row=>decisions.get(row.decisionId).options.find(o=>o.id===row.optionId);
      const partialRows=history.filter(row=>row.optionClass==='partial');
      const improvements=[...new Map(partialRows.map(row=>[row.optionId,row])).values()].map(row=>{
        const option=decisionOption(row);
        return option.missingStep&&{id:row.optionId,optionText:row.text,text:option.missingStep,sourceIds:option.sourceIds};
      }).filter(Boolean).slice(0,2);
      const otherImprovements=[...actions.principle.values()].filter(p=>state.opportunities[p.id]&&!Object.hasOwn(state.met,p.id)&&!riskIdeas.has(p.id))
        .sort((a,b)=>Number(delayIdeas.includes(b.id))-Number(delayIdeas.includes(a.id))||b.review.priority-a.review.priority)
        .slice(0,2-improvements.length).map(p=>({id:p.id,text:p.review.tip,sourceIds:p.sourceIds}));
      improvements.push(...otherImprovements);
      const point=turningPoint(history);
      const pointImpact=point?.impacts.filter(i=>i.direct).sort(impactPriority)[0];
      const good=[];
      for(const row of history){
        const principle=row.principles.map(id=>actions.principle.get(id)).find(p=>!p.bonus);
        if(row.optionClass==='correct'&&principle&&good.length<3&&!good.some(item=>item.id===principle.id))
          good.push({id:principle.id,optionText:row.text,why:principle.review.why,sourceIds:principle.sourceIds});
      }
      const first=point?.principles.map(id=>actions.principle.get(id))[0];
      const better=point&&decisions.get(point.decisionId).options.find(option=>option.class==='correct');
      const alternative=better&&better.steps.find(step=>step.kind==='principle'&&!point.principles.includes(step.id));
      const reason=pointImpact?.review.tip||(point&&decisionOption(point).missingStep)||
        (alternative&&actions.principle.get(alternative.id).review.why)||first?.review.why;
      const turning=point&&better&&{decisionId:point.decisionId,optionId:point.optionId,eventId:pointImpact?.id??null,optionText:point.text,
        outcome:pointImpact?directReview(point,pointImpact).outcome:point.actionLines[0],
        tip:(better.id===point.optionId?'可以維持「':'可改選「')+better.text+'」'+(reason?' '+reason:'')};
      const type=pick(rule.labels,ctx)?.text||labels[ending.type];
      const result=[type+'。',
        worstInjuries.length?'最嚴重的傷勢為'+[...new Set(worstInjuries.map(i=>i.subject==='player'?i.label:i.subjectName+'的'+i.label))].join('、')+'。':'',
        ending.injury==='NOT_ASSESSED'?'':'本人傷勢分級為'+grades[ending.injury]+'。',
        delays.length?'撤離或救援延誤：'+delays.join('、')+'。':''].join('');
      const parts=[];
      if(ending.type==='CRITICAL_FAILURE')parts.push(pick(rule.summaries,ctx)?.text||type);
      else {
        if(delays.length)parts.push('最早因'+delays[0]+'造成延誤');
        if(worstInjuries.length)parts.push('過程中出現'+worstInjuries[0].label);
      }
      const sourceIds=new Set([...selected.flatMap(x=>x.sourceIds),...improvements.flatMap(x=>x.sourceIds),...good.flatMap(x=>x.sourceIds),
        ...(pointImpact?.sourceIds||point?.sourceIds||[])]);
      return copy({attempt,type,injury:ending.injury==='NOT_ASSESSED'?null:grades[ending.injury],injuries,delays,
        result,summary:parts.length?parts.join('，').replace(/。$/,'')+'。':pick(rule.summaries,ctx)?.text||'本場未記錄傷勢或延誤。',
        good,improvements,encountered:[...encountered],dangers:selected,
        turning:turning?.outcome?turning:null,
        sources:[...sourceIds].map(id=>sources.get(id)),reflection:decisions.get(point?.decisionId)?.reflectionPrompt||pack.review.reflectionPrompt,
        canRetry:Boolean(point)});
    }
    function retry(session){
      const data=current(session);
      if(!data.state.ending)throw new TypeError('Retry requires a finished session');
      const turn=turningPoint(data.history);
      if(!turn)throw new TypeError('No turning point');
      const state=copy(turn.before);
      const order=shuffle(decisions.get(state.decisionId).options);
      data.state=state;
      data.history=data.history.slice(0,data.history.indexOf(turn));
      data.retryFrom={attempt:data.attempt,decisionId:turn.decisionId,clock:state.clock};
      data.log.push({sessionId:session.id,scenarioId:pack.meta.id,packVersion:pack.meta.version,retryFrom:data.retryFrom,attempt:data.attempt+1});
      data.attempt++;
      data.revision++;
      data.requests.clear();
      data.order=order;
      data.lines=['我回到剛才做決定之前。'];
      return snapshot(session);
    }
    function verifyReachability({maxStates=50000}={}){
      const seen=new Set(), visitedDecisions=new Set(), visitedEndings=new Set();
      const sorted=values=>Object.entries(values).sort(([a],[b])=>a<b?-1:a>b?1:0);
      const stack=[initialState()];
      while(stack.length){
        const state=stack.pop();
        if(state.ending){visitedEndings.add(state.ending.id);continue;}
        const {clock,decisionId,facts,npc,exposure,met,counters,beats,injuries}=state;
        // Ignore text and review history, which the DSL cannot read.
        const key=JSON.stringify([clock,decisionId,facts,npc,exposure,Object.keys(met).sort(),sorted(counters),beats,injuries.length>0]);
        if(seen.has(key))continue;
        seen.add(key);
        if(seen.size>maxStates)throw new TypeError('Reachability capacity exceeded');
        const decision=decisions.get(decisionId);
        if(!decision||!matches(decision.when,context(state)))throw new TypeError('Unusable decision '+decisionId);
        visitedDecisions.add(decisionId);
        for(const option of decision.options)stack.push(advance(state,decision,option).state);
      }
      for(const id of decisions.keys())if(!visitedDecisions.has(id))throw new TypeError('Unreachable decision '+id);
      for(const id of endings.keys())if(!visitedEndings.has(id))throw new TypeError('Unreachable ending '+id);
      return {states:seen.size,decisions:visitedDecisions.size,endings:visitedEndings.size};
    }
    return {start,snapshot,observe:session=>inspect(session,'look'),ask:session=>inspect(session,'askCompanion'),
      submitChoice,debrief,retry,verifyReachability,records:session=>copy(current(session).log)};
  }
  if(typeof module==='object'&&module.exports)module.exports={createRuntime};
  else root.PocketChoiceRuntime={createRuntime};
})(globalThis);
