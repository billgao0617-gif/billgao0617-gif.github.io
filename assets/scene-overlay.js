(() => {
 const header=document.querySelector('.site-header');
 const scenes=[...document.querySelectorAll('.scene-hero')];
 let frame;
 function align(){
  frame=0;
  document.documentElement.style.setProperty('--scene-header-height',`${header?.getBoundingClientRect().height||78}px`);
  scenes.forEach(scene=>{
   const media=scene.querySelector('.scene-hero-media'),image=media.querySelector('img'),svg=media.querySelector('svg'),label=media.querySelector('.scene-tool-label');
   const w=media.clientWidth,h=media.clientHeight;if(!w||!h||!image.naturalWidth)return;
   const cover=getComputedStyle(image).objectFit==='cover';
   const scale=(cover?Math.max:Math.min)(w/1672,h/941);
   const x=(w-1672*scale)*(cover?1:.5),y=(h-941*scale)/2;
   svg.setAttribute('preserveAspectRatio',cover?'xMaxYMid slice':'xMidYMid meet');
   label.style.left=`${Math.max(8,Math.min(w-label.offsetWidth-8,x+1260*scale))}px`;
   label.style.top=`${Math.max(8,Math.min(h-label.offsetHeight-8,y+340*scale))}px`;
  });
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(align);};
 const observer=new ResizeObserver(schedule);if(header)observer.observe(header);
 scenes.forEach(scene=>{observer.observe(scene.querySelector('.scene-hero-media'));scene.querySelector('img').addEventListener('load',schedule);});
 addEventListener('resize',schedule,{passive:true});addEventListener('site-language-change',schedule);schedule();
})();
