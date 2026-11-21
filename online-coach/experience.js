'use strict';

const banned = [/^我收到你說的/, /^我收到你說的「[^」]+」。/, /。你是在描述現場/,
  /描述現場、詢問，還是/, /還是在說自己現在決定採取的行動？$/, /^你試圖/,
  /暴露於[^。]*(?:風險|危險)/, /演練危急失敗。/];
const bannedClosings = [/我(?:還沒|還沒有|尚未)決定/, /(?:還要|還得|仍得|還需要|還沒)決定/, /接下來.{0,12}(?:怎麼做|做什麼|如何做)/, /在這個抉擇前又停了一會兒/];
const {sceneText} = require('../web-pwa/drill-presentation');
const aliases = {fire_closed_door:/緊閉的房門|關著的(?:房)?門|房門(?:仍|還)?(?:緊閉|關著)|關緊的門板|房門維持關閉/,
  fire_phone_signal:/手機.{0,6}(?:訊號|收得到|接得到)|螢幕.{0,6}訊號/, fire_window:/對外窗|朝外的窗/,
  school_shaking:/教室.{0,6}(?:在晃|搖晃)|地面.{0,5}(?:在抖|在動|在晃)|腳下.{0,5}(?:在抖|在動|在晃)/,
  flood_water:/外(?:面|部).{0,6}(?:積水|水勢|道路上的水)|積水.{0,4}(?:沒退|未退)/,
  landslide_road_closed:/前方.{0,9}(?:封閉|封路|不能通行|不能走)/};
const advice = /(?:你|大家)(?:應該|最好|必須|要先|可以先)|(?:建議|務必|請先|請立即|不妨|正確做法)|只剩\s*\d+\s*分鐘/;
const size = text => Array.from(text).length;
const quotes = text => [...text.matchAll(/「([^」]+)」|『([^』]+)』|“([^”]+)”|"([^"]+)"/g)].map(m => m.slice(1).find(Boolean));

function sharedSubstring(left,right) {
  const clean = text=>Array.from(text.normalize('NFKC').replace(/[\p{P}\p{Z}\s]/gu,''));
  const a = clean(left), b = clean(right);
  const row = new Uint16Array(b.length+1);
  let longest = 0;
  for (const ch of a) for (let index=b.length;index>0;index--) {
    row[index] = ch===b[index-1] ? row[index-1]+1 : 0;
    longest = Math.max(longest,row[index]);
  }
  return longest;
}

function sensoryIds(reply, details) {
  return [...new Set(details.filter(item=>reply.includes(item.text) || aliases[item.id]?.test(reply)).map(item=>item.id))];
}

function repeatedLine(text, history) {
  return text.split(/[。！？!?]/).some(line=>line.trim().length>=8 && history.some(previous=>previous.includes(line.trim())));
}

function checkNarration(value, {text, details, allDetails = details, previous, change, refused = false, authored = [], strict = false, priorLines = [], unsupported}) {
  const reply = typeof value?.reply === 'string' ? value.reply.trim() : '';
  const sentences = reply.split(/[。！？!?]/).filter(part => part.trim() && !/^[」』”]+$/.test(part));
  const detail = details.find(item => item.id === value?.sensoryId);
  const mentioned = sensoryIds(reply,allDetails);
  const ownText = authored.reduce((value,line)=>line ? value.replace(line,'') : value,reply);
  const failures = [];
  if (!reply || size(reply) > 120) failures.push('length');
  if (sentences.length < 2 || sentences.length > 4 || !/(?:我|我的)/.test(reply)) failures.push('voice_or_sentence_count');
  if (banned.some(pattern => pattern.test(reply))) failures.push('banned_pattern');
  if (strict && bannedClosings.some(pattern=>pattern.test(reply))) failures.push('banned_closing');
  if (strict && /演練|模擬/.test(reply)) failures.push('out_of_scene');
  if (strict && repeatedLine(reply,priorLines)) failures.push('repeated_line');
  if (strict ? quotes(ownText).length : quotes(reply).some(quote => !text.includes(quote))) failures.push('quote_mismatch');
  const overlap = strict ? sharedSubstring(reply,text) : 0;
  if (overlap > 10) failures.push('input_repeated');
  if ((!detail || !reply.includes(detail.text)) && !(strict && !details.length && change)) failures.push('ungrounded_sensory_detail');
  if (previous.some(id => mentioned.includes(id))) failures.push('repeated_sensory_detail');
  if (change && !reply.includes(change)) failures.push('missing_scene_change');
  if (refused && /(?:(?:還沒|尚未|沒有)(?:確認|確定|決定).{0,10}(?:是否|是不是).{0,10}(?:決定|拒絕|採取)|(?:也許|可能)還是會)/.test(reply)) failures.push('contradicted_refusal');
  if (advice.test(reply) || unsupported(reply)) failures.push('unsupported_content');
  return { reply, failures, sensoryIds: mentioned, length: size(reply), overlap };
}

