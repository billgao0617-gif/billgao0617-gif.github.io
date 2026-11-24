import { Vector3 } from 'three';
import { buildStoryScene } from './smarttorque-story-scene.js?v=4f79d4ee514e';

const guide = document.querySelector('#overview');
const model = guide.querySelector('.guide-model');
const host = guide.querySelector('.guide-canvas');
const loading = guide.querySelector('.guide-loading');
const fallback = guide.querySelector('.guide-fallback');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
// Camera presets are fitted to the whole tool, including the mounted socket.
const poses = {
  voice:     { yaw: .38, elevation: .43, distance: .435, x: .023, y: -.039, z: 0 },
  rotation:  { yaw: .18, elevation: .24, distance: .45, x: .032, y: -.041, z: 0 },
  display:   { yaw: .19, elevation: .92, distance: .44, x: .019, y: -.037, z: 0 },
  retention: { yaw: .65, elevation: .33, distance: .46, x: .033, y: -.039, z: .016 }
};
const channels = Object.keys(poses.voice);
const pose = {...poses.voice};
const from = {...pose};
const fov = 2 * Math.tan(31 * Math.PI / 360);
const frame = {
  width: 1, height: 1, aim: new Vector3(), shiftX: 0, shiftY: 0,
  heads: {driver: 0}, unlock: 0, cutaway: 0, roll: -.04, pitch: 0,
  driveGear: 0, driverSpin: 0, ring: 1, ringRise: 1, ringVisible: false,
  clip: 1, clipVisible: false, gate: 0, tether: 0, pull: 0,
  dock: 0, spin: 0, sideView: 0, advance: 0, highlight: 0, evaScale: 1, evaX: 0, evaY: 0,
  wave: 0, voiceTime: 0, lcd: -1, screenAlpha: 0, actionProgress: 0, screenPage: 'overview'
};
const smoothstep = value => value * value * (3 - 2 * value);
const unit = value => Math.max(0, Math.min(1, value));
let feature = guide.querySelector('[data-feature][open]')?.dataset.feature;
let scene, visible = false, closed = false, raf = 0, started;
let appliedWidth = 0, appliedHeight = 0;

function updateLanguage() {
  frame.chinese = document.documentElement.lang.startsWith('zh');
  if (host.hasAttribute('role')) {
    host.setAttribute('aria-label', frame.chinese ? host.dataset.labelZh : host.dataset.labelEn);
  }
  queueDraw();
}

function queueDraw() {
  if (visible && scene && !document.hidden && !raf) raf = requestAnimationFrame(draw);
}

function fail() {
  loading.hidden = true;
  fallback.hidden = false;
  host.removeAttribute('role');
  host.removeAttribute('aria-label');
  model.removeAttribute('data-ready');
  cancelAnimationFrame(raf);
  raf = 0;
  scene?.release();
  scene = undefined;
}

function draw(now) {
  raf = 0;
  if (!visible || !scene || document.hidden) return;
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (!width || !height) return;
  if (width !== appliedWidth || height !== appliedHeight) {
    scene.resize(width,height);
    appliedWidth = width;
    appliedHeight = height;
  }
  started ??= now;
  const reduced = motionPreference.matches;
  const elapsed = reduced ? 1700 : now - started;
  const eased = smoothstep(unit(elapsed / 560));
  const target = poses[feature] ?? poses.voice;
  for (const key of channels) pose[key] = from[key] + (target[key] - from[key]) * eased;
  frame.width = width;
  frame.height = height;
  frame.yaw = pose.yaw;
  frame.elevation = pose.elevation;
  const fitWidth = width < 450 ? .79 : .90;
  frame.distance = Math.max(pose.distance, .279 * height / (fov * width * fitWidth));
  frame.light = document.documentElement.dataset.theme === 'light';
  frame.aim.set(pose.x, pose.y, pose.z);
  const spin = feature === 'rotation' ? smoothstep(unit((elapsed - 200) / 1330)) * (2 * Math.PI) : 0;
  frame.driverSpin = spin;
  frame.driveGear = spin;
  frame.wave = feature === 'voice' ? smoothstep(unit(elapsed / 330)) * .86 : 0;
  frame.voiceTime = Math.min(1.25, elapsed / 1000);
  frame.lcd = feature === 'display' ? 0 : -1;
  frame.screenAlpha = eased;
  frame.ringVisible = feature === 'retention' && eased > .45;
  frame.clipVisible = frame.ringVisible;
  try {
    scene.render(frame);
  } catch {
    fail();
    return;
  }
  loading.hidden = true;
  model.setAttribute('data-ready', '');
  const duration = feature === 'rotation' ? 1530 : feature === 'voice' ? 1250 : 560;
  if (!reduced && elapsed < duration) queueDraw();
}

const loadObserver = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  loadObserver.disconnect();
  loading.hidden = false;
  buildStoryScene(host, {overview: true}).then(result => {
    if (closed) {
      result.release();
      return;
    }
    scene = result;
    queueDraw();
  }).catch(fail);
}, {rootMargin: '200px 0px'});
loadObserver.observe(host);

new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  if (visible) queueDraw();
}).observe(host);
new ResizeObserver(queueDraw).observe(host);

guide.querySelector('#capabilities').addEventListener('toggle', () => {
  const next = guide.querySelector('[data-feature][open]')?.dataset.feature;
  if (next === feature) return;
  feature = next;
  Object.assign(from,pose);
  started = undefined;
  queueDraw();
}, true);

window.addEventListener('site-theme-change', queueDraw);
window.addEventListener('site-language-change', updateLanguage);
updateLanguage();
motionPreference.addEventListener('change', queueDraw);
document.addEventListener('visibilitychange', queueDraw);
host.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  fail();
}, true);
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  closed = true;
  scene?.release();
});
