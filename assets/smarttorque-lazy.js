(() => {
  if (!window.IntersectionObserver) return;
  document.addEventListener('click',event => {
    if (event.target.closest?.('[data-show-retention]')) {
      const viewer = document.getElementById('model-viewer');
      if (viewer) viewer.dataset.inspect = 'retention';
    }
  });
  const navigation = performance.getEntriesByType('navigation')[0];
  const initialHash = location.hash;
  if (navigation?.type === 'navigate' && initialHash) {
    const anchor = document.getElementById(initialHash.slice(1));
    if (anchor && !anchor.closest('.smart-story')) {
      // Land after the deferred layout has its stylesheet, without waiting for 3D.
      requestAnimationFrame(() => {
        if (location.hash === initialHash) anchor.scrollIntoView({block:'start',behavior:'instant'});
      });
    }
  }
  const language = () => document.documentElement.lang.startsWith('zh');
  const modules = [
    ['#model-viewer','/assets/viewer.js?v=a23a66cdf72f',() => {
      const notice = document.getElementById('viewer-loading');
      notice.textContent = language() ? '3D 原型暂时无法加载。' : 'The 3D prototype is temporarily unavailable.';
    }],
    ['#overview .guide-canvas','/assets/smarttorque-overview.js?v=6e247daeb24b',() => {
      document.querySelector('#overview .guide-fallback').hidden = false;
    }]
  ];
  for (const [selector,src,showFallback] of modules) {
    const target = document.querySelector(selector);
    if (!target) continue;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      import(src).catch(showFallback);
    },{rootMargin:'400px 0px'});
    observer.observe(target);
  }
})();
