(() => {
  const attempts = new WeakMap();
  window.siteMediaRecovery = true;

  function recover(image) {
    const failed = image.currentSrc || image.src;
    if (!failed) return;
    const url = new URL(failed,location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/assets/')) return;

    const previous = attempts.get(image);
    const attempt = previous?.url === failed ? previous.attempt + 1 : 1;
    if (attempt > 2) {
      image.dataset.mediaUnavailable = '';
      return;
    }

    if (attempt === 1 && url.pathname.includes('smarttorque-hero-') && url.pathname.includes('-hd.')) {
      url.pathname = url.pathname.replace('-hd.','.');
    } else if (url.pathname.endsWith('.avif')) {
      url.pathname = url.pathname.replace(/\.avif$/,'.webp');
    }
    url.searchParams.set('retry',attempt);
    // An active <source> takes precedence over img.src.
    for (const source of image.parentElement?.querySelectorAll(':scope > source') ?? []) {
      source.removeAttribute('srcset');
    }
    image.removeAttribute('srcset');
    attempts.set(image,{url:url.href,attempt});
    image.src = url.href;
  }

  document.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) recover(event.target);
  },true);
  document.addEventListener('load', event => {
    if (event.target instanceof HTMLImageElement && event.target.naturalWidth) {
      event.target.removeAttribute('data-media-unavailable');
    }
  },true);
  for (const image of document.images) {
    if (image.complete && image.currentSrc && !image.naturalWidth) recover(image);
  }
})();
