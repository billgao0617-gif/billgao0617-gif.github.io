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
const timeline = document.querySelector('[data-journey-timeline]');
if (!timeline) return;
const page = document.querySelector('[data-journey-stage]');
const slider = timeline.querySelector('input');
const links = [...timeline.querySelectorAll('[data-timeline-stage]')];
const heading = page.querySelector('h1');
const description = page.querySelector('.phase-lede');
const status = page.querySelector('.phase-status');
const focus = page.querySelector('.phase-focus');
const photo = page.querySelector('.phase-image img');
const kicker = page.querySelector('.editorial-kicker');
let current = stages.findIndex(stage => stage.slug === page.dataset.journeyStage);
let animations = [];
const language = () => window.siteLanguage?.() === 'zh' ? 'zh' : 'en';
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Load the three photographs once so scrubbing never waits for a new page.
stages.forEach(stage => { const preload = new Image(); preload.src = stage.image; });

function setCopy(element, copy) {
  element.dataset.en = copy.en;
  element.dataset.zh = copy.zh;
  element.textContent = copy[language()];
}

function render(index, animate = true) {
  const changed = index !== current;
  current = index;
  const stage = stages[index];
  page.dataset.journeyStage = stage.slug;
  setCopy(heading, stage.title);
  setCopy(description, stage.description);
  setCopy(status, stage.status);
  focus.innerHTML = stage.focus;
  focus.querySelectorAll('[data-en][data-zh]').forEach(el => { el.textContent = el.dataset[language()]; });
  kicker.textContent = `${stage.label} / 0${index + 1}`;
  if (photo.getAttribute('src') !== stage.image) photo.src = stage.image;
  photo.alt = language() === 'zh' ? `NASA 场景参考：${stage.title.zh}` : stage.alt;
  document.title = `${stage.title[language()]} | Gabbrotech`;
  document.querySelector('meta[name="description"]').content = stage.description[language()];
  slider.setAttribute('aria-valuetext', `${stage.label}: ${stage.title[language()]}`);
  timeline.querySelector('[data-timeline-count]').textContent = `0${index + 1} / 03`;
  links.forEach((link, i) => {
    if (i === index) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  timeline.querySelectorAll('.timeline-dot').forEach((dot, i) => dot.classList.toggle('is-reached', i <= index));
  if (changed) timeline.querySelector('[role="status"]').textContent = `${stage.label} · ${stage.title[language()]}`;
  if (changed && animate && !reducedMotion()) {
    animations.forEach(animation => animation.cancel());
    animations = [heading, description, status, focus, photo].map(el => el.animate(
      [{ opacity: .35, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' }
    ));
  }
}

function scrub(value) {
  timeline.style.setProperty('--timeline-progress', `${value * 50}%`);
  if (Math.round(value) !== current) render(Math.round(value));
}

function commit(index, updateHistory = true) {
  slider.value = String(index);
  scrub(index);
  const target = `/journey/${stages[index].slug}/`;
  if (updateHistory && location.pathname !== target) history.pushState(null, '', target + location.search);
}

slider.addEventListener('input', () => scrub(Number(slider.value)));
slider.addEventListener('change', () => commit(Math.round(Number(slider.value))));
// Native pointer/touch dragging stays continuous; keyboard steps between stages.
slider.addEventListener('keydown', event => {
  const offsets = { ArrowRight: 1, ArrowUp: 1, PageUp: 1, ArrowLeft: -1, ArrowDown: -1, PageDown: -1 };
  let next;
  if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = stages.length - 1;
  else if (event.key in offsets) next = Math.max(0, Math.min(stages.length - 1, current + offsets[event.key]));
  else return;
  event.preventDefault();
  commit(next);
});
links.forEach((link, index) => link.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  commit(index);
}));
window.addEventListener('popstate', () => {
  const index = stages.findIndex(stage => location.pathname === `/journey/${stage.slug}/`);
  if (index >= 0) commit(index, false);
});
window.addEventListener('site-language-change', () => render(current, false));
render(current, false);

})();
