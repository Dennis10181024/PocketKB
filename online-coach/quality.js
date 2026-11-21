'use strict';
const V3=require('../web-pwa/scenario-engine-v3');
const settings=require('./quality-scenarios.json');
const categories=['good','acceptable','suboptimal','dangerous','irrelevant'];
const names={good:'良好',acceptable:'可接受',suboptimal:'次佳',dangerous:'危險',irrelevant:'無關或離題',repeat:'重複（不評分）'};
// First-person acknowledgements: what the player just did, in scene terms (no system wording).
const ack={
  barrier:'我把房門推緊，門鎖喀一聲扣上，走廊的煙被擋在外面。',
  avoid_smoke:'我退回房間裡側，離門口遠一點。',
  stop_roommate:'小岑的手停在門把前，慢慢收了回去。',
  share_work:'我和小岑說好，一個人顧門、一個人聯絡救援。',
  dial:'電話接通了，接線員的聲音傳了過來。',
  reassure:'小岑握著我的袖子，呼吸慢慢穩下來。',
  ground:'小岑點點頭，眼神從門口移回我身上。',
  seal_gap:'我把濕毛巾壓進門縫，用腳把它踩實。',
  avoid_more_smoke:'我移到窗邊，空氣比門口乾淨一些。',
  cloth_limit:'濕毛巾貼著口鼻，我知道它擋不住有毒的煙。',
  check_window:'我隔著玻璃往外看，窗外沒有飄煙。',
  signal:'我在窗邊揮著衣服大喊，樓下有人抬頭指向這裡。',
  wait_inside:'我留在房裡，照電話裡的指示等待。',
  keep_contact:'我把手機貼在耳邊，跟接線員保持通話。',
  save_power:'我把用不到的程式全關了，螢幕調暗。',
  handoff:'我朝門外大聲回應：「503有人！」',
  cover:'我鑽進課桌底下，手臂護住頭頸。',
  hold:'我抓緊桌腳，跟著桌子一起晃。',
  stop_classmate:'小維停下腳步，蹲回桌子旁邊。',
  teacher_help:'我朝老師喊，請他來看小維。',
  remain_covered:'我繼續躲在桌下，等搖晃真的停下來。',
  listen_teacher:'我盯著講台，等老師的指示。',
  cover_again:'我立刻縮回桌下，再把頭護住。',
  stay_stable:'我抓住桌腳，身體壓低不動。',
  assess:'我蹲到同學旁邊，問他哪裡痛、還能不能動。',
  tell_teacher:'我舉手大聲告訴老師有人受傷。',
  no_move:'我沒有硬拉他起來，讓他先坐著。',
  safe_route:'我跟著老師走指定的樓梯，避開掉滿碎片的那一側。',
  spacing:'我扶著扶手，跟前面的同學保持距離慢慢走。',
  roster:'老師點到我們這排，我回報人都到了。',
  where:'我告訴老師我們班集合的位置。',
  injuries:'我也說了受傷同學的狀況。',
  stay_group:'我留在集合區，等老師的通知。',
  stop_return:'我拉住小維：「等老師說可以再回去。」',
};
// Scene-specific wording so one scenario's NPC never appears in another.
const ackByScenario={earthquake_school:{reassure:'小維吸了一口氣，肩膀放鬆了一些。',ground:'小維點點頭，蹲在桌邊等著。'}};
const ackFor=(spec,id)=>ackByScenario[spec.id]?.[id] || ack[id];
const fieldAck={address:'我把宿舍地址和棟別告訴接線員。',room:'我報出樓層和房號。',headcount:'我告訴接線員房裡有兩個人。',condition:'我說明走廊都是煙、我們困在房裡。'};
// Still-true facts used when the player repeats something already done.
const still={barrier:'房門還緊緊關著。',seal_gap:'門縫的毛巾還貼著，焦味淡了一些。',stop_roommate:'小岑一直離門把遠遠的。',
  dial:'電話還接通著。',signal:'樓下的人已經看到我們這扇窗。',wait_inside:'我們一直待在房裡。',keep_contact:'接線員還在線上。',
  cover:'我還躲在桌子底下。',stop_classmate:'小維還蹲在桌邊。',stay_group:'我們都還在集合區。'};
