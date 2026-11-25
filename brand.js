/* One real bottle travels through the opening chapters with a gentle 3D turn.
   Each chapter holds a pose; between chapters the bottle glides to the next. Nothing else moves much. */
(() => {
  const travel = document.getElementById('travel'), tilt = document.getElementById('tilt');
  const btA = document.getElementById('bt-a'), btB = document.getElementById('bt-b'), glow = document.getElementById('glow');
  const notesLayer = document.getElementById('notes-layer'), root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const seg = (t, a, b) => clamp((t - a) / (b - a));

  // quiet reveals
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .16, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.r').forEach((el) => io.observe(el));
  document.getElementById('yr').textContent = new Date().getFullYear();

  // chapters and their poses: x%, y% (of the viewport), scale, turn (deg)
  const secs = [...document.querySelectorAll('[data-b]')].map((el) => {
    const v = el.dataset.b; const hide = v === 'hide';
    const [x, y, s, r] = hide ? [0, 0, 0, 0] : v.split(',').map(Number);
    return { el, hide, x, y, s, r, pin: el.dataset.pin || '' };
  });
  let lay = [];
  function measure() {
    const hh = parseFloat(getComputedStyle(root).getPropertyValue('--hh')) || 84;
    lay = secs.map((c) => { const top = c.el.getBoundingClientRect().top + scrollY; return { ...c, A: top - hh, B: Math.max(top - hh, top + c.el.offsetHeight - innerHeight) }; });
  }

  // the notes of Locken for the composition chapter
  const NOTES = ['lemon', 'almond', 'coffee', 'tuberose', 'jasmine', 'rose', 'vanilla'];
  notesLayer.innerHTML = NOTES.map((n) => `<div class="note"><img src="assets/ing/${n}.webp" alt=""></div>`).join('');
  const notes = [...notesLayer.children];

  // the stage: one composition at a time
  const ORDER = ['vers', 'locken', 'fresca'], TINT = { vers: '#f7e7d8', locken: '#f6ead0', fresca: '#f6e1df' };
  const arts = [...document.querySelectorAll('.stage-names article')], dots = [...document.querySelectorAll('.dots li')];
  let shown = 'locken', front = btA, back = btB;
  function showBottle(k) {
    if (k === shown) return; shown = k;
    back.src = `assets/${k}-cut.webp`;
    back.onload = () => { back.style.opacity = 1; front.style.opacity = 0; [front, back] = [back, front]; };
  }

  // a little life: the bottle follows the pointer by a few degrees
  const m = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { m.tx = e.clientX / innerWidth - .5; m.ty = e.clientY / innerHeight - .5; });

  let FIX = null;
  function pose(y) {
    if (FIX) return { c: lay[FIX.i], n: null, t: 0, sub: FIX.f };
    // which chapter holds, or which two we are between
    for (let i = 0; i < lay.length; i++) {
      const c = lay[i], n = lay[i + 1];
      if (y <= c.B || !n) return { c, n: null, t: 0, sub: clamp((y - c.A) / Math.max(1, c.B - c.A)) };
      if (y < n.A) return { c, n, t: ease(clamp((y - c.B) / Math.max(1, n.A - c.B))), sub: 1 };
    }
    return { c: lay[lay.length - 1], n: null, t: 0, sub: 1 };
  }

  let W = innerWidth, H = innerHeight, mob = W < 900;
  function frame(now) {
    requestAnimationFrame(frame);
    const y = scrollY, { c, n, t, sub } = pose(y);
    const a = c.hide ? { ...c, op: 0 } : { ...c, op: 1 }, b = n ? (n.hide ? { ...a, op: 0, y: a.y - 8 } : { ...n, op: 1 }) : a;
    const from = c.hide && n && !n.hide ? { ...b, op: 0 } : a;
    let X = lerp(from.x, b.x, t), Y = lerp(from.y, b.y, t), S = lerp(from.s || 1, b.s || 1, t), R = lerp(from.r, b.r, t), O = lerp(from.op, b.op, t);
    if (mob) { X = 50; Y = 66; S = .9; R = R * .5; }

    // composition: the notes drift in around the bottle and settle into it
    let g = 0;
    const fz = c.pin === 'fusion' && !n ? sub : -1;
    const cx = X / 100 * W, cy = Y / 100 * H, bh = travel.offsetHeight * S;
    notes.forEach((el, i) => {
      if (fz < 0) { el.style.opacity = 0; return; }
      const k = NOTES.length, ang = (162 - (144 * i) / (k - 1)) * Math.PI / 180;
      const rx = mob ? W * .38 : Math.min(W * .3, 430), ry = mob ? H * .2 : H * .3;
      const hx = cx + (mob ? 0 : W * .05) + rx * Math.cos(ang), hy = cy - bh * .08 - ry * Math.sin(ang);
      const appear = ease(seg(fz, .02 + i * .03, .2 + i * .03));
      const t0 = .42 + i * .055, into = ease(seg(fz, t0, t0 + .12));
      const drift = reduce ? 0 : Math.sin(now / 2600 + i) * 6;
      const nx = cx, ny = cy - bh * .4;
      const px = lerp(hx, nx, into), py = lerp(hy + drift + (1 - appear) * 18, ny, into);
      el.style.opacity = (appear * (1 - seg(into, .7, 1))).toFixed(3);
      el.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%) scale(${(lerp(.9, 1, appear) * (1 - .75 * into)).toFixed(3)})`;
      g = Math.max(g, Math.min(seg(fz, t0 + .08, t0 + .12), 1 - seg(fz, t0 + .12, t0 + .2)));
    });
    glow.style.setProperty('--g', (g * .9).toFixed(3));

    // the stage: change the bottle and the warmth of the page
    if (c.pin === 'stage' && !n) {
      const k = ORDER[Math.min(2, Math.floor(sub * 3))];
      showBottle(k); root.style.setProperty('--tint', TINT[k]);
      const idx = ORDER.indexOf(k); arts.forEach((x, j) => x.classList.toggle('on', j === idx)); dots.forEach((x, j) => x.classList.toggle('on', j === idx));
    } else if (!(n && n.pin === 'stage' && t > .5) && !(c.pin === 'stage')) { showBottle('locken'); root.style.setProperty('--tint', '#fbf6ef'); }

    // gentle 3D: the chapter's turn, the pointer, a slow breath
    m.x += (m.tx - m.x) * .05; m.y += (m.ty - m.y) * .05;
    const breath = reduce ? 0 : Math.sin(now / 3200) * 1.6;
    const ry = R + m.x * 8 + breath, rx = -m.y * 4;
    const w = travel.offsetWidth, h = travel.offsetHeight;
    travel.style.transform = `translate(${(cx - w / 2).toFixed(1)}px, ${(cy - h / 2).toFixed(1)}px) scale(${S.toFixed(3)})`;
    travel.style.opacity = O.toFixed(3);
    tilt.style.transform = `rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
  }

  const resize = () => { W = innerWidth; H = innerHeight; mob = W < 900; measure(); };
  addEventListener('resize', resize); addEventListener('load', resize);
  resize(); requestAnimationFrame(frame);
  // ?at=2:0.5 shows chapter 2 (0-based) half way through, without scrolling (for reviewing a single moment)
  const at = new URLSearchParams(location.search).get('at');
  if (at) { const [i, f] = at.split(':').map(Number); FIX = { i, f: f || 0 };
    secs.forEach((c, k) => { if (k < i) c.el.style.display = 'none'; }); document.querySelectorAll('.r').forEach((el) => el.classList.add('in')); resize(); }
})();
