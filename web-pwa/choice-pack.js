'use strict';
(function publish(root){
  const own=(object,key)=>Object.hasOwn(object,key);
  const fail=message=>{throw new TypeError(message);};
  const scalar=value=>value===null || ['string','number','boolean'].includes(typeof value);
  const integer=value=>Number.isInteger(value) && value>=-2147483648 && value<=2147483647;
  const object=value=>value!==null && typeof value==='object' && !Array.isArray(value);
  const bannedKey=key=>['__proto__','prototype','constructor'].includes(key);

  function readJson(text){
    const token=/"(?:[^"\\\u0000-\u001f]|\\["\\/bfnrt]|\\u[0-9a-fA-F]{4})*"|[{}\[\]:,]|true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/gy;
    let pos=0, current;
    function advance(){
      while(pos<text.length && /[ \r\n\t]/.test(text[pos]))pos++;
      token.lastIndex=pos;
      current=token.exec(text)?.[0];
      if(current) pos=token.lastIndex;
      else if(pos!==text.length) fail('Invalid JSON at '+pos);
    }
    function consume(wanted){
      if(current!==wanted)fail('Invalid JSON, expected '+wanted);
      advance();
    }
    function value(depth){
      if(depth>50)fail('JSON nesting limit');
      const next=current;
      if(next==='{' || next==='['){
        const end=next==='{'?'}':']';
        const keys=new Set();
        advance();
        if(current!==end){
          for(;;){
            if(next==='{'){
              if(!current?.startsWith('"'))fail('Invalid JSON key');
              const key=JSON.parse(current);
              if(keys.has(key)||bannedKey(key))fail('Unsafe or duplicate JSON key: '+key);
              keys.add(key);
              advance();
              consume(':');
            }
            value(depth+1);
            if(current!==',')break;
            advance();
          }
        }
        consume(end);
        return;
      }
      if(next===undefined || [']','}',':',','].includes(next))fail('Invalid JSON value');
      advance();
    }
    advance();
    value(0);
    if(current!==undefined)fail('Additional JSON content');
    return JSON.parse(text);
  }

  // The trusted v1 schema uses this bounded subset of Draft 2020-12.
  function checkShape(schema,value,rule=schema,path='$'){
    if(rule.$ref){
      const resolved=schema.$defs[rule.$ref.split('/').at(-1)];
      if(!resolved)fail('Unknown schema reference: '+rule.$ref);
      return checkShape(schema,value,resolved,path);
    }
    const alternatives=rule.oneOf || rule.anyOf;
    if(alternatives){
      const count=alternatives.filter(candidate=>!checkShape(schema,value,candidate,path)).length;
      return (rule.oneOf?count===1:count>0)?null:path+' does not match schema alternatives';
    }
    if(own(rule,'const') && value!==rule.const || rule.enum && !rule.enum.includes(value))return path+' is outside enum';
    switch(rule.type){
      case 'object':
        if(!object(value) || Object.keys(value).length>(rule.maxProperties??Infinity))return path+' is not a valid object';
        for(const field of rule.required || [])if(!own(value,field))return path+'.'+field+' is required';
        for(const [key,child] of Object.entries(value)){
          if(bannedKey(key))return path+' contains a reserved key';
          if(rule.propertyNames){
            const issue=checkShape(schema,key,rule.propertyNames,path+'.'+key);
            if(issue)return issue;
          }
          const field=rule.properties && own(rule.properties,key)?rule.properties[key]:rule.additionalProperties;
          if(field===false)return path+'.'+key+' is not allowed';
          const issue=field&&checkShape(schema,child,field,path+'.'+key);
          if(issue)return issue;
        }
        break;
      case 'array':
        if(!Array.isArray(value) || value.length<(rule.minItems??0) || value.length>(rule.maxItems??Infinity))return path+' has invalid array length';
        if(rule.uniqueItems && new Set(value.map(item=>JSON.stringify(item))).size!==value.length)return path+' has duplicate values';
        for(const [i,item] of value.entries()){
          const issue=checkShape(schema,item,rule.items,path+'['+i+']');
          if(issue)return issue;
        }
        break;
      case 'integer':
        if(!integer(value)||value<(rule.minimum??-Infinity)||value>(rule.maximum??Infinity))return path+' is outside integer range';
        break;
      case 'string':
        if(typeof value!=='string'||[...value].length<(rule.minLength??0)||[...value].length>(rule.maxLength??Infinity)||
          rule.pattern&&!new RegExp(rule.pattern).test(value))return path+' has invalid text';
        if(rule.format==='uri'){
          try { const url=new URL(value); if(url.protocol!=='https:' || url.username||url.password)return path+' requires an HTTPS URL'; }
          catch{return path+' requires an HTTPS URL';}
        }
        break;
      case 'boolean': if(typeof value!=='boolean')return path+' requires a boolean';break;
      case 'null': if(value!==null)return path+' requires null';break;
    }
    return null;
  }

  function lookup(map,id,kind){
    if(!map.has(id))fail('Unknown '+kind+': '+id);
    return map.get(id);
  }
  function byId(list,kind){
    const map=new Map();
    for(const value of list){
      if(map.has(value.id))fail('Duplicate '+kind+': '+value.id);
      map.set(value.id,value);
    }
    return map;
  }
  function compare(left,op,right){
    switch(op){
      case 'eq':return left===right;
      case 'ne':return left!==right;
      case 'lt':return integer(left)&&integer(right)&&left<right;
      case 'lte':return integer(left)&&integer(right)&&left<=right;
      case 'gt':return integer(left)&&integer(right)&&left>right;
      case 'gte':return integer(left)&&integer(right)&&left>=right;
      default:return fail('Unknown comparator: '+op);
    }
  }
  function evaluate(value,context){
    if(scalar(value))return value;
    if(own(value,'ref'))return context.read(value.ref);
    if(value.op==='coalesce'){
      for(const arg of value.args){
        const candidate=evaluate(arg,context);
        if(candidate!==null)return candidate;
      }
      return null;
    }
    const args=value.args.map(item=>evaluate(item,context));
    if(!args.every(integer))fail('Arithmetic requires integers');
    let result;
    switch(value.op){
      case 'min':result=Math.min(...args);break;
      case 'max':result=Math.max(...args);break;
      case 'add':case 'sum':result=args.reduce((a,b)=>a+b,0);break;
      case 'mod':
        if(args[1]<=0)fail('Modulo requires a positive divisor');
        result=((args[0]%args[1])+args[1])%args[1];break;
      default:return fail('Unknown arithmetic operator: '+value.op);
    }
    if(!integer(result))fail('Integer overflow');
    return result;
  }
  function matches(condition,context){
    if(own(condition,'always')) return true;
    if(own(condition,'all')) return condition.all.every(child=>matches(child,context));
    if(own(condition,'any')) return condition.any.some(child=>matches(child,context));
    if(own(condition,'not')) return !matches(condition.not,context);
    if(own(condition,'has')) return context.has(condition.has.set,condition.has.id);
    if(own(condition,'compare')){
      const {left,op,right}=condition.compare;
      return compare(evaluate(left,context),op,evaluate(right,context));
    }
    const {fact,clock,...rest}=condition;
    const [[op,expected]]=Object.entries(clock || rest);
    return compare(context.read(clock?'clock':'facts.'+fact),op,expected);
  }

  function verifySemantics(pack){
    const sources=byId(pack.meta.sources,'source');
    for(const source of sources.values()){
      const url=new URL(source.url);
      if(url.protocol!=='https:'||!(/\.gov\.(?:tw|taipei)$/.test(url.hostname))||url.username||url.password||url.port)
        fail('Untrusted official source: '+source.id);
    }
    const lists={principle:byId(pack.catalog.principles,'principle'),hazard:byId(pack.catalog.hazards,'hazard'),
      channel:byId(pack.catalog.channels,'channel')};
    const beats=byId(pack.beats,'beat');
    const decisions=byId(pack.decisions,'decision');
    const endings=byId(pack.endings,'ending');
    const consequences=byId(pack.consequences,'consequence');
    byId(pack.phaseRules,'phase rule');
    byId(pack.assets,'asset');
    const variants=byId(pack.beats.flatMap(beat=>beat.prevented?[beat.prevented]:[]),'beat variant');
    for(const name of variants.keys())if(beats.has(name))fail('Beat variant collides with a beat: '+name);
    const cues=new Set(pack.decisions.flatMap(decision=>decision.options.flatMap(option=>option.cues)));
    const fields=new Map();
    for(const [key,value] of Object.entries(pack.initial.facts))fields.set('facts.'+key,value);
    for(const [id,fieldsForNpc] of Object.entries(pack.initial.npc))
      for(const [key,value] of Object.entries(fieldsForNpc))fields.set('npc.'+id+'.'+key,value);
    for(const [key,value] of Object.entries(pack.initial.exposure))fields.set('exposure.'+key,value);
    const readable=new Set(['clock','turn.nextClock','turn.channelId','turn.hazardCount','beat.lastVisibleId',
      'ending.type','ending.injury','ending.hazardId','impact.injury','impact.anyInjury',...fields.keys()]);
    for(const id of beats.keys())for(const field of ['firstTurn','lastTurn','count'])readable.add('beat.'+id+'.'+field);
    for(const id of consequences.keys())readable.add('counter.'+id);
    const sets={met:lists.principle,turnPrinciples:lists.principle,turnHazards:lists.hazard,turnCues:cues,seenBeats:beats,seenVariants:variants};
    function ref(target,area){
      if(!readable.has(target) || target.startsWith('ending.')&&area!=='ending' || target.startsWith('impact.')&&area!=='ending')
        fail('Unavailable DSL reference: '+target);
    }
    function expr(value,area,depth=0){
      if(depth>16)fail('DSL nesting limit');
      if(scalar(value))return;
      if(value.ref)return ref(value.ref,area);
      for(const child of value.args)expr(child,area,depth+1);
      if(value.op==='mod' && typeof value.args[1]==='number' && value.args[1]<=0)fail('Invalid modulus');
    }
    function condition(value,area,depth=0){
      if(depth>16)fail('DSL nesting limit');
      if(value.fact)ref('facts.'+value.fact,area);
      if(value.has&&!sets[value.has.set].has(value.has.id))fail('Unknown '+value.has.set+' member: '+value.has.id);
      if(value.compare){expr(value.compare.left,area);expr(value.compare.right,area);}
      if(value.not)condition(value.not,area,depth+1);
      for(const child of value.all||value.any||[])condition(child,area,depth+1);
    }
    function text(value){
      if(/<\s*\/?\s*[a-z!]|javascript\s*:|sk-(?:proj-)?[A-Za-z0-9_-]{20,}/i.test(value))fail('Forbidden content');
    }
    function narration(id){
      if(!own(pack.presentation.narration,id))fail('Unknown narration: '+id);
    }
    function provenance(ids){ for(const id of ids)lookup(sources,id,'source'); }
    function effect(delta,allowCredit=true){
      for(const [path,value] of Object.entries(delta.set||{})){
        if(!fields.has(path)||path.startsWith('exposure.'))fail('Cannot set '+path);
        const initial=fields.get(path);
        if(scalar(value) && (initial===null?value!==null&&!integer(value):value===null||typeof value!==typeof initial))
          fail('Incompatible value for '+path);
        expr(value,'active');
      }
      for(const [path,value] of Object.entries(delta.add||{})){
        if(!fields.has(path)||!path.startsWith('exposure.')||scalar(value)&&(!integer(value)||value<0))fail('Cannot add '+path);
        expr(value,'active');
      }
      for(const id of delta.credit||[]){
        if(!allowCredit)fail('Option or hazard cannot bypass principle guards');
        lookup(lists.principle,id,'principle');
      }
      for(const injury of delta.injuries||[]){
        if(injury.subject!=='player'&&!own(pack.initial.npc,injury.subject))fail('Unknown injured subject: '+injury.subject);
        text(injury.label);
      }
      if(delta.delay)text(delta.delay);
    }
    function result(record,allowCredit=true){narration(record.narration);effect(record.effect,allowCredit);}
    function review(record){
      condition(record.eligibleWhen,'active');
      if(record.principleId)lookup(lists.principle,record.principleId,'principle');
      for(const key of ['why','tip','outcome'])if(record[key])text(record[key]);
    }
    function cases(rows,allowCredit=true){
      for(const row of rows||[]){condition(row.when,'active');result(row.result,allowCredit);}
    }
    function step(action){return lookup(lists[action.kind],action.id,action.kind);}

    lookup(decisions,pack.initial.decisionId,'initial decision');
    narration(pack.initial.openingNarration);
    for(const [kind,list] of Object.entries(lists)) for(const action of list.values()){
      provenance(action.sourceIds);
      condition(action.when,'active');
      review(action.review);
      result(action.normal,kind==='channel');
      if(action.blocked)result(action.blocked,false);
      cases(action.cases,kind==='channel');
      if(action.fatalEndingId && (kind!=='hazard'||lookup(endings,action.fatalEndingId,'ending').phase!=='fatal'))fail('Invalid fatal ending reference');
      if(action.blocks && kind!=='hazard')fail('Only hazards can block other steps');
      for(const guard of action.blocks||[])step(guard);
    }
    for(const decision of decisions.values()){
      condition(decision.when,'active');
      text(decision.prompt);
      const options=byId(decision.options,'option in '+decision.id);
      for(const required of ['correct','misconception','risk_or_delay'])
        if(!decision.options.some(option=>option.class===required))fail('Missing '+required+' in '+decision.id);
      for(const option of options.values()){
        provenance(option.sourceIds);
        narration(option.narration);
        text(option.text);
        effect(option.effect,false);
        if(!option.steps.some(action=>action.kind!=='channel'))fail('Option needs a principle or hazard: '+option.id);
        if(option.class==='correct' && (option.safety!=='safe'||option.steps.some(action=>action.kind==='hazard')||
          !option.steps.some(action=>action.kind==='principle')))fail('Correct answer must use a safe principle: '+option.id);
        const seen=new Set();
        for(const action of option.steps){
          const id=action.kind+':'+action.id;
          if(seen.has(id))fail('Duplicate choice step: '+id);
          seen.add(id);
          const rule=step(action);
          if(action.kind==='hazard' && option.safety!=='unsafe')fail('Hazard labeled safe: '+option.id);
          if(!rule.sourceIds.some(id=>option.sourceIds.includes(id)))fail('Choice has no shared source with '+action.id);
        }
      }
    }
    for(const beat of beats.values()){
      condition(beat.when,'active');
      if(beat.decisionId)lookup(decisions,beat.decisionId,'decision');
      if(beat.hidden && beat.decisionId)fail('Hidden beat cannot open a decision');
      const visited=new Set([beat.id]);
      for(let dep=beat.after;dep;dep=lookup(beats,dep.beat,'beat dependency').after){
        if(visited.has(dep.beat))fail('Cyclic beat dependency');
        visited.add(dep.beat);
      }
      if(beat.baseEffect)effect(beat.baseEffect);
      result(beat.normal);
      if(beat.prevented){condition(beat.prevented.when,'active');result(beat.prevented.result);}
      cases(beat.overrides);
    }
    for(const consequence of consequences.values()){
      if(consequence.decisionId!==null)lookup(decisions,consequence.decisionId,'decision');
      provenance(consequence.sourceIds);
      condition(consequence.when,'active');
      review(consequence.review);
      let prev=0;
      for(const [index,tier] of consequence.tiers.entries()){
        if(index===0&&tier.fromCount!==1 || tier.fromCount<=prev)fail('Invalid escalation tiers');
        prev=tier.fromCount;
        result(tier.result,false);
        cases(tier.cases,false);
      }
    }
    for(const rule of pack.phaseRules){
      if(rule.phase==='afterActions'&&rule.skipBeats)fail('skipBeats is only allowed before beats');
      condition(rule.when,'active');
      result(rule.result);
    }
    for(const ending of endings.values()){
      condition(ending.when,'active');
      narration(ending.narration);
      if(ending.phase==='fatal'&&(ending.type!=='CRITICAL_FAILURE'||ending.injury!=='NOT_ASSESSED'))fail('Invalid fatal ending');
      for(const row of [...(ending.labels||[]),...(ending.summaries||[]),...(ending.causes||[])]){
        condition(row.when,'ending');text(row.text);
      }
    }
    if(!pack.endings.some(ending=>ending.phase==='afterBeats' && ending.when.clock?.gte===pack.limits.maxTurns))
      fail('Missing exact max-turn ending');
    const {score,noneMax,mildMax,moderateMax}=pack.injury;
    expr(score,'active');
    if(!(noneMax<=mildMax&&mildMax<=moderateMax))fail('Unsorted injury thresholds');
    text(pack.review.reflectionPrompt);
    for(const variants of Object.values(pack.presentation.narration))for(const item of variants)text(item);
    for(const projections of [pack.presentation.look,pack.presentation.askCompanion,pack.presentation.idle]){
      if(projections.at(-1).when.always!==true)fail('Projection requires a final default');
      for(const row of projections){condition(row.when,'active');narration(row.narration);}
    }
    for(const row of pack.presentation.status){condition(row.when,'active');text(row.text);}
    for(const asset of pack.assets)
      if(!/^assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:webp|png|jpe?g)$/i.test(asset.path))fail('Unsafe asset path');
    return pack;
  }
  function validatePack(pack,schema){
    const issue=checkShape(schema,pack);
    return issue?fail(issue):verifySemantics(pack);
  }
  function freeze(value){
    if(value&&typeof value==='object'){
      for(const child of Object.values(value))freeze(child);
      Object.freeze(value);
    }
    return value;
  }
  async function loadVerifiedPack(bytes,expectedDigest,schema,crypto=root.crypto?.subtle){
    if(!/^[0-9a-f]{64}$/.test(expectedDigest))fail('Invalid expected SHA-256');
    const view=bytes instanceof Uint8Array?new Uint8Array(bytes):new Uint8Array(bytes.slice(0));
    if(view.byteLength>512*1024)fail('Pack size exceeds limit');
    if(!crypto)fail('SHA-256 verification unavailable');
    const digest=new Uint8Array(await crypto.digest('SHA-256',view));
    const actual=Array.from(digest,byte=>byte.toString(16).padStart(2,'0')).join('');
    if(actual!==expectedDigest)fail('Pack SHA-256 mismatch');
    const pack=readJson(new TextDecoder('utf-8',{fatal:true}).decode(view));
    return freeze(validatePack(pack,schema));
  }
  const api={readJson,validatePack,loadVerifiedPack,evaluate,matches};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PocketChoicePack=api;
})(globalThis);
