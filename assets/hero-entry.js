(() => {
  const scene = document.querySelector('[data-hero-entry]');
  if (!scene) return;
  const video = scene.querySelector('video');
  const picture = scene.querySelector('picture');
  const poster = picture.querySelector('img');
  const sources = [...picture.querySelectorAll('source[data-motion-source]')];
  const portrait = matchMedia('(max-width: 760px) and (max-aspect-ratio: 4/5)');
  const overlay = scene.querySelector('.hero-tool-overlay');
  const replay = scene.querySelector('[data-hero-replay]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let run = 0, frame, watchdog, active = false, onScreen = true;

  function cancelFrame() {
    if (frame == null) return;
    if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frame);
    else cancelAnimationFrame(frame);
    frame = null;
  }
  function finish() {
    active = false;
    clearTimeout(watchdog);
    cancelFrame();
    scene.style.setProperty('--slogan-progress', '1');
    scene.dataset.motion = 'settled';
    scene.classList.add('hero-settled');
    replay.disabled = motion.matches || Boolean(video.error);
  }
  async function useFinalStill(id) {
    if (id !== run) return;
    active = false;
    clearTimeout(watchdog);
    cancelFrame();
    video.pause();
    const image = new Image();
    image.src = portrait.matches ? picture.dataset.portraitFinal : picture.dataset.final;
    try { await image.decode(); } catch { /* Keep the last available media. */ }
    if (id !== run) return;
    if (image.naturalWidth) {
      sources.forEach(source => { source.media = 'not all'; });
      try { await poster.decode(); } catch {}
      if (id !== run) return;
      scene.classList.remove('hero-video-visible');
    }
    finish();
  }
  function tick(id) {
    const painted = (_time, metadata) => {
      if (id !== run || !active) return;
      const time = metadata?.mediaTime ?? video.currentTime;
      if (video.readyState >= 2 && (metadata || time > 0)) {
        clearTimeout(watchdog);
        scene.classList.add('hero-video-visible');
        scene.dataset.motion = 'raising';
        const p = Math.min(1, time / video.duration) || 0;
        scene.style.setProperty('--slogan-progress', String(p * p * (3 - 2 * p)));
      }
      tick(id);
    };
    frame = video.requestVideoFrameCallback
      ? video.requestVideoFrameCallback(painted)
      : requestAnimationFrame(painted);
  }
  function updatePlayback() {
    if (!active) return;
    clearTimeout(watchdog);
    if (document.hidden || !onScreen) { video.pause(); return; }
    const id = run;
    if (!scene.classList.contains('hero-video-visible')) {
      watchdog = setTimeout(() => useFinalStill(id), 6500);
    }
    video.play().catch(error => {
      if (error.name !== 'AbortError' && active && id === run) useFinalStill(id);
    });
  }
  function start() {
    const id = ++run;
    cancelFrame();
    replay.disabled = true;
    overlay.setAttribute('viewBox', portrait.matches ? '957.64 0 766.72 1198' : '144 190 2350 940');
    if (motion.matches || video.error) { useFinalStill(id); return; }
    active = true;
    scene.dataset.motion = 'loading';
    scene.style.setProperty('--slogan-progress', '0');
    scene.classList.remove('hero-settled', 'hero-video-visible');
    sources.forEach(source => { source.media = source.dataset.motionSource; });
    const file = portrait.matches ? video.dataset.portraitSrc : video.dataset.src;
    if (video.getAttribute('src') !== file) video.src = file;
    else video.currentTime = 0;
    tick(id);
    updatePlayback();
  }
  video.addEventListener('ended', () => { if (active) finish(); });
  video.addEventListener('error', () => useFinalStill(run));
  replay.addEventListener('click', start);
  motion.addEventListener('change', () => motion.matches ? useFinalStill(++run) : start());
  portrait.addEventListener('change', start);
  document.addEventListener('visibilitychange', updatePlayback);
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    updatePlayback();
  }).observe(scene);
  start();
})();