// Escalation scenes still happen when the player prepared early; preparation makes them milder.
const mitigated={smoke_gap:'門底又飄進一絲焦味，還好毛巾塞得夠緊，煙只滲進一點點。',
  battery:'手機跳出低電量提示，還好通話一直沒斷，接線員還在。'};
const escalation=new Set(['smoke_gap','battery','aftershock']);
const fieldNames={address:'地址與棟別',room:'樓層和房號',headcount:'受困人數',condition:'現場狀況'};
const points=spec=>settings[spec.id] || [];
const point=(spec,state)=>points(spec).find(item=>item.node===state.node);
const start=state=>({...state,quality:{met:{},report:{},asked:false,history:[]}});
const clone=state=>JSON.parse(JSON.stringify(state));
const textSchema={type:'string'};
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const entry=id=>object({id:{type:'string',enum:id},evidence:textSchema});
const allPrinciples=spec=>[...new Set(points(spec).flatMap(item=>item.principles.map(p=>p.id)))];
const realTurn=(state,assessment)=>({node:state.node,category:assessment.category,principles:assessment.matches.map(item=>item.id)});
const schema=spec=>object({category:{type:'string',enum:categories}, evidence:textSchema,
  matches:{type:'array',items:entry(allPrinciples(spec))},
  fields:{type:'array',items:entry(Object.keys(fieldNames))},
  hazard:{type:'string',enum:['',...spec.actions.map(action=>action.id)]},hazardEvidence:textSchema});
function directQuestion(text) {
  return /[?？]\s*$|(?:嗎|呢|怎麼辦)[。！!\s]*$|^(?:為什麼|可不可以|能不能|要不要|可否|什麼時候)/.test(text);
}
function ruleState(state) {
  if (state.node!=='report' || !state.quality.met.dial) return state;
  const fieldMap={address:'address',room:'room',headcount:'headcount',condition:'smoke_report'};
  return {...state,accepted:['call',...Object.keys(state.quality.report).map(id=>fieldMap[id])]};
}

function scenarioSpec(spec) {
  if (spec.id!=='earthquake_school') return spec;
  const risk={message:'搖晃還沒有停，我若急著離開掩護，可能被落物撞到或跌倒。'};
  return {...spec,
    actions:spec.actions.map(action=>action.id==='run_outside' ? {...action,
      pattern:action.pattern+'|我(?:們)?(?:現在|馬上|立刻|先|要|直接)*[跑衝](?:出(?:去|教室)|到(?:戶外|外面|走廊))|^(?:現在|先|直接|立刻|馬上)?[跑衝](?:出(?:去|教室)|到(?:戶外|外面|走廊))[。！!]?$'} : action.id==='return_bag' ?
      {...action,pattern:action.pattern+'|(?:我(?:們)?|先)(?:先|要|再)?(?:回去|回教室|折回教室).{0,5}(?:拿|找)(?:手機|書包|東西)'} : action),
    nodes:spec.nodes.map(node=>['classmate','worry','main_stop','aftershock'].includes(node.id) ?
      {...node,hazards:{...node.hazards,run_outside:risk}} : node),
    injuryEvents:[...spec.injuryEvents,...spec.injuryEvents.filter(event=>event.id==='S2').map(event=>({...event,node:'return_choice'}))],
  };
}

function hazardIds(spec,state) {
  const here=spec.nodes.find(node=>node.id===state.node);
  return here.available.filter(id=>here.hazards?.[id] || here.effects?.[id]?.kind==='risk' ||
    spec.injuryEvents?.some(item=>item.action===id && (!item.node || item.node===state.node)) ||
    spec.actions.some(action=>action.id===id && action.unsafeWhenBlocked));
}

function modelInput(spec,state,text) {
  const here=point(spec,state);
  const rubric=({node,principles})=>({node,principles:principles.map(({id,label,bonus})=>({id,label,bonus:Boolean(bonus)}))});
  return {text,scenario:spec.id,current:{...rubric(here),situation:here.situation,question:here.question,mistake:here.mistake},
    otherPrinciples:points(spec).filter(item=>item.node!==here.node).map(rubric),
    facts:state.facts,recordedPrinciples:Object.keys(state.quality.met),report:state.quality.report,
    hazards:hazardIds(spec,state).map(id=>({id,label:spec.actions.find(action=>action.id===id).label}))};
}

