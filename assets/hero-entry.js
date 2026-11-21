(() => {
  const scene = document.querySelector('[data-hero-entry]');
  if (!scene) return;

  const video = scene.querySelector('.hero-video');
  const still = scene.querySelector('.hero-first-frame');
  const slogan = scene.querySelector('.company-slogan');
  const replay = scene.querySelector('[data-hero-replay]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const startFrame = still.src;
  const endFrame = scene.querySelector('.hero-shot source').srcset;
  let previewAnimation, tick, visible = true, playing = false, requested = false;

  function settle(useStill = false) {
    requested = playing = false;
    cancelAnimationFrame(tick);
    video.pause();
    previewAnimation?.cancel();
    if (useStill) {
      still.src = endFrame;
      scene.classList.remove('hero-video-visible');
    }
    scene.classList.add('hero-settled');
    scene.dataset.motion = 'settled';
    replay.disabled = reducedMotion.matches || Boolean(video.error);
    document.documentElement.classList.remove('hero-entry-enabled');
  }

  function syncSlogan() {
    if (!playing) return;
    previewAnimation.currentTime = 1000 * Math.min(1, video.currentTime / video.duration);
    tick = requestAnimationFrame(syncSlogan);
  }

  async function play() {
    if (reducedMotion.matches || video.error) return settle(true);
    requested = true;
    try {
      await video.play();
    } catch {
      if (requested && visible && !document.hidden) settle(true);
    }
  }

  function updateVisibility() {
    if (!requested || video.ended) return;
    if (visible && !document.hidden) play();
    else video.pause();
  }

  video.addEventListener('playing', () => {
    if (!requested) return;
    if (!previewAnimation || previewAnimation.playState === 'idle') {
      previewAnimation = slogan.animate(
        [{opacity:0, transform:'translateY(32px)'},{opacity:1, transform:'translateY(0)'}],
        {duration:1000, easing:'cubic-bezier(.35,0,.24,1)', fill:'both'}
      );
      previewAnimation.pause();
    }
    if (playing) return;
    playing = true;
    scene.classList.add('hero-video-visible');
    scene.dataset.motion = 'raising';
    syncSlogan();
  });
  video.addEventListener('ended', () => settle());
  video.addEventListener('error', () => settle(true));

  replay.addEventListener('click', () => {
    replay.disabled = true;
    still.src = startFrame;
    scene.classList.remove('hero-settled');
    video.currentTime = 0;
    play();
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateVisibility();
  }).observe(scene);
  document.addEventListener('visibilitychange', updateVisibility);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) settle(true);
    else replay.disabled = Boolean(video.error);
  });

  if (reducedMotion.matches || video.error) settle(true);
  else {
    requested = true;
    updateVisibility();
  }
})();
