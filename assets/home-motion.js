(() => {
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const intro = document.querySelector('#about');
  const product = document.querySelector('.editorial-product');
  const finale = document.querySelector('.orbital-finale');
  if (!intro || !product || !finale) return;
  const cards = [...document.querySelectorAll('.journey-card')];
  let started = false, frame = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function update() {
    frame = 0;
    if (!started || motion.matches || document.hidden || root.classList.contains('welcome-active')) return;
    const height = innerHeight;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - height);
    root.style.setProperty('--page-progress', clamp(scrollY / scrollable, 0, 1));
    const introRect = intro.getBoundingClientRect();
    intro.style.setProperty('--intro-shift', `${clamp(-introRect.top / height, 0, 1) * (innerWidth < 760 ? 8 : 26)}px`);
    const productRect = product.getBoundingClientRect();
    if (productRect.bottom > 0 && productRect.top < height) {
      const progress = clamp((height / 2 - productRect.top - productRect.height / 2) / height, -1, 1);
      product.style.setProperty('--product-shift', `${progress * -22}px`);
      product.style.setProperty('--product-tilt', `${progress * 2}deg`);
    }
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < height) card.style.setProperty('--card-shift', `${clamp((height / 2 - rect.top - rect.height / 2) / height, -1, 1) * 18}px`);
    });
    const finaleRect = finale.getBoundingClientRect();
    if (finaleRect.bottom > 0 && finaleRect.top < height) finale.style.setProperty('--horizon-shift', `${clamp((height / 2 - finaleRect.top - finaleRect.height / 2) / height, -1, 1) * 45}px`);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function start() {
    if (started || root.classList.contains('welcome-active')) return;
    started = true;
    if (!motion.matches) {
      const elements = document.querySelectorAll('.scene-hero-copy,.editorial-heading,.editorial-product-copy,.mission-copy,.mission-visual,.orbital-cta');
      elements.forEach((el, index) => {
        el.setAttribute('data-scroll-reveal', '');
        el.style.setProperty('--reveal-delay', `${index === 3 ? 110 : 0}ms`);
      });
      document.body.classList.add('home-motion-ready');
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-inview'); observer.unobserve(entry.target); }
      }), { threshold: .12, rootMargin: '0px 0px -20px 0px' });
      elements.forEach(el => observer.observe(el));
    }
    schedule();
  }
  const welcomeObserver = new MutationObserver(() => { start(); schedule(); });
  welcomeObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => {
    if (motion.matches) document.querySelectorAll('[data-scroll-reveal]').forEach(el => el.classList.add('is-inview'));
    schedule();
  });
  start();
})();
