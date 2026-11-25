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

  // the bottle on the bench
  const bottle = document.getElementById('bottle'), bImg = document.getElementById('b-img'), bRefl = document.getElementById('b-refl');
  document.querySelectorAll('.pick button').forEach((b) => b.addEventListener('click', () => {
    if (b.getAttribute('aria-pressed') === 'true') return;
    document.querySelectorAll('.pick button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    bottle.classList.add('swap');
    setTimeout(() => {
      const src = `assets/${b.dataset.k}-cut.webp`; bImg.src = src; bRefl.src = src; bImg.alt = `${b.textContent} by Feminista`;
      bImg.onload = () => bottle.classList.remove('swap');
    }, 450);
  }));

  // lights on once the room has loaded
  const room = document.querySelector('.room img');
  const go = () => { size(); requestAnimationFrame(frame); requestAnimationFrame(dust); requestAnimationFrame(() => body.classList.add('lit')); };
  addEventListener('resize', size);
  if (room.complete) go(); else room.addEventListener('load', go, { once: true });
})();
