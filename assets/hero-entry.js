(() => {
  const scene = document.querySelector('[data-hero-entry]');
  if (!scene) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const replay = scene.querySelector('[data-hero-replay]');
  const shoulder = [872, 479], restingElbow = [575, 802], restingWrist = [831, 779];
  const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const direction = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const upperLength = distance(shoulder, restingElbow);
  const lowerLength = distance(restingElbow, restingWrist);
  const animations = [];
  let ready = false, visible = true, drawSleeve = null, tick = 0;
  const grip = scene.querySelector('.hero-grip');

  // Choreograph the grip along a shallow lifting path, then solve for the moving elbow.
  // Projected sleeve lengths change slightly as the arm reaches out toward the camera.
  function pose(time) {
    const t = time*time*(3-2*time), r = 1-t;
    const wrist = [r*r*r*897 + 3*r*r*t*884 + 3*r*t*t*800 + t*t*t*restingWrist[0],
                   r*r*r*1108 + 3*r*r*t*1075 + 3*r*t*t*780 + t*t*t*restingWrist[1]];
    const upper = upperLength - 35*r - 14*Math.sin(Math.PI*t);
    const lower = lowerLength - 26*r - 8*Math.sin(Math.PI*t);
    const reach = distance(shoulder,wrist);
    const cosine = (upper*upper + reach*reach - lower*lower)/(2*upper*reach);
    const angle = direction(shoulder,wrist) + Math.acos(Math.min(1,Math.max(-1,cosine)));
    const elbow = [shoulder[0]+upper*Math.cos(angle),shoulder[1]+upper*Math.sin(angle)];
    const pitch = 52*r*r*(1+.15*t) - 1.1*Math.sin(Math.PI*t)**4;
    const grip = 'translate('+wrist[0]+'px,'+wrist[1]+'px) rotate('+pitch+'deg) translate(-831px,-779px)';
    return {elbow,wrist,pitch,grip};
  }

  const duration = 2100;
  const gripFrames = Array.from({length:65}, (_,i) => ({transform:pose(i/64).grip}));
  function draw(time) {
    const {elbow,wrist,pitch} = pose(time);
    if (drawSleeve) drawSleeve(elbow,wrist,pitch);
  }
  function paint() {
    if (!animations.length) return;
    draw(Math.min(1,(animations[0].currentTime || 0)/duration));
    if (visible && !document.hidden) tick = requestAnimationFrame(paint);
  }
  function settle() {
    cancelAnimationFrame(tick);
    for (const animation of animations.splice(0)) animation.cancel();
    draw(1);
    scene.classList.add('hero-ready','hero-settled');
    scene.dataset.motion = 'settled';
    replay.disabled = reducedMotion.matches || !drawSleeve;
  }
  function visibility() {
    cancelAnimationFrame(tick);
    for (const animation of animations) {
      if (visible && !document.hidden) animation.play();
      else animation.pause();
    }
    if (animations.length && visible && !document.hidden) paint();
  }
  function start() {
    if (!ready) return;
    settle();
    if (reducedMotion.matches || !drawSleeve) return;
    scene.classList.remove('hero-settled');
    replay.disabled = true;
    scene.dataset.motion = 'raising';
    const timing = {duration, fill:'both'};
    animations.push(grip.animate(gripFrames,timing));
    animations.push(scene.querySelector('.company-slogan').animate([
      {opacity:0,transform:'translateY(32px)'}, {opacity:1,transform:'translateY(0px)'}
    ],{...timing,easing:'cubic-bezier(.35,0,.24,1)'}));
    const startTime = document.timeline.currentTime;
    for (const animation of animations) animation.startTime = startTime;
    animations[0].onfinish = settle;
    if (!visible || document.hidden) visibility(); else paint();
  }

  new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; visibility();}).observe(scene);
  document.addEventListener('visibilitychange',visibility);
  reducedMotion.addEventListener('change',() => {if (ready) settle();});
  replay.addEventListener('click',start);
  const deferred = new IntersectionObserver(entries => {
    for (const {target,isIntersecting} of entries) {
      if (!isIntersecting) continue;
      target.src = target.dataset.deferredSrc;
      target.removeAttribute('data-deferred-src');
      deferred.unobserve(target);
    }
  });
  document.querySelectorAll('[data-deferred-src]').forEach(image => deferred.observe(image));
  Promise.all(['hero-earth.webp','hero-astronaut.webp','hero-arm.webp','driver-mark.webp'].map(file => {
    const image = new Image();
    image.src = '/assets/editorial/' + file;
    return image.decode().then(() => image);
  })).then(images => {
    const canvas = scene.querySelector('.suit-sleeve');
    try {drawSleeve = window.createSuitSleeve(canvas,images[2]);} catch {drawSleeve = null;}
    scene.classList.toggle('hero-cloth-ready',Boolean(drawSleeve));
    canvas.addEventListener('webglcontextlost',() => {
      drawSleeve = null; scene.classList.remove('hero-cloth-ready'); settle();
    });
    ready = true;
    performance.mark('smarttorque-hero-ready');
    start();
  }).catch(() => {
    scene.classList.add('hero-fallback');
    scene.dataset.motion = 'fallback';
    replay.hidden = true;
  });
})();
