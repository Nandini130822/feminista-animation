/* One bottle, three screens, and a return. Scroll moves s from 0 → 3:
   0 hero · 1 collection · 2 features · 3 back to the collection, the bottle easing upright on its disc.
   Every line of text wipes in from the left as it slides into place, and wipes away the same way. */
(() => {
  const stage = document.getElementById('stage'), pin = document.getElementById('pin'), bottle = document.getElementById('bottle'), disc = document.getElementById('disc');
  const layers = [...document.querySelectorAll('[data-st]')], dots = [...document.querySelectorAll('#pager li')], cdots = [...document.querySelectorAll('.carousel i')];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const qs = new URLSearchParams(location.search);
  document.getElementById('yr').textContent = new Date().getFullYear();

  // scroll → s, with a hold on each screen so it can be read
  const MAP = [[0, 0], [.1, 0], [.3, 1], [.42, 1], [.62, 2], [.74, 2], [.94, 3], [1, 3]];
  const toS = (p) => { for (let i = 0; i < MAP.length - 1; i++) { const [a, sa] = MAP[i], [b, sb] = MAP[i + 1]; if (p <= b) return lerp(sa, sb, ease(clamp((p - a) / (b - a)))); } return 3; };
  const toP = (s) => [.05, .36, .68, .97][s];

  // where the bottle and the disc sit on each screen (fractions of the screen): bottle x centre, y base, height, tilt;
  // disc x, y, radius. The fourth place is the return: back on the collection disc, nearly upright.
  const places = (W) => (W < 860 ? {
    b: [[.6, .97, .58, 0], [.5, .9, .44, -12], [.84, 1.0, .48, -15], [.5, .88, .44, 0]],
    d: [[.5, .9, 0], [.5, .72, .26], [.92, .86, .5], [.5, .72, .26]],
  } : {
    b: [[.48, .98, .6, 0], [.5, .92, .68, -12], [.8, 1.1, .98, -16], [.5, .9, .66, 0]],
    d: [[.5, .9, 0], [.5, .64, .34], [.86, .82, .62], [.5, .64, .34]],
  });
  const at = (arr, s) => { const i = clamp(Math.floor(s), 0, arr.length - 2), t = clamp(s - i); return arr[i].map((v, k) => lerp(v, arr[i + 1][k], t)); };

  // every line of text inside a screen gets the wipe
  const lines = layers.map((el) => [...el.querySelectorAll('h1, h2, p, .cards-r b, .btn, .sibs, li span, li i, button')]);
  // which screens each layer belongs to (the collection comes back at the end)
  const homes = layers.map((el) => (el.dataset.st === '1' ? [1, 3] : [+el.dataset.st]));

  let last = -1;
  function frame(now) {
    requestAnimationFrame(frame);
    const r = stage.getBoundingClientRect();
    const p = qs.has('s') ? toP(+qs.get('s')) : clamp(-r.top / Math.max(1, stage.offsetHeight - innerHeight));
    const s = qs.has('s') ? +qs.get('s') : toS(p);
    const W = pin.clientWidth, H = pin.clientHeight, P = places(W);
    const breathe = Math.sin(now / 2600) * 4;

    // the bottle glides between its places; on the return it eases gradually upright
    const [bx, by, bh, tilt] = at(P.b, s);
    const h = bh * H, w = h * 486 / 935;
    bottle.style.height = `${h.toFixed(1)}px`;
    bottle.style.transform = `translate3d(${(bx * W - w / 2).toFixed(1)}px, ${(by * H - h + breathe).toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
    pin.style.setProperty('--heroBg', clamp(1 - s * 1.4).toFixed(3));

    const [dx, dy, dr] = at(P.d, s), R = dr * H;
    disc.style.width = disc.style.height = `${(R * 2).toFixed(1)}px`;
    disc.style.transform = `translate3d(${(dx * W - R).toFixed(1)}px, ${(dy * H - R).toFixed(1)}px, 0)`;
    disc.style.opacity = String(clamp(dr * 6));

    if (Math.abs(s - last) > .0005) {
      last = s;
      layers.forEach((el, li) => {
        // distance to the nearest of this layer's screens
        const d = homes[li].reduce((m, st) => (Math.abs(s - st) < Math.abs(m) ? s - st : m), 9);
        const wgt = clamp(1 - Math.abs(d) * 1.7);
        el.style.visibility = wgt > .001 ? 'visible' : 'hidden';
        el.style.opacity = clamp(wgt * 2.5).toFixed(3);          // panels and cards fade quickly; the words do the moving
        el.style.filter = 'none'; el.style.translate = '0 0';
        el.style.pointerEvents = wgt > .6 ? 'auto' : 'none';
        // the words: each line wipes in from the left, sliding right into place; leaving, it wipes away to the left
        lines[li].forEach((n, k) => {
          const stag = k * .07, kk = easeOut(clamp((wgt - stag) / (1 - stag)));
          n.style.clipPath = kk >= .999 ? 'none' : `inset(-20% -20% -20% ${((1 - kk) * 100).toFixed(1)}%)`;
          n.style.translate = kk >= .999 ? '0 0' : `${(-(1 - kk) * 60).toFixed(1)}px 0`;
          n.style.opacity = kk.toFixed(3);
        });
      });
      const k = [0, 1, 2, 1][Math.round(s)];
      dots.forEach((d, i) => d.classList.toggle('on', i === k)); cdots.forEach((d, i) => d.classList.toggle('on', i === k));
    }
  }
  requestAnimationFrame(frame);

  // jump to a screen
  const go = (i) => scrollTo({ top: stage.offsetTop + toP(clamp(i, 0, 3)) * (stage.offsetHeight - innerHeight), behavior: 'smooth' });
  document.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); go(+el.dataset.go); }));
  const cur = () => Math.round(toS(clamp(-stage.getBoundingClientRect().top / Math.max(1, stage.offsetHeight - innerHeight))));
  document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => go((Math.min(2, cur()) + +b.dataset.step + 3) % 3)));
})();