function ground(spec, before, result, priorLines = []) {
  const state = result.state;
  const node = spec.nodes.find(node => node.id === state.node);
  const events = state.events.slice(before.events.length);
  if (state.onlineExperience) {
    const npcLines = events.filter(event=>['npc_proposal','npc_emotion_prompt','npc_emotion'].includes(event.kind))
      .map(event=>{
        if (event.kind!=='npc_emotion') return event.message;
        const lines = spec.npc.online.emotionVariants?.[state.npc.emotion] || [spec.npc.emotionResponses[state.npc.emotion]];
        const pivot = (state.elapsed || 0) % lines.length;
        return [...lines.slice(pivot),...lines.slice(0,pivot)].find(line=>validFixedLine(line,priorLines)) || lines[0];
      });
    const environment = events.filter(event=>event.kind==='environment_change').map(event=>event.message);
    const action = events.findLast(event=>event.kind==='action');
    const actionBeat = spec.onlineExperience.actionBeats?.[action?.action];
    const requiredBeat = ['avoid_open','towel_face','open_window_call'].includes(action?.action) ? actionBeat : null;
    const beat = spec.onlineExperience.beats[(state.elapsed || 0) % spec.onlineExperience.beats.length];
    const progress = state.node!==before.node && node.aftercareComplete ? result.message : null;
    const explanation = result.kind==='blocked' ? result.message : result.kind==='clarify' && !result.sourceIds?.length ?
      (/已經完成/.test(result.message) ? '我已經做過這個動作，手上的做法沒有帶來新的變化。' : '我在這個位置還找不到能照剛才那個做法行動的條件。') : null;
    const recovery = spec.onlineExperience.unsupportedBeats?.[(state.elapsed || 0) % (spec.onlineExperience.unsupportedBeats?.length || 1)];
    const authored = result.kind==='completed' ? [result.message] : [progress,explanation,requiredBeat,...environment,...npcLines].filter(Boolean);
    if (explanation && !environment.length && !npcLines.length) authored.push(recovery || beat);
    if (!authored.length) authored.push(actionBeat || beat);
    return {details:node.experience.sensory, allDetails:spec.nodes.flatMap(item=>item.experience.sensory),
      change:authored.join(''), authored, focus:focusLine(node,priorLines), strict:true};
  }
  const event = events.findLast(event => event.kind === 'environment_change');
  const elapsed = (state.elapsed || 0) > (before.elapsed || 0);
  const npc = events.findLast(event => event.kind === 'npc_emotion' || event.kind === 'npc_handled');
  const change = result.kind === 'completed' ? result.message : event && event.message ||
    (npc ? spec.npc.emotionResponses[state.npc.emotion || 'handled'] : elapsed ? '我在這個抉擇前又停了一會兒。' : '');
  return { details: node.experience.sensory, change };
}

