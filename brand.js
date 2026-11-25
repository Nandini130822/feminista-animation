/* The studies, told quietly. Each section keeps its idea with only a little movement. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const qs = new URLSearchParams(location.search);
  document.getElementById('yr').textContent = new Date().getFullYear();

  // quiet reveals (?all shows everything at once, for review)
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.r').forEach((el) => (qs.has('all') ? el.classList.add('in') : io.observe(el)));
  // how far the page has scrolled through a pinned section (0 → 1)
  const prog = (el) => { const r = el.getBoundingClientRect(), span = el.offsetHeight - innerHeight; return clamp(-r.top / Math.max(1, span)); };

  // ── 02 · the fusion: six notes gather, then pour slowly into Locken as you scroll ──
  const fusion = document.getElementById('s2'), fz = document.getElementById('fz'), bottle = document.getElementById('fz-bottle');
  const ingsEl = document.getElementById('fz-ings'), state = document.getElementById('fz-state');
  const NOTES = [['lemon', 'Lemon'], ['almond', 'Almond'], ['coffee', 'Coffee'], ['jasmine', 'Jasmine'], ['rose', 'Rose'], ['vanilla', 'Vanilla']];
  ingsEl.innerHTML = NOTES.map(([f, n]) => `<div class="ing"><img src="assets/ing/${f}.webp" alt=""><span>${n}</span></div>`).join('');
  const ings = [...ingsEl.children];
  // quiet: the notes rest in two still columns beside the bottle; each fades in, then gives itself to the bottle
  function fusionFrame() {
    const p = qs.has('fz') ? +qs.get('fz') : prog(fusion);
    const W = fz.clientWidth, br = bottle.getBoundingClientRect(), fr = fz.getBoundingClientRect();
    const cx = br.left - fr.left + br.width / 2, top = br.top - fr.top, bh = br.height, mob = W < 700;
    const gap = mob ? Math.max(br.width / 2 + 34, W * .34) : br.width / 2 + Math.min(170, W * .12);
    const oy = top + bh * .52, neckY = top + bh * .12;
    const join = ease(seg(p, .3, .4));                         // leave the columns for the circle
    const turn = ease(seg(p, .3, .82)) * Math.PI * 2.2;        // one slow clockwise round, and a little more
    ings.forEach((el, i) => {
      const side = i < 3 ? -1 : 1, row = i % 3;
      const x0 = cx + side * gap, y0 = top + bh * (.3 + row * .24);
      const appear = seg(p, .04 + i * .04, .16 + i * .04);
      // its place on the circle: starts where it stood, then turns clockwise and spirals in to the neck
      const a0 = Math.atan2((y0 - oy) / .42, x0 - cx), r0 = Math.hypot(x0 - cx, (y0 - oy) / .42);
      const sink = ease(seg(p, .5 + i * .04, .72 + i * .04));
      const r = r0 * (1 - sink), th = a0 + turn;
      const ox = cx + r * Math.cos(th), oyy = oy + (neckY - oy) * sink + r * .42 * Math.sin(th);
      const x = x0 + (ox - x0) * join, y = y0 + (oyy - y0) * join + (1 - appear) * 8;
      const front = Math.sin(th) > 0 || join < .5;
      el.style.zIndex = front ? 3 : 1;
      el.style.opacity = (appear * (1 - seg(sink, .6, 1))).toFixed(3);
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${((1 - .65 * sink) * (front ? 1 : .86 + .14 * (1 - join))).toFixed(3)})`;
      el.querySelector('span').style.opacity = String(1 - join);
    });
    const fill = ease(seg(p, .52, .92)), sp = seg(p, .92, .99);
    bottle.style.setProperty('--fill', fill.toFixed(4)); bottle.style.setProperty('--lift', 0); bottle.style.setProperty('--pulse', 0);
    bottle.style.setProperty('--sp', sp.toFixed(3)); bottle.style.setProperty('--sheen', (sp > 0 && sp < 1 ? Math.sin(sp * Math.PI) * .7 : 0).toFixed(3));
    state.textContent = p < .3 ? 'The notes are chosen.' : p < .52 ? 'They gather round.' : p < .92 ? 'Into the bottle, one by one.' : 'Locken, composed.';
  }

  // ── 03 · the stage: one perfume at a time, set down gently on its plinth ──
  const stage = document.getElementById('s3'), turn = document.getElementById('st-turn'), stImg = document.getElementById('st-bottle');
  const tabs = [...stage.querySelectorAll('.st-tabs button')], arts = [...stage.querySelectorAll('.st-copy article')], bgs = [...stage.querySelectorAll('.st-bg i')];
  const ORDER = ['vers', 'locken', 'fresca'], NAME = { vers: 'Vers', locken: 'Locken', fresca: 'Fresca' };
  let cur = 'locken', auto = null, busy = false;
  function setStage(k) {
    if (k === cur || busy) return; busy = true; cur = k;
    tabs.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
    arts.forEach((a) => a.classList.toggle('on', a.dataset.k === k)); bgs.forEach((b) => b.classList.toggle('on', b.dataset.k === k));
    turn.style.setProperty('--op', 0); turn.style.setProperty('--drop', '-24px');
    setTimeout(() => {
      stImg.src = `assets/${k}-cut.webp`; stImg.alt = `${NAME[k]} by Feminista`;
      turn.style.transition = 'none'; turn.style.setProperty('--drop', '-36px'); void turn.offsetWidth; turn.style.transition = '';
      turn.style.setProperty('--op', 1); turn.style.setProperty('--drop', '0px');
      setTimeout(() => { busy = false; }, 900);
    }, 700);
  }
  const restart = () => { clearInterval(auto); if (!reduce) auto = setInterval(() => setStage(ORDER[(ORDER.indexOf(cur) + 1) % 3]), 5200); };
  tabs.forEach((b) => b.addEventListener('click', () => { setStage(b.dataset.k); restart(); }));
  new IntersectionObserver(([e]) => { if (e.isIntersecting) restart(); else clearInterval(auto); }, { threshold: .4 }).observe(stage);
  const sm = { x: 0, tx: 0 };
  stage.addEventListener('pointermove', (e) => { sm.tx = e.clientX / innerWidth - .5; });
  stage.addEventListener('pointerleave', () => { sm.tx = 0; });

  // ── 04 · the art of 180: the days count, the phases light in turn ──
  const a180 = document.getElementById('s4'), day = document.getElementById('day'), phases = [...document.querySelectorAll('#phases li')], ph = document.getElementById('phases');
  const aImg = a180 && a180.querySelector('.a-img img');  // optional
  function a180Frame() {
    const r = a180.getBoundingClientRect(), p = qs.has('all') ? .9 : clamp((innerHeight - r.top) / (innerHeight + r.height * .55));
    const k = seg(p, .15, .85);
    day.textContent = String(Math.round(180 * ease(k))).padStart(3, '0');
    ph.style.setProperty('--pp', k.toFixed(3));
    phases.forEach((li, i) => li.classList.toggle('on', k >= i / 5 - .001));
    if (aImg) aImg.style.setProperty('--kz', (1.08 - .06 * p).toFixed(4));
  }

  // ── 05 · the laboratory: a little depth to the pointer and to the scroll ──
  const lab = document.getElementById('s5'), cam = document.getElementById('lab-cam'), view = document.getElementById('lab-view');
  const lm = { x: 0, y: 0, tx: 0, ty: 0 };
  view && view.addEventListener('pointermove', (e) => { const r = view.getBoundingClientRect(); lm.tx = (e.clientX - r.left) / r.width - .5; lm.ty = (e.clientY - r.top) / r.height - .5; });
  view && view.addEventListener('pointerleave', () => { lm.tx = 0; lm.ty = 0; });

  const vis = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  function frame(now) {
    requestAnimationFrame(frame);
    if (vis(fusion) || qs.has('fz')) fusionFrame();
    if (vis(stage)) { sm.x += (sm.tx - sm.x) * .05; turn.style.setProperty('--ry', `${(sm.x * 14 + (reduce ? 0 : Math.sin(now / 3400) * 3)).toFixed(2)}deg`); }
    if (a180 && (vis(a180) || qs.has('all'))) a180Frame();
    if (lab && (vis(lab) || qs.has('all'))) {
      lm.x += (lm.tx - lm.x) * .05; lm.y += (lm.ty - lm.y) * .05;
      const r = lab.getBoundingClientRect(), p = clamp((innerHeight - r.top) / (innerHeight + r.height));
      cam.style.transform = `translate3d(${(-lm.x * 30).toFixed(1)}px, ${(-lm.y * 14).toFixed(1)}px, ${lerp(-60, 30, p).toFixed(1)}px) rotateY(${(lm.x * 2).toFixed(2)}deg)`;
    }
  }
  requestAnimationFrame(frame);
})();
