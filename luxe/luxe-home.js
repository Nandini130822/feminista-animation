/* FEMINISTA — Maison · home: motion that follows the scroll, the way the houses do it.
   The film sinks as you leave it · the statement lights up word by word · pictures drift inside their frames ·
   the middle tile travels at its own pace · the wide panel opens to the edges · the bottles rise onto the shelf. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), ease = (t) => 1 - Math.pow(1 - t, 3);
  document.body.classList.add('hm-live');

  const vid = $('.hm-hero video'), cap = $('.hm-hero .hm-cap');

  // the statement: every word its own span, lit by the scroll (kept away from the generic headline reveal)
  const say = $('.hm-say .h1'); say.dataset.split = '1';
  (function walk(node) { [...node.childNodes].forEach((c) => {
    if (c.nodeType === 3) { const f = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach((t) => { if (!t) return; if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span'); s.className = 'sw'; s.textContent = t; f.appendChild(s); });
      c.replaceWith(f);
    } else if (c.nodeType === 1) walk(c); }); })(say);
  const words = $$('.sw', say);

  const drift = $$('.tile .rv-img img, .hm-half:not(.flip) figure img');
  const tiles = $$('.tile'), panel = $('.hm-panel'), bottles = $$('.cell-img img');

  function frame() {
    requestAnimationFrame(frame);
    const vh = innerHeight, y = scrollY, wide = innerWidth > 900;
    if (y < vh * 1.2) { const p = y / vh;
      vid.style.translate = `0 ${(p * 110).toFixed(1)}px`; cap.style.translate = `0 ${(-p * 70).toFixed(1)}px`; cap.style.opacity = cl(1 - p * 1.7).toFixed(3); }
    let r = say.getBoundingClientRect();
    if (r.bottom > -50 && r.top < vh + 50) { const p = cl((vh * .9 - r.top) / (vh * .5)), n = words.length + 4;
      words.forEach((s, i) => { s.style.opacity = (.16 + .84 * cl(p * n - i, 0, 4) / 4).toFixed(3); }); }
    drift.forEach((img) => { const b = img.parentElement.getBoundingClientRect(); if (b.bottom < -80 || b.top > vh + 80) return;
      const d = cl(((b.top + b.height / 2) - vh / 2) / vh, -.6, .6); img.style.translate = `0 ${(-d * b.height * .1).toFixed(1)}px`; });
    if (tiles[1]) { const b = tiles[1].getBoundingClientRect();
      tiles[1].style.translate = wide && b.bottom > -100 && b.top < vh + 100 ? `0 ${(cl(((b.top + b.height / 2) - vh / 2) / vh, -1, 1) * 56).toFixed(1)}px` : '0 0'; }
    r = panel.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) panel.style.setProperty('--k', (1 - ease(cl((vh - r.top) / (vh * .75)))).toFixed(3));
    bottles.forEach((img, i) => { const b = img.parentElement.getBoundingClientRect(); if (b.bottom < -80 || b.top > vh + 120) return;
      const k = ease(cl((vh * .96 - b.top) / (vh * .5) - (wide ? i * .14 : 0))); img.style.translate = `0 ${((1 - k) * 54).toFixed(1)}px`; img.style.scale = (.9 + .1 * k).toFixed(3); });
  }
  requestAnimationFrame(frame);
})();
