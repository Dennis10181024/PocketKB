(function publish(root){
  'use strict';

  const esc=text=>String(text??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const legacyScenarios=[
    ['earthquake_home_trapped','住家地震受困'],['flood_low_home','低窪住宅淹水'],
    ['landslide_mountain_road','山區土石流'],['barrier_lake_downstream','堰塞湖下游']
  ];
  const directory='./scenarios/choice/';
  const storageKey='pocketkb:show-legacy-drills';
  async function request(path,format){
    const response=await fetch(directory+path);
    if(!response.ok)throw new Error('Choice asset unavailable');
    return response[format]();
  }
  function duties(rows,render){
    return rows.length?'<ul>'+rows.map(row=>'<li>'+render(row)+'</li>').join('')+'</ul>':'';
  }
  function injuries(rows){
    const groups=new Map();
    for(const row of rows){
      const key=row.subject+':'+row.label;
      const group=groups.get(key)||{...row,count:0};
      group.count++;
      groups.set(key,group);
    }
    return duties([...groups.values()],row=>esc(row.subjectName+'｜'+row.label+(row.count>1?'（'+row.count+' 次）':'')))||
      '<p>本場無紀錄的傷勢事件。</p>';
  }
  function renderReview(review){
    return '<div class="choice-review">'+
      '<h4>結果</h4><p>'+esc(review.result)+'</p><p>'+esc(review.summary)+'</p>'+
      (review.good.length?'<h4>做對的決定</h4>'+duties(review.good,row=>'「'+esc(row.optionText)+'」'+esc(row.why)):'')+
      (review.improvements.length?'<h4>下次可以補上的</h4>'+duties(review.improvements,row=>
        (row.optionText?'「'+esc(row.optionText)+'」<br>':'')+esc(row.text)):'')+
      (review.dangers.length?'<h4>這次的危險選擇與後果</h4>'+duties(review.dangers,row=>
        '「'+esc(row.optionText)+'」<br>'+esc(row.outcome)+'<br>'+esc(row.tip)):'')+
      (review.turning?'<h4>關鍵轉折</h4><p>「'+esc(review.turning.optionText)+'」<br>'+esc(review.turning.outcome)+'<br>'+esc(review.turning.tip)+'</p>':'')+
      (review.sources.length?'<h4>官方依據</h4>'+duties(review.sources,row=>'<a href="'+esc(row.url)+'" target="_blank" rel="noopener noreferrer">'+esc(row.title)+'</a>'):'')+
      '<h4>帶走一個思考題</h4><p>'+esc(review.reflection)+'</p></div>';
  }
  function create(rerender){
    let catalog=null, runtime=null, session=null, view=null, review=null, selected=null;
    let info='', error='', loading=false, openedAt=0;
    let showLegacy=false;
    try{showLegacy=localStorage.getItem(storageKey)==='1';}catch{}
    function refresh(focus=false){
      rerender();
      if(focus)document.querySelector('#choice-heading')?.focus();
    }
    async function loadCatalog(){
      loading=true;
      error='';
      try{
        const manifest=await request('manifest.json','json');
        if(manifest.schemaVersion!==1||!manifest.packs.length||
          manifest.packs.some(row=>!(/^[a-z0-9-]+\.json$/.test(row.file)&&/^[0-9a-f]{64}$/.test(row.sha256))))throw new Error('Invalid catalog');
        catalog=manifest.packs;
      }catch{error='目前無法載入情境清單。請確認資料已下載後重試。';}
      finally{loading=false;refresh();}
    }
    queueMicrotask(loadCatalog);
    async function start(){
      if(loading||!selected)return;
      loading=true;
      error='';
      refresh();
      try{
        const [bytes,schema]=await Promise.all([request(selected.file,'arrayBuffer'),request('schema-v1.json','json')]);
        const pack=await root.PocketChoicePack.loadVerifiedPack(bytes,selected.sha256,schema);
        if(pack.meta.id!==selected.id||pack.meta.title!==selected.title)throw new Error('Pack identity mismatch');
        runtime=root.PocketChoiceRuntime.createRuntime(pack);
        session=runtime.start();
        view=runtime.snapshot(session);
        openedAt=performance.now();
      }catch{error='情境資料載入或完整性檢查失敗，請重新載入。';}
      finally{loading=false;refresh(true);}
    }
    function reset(){
      runtime=session=view=review=selected=null;
      info=error='';
      refresh(true);
    }
    function render(active){
      let content;
      const button=(id,label,primary=false)=>'<button type="button" id="'+id+'" class="'+(primary?'primary':'ghost')+'">'+label+'</button>';
      if(view?.state.ending){
        content='<h2 id="choice-heading" tabindex="-1">'+esc(review.type)+'</h2>'+
          (review.injury?'<p class="choice-grade">本人傷勢｜'+esc(review.injury)+'</p>':'')+
          duties(view.lines,esc)+'<h3>傷勢清單</h3>'+injuries(review.injuries)+
          '<h3>演練回顧</h3>'+renderReview(review)+'<div class="choice-tools">'+
          (review.canRetry?button('choice-retry','從這個決定重來',true):'')+button('choice-reset','回到情境清單')+'</div>';
      }else if(view){
        content='<h2 id="choice-heading" tabindex="-1">'+esc(selected.title)+'</h2>'+
          '<h3>現在發生什麼</h3><div class="choice-scene">'+view.lines.map(line=>'<p>'+esc(line)+'</p>').join('')+'</div>'+
          (view.status.length?'<p class="choice-status">現場狀態｜'+view.status.slice(0,2).map(esc).join('、')+'</p>':'')+
          '<h3 id="choice-question">我面臨什麼決定</h3><p>'+esc(view.decision.prompt)+'</p>'+
          '<div class="choice-options" role="group" aria-labelledby="choice-question">'+view.decision.options.map(option=>
            '<button type="button" class="choice-option" data-choice-option="'+esc(option.id)+'">'+esc(option.text)+'</button>').join('')+'</div>'+
          '<div class="choice-tools">'+button('choice-observe','先看看四周')+button('choice-ask','問同伴')+'</div>'+
          '<p class="choice-inspection" role="status">'+esc(info)+'</p>'+
          '<details class="choice-stop"><summary>停止演練</summary>'+button('choice-reset','結束並回到情境清單')+'</details>';
      }else if(selected){
        content='<h2 id="choice-heading" tabindex="-1">'+esc(selected.title)+'</h2>'+
          '<p>演練中可能出現受傷的結果，你可以隨時停止。</p>'+
          '<p>點選一個做法就會送出。「先看看四周」和「問同伴」可先取得線索。</p>'+
          '<div class="choice-tools"><button type="button" class="primary" id="choice-start" '+(loading?'disabled':'')+'>'+(loading?'正在載入':'開始演練')+'</button>'+
          button('choice-reset','回到情境清單')+'</div>';
      }else{
        content='<h2 id="choice-heading" tabindex="-1">情境演練</h2><p>選一個情境，練習在災害發生時做決定。</p>'+
          '<div class="choice-options">'+(catalog?.map(row=>'<button type="button" class="choice-option" data-choice-pack="'+esc(row.id)+'">'+esc(row.title)+'</button>').join('')||
          (error?button('choice-refresh','重新載入'):'<p role="status">正在讀取情境清單。</p>'))+'</div>'+
          '<details class="choice-stop" '+(showLegacy?'open':'')+'><summary>演練設定</summary>'+
          '<label class="choice-setting"><input id="choice-legacy" type="checkbox" '+(showLegacy?'checked':'')+'>顯示舊版對話劇本</label>'+
          (showLegacy?duties(legacyScenarios,([id,title])=>'<a href="./online.html?scenario='+esc(id)+'">'+esc(title)+'</a>')+
            '<p>舊版對話劇本需啟動線上教練服務。</p>':'')+'</details>';
      }
      return '<div class="view '+(active?'active':'')+' choice-drill" id="view-drill">'+content+
        (error?'<p role="alert">'+esc(error)+'</p>':'')+'</div>';
    }
    function bind(){
      const el=id=>document.querySelector('#choice-'+id);
      el('refresh')?.addEventListener('click',()=>{void loadCatalog();refresh();});
      el('start')?.addEventListener('click',start);
      el('reset')?.addEventListener('click',()=>{if(!loading)reset();});
      el('retry')?.addEventListener('click',()=>{
        view=runtime.retry(session);
        review=null;info='';openedAt=performance.now();refresh(true);
      });
      const inspect=kind=>{
        info=runtime[kind](session);
        el('heading').parentElement.querySelector('.choice-inspection').textContent=info;
      };
      el('observe')?.addEventListener('click',()=>inspect('observe'));
      el('ask')?.addEventListener('click',()=>inspect('ask'));
      el('legacy')?.addEventListener('change',event=>{
        showLegacy=event.target.checked;
        try{localStorage.setItem(storageKey,showLegacy?'1':'0');}catch{}
        refresh();
        el('legacy')?.closest('details')?.setAttribute('open','');
        el('legacy')?.focus();
      });
      for(const button of document.querySelectorAll('[data-choice-pack]'))button.addEventListener('click',()=>{
        selected=catalog.find(row=>row.id===button.dataset.choicePack);error='';refresh(true);
      });
      for(const button of document.querySelectorAll('[data-choice-option]')){
        const {decision,revision}=view;
        button.addEventListener('click',()=>{
          if(view.revision!==revision)return;
          const responseTimeMs=Math.round(performance.now()-openedAt);
          view=runtime.submitChoice(session,{decisionId:decision.id,optionId:button.dataset.choiceOption,
            inputId:'choice-'+revision,revision,responseTimeMs});
          info='';
          if(view.state.ending)review=runtime.debrief(session);
          openedAt=performance.now();
          refresh(true);
        });
      }
    }
    return {render,bind};
  }
  root.PocketChoiceView={create};
})(globalThis);
