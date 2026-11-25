/* FEMINISTA — The Art of 180. Real photographs, crisp, choreographed by scroll. */
(() => {
  const qs = new URLSearchParams(location.search);
  const FIXED = qs.has('s') ? +qs.get('s') : null;
  const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;

  const stage = $('#stage'), bottle = $('#bottle'), fill = $('#fill'), glow = $('#glow'), sheen = $('#sheen');
  const dial = $('#dial'), night = $('#night'), spot = $('#spot'), big = $('#big180');
  const vers = $('#vers'), fresca = $('#fresca');
  const ings = $$('.ing'), strips = $$('.strip'), wisps = $$('.wisp');
  const secs = $$('section[data-k]'), panels = secs.map((s) => s.querySelector('.panel')), rail = $$('.rail a');

  // a dial of 180 days
  const NS = 'http://www.w3.org/2000/svg', ticks = [];
  for (let d = 0; d < 180; d++) {
    const a = -Math.PI / 2 + d / 180 * Math.PI * 2, long = d % 30 === 0 ? 9 : d % 10 === 0 ? 6 : 3.5, r = 100;
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', (Math.cos(a) * r).toFixed(2)); l.setAttribute('y1', (Math.sin(a) * r).toFixed(2));
    l.setAttribute('x2', (Math.cos(a) * (r - long)).toFixed(2)); l.setAttribute('y2', (Math.sin(a) * (r - long)).toFixed(2));
    dial.appendChild(l); ticks.push(l);
  }
  [0, 30, 60, 90, 120, 150].forEach((d) => { const a = -Math.PI / 2 + d / 180 * Math.PI * 2, t = document.createElementNS(NS, 'text');
    t.setAttribute('x', (Math.cos(a) * 82).toFixed(1)); t.setAttribute('y', (Math.sin(a) * 82 + 2).toFixed(1)); t.textContent = d || '180'; dial.appendChild(t); });
  let litCount = -1;

  // positions, as fractions of the stage unit H (0,0 = stage centre)
  const ARC = [[-.42, -.2], [-.22, .2], [0, -.3], [.22, .2], [.42, -.2]];
  const NECK = [0, -.26];
  let cx = 0, cy = 0, H = 600;
  function layout() {
    const mobile = innerWidth < 760;
    cx = mobile ? innerWidth * .5 : innerWidth * .6;
    cy = mobile ? innerHeight * .33 : innerHeight * .52;
    H = mobile ? Math.min(innerWidth * .95, innerHeight * .5) : Math.min(innerHeight * .8, innerWidth * .46);
    stage.style.setProperty('--H', H + 'px');
  }
  addEventListener('resize', layout); layout();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; });
  const place = (el, x, y, s = 1, r = 0, o = 1, depth = 0) => {
    el.style.transform = `translate(${(cx + x * H + mouse.x * depth * 40).toFixed(1)}px, ${(cy + y * H + mouse.y * depth * 26).toFixed(1)}px) translate(-50%, -50%) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
    el.style.opacity = o.toFixed(3);
  };

  function readScroll() { const mid = scrollY + innerHeight * .5; let s = 0; secs.forEach((el, k) => { if (mid >= el.offsetTop) s = k + clamp01((mid - el.offsetTop) / el.offsetHeight); }); return s; }
  if (FIXED !== null) document.body.classList.add('fixed');

  let sm = FIXED ?? 0, last = performance.now(), t = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    const target = FIXED !== null ? FIXED : readScroll();
    sm = FIXED !== null ? target : sm + (target - sm) * Math.min(1, dt * 5);
    mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 3); mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 3);
    const k = Math.floor(sm), f = sm - k, P = clamp01(f / .7);
    const c = k + smooth(.7, 1, f);
    const p = (i) => (k === i ? P : k > i ? 1 : 0);
    const P2 = p(2), P3 = p(3), P4 = p(4), P5 = p(5);

    big.style.opacity = (1 - smooth(.25, .75, sm)).toFixed(3);
    big.style.transform = `translate(-50%, -50%) scale(${(1 + sm * .08).toFixed(3)})`;
    place(spot, 0, .02, 1 + Math.sin(t * .4) * .03, 0, .55 + .45 * smooth(.6, 1.2, sm));

    // Selection: the real ingredients arrive; Composition: they spiral into the neck
    ings.forEach((el, i) => {
      const inn = ease(clamp01((c - .55 - i * .07) / .45));
      const ab = ease(clamp01((P2 - i * .11) / .32));
      const [ax, ay] = ARC[i], sp = ab * 4.2 + i, rad = (1 - ab) * .12;
      const x = lerp(ax, NECK[0], ab) + Math.cos(sp) * rad * ab;
      const y = lerp(ay + (1 - inn) * .25, NECK[1], ab) + Math.sin(sp) * rad * ab + Math.sin(t * .8 + i * 1.7) * .008;
      place(el, x, y, (.6 + .4 * inn) * (1 - ab * .92), (1 - inn) * (i % 2 ? 8 : -8) + ab * 120 * (i % 2 ? 1 : -1), inn * (1 - smooth(.6, .9, ab)), .6 + i * .1);
      el.classList.toggle('named', c > .95 && c < 1.6 && ab < .05);
    });

    // the bottle: arrives empty, fills with the accord, is finished by hand
    const bIn = smooth(1.45, 1.95, c), bEnd = smooth(5.7, 6, c);
    const fillV = k >= 2 ? smooth(.12, .95, P2) : 0;
    fill.style.clipPath = `inset(${((1 - fillV) * 100).toFixed(2)}% 0 0 0)`;
    glow.style.opacity = (fillV * (.35 + .25 * Math.sin(t * 1.3)) * (1 - P5 * .3)).toFixed(3);
    sheen.style.setProperty('--x', `${(-60 + P5 * 220).toFixed(1)}%`);
    sheen.style.opacity = P5 > 0 && P5 < 1 ? '1' : '0';
    const bS = lerp(.98, 1.06, smooth(4.6, 5.2, c)) * lerp(1, .86, bEnd) * (.94 + .06 * bIn);
    const ev = smooth(3.55, 3.95, c) * (1 - smooth(4.6, 4.9, c));
    place(bottle, ev * .32, lerp(.03, -.16, bEnd) + (1 - bIn) * .06, bS, 0, bIn, .25);

    // Maturation: a dial of 180 days, nights passing
    const dIn = smooth(2.6, 3, c) * (1 - smooth(3.65, 3.95, c));
    place(dial, 0, -.02, .86 + .04 * dIn, -8 * (1 - dIn), dIn, .15);
    const lit = Math.round((k >= 3 ? (k === 3 ? smooth(.04, .96, P3) : 1) : 0) * 180);
    if (lit !== litCount) { litCount = lit; ticks.forEach((l, i) => l.classList.toggle('on', i < lit)); }
    $('#day').textContent = String(lit).padStart(3, '0');
    night.style.opacity = (k === 3 ? (.5 - .5 * Math.cos(P3 * 6 * Math.PI * 2)) * .55 * smooth(0, .05, P3) * (1 - smooth(.95, 1, P3)) : 0).toFixed(3);

    // Evaluation: three strips fan out beside the bottle, scent rising from them
    const sIn = smooth(3.55, 3.95, c), sOut = smooth(4.6, 4.9, c);
    strips.forEach((el, i) => {
      const ang = [-24, -12, 0][i] * ease(sIn) - 10 * (1 - sIn);
      place(el, lerp(-.85, -.5, ease(sIn)) - sOut * .6, .16 + i * .015 + (1 - sIn) * .1, 1, ang, sIn * (1 - sOut), .5);
    });
    wisps.forEach((el, i) => { const a = [-24, -12, 0][i] * Math.PI / 180;
      place(el, -.5 + Math.cos(a) * .3, .16 + Math.sin(a) * .3 - .14 - ((t * .08 + i * .3) % 1) * .1, 1, 0, sIn * (1 - sOut) * smooth(.2, .5, k === 4 ? P4 : k > 4 ? 1 : 0) * (.6 + .4 * Math.sin(t * 1.2 + i)), .5); });
    $('#status').textContent = P4 > .8 ? 'Balanced. Ready.' : P4 > .4 ? 'Refining…' : 'Assessing the balance…';

    // The collection
    place(vers, -.48, -.06 + (1 - bEnd) * .1, .66, 0, bEnd, .4);
    place(fresca, .48, -.06 + (1 - bEnd) * .1, .66, 0, bEnd, .4);

    $$('.tiers li').forEach((li) => li.classList.toggle('on', P2 >= +li.dataset.at));
    $$('.checks li').forEach((li) => li.classList.toggle('on', P5 >= +li.dataset.at));
    panels.forEach((pn, i) => pn && pn.classList.toggle('in', FIXED !== null ? k === i : Math.abs(sm - (i + .32)) < .42 || (i === 0 && sm < .45)));
    rail.forEach((r) => r.classList.toggle('on', k === +r.dataset.i));
    document.body.classList.toggle('inside', sm > .6 && sm < 5.9);
  }
  requestAnimationFrame(frame);
})();