function template(grounded, previous, { stopped, refused, terminal, kind, task, name, finalMessage }) {
  const detail = grounded.details.find(item => !previous.includes(item.id));
  const opening = detail ? `我${detail.text}。` : '我把注意力拉回眼前。';
  const guidance = stopped ? '我做到前面的動作，後面的還沒有做。' : refused && !grounded.change ? '我決定先不採取剛才拒絕的做法。' : '';
  const focus = terminal ? (grounded.change === finalMessage ? '' : finalMessage) : grounded.strict ? grounded.focus : kind === 'clarify' && !refused ?
    '我還得想清楚自己現在打算怎麼做。' : name ? `我接下來要和${name}怎麼配合？` : '我現在要怎麼決定下一步？';
  let reply = [opening, grounded.change, guidance, focus].filter(Boolean).join('');
  if (size(reply) > 120) reply = [opening, grounded.change, guidance].filter(Boolean).join('');
  return {reply, sensoryIds: grounded.strict ? sensoryIds(reply,grounded.allDetails) : detail ? [detail.id] : []};
}

function validFixedLine(line,previous) {
  return line && !bannedClosings.some(pattern=>pattern.test(line)) && !repeatedLine(line,previous);
}

function focusLine(node, previous) {
  return [node.experience.focus,node.decisionPrompt || node.task].map(sceneText).find(line=>validFixedLine(line,previous)) || '';
}

function answerQuestion(spec, before, text, priorLines = []) {
  const node = spec.nodes.find(item=>item.id===before.node);
  const answer = spec.onlineExperience.questions.find(item=>(!item.nodes || item.nodes.includes(before.node)) && new RegExp(item.pattern).test(text));
  const proposedSpeaker = spec.onlineExperience.questionSpeaker?.[before.node];
  const speaker = proposedSpeaker==='接線員' && !before.events.some(event=>event.action==='call') ? spec.npc.name : proposedSpeaker || spec.npc.name;
  const quote = answer ? `${speaker}說：「${sceneText(answer.answer)}」` : '眼前的資訊還不足以回答這個問題。';
  return {state:before,kind:'question',message:quote + focusLine(node,priorLines),
    sourceIds:answer?.sourceIds || [],answerId:answer?.id || null};
}

function questionText(text) {
  if (/[，。；,;].*(?:我|我們)(?:現在|就|還是|照樣)?(?:要|決定|直接|先)/.test(text)) return false;
  return /^(?:可否|為何)|(?:會怎樣|有哪些風險|有什麼風險|的風險|的後果)[。！!]?$/.test(text);
}

function refusal(spec, state, literal, text, intent) {
  if (intent !== 'action' || literal.kind !== 'clarify' || literal.sourceIds?.length ||
      !/^(?:我)?(?:拒絕|絕不|不會|不打算|不要|不想)/.test(text) ||
      /[，,；;。！？!?].+|但|可是|然後|接著|如果|假如|嗎|呢/.test(text)) return false;
  const act = text.replace(/^(?:我)?(?:拒絕|絕不|不會|不打算|不要|不想)/, '我');
  const node = spec.nodes.find(node => node.id === state.node);
  if (spec.id === 'earthquake_school' && node.id === 'shaking' && /^我(?:衝|跑)出去[。！!]?$/.test(act)) return true;
  if (spec.id === 'earthquake_school' && node.id === 'evacuate' && /^我(?:回|折回)教室拿(?:手機|書包|東西)[。！!]?$/.test(act)) return true;
  return spec.actions.some(action => (node.hazards?.[action.id] || action.hazardMode || action.unsafeWhenBlocked) &&
    (new RegExp(action.pattern).test(act) || act.includes(action.label)));
}

function refusalFact(text, quote = true) {
  if (!quote) return '我把剛才拒絕的做法排除在外。';
  const rejected = text.replace(/^(?:我)?(?:拒絕|絕不|不會|不打算|不要|不想)/,'').replace(/[。！!]$/,'').trim();
  return rejected && size(rejected) < 60 ? `我決定先排除「${rejected}」這個做法。` : '我決定先不採取剛才拒絕的做法。';
}

function shuffled(options, random) {
  const copy = [...options];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

module.exports = { checkNarration, ground, template, refusal, refusalFact, shuffled, size, sharedSubstring, sensoryIds, answerQuestion, questionText, bannedClosings, validFixedLine };
