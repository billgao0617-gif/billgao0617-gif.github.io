const journey = document.querySelector('.journey');
const navigationType = performance.getEntriesByType('navigation')[0]?.type;
const isFirstNavigation = navigationType !== 'back_forward' && navigationType !== 'reload';
const board = journey.querySelector('.journey-board');
const viewport = board.querySelector('.journey-viewport');
const rail = board.querySelector('.journey-rail');
const nodes = [...rail.querySelectorAll('.journey-nodes a')];
const steps = [...board.querySelectorAll('.journey-step')];
const railDescription = document.createElement('p');
railDescription.className = 'journey-rail-description';
rail.querySelector('.journey-scroll-hint').before(railDescription);
const distance = board.querySelector('.journey-distance');
const art = board.querySelector('.journey-art');
const drawingPlate = art.querySelector('.journey-drawing');
const end = art.querySelector('.journey-end');
const host = art.querySelector('.journey-canvas');
const marker = art.querySelector('.journey-marker');
const markerName = marker.querySelector('.journey-marker-name');
const shotLabel = art.querySelector('.journey-shot-label');
const tether = end.querySelector('.journey-tether-path');
const toolbar = viewport.querySelector('.journey-stage-toolbar');
const sceneTitle = toolbar.querySelector('.journey-stage-title');
const loadingStatus = document.createElement('span');
loadingStatus.className = 'journey-stage-loading';
loadingStatus.setAttribute('role','status');
loadingStatus.hidden = true;
toolbar.append(loadingStatus);
const technicalNote = art.querySelector('.journey-technical-note');
const testSymbol = art.querySelector('.journey-test-symbol');
const stillImages = steps.map(step => step.querySelector('.journey-still img'));
const localImages = [...stillImages, journey.querySelector('.journey-chamber-still')];
for (const image of localImages) image.dataset.altEn = image.alt;
const fallback = document.createElement('img');
fallback.alt = '';
fallback.className = 'journey-live-fallback';
host.before(fallback);

// Each unit represents a second at the design scroll pace. The user controls progress.
const chamberHandoffDistance = .68;
const stops = [0, 2, 6, 15+chamberHandoffDistance, 21+chamberHandoffDistance, 23+chamberHandoffDistance];
const storyLength = stops.at(-1);
const landings = [0, 2.12, 6.15, 15.15+chamberHandoffDistance, 21.10+chamberHandoffDistance];
const notes = [
  ['Grip, quick release and tethering for gloved work.', '面向戴手套操作设计握持、快拆与系留。'],
  ['The modular SmartTorque prototype is in development.', '模块化 SmartTorque 原型已成形，仍在研发中。'],
  ['Repeatable locking and environmental exposure are planned tests.', '下一步计划验证锁止可靠性与环境适应性。'],
  ['Refine the prototype into a product concept with an integrated display.', '将原型迭代为带一体化屏幕的产品概念。'],
  ['Qualification and acceptance come before mission use.', '任务应用以完成所需鉴定与验收为前提。']
];
const assemblyMarks = [
  {name: ['Drive carrier','传动支座'], from: .073, to: .173, id: 7},
  {name: ['Transmission gear','传动齿轮'], from: .240, to: .365, id: 8},
  {name: ['Encoder shaft','编码轴'], from: .366, to: .491, id: 3},
  {name: ['Control board','控制主板'], from: .555, to: .673, id: 13},
  {name: ['LCD module','LCD 模块'], from: .755, to: .848, id: 12},
  {name: ['Socket driver','套筒接头'], from: .906, to: .987, id: 27}
];
const shotLabels = [
  ['Drawing derived from prototype CAD','原版 CAD 侧视示意'],
  ['Prototype CAD assembly','原型 CAD 装配示意'],
  ['Illustrative test fixture','试验台架示意'],
  ['Integrated product concept','集成产品概念示意'],
  ['EVA concept','舱外作业概念示意']
];
const exposureSteps = [
  ['Seal the chamber','关闭试验舱'],
  ['Radiation · planned','辐射 · 计划验证'],
  ['Low temperature · planned','低温 · 计划验证'],
  ['High temperature · planned','高温 · 计划验证'],
  ['Check tool response','检查工具响应']
];
const debugCopy = [
  ['Voice input → wake','语音输入 → 唤醒'],
  ['Direction → forward','方向设定 → 正转'],
  ['Target → one turn → stop','目标 → 一圈 → 停止']
];
const missionMarks = [
  {x:313/1672,y:273/941,name:['Socket on the fastener','套筒对准舱壁螺丝']},
  {x:1329/1672,y:645/941,name:['Tether clipped to the suit','系留绳连接宇航服']}
];
const media = matchMedia('(prefers-reduced-motion: reduce), (max-height: 485px)');
const narrow = matchMedia('(max-width: 720px)');
const anchors = stops.slice(0,-1).map(() => {
  const anchor = document.createElement('div');
  anchor.className = 'journey-scroll-anchor';
  return anchor;
});
distance.append(...anchors);
const mark2D = {x: .5, y: .5};
const frame = {
  progress: 0, assembly: 0, bench: 0, clamp: 0, inspection: 0, chamber: 0, interface: 0,
  door: 0, conditioning: 0, lcdCheck: 0, driveCheck: 0, releaseCheck: 0,
  dock: 0, task: 0, glint: 0, light: false, mark: 0, inspectMark: 0, anchorX: 0, anchorY: 0
};
const unit = x => Math.max(0, Math.min(1, x));
function ease(start,end,x) {
  const t = unit((x-start)/(end-start));
  return t*t*(3-2*t);
}

