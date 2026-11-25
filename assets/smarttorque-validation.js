(() => {
  const items = document.querySelectorAll('.why-stage, .validation-metric');
  if (!items.length || !window.IntersectionObserver) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set();
  const played = new WeakSet();
  const decoding = new WeakSet();
  const counting = new Map();
  const duration = 820;
  let request = 0;

  function finish(card, animation) {
    for (const {label, text} of animation.values) label.textContent = text;
    card.style.removeProperty('--target-progress');
    card.removeAttribute('data-metric-motion');
    counting.delete(card);
  }

  function draw(now) {
    request = 0;
    for (const [card, animation] of counting) {
      const progress = Math.max(0,Math.min(1,(now-animation.start)/duration));
      if (!visible.has(card) || progress === 1) {
        finish(card,animation);
        continue;
      }

      const eased = 1-(1-progress)**2.7;
      card.style.setProperty('--target-progress',eased.toFixed(3));
      for (const {label, target, precision} of animation.values) {
        const text = (target*eased).toFixed(precision);
        if (label.textContent !== text) label.textContent = text;
      }
      const count = Math.floor(animation.cells.length*eased);
      for (let index = animation.filled; index < count; index++) {
        animation.cells[index].setAttribute('data-filled','');
      }
      animation.filled = count;
    }
    if (counting.size) request = requestAnimationFrame(draw);
  }

  function enter(item, delay) {
    if (played.has(item) || document.hidden || reduced.matches) return;
    if (item.classList.contains('why-stage')) {
      if (decoding.has(item)) return;
      decoding.add(item);
      const pictures = [...item.querySelectorAll('img')].filter(img => img.getClientRects().length);
      Promise.allSettled(pictures.map(img => {
        img.loading = 'eager';
        return img.decode();
      })).then(() => {
        decoding.delete(item);
        if (visible.has(item) && !document.hidden && !reduced.matches) {
          played.add(item);
          item.setAttribute('data-benefit-motion','');
        }
      });
      return;
    }
    played.add(item);
    const values = [...item.querySelectorAll('[data-metric-number]')].map(label => {
      const text = label.textContent;
      return {label, text, target:Number(text), precision:text.split('.')[1]?.length ?? 0};
    });
    const cells = item.querySelectorAll('[data-success-cell]');
    item.setAttribute('data-metric-motion','');
    counting.set(item,{values,cells,filled:0,start:performance.now()+delay});
    if (!request) request = requestAnimationFrame(draw);
  }

  function finishVisibleMotion() {
    cancelAnimationFrame(request);
    request = 0;
    for (const [card, animation] of counting) finish(card,animation);
    for (const item of visible) item.removeAttribute('data-benefit-motion');
  }

  const observer = new IntersectionObserver(entries => {
    let index = 0;
    for (const entry of entries) {
      const item = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= .25) {
        visible.add(item);
        enter(item,Math.min(index++,3)*85);
      } else {
        visible.delete(item);
        const animation = counting.get(item);
        if (animation) finish(item,animation);
        item.removeAttribute('data-benefit-motion');
      }
    }
  }, {threshold:[0,.25]});
  items.forEach(item => observer.observe(item));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishVisibleMotion();
    else visible.forEach(item => enter(item,0));
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) finishVisibleMotion();
    else visible.forEach(item => enter(item,0));
  });
})();
