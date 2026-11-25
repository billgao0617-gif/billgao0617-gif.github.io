import { Vector3 } from 'three';
import { buildStoryScene } from './smarttorque-story-scene.js?v=8de27df83091';
import { ease, voiceStart, tetherStart, positionStoryParts, attachmentAt, evaCamera, storyProgress } from './smarttorque-story-timeline.js?v=c19916e3a44c';

const story = document.querySelector('.smart-story');
const stage = story.querySelector('.smart-story-stage');
const page = document.documentElement;
const navigationType = performance.getEntriesByType('navigation')[0]?.type;
const isFirstNavigation = navigationType !== 'back_forward' && navigationType !== 'reload';
const begin = story.querySelector('.smart-story-begin');
const intro = story.querySelector('.smart-story-intro');
const finish = story.querySelector('.smart-story-finish');
const hero = story.querySelector('.smart-story-hero');
const canvasHost = story.querySelector('.smart-story-model');
const eva = story.querySelector('.smart-story-eva');
const evaFrame = story.querySelector('#smart-story-eva-frame');
const evaGlove = story.querySelector('.smart-story-eva-glove');
let photographLoaded = false;
const caption = story.querySelector('.smart-story-caption');
const title = caption.querySelector('h2');
const description = caption.querySelector('p');
const labels = caption.querySelector('ul');
const tabs = [...labels.children];
const voice = caption.querySelector('.smart-story-voice');
const wave = caption.querySelector('.smart-story-wave');
const wakeStatus = caption.querySelector('.smart-story-wake-status');
const fallback = story.querySelector('.smart-story-fallback');
const unavailable = fallback.querySelector('figcaption');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const portraitHero = matchMedia('(max-aspect-ratio: 11/10)');
const copy = {
  intro: ['SmartTorque', 'One body. Space-ready.', 'SmartTorque', '一机多用，面向舱外作业'],
  heads: ['Quick release', 'Lock the head in. See it work.', '多头快拆', '接头锁紧后，展示实际开合'],
  transmission: ['Inside the drive', 'The drive gear and links move the jaws.', '传动剖视', '齿轮和连杆带动钳口开合'],
  voice: ['“智能工具”', 'Wake the display. Command a grip.', '「智能工具」', '唤醒屏幕后，确认夹持指令'],
  fasten: ['Drive the fastener', 'The socket seats the bolt against the panel.', '拧紧螺丝', '套筒带动螺丝贴紧舱壁'],
  tether: ['Stay connected in zero-G', 'Seat the ring, clip in and draw the tether.', '舱外系留', '弧形环扣接上锁扣，再拉出系留绳']
};
const interpolate = (x, y, amount) => x + (y - x) * amount;
const finalActionStart = .969;
const fovFactor = 2 * Math.tan(31 * Math.PI / 360);
const frame = {
  width: 1, height: 1, shiftX: 0, shiftY: 0, progress: 0, distance: 1,
  aim: new Vector3(), heads: {driver: 0, pliers: .43, scissors: .43},
  open: {pliers: 0, scissors: 0}, yaw: 0, elevation: 0, roll: 0, pitch: 0,
  ring: 0, clip: 0, gate: 0, tether: 0, pull: 0, ringVisible: false, clipVisible: false,
  lcd: -1, screenAlpha: 0, wave: 0, voiceTime: 0, actionProgress: 0, unlock: 0, wakePhase: 0, chinese: false,
  dock: 0, spin: 0, sideView: 0, highlight: 0, eva: 0, evaScale: 1, evaX: 0, evaY: 0,
  light: document.documentElement.dataset.theme === 'light'
};
let scene, load, loadFailed = false, visible = false, pageDisposed = false;
let current = 0, target = 0, pending = 0, timestamp = 0, dirty = true;
let sectionTop = 0, travel = 1, handWidth = 1, handX = 0, handY = 0;
let act, attachment = -1, wakePhase = -1;

function localize() {
  const chinese = document.documentElement.lang.startsWith('zh');
  frame.chinese = chinese;
  for (const node of story.querySelectorAll('[data-en]')) {
    node.textContent = chinese ? node.dataset.zh : node.dataset.en;
  }
  const poster = fallback.querySelector('img');
  poster.alt = chinese ? poster.dataset.altZh : poster.dataset.altEn;
  if (!act) return;
  title.textContent = copy[act][chinese ? 2 : 0];
  description.textContent = copy[act][chinese ? 3 : 1];
  if (act === 'voice') renderWakeStatus();
}

