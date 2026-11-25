/* FEMINISTA — Maison de Parfum */
(() => {
  'use strict';
  const HERO = new URLSearchParams(location.search).has('hero') && parent !== window;
  if (HERO) document.body.classList.add('as-hero');

  // ── The collection. Edit names, notes and prices here. ──────────────────
  const CURRENCY = 'INR';
  const LOCALE = 'en-IN';
  const PRODUCTS = [
    {
      slug: 'vers', name: 'Vers', split: ['Ve', 'rs'], img: 'assets/vers.webp', cut: 'assets/vers-cut.webp', bx: '12%', price: 8000,
      accent: '#f0915a', glow: '255,140,80',
      line: 'The Beauty of Contrast. A little unexpected. A little irresistible. Never quite what it seems.',
      notes: [['Top', 'Cinnamon, cardamom, ginger'], ['Heart', 'Peony, rose de mai, lily of the valley, iris'], ['Base', 'White musk, cashmere wood, ambrette, vanilla, soft suede']],
    },
    {
      slug: 'locken', name: 'Locken', split: ['Loc', 'ken'], img: 'assets/locken.webp', cut: 'assets/locken-cut.webp', bx: '48%', price: 8000,
      accent: '#dcb46c', glow: '235,190,110',
      line: 'Never Just Sweet. Beneath the familiar lies something unexpected. A depth that reveals itself slowly.',
      notes: [['Top', 'Almond, coffee, bergamot, lemon'], ['Heart', 'Tuberose, jasmine sambac, orange blossom, Bulgarian rose'], ['Base', 'Tonka bean, cacao, vanilla, praline, sandalwood, amber']],
    },
    {
      slug: 'fresca', name: 'Fresca', split: ['Fres', 'ca'], img: 'assets/fresca.webp', cut: 'assets/fresca-cut.webp', bx: '82%', price: 7000,
      accent: '#df6b74', glow: '220,80,95',
      line: 'The Art of Subtlety. Delicate at first. A little more indulgent with time. Effortlessly intriguing.',
      notes: [['Top', 'Fruits'], ['Heart', 'Magnolia, orange blossom, jasmine, water lily'], ['Base', 'Amber, musk, vetiver, sandalwood, soft woods']],
    },
  ];

  const $ = (s) => document.querySelector(s);
  const pad = (n) => String(n).padStart(2, '0');
  const money = (v) => new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(v);
  const root = document.documentElement;
  const body = document.body;

  // ── Build the niches ────────────────────────────────────────────────────
  const row = $('#niches');
  const mirror = $('#mirror');
  const nicheHTML = (p, i, live) => `
    <button type="button" class="niche" data-n="${i}" style="--d:${0.35 + i * 0.32}s;--rgb:${p.glow};--bx:${p.bx}"
      ${live ? `aria-label="${p.name}, N°${pad(i + 1)}. Come closer"` : 'tabindex="-1" aria-hidden="true"'}>
      <span class="cavity"><span class="back"></span><span class="beam"></span><span class="pool"></span><img class="bottle" src="${p.cut}" alt="${live ? p.name + ' by Feminista, lit in its niche of basalt' : ''}" decoding="async" draggable="false"><span class="walls"></span><span class="floor"></span><span class="lamp"></span></span>
      ${live ? `<span class="tag"><b>${p.name}</b><i>N°${pad(i + 1)} · ${money(p.price)}</i></span>` : ''}
    </button>`;
  row.innerHTML = PRODUCTS.map((p, i) => nicheHTML(p, i, true)).join('');
  mirror.innerHTML = PRODUCTS.map((p, i) => nicheHTML(p, i, false)).join('');
  const niches = [...row.children];
  const ghosts = [...mirror.children];

  // ── Selection on the wall ───────────────────────────────────────────────
  let current = -1;
  let detail = -1;
  const hintText = $('#hint-text');

  function setAccent(p) {
    root.style.setProperty('--accent', p.accent);
  }
  function select(i) {
    current = i;
    row.classList.toggle('has-on', i >= 0);
    mirror.classList.toggle('has-on', i >= 0);
    niches.forEach((n, k) => n.classList.toggle('on', k === i));
    ghosts.forEach((n, k) => n.classList.toggle('on', k === i));
    if (i >= 0) setAccent(PRODUCTS[i]);
    hintText.textContent = i >= 0 ? `${PRODUCTS[i].name} · select to come closer` : 'Select a perfume';
    paintWallLight();
  }
  row.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && detail < 0) select(-1); });

  niches.forEach((n, i) => {
    n.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && detail < 0) select(i); });
    n.addEventListener('focus', () => { if (detail < 0) select(i); });
    n.addEventListener('click', () => open(i));
  });

  // each lamp spills a little of its perfume's colour onto the stone
  const wallLight = $('.wall-light');
  function paintWallLight() {
    const W = innerWidth, H = innerHeight;
    wallLight.style.background = niches.map((n, i) => {
      const r = n.getBoundingClientRect();
      const cx = ((r.left + r.width / 2) / W) * 100;
      const cy = ((r.top + r.height * 0.45) / H) * 100;
      const a = i === current ? 0.3 : 0.12;
      return `radial-gradient(${r.width * 1.25}px ${r.height * 0.95}px at ${cx}% ${cy}%, rgba(${PRODUCTS[i].glow},${a}), transparent 70%)`;
    }).join(',');
  }

  // ── Detail view ─────────────────────────────────────────────────────────
  const wallLayer = $('#wall-layer');
  const detailLayer = $('#detail-layer');
  const sheet = $('#sheet');
  const dImg = $('#detail-img');
  const dMirror = $('#detail-mirror');

  function fillSheet(i) {
    const p = PRODUCTS[i];
    $('#s-num').textContent = `N°${pad(i + 1)} · Extrait de parfum`;
    $('#s-name').innerHTML = `${p.split[0]}<em>${p.split[1]}</em>`;
    $('#s-line').textContent = p.line;
    $('#s-notes').innerHTML = p.notes.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('#s-price').textContent = money(p.price);
    $('#s-pos').textContent = `${pad(i + 1)} / ${pad(PRODUCTS.length)}`;
    $('#s-add').dataset.add = i;
    dImg.src = p.cut;
    $('#big-niche').style.setProperty('--rgb', p.glow);
    $('#big-mirror').style.setProperty('--rgb', p.glow);
    dImg.alt = `${p.name} by Feminista, alone in its lit niche of basalt`;
    dMirror.src = p.cut;
    setAccent(p);
    document.title = `${p.name} · FEMINISTA`;
  }

  function open(i, fromHash) {
    if (detail === i) return;
    if (detail >= 0) return step(i - detail);
    detail = i;
    select(i);
    const r = niches[i].getBoundingClientRect();
    wallLayer.style.transformOrigin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
    fillSheet(i);
    body.classList.add('in-detail');
    detailLayer.setAttribute('aria-hidden', 'false');
    sheet.setAttribute('aria-hidden', 'false');
    sheet.classList.add('show');
    if (!fromHash) history.pushState(null, '', `#${PRODUCTS[i].slug}`);
    if (viaKeys) setTimeout(() => $('#s-add').focus({ preventScroll: true }), 900);
  }

  function close(fromHash) {
    if (detail < 0) return;
    const was = detail;
    detail = -1;
    body.classList.remove('in-detail');
    detailLayer.setAttribute('aria-hidden', 'true');
    sheet.setAttribute('aria-hidden', 'true');
    sheet.classList.remove('show');
    document.title = 'FEMINISTA · Maison de Parfum';
    if (!fromHash) history.pushState(null, '', location.pathname + location.search);
    select(was);
    if (viaKeys) setTimeout(() => niches[was].focus({ preventScroll: true }), 50);
  }

  // only move focus around for keyboard users
  let viaKeys = false;
  addEventListener('keydown', () => { viaKeys = true; }, true);
  addEventListener('pointerdown', () => { viaKeys = false; }, true);

  let swapping = false;
  function step(d) {
    if (detail < 0 || swapping || d === 0) return;
    swapping = true;
    const next = (detail + d + PRODUCTS.length) % PRODUCTS.length;
    sheet.classList.add('swap');
    dImg.classList.add('swap');
    dMirror.classList.add('swap');
    setTimeout(() => {
      detail = next;
      fillSheet(next);
      select(next);
      history.replaceState(null, '', `#${PRODUCTS[next].slug}`);
      const done = () => {
        sheet.classList.remove('swap');
        dImg.classList.remove('swap');
        dMirror.classList.remove('swap');
        swapping = false;
      };
      if (dImg.complete) requestAnimationFrame(done); else dImg.onload = done;
    }, 380);
  }

  $('#s-back').addEventListener('click', () => close());
  $('#s-prev').addEventListener('click', () => step(-1));
  $('#s-next').addEventListener('click', () => step(1));
  $('#nav-collection').addEventListener('click', (e) => { if (detail >= 0) { e.preventDefault(); close(); } });
  $('#home-link').addEventListener('click', (e) => { if (detail >= 0) { e.preventDefault(); close(); } });

  function fromHash() {
    const slug = location.hash.slice(1);
    const i = PRODUCTS.findIndex((p) => p.slug === slug);
    if (i >= 0) open(i, true); else close(true);
  }
  addEventListener('popstate', fromHash);

  // swipe between perfumes on touch screens
  let tx = null;
  detailLayer.parentElement.addEventListener('touchstart', (e) => { if (detail >= 0) tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    tx = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  // ── Bag ─────────────────────────────────────────────────────────────────
  const bag = $('#bag');
  const scrim = $('#scrim');
  const countEl = $('#bag-count');
  let items = {};
  try { items = JSON.parse(localStorage.getItem('feminista-bag')) || {}; } catch (_) { items = {}; }

  function save() { try { localStorage.setItem('feminista-bag', JSON.stringify(items)); } catch (_) { /* private mode */ } }
  function renderBag() {
    const keys = Object.keys(items).filter((k) => items[k] > 0 && PRODUCTS[k]);
    const count = keys.reduce((s, k) => s + items[k], 0);
    const total = keys.reduce((s, k) => s + items[k] * PRODUCTS[k].price, 0);
    countEl.textContent = count;
    $('#bag-total').textContent = money(total);
    bag.classList.toggle('has', count > 0);
    $('#bag-list').innerHTML = keys.map((k) => {
      const p = PRODUCTS[k];
      return `<li>
        <img src="${p.cut}" alt="">
        <div><b>${p.name}</b><small>Extrait · 100 ml</small>
          <span class="qty"><button type="button" data-q="${k}" data-d="-1" aria-label="One less ${p.name}">−</button><span>${items[k]}</span><button type="button" data-q="${k}" data-d="1" aria-label="One more ${p.name}">+</button></span></div>
        <div><span class="line-price">${money(p.price * items[k])}</span><button type="button" class="line-rm" data-rm="${k}">Remove</button></div>
      </li>`;
    }).join('');
  }
  function openBag() { bag.classList.add('open'); bag.setAttribute('aria-hidden', 'false'); scrim.classList.add('on'); setTimeout(() => $('#bag-close').focus(), 300); }
  function closeBag() { bag.classList.remove('open'); bag.setAttribute('aria-hidden', 'true'); scrim.classList.remove('on'); }

  $('#bag-btn').addEventListener('click', openBag);
  $('#bag-close').addEventListener('click', closeBag);
  scrim.addEventListener('click', closeBag);
  $('#bag-list').addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    const rm = e.target.closest('[data-rm]');
    if (q) items[q.dataset.q] = Math.max(0, (items[q.dataset.q] || 0) + Number(q.dataset.d));
    if (rm) delete items[rm.dataset.rm];
    Object.keys(items).forEach((k) => { if (!items[k]) delete items[k]; });
    save(); renderBag();
  });
  $('#s-add').addEventListener('click', (e) => {
    const k = e.currentTarget.dataset.add;
    items[k] = (items[k] || 0) + 1;
    save(); renderBag();
    countEl.classList.add('bump');
    setTimeout(() => countEl.classList.remove('bump'), 350);
    toast(`${PRODUCTS[k].name} added to your bag`);
    if (HERO) parent.postMessage({ type: 'feminista-add', slug: PRODUCTS[k].slug }, '*');
  });
  $('#bag-checkout').addEventListener('click', () => toast('Checkout is coming soon'));

  // ── Newsletter, toast, masthead ─────────────────────────────────────────
  $('#news').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#news-mail');
    const ok = $('#news-ok');
    if (!input.checkValidity() || !input.value) { ok.textContent = 'Please enter a valid email.'; return; }
    ok.textContent = 'Thank you. The next letter is yours.';
    input.value = '';
  });

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 2400);
  }

  const mast = $('#masthead');
  addEventListener('scroll', () => mast.classList.toggle('solid', scrollY > 40), { passive: true });

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (bag.classList.contains('open')) closeBag(); else close(); }
    if (detail >= 0 && !bag.classList.contains('open')) {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    }
  });
  addEventListener('resize', paintWallLight);
  $('#year').textContent = new Date().getFullYear();

  // ── Lights on ───────────────────────────────────────────────────────────
  renderBag();
  const imgs = niches.map((n) => n.querySelector('.bottle'));
  Promise.all(imgs.map((im) => (im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; })))).then(() => {
    requestAnimationFrame(() => {
      body.classList.add('ready');
      // after the lamps have come on, drop their stagger delays
      setTimeout(() => {
        niches.concat(ghosts).forEach((n) => n.classList.add('settled'));
      }, 1700);
    });
  });
  paintWallLight();
  fromHash();
})();
