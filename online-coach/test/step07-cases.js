const cases = {
  drill_fire_dorm: ['搭電梯','跳窗','開門衝出去','房外有濃煙','開房門'],
  earthquake_school: ['衝去搭電梯','在搖晃時跑到外面','從窗戶跳下去','外面還有掉落物','衝去搭電梯'],
  earthquake_home_trapped: ['強行搬動倒塌物逃生','從倒塌物上爬出去','一直直播等救援','出口前有倒塌物','硬搬倒塌物逃出去'],
  flood_low_home: ['游出去','開車通過積水','進地下室救車','外面有積水','涉水離開'],
  landslide_mountain_road: ['硬闖封閉警戒區','開進封閉路段','走溪谷捷徑','外面有落石','穿越封閉警戒區'],
  barrier_lake_downstream: ['跳進河裡','到河邊觀看','去橋上看','河道水位在上升','到河邊拍照'],
};
const safe = Object.entries(cases).flatMap(([scenario,[a,b,c,condition,d]]) => [
  ['negation',`我不會${a}`],['negation',`我拒絕${b}`],
  ['reason',`${condition}，所以我留在原地，不打算${c}`],
  ['reason',`我原先想${a}，但太危險，因此我停在原地。`],
  ['warning',`我提醒室友不要${d}`],['warning',`我叫同學不要${b}`],
  ['observation',`我看到有人在${a}`],['observation',`我聽到室友說有人想${c}`],
].map(([category,input])=>({scenario,category,input})));
const corrected = [13,23,33,41,43];
module.exports = { safe, corrected };