function renderWakeStatus() {
  const phases = frame.chinese ? ['唤醒词', '正在唤醒', '夹持指令', '夹持完成'] : ['Wake phrase', 'Waking', 'Grip command', 'Grip complete'];
  wakeStatus.textContent = phases[wakePhase] ?? phases[0];
}

function positionPhotograph(width, height) {
  const portrait = portraitHero.matches;
  const imageHeight = portrait ? Math.min(height*.74,Math.max(width*1.02,height*.505)) : height;
  const scale = Math.max(width/evaCamera.width,imageHeight/evaCamera.height);
  const renderedWidth = evaCamera.width * scale;
  const renderedHeight = evaCamera.height * scale;
  const left = (width-renderedWidth) * (portrait ? .42 : .55);
  const top = (height-renderedHeight) * .48;
  stage.style.setProperty('--eva-width',`${renderedWidth}px`);
  stage.style.setProperty('--eva-height',`${renderedHeight}px`);
  stage.style.setProperty('--eva-left',`${left}px`);
  stage.style.setProperty('--eva-top',`${top}px`);
  frame.evaScale = scale;
  frame.evaX = left + evaCamera.x * scale - width / 2;
  frame.evaY = top + evaCamera.y * scale - height / 2;
}

function loadPhotograph() {
  const template = evaFrame.content.firstElementChild;
  const images = [eva,evaGlove].map(layer => {
    const image = template.cloneNode();
    image.fetchPriority = 'low';
    image.decoding = 'async';
    layer.append(image);
    return image;
  });
  Promise.all(images.map(image => image.decode())).then(() => {
    photographLoaded = true;
    dirty = true;
    schedule();
  }).catch(() => {});
}

function measure() {
  if (!scene) return;
  const bounds = story.getBoundingClientRect();
  const height = stage.clientHeight;
  const width = stage.clientWidth;
  if (height === 0 || width === 0) return;
  sectionTop = bounds.top + window.scrollY - parseFloat(getComputedStyle(stage).top);
  travel = Math.max(1, bounds.height - height);
  // Normalize the crop the same way as the cover image. Its photographed drive axis
  // is the anchor of the short dissolve from the gloved hand to live geometry.
  const [imageAspect, imageX, imageY, toolWidth, horizontalCrop] = portraitHero.matches
    ? [1024/1536, .599, .552, .610, .65] : [1672/941, .708, .554, .315, .50];
  const coverWidth = Math.max(width, height * imageAspect);
  const coverHeight = coverWidth / imageAspect;
  handWidth = coverWidth * toolWidth;
  handX = imageX * coverWidth - (coverWidth - width) * horizontalCrop - width / 2;
  handY = (imageY - .5) * coverHeight;
  hero.style.transformOrigin = `${50 + 100*handX / width}% ${50 + 100*handY / height}%`;
  positionPhotograph(width,height);
  if (frame.width !== width || frame.height !== height) {
    frame.width = width;
    frame.height = height;
    scene.resize(width, height);
  }
  onScroll();
  dirty = true;
  schedule();
}

