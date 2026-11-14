(() => {
const stages = [
  {
    "slug": "ground",
    "label": "NOW",
    "title": {
      "en": "Ground Research & Prototyping",
      "zh": "地面研究与原型开发"
    },
    "description": {
      "en": "Develop a modular prototype and evaluate control accuracy and attachment changes for gloved operation.",
      "zh": "围绕戴手套操作需求，开发模块化原型，验证控制精度与换头体验。"
    },
    "status": {
      "en": "Current development focus",
      "zh": "当前研发重点"
    },
    "focus": "<div><svg viewbox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"24\" r=\"8\"></circle><path d=\"m20 5 8 0 2 6 6 3 6-1 4 7-4 5 0 6-6 2-3 6-7 0-3-5-6-2-5 3-5-6 3-6-1-6-5-4 4-7 6 1Z\"></path></svg><span data-i18n-skip data-en=\"Modular prototype\" data-zh=\"模块化原型\">Modular prototype</span></div><div><svg viewbox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M24 4 42 11v12c0 11-8 18-18 22C14 41 6 34 6 23V11Z\"></path><path d=\"m15 24 6 6 13-15\"></path></svg><span data-i18n-skip data-en=\"Gloved operation\" data-zh=\"戴手套操作\">Gloved operation</span></div><div><svg viewbox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"24\" r=\"15\"></circle><circle cx=\"24\" cy=\"24\" r=\"6\"></circle><path d=\"M24 3v10m0 22v10M3 24h10m22 0h10\"></path></svg><span data-i18n-skip data-en=\"Control accuracy\" data-zh=\"控制精度\">Control accuracy</span></div>",
    "image": "/assets/editorial/space-1.jpg",
    "alt": "NASA contextual image of Ground Research & Prototyping"
  },
  {
    "slug": "validation",
    "label": "NEXT",
    "title": {
      "en": "Engineering Validation & Joint Development",
      "zh": "工程验证与协同开发"
    },
    "description": {
      "en": "Work with specialist partners on reliability and environmental testing, refining the tool for specific task requirements.",
      "zh": "联合专业伙伴，开展可靠性与环境测试，推进工具优化与任务适配。"
    },
    "status": {
      "en": "Planned next stage",
      "zh": "下一阶段规划"
    },
    "focus": "<div><svg viewbox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"24\" r=\"8\"></circle><path d=\"m20 5 8 0 2 6 6 3 6-1 4 7-4 5 0 6-6 2-3 6-7 0-3-5-6-2-5 3-5-6 3-6-1-6-5-4 4-7 6 1Z\"></path></svg><span data-i18n-skip data-en=\"Reliability testing\" data-zh=\"可靠性测试\">Reliability testing</span></div><div><svg viewbox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M24 4 42 11v12c0 11-8 18-18 22C14 41 6 34 6 23V11Z\"></path><path d=\"m15 24 6 6 13-15\"></path></svg><span data-i18n-skip data-en=\"Environmental evaluation\" data-zh=\"环境评估\">Environmental evaluation</span></div><div><svg viewbox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"24\" r=\"15\"></circle><circle cx=\"24\" cy=\"24\" r=\"6\"></circle><path d=\"M24 3v10m0 22v10M3 24h10m22 0h10\"></path></svg><span data-i18n-skip data-en=\"Joint development\" data-zh=\"协同开发\">Joint development</span></div>",
    "image": "/assets/editorial/space-2.jpg",
    "alt": "NASA contextual image of Engineering Validation & Joint Development"
  },
  {
    "slug": "missions",
    "label": "FUTURE",
    "title": {
      "en": "Mission Integration & Expanded Applications",
      "zh": "任务集成与应用拓展"
    },
    "description": {
      "en": "Advance toward integration into real EVA missions following the required qualification and acceptance.",
      "zh": "在完成所需鉴定与验收后，逐步推进真实舱外任务的系统集成与应用。"
    },
    "status": {
      "en": "Long-term objective",
      "zh": "长期目标"
    },
    "focus": "<div><svg viewbox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"24\" r=\"8\"></circle><path d=\"m20 5 8 0 2 6 6 3 6-1 4 7-4 5 0 6-6 2-3 6-7 0-3-5-6-2-5 3-5-6 3-6-1-6-5-4 4-7 6 1Z\"></path></svg><span data-i18n-skip data-en=\"Qualification\" data-zh=\"鉴定与验收\">Qualification</span></div><div><svg viewbox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M24 4 42 11v12c0 11-8 18-18 22C14 41 6 34 6 23V11Z\"></path><path d=\"m15 24 6 6 13-15\"></path></svg><span data-i18n-skip data-en=\"Mission-specific interfaces\" data-zh=\"任务接口适配\">Mission-specific interfaces</span></div><div><svg viewbox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"24\" r=\"15\"></circle><circle cx=\"24\" cy=\"24\" r=\"6\"></circle><path d=\"M24 3v10m0 22v10M3 24h10m22 0h10\"></path></svg><span data-i18n-skip data-en=\"System integration\" data-zh=\"系统集成\">System integration</span></div>",
    "image": "/assets/editorial/space-3.jpg",
    "alt": "NASA contextual image of Mission Integration & Expanded Applications"
  }
];
const page = document.querySelector('[data-journey-stage]');
if (!page) return;
const controls = page.querySelector('.journey-swipe-controls');
const heading = page.querySelector('h1');
const description = page.querySelector('.phase-lede');
const status = page.querySelector('.phase-status');
const focus = page.querySelector('.phase-focus');
const photo = page.querySelector('.phase-image img');
const kicker = page.querySelector('.editorial-kicker');
const moving = [heading, description, status, focus, photo];
const previous = controls.querySelector('[data-stage-prev]');
const next = controls.querySelector('[data-stage-next]');
let current = stages.findIndex(stage => stage.slug === page.dataset.journeyStage);
let drag = null, animations = [], suppressClick = false;
const language = () => window.siteLanguage?.() === 'zh' ? 'zh' : 'en';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
stages.forEach(stage => { const image = new Image(); image.src = stage.image; });
photo.draggable = false;

function clearMotion() {
  animations.forEach(animation => animation.cancel());
  animations = [];
  moving.forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
}
function setCopy(el, copy) {
  el.dataset.en = copy.en; el.dataset.zh = copy.zh; el.textContent = copy[language()];
}
function go(index, historyUpdate = true, animate = true) {
  index = Math.max(0, Math.min(stages.length - 1, index));
  const direction = Math.sign(index - current), stage = stages[index];
  clearMotion(); current = index;
  page.dataset.journeyStage = stage.slug;
  setCopy(heading, stage.title); setCopy(description, stage.description); setCopy(status, stage.status);
  focus.innerHTML = stage.focus;
  focus.querySelectorAll('[data-en][data-zh]').forEach(el => { el.textContent = el.dataset[language()]; });
  kicker.textContent = `${stage.label} / 0${index + 1}`;
  if (photo.getAttribute('src') !== stage.image) photo.src = stage.image;
  photo.alt = language() === 'zh' ? `NASA 场景参考：${stage.title.zh}` : stage.alt;
  document.title = `${stage.title[language()]} | Gabbrotech`;
  document.querySelector('meta[name="description"]').content = stage.description[language()];
  controls.querySelector('[data-stage-count]').textContent = `0${index + 1} / 03`;
  controls.querySelector('[role="status"]').textContent = `${stage.label} · ${stage.title[language()]}`;
  previous.disabled = index === 0; next.disabled = index === stages.length - 1;
  previous.setAttribute('aria-label', language() === 'zh' ? '上一阶段' : 'Previous stage');
  next.setAttribute('aria-label', language() === 'zh' ? '下一阶段' : 'Next stage');
  page.setAttribute('aria-label', language() === 'zh' ? '探索阶段，左右拖动切换' : 'Journey stages. Drag left or right to explore');
  const path = `/journey/${stage.slug}/`;
  if (historyUpdate && location.pathname !== path) history.pushState(null, '', path + location.search);
  if (direction && animate && !reduced()) animations = moving.map((el, i) => el.animate(
    [{ opacity: .15, transform: `translateX(${direction * (i === 4 ? 70 : 42)}px)` }, { opacity: 1, transform: 'translateX(0)' }],
    { duration: 420, easing: 'cubic-bezier(.2,.75,.2,1)' }
  ));
}
function settle() {
  if (!reduced()) animations = moving.map(el => el.animate(
    [{ transform: el.style.transform || 'none', opacity: el.style.opacity || 1 }, { transform: 'translateX(0)', opacity: 1 }],
    { duration: 260, easing: 'cubic-bezier(.2,.75,.2,1)' }
  ));
  moving.forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
}
function finish(event, cancelled = false) {
  if (!drag || event.pointerId !== drag.id) return;
  const gesture = drag; drag = null;
  page.classList.remove('is-dragging');
  if (page.hasPointerCapture(event.pointerId)) page.releasePointerCapture(event.pointerId);
  if (!gesture.locked) return;
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 0);
  const dx = event.clientX - gesture.x;
  const threshold = Math.max(50, Math.min(110, page.clientWidth * .12));
  const fast = Math.abs(dx) > 24 && Math.abs(dx) / Math.max(1, performance.now() - gesture.time) > .5;
  const target = current + (dx < 0 ? 1 : -1);
  if (!cancelled && (Math.abs(dx) >= threshold || fast) && target >= 0 && target < stages.length) go(target);
  else settle();
}
page.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || drag || event.target.closest('a,button,input,select,textarea')) return;
  clearMotion();
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), locked: false };
});
page.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (!drag.locked) {
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
    if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    drag.locked = true; page.setPointerCapture(event.pointerId); page.classList.add('is-dragging');
  }
  if (event.cancelable) event.preventDefault();
  const edge = current === 0 && dx > 0 || current === stages.length - 1 && dx < 0;
  const displacement = Math.max(-180, Math.min(180, dx * (edge ? .18 : .55)));
  if (!reduced()) moving.forEach((el, i) => {
    el.style.transform = `translateX(${displacement * (i === 4 ? 1 : .7)}px)`;
    el.style.opacity = String(1 - Math.abs(displacement) / 700);
  });
});
page.addEventListener('pointerup', event => finish(event));
page.addEventListener('pointercancel', event => finish(event, true));
page.addEventListener('lostpointercapture', event => { if (event.target === page && drag?.id === event.pointerId) finish(event, true); });
page.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); } }, true);
previous.addEventListener('click', () => go(current - 1)); next.addEventListener('click', () => go(current + 1));
page.addEventListener('keydown', event => {
  if (event.target.closest('a,button,input')) return;
  const target = event.key === 'ArrowLeft' ? current - 1 : event.key === 'ArrowRight' ? current + 1 : event.key === 'Home' ? 0 : event.key === 'End' ? stages.length - 1 : null;
  if (target === null) return;
  event.preventDefault(); go(target);
});
window.addEventListener('popstate', () => {
  const index = location.pathname === '/journey/' ? 0 : stages.findIndex(stage => location.pathname === `/journey/${stage.slug}/`);
  if (index >= 0) go(index, false, false);
});
window.addEventListener('site-language-change', () => go(current, false, false));
go(current, false, false);

})();