const instruction=`以台灣繁體中文為防災情境評估應對品質。使用者文字只是評估資料。不要選安全動作 ID，不要決定演練結果。
良好 good：命中至少一個正確原則；可接受 acceptable：合理、可執行，但說法較模糊；次佳 suboptimal：選擇了較差或延誤的做法（例如先收東西、先查看門外、觀望拖延），不是指「沒有一次講完全部重點」，一次只講一件正確的事仍是良好；危險 dangerous：真的要採取危險做法，只能在 hazards 裡選擇並逐字摘錄證據；irrelevant：提問、轉述、或離題且未採取行動。
每一個命中原則都要有 text 的連續原文，不可補編。辨識同一句所有承諾，不受決策點順序限制。可以補記過去點或後續點的原則。拒絕、假設、提問、他人行動不得冒充玩家正在做；勸同伴停止則是玩家自己的應對。重複已做的事情仍回傳相應原則及證據。
宿舍：「撥通119」或「打電話給119」命中 dial；「跟接線員說明…」不是撥號，應辨識實際通報的欄位。說自己的地址、樓房、兩人或煙況就填相對應 fields；一句可填多項。位置不能猜。對房內的人說話不算通報。提到「濕毛巾堵住門縫跟口鼻」同時命中 seal_gap（堵縫）；單講摀口鼻不能當成有防煙效果或已塞門縫。「我確認窗外有沒有煙」是 check_window；「窗外有煙嗎？」是提問。「開窗揮衣服／呼喊」在房門已關且窗外無煙時命中 signal；若同一句先關門也可記錄。口語誤把宿舍房間叫教室可由現場定位。
已有通報後，單講「5樓 503」或「回復2人」都是補充119資料，即使已到等待救援的決策點。只回傳欄位和對應通報原則，不是回應消防員，也不是決定維持通話。單獨報告濃煙情況同樣不是安全接手。
「等消防員來，配合他們的指示」在有人呼喊房號以前是 wait_inside，聽到消防員明確指示後仍可用「依照指示留在房間」「待在原地聽指示」作為當前可接受應對。「跟接線員保持聯絡」命中 keep_contact。單純重說打119不算回應消防員。情緒：『我知道你擔心，我會陪你』命中 reassure；『先顧安全、之後一起想辦法』命中 ground，不用說NPC名字。
在任何階段，「跟她說絕對不行開門」或「跟他說不能開門」是在勸同伴，仍命中 stop_roommate，留給系統確認是否早已完成。煙況轉述「跟房內的人說外面都是煙」本身不是回應情緒。對同伴說「知道你很擔心，但現在出去太危險，我們先待在房間」則命中 reassure 和 ground，即使現在在撥號或通報。
學校：鑽桌下護頭是 cover，抓穩桌腳是 hold；勸小維別跑是 stop_classmate；等晃完是 remain_covered；餘震時繼續躲是 cover_again。『先看他傷到哪』命中 assess；『跟老師說』命中 tell_teacher。只回報確知的傷況。『到操場後跟老師說我們這排人都到了』是 where 和 roster；『有一個同學手受傷』是 injuries，不代表已確診。『等老師說可以再回去』或『我在集合點等通知』是 stay_group／stop_return。
如果回應包含兩個都合理的目標，列出兩者。命中目標不等於已完成，前置條件由引擎核對。回傳空的 hazard／hazardEvidence 表示沒有危險動作。`;

