const team = document.getElementById('team');
const stage = team.querySelector('.team-portrait-stage');
const portraits = [...stage.querySelectorAll('.team-frame .member-portrait')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const columns = 3;
const rows = 2;

let video;
let crops = [];
let frameRequest;
let lastPaintedTime;
let finished = false;

function finish() {
  if (finished) return;
  finished = true;
  observer.disconnect();
  team.removeAttribute('data-team-motion');
  team.removeAttribute('data-team-video-frame');
  if (!video) return;

  if (frameRequest !== undefined) {
    if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameRequest);
    else cancelAnimationFrame(frameRequest);
  }
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.remove();
  for (const { canvas } of crops) canvas.remove();
  crops = [];
}

function drawFrame(time = video.currentTime) {
  if (finished || !crops.length || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      time === lastPaintedTime) return;
  // One decoded frame supplies all five portraits at the same instant.
  const width = video.videoWidth / columns;
  const height = video.videoHeight / rows;
  crops.forEach(({ context }, index) => {
    context.drawImage(video, (index % columns) * width, Math.floor(index / columns) * height,
      width, height, 0, 0, width, height);
  });
  lastPaintedTime = time;
  team.setAttribute('data-team-video-frame', '');
}

function render(_now, frame) {
  if (finished) return;
  drawFrame(frame?.mediaTime);
  frameRequest = video.requestVideoFrameCallback
    ? video.requestVideoFrameCallback(render)
    : requestAnimationFrame(render);
}

function prepareVideo() {
  if (video || finished) return;
  video = document.createElement('video');
  if (!video.canPlayType('video/mp4')) {
    finish();
    return;
  }
  video.className = 'team-video-source';
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('aria-hidden', 'true');
  video.tabIndex = -1;
  video.addEventListener('error', finish, { once: true });
  video.addEventListener('ended', finish, { once: true });
  video.addEventListener('loadedmetadata', () => {
    const width = video.videoWidth / columns;
    const height = video.videoHeight / rows;
    if (!width || !height || width * 4 !== height * 3) {
      finish();
      return;
    }
    crops = portraits.map(portrait => {
      const canvas = document.createElement('canvas');
      canvas.className = 'team-portrait-video';
      canvas.width = width;
      canvas.height = height;
      canvas.setAttribute('aria-hidden', 'true');
      portrait.append(canvas);
      return { canvas, context: canvas.getContext('2d', { alpha: false }) };
    });
    if (crops.some(crop => !crop.context)) finish();
  }, { once: true });
  video.addEventListener('loadeddata', () => drawFrame(), { once: true });
  video.addEventListener('playing', render, { once: true });
  stage.append(video);
  video.src = team.dataset.teamVideo;
}

const lastPortrait = portraits.at(-1);
const observer = new IntersectionObserver(entries => {
  if (finished || !entries.some(entry => entry.isIntersecting)) return;
  prepareVideo();
  if (!finished && entries.some(entry => entry.target === lastPortrait && entry.intersectionRatio >= 0.5)) {
    observer.disconnect();
    video.play().catch(finish);
  }
}, { threshold: [0, 0.5] });

if (team.dataset.teamVideo && !reducedMotion.matches) {
  team.setAttribute('data-team-motion', '');
  observer.observe(portraits[0]);
  observer.observe(lastPortrait);
  reducedMotion.addEventListener('change', event => {
    if (event.matches) finish();
  });
}
