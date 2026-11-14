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
  let ready = false, visible = true;

  // Map a sleeve between its two projected joints. The perpendicular width stays constant.
  function sleeve(start, end, targetStart, targetEnd) {
    const angle = direction(start, end), targetAngle = direction(targetStart, targetEnd);
    const scale = distance(targetStart, targetEnd) / distance(start, end);
    const c = Math.cos(angle), s = Math.sin(angle), u = Math.cos(targetAngle), v = Math.sin(targetAngle);
    const a = scale*u*c + v*s, b = scale*v*c - u*s;
    const h = scale*u*s - v*c, k = scale*v*s + u*c;
    return 'matrix(' + [a,b,h,k,targetStart[0]-a*start[0]-h*start[1],targetStart[1]-b*start[0]-k*start[1]].join(',') + ')';
  }

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
    return [sleeve(shoulder,restingElbow,shoulder,elbow),sleeve(restingElbow,restingWrist,elbow,wrist),grip];
  }

  const parts = ['.hero-shoulder','.hero-lift','.hero-grip'].map(selector => scene.querySelector(selector));
  const poses = Array.from({length:49}, (_,i) => pose(i/48));
  function settle() {
    for (const animation of animations.splice(0)) animation.cancel();
    scene.classList.add('hero-ready','hero-settled');
    scene.dataset.motion = 'settled';
    replay.disabled = reducedMotion.matches;
  }
  function visibility() {
    for (const animation of animations) {
      if (visible && !document.hidden) animation.play();
      else animation.pause();
    }
  }
  function start() {
    if (!ready) return;
    settle();
    if (reducedMotion.matches) return;
    scene.classList.remove('hero-settled');
    replay.disabled = true;
    scene.dataset.motion = 'raising';
    const timing = {duration:2100, fill:'both'};
    parts.forEach((part,index) => animations.push(part.animate(poses.map(frame => ({transform:frame[index]})),timing)));
    animations.push(scene.querySelector('.company-slogan').animate([
      {opacity:0,transform:'translateY(32px)'}, {opacity:1,transform:'translateY(0px)'}
    ],{...timing,easing:'cubic-bezier(.35,0,.24,1)'}));
    const startTime = document.timeline.currentTime;
    for (const animation of animations) animation.startTime = startTime;
    animations[0].onfinish = settle;
    if (!visible || document.hidden) visibility();
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
  Promise.all(['hero-earth.webp','hero-astronaut.webp','hero-arm.webp'].map(file => {
    const image = new Image();
    image.src = '/assets/editorial/' + file;
    return image.decode();
  })).then(() => {ready = true; performance.mark('smarttorque-hero-ready'); start();}).catch(() => {
    scene.classList.add('hero-fallback');
    scene.dataset.motion = 'fallback';
    replay.hidden = true;
  });
})();
