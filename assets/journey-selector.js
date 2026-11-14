(() => {
 const track=document.querySelector('.journey-track');if(!track)return;
 const cards=[...track.querySelectorAll('.journey-card')];
 const previous=document.querySelector('[data-carousel="-1"]'),next=document.querySelector('[data-carousel="1"]');
 let index=0,drag=null,suppressClick=false,resizeTimer;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const center=i=>cards[i].offsetLeft+(cards[i].offsetWidth-track.clientWidth)/2;
 const nearest=()=>cards.reduce((best,card,i)=>Math.abs(center(i)-track.scrollLeft)<Math.abs(center(best)-track.scrollLeft)?i:best,0);
 function update(){
  index=nearest();cards.forEach((card,i)=>{card.classList.toggle('is-active',i===index);card.querySelector('[data-select-card]').setAttribute('aria-pressed',String(i===index));});
  document.getElementById('journey-count').textContent=`0${index+1} / 03`;previous.disabled=index===0;next.disabled=index===cards.length-1;
 }
 function go(i,instant=false){i=Math.max(0,Math.min(cards.length-1,i));track.scrollTo({left:center(i),behavior:instant||reduced()?'instant':'smooth'});}
 cards.forEach((card,i)=>card.querySelector('[data-select-card]').addEventListener('click',()=>go(i)));
 previous.addEventListener('click',()=>go(index-1));next.addEventListener('click',()=>go(index+1));
 track.addEventListener('scroll',update,{passive:true});
 track.addEventListener('keydown',e=>{let target;if(e.key==='ArrowLeft')target=index-1;else if(e.key==='ArrowRight')target=index+1;else if(e.key==='Home')target=0;else if(e.key==='End')target=cards.length-1;else return;e.preventDefault();go(target);});
 track.addEventListener('wheel',e=>{
  if(!e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.ctrlKey)return;
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?track.clientWidth:1);
  if(delta<0&&track.scrollLeft<=1||delta>0&&track.scrollLeft>=track.scrollWidth-track.clientWidth-1)return;
  e.preventDefault();track.scrollLeft+=delta;
 },{passive:false});
 track.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'||e.button!==0||!e.isPrimary||e.target.closest('a'))return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:track.scrollLeft,moved:false};
 });
 track.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}if(Math.abs(dx)<7)return;drag.moved=true;track.setPointerCapture(e.pointerId);track.classList.add('is-dragging');}
  e.preventDefault();track.scrollLeft=drag.left-dx;
 });
 function release(e){
  if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=null;
  track.classList.remove('is-dragging');if(track.hasPointerCapture(e.pointerId))track.releasePointerCapture(e.pointerId);
  if(moved){suppressClick=true;setTimeout(()=>{suppressClick=false;},0);go(nearest());}
 }
 track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);
 track.addEventListener('lostpointercapture',e=>{if(e.target===track)release(e);});
 track.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();}},true);
 window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>go(index,true),100);});
 window.addEventListener('site-language-change',()=>cards.forEach(card=>{const title=card.querySelector('h3').textContent;card.querySelector('[data-select-card]').setAttribute('aria-label',(window.siteLanguage?.()==='zh'?'选择 ':'Select ')+title);}));
 update();
})();