let working = false;
let inView = false;
let loaded = false;
let failed = false;
let scene, request = 0, lastTime = 0;
let active = -1, language = 0, progress = 0, target = 0;
let width = 0, height = 0, storyTop = 0, travel = 1;
let finalPlateReady = false, lastFallbackIndex;
let dirty = true, disposed = false, chapterChosen = false;
const drawingHandoff = 1.82;
const background = end.querySelector('img');
background.decode().then(() => { finalPlateReady = true; refresh(); }).catch(() => {});

function refresh() {
  dirty = true;
  schedule();
}

function positionAt(value) {
  scrollTo({top:storyTop + value/storyLength*travel,behavior:'instant'});
  target = progress = value;
  refresh();
}

function setActive(index) {
  if (index === active) return;
  active = index;
  board.dataset.chapter = index;
  for (let i = 0; i < nodes.length; i++) {
    if (i === index) nodes[i].setAttribute('aria-current','location');
    else nodes[i].removeAttribute('aria-current');
    steps[i].hidden = working && i !== index;
  }
  railDescription.textContent = notes[index][language];
  shotLabel.textContent = shotLabels[index][language];
}

function localize() {
  language = document.documentElement.lang.startsWith('zh') ? 1 : 0;
  for (const node of journey.querySelectorAll('[data-label-en]')) {
    node.setAttribute('aria-label', language ? node.dataset.labelZh : node.dataset.labelEn);
  }
  for (const image of localImages) image.alt = language ? image.dataset.altZh : image.dataset.altEn;
  if (active >= 0) {
    railDescription.textContent = notes[active][language];
    shotLabel.textContent = shotLabels[active][language];
  }
  refresh();
}

function updateTrack() {
  if (working) {
    target = unit((scrollY - storyTop) / travel) * storyLength;
    schedule();
    return;
  }
  let index = 0;
  const readingLine = innerHeight * .43;
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].getBoundingClientRect().top < readingLine) index = i;
  }
  setActive(index);
  rail.style.setProperty('--journey-rail-progress', `${index * 25}%`);
}