function validate(spec,state,text,proposal,literal) {
  if (!categories.includes(proposal?.category) || !Array.isArray(proposal.matches) || !Array.isArray(proposal.fields))
    throw new Error('Invalid quality assessment');
  const exact=value=>typeof value==='string' && value.trim().length>=2 && text.includes(value);
  const ownedEvidence=({id,evidence})=>{
    const at=text.indexOf(evidence);
    const prefix=text.slice(0,at).split(/[。！？；！\n，,]|(?:然後|接著|並)/).at(-1).trim();
    if (id==='handoff') return state.node==='wait' &&
      /回應|回一聲|回答|告訴(?:(?:門外|消防|他們))|配合|聽.*指示|照.*(?:話|指示|做)|喊.*(?:這裡|有人)/.test(evidence);
    if (id==='keep_contact') return /保持|繼續|維持|延長|保留|不(?:要|會)?掛|別掛|不結束|不關|留給/.test(evidence);
    if (id==='wait_inside') return /留|待|等|原地|不出去|不移動/.test(evidence);
    if (['reassure','ground'].includes(id)) return /擔心|掛念|惦記|怕|陪|聽.*說|先顧|一起|安全|交給|冷靜|放心|聯絡|我在|先.*待/.test(evidence);
    if (['stop_roommate','stop_classmate','stop_return','no_move','avoid_smoke'].includes(id)) return true;
    return !/(?:不會|沒有要|不想|不打算|不是要|拒絕|不要|別|不)(?:先|再|去)?$/.test(prefix) &&
      !/^(?:不打|不關|不塞|不護|不要打|不要關|不會打|不會關)/.test(evidence);
  };
  const cleaned=(items,ids)=>Array.from(new Map(items.filter(item=>ids.includes(item?.id)&&exact(item.evidence)&&ownedEvidence(item))
    .map(({id,evidence})=>[id,{id,evidence}])).values());
  const matches=cleaned(proposal.matches,allPrinciples(spec));
  const fields=cleaned(proposal.fields,Object.keys(fieldNames)).filter(item=>item.id!=='room' ||
    !/[0-9]/.test(item.evidence) || /503/.test(item.evidence));
  const protectedText=directQuestion(text) || /互相衝突|尚未執行/.test(literal.message || '') ||
    /^(?:我)?(?:只是)?(?:想像|假設|假如|如果|萬一)|[?？]\s*$/.test(text);
  const proposedHazard=proposal.category==='dangerous' && hazardIds(spec,state).includes(proposal.hazard) && exact(proposal.hazardEvidence)
    ? V3.validateProposal(spec,state,text,'action',[{id:proposal.hazard,evidence:proposal.hazardEvidence}],literal).result : null;
  const ruleDanger=['failed','risk'].includes(literal.kind);
  const hazard=ruleDanger ? literal : proposedHazard;
  const disagreement=ruleDanger !== (proposal.category==='dangerous') ?
    {rule:ruleDanger?'dangerous':literal.kind,model:proposal.category,ruleIds:V3.adoptedActionIds(state,literal.state)} : null;
  const hazardId=hazard && V3.adoptedActionIds(state,hazard.state).at(-1);
  if (hazard && hazardId) return {category:'dangerous',matches:[],fields:[],hazardId,disagreement,
    evidence:exact(proposal.hazardEvidence)?proposal.hazardEvidence:text,source:ruleDanger?'rule':'model'};
  if (protectedText || proposal.category==='dangerous') return {category:'irrelevant',matches:[],fields:[],disagreement,source:'model'};
  if (state.node==='report' && state.quality.asked && !matches.length && !fields.length &&
      /不(?:知道|清楚|確定)|記不起|想不起/.test(text))
    return {category:'suboptimal',matches,fields,evidence:text,disagreement,source:'model'};
  const category=matches.length || fields.length ? (proposal.category==='good'?'good':'acceptable') :
    proposal.category==='suboptimal' && exact(proposal.evidence)?'suboptimal':'irrelevant';
  return {category,matches,fields,evidence:exact(proposal.evidence)?proposal.evidence:'',disagreement,source:'model'};
}

function ruleAssessment(spec,state,text,literal) {
  const ids=V3.adoptedActionIds(state,literal.state);
  if (literal.state.npc?.handled!==state.npc?.handled) ids.push('npc_dissuade');
  if (literal.state.npc?.emotion!==state.npc?.emotion) ids.push('emotion_'+literal.state.npc.emotion);
  const matches=point(spec,state).principles.filter(p=>p.actions.some(id=>ids.includes(id))).map(p=>({id:p.id,evidence:text}));
  const fields=Object.entries({address:'address',room:'room',headcount:'headcount',condition:'smoke_report'})
    .filter(([,id])=>ids.includes(id)).map(([id])=>({id,evidence:text}));
  const assessed=validate(spec,state,text,{category:matches.length || fields.length?'acceptable':'irrelevant',matches,fields,evidence:text},literal);
  return {...assessed,source:'rule',disagreement:null};
}

