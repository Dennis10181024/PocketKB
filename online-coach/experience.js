'use strict';

const banned = [/^我收到你說的/, /^我收到你說的「[^」]+」。/, /。你是在描述現場/,
  /描述現場、詢問，還是/, /還是在說自己現在決定採取的行動？$/, /^你試圖/,
  /暴露於[^。]*(?:風險|危險)/, /演練危急失敗。/];
const advice = /(?:你|大家)(?:應該|最好|必須|要先|可以先)|(?:建議|務必|請先|請立即|不妨|正確做法)|只剩\s*\d+\s*分鐘/;
const size = text => Array.from(text).length;
const quotes = text => [...text.matchAll(/「([^」]+)」|『([^』]+)』|“([^”]+)”|"([^"]+)"/g)].map(m => m.slice(1).find(Boolean));

function checkNarration(value, {text, details, previous, change, refused = false, unsupported}) {
  const reply = typeof value?.reply === 'string' ? value.reply.trim() : '';
  const sentences = reply.split(/[。！？!?]/).filter(part => part.trim() && !/^[」』”]+$/.test(part));
  const detail = details.find(item => item.id === value?.sensoryId);
  const mentioned = details.filter(item => reply.includes(item.text)).map(item => item.id);
  const failures = [];
  if (!reply || size(reply) > 120) failures.push('length');
  if (sentences.length < 2 || sentences.length > 4 || !/(?:我|我的)/.test(reply)) failures.push('voice_or_sentence_count');
  if (banned.some(pattern => pattern.test(reply))) failures.push('banned_pattern');
  if (quotes(reply).some(quote => !text.includes(quote))) failures.push('quote_mismatch');
  if (!detail || !mentioned.includes(detail.id)) failures.push('ungrounded_sensory_detail');
  if (previous.some(id => mentioned.includes(id))) failures.push('repeated_sensory_detail');
  if (change && !reply.includes(change)) failures.push('missing_scene_change');
  if (refused && /(?:(?:還沒|尚未|沒有)(?:確認|確定|決定).{0,10}(?:是否|是不是).{0,10}(?:決定|拒絕|採取)|(?:也許|可能)還是會)/.test(reply)) failures.push('contradicted_refusal');
  if (advice.test(reply) || unsupported(reply)) failures.push('unsupported_content');
  return { reply, failures, sensoryIds: mentioned, length: size(reply) };
}

function ground(spec, before, result) {
  const state = result.state;
  const node = spec.nodes.find(node => node.id === state.node);
  const events = state.events.slice(before.events.length);
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
  const focus = terminal ? (grounded.change === finalMessage ? '' : finalMessage) : kind === 'clarify' && !refused ?
    '我還得想清楚自己現在打算怎麼做。' : name ? `我接下來要和${name}怎麼配合？` : '我現在要怎麼決定下一步？';
  let reply = [opening, grounded.change, guidance, focus].filter(Boolean).join('');
  if (size(reply) > 120) reply = [opening, grounded.change, guidance].filter(Boolean).join('');
  return {reply, sensoryIds: detail ? [detail.id] : []};
}

function refusal(spec, state, literal, text, intent) {
  if (intent !== 'action' || literal.kind !== 'clarify' || literal.sourceIds?.length ||
      !/^(?:我)?(?:拒絕|絕不|不會|不打算|不要|不想)/.test(text) ||
      /[，,；;。！？!?].+|但|可是|然後|接著|如果|假如|嗎|呢/.test(text)) return false;
  const act = text.replace(/^(?:我)?(?:拒絕|絕不|不會|不打算|不要|不想)/, '我');
  const node = spec.nodes.find(node => node.id === state.node);
  if (spec.id === 'earthquake_school' && node.id === 'shaking' && /^我(?:衝|跑)出去[。！!]?$/.test(act)) return true;
  return spec.actions.some(action => (node.hazards?.[action.id] || action.hazardMode || action.unsafeWhenBlocked) &&
    (new RegExp(action.pattern).test(act) || act.includes(action.label)));
}

function refusalFact(text) {
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

module.exports = { checkNarration, ground, template, refusal, refusalFact, shuffled, size };