function measure() {
  if (!working) { updateTrack(); return; }
  const topMargin = parseFloat(getComputedStyle(viewport).top);
  storyTop = distance.getBoundingClientRect().top + scrollY - topMargin;
  travel = innerHeight * storyLength * (narrow.matches ? .24 : .29);
  for (let i = 0; i < anchors.length; i++) {
    const next = landings[i+1] ?? storyLength;
    anchors[i].style.height = `${(next - landings[i]) / storyLength * travel}px`;
  }
  distance.style.paddingBottom = `${viewport.offsetHeight + 5}px`;
  const nextWidth = art.clientWidth;
  const nextHeight = art.clientHeight;
  if (nextWidth !== width || nextHeight !== height) {
    width = nextWidth;
    height = nextHeight;
    scene?.resize(width,height);
  }
  updateTrack();
  refresh();
}

function selectedAnchor() {
  const id = location.hash.slice(1);
  return nodes.findIndex(node => node.hash === '#' + id);
}

function go(index) {
  if (index < 0) return;
  chapterChosen = index > 0;
  if (working) {
    positionAt(landings[index]);
    setActive(index);
  } else {
    steps[index].scrollIntoView({block:'start',behavior:'instant'});
    updateTrack();
  }
}

function setMode() {
  const index = active;
  const hadMotion = working;
  working = !media.matches;
  journey.toggleAttribute('data-motion',working);
  toolbar.hidden = !working;
  journey.toggleAttribute('data-live',working && Boolean(scene));
  if (working) {
    for (let i = 0; i < anchors.length; i++) {
      anchors[i].id = nodes[i].hash.slice(1);
      steps[i].removeAttribute('id');
    }
  } else {
    cancelAnimationFrame(request);
    request = 0;
    for (let i = 0; i < steps.length; i++) {
      steps[i].id = nodes[i].hash.slice(1);
      anchors[i].removeAttribute('id');
    }
  }
  active = -1;
  setActive(Math.max(0,index));
  measure();
  const linked = selectedAnchor();
  if (linked >= 0) go(linked);
  else if (hadMotion !== working && index > 0) go(index);
  if (working && inView) loadScene();
  if (!working) loadingStatus.hidden = true;
}

