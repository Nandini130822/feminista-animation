/* 07 · The Orbit — one pinned stage, scored in a single scroll value u (0 → 1):
   the Locken photograph, a cream blob opening out of the bottle, the three bottles orbiting the title,
   then each composition held in turn, and the orbit gathering back. Plain arithmetic on scroll. */
(() => {
  const sec = document.getElementById('s-orbit'); if (!sec) return;
  const $ = (s) => sec.querySelector(s), $$ = (s) => [...sec.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), range = (v, a, b) => clamp((v - a) / (b - a));
  const smooth = (t) => t * t * (3 - 2 * t);
  const qs = new URLSearchParams(location.search);

  const T = { push: [0, .1], heroOut: [.01, .06], portal: [.07, .17], sharpen: [.12, .2], scatter: [.26, .3], stream: [.29, .9], gather: [.9, .96] };
  const N = 3;
  const phase = (u, i) => { const [a, b] = T.stream, step = (b - a) / (N + .35), s = a + i * step; return range(u, s, s + step * 1.35); };
  const yOf = (t) => (t <= .32 ? Math.pow(1 - t / .32, 3) : t < .68 ? 0 : -Math.pow((t - .68) / .32, 3));
  const light = (t) => clamp((.28 - Math.abs(t - .5)) / .1);

  // an organic edge: the radius breathes on a few low harmonics
  function blob(cx, cy, r, ph, tilt = -.3, squash = .76, pts = 72) {
    const c = Math.cos(tilt), s = Math.sin(tilt); let d = '';
    for (let k = 0; k < pts; k++) {
      const a = (k / pts) * Math.PI * 2;
      const w = 1 + .055 * Math.sin(3 * a + ph) + .035 * Math.sin(5 * a - ph * 1.4) + .02 * Math.sin(2 * a + ph * .6);
      const x0 = Math.cos(a) * r * w, y0 = Math.sin(a) * r * squash * w;
      d += `${k ? 'L' : 'M'}${(cx + x0 * c - y0 * s).toFixed(1)} ${(cy + x0 * s + y0 * c).toFixed(1)}`;
    }
    return d + 'Z';
  }

  const pin = $('.ob-pin'), photo = $('.ob-photo'), photoImg = $('.ob-photo img'), heroBits = $$('[data-out]'), layer = $('.ob-layer');
  const ctype = $$('[data-type]'), slots = $$('[data-slot]'), items = $$('[data-scent]');
  const counter = $('[data-counter]'), cnum = $('[data-counter-num]'), cbar = $('[data-counter-bar]');
  const prevY = new Array(items.length).fill(0);
  let lastU = -1, lastC = -1;

  // where the bottle's body sits in the photograph (0–1); the blob is born there
  const BOTTLE = [.6, .64];
  function bottlePoint() {
    const pr = pin.getBoundingClientRect(), r = photoImg.getBoundingClientRect();
    return [r.left - pr.left + BOTTLE[0] * r.width, r.top - pr.top + BOTTLE[1] * r.height];
  }

  function frame() {
    requestAnimationFrame(frame);
    const r = sec.getBoundingClientRect(), vh = innerHeight, W = pin.clientWidth;
    if (r.bottom < 0 || r.top > vh) return;
    const u = qs.has('orbit') ? +qs.get('orbit') : clamp(-r.top / Math.max(1, r.height - vh));
    if (u === lastU) return; lastU = u;
    const mob = W < 760;

    // the photograph: a slow push toward the bottle
    const push = smooth(range(u, T.push[0], T.push[1]));
    photo.style.transform = `scale(${(1 + push * .22).toFixed(4)})`;
    const ho = range(u, T.heroOut[0], T.heroOut[1]);
    heroBits.forEach((n, i) => { const k = clamp((ho - i * .12) / .65);
      n.style.opacity = String(1 - k); n.style.filter = k > .001 ? `blur(${(k * 12).toFixed(1)}px)` : 'none'; n.style.transform = `translate3d(0, ${(-k * 24).toFixed(1)}px, 0)`; });

    // the cream blob opens out of the bottle and swallows the screen
    const pp = range(u, T.portal[0], T.portal[1]);
    if (pp <= 0) layer.style.visibility = 'hidden';
    else {
      layer.style.visibility = 'visible';
      if (pp >= 1) layer.style.clipPath = 'none';
      else {
        const [cx, cy] = bottlePoint(), H = pin.clientHeight, sq = .76;
        const maxR = (Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) / sq) * 1.12;
        const e = pp < .5 ? 4 * pp * pp * pp : 1 - Math.pow(-2 * pp + 2, 3) / 2;
        layer.style.clipPath = `path('${blob(cx, cy, Math.max(2, e * maxR), u * 60, -.34 + pp * .22, sq)}')`;
      }
    }

    // the orbit: sharpen in, scatter for the stream, gather back
    const sharpen = smooth(range(u, T.sharpen[0], T.sharpen[1]));
    const away = smooth(range(u, T.scatter[0], T.scatter[1])) * (1 - smooth(range(u, T.gather[0], T.gather[1])));
    const blurIn = (1 - sharpen) * 14;
    ctype.forEach((n, i) => { const k = clamp(away * 1.4 - i * .04), b = blurIn + k * 12;
      n.style.opacity = String((.35 + .65 * sharpen) * (1 - k)); n.style.filter = b > .05 ? `blur(${b.toFixed(1)}px)` : 'none';
      n.style.transform = `translate3d(0, ${(-k * 20).toFixed(1)}px, 0) scale(${(1.03 - .03 * sharpen).toFixed(4)})`; });
    const rx = Math.min(W * (mob ? .36 : .3), 560), ry = vh * (mob ? .26 : .22), turn = u * Math.PI * 5;
    slots.forEach((n, i) => {
      const a = (i / slots.length) * Math.PI * 2 + turn, depth = Math.sin(a), front = (depth + 1) / 2, burst = 1 + away * 1.6;
      n.style.transform = `translate(-50%, -50%) translate3d(${(Math.cos(a) * rx * burst).toFixed(1)}px, ${(depth * ry * burst).toFixed(1)}px, 0) rotate(${(-Math.cos(a) * 6).toFixed(2)}deg) scale(${((.74 + .46 * front) * (1 + away * 2)).toFixed(3)})`;
      n.style.zIndex = depth > 0 ? '3' : '1';
      n.style.opacity = String((.4 + .6 * sharpen) * (.6 + .4 * front) * (1 - away));
      const b = blurIn * .6 + (1 - front) * 2 + away * 10; n.style.filter = b > .05 ? `blur(${b.toFixed(1)}px)` : 'none';
    });

    // each composition, held in turn
    let cur = -1, best = 0;
    items.forEach((n, i) => {
      const t = phase(u, i), live = t > 0 && t < 1;
      n.style.visibility = live ? 'visible' : 'hidden'; if (!live) return;
      const y = yOf(t), vel = Math.abs(y - prevY[i]); prevY[i] = y;
      const L = light(t); if (L > best) { best = L; cur = i; }
      const travel = Math.abs(y), b = Math.min(10, travel * 9 + vel * 120);
      const bottle = n.querySelector('[data-bottle]'), glow = n.querySelector('[data-glow]'), text = n.querySelector('[data-text]');
      bottle.style.transform = `translate3d(0, ${(y * vh * .95).toFixed(1)}px, 0) scale(${(1 - travel * .12).toFixed(3)}) rotate(${(y * (i % 2 ? 5 : -5)).toFixed(2)}deg)`;
      bottle.style.filter = b > .1 ? `blur(${b.toFixed(1)}px)` : 'none';
      glow.style.opacity = String(L * .9); glow.style.transform = `translate(-50%, -50%) translate3d(0, ${(y * vh * .5).toFixed(1)}px, 0) scale(${(.7 + L * .3).toFixed(3)})`;
      text.style.opacity = String(L); text.style.filter = L < .999 ? `blur(${((1 - L) * 10).toFixed(1)}px)` : 'none';
      text.style.transform = `${mob ? '' : 'translateY(-50%) '}translate3d(0, ${(y * vh * .35).toFixed(1)}px, 0)`;
      text.style.pointerEvents = L > .6 ? 'auto' : 'none';
    });
    const inStream = u > T.stream[0] + .01 && u < T.stream[1] - .005;
    counter.style.opacity = inStream ? '1' : '0';
    cbar.style.transform = `scaleX(${range(u, T.stream[0], T.stream[1]).toFixed(4)})`;
    if (cur >= 0 && cur !== lastC) { lastC = cur; cnum.textContent = String(cur + 1).padStart(2, '0'); }
  }
  requestAnimationFrame(frame);

  // jump into the stream
  const toU = (u) => sec.getBoundingClientRect().top + scrollY + u * (sec.offsetHeight - innerHeight);
  $$('[data-to-stream]').forEach((b) => b.addEventListener('click', () => scrollTo({ top: toU(T.stream[0] + .05), behavior: 'smooth' })));

  // add to bag: a quiet confirmation
  const toast = $('.ob-toast');
  let tt = 0;
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => {
    b.querySelector('span').textContent = 'Added to bag'; b.querySelector('i').textContent = '✓';
    toast.querySelector('b').textContent = b.dataset.add; toast.classList.add('on');
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 2600);
    setTimeout(() => { b.querySelector('span').textContent = 'Add to bag'; b.querySelector('i').textContent = '+'; }, 2200);
  }));
})();