function positionTimeline(scrollProgress) {
  const progress = storyProgress(frame,scrollProgress);
  frame.progress = progress;
  const emergence = ease(progress, .015, .146);
  const toSide = ease(progress, .112, .170);
  const toLCD = ease(progress, .530, .584);
  const toJaws = ease(progress, .678, .699);
  const toRing = ease(progress, .779, .857);
  const toLatch = ease(progress, .842, .866);
  const settle = ease(progress, .933, .950);
  const width = frame.width;
  const height = frame.height;
  const mobile = width < 650;
  const featureWidth = interpolate(.264, .288, ease(progress, .151, .205)*(1-ease(progress,.52,.58)));
  const shortViewport = height < 440;
  const verticalFit = shortViewport ? .57 : .67;
  const heroDistance = .258 * height / (fovFactor * handWidth);
  const mainDistance = Math.max(featureWidth * height / (fovFactor * width * (mobile ? .86 : .67)), .192 / (fovFactor * verticalFit));
  const lcdDistance = Math.max((mobile ? .299 + .014 * toJaws : .213) * height / (fovFactor * width * (mobile ? .90 : .72)), .164 / (fovFactor * (verticalFit + .02)));
  const ringDistance = Math.max((mobile ? .272 : .166) * height / (fovFactor * width * (mobile ? .85 : .56)), .153 / (fovFactor * (verticalFit + .02)));
  frame.distance = interpolate(interpolate(interpolate(interpolate(heroDistance, mainDistance, emergence), lcdDistance, toLCD),
    ringDistance, toRing), ringDistance*1.04, settle) * (1-.113*toLatch*(1-settle));
  frame.yaw = interpolate(interpolate(interpolate(interpolate(interpolate(.195,.48,emergence),
    .23,toSide), interpolate(.22,.34,toJaws),toLCD), .65,toRing), .51,settle);
  frame.elevation = interpolate(interpolate(interpolate(interpolate(interpolate(.29,.43,emergence),
    .255,toSide), interpolate(1.04,.54,toJaws),toLCD), .24,toRing), .32,settle);
  frame.roll = -.13 * emergence * (1 - toSide) - .05 * toRing * (1 - settle);
  frame.pitch = .06 * emergence * (1 - toSide) - .035 * toRing * (1 - settle);
  frame.aim.set(
    interpolate(interpolate(interpolate(interpolate(.02, .024, emergence) + .015 * toSide * (1 - toLCD), interpolate(mobile ? .027 : .010,.039,toJaws), toLCD), mobile ? .039 : .044, toRing), mobile ? .040 : .059, settle),
    interpolate(interpolate(interpolate(interpolate(.002, -.037, emergence), -.008, toLCD), -.023, toRing), -.012, settle),
    interpolate(0, .037, toRing)
  );
  frame.shiftX = interpolate(handX, 0, emergence);
  frame.shiftY = interpolate(handY, -height * (shortViewport ? .10 : mobile ? .015 : .065), emergence);

  positionStoryParts(frame, progress);
  const transmission = frame.transmissionTime;
  const inspect = ease(transmission,0,.158) * (1-ease(transmission,.855,1));
  const focusDistance = Math.max(.384,.195*height/(fovFactor*width*(mobile ? .88 : .58)));
  frame.aim.x = interpolate(frame.aim.x,.056,inspect);
  frame.aim.y = interpolate(frame.aim.y,.007,inspect);
  frame.distance = interpolate(frame.distance,focusDistance,inspect);
  frame.yaw = interpolate(frame.yaw,.36,inspect);
  frame.elevation = interpolate(frame.elevation,.31,inspect);
  frame.shiftY = interpolate(frame.shiftY,-height*(shortViewport ? .125 : .065),inspect);
  const fastening = ease(frame.fasteningTime,0,.34) * (1-ease(frame.fasteningTime,.935,1));
  const sideDistance=Math.max(.358,.170*height/(fovFactor*width*(mobile ? .89 : .65)));
  frame.aim.x = interpolate(frame.aim.x,.127,fastening);
  frame.aim.y = interpolate(frame.aim.y,0,fastening);
  frame.aim.z = interpolate(frame.aim.z,-.004,fastening);
  frame.distance = interpolate(frame.distance,sideDistance,fastening);
  frame.yaw = interpolate(frame.yaw,-.115,fastening);
  frame.elevation = interpolate(frame.elevation,.17,fastening);
  frame.shiftY = interpolate(frame.shiftY,-height*(shortViewport ? .125 : .068),fastening);
  const ready = photographLoaded;
  frame.spin = ready ? ease(progress,.936,.980) : 0;
  frame.dock = ready ? ease(progress,.943,.986) : 0;
  frame.sideView = ready ? ease(progress,.953,.985) : 0;
  frame.eva = ready ? ease(progress,.972,.987) : 0;
  frame.highlight = ready ? ease(progress,.987,.994) * (1-.58*ease(progress,.995,1)) : 0;
}