function slideImage(plate, point, zoom, percentX) {
  const image = plate.querySelector('img');
  if (!image.naturalWidth) return null;
  const scale = Math.max(width/image.naturalWidth,height/image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  const baseX = (point.x * w + (width-w)*percentX) / width;
  const baseY = (point.y * h + (height-h)*.5) / height;
  const originX = .25;
  const originY = .35;
  return { x: originX+(baseX-originX)*zoom, y: originY+(baseY-originY)*zoom };
}

function drawTether(zoom, amount, visibility) {
  const hidden = amount <= .002 || visibility <= .002;
  tether.toggleAttribute('hidden',hidden);
  if (hidden) return;
  const scale = Math.max(width/background.naturalWidth,height/background.naturalHeight);
  const w = background.naturalWidth * scale;
  const h = background.naturalHeight * scale;
  tether.style.left = `${width*.25+((width-w)*(narrow.matches ? .51 : .5)-width*.25)*zoom}px`;
  tether.style.top = `${height*.35+((height-h)*.5-height*.35)*zoom}px`;
  tether.style.width = `${w*zoom}px`;
  tether.style.height = `${h*zoom}px`;
  tether.style.opacity = visibility;
  tether.style.setProperty('--remaining-tether',1-amount);
}

function markerAt(point, name, opacity, beam = 0, edge = .07) {
  marker.hidden = !point || !name || opacity < .02 || point.x < edge || point.x > 1-edge-.02 || point.y < .12 || point.y > .83;
  if (marker.hidden) return;
  marker.style.left = `${point.x*100}%`;
  marker.style.top = `${point.y*100}%`;
  marker.style.opacity = opacity;
  marker.style.setProperty('--marker-beam',beam);
  marker.style.setProperty('--marker-spread',1.65-.65*beam);
  marker.toggleAttribute('data-left', point.x > (narrow.matches ? .47 : .66));
  const text = name[language];
  if (markerName.textContent !== text) markerName.textContent = text;
}

function stageHeading(index, focus) {
  const title = focus ? focus[language] : nodes[index].querySelector('.journey-node-label').textContent;
  if (sceneTitle.textContent !== title) sceneTitle.textContent = title;
}

function staticImage(index, exposure) {
  const shown = !scene && index > 0 && index < 4;
  const image = exposure >= 0 ? localImages.at(-1) : stillImages[index];
  if (shown && image !== lastFallbackIndex) {
    fallback.src = image.getAttribute('src');
    lastFallbackIndex = image;
  }
  fallback.hidden = !shown;
}

function render(scrollDistance) {
  // Reserve more travel for the mechanical handoff before the three exposure checks.
  const value = scrollDistance < 7 ? scrollDistance :
    scrollDistance < 8+chamberHandoffDistance ? 7+unit((scrollDistance-7)/(1+chamberHandoffDistance)) :
    scrollDistance-chamberHandoffDistance;
  const index = value < 2 ? 0 : value < 6 ? 1 : value < 15 ? 2 : value < 21 ? 3 : 4;
  setActive(index);
  const fraction = unit((scrollDistance-stops[index]) / (stops[index+1]-stops[index]));
  rail.style.setProperty('--journey-rail-progress', `${25*Math.min(4,index+fraction)}%`);
  art.style.setProperty('--shot-progress', `${fraction*100}%`);
  const drawingOpacity = scene ? 1-ease(1.82,2.34,value) : Number(index === 0);
  const missionFade = finalPlateReady ? ease(21.53,22.10,value) : 0;
  const showEva = finalPlateReady && value >= 21.61;
  const revealingEva = showEva && Boolean(scene) && value < 22.02;
  const zoomOut = 1 + (narrow.matches ? .17 : .34)*(1-ease(21.66,22.88,value));
  drawingPlate.style.opacity = drawingOpacity;
  end.style.opacity = showEva ? 1 : 0;
  end.style.setProperty('--plate-scale',zoomOut);

  const exposure = value >= 7.48 && value < 15 ?
    value < 8 ? 0 : value < 10 ? 1 : value < 12 ? 2 : value < 14 ? 3 : 4 : -1;
  const transfer = value >= 7.27 && value < 7.74;
  const debugging = value >= 6 && value < 7.06;
  const modeling = value >= 2 && value < 3.29;
  const integration = value >= 15 && value < 21;
  frame.progress = value;
  frame.light = document.documentElement.dataset.theme === 'light';
  frame.drawingView = 1-ease(1.95,2.93,value);
  frame.wire = 1-ease(2.28,2.97,value);
  frame.bareOutline = value < 2.33;
  frame.explode = ease(2.89,3.53,value);
  frame.assembly = ease(3.47,5.78,value);
  frame.bench = ease(6.98,7.11,value);
  frame.benchExit = ease(7.32,7.48,value);
  frame.debug = ease(6.40,6.87,value)*(1-ease(6.91,7.06,value));
  frame.debugSpin = ease(6.44,6.89,value);
  frame.clamp = ease(7.10,7.21,value)*(1-ease(7.26,7.32,value));
  frame.inspection = ease(7.13,7.22,value)*(1-ease(7.23,7.38,value));
  frame.chamber = ease(7.48,7.72,value)*(1-ease(16.12,16.69,value));
  frame.door = 1;
  frame.hatch = Math.max(1-ease(7.69,7.99,value),ease(14.88,15.34,value));
  frame.toolLift = ease(15.46,16.18,value)*(1-ease(16.69,17.19,value));
  frame.conditioning = ease(7.94,8.24,value)*(1-.79*ease(14.05,14.83,value));
  frame.scan = unit((value-8)/2);
  frame.exposureKind = exposure > 0 ? Math.min(3,exposure) : 0;
  frame.exposureMix = exposure === 1 ? ease(8,8.17,value) :
    exposure === 2 ? ease(10,10.17,value) :
    exposure === 3 ? ease(12,12.17,value) : 1;
  frame.lcdCheck = ease(14,14.16,value)*(1-ease(14.35,14.60,value));
  frame.driveCheck = ease(14.32,14.72,value);
  frame.releaseCheck = ease(14.64,14.82,value)*(1-ease(14.88,15.06,value));
  frame.inspectMark = value >= 7.10 && value < 7.27;
  frame.iteration = ease(16.96,19.24,value);
  frame.seam = ease(19.10,19.64,value);
  frame.compare = ease(16.45,16.95,value)*(1-ease(19.64,20.03,value));
  frame.interface = ease(20.67,21.48,value);
  frame.dock = ease(21.15,22.10,value);
  frame.task = ease(19.70,20.05,value)*(1-ease(20.44,20.84,value));
  frame.glint = ease(5.58,5.81,value)*(1-ease(5.82,6.10,value)) +
    ease(18.86,19.24,value)*(1-ease(19.35,19.76,value));
  art.style.setProperty('--bench', Math.max(frame.bench*(1-frame.benchExit),frame.chamber));
  const fingerprint = slideImage(end,missionMarks[0],zoomOut,narrow.matches ? .51 : .5);
  frame.anchorX = fingerprint?.x ?? .27;
  frame.anchorY = fingerprint?.y ?? .35;
  art.toggleAttribute('data-eva-reveal',revealingEva);
  if (revealingEva) {
    art.style.setProperty('--eva-origin',`${frame.anchorX*100}% ${frame.anchorY*100}%`);
    art.style.setProperty('--eva-edge',`${-12+114*ease(21.61,22.02,value)}%`);
  }
  const part = index === 1 ? assemblyMarks.find(mark => frame.assembly >= mark.from && frame.assembly < mark.to) : null;
  const checking = exposure === 4;
  board.dataset.exposure = exposure < 0 ? '' : String(exposure);
  const usingSymbol = exposure >= 1 && exposure <= 3;
  testSymbol.hidden = !usingSymbol;
  if (usingSymbol && testSymbol.dataset.kind !== String(exposure)) testSymbol.dataset.kind = exposure;
  const exit = value >= 14.88 && value < 16.69;
  const shot = exit ? shotLabels[2] : index === 3 && value < 17.21 ? shotLabels[1] : shotLabels[index];
  if (shotLabel.textContent !== shot[language]) shotLabel.textContent = shot[language];
  const focus = index === 0 ? ['Technical drawing','结构图纸'] :
    modeling ? ['CAD modeling','CAD 建模'] :
    debugging ? ['Software debug','软件调试'] :
    transfer ? value < 7.48 ? ['Retract the test fixture','试验夹具退场'] :
      ['Align the open chamber','开盖试验箱对位'] :
    exit ? value < 15.46 ? ['Open the chamber lid','打开试验箱上盖'] :
      ['Lift out the prototype','原型升出试验箱'] :
    integration ? value < 16.96 ? ['Open prototype','外露结构原型'] :
      value < 18.55 ? ['Align the new housing','新外壳对位'] :
      value < 19.36 ? ['Seat the display','屏幕与边框落座'] :
      ['Integrated product design','集成后的产品形态'] :
    exposureSteps[exposure];
  stageHeading(index, focus);
  const detail = index === 0 ? ['SIDE VIEW / ASSEMBLY OUTLINE','侧视图 / 装配轮廓'] :
    debugging ? debugCopy[value < 6.34 ? 0 : value < 6.66 ? 1 : 2] :
    checking && !exit ? ['DISPLAY / DRIVE / QUICK RELEASE','显示 / 传动 / 快拆'] : null;
  technicalNote.hidden = !detail;
  if (detail && technicalNote.textContent !== detail[language]) technicalNote.textContent = detail[language];
  art.toggleAttribute('data-drawing',value < 2.26);
  frame.mark = part?.id ?? (debugging || checking && value < 14.33 ? 12 : checking ? (value < 14.63 ? 27 : 5) : 0);
  const opacity = (1-drawingOpacity)*Number(!showEva || revealingEva);
  host.style.opacity = opacity;
  const liveMarker = scene && opacity > .002 && scene.render(frame,mark2D);
  staticImage(index,exposure);
  const mappedTether = finalPlateReady ? ease(22.10,22.83,value) : 0;
  const settle = 1-ease(22.77,22.98,value);
  drawTether(zoomOut,mappedTether,.82*settle);
  if (index === 4) {
    const hotspot = missionMarks[value < 22.45 ? 0 : 1];
    const point = slideImage(end,hotspot,zoomOut,narrow.matches ? .51 : .5);
    markerAt(point,hotspot.name,missionFade*.93*settle,.48*settle,.025);
  } else {
    const name = part?.name ?? (debugging ? ['LCD feedback','屏幕反馈'] :
      checking ? value < 14.33 ? ['Display check','屏幕检查'] :
        value < 14.63 ? ['Drive response','传动响应'] : ['Quick-release check','快拆检查'] :
      frame.inspectMark ? ['Locking fixture','锁止测试夹具'] : null);
    markerAt(liveMarker ? mark2D : null,name,opacity);
  }
}

function draw(time) {
  request = 0;
  if (!inView || document.hidden || !working || !width || !height) return;
  const dt = lastTime ? Math.min(150,time-lastTime) : 16.7;
  lastTime = time;
  const waiting = !scene && !failed && !chapterChosen && target > drawingHandoff;
  const goal = waiting ? drawingHandoff : target;
  const copy = language ? '正在准备 3D 装配…' : 'Preparing the 3D assembly…';
  if (loadingStatus.textContent !== copy) loadingStatus.textContent = copy;
  loadingStatus.hidden = !waiting;
  const delta = goal - progress;
  const offset = Math.abs(delta);
  progress = offset < .012 || offset > 2.5 ? goal : progress + delta*(1-Math.exp(-dt/68));
  if (delta || dirty) {
    render(progress);
    dirty = false;
  }
  if (goal !== progress) schedule();
  else lastTime = 0;
}

function schedule() {
  if (working && inView && !document.hidden && !request) request = requestAnimationFrame(draw);
}

function loadScene() {
  if (loaded || failed || !working) return;
  loaded = true;
  import('./journey-scene.js?v=9df3ad93200b').then(({buildJourneyScene}) => buildJourneyScene(host)).then(result => {
    if (disposed) { result.release(); return; }
    scene = result;
    if (width && height) scene.resize(width,height);
    journey.toggleAttribute('data-live',working);
    if (isFirstNavigation && working && inView && !chapterChosen && target > drawingHandoff && target < storyLength) {
      positionAt(drawingHandoff);
    }
    refresh();
  }).catch(() => { failed = true; refresh(); });
}

for (const link of nodes) {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null,'',link.hash);
    go(nodes.findIndex(node => node.hash === link.hash));
  });
}
const visible = new IntersectionObserver(([entry]) => {
  inView = entry.isIntersecting;
  if (inView) {
    loadScene();
    progress = target;
    refresh();
  } else {
    cancelAnimationFrame(request);
    request = lastTime = 0;
  }
});
visible.observe(viewport);
const nearby = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) loadScene();
}, {rootMargin:'620px 0px'});
nearby.observe(viewport);
new ResizeObserver(measure).observe(viewport);
let layoutWidth = innerWidth;
window.addEventListener('resize', () => {
  const prior = target;
  const reflow = working && inView && layoutWidth !== innerWidth && prior > 0 && prior < storyLength;
  layoutWidth = innerWidth;
  measure();
  if (reflow) positionAt(prior);
}, {passive:true});
window.addEventListener('scroll', updateTrack, {passive:true});
window.addEventListener('site-language-change', localize);
window.addEventListener('site-theme-change', refresh);
window.addEventListener('popstate', () => { const index = selectedAnchor(); if (index >= 0) go(index); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
media.addEventListener('change', setMode);
for (const picture of art.querySelectorAll('.journey-plate img')) picture.addEventListener('load',refresh);
host.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  failed = true;
  scene?.release();
  scene = undefined;
  journey.removeAttribute('data-live');
  refresh();
}, true);
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  disposed = true;
  scene?.release();
});
setMode();
localize();
