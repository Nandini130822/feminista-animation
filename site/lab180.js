/* The Art of 180 — one bottle on the real workbench. Scroll drives five phases:
   the notes are gathered, fused into the bottle, rested for 180 days, judged, and finished. */
(() => {
  const sec = document.getElementById('l180'); if (!sec) return;
  const pin = sec.querySelector('.l180-pin'), $ = (s) => sec.querySelector(s);
  const B = {
    locken: { name: 'Locken', tag: 'The Magnetic', ar: 486 / 935, cap: .165, sh: .28,
      ings: [['lemon', 'Lemon'], ['almond', 'Almond'], ['coffee', 'Coffee'], ['tuberose', 'Tuberose'], ['jasmine', 'Jasmine sambac'], ['rose', 'Bulgarian rose'], ['tonka', 'Tonka bean'], ['vanilla', 'Vanilla'], ['sandalwood', 'Sandalwood']] },
    vers: { name: 'Vers', tag: 'The Intimate', ar: 388 / 863, cap: .23, sh: .37,
      ings: [['cinnamon', 'Cinnamon'], ['cardamom', 'Cardamom'], ['ginger', 'Ginger'], ['candied', 'Candied fruits'], ['rose', 'Rose de Mai'], ['iris', 'Iris'], ['vanilla', 'Vanilla'], ['woodchips', 'Cashmere wood']] },
    fresca: { name: 'Fresca', tag: 'The Luminous', ar: 374 / 880, cap: .27, sh: .37,
      ings: [['raspberry', 'Red fruits'], ['apple', 'Apple'], ['cherry', 'Cherry'], ['orangeblossom', 'Orange blossom'], ['jasmine', 'Jasmine'], ['cream', 'Whipped cream'], ['amber', 'Amber'], ['sandalwood', 'Sandalwood']] },
  };
  const ORDER = ['vers', 'locken', 'fresca'];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const bump = (p, a, b, f = .03) => Math.min(seg(p, a, a + f), 1 - seg(p, b - f, b));

  const bottle = $('.l180-bottle'), ingsEl = $('.l180-ings'), arts = [...sec.querySelectorAll('.l180-text article')];
  const rail = [...sec.querySelectorAll('.l180-rail li')], day = $('#l180-day'), strips = [...sec.querySelectorAll('.strip')];
  const sideL = $('.l180-side.l img'), sideR = $('.l180-side.r img');
  let key = 'locken', ings = [], geo = null;

  // the dial: 180 ticks, one per day
  const svg = $('.l180-dial svg'); let ticks = '';
  for (let i = 0; i < 180; i++) { const a = (i / 180) * Math.PI * 2 - Math.PI / 2, r1 = 96, r2 = i % 30 ? 99 : 102;
    ticks += `<line class="tk" x1="${(Math.cos(a) * r1).toFixed(2)}" y1="${(Math.sin(a) * r1).toFixed(2)}" x2="${(Math.cos(a) * r2).toFixed(2)}" y2="${(Math.sin(a) * r2).toFixed(2)}"/>`; }
  svg.innerHTML = ticks + '<circle class="arc" r="92" transform="rotate(-90)" pathLength="1" stroke-dasharray="0 1"/>';
  const tickEls = [...svg.querySelectorAll('.tk')], arc = svg.querySelector('.arc');

  function setBottle(k) {
    key = k; const b = B[k], src = `../assets/${k}-cut.webp`;
    bottle.querySelectorAll('img').forEach((im) => { im.src = src; });
    bottle.style.setProperty('--ar', b.ar); bottle.style.setProperty('--cap', b.cap); bottle.style.setProperty('--sh', b.sh);
    bottle.style.setProperty('--m', `url(${src})`);
    const others = ORDER.filter((x) => x !== k); sideL.src = `../assets/${others[0]}-cut.webp`; sideR.src = `../assets/${others[1]}-cut.webp`;
    ingsEl.innerHTML = b.ings.map(([f, n], i) => `<div class="ing"><div class="f" style="--bt:${5 + (i % 4)}s;--bd:${-i * .7}s"><img src="../assets/ing/${f}.webp" alt=""><span>${n}</span></div></div>`).join('');
    ings = [...ingsEl.children];
    sec.querySelector('#l180-bench').textContent = b.ings.map((x) => x[1]).join(' · ');
    sec.querySelectorAll('[data-name]').forEach((el) => { el.textContent = b.name; });
    const go = sec.querySelector('#l180-go'); if (go) go.href = `product.html?p=${k}`;
    sec.querySelectorAll('.l180-pick button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === k)));
    geo = null;
  }

  function layout() {
    const pr = pin.getBoundingClientRect(), br = bottle.getBoundingClientRect();
    const W = pr.width, H = pr.height, bh = br.height, bw = br.width;
    const cx = br.left - pr.left + bw / 2, top = br.top - pr.top, cy = top + bh * .5;
    const mob = W < 900, n = ings.length;
    // an arc over the bottle's shoulders, kept clear of the text (left) and the phase list (right)
    const ox = mob ? cx : cx + W * .07, oy = top + bh * (mob ? .42 : .42);
    const rx = mob ? W * .4 : Math.min(W * .26, 380), ry = bh * (mob ? .5 : .4);
    const a0 = mob ? 168 : 142, a1 = mob ? 12 : 18, order = [];
    for (let i = 0; i < n; i++) { const a = (a0 + (a1 - a0) * (i / Math.max(1, n - 1))) * Math.PI / 180;
      order.push([ox + rx * Math.cos(a), oy - ry * Math.sin(a)]); }
    // pour from alternating ends of the arc
    const seq = []; for (let i = 0, l = 0, r = n - 1; i < n; i++) seq.push(order[i % 2 ? r-- : l++]);
    geo = { W, H, cx, top, bh, neck: [cx, top + bh * B[key].cap * .9], pts: seq };
  }

  let last = -1;
  function frame() {
    requestAnimationFrame(frame);
    const r = sec.getBoundingClientRect(), span = r.height - pin.offsetHeight;
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = FIX !== null ? FIX : clamp(-(r.top - (parseFloat(getComputedStyle(pin).top) || 0)) / Math.max(1, span));
    if (!geo) layout();
    if (Math.abs(p - last) < .00005 && geo) return; last = p;
    const S = pin.style, n = ings.length, W = geo.W;

    // ── I. Selection: the notes come to the bench
    // ── II. Composition: the cap lifts, each note is poured in, the bottle fills, the cap returns
    const lift = ease(seg(p, .17, .21)) * (1 - ease(seg(p, .39, .43)));
    const fill = ease(seg(p, .21, .41));
    let pulse = 0;
    ings.forEach((el, i) => {
      const [x0, y0] = geo.pts[i], appear = ease(seg(p, .015 + i * .013, .055 + i * .013));
      const t0 = .215 + (i / n) * .165, fly = ease(seg(p, t0, t0 + .045));
      const [nx, ny] = geo.neck, mx = (x0 + nx) / 2, my = Math.min(y0, ny) - geo.bh * .22;
      const u = fly, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * nx, y = (1 - u) * (1 - u) * (y0 + (1 - appear) * 40) + 2 * (1 - u) * u * my + u * u * ny;
      const sc = (.7 + .3 * appear) * (1 - .82 * fly);
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${sc.toFixed(3)})`;
      el.style.opacity = (appear * (1 - seg(fly, .82, 1))).toFixed(3);
      el.querySelector('span').style.opacity = String(1 - seg(fly, 0, .25));
      pulse = Math.max(pulse, bump(p, t0 + .038, t0 + .075, .012));
    });
    bottle.style.setProperty('--fill', fill.toFixed(4)); bottle.style.setProperty('--lift', lift.toFixed(4));
    bottle.style.setProperty('--pulse', (pulse * .9).toFixed(3)); bottle.style.setProperty('--ps', (.5 + pulse * .6).toFixed(3));
    S.setProperty('--fill', fill.toFixed(3));

    // ── III. Maturation: 180 days pass; the light rises and falls, the liquid deepens
    const m = seg(p, .44, .6), mIn = bump(p, .42, .63, .025);
    S.setProperty('--dial', mIn.toFixed(3));
    const d = Math.max(1, Math.round(1 + 179 * m)); day.textContent = String(d).padStart(3, '0');
    arc.setAttribute('stroke-dasharray', `${m.toFixed(4)} 1`);
    const on = Math.round(m * 180); tickEls.forEach((t, i) => t.classList.toggle('on', i < on));
    S.setProperty('--night', (mIn * (.35 + .25 * Math.sin(m * Math.PI * 6) ** 2)).toFixed(3));
    S.setProperty('--sun', (mIn * .9).toFixed(3)); S.setProperty('--sx', `${(10 + ((m * 3) % 1) * 80).toFixed(1)}%`);
    const deep = seg(p, .44, .62);
    bottle.style.setProperty('--lb', (1 - .1 * deep).toFixed(3)); bottle.style.setProperty('--ls', (1.05 + .25 * deep).toFixed(3));

    // ── IV. Evaluation: three strips, judged in turn
    strips.forEach((s, k) => {
      const e = ease(seg(p, .64 + k * .025, .69 + k * .025)) * (1 - seg(p, .77, .8));
      s.style.opacity = e.toFixed(3);
      s.style.transform = `translate(calc(-100% - ${(18 + k * 6).toFixed(0)}px), ${(-k * 30).toFixed(0)}px) rotate(${(-(4 + k * 9) * e).toFixed(2)}deg) scaleX(${(.6 + .4 * e).toFixed(3)})`;
    });

    // ── V. Bottling: light runs across the glass, then the other two join
    const sp = seg(p, .8, .88); bottle.style.setProperty('--sp', sp.toFixed(3)); bottle.style.setProperty('--sheen', (bump(p, .8, .89, .02)).toFixed(3));
    const trio = ease(seg(p, .87, .95)); S.setProperty('--trio', trio.toFixed(3)); bottle.style.setProperty('--bs', (1 - .14 * trio).toFixed(3)); S.setProperty('--bx', `${(trio * (W < 900 ? 0 : 11)).toFixed(2)}vw`);

    // the room itself
    const ph = p < .17 ? 0 : p < .42 ? 1 : p < .62 ? 2 : p < .79 ? 3 : p < .9 ? 4 : 5;
    S.setProperty('--bgb', [.64, .6, .42, .7, .62, .5][ph]); S.setProperty('--bgz', (1.02 + .06 * p).toFixed(4));
    S.setProperty('--glow', (.1 + pulse * .25 + (ph === 4 ? .1 : 0)).toFixed(3));
    S.setProperty('--cue', (1 - seg(p, 0, .03)).toFixed(3));
    arts.forEach((a, k) => a.classList.toggle('on', k === ph));
    rail.forEach((li, k) => { li.classList.toggle('on', k === Math.min(ph, 4)); li.classList.toggle('done', k < Math.min(ph, 4)); });
  }

  sec.querySelectorAll('.l180-pick button').forEach((b) => b.addEventListener('click', () => { setBottle(b.dataset.k); last = -1; }));
  const setHH = () => { const h = document.getElementById('site-head'); sec.style.setProperty('--hh', `${h ? h.offsetHeight : 0}px`); geo = null; last = -1; };
  addEventListener('resize', setHH); addEventListener('load', setHH);
  const qs = new URLSearchParams(location.search);
  setBottle(B[qs.get('perfume')] ? qs.get('perfume') : 'locken'); setTimeout(setHH, 50);
  // ?at=0.3 shows that moment of the story without scrolling (for reviewing a single frame)
  const FIX = qs.has('at') ? +qs.get('at') : null;
  requestAnimationFrame(frame);
})();