function learn(spec,state,assessment) {
  const progress=state.quality;
  const know=(id)=>progress.met[id] || assessment.matches.some(item=>item.id===id);
  const fresh=[];
  for (const {id} of assessment.matches) {
    if (progress.met[id] || id==='signal' && (!know('barrier') || !state.facts.windowOutsideClear) ||
      id==='seal_gap' && !know('barrier') || id==='handoff' && state.node!=='wait') continue;
    progress.met[id]=state.node;
    fresh.push(id);
    if (id==='barrier') state.facts.doorClosed=true;
    if (['stop_roommate','stop_classmate','teacher_help'].includes(id) && !state.npc.handled) {
      state.npc={...state.npc,handled:true,proposal:null};
      state.events.push({node:state.node,kind:'npc_handled'});
      state.events.push({node:state.node,kind:'npc_emotion_prompt',message:spec.npc.online.emotion});
    }
    if (['reassure','ground'].includes(id) && state.npc.handled && !state.npc.emotion) {
      state.npc.emotion=id==='reassure'?'supportive':'neutral';
      state.events.push({node:state.node,kind:'npc_emotion',action:'emotion_'+state.npc.emotion});
    }
  }
  if (progress.met.dial) for (const {id} of assessment.fields) {
    if (!progress.report[id]) fresh.push('report:'+id);
    progress.report[id]=true;
  }
  return fresh;
}