function updateOverlays(progress) {
  const cut = ease(progress, .019, .121);
  const heroZoom = 1 + .70 * ease(progress, 0, .12);
  hero.style.transform = `scale(${heroZoom})`;
  hero.style.opacity = 1 - cut;
  hero.style.filter = cut > 0 && cut < 1 ? `blur(${cut * 7}px)` : '';
  eva.style.opacity = frame.eva;
  evaGlove.style.opacity = frame.eva * ease(frame.dock,.92,1);
  stage.style.setProperty('--eva-focus', frame.highlight * .19);
  canvasHost.style.opacity = cut;
  intro.style.opacity = 1 - ease(progress,.008,.055);
  intro.style.visibility = progress > .055 ? 'hidden' : 'visible';
  // Reserve the last few scroll frames for the CTA, after the docking shot has settled.
  finish.hidden = current < finalActionStart && !finish.contains(document.activeElement);
  const transmission = frame.transmissionTime;
  let nextAct = 'tether';
  if (transmission >= 0 && transmission < 1) nextAct = 'transmission';
  else if (frame.fasteningTime >= 0 && frame.fasteningTime < 1) nextAct = 'fasten';
  else if (progress < .15) nextAct = 'intro';
  else if (progress < voiceStart) nextAct = 'heads';
  else if (progress < tetherStart) nextAct = 'voice';
  if (nextAct !== act) {
    act = nextAct;
    labels.hidden = act !== 'heads';
    voice.hidden = act !== 'voice';
    localize();
  }
  if (progress > .045) story.setAttribute('data-started','');
  else if (document.activeElement !== begin) story.removeAttribute('data-started');
  caption.hidden = progress < .067;
  caption.style.opacity = ease(progress,.064,.13) * (1 - ease(frame.dock,.15,.6));
  if (act === 'voice') {
    const phase = frame.wakePhase;
    if (phase !== wakePhase) {
      wakePhase = phase;
      renderWakeStatus();
    }
    wave.style.setProperty('--voice-pulse', frame.wave);
  }
  const nextAttachment = attachmentAt(progress);
  if (nextAttachment !== attachment) {
    attachment = nextAttachment;
    tabs.forEach((tab, index) => tab.setAttribute('aria-current', index === attachment ? 'true' : 'false'));
  }
}

function schedule() {
  if (!scene || !visible || document.hidden || !story.hasAttribute('data-playing') || pending) return;
  pending = requestAnimationFrame(tick);
}

function stop() {
  cancelAnimationFrame(pending);
  pending = 0;
  timestamp = 0;
}

function tick(now) {
  pending = 0;
  if (!visible || document.hidden || !story.hasAttribute('data-playing')) return;
  const elapsed = timestamp ? Math.min(66, now - timestamp) : 16.7;
  timestamp = now;
  const error = target - current;
  current = Math.abs(error) < .001 ? target : current + error * (1 - Math.exp(-elapsed / 110));
  if (error !== 0 || dirty) {
    positionTimeline(current);
    // Don't dissolve the hero underneath an empty canvas. If drawing fails,
    // keep the product visible and stop the scroll scene.
    if (current > .016) {
      try {
        scene.render(frame);
      } catch (error) {
        showFallback(error);
        return;
      }
    }
    updateOverlays(frame.progress);
    dirty = false;
  }
  if (current !== target) schedule();
  else timestamp = 0;
}

function onScroll() {
  target = Math.max(0, Math.min(1, (window.scrollY - sectionTop) / travel));
  schedule();
}

function disableMotion() {
  stop();
  const anchor = downstreamAnchor();
  const priorTop = anchor?.getBoundingClientRect().top;
  delete page.dataset.storyPreparing;
  story.removeAttribute('data-playing');
  story.removeAttribute('data-started');
  fallback.hidden = false;
  begin.hidden = true;
  preserveAnchor(anchor, priorTop);
  caption.hidden = true;
  intro.style.visibility = 'visible';
  intro.style.opacity = 1;
  hero.style.cssText = '';
  canvasHost.style.opacity = 0;
  eva.style.opacity = 0;
  evaGlove.style.opacity = 0;
  finish.hidden = true;
}

function showFallback(error) {
  if (loadFailed) return;
  loadFailed = true;
  disableMotion();
  unavailable.hidden = false;
  console.warn('SmartTorque story switched to its still image.', error);
}

