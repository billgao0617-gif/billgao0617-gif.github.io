(() => {
 const scene=document.querySelector('[data-hero-entry]');if(!scene)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const shoulder=scene.querySelector('.hero-shoulder'),arm=scene.querySelector('.hero-lift'),slogan=scene.querySelector('.company-slogan'),replay=scene.querySelector('[data-hero-replay]');
 let ready=false,visible=true,settled=false;
 const assets=['hero-earth.webp','hero-astronaut.webp','hero-arm.webp'];
 // Start below-fold downloads when approached, instead of competing with hero layers.
 const deferred=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;const image=entry.target;
  image.src=image.dataset.deferredSrc;image.removeAttribute('data-deferred-src');deferred.unobserve(image);
 }),{rootMargin:'0px 0px 0px 0px'});
 document.querySelectorAll('[data-deferred-src]').forEach(image=>deferred.observe(image));
 function finish(){settled=true;scene.classList.add('hero-settled');replay.disabled=false;scene.dataset.motion='settled';}
 function start(){
  if(!ready)return;
  scene.classList.remove('hero-ready','hero-settled');replay.disabled=true;settled=false;
  // Reset the single compositor animation without reallocating any image resources.
  void arm.getBoundingClientRect();void slogan.getBoundingClientRect();scene.classList.add('hero-ready');scene.dataset.motion=motion.matches?'static':'raising';
  if(motion.matches)finish();
 }
 arm.addEventListener('animationend',event=>{if(event.animationName==='raise-smarttorque')finish();});
 replay.addEventListener('click',start);
 Promise.all(assets.map(async file=>{
  const image=new Image();image.src='/assets/editorial/'+file;
  if(image.decode)await image.decode();else await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;});
 })).then(()=>{ready=true;performance.mark('smarttorque-hero-ready');start();}).catch(()=>{
  scene.dataset.motion='fallback';scene.classList.add('hero-fallback');replay.hidden=true;
  // The small first frame and permanent 3D CTA remain usable if any layer fails.
 });
 const observer=new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;
  shoulder.style.animationPlayState=arm.style.animationPlayState=slogan.style.animationPlayState=visible&&!document.hidden?'running':'paused';
 },{threshold:0});observer.observe(scene);
 document.addEventListener('visibilitychange',()=>{shoulder.style.animationPlayState=arm.style.animationPlayState=slogan.style.animationPlayState=visible&&!document.hidden?'running':'paused';});
 motion.addEventListener('change',()=>{if(ready){if(motion.matches)finish();else if(!settled)start();}});
})();