function apply(spec,before,assessment) {
  const record=realTurn(before,assessment);
  if (assessment.category==='dangerous') {
    const legacy=V3.rawStep(spec,before,'已確認危險行動','action',{actionIds:[assessment.hazardId],verifiedSafe:true});
    // Existing hazard guards, injury events and terminal priority stay authoritative.
    if (['failed','risk'].includes(legacy.kind)) {
      legacy.state.quality.history.push(record);
      return {...legacy,qualityEffect:'danger',completedPoints:[]};
    }
    return {state:before,kind:'clarify',message:point(spec,before).situation,qualityEffect:'blocked',completedPoints:[]};
  }

  const state=clone(before);
  const here=point(spec,state);
  const metBefore={...state.quality.met};
  const fresh=learn(spec,state,assessment);
  const q=state.quality;
  const said=new Set(assessment.matches.map(item=>item.id));
  const repeated=!fresh.length && (assessment.matches.some(item=>q.met[item.id]) || assessment.fields.some(item=>q.report[item.id]));
  // Repeating something already done is neither credit nor a mistake.
  if (repeated && ['good','acceptable','repeat'].includes(assessment.category)) record.category='repeat';
  q.history.push(record);
  const lines=[];
  const freshPrinciples=fresh.filter(id=>!id.startsWith('report:'));
  if (freshPrinciples.includes('dial')) lines.push(ackFor(spec,'dial'));
  for (const id of freshPrinciples) if (id!=='dial' && ackFor(spec,id)) lines.push(ackFor(spec,id));
  if (freshPrinciples.includes('tell_teacher') && freshPrinciples.includes('injuries')) lines.splice(lines.indexOf(ack.injuries),1);
  for (const id of fresh.filter(id=>id.startsWith('report:'))) lines.push(fieldAck[id.slice(7)]);
  if (repeated) {
    const known=assessment.matches.map(item=>item.id).find(id=>still[id] && metBefore[id]);
    if (known) lines.push(still[known]);
  }
  const shown=lines.slice(0,3);
  const completedPoints=[];
  const sourceIds=new Set();
  let prompt='',stopScene='';
  const startIndex=points(spec).indexOf(here);
  for (let index=startIndex; index>=0 && index<points(spec).length; index++) {
    const next=points(spec)[index];
    const current=index===startIndex;
    let satisfied=next.advance.some(group=>group.every(id=>q.met[id]));
    // New scene cues can require a fresh response even when an earlier safe choice used similar language.
    const handoff=next.finish==='fire' && !assessment.matches.some(item=>
      ['handoff','wait_inside','keep_contact'].includes(item.id)) && current;
    if (next.finish && (!current || handoff)) break;
    const holdsHere=escalation.has(next.node) || next.emotion;
    if (!current && holdsHere) {
      // Emotion points wait for the NPC to voice the feeling unless the player already answered it.
      const answered=next.emotion && state.npc.emotion;
      if (!answered) {
        stopScene=escalation.has(next.node) && satisfied && mitigated[next.node] || next.situation;
        state.node=next.node; state.accepted=[]; state.nodeTurn=0;
        if (escalation.has(next.node)) state.events.push({node:next.node,kind:'environment_change',message:stopScene});
        if (next.node==='battery') state.resources.battery=Math.max(0,(state.resources.battery || 0)-86);
        break;
      }
    }
    if (current && holdsHere) {
      // An escalation the player had already prepared for moves on with any relevant answer (repeats included);
      // an emotion scene needs the player to answer the feeling in this turn.
      const wasReady=escalation.has(next.node) && next.advance.some(group=>group.every(id=>metBefore[id]));
      if (wasReady) satisfied=said.size>0;
      else if (next.emotion) satisfied=satisfied && next.principles.some(p=>said.has(p.id));
      if (next.emotion && satisfied && !state.npc.emotion) state.npc.emotion=said.has('reassure')?'supportive':'neutral';
    }
    const imperfect=current && assessment.category==='suboptimal' &&
      (next.emotion || ['roommate','classmate','assembly'].includes(next.node));
    const optional=!holdsHere && next.optionalWith?.some(id=>q.met[id]);
    if (!satisfied && !optional && !imperfect) break;
    if (next.report) {
      const missing=Object.keys(fieldNames).filter(id=>!q.report[id]);
      if (!q.asked && missing.length) {
        q.asked=true;
        prompt='接線員問：「請告訴我'+missing.map(id=>fieldNames[id]).join('、')+'。」';
        break;
      }
      if (q.asked && (!current || assessment.category==='irrelevant')) break;
    }
    if (next.onComplete==='school_routes') Object.assign(state.facts,{shaking:false,stairsChecked:true});
    if (imperfect && !satisfied && ['roommate','classmate'].includes(next.node)) {
      state.facts.npcSkipped=true;
      state.events.push({node:next.node,kind:'npc_proposal',message:spec.npc.online.reminder});
    }
    if (next.emotion && !state.npc.emotion) state.npc.emotion=q.met.reassure?'supportive':'neutral';
    const matched=next.principles.filter(p=>q.met[p.id]);
    for(const {source} of matched) sourceIds.add(source);
    if (next.report) sourceIds.add('report-content');
    if (next.node==='shaking') state.events.push({node:next.node,kind:'environment_change',message:next.situation});
    completedPoints.push({node:next.node,category:current?(record.category==='repeat'?'acceptable':assessment.category):satisfied?'acceptable':'optional',
      principles:matched.map(p=>p.id),remembered:!current && satisfied});
    if (next.finish) {
      const id=next.finish==='fire'?'handoff_fire':'stay_assembly';
      const terminal=V3.rawStep(spec,state,'已確認安全應對','action',{actionIds:[id],verifiedSafe:true});
      if (next.finish==='fire' && terminal.kind==='completed' && !said.has('handoff'))
        terminal.message='我留在房內照指示回應，電話還接得通。消防員確認了我們的位置，接著接手救援。';
      // The ending first shows what the player just did (e.g. stopping a classmate from going back).
      if (next.finish!=='fire' && terminal.kind==='completed' && shown.length)
        terminal.message=shown.join('')+'廣播響起：老師確認大家都在，教室稍後才開放。';
      return {...terminal,qualityEffect:'advanced',completedPoints,sourceIds:[...sourceIds],repeatOnly:record.category==='repeat'};
    }
    state.node=points(spec)[index+1].node;
    state.accepted=[];
    state.nodeTurn=0;
  }
  for(const p of points(spec).flatMap(p=>p.principles)) if (fresh.includes(p.id)) sourceIds.add(p.source);
  if (fresh.some(id=>id.startsWith('report:'))) sourceIds.add('report-content');
  const advanced=completedPoints.length>0 || state.node!==before.node;
  const now=point(spec,state);
  // Narration answers what the player just said, then shows what changed.
  let scene='';
  if (prompt) scene=prompt;
  else if (stopScene) scene=stopScene;
  else if (advanced) scene=now.situation;
  else if (!shown.length) scene=now.situation;
  const npcLine=state.events.slice(before.events.length).find(event=>event.kind==='npc_emotion_prompt');
  let message=[...shown,scene].filter(Boolean).join('');
  if (npcLine && !state.npc.emotion && state.node!==here.node && !now.emotion && !message.includes(npcLine.message))
    message+=' '+npcLine.message;
  return {state,kind:advanced?'transition':fresh.length || repeated?'safe':'clarify',message,sourceIds:[...sourceIds],
    qualityEffect:advanced || fresh.length?'advanced':repeated?'remembered':'stuck',completedPoints,
    remembered:completedPoints.some(item=>item.remembered),newPrinciples:fresh,repeatOnly:record.category==='repeat'};
}

