(() => {
  const story = document.querySelector('.operation-story');
  if (!story) return;

  const stage = story.querySelector('.op-sticky');
  const poster = story.querySelector('.op-frame');
  const canvas = story.querySelector('.op-motion');
  const context = canvas.getContext('2d', { alpha: true });
  const chips = [...story.querySelectorAll('[data-step]')];
  const captions = [...story.querySelectorAll('[data-caption]')];
  const readout = document.createElement('output');
  readout.className = 'op-readout';
  readout.setAttribute('aria-live','off');
  readout.hidden = true;
  story.querySelector('.op-figure').append(readout);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const folder = '/assets/scroll-demo/';
  const cache = new Map();
  const pending = new Set();
  const failed = new Set();
  let sequence, stops, stageStarts;
  let target = 0, painted = 0, direction = 1, raf = 0, requestedStep = 0;
  let active = true;

  function showTrigger(index) {
    readout.hidden = !sequence || index < stageStarts[1] || index >= stageStarts[2];
    if (readout.hidden) return;
    const zh = window.siteLanguage?.() === 'zh';
    const start = sequence.turnStartFrame, end = sequence.turnEndFrame;
    const degrees = sequence.angles?.[index] ?? 0;
    const label = index < start ? (zh ? '扳机松开' : 'Trigger released') :
      index < end ? (zh ? '扳机按下' : 'Trigger held') : (zh ? '到位停转' : 'Target reached');
    readout.textContent = label + ' · ' + Math.round(degrees) + '° / 180°';
  }

  function showCaption(index) {
    let step = 0;
    if (index >= stageStarts[2]) step = 2;
    else if (index >= stageStarts[1]) step = 1;
    captions.forEach((item, i) => { item.hidden = i !== step; });
    chips.forEach((item, i) => item.setAttribute('aria-pressed', String(i === step)));
    story.dataset.step = String(step);
  }

  function paint(index) {
    if (index === painted && story.hasAttribute('data-frame')) return;
    if (index === 0) {
      canvas.hidden = true;
      poster.style.opacity = '';
    } else {
      const frame = cache.get(index);
      if (!frame) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(frame, 0, 0);
      canvas.hidden = false;
      poster.style.opacity = '0';
    }
    painted = index;
    story.dataset.frame = String(index);
    const approach = Math.min(1, Math.max(0,(index - sequence.approachFrame) / (sequence.engageFrame - sequence.approachFrame)));
    const exit = Math.min(1,Math.max(0,(index - sequence.pullbackFrame) / (sequence.count - 1 - sequence.pullbackFrame)));
    story.style.setProperty('--mobile-zoom', String(1.46 - .34 * approach * (1 - exit)));
    showCaption(index);
    showTrigger(index);
  }

  async function fetchFrame(index) {
    pending.add(index);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = folder + 'frame-' + String(index).padStart(3, '0') + '.webp';
      await img.decode();
      cache.set(index, img);
      if (cache.size > 12) {
        const farthest = [...cache.keys()].filter(k => k !== target && k !== painted)
          .sort((a, b) => Math.abs(b - target) - Math.abs(a - target))[0];
        cache.delete(farthest);
      }
      if (index === target || Math.abs(index - target) < Math.abs(painted - target)) paint(index);
    } catch {
      failed.add(index);
    } finally {
      pending.delete(index);
      pump();
    }
  }

  function pump() {
    if (!sequence || !active || document.hidden) return;
    const nearby = [target];
    if (!reduced.matches) {
      for (let ahead = 1; ahead <= 4; ahead++) nearby.push(target + ahead * direction);
      nearby.push(target - direction);
    }
    for (const index of nearby) {
      if (pending.size >= 3) break;
      if (index <= 0 || index >= sequence.count || cache.has(index) || pending.has(index) || failed.has(index)) continue;
      fetchFrame(index);
    }
  }

  function drawAt(index) {
    if (index !== target) direction = Math.sign(index - target);
    target = index;
    if (!index || cache.has(index)) paint(index);
    else {
      const near = [...cache.keys()].sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
      if (near !== undefined && Math.abs(near - target) < Math.abs(painted - target)) paint(near);
    }
    pump();
  }

  function measure() {
    raf = 0;
    if (!sequence) return;
    const headerHeight = document.querySelector('.site-header').offsetHeight;
    const travel = story.offsetHeight - stage.offsetHeight;
    const progress = reduced.matches ? stops[requestedStep] / (sequence.count - 1) :
      Math.min(1, Math.max(0, (headerHeight - story.getBoundingClientRect().top) / Math.max(travel, 1)));
    story.style.setProperty('--progress', progress.toFixed(4));
    drawAt(Math.round(progress * (sequence.count - 1)));
  }
  function schedule() {
    if (!raf) raf = requestAnimationFrame(measure);
  }
  function setMode() {
    requestedStep = chips.findIndex(chip => chip.getAttribute('aria-pressed') === 'true');
    story.toggleAttribute('data-scrub', !reduced.matches);
    story.toggleAttribute('data-static', reduced.matches);
    measure();
  }
  chips.forEach((chip, step) => chip.addEventListener('click', () => {
    if (!sequence) return;
    requestedStep = step;
    if (reduced.matches) { measure(); return; }
    const start = scrollY + story.getBoundingClientRect().top - document.querySelector('.site-header').offsetHeight;
    const travel = story.offsetHeight - stage.offsetHeight;
    window.scrollTo({top:start + travel * stops[step] / (sequence.count - 1), behavior:'instant'});
    schedule();
  }));

  new IntersectionObserver(entries => {
    active = entries[0].isIntersecting;
    if (active) schedule();
  }, {rootMargin:'200px'}).observe(stage);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  reduced.addEventListener('change', setMode);
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('online', () => { failed.clear(); schedule(); });

  function accessibleLabels() {
    const chinese = window.siteLanguage?.() === 'zh';
    story.querySelector('.op-steps').setAttribute('aria-label', chinese ? '工作原理演示阶段' : 'Demonstration stages');
    poster.alt = chinese ? 'SmartTorque 及其螺母驱动接头' : 'SmartTorque with its socket driver fitted';
    if(sequence) showTrigger(painted);
  }
  window.addEventListener('site-language-change', accessibleLabels);
  accessibleLabels();

  async function start() {
    if (!context) return;
    const response = await fetch(folder + 'manifest.json');
    if (!response.ok) return;
    const meta = await response.json();
    if (!(meta.count > 2 && meta.width && meta.height && meta.turnEndFrame > meta.engageFrame)) return;
    sequence = meta;
    canvas.width = meta.width; canvas.height = meta.height;
    poster.width = meta.width; poster.height = meta.height;
    stageStarts = [0, meta.approachFrame ?? meta.engageFrame, meta.pullbackFrame ?? meta.turnEndFrame + 1];
    stops = [0, Math.round((meta.turnStartFrame + meta.turnEndFrame) / 2), meta.count - 1];
    story.setAttribute('data-interactive','');
    setMode();
  }
  start().catch(() => { /* The assembled poster and the 3D link remain available. */ });
})();
