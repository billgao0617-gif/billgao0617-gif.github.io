(() => {
  const card = document.querySelector('.validation-target');
  if (!card || !window.IntersectionObserver) return;

  const disclosure = card.closest('details');
  const number = card.querySelector('[data-validation-number]');
  const finalValue = number.textContent;
  const target = Number(finalValue);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 840;
  let inView = false, played = false, frame = 0;

  function finish() {
    cancelAnimationFrame(frame);
    frame = 0;
    number.textContent = finalValue;
    card.removeAttribute('data-target-motion');
  }

  function play() {
    if (played || !inView || !disclosure.open || document.hidden || motion.matches) return;
    played = true;
    const start = performance.now();
    card.setAttribute('data-target-motion','');
    number.textContent = '0.00';

    function draw(now) {
      const progress = Math.min(1,(now-start)/duration);
      if (progress === 1) {
        finish();
        return;
      }
      number.textContent = (target*(1-(1-progress)**2)).toFixed(2);
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
  }

  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting && entry.intersectionRatio >= .23;
    if (inView) play();
    else if (frame) finish();
  }, {threshold:[0,.23]});
  if (disclosure.open) visibility.observe(card);

  // A quick close and reopen can share a single native toggle event.
  new MutationObserver(changes => {
    if (changes.some(change => change.oldValue !== null)) {
      visibility.disconnect();
      inView = played = false;
      finish();
    }
    if (disclosure.open) visibility.observe(card);
  }).observe(disclosure, {attributes:true, attributeFilter:['open'], attributeOldValue:true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finish();
    else play();
  });
  motion.addEventListener('change', () => {
    if (motion.matches) finish();
    else play();
  });
})();
