const form=document.querySelector('#setupForm');
const status=document.querySelector('#setupStatus');
const field=document.querySelector('#apiKey');
form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button');button.disabled=true;status.textContent='正在設定本機教練…';
  try {
    const response=await fetch('/api/configure',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:field.value.trim()})});
    field.value='';const result=await response.json();
    if(!response.ok)throw new Error(result.error||'設定未完成，請重試。');
    status.textContent=result.message;form.hidden=true;
  }catch(error){field.value='';status.textContent=error.message;}
  finally{button.disabled=false;}
});
fetch('/api/health').then(response=>response.json()).then(health=>{if(health.ready){form.hidden=true;status.textContent='本機教練已設定金鑰，可進入演練。API 權限與額度需實際請求確認。';}}).catch(()=>{status.textContent='請先啟動電腦的線上教練服務。';});
