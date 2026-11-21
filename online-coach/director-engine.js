'use strict';
const QUESTION = /[?？]\s*$|(?:嗎|呢|怎麼辦)[。！!\s]*$|^(?:為什麼|可不可以|能不能|要不要|可否|什麼時候)/;
const HYPOTHETICAL = /^(?:我)?(?:只是)?(?:想像|假設|假如|如果|萬一)/;
function protectedSpan(text, at, actor) {
  // Words right before the matched danger that turn it into a refusal, a warning to someone else, another person's act,
  // or something that almost happened but did not.
  const before = text.slice(Math.max(0, at - 12), at);
  const clause = before.split(/[，。！？；,!?;]/).at(-1);
  return /(?:不|別|沒有|拒絕|不要|不會|不能|不可以|千萬別|禁止|不行)(?:要|會|去|能|可以)?(?:先|再|直接)?$/.test(before) ||
    actor.test(before) ||
    /阻止|不讓|別讓|不准|叫.{0,5}(?:不要|別)|請.{0,5}(?:不要|別)|勸.{0,5}(?:不要|別)|差點|差一點|本來想|剛才想|剛剛想|還好沒/.test(clause);
}
function hypotheticalSpan(text, at) {
  const clause = text.slice(0, at).split(/[。！？；!?;]/).at(-1);
  return /(?:如果|假如|萬一|想像|假設|要是)/.test(clause) || QUESTION.test(text.slice(at).split(/[。！；!;]/)[0]);
}
function warning(text, at, length) {
  return /^.{0,4}(?:很|太|會|有|超|非常)?(?:危險|會死|不安全)|^.{0,3}(?:絕對)?(?:不行|不可以|不能|不要)/.test(text.slice(at + length));
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

function resolveDanger(assessment, executing) {
  if (!assessment.pendingDanger) return assessment;
  return {...assessment, danger:executing ? assessment.pendingDanger : null, pendingDanger:null, confirmed:Boolean(executing)};
}

const clone = value => JSON.parse(JSON.stringify(value));
const FORBIDDEN = /演練|模擬|系統|關鍵原則|正確答案/;
/**
 * Scenario contract: ordered principles/operations run before the clock. A beat can be
 * conditional, repeating, and have a prevented variant. Consequences only modify state
 * through update(); scripts may compute predicates, projections and ending decisions.
 */
function createDirector(script) {
  const {principles,hazards}=script;
  const ids=Object.keys(principles);
  const phone=script.phone;
  const schema={type:'object',additionalProperties:false,
    required:['matches','dialed','dialEvidence','danger','dangerEvidence','dangerIntent','isQuestion','isObservation'],
    properties:{
      matches:{type:'array',items:{type:'object',additionalProperties:false,required:['id','evidence'],
        properties:{id:{type:'string',enum:ids},evidence:{type:'string'}}}},
      dialed:{type:'string',enum:['',...new Set([...phone.correct,...Object.keys(phone.wrong)]),'other']},dialEvidence:{type:'string'},
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
  const context=state=>({state,facts:state.facts,clock:state.clock,seen:id=>state.beats.find(beat=>beat.id===id)});
  const active=(hazard,facts,text)=>!hazard.when || hazard.when(facts,text);
  function protectedOccurrence(text,at,length,id) {
    return protectedSpan(text,at,script.actor || /(?:有人|別人|她|他|同學)(?:正在|在|要|想)?$/) ||
      warning(text,at,length) || Boolean(script.protect?.(text,at,length,id));
  }
  function literalDanger(text,facts=start().facts) {
    let soft=null;
    for (const [id,hazard] of Object.entries(hazards)) {
      if (!active(hazard,facts,text)) continue;
      for (const match of text.matchAll(new RegExp(hazard.pattern.source,hazard.pattern.flags.replace(/g/g,'')+'g'))) {
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
    dialed=phone.normalize ? phone.normalize(text,dialed,matches) : dialed ||
      (matches.some(item=>item.id===phone.principle)?phone.correct[0]:'');
    if (dialed && selfNegated(text,proposal?.dialEvidence || '')) dialed='';
    const rule=literalDanger(text,state.facts);
    const intent=proposal?.dangerIntent || 'none';
    let danger=null,pendingDanger=null;
    const proposed=hazards[proposal?.danger];
    if (rule) {
      if (proposal?.danger===rule.id && intent==='execute' && !(script.confirmSoft && rule.soft)) danger=rule;
      else pendingDanger=rule;
    } else if (proposal?.danger && proposed && intent==='execute' && exact(proposal.dangerEvidence)) {
      const evidence=proposal.dangerEvidence;
      const offsets=[];
      for (let index=text.indexOf(evidence);index!==-1;index=text.indexOf(evidence,index+1)) offsets.push(index);
      const at=script.allModelOccurrences?offsets.find(index=>!protectedOccurrence(text,index,evidence.length,proposal.danger)):offsets[0];
      if (at!==undefined && !protectedOccurrence(text,at,evidence.length,proposal.danger) &&
          (proposed.modelWhen ? proposed.modelWhen(state.facts,text) : active(proposed,state.facts,text))) {
        const found={id:proposal.danger,evidence};
        if (hypotheticalSpan(text,at)) pendingDanger=found;else danger=found;
      }
    }
    const disagreement=Boolean(rule)!==Boolean(proposal?.danger && intent==='execute')
      ? {rule:rule?.id || '',model:proposal?.danger || '',intent}:null;
    return {matches,dialed,danger,pendingDanger,
      isQuestion:Boolean(proposal?.isQuestion) && !matches.length && !dialed && !danger && !pendingDanger,
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
    for (const definition of script.beats) {
      const {id,at=0,when,repeat,prevented,normal,effects,hidden}=definition;
      if (ctx.clock<at || (!repeat && ctx.seen(id)) || (when && !when(ctx))) continue;
      const variant=prevented?.when(ctx)?prevented:normal;
      update(ctx,effects);
      update(ctx,variant?.effects);
      if (hidden) continue;
      ctx.state.beats.push({id:variant?.id || id,t:ctx.clock});
      const line=typeof variant?.text==='function'?variant.text(ctx):variant?.text;
      if (line) ctx.out.beatLines.push(line);
    }
  }
  function apply(before,assessment,{question=false}={}) {
    const state=clone(before);
    const out={state,kind:'safe',accepted:[],fresh:[],notDone:[],ackLines:[],programLines:[],beatLines:[],endLines:[],events:[],ending:null,rewind:false};
    const done=()=>{out.message=compose(out,'');return out;};
    const hazard=hazards[assessment.danger?.id];
    const said=new Set(assessment.matches.map(match=>match.id));
    const ctx={...context(state),assessment,out,said,flags:{}};
    const credit=id=>{
      out.accepted.push(id);
      if (!state.met[id]) {state.met[id]=state.clock+1;out.fresh.push(id);}
    };
    if (assessment.isQuestion || question && (!hazard || script.questionOverridesDanger)) {
      out.kind='question';
      out.programLines.push(script.answer(ctx));
      return done();
    }
    if (hazard?.kind==='fatal') {
      const id=assessment.danger.id;
      state.hazards=[...(state.hazards || []),id];
      out.events.push({kind:'hazard',action:id});
      out.programLines.push(hazard.text,'（真的這樣做，可能造成嚴重傷害。'+hazard.teach+'）');
      state.rewinds=(state.rewinds || 0)+1;
      if (state.rewinds>(script.rewindLimit ?? 3)) {
        out.kind='failed';out.ending={type:'CRITICAL_FAILURE',injury:'NOT_ASSESSED',hazard:id};
      } else {
        out.kind='rewind';out.rewind=true;
        out.programLines.push('我深吸一口氣，回到剛才那一刻，重新想想要怎麼做。');
      }
      return done();
    }
    if (hazard) {
      update(ctx,hazard.effect);
      out.events.push({kind:'hazard',action:assessment.danger.id});
      out.kind='risk';
    }
    for (const operation of script.operations) {
      if (operation==='@phone') {
        if (phone.correct.includes(assessment.dialed)) {
          update(ctx,phone.effect);
          if (phone.principle) credit(phone.principle);
        } else if (assessment.dialed) {
          const wrong=phone.wrong[assessment.dialed];
          if (wrong) {state.wrongNumber+=1;update(ctx,wrong);}
          else update(ctx,phone.other);
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
      out.kind='completed';out.ending={type:afterBeats.type,injury:injuryLevel(state.exposure)};
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
    if (out.rewind || out.kind==='failed') return 'PROGRAM_ONLY';
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
  const modelInput=(state,text,history)=>script.modelInput ?
    script.modelInput(state,text,history) : {text,history:history.slice(-6),facts:state.facts,
      alreadyDone:Object.keys(state.met),principles:ids.map(id=>[id,principles[id].label]),
      hazards:Object.keys(hazards).filter(id=>active(hazards[id],state.facts,text)).map(id=>[id,hazards[id].label])};
  function narrationInput(before,out,text,history) {
    return {player:text,history:history.slice(-4),question:out.kind==='question'?text:'',
      accepted:[...new Set(out.accepted)].map(id=>principles[id].label),notHappened:out.notDone,
      facts:script.narrationFacts(out.state),
      ...(script.narrationEvidence?{acceptedEvidence:out.acceptedEvidence || []}:{})};
  }
  const question=state=>script.questions.find(rule=>!rule.when || rule.when(context(state))).text;
  const hints=state=>script.questions.find(rule=>!rule.when || rule.when(context(state))).hints;
  const review=state=>script.review(state);
  function ending(state,info,reply,sources) {
    return {type:script.ending.types[info.type],injury:script.ending.injuries[info.injury],
      text:info.type==='CRITICAL_FAILURE'?reply:reply+(script.ending.text[info.type]?.[info.injury] || ''),
      decisions:ids.filter(id=>state.met[id] && !principles[id].bonus).slice(0,3).map(id=>principles[id].label),
      causes:script.ending.causes(state),lessons:script.ending.lessons(state,sources)};
  }
  function replay(decisions) {
    let state=start();
    for (const record of decisions) {
      if (record.director) state=apply(state,record.director,{question:record.director.isQuestion}).state;
    }
    return state;
  }
  const npcState=state=>script.npcState(state.facts);
  return {start,schema,instruction:instructions.direct,instructions,narrationSchema,confirmSchema,
    narrationInput,compose,narrationIssue,resolveDanger,modelInput,validate,ruleAssessment,apply,question,hints,look:script.look,
    review,ending,replay,injuryLevel,literalDanger,npcState,status:script.status,
    PRINCIPLES:principles,HAZARDS:hazards,TYPE:script.ending.types,INJURY:script.ending.injuries};
}
function researchMetrics(firstDecisionSafe,state,director,endingType) {
  const fatal=(state.hazards || []).filter(id=>director.HAZARDS[id]?.kind==='fatal');
  const rewinds=endingType==='CRITICAL_FAILURE'?fatal.slice(0,-1):fatal;
  return {first_decision_safe:firstDecisionSafe,had_rewind:rewinds.length>0,rewind_count:rewinds.length,rewind_hazards:rewinds,
    completed_after_rewind:rewinds.length && endingType?endingType!=='CRITICAL_FAILURE':null};
}
function reviewMetrics(metrics,director) {
  if (!metrics || metrics.first_decision_safe===null) return '';
  const corrected=metrics.completed_after_rewind;
  return '\n首次決策：'+(metrics.first_decision_safe?'安全':'觸發回到當下')+
    '\n回到當下次數：'+metrics.rewind_count+
    (metrics.had_rewind?'（'+metrics.rewind_hazards.map(id=>director.HAZARDS[id].label).join('、')+'）':'')+
    '\n修正後完成撤離或獲救：'+(corrected===null?'—':corrected?'是':'否');
}
module.exports={createDirector,researchMetrics,reviewMetrics};