function downstreamAnchor() {
  const linked = document.getElementById(location.hash.slice(1));
  if (linked && (story.compareDocumentPosition(linked) & Node.DOCUMENT_POSITION_FOLLOWING) && !story.contains(linked)) {
    // A stale hash should not affect a visitor who has scrolled back to the story.
    if (Math.abs(linked.getBoundingClientRect().top) < innerHeight) return linked;
  }
  if (story.getBoundingClientRect().bottom <= 0) return story.nextElementSibling;
}

function preserveAnchor(anchor, priorTop) {
  if (anchor && Number.isFinite(priorTop)) {
    scrollBy({top:anchor.getBoundingClientRect().top - priorTop,behavior:'instant'});
  }
}

function enableMotion() {
  if (!scene || reducedMotion.matches || loadFailed || story.hasAttribute('data-playing')) return;
  const preparing = page.hasAttribute('data-story-preparing');
  const anchor = downstreamAnchor();
  const priorTop = anchor?.getBoundingClientRect().top;
  story.setAttribute('data-playing','');
  fallback.hidden = true;
  measure();
  positionTimeline(0);
  // Confirm the first GL frame before exposing the scroll cue.
  scene.render(frame);
  delete page.dataset.storyPreparing;
  begin.hidden = false;
  preserveAnchor(anchor, priorTop);
  measure();
  const bounds = story.getBoundingClientRect();
  if (isFirstNavigation && preparing && !anchor && bounds.top <= innerHeight && bounds.bottom > stage.clientHeight && target > .018) {
    // Continue from the opening shot after a fast first scroll on a cold load.
    scrollTo({top:sectionTop,behavior:'instant'});
    onScroll();
  }
  current = target;
  dirty = true;
  schedule();
}

function loadWhenNear() {
  if (scene) {
    try { enableMotion(); } catch (error) { showFallback(error); }
    return;
  }
  if (reducedMotion.matches || load || loadFailed) return;
  loadPhotograph();
  load = buildStoryScene(canvasHost).then(result => {
    if (pageDisposed) { result.release(); return; }
    scene = result;
    enableMotion();
  }).catch(showFallback);
}

canvasHost.style.opacity = 0;
window.addEventListener('site-language-change', () => { localize(); dirty = true; schedule(); });
window.addEventListener('site-theme-change', () => {
  frame.light = document.documentElement.dataset.theme === 'light';
  dirty = true;
  schedule();
});
begin.addEventListener('click', event => {
  if (event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  // Start just far enough to make the first shot visible for keyboard users.
  story.focus({preventScroll:true});
  scrollTo({top:sectionTop + .082 * travel,behavior:'smooth'});
});
story.querySelector('[data-story-retry]').addEventListener('click', event => {
  if (event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.replaceState(null,'','#product-story');
  story.scrollIntoView({block:'start',behavior:'instant'});
  location.reload();
});
finish.addEventListener('focusout', () => {
  if (current < finalActionStart) finish.hidden = true;
});
localize();
const nearby = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) loadWhenNear();
}, {rootMargin: '480px 0px'});
nearby.observe(stage);
if (page.hasAttribute('data-story-preparing')) loadWhenNear();
const visibility = new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting && entries[0].intersectionRatio > .035;
  if (visible) { current = target; dirty = true; onScroll(); }
  else stop();
}, {threshold: [0, .035], rootMargin: '-55px 0px 0px'});
visibility.observe(stage);
new ResizeObserver(measure).observe(stage);
let layoutWidth = innerWidth;
window.addEventListener('resize', () => {
  const prior = target;
  const reflow = visible && layoutWidth !== innerWidth && prior > 0 && prior < 1 &&
    story.hasAttribute('data-playing');
  layoutWidth = innerWidth;
  measure();
  if (reflow) {
    scrollTo({top:sectionTop + prior * travel,behavior:'instant'});
    onScroll();
  }
}, {passive: true});
window.addEventListener('scroll', onScroll, {passive: true});
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else schedule(); });
portraitHero.addEventListener('change', measure);
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) disableMotion(); else loadWhenNear(); });
canvasHost.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  showFallback(event);
}, true);
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  pageDisposed = true;
  scene?.release();
});
