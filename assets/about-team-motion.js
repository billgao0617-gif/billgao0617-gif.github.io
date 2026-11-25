const team = document.getElementById('team');
const stage = team.querySelector('.team-portrait-stage');
const portraits = [...stage.querySelectorAll('.team-frame .member-portrait')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const columns = 3;
const rows = 2;

let video, objectUrl;
let preparing = false;
const download = new AbortController();
const portraitSizes = new ResizeObserver(resizeCrops);
let crops = [];
let frameRequest;
let lastPaintedTime;
let finished = false, started = false;

function finish() {
  if (finished) return;
  finished = true;
  observer.disconnect();
  preloadObserver.disconnect();
  team.removeAttribute('data-team-motion');
  team.removeAttribute('data-team-video-frame');
  download.abort();
  portraitSizes.disconnect();
  if (!video) return;

  if (frameRequest !== undefined) {
    if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameRequest);
    else cancelAnimationFrame(frameRequest);
  }
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.remove();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  for (const { canvas } of crops) canvas.remove();
  crops = [];
}

function resizeCrops() {
  if (!video?.videoWidth) return;
  const sourceWidth = video.videoWidth / columns;
  const ratio = window.devicePixelRatio || 1;
  for (const {canvas,portrait} of crops) {
    const width = Math.min(sourceWidth, Math.ceil(portrait.clientWidth * ratio));
    if (width > 0 && canvas.width !== width) {
      canvas.width = width;
      canvas.height = Math.round(width * 4 / 3);
    }
  }
}

function drawFrame(time = video.currentTime) {
  if (finished || !crops.length || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      time === lastPaintedTime) return;
  // One decoded frame supplies all five portraits at the same instant.
  const width = video.videoWidth / columns;
  const height = video.videoHeight / rows;
  crops.forEach(({canvas,context}, index) => {
    context.drawImage(video, (index % columns) * width, Math.floor(index / columns) * height,
      width, height, 0, 0, canvas.width, canvas.height);
  });
  if (lastPaintedTime === undefined) team.setAttribute('data-team-video-frame', '');
  lastPaintedTime = time;
}

function render(_now, frame) {
  if (finished) return;
  drawFrame(frame?.mediaTime);
  frameRequest = video.requestVideoFrameCallback
    ? video.requestVideoFrameCallback(render)
    : requestAnimationFrame(render);
}

async function prepareVideo() {
  if (preparing || finished) return;
  preparing = true;
  video = document.createElement('video');
  if (!video.canPlayType('video/mp4')) {
    finish();
    return;
  }
  try {
    // Start from the complete clip so a slow connection cannot interrupt the entrance.
    const response = await fetch(team.dataset.teamVideo,{signal:download.signal,priority:'low'});
    if (!response.ok) throw new Error('Team video could not be downloaded');
    const clip = await response.blob();
    if (finished) return;
    objectUrl = URL.createObjectURL(clip);
  } catch {
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
      canvas.width = 1;
      canvas.height = 1;
      canvas.setAttribute('aria-hidden', 'true');
      portrait.append(canvas);
      portraitSizes.observe(portrait);
      return {canvas,portrait,context:canvas.getContext('2d',{alpha:false})};
    });
    if (crops.some(crop => !crop.context)) { finish(); return; }
    resizeCrops();
  }, { once: true });
  video.addEventListener('canplay', tryPlayback);
  video.addEventListener('playing', render, { once: true });
  stage.append(video);
  video.src = objectUrl;
}

const visiblePortraits = new Set();
function tryPlayback() {
  if (finished || started || document.hidden || visiblePortraits.size !== portraits.length ||
      !video || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return;
  started = true;
  observer.disconnect();
  video.play().catch(finish);
}

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.intersectionRatio >= .5) visiblePortraits.add(entry.target);
    else visiblePortraits.delete(entry.target);
  }
  tryPlayback();
}, {threshold:[0,.5], rootMargin:'-64px 0px 0px'});
const preloadObserver = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  preloadObserver.disconnect();
  prepareVideo();
}, {rootMargin:'850px 0px'});

if (team.dataset.teamVideo && !reducedMotion.matches) {
  team.setAttribute('data-team-motion', '');
  portraits.forEach(portrait => observer.observe(portrait));
  preloadObserver.observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (finished) return;
    if (!started) { tryPlayback(); return; }
    if (document.hidden) video.pause();
    else video.play().catch(finish);
  });
  window.addEventListener('pagehide',event => {
    if (!event.persisted) finish();
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) finish();
  });
}
