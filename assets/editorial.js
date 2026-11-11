(() => {
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const localize=()=>{document.querySelectorAll('[data-en][data-zh]').forEach(e=>{e.textContent=e.dataset[window.siteLanguage?.()==='zh'?'zh':'en'];});if(/^\/(journey|about)\//.test(location.pathname)){const title=document.querySelector('main h1,main h2');if(title)document.title=title.textContent.replace(/\n/g,' ')+' | Gabbrotech';}};
  window.addEventListener('site-language-change',localize);window.addEventListener('site-theme-change',localize);localize();
  const track=document.querySelector('.journey-track'),cards=[...document.querySelectorAll('.journey-card')];
  if(track){
    let index=0;
    const update=()=>{const center=track.scrollLeft+track.clientWidth/2;index=cards.reduce((best,c,i)=>Math.abs(c.offsetLeft+c.offsetWidth/2-center)<Math.abs(cards[best].offsetLeft+cards[best].offsetWidth/2-center)?i:best,0);cards.forEach((c,i)=>c.classList.toggle('is-active',i===index));document.getElementById('journey-count').textContent=`0${index+1} / 03`;document.querySelector('[data-carousel="-1"]').disabled=index===0;document.querySelector('[data-carousel="1"]').disabled=index===cards.length-1;};
    const go=next=>{next=Math.max(0,Math.min(cards.length-1,next));const card=cards[next];track.scrollTo({left:card.offsetLeft-(track.clientWidth-card.offsetWidth)/2,behavior:reduced()?'instant':'smooth'});};
    document.querySelectorAll('[data-carousel]').forEach(b=>b.addEventListener('click',()=>go(index+Number(b.dataset.carousel))));
    track.addEventListener('scroll',update,{passive:true});track.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();go(index+(e.key==='ArrowRight'?1:-1));}});update();
  }
  if(location.pathname==='/'&&location.hash==='#our-journey')location.replace('/journey/');
  document.querySelectorAll('a[href="#architecture"],a[href="#metrics"]').forEach(a=>a.addEventListener('click',()=>{const target=document.querySelector(a.getAttribute('href'));if(target?.closest('details'))target.closest('details').open=true;}));
  const initialTarget=location.hash?document.getElementById(location.hash.slice(1)):null;if(initialTarget?.closest('details'))initialTarget.closest('details').open=true;
  const explorer=document.querySelector('[data-explorer]'),gateway=document.getElementById('tool-entry');
  let opening=false;
  function openExplorer(scroll=true){
    if(!explorer||opening)return;opening=true;
    gateway?.classList.add('is-opening');explorer.hidden=false;explorer.classList.add('explorer-reveal');
    setTimeout(()=>{gateway.hidden=true;explorer.classList.remove('explorer-reveal');if(scroll){history.replaceState(null,'','#explore');explorer.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});}window.dispatchEvent(new Event('resize'));opening=false;},reduced()?0:650);
  }
  document.querySelectorAll('[data-open-explorer]').forEach(button=>button.addEventListener('click',()=>openExplorer()));
  document.querySelectorAll('a[href="#explore"],a[href="#viewer-canvas"]').forEach(a=>a.addEventListener('click',e=>{if(explorer?.hidden){e.preventDefault();openExplorer();}}));
  if(explorer&&['#explore','#viewer-canvas'].includes(location.hash))openExplorer(false);
  if(explorer&&!['#explore','#viewer-canvas'].includes(location.hash)){const control=document.createElement('button');control.type='button';control.className='back-to-mission';control.innerHTML='<span data-i18n-skip data-en="← Back to mission view" data-zh="← 返回任务视角">← Back to mission view</span>';explorer.prepend(control);control.addEventListener('click',()=>{gateway.hidden=false;gateway.classList.remove('is-opening');explorer.hidden=true;history.replaceState(null,'','#tool-entry');gateway.scrollIntoView({behavior:'smooth'});});localize();}
})();
