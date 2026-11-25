/* One bottle, three screens. Scroll (or the dots, the arrows, the nav) moves s from 0 → 2;
   the bottle and its disc glide between their places, and each screen's words blur in and out. */
(() => {
  const stage = document.getElementById('stage'), pin = document.getElementById('pin'), bottle = document.getElementById('bottle'), disc = document.getElementById('disc');
  const layers = [...document.querySelectorAll('[data-st]')], dots = [...document.querySelectorAll('#pager li')], cdots = [...document.querySelectorAll('.carousel i')];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const qs = new URLSearchParams(location.search);
  document.getElementById('yr').textContent = new Date().getFullYear();

  // scroll → s, with a hold on each screen so it can be read
  const MAP = [[0, 0], [.14, 0], [.42, 1], [.58, 1], [.86, 2], [1, 2]];
  const toS = (p) => { for (let i = 0; i < MAP.length - 1; i++) { const [a, sa] = MAP[i], [b, sb] = MAP[i + 1]; if (p <= b) return lerp(sa, sb, ease(clamp((p - a) / (b - a)))); } return 2; };
  const toP = (s) => [.06, .5, .93][s];

  // where the bottle and the disc sit on each screen, as fractions of the screen: x centre, y base, height
  const places = (W, H) => {
    const mob = W < 860;
    return mob ? {
      b: [[.5, .9, .5], [.5, .86, .4], [.66, .74, .4]],
      d: [[.5, .9, 0], [.5, .74, .3], [.7, .6, .34]],
    } : {
      b: [[.5, .93, .66], [.5, .82, .5], [.8, .93, .74]],
      d: [[.5, .9, 0], [.5, .66, .36], [.8, .66, .5]],
    };
  };
  const at = (arr, s) => { const i = Math.min(1, Math.floor(s)), t = s - i; return arr[i].map((v, k) => lerp(v, arr[i + 1][k], t)); };

  let last = -1;
  function frame(now) {
    requestAnimationFrame(frame);
    const r = stage.getBoundingClientRect();
    const p = qs.has('s') ? toP(+qs.get('s')) : clamp(-r.top / Math.max(1, stage.offsetHeight - innerHeight));
    const s = qs.has('s') ? +qs.get('s') : toS(p);
    const W = pin.clientWidth, H = pin.clientHeight, P = places(W, H);
    const breathe = Math.sin(now / 2600) * 4;

    // the bottle: glides between its three places, leaning a little while it travels
    const [bx, by, bh] = at(P.b, s), travel = Math.sin((s % 1) * Math.PI) * (s % 1 ? 1 : 0);
    const h = bh * H, w = h * 486 / 935;
    bottle.style.height = `${h.toFixed(1)}px`;
    bottle.style.transform = `translate3d(${(bx * W - w / 2).toFixed(1)}px, ${(by * H - h + breathe).toFixed(1)}px, 0) rotate(${(travel * (s < 1 ? -5 : 6)).toFixed(2)}deg)`;

    // the disc: grows from nothing under the bottle, then moves and widens behind it
    const [dx, dy, dr] = at(P.d, s), R = dr * H;
    disc.style.width = disc.style.height = `${(R * 2).toFixed(1)}px`;
    disc.style.transform = `translate3d(${(dx * W - R).toFixed(1)}px, ${(dy * H - R).toFixed(1)}px, 0)`;
    disc.style.opacity = String(clamp(dr * 6));

    if (Math.abs(s - last) > .0005) {
      last = s;
      // each screen's words: sharp when it holds, blurred and drifting while the next arrives
      layers.forEach((el) => {
        const d = s - +el.dataset.st, wgt = clamp(1 - Math.abs(d) * 1.8);
        el.style.opacity = wgt.toFixed(3);
        el.style.filter = wgt < .999 ? `blur(${((1 - wgt) * 12).toFixed(1)}px)` : 'none';
        el.style.translate = `0 ${(-d * 30).toFixed(1)}px`;
        el.style.pointerEvents = wgt > .6 ? 'auto' : 'none';
        el.style.visibility = wgt > .001 ? 'visible' : 'hidden';
      });
      const k = Math.round(s);
      dots.forEach((d, i) => d.classList.toggle('on', i === k)); cdots.forEach((d, i) => d.classList.toggle('on', i === k));
    }
  }
  requestAnimationFrame(frame);

  // jump to a screen
  const go = (i) => scrollTo({ top: stage.offsetTop + toP(clamp(i, 0, 2)) * (stage.offsetHeight - innerHeight), behavior: 'smooth' });
  document.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); go(+el.dataset.go); }));
  const cur = () => Math.round(toS(clamp(-stage.getBoundingClientRect().top / Math.max(1, stage.offsetHeight - innerHeight))));
  document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => go((cur() + +b.dataset.step + 3) % 3)));
})();
