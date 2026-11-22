'use strict';
const QUESTION = /[?？]\s*$|(?:嗎|呢|怎麼辦)[。！!\s]*$|^(?:為什麼|可不可以|能不能|要不要|可否|什麼時候)/;
function protectedSpan(text, at, actor) {
  // Words right before the matched danger that turn it into a refusal, a warning to someone else, another person's act,
  // or something that almost happened but did not.
  const before = text.slice(Math.max(0, at - 12), at);
  const clause = before.split(/[，。！？；,!?;]/).at(-1);
  return /(?:不|別|沒有|拒絕|不要|不會|不能|不可以|千萬別|禁止|不行)(?:要|會|去|能|可以|想)?(?:先|再|直接)?$/.test(before) ||
    (actor.test(before) && !/(?:跟|和|與|帶上|拉著)(?:前面(?:的)?)?(?:他|她|室友|同學)$/.test(clause) && !/(?:約|找|邀|帶|拉|慫恿|叫|跟).{0,10}(?:一起|也|來).{0,3}$/.test(clause)) ||
    /阻止|不讓|別讓|不准|叫.{0,5}(?:不要|別)|請.{0,5}(?:不要|別)|勸.{0,5}(?:不要|別)|差點|差一點|本來想|剛才想|剛剛想|還好沒/.test(clause);
}
function hypotheticalSpan(text, at) {
  const clause = text.slice(0, at).split(/[。！？；!?;]/).at(-1);
  return /(?:如果|假如|萬一|想像|假設|要是)/.test(clause) || QUESTION.test(text.slice(at).split(/[。！；!;]/)[0]);
}
function warning(text, at, length) {
  return /^(?:根本|很|太|會|有|超|非常)?(?:危險|會死|不安全|找死|太扯|是錯的|會被砸|很容易卡在)|^.{0,3}(?:絕對|千萬)?(?:不行|不可以|不能|不要)/.test(text.slice(at + length));
}
function selfNegated(text, evidence) {
  if (!evidence) return false;
  const spots = []; let at = text.indexOf(evidence);
  while (at !== -1) { spots.push(at); at = text.indexOf(evidence, at + 1); }
  if (!spots.length) return false;
  return spots.every(i => /(?:我)?(?:不|沒有|不會|不想|不打算|拒絕)(?:要|去|先)?$/.test(text.slice(Math.max(0, i - 6), i)));
}

// ---------- model contract ----------
const confirmInstruction = `判斷玩家是不是自己打算做指定行為。明確承諾或已選定的條件式計畫回 true。拒絕、純資訊提問、假設、勸告、轉述他人和未遂行為回 false。只回傳 executing。`;
const narrationSchema = {type:'object',additionalProperties:false,required:['reaction'],properties:{reaction:{type:'string'}}};
const confirmSchema = {type:'object',additionalProperties:false,required:['executing'],properties:{executing:{type:'boolean'}}};
const occurrences=(pattern,text)=>text.matchAll(new RegExp(pattern.source,pattern.flags.replace(/g/g,'')+'g'));

function resolveDanger(assessment, executing) {
  if (!assessment.pendingDanger) return assessment;
  return {...assessment, danger:executing ? assessment.pendingDanger : null, pendingDanger:null,
    isQuestion:!executing && Boolean(assessment.questionCandidate), confirmed:Boolean(executing)};
}

const clone = value => JSON.parse(JSON.stringify(value));
const FORBIDDEN = /演練|模擬|系統|關鍵原則|正確答案|這樣很危險|你(?:應該|必須|最好)|回到(?:當下|剛才那一刻)|這個決定是(?:對|錯)的/;
/**
 * Scenario contract: ordered principles/operations run before the clock. A beat can be
 * conditional, repeating, and have a prevented variant. Consequences only modify state
 * through update(); scripts may compute predicates, projections and ending decisions.
 */
