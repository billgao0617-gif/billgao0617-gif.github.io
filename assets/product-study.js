(() => {
  const figure = document.querySelector('.product-study');
  if (!figure) return;
  const features = [...document.querySelectorAll('[data-feature]')];
  function highlight() {
    const active = features.find(item => item.open);
    figure.dataset.focus = active?.dataset.feature || '';
    figure.querySelectorAll('[data-point]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.point === figure.dataset.focus));
      button.setAttribute('aria-label', button.textContent.trim());
    });
  }
  features.forEach(item => item.addEventListener('toggle', highlight));
  figure.querySelectorAll('[data-point]').forEach(button => button.addEventListener('click', () => {
    features.forEach(item => { item.open = item.dataset.feature === button.dataset.point; });
    highlight();
  }));
  window.addEventListener('site-language-change', highlight);
  highlight();
})();
