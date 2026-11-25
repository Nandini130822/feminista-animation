/* The Laboratory: walk in out of the dark, then look around. */
(() => {
  const cam = document.getElementById('cam'), body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const WALK = reduce ? 0 : 4200;        // ms to walk from the doorway to the bench
  const FROM = -520;                      // camera starts this far back

  // look-around: the camera eases toward the pointer (or the tilt of a phone)
  const m = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { m.tx = e.clientX / innerWidth - .5; m.ty = e.clientY / innerHeight - .5; });
  addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0; });
  addEventListener('deviceorientation', (e) => { if (e.gamma == null) return; m.tx = Math.max(-.5, Math.min(.5, e.gamma / 40)); m.ty = Math.max(-.5, Math.min(.5, (e.beta - 45) / 60)); });

  let t0 = null;
  function frame(now) {
    requestAnimationFrame(frame);
    if (t0 === null) t0 = now;
    const k = WALK ? Math.min(1, (now - t0) / WALK) : 1, w = ease(k);
    m.x += (m.tx - m.x) * .045; m.y += (m.ty - m.y) * .045;
    const idle = reduce ? 0 : Math.sin(now / 5200) * .5;              // a slow, breathing drift
    const z = FROM * (1 - w) + idle * 6;
    const x = -m.x * 46 + Math.sin(now / 7300) * 4, y = -m.y * 22 + (1 - w) * 30;
    const ry = m.x * 2.4 + (1 - w) * -3, rx = -m.y * 1.4;
    cam.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg) rotateX(${rx.toFixed(3)}deg)`;
  }

  // dust drifting through the window light
  const cv = document.getElementById('dust'), g = cv.getContext('2d');
  let W = 0, H = 0, motes = [];
  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    W = cv.width = Math.round(r.width * d); H = cv.height = Math.round(r.height * d);
    motes = Array.from({ length: reduce ? 0 : 90 }, () => ({ x: Math.random(), y: Math.random(), s: .4 + Math.random() * 1.6, v: .00004 + Math.random() * .00012, p: Math.random() * 6.28 }));
  }
  function dust(now) {
    requestAnimationFrame(dust);
    g.clearRect(0, 0, W, H);
    for (const d of motes) {
      d.y -= d.v * 16; d.x += Math.sin(now / 4000 + d.p) * .00008; if (d.y < -.02) { d.y = 1.02; d.x = Math.random(); }
      // brightest inside the beams falling from the window (upper right)
      const inBeam = Math.max(0, 1 - Math.abs((d.x - .62) - (1 - d.y) * .55) * 3.2);
      const a = (.12 + .6 * inBeam) * (.6 + .4 * Math.sin(now / 900 + d.p));
      g.fillStyle = `rgba(255, 228, 185, ${a.toFixed(3)})`;
      g.beginPath(); g.arc(d.x * W, d.y * H, d.s * (W / 1600), 0, 6.283); g.fill();
    }
  }

  // ── the fusion: the notes gather on the bench, then pour into the bottle ──
  const B = {
    locken: { name: 'Locken', ar: 486 / 935, cap: .165, sh: .28,
      ings: [['lemon', 'Lemon'], ['almond', 'Almond'], ['coffee', 'Coffee'], ['tuberose', 'Tuberose'], ['jasmine', 'Jasmine sambac'], ['rose', 'Bulgarian rose'], ['tonka', 'Tonka bean'], ['vanilla', 'Vanilla'], ['sandalwood', 'Sandalwood']] },
    vers: { name: 'Vers', ar: 388 / 863, cap: .23, sh: .37,
      ings: [['cinnamon', 'Cinnamon'], ['cardamom', 'Cardamom'], ['ginger', 'Ginger'], ['candied', 'Candied fruits'], ['rose', 'Rose de Mai'], ['iris', 'Iris'], ['vanilla', 'Vanilla'], ['woodchips', 'Cashmere wood']] },
    fresca: { name: 'Fresca', ar: 374 / 880, cap: .27, sh: .37,
      ings: [['raspberry', 'Red fruits'], ['apple', 'Apple'], ['cherry', 'Cherry'], ['orangeblossom', 'Orange blossom'], ['jasmine', 'Jasmine'], ['cream', 'Whipped cream'], ['amber', 'Amber'], ['sandalwood', 'Sandalwood']] },
  };
  const bottle = document.getElementById('bottle'), ingsEl = document.getElementById('ings'), lede = document.getElementById('lede');
  const LEDE = lede.textContent;
  const clamp = (x) => Math.min(1, Math.max(0, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
  const io = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const bump = (t, a, b, f) => Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b));
  // geometry, in % of the bench photograph: the bottle stands at x 50%, its base at 61.4%, 31% tall
  const BX = 50, BASE = 61.4, BH = 31;
  let key = 'locken', ings = [], plan = null, start = null;

  function setBottle(k) {
    key = k; const b = B[k], src = `assets/${k}-cut.webp`;
    bottle.querySelectorAll('img').forEach((im) => { im.src = src; });
    bottle.style.setProperty('--ar', b.ar); bottle.style.setProperty('--cap', b.cap); bottle.style.setProperty('--sh', b.sh); bottle.style.setProperty('--m', `url(${src})`);
    bottle.setAttribute('aria-label', `${b.name} by Feminista`);
    ingsEl.innerHTML = b.ings.map(([f, n], i) => `<div class="ing"><div class="f" style="--bt:${5 + (i % 4)}s;--bd:${-i * .7}s"><img src="assets/ing/${f}.webp" alt=""><span>${n}</span></div></div>`).join('');
    ings = [...ingsEl.children];
    // where each note rests: an arc over the bottle, alternating sides; where it comes from: the dark ends of the bench
    const n = ings.length, top = BASE - BH;
    plan = ings.map((_, i) => {
      const a = (162 - (144 * i) / Math.max(1, n - 1)) * Math.PI / 180;
      const mob = innerWidth < 760, rest = mob ? [BX + 12.5 * Math.cos(a), top + BH * .3 - 19 * Math.sin(a)] : [BX + 25 * Math.cos(a), top + BH * .36 - 21 * Math.sin(a)];
      const from = mob ? [rest[0] < BX ? 33 : 67, 62 + (i % 2) * 4] : [rest[0] < BX ? 10 + (i % 3) * 5 : 90 - (i % 3) * 5, 60 + (i % 2) * 4];
      return { rest, from };
    });
    // pour from alternating ends of the arc
    const order = []; for (let i = 0, l = 0, r = n - 1; i < n; i++) order.push(i % 2 ? r-- : l++);
    order.forEach((idx, k2) => { plan[idx].turn = k2; });
  }

  function compose() { start = performance.now(); lede.textContent = `Now composing ${B[key].name}.`; }

  function fusion(now) {
    requestAnimationFrame(fusion);
    if (start === null) { bottle.style.setProperty('--fill', 0); return; }
    const t = qs.has('still') ? +qs.get('at') : (now - start) / 1000, n = ings.length, top = BASE - BH, neck = [BX, top + BH * B[key].cap * .9];
    const POUR = 3.4, STEP = .42, FLY = .95, END = POUR + (n - 1) * STEP + FLY;
    let pulse = 0;
    ings.forEach((el, i) => {
      const p = plan[i], appear = io(seg(t, i * .16, i * .16 + 1.3));
      const t0 = POUR + p.turn * STEP, fly = io(seg(t, t0, t0 + FLY));
      const x0 = p.from[0] + (p.rest[0] - p.from[0]) * appear, y0 = p.from[1] + (p.rest[1] - p.from[1]) * appear;
      const mx = (x0 + neck[0]) / 2, my = Math.min(y0, neck[1]) - 12;
      const u = fly, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * neck[0], y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * neck[1];
      el.style.left = `${x.toFixed(3)}%`; el.style.top = `${y.toFixed(3)}%`;
      el.style.transform = `translate(-50%, -50%) scale(${((.55 + .45 * appear) * (1 - .85 * fly)).toFixed(3)})`;
      el.style.opacity = (appear * (1 - seg(fly, .8, 1))).toFixed(3);
      el.querySelector('span').style.opacity = String(1 - seg(fly, 0, .2));
      pulse = Math.max(pulse, bump(t, t0 + FLY * .85, t0 + FLY + .45, .12));
    });
    const lift = io(seg(t, POUR - .5, POUR)) * (1 - io(seg(t, END + .1, END + .7)));
    const fill = io(seg(t, POUR + .4, END + .1));
    const sp = seg(t, END + .8, END + 2.2);
    bottle.style.setProperty('--fill', fill.toFixed(4)); bottle.style.setProperty('--lift', lift.toFixed(4));
    bottle.style.setProperty('--pulse', (pulse * .9).toFixed(3)); bottle.style.setProperty('--glow', (pulse + fill * .4).toFixed(3));
    bottle.style.setProperty('--sp', sp.toFixed(3)); bottle.style.setProperty('--sheen', (sp > 0 && sp < 1 ? Math.sin(sp * Math.PI) : 0).toFixed(3));
    if (t > END + 1 && lede.dataset.done !== key) { lede.dataset.done = key; lede.textContent = `${B[key].name}, composed. Now it is given time.`; }
  }

  document.querySelectorAll('.pick button[data-k]').forEach((b) => b.addEventListener('click', () => {
    if (b.getAttribute('aria-pressed') === 'true') return;
    document.querySelectorAll('.pick button[data-k]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    bottle.classList.add('swap'); start = null;
    setTimeout(() => { setBottle(b.dataset.k); delete lede.dataset.done; bottle.style.setProperty('--fill', 0);
      setTimeout(() => { bottle.classList.remove('swap'); compose(); }, 120); }, 450);
  }));
  document.getElementById('again').addEventListener('click', () => { delete lede.dataset.done; compose(); });
  setBottle('locken');
  // ?at=6 shows that moment of the fusion (seconds) for reviewing a single frame
  const qs = new URLSearchParams(location.search);

  // lights on once the room has loaded
  const room = document.querySelector('.room img');
  const go = () => { size(); requestAnimationFrame(frame); requestAnimationFrame(dust); requestAnimationFrame(fusion); requestAnimationFrame(() => body.classList.add('lit'));
    if (qs.has('at')) { start = performance.now() - +qs.get('at') * 1000; lede.textContent = `Now composing ${B[key].name}.`; } else setTimeout(compose, WALK + 600); };
  addEventListener('resize', size);
  if (room.complete) go(); else room.addEventListener('load', go, { once: true });
})();