function createDirector(script) {
  const {principles,hazards}=script;
  const ids=Object.keys(principles);
  const phone=script.phone;
  const names=[script.npc.name,...(script.npc.otherNames || [])];
  const actor=new RegExp('(?:有人|別人|室友|她|他|同學|'+names.map(name=>name.replace(/[^\p{L}\p{N}]/gu,'')).join('|')+')(?:說|正在|在|要|想)*$');
  const schema={type:'object',additionalProperties:false,
    required:['matches','dialed','dialEvidence','danger','dangerEvidence','dangerIntent','isQuestion','isObservation'],
    properties:{
      matches:{type:'array',items:{type:'object',additionalProperties:false,required:['id','evidence'],
        properties:{id:{type:'string',enum:ids},evidence:{type:'string'}}}},
      dialed:{type:'string',enum:['',...Object.keys(phone.channels),'other']},dialEvidence:{type:'string'},
      danger:{type:'string',enum:['',...Object.keys(hazards)]},dangerEvidence:{type:'string'},
      dangerIntent:{type:'string',enum:['none','execute','refuse','question','warn_others','other_person']},
      isQuestion:{type:'boolean'},isObservation:{type:'boolean'},
    }};
  const instructions={
    direct:script.instructions.direct,
    narrate_director:script.instructions.narrate_director,
    confirm_danger:script.instructions.confirm_danger || confirmInstruction,
  };
  const start=()=>({clock:0,facts:clone(script.facts),met:{},exposure:clone(script.exposure),beats:[],wrongNumber:0,lastQuestion:script.lastQuestion});
  const context=state=>({state,facts:state.facts,clock:state.clock,seen:id=>state.beats.find(beat=>beat.id===id || beat.variantId===id)});
  const active=(hazard,facts,text)=>!hazard.when || hazard.when(facts,text);
  function protectedOccurrence(text,at,length,id) {
    return protectedSpan(text,at,actor) ||
      warning(text,at,length) || Boolean(script.protect?.(text,at,length,id));
  }
  function literalDanger(text,facts=start().facts) {
    let soft=null;
    for (const [id,hazard] of Object.entries(hazards)) {
      if (!active(hazard,facts,text)) continue;
      for (const match of occurrences(hazard.pattern,text)) {
        if (protectedOccurrence(text,match.index,match[0].length,id)) continue;
        if (hypotheticalSpan(text,match.index)) {soft ??= {id,evidence:match[0],soft:true};continue;}
        return {id,evidence:match[0]};
      }
    }
    return soft;
  }
  function validate(state,text,proposal) {
    const exact=value=>typeof value==='string' && value.trim().length>=2 && text.includes(value);
    const matches=[];
    for (const item of Array.isArray(proposal?.matches)?proposal.matches:[]) {
      if (!ids.includes(item?.id) || !exact(item.evidence) || selfNegated(text,item.evidence) ||
          (principles[item.id].validate && !principles[item.id].validate(text,item))) continue;
      if (!matches.some(m=>m.id===item.id)) matches.push({id:item.id,evidence:item.evidence});
    }
    let dialed=schema.properties.dialed.enum.includes(proposal?.dialed)?proposal.dialed:'';
    dialed=phone.normalize ? phone.normalize(text,dialed,matches) : dialed;
    if (dialed && selfNegated(text,proposal?.dialEvidence || '')) dialed='';
    const rule=literalDanger(text,state.facts);
    const intent=proposal?.dangerIntent || 'none';
    let danger=null,pendingDanger=null;
    const proposed=hazards[proposal?.danger];
    if (rule) {
      if (proposal?.danger===rule.id && intent==='execute' && !rule.soft) danger=rule;
      else pendingDanger=rule;
    } else if (proposal?.danger && proposed && intent==='execute' && exact(proposal.dangerEvidence)) {
      const evidence=proposal.dangerEvidence;
      const offsets=[];
      for (let index=text.indexOf(evidence);index!==-1;index=text.indexOf(evidence,index+1)) offsets.push(index);
      const literalEvidence=[...occurrences(proposed.pattern,evidence)];
      const spans=offsets.flatMap(index=>literalEvidence.length?
        literalEvidence.map(match=>[index+match.index,match[0].length]):
        [[index,evidence.length]]);
      const ownEvidence=literalEvidence.length || !/^(?:(?:我|我們)?(?:不|別|沒有|拒絕|阻止)|(?:有人|別人|同學|室友).{0,6}(?:說|想|要))/.test(evidence);
      const span=ownEvidence && spans.find(([index,length])=>!protectedOccurrence(text,index,length,proposal.danger));
      if (span &&
          (proposed.modelWhen ? proposed.modelWhen(state.facts,text) : active(proposed,state.facts,text))) {
        const found={id:proposal.danger,evidence,soft:hypotheticalSpan(text,span[0])};
        if (found.soft) pendingDanger=found;else danger=found;
      }
    }
    const disagreement=(rule?.id || '')!==(intent==='execute'?proposal?.danger || '':'')
      ? {rule:rule?.id || '',model:proposal?.danger || '',intent}:null;
    const explicitQuestion=QUESTION.test(text) && !/(?:我|我們)(?:就|還是|決定).{0,12}/.test(text);
    if (explicitQuestion && matches.every(m=>m.id===phone.channels[dialed]?.principle)) dialed='';
    const questionCandidate=(Boolean(proposal?.isQuestion) || explicitQuestion) && !dialed;
    return {matches,dialed,danger,pendingDanger,inputEvidence:text,
      dialEvidence:exact(proposal?.dialEvidence)?proposal.dialEvidence:matches.find(m=>m.id===phone.channels[dialed]?.principle)?.evidence,
      ...(pendingDanger?{questionCandidate}:{}),
      isQuestion:questionCandidate && (!matches.length || explicitQuestion) && !danger && !pendingDanger,
      isObservation:Boolean(proposal?.isObservation) && !danger && !pendingDanger && !dialed &&
        matches.every(m=>script.observationPrinciples.includes(m.id)),
      disagreement,cues:script.cues(text)};
  }
  function ruleAssessment(state,text) {
    const matches=Object.entries(script.fallback).flatMap(([id,re])=>{
      const found=text.match(re);
      return found && !selfNegated(text,found[0])?[{id,evidence:found[0]}]:[];
    });
    const v=validate(state,text,{matches,dialed:phone.literal?.(text) || '',danger:'',dangerIntent:'none',
      isQuestion:QUESTION.test(text),isObservation:false});
    return resolveDanger(v,!v.pendingDanger?.soft);
  }

  function update(ctx,effects) {
    if (!effects) return;
    const patch=typeof effects==='function'?effects(ctx):effects;
    for (const [key,value] of Object.entries(patch.facts || {})) ctx.facts[key]=value;
    for (const [key,value] of Object.entries(patch.exposure || {})) ctx.state.exposure[key]=(ctx.state.exposure[key] || 0)+value;
    if (patch.events) ctx.out.events.push(...patch.events);
    if (patch.lines) ctx.out.programLines.push(...patch.lines);
    if (patch.notDone) ctx.out.notDone.push(...patch.notDone);
  }
  function runBeats(ctx) {
    let decisionShown=false;
    for (const definition of script.beats) {
      const {id,at=0,after,decision,when,repeat,prevented,normal,effects,hidden}=definition;
      if (ctx.clock<at || (!repeat && ctx.seen(id)) || (when && !when(ctx))) continue;
      if (after && (!ctx.seen(after.beat) || ctx.clock<ctx.seen(after.beat).t+after.turns)) continue;
      if (decision && decisionShown) continue;
      const variant=prevented?.when(ctx)?prevented:normal;
      update(ctx,effects);
      update(ctx,variant?.effects);
      if (hidden) {
        if (!repeat) ctx.state.beats.push({id,t:ctx.clock,hidden:true});
        continue;
      }
      if (decision) decisionShown=true;
      ctx.state.beats.push({id,...(variant?.id && variant.id!==id?{variantId:variant.id}:{}),t:ctx.clock});
      const line=typeof variant?.text==='function'?variant.text(ctx):variant?.text;
      if (line) ctx.out.beatLines.push(line);
    }
  }
  function noteConsequence(ctx,{id,text,source,evidence='',effect}) {
    const entry={id,text,source,evidence,t:ctx.clock};
    (ctx.state.consequences ||= []).push(entry);
    ctx.out.consequences.push(entry);
    update(ctx,effect);
  }
  function apply(before,assessment,{question=false}={}) {
    const state=clone(before);
    const out={state,kind:'safe',accepted:[],fresh:[],notDone:[],ackLines:[],programLines:[],beatLines:[],endLines:[],events:[],consequences:[],ending:null};
    const done=()=>{out.message=compose(out,'');return out;};
    const hazard=hazards[assessment.danger?.id];
    const blocked=new Set(hazard?.blocks || []);
    const said=new Set(assessment.matches.map(match=>match.id).filter(id=>!blocked.has(id)));
    const ctx={...context(state),assessment,out,said,flags:{}};
    const credit=id=>{
      if (blocked.has(id)) return;
      out.accepted.push(id);
      const evidence=assessment.matches.find(match=>match.id===id)?.evidence || assessment.dialEvidence;
      if (!state.met[id]) {state.met[id]=state.clock+1;out.fresh.push(id);}
      if (evidence) (state.evidence ||= {})[id] ||= evidence;
    };
    if (!hazard && (assessment.isQuestion || question)) {
      out.kind='question';
      out.programLines.push(script.answer(ctx));
      return done();
    }
    if (hazard?.kind==='fatal') {
      const id=assessment.danger.id;
      state.hazards=[...(state.hazards || []),id];
      out.events.push({kind:'hazard',action:id});
      noteConsequence(ctx,{id,text:hazard.text,source:hazard.source,evidence:assessment.inputEvidence || assessment.danger.evidence});
      out.programLines.push(hazard.text);
      out.kind='failed';
      out.ending={type:'CRITICAL_FAILURE',injury:hazard.injury || 'NOT_ASSESSED',hazard:id};
      return done();
    }
    if (hazard) {
      const effect=typeof hazard.effect==='function'?hazard.effect(ctx):hazard.effect;
      noteConsequence(ctx,{id:assessment.danger.id,text:effect?.lines?.join('') || hazard.text,source:hazard.source,
        evidence:assessment.danger.evidence,effect});
      out.events.push({kind:'hazard',action:assessment.danger.id});
      out.kind='risk';
    }
    for (const operation of script.operations) {
      if (blocked.has(operation)) continue;
      if (operation==='@phone') {
        if (!assessment.dialed) continue;
        const channel=phone.channels[assessment.dialed];
        if (channel?.effect && (!channel.when || channel.when(ctx)) && !blocked.has(channel.principle)) {
          update(ctx,channel.effect);
          if (channel.principle) credit(channel.principle);
        } else if (!blocked.has(channel?.principle)) {
          state.wrongNumber+=1;
          update(ctx,channel?.wrong || phone.other);
        }
        continue;
      }
      if (typeof operation==='function') {operation(ctx,{credit,update:effects=>update(ctx,effects)});continue;}
      const p=principles[operation];
      if (!said.has(operation) || p.when && !p.when(ctx)) continue;
      const allowed=Object.entries(p.requires || {}).every(([fact,expected])=>ctx.facts[fact]===expected);
      if (allowed) {update(ctx,p.effect);credit(operation);}
      else update(ctx,p.blocked);
    }
    out.ackLines=[...new Set(out.accepted)].map(id=>principles[id].ack).filter(Boolean).slice(0,3);
    if (script.narrationEvidence) out.acceptedEvidence=assessment.matches.filter(item=>out.accepted.includes(item.id));
    if (assessment.isObservation) {out.kind='observe';return done();}
    ctx.clock=++state.clock;
    for (const [id,p] of Object.entries(principles)) {
      if (!p.bonus && (!p.eligibleWhen || p.eligibleWhen({ ...context(before) }))) (state.opportunities ||= {})[id]=true;
    }
    for (const consequence of script.consequences || []) {
      if (!consequence.when(ctx)) continue;
      const text=typeof consequence.text==='function'?consequence.text(ctx):consequence.text;
      noteConsequence(ctx,{...consequence,text,evidence:assessment.inputEvidence});
      out.programLines.push(text);
    }
    const beforeBeats=script.settle?.(ctx);
    if (beforeBeats?.ending) {
      out.kind='completed';out.ending={...beforeBeats.ending,injury:injuryLevel(state.exposure)};
      out.endLines.push(beforeBeats.text);
      return done();
    }
    if (beforeBeats?.hold) {
      out.beatLines.push(beforeBeats.text);
      out.kind=out.fresh.length?'transition':'safe';
      return done();
    }
    runBeats(ctx);
    const afterBeats=script.finish?.(ctx);
    if (afterBeats) {
      out.kind='completed';out.ending={type:afterBeats.type,injury:injuryLevel(state.exposure),reason:afterBeats.reason};
      out.endLines.push(afterBeats.text);
    } else if (out.kind!=='risk') out.kind=out.fresh.length?'transition':'safe';
    return done();
  }
  function injuryLevel(exposure) {
    const total=script.injury.score?script.injury.score(exposure):Object.values(exposure).reduce((a,b)=>a+b,0);
    const [none,mild,moderate]=script.injury.thresholds;
    return total<=none?'NONE':total<=mild?'MILD':total<=moderate?'MODERATE':'SEVERE';
  }
  function narrationIssue(out,reaction) {
    if (!reaction) return 'EMPTY_REACTION';
    if (out.kind==='failed') return 'PROGRAM_ONLY';
    if (out.consequences.length || out.kind==='question') return 'PROGRAM_ONLY';
    if (FORBIDDEN.test(reaction)) return 'FORBIDDEN_WORDING';
    if ([...reaction].length>90) return 'REACTION_TOO_LONG';
    return script.checkReaction && !script.checkReaction(reaction,out.state.facts,out)
      ? 'SCENARIO_FACT_OR_EVIDENCE' : null;
  }
  function compose(out,reaction) {
    const ok=!narrationIssue(out,reaction);
    const head=ok?[reaction]:out.kind==='question'?[]:out.ackLines.length?out.ackLines:
      !out.programLines.length && !out.beatLines.length && !out.endLines.length?[script.idle(out.state)]:[];
    return [...head,...out.programLines.filter(()=>!(ok && out.kind==='question')),...out.beatLines,...out.endLines].join('');
  }
  const modelInput=(state,text,history)=>({
    ...(script.modelInput ? script.modelInput(state,text,history) : {text,history:history.slice(-6),facts:state.facts,
      alreadyDone:Object.keys(state.met),principles:ids.map(id=>[id,principles[id].label]),
      hazards:Object.keys(hazards).filter(id=>active(hazards[id],state.facts,text)).map(id=>[id,hazards[id].label])}),
    phoneChannels:Object.entries(phone.channels).map(([number,channel])=>({number,purpose:channel.purpose,
      active:Boolean(channel.effect && (!channel.when || channel.when(context(state))))})),
  });
  function narrationInput(before,out,text,history) {
    return {player:text,history:history.slice(-4),question:out.kind==='question'?text:'',
      accepted:[...new Set(out.accepted)].map(id=>principles[id].label),notHappened:out.notDone,
      facts:script.narrationFacts(out.state),
      ...(script.narrationEvidence?{acceptedEvidence:out.acceptedEvidence || []}:{})};
  }
  const question=state=>script.questions.find(rule=>!rule.when || rule.when(context(state))).text;
  const hints=state=>script.questions.find(rule=>!rule.when || rule.when(context(state))).hints;
  const limitText=(value,max)=>[...value].slice(0,max).join('');
  const quote=(text,max)=>text && text!=='[redacted]' ?
    '「'+limitText(text,max)+([...text].length>max?'…':'')+'」' : '';
  function review(state,info) {
    const good=Object.entries(principles).filter(([id,p])=>!p.bonus && state.met[id] && state.evidence?.[id] && p.why)
      .sort((a,b)=>(b[1].priority || 0)-(a[1].priority || 0));
    const missing=Object.entries(principles).filter(([id,p])=>!p.bonus && !state.met[id] && state.opportunities?.[id] && p.tip)
      .sort((a,b)=>(b[1].priority || 0)-(a[1].priority || 0)).slice(0,2);
    const selected=[];
    const positive=[];
    for (const [id,p] of good) {
      if (selected.includes(state.evidence[id])) continue;
      selected.push(state.evidence[id]);
      positive.push(quote(state.evidence[id],Math.min(36,60-[...p.why].length))+' '+p.why);
      if (positive.length===3) break;
    }
    const impacts=state.consequences || [];
    const lessons=[{title:'結果',why:limitText(info.reason || script.ending.summary(state,info),40),next:'',sources:[]}];
    if (positive.length) lessons.push({title:'你做對的關鍵決定',why:positive.join('\n'),next:'',sources:[]});
    if (missing.length) lessons.push({title:'下次可以補上的',why:missing.map(([,p])=>limitText(p.tip,75)).join('\n'),next:'',sources:[]});
    if (impacts.length) lessons.push({title:'這次的危險選擇與後果',
      why:impacts.map(item=>[quote(item.evidence,36),item.text, hazards[item.id]?.teach].filter(Boolean).join(' ')).join('\n'),
      next:'',sources:[]});
    const turning=impacts.findLast(item=>hazards[item.id]?.kind==='fatal') || impacts.find(item=>item.source);
    if (turning) lessons.push({title:'關鍵轉折',
      why:[quote(turning.evidence,36),turning.text,...impacts.filter(item=>item.t>turning.t).slice(-2).map(item=>item.text)].filter(Boolean).join(' '),
      next:hazards[turning.id]?.teach || script.consequences?.find(item=>item.id===turning.id)?.tip || missing[0]?.[1].tip || '',
      sources:[]});
    else if (good.length) {
      const [id,principle]=good[0];
      lessons.push({title:'關鍵轉折',why:quote(state.evidence[id],36)+' '+principle.why,next:principle.tip,sources:[]});
    }
    const references=new Set([...impacts.map(item=>item.source),...missing.map(([,p])=>p.source),
      ...good.filter(([id])=>selected.includes(state.evidence[id])).map(([,p])=>p.source)]);
    const sources=script.sources.filter(source=>references.has(source.id))
      .sort((a,b)=>Number(b.id===turning?.source)-Number(a.id===turning?.source)).slice(0,3);
    if (!sources.length) sources.push(script.sources[0]);
    lessons.push({title:'官方依據',why:'',next:'',sources});
    lessons.push({title:'帶走一個思考題',why:limitText(script.reflectionPrompt,50),next:'',sources:[]});
    return lessons;
  }
  function ending(state,info,reply) {
    const injury=script.ending.injuries[info.injury];
    return {type:script.ending.label?.(state,info) || script.ending.types[info.type],injury,
      text:info.type==='CRITICAL_FAILURE'?reply:reply+(script.ending.text[info.type]?.[info.injury] || ''),
      decisions:ids.filter(id=>state.met[id] && !principles[id].bonus).slice(0,3).map(id=>principles[id].label),
      causes:script.ending.causes(state),lessons:review(state,info)};
  }
  function replay(decisions) {
    let state=start();
    for (const record of decisions) {
      if (record.director) state=apply(state,record.director,{question:record.director.isQuestion}).state;
    }
    return state;
  }
  const npcState=state=>script.npcState(state.facts);
  return {start,schema,instruction:instructions.direct,instructions,narrationSchema,confirmSchema,sources:script.sources,
    narrationInput,compose,narrationIssue,resolveDanger,modelInput,validate,ruleAssessment,apply,question,hints,look:script.look,
    review,ending,replay,injuryLevel,literalDanger,npcState,status:script.status,
    PRINCIPLES:principles,HAZARDS:hazards,TYPE:script.ending.types,INJURY:script.ending.injuries};
}
function researchMetrics(firstChoices,attempt,fatalCount,endingType,injury,totalFatalCount=fatalCount) {
  const choices=Object.values(firstChoices);
  return {attempt,first_decisions:firstChoices,first_decision_safe_rate:choices.length?choices.filter(Boolean).length/choices.length:null,
    fatal_error_count:fatalCount,total_fatal_error_count:totalFatalCount,retry_completed:attempt>1 && endingType?endingType!=='CRITICAL_FAILURE':null,
    retry_outcome:attempt>1 && endingType?{type:endingType,injury}:null};
}
module.exports={createDirector,researchMetrics};