function replay(spec,decisions,initial=start(V3.create(spec,{onlineExperience:true}))) {
  return decisions.reduce((state,turn)=>{
    if (state.sessionStatus!=='ACTIVE') return state;
    if (turn.assessment) return apply(spec,state,turn.assessment).state;
    if (!point(spec,state) && turn.actionIds?.length) {
      return V3.rawStep(spec,state,'已確認安全應對','action',{actionIds:turn.actionIds,verifiedSafe:true}).state;
    }
    return state;
  },initial);
}

function review(spec,state) {
  const sources=new Map(spec.sources.map(item=>[item.id,item]));
  const q=state.quality;
  return points(spec).map(item=>{
    const grades=q.history.filter(record=>record.node===item.node && record.category!=='repeat');
    const met=item.principles.filter(p=>q.met[p.id]);
    const missing=item.principles.filter(p=>!q.met[p.id]&&!p.bonus);
    const guidance=missing.map(p=>`${p.label}（${sources.get(p.source)?.title || p.source}`+
      ` ${sources.get(p.source)?.url || ''}）`);
    return `${item.question}\n評估 ${grades.length?grades.map(entry=>names[entry.category]).join('、'):
      met.length?'已提前完成':'未到達或未作答'}\n做得好 ${met.map(p=>p.label).join('、') || '—'}\n`+
      `可以再補上 ${guidance.join('；') || '—（這一步做得很完整）'}`;
  }).concat(points(spec).some(item=>item.report)?['通報缺漏 '+(Object.keys(fieldNames).filter(id=>!q.report[id])
    .map(id=>fieldNames[id]).join('、') || '無')]:[]).join('\n\n');
}

function lessons(spec,state) {
  const q=state.quality;
  const sections=points(spec).filter(item=>q.history.some(record=>record.node===item.node) ||
      item.principles.some(p=>q.met[p.id])).map(item=>{
    const grades=q.history.filter(record=>record.node===item.node && record.category!=='repeat').map(record=>names[record.category]);
    const matched=item.principles.filter(p=>q.met[p.id]);
    const missed=item.principles.filter(p=>!q.met[p.id]&&!p.bonus);
    return {title:'情境應對回顧',why:item.question+' '+(grades.length?'評估 '+grades.join('、')+'。':'原則已提前完成。')+
        (matched.length?'已掌握 '+matched.map(p=>p.label).join('、')+'。':'這回合未命中核心原則。'),
      next:missed.length?'可以再補上：'+missed.map(p=>p.label).join('、')+'。':'這一步做得很完整。',
      sources:spec.sources.filter(source=>item.principles.some(p=>p.source===source.id))};
  });
  const missing=Object.keys(fieldNames).filter(id=>!q.report[id]);
  if (q.asked && missing.length) sections.push({title:'119 通報回顧',
    why:'本次未回報 '+missing.map(id=>fieldNames[id]).join('、')+'。',
    next:'下次在知道資訊時一起回報；有疑問可等接線員引導。',
    sources:spec.sources.filter(source=>source.id==='report-content')});
  return sections;
}

module.exports={points,point,start,scenarioSpec,directQuestion,ruleState,schema,modelInput,instruction,validate,ruleAssessment,apply,replay,review,lessons,names};
