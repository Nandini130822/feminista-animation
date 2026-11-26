/* FEMINISTA — Maison · motion: intro, smooth scroll, word reveals, drifting pictures, cursor, page fades. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body, $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ── the intro, once per visit ──
  let seen = false; try { seen = sessionStorage.getItem('fm-intro') === '1'; } catch (_) { /* private mode */ }
  const start = () => { body.classList.add('ready'); enhance(); };
  if (!seen && !reduce && body.dataset.page === 'home') {
    const v = document.createElement('div'); v.className = 'intro-veil'; v.innerHTML = '<img src="../site/img/logo-black.webp" alt=""><i></i>';
    body.appendChild(v); body.classList.add('ready');
    try { sessionStorage.setItem('fm-intro', '1'); } catch (_) { /* private mode */ }
    setTimeout(() => { v.classList.add('up'); enhance(); setTimeout(() => v.remove(), 1500); }, 1900);
  } else requestAnimationFrame(start);

  // ── pages fade into one another ──
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || a.target || e.target.closest('[data-add]')) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.protocol === 'mailto:' || (u.pathname === location.pathname && u.search === location.search)) return;
    e.preventDefault(); body.classList.add('leaving'); setTimeout(() => { location.href = u.href; }, 340);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) { body.classList.remove('leaving'); body.classList.add('ready'); } });

  // ── headlines: wrap each word so it can rise from behind its line ──
  function split(el) {
    if (el.dataset.split) return; el.dataset.split = '1';
    let i = 0;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => { if (!t) return; if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w'; const s = document.createElement('span'); s.textContent = t; s.style.setProperty('--i', i++); w.appendChild(s); f.appendChild(w); });
        n.replaceWith(f);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el); el.classList.add('split');
    const byLine = () => { const tops = []; el.querySelectorAll('.w').forEach((w) => { let k = tops.indexOf(w.offsetTop); if (k < 0) k = tops.push(w.offsetTop) - 1; w.firstChild.style.setProperty('--i', k); }); };
    byLine(); (document.fonts ? document.fonts.ready : Promise.resolve()).then(byLine);
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2, rootMargin: '0px 0px -8% 0px' });
  function enhance() {
    if (!reduce) $$('.display, .h1, .h2').forEach((h) => { if (h.closest('.bag, .menu, .acct-in')) return; split(h); if (!h.classList.contains('in')) io.observe(h); });
    $$('.sec-head:not(.in)').forEach((h) => io.observe(h));
    $$('.portrait, .pcard .ph, .f-a a, .moods a').forEach((el) => { el.dataset.cur = 'View'; });
    $$('.e-hero > img, .e-hero > video, .band > img, .shop-hero > img').forEach((el) => { el.dataset.par = '1'; });
    pars = $$('[data-par]');
  }
  let pars = [];
  const base = window.watchReveals; window.watchReveals = () => { base && base(); if (body.classList.contains('ready')) enhance(); };

  // ── smooth scroll, drifting pictures, a header that steps aside ──
  let lastY = 0;
  function onFrame() {
    requestAnimationFrame(onFrame);
    const y = scrollY, vh = innerHeight;
    if (!reduce) pars.forEach((el) => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
      el.style.setProperty('--py', `${(((r.top + r.height / 2) - vh / 2) * -.07).toFixed(1)}px`); });
    if (Math.abs(y - lastY) > 6) { body.classList.toggle('head-hide', y > lastY && y > 320 && !document.querySelector('.bag.open, .menu.open')); lastY = y; }
  }
  requestAnimationFrame(onFrame);
  if (!reduce) {
    const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
    sc.onload = () => { if (!window.Lenis) return; const lenis = new window.Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
      new MutationObserver(() => (document.querySelector('.bag.open, .menu.open') ? lenis.stop() : lenis.start())).observe(body, { subtree: true, attributes: true, attributeFilter: ['class'] }); };
    document.head.appendChild(sc);
  }

  // ── the cursor ──
  if (false) {
    const c = document.createElement('div'); c.className = 'cur'; c.innerHTML = '<span></span>'; body.appendChild(c);
    const lab = c.firstChild; let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; c.classList.add('on');
      const t = e.target.closest('[data-cur]'), over = t && !e.target.closest('.quick, button'); c.classList.toggle('view', !!over); if (over) lab.textContent = t.dataset.cur; });
    document.addEventListener('pointerleave', () => c.classList.remove('on'));
    (function move() { requestAnimationFrame(move); x += (tx - x) * .18; y += (ty - y) * .18; c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; })();
  }
})();
