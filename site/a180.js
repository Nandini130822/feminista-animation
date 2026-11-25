/* The Art of 180: counting stats, the pinned five-phase journey, and the quote parallax. */
(() => {
  const ease = (t) => 1 - Math.pow(1 - t, 4);

  // stats count up the first time they are seen
  const counters = [...document.querySelectorAll('[data-count]')];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = to > 9 ? 2200 : 1200;
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * ease(k));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }), { threshold: .6 });
  counters.forEach((c) => { c.textContent = '0'; io.observe(c); });

  // the journey: the phase in the middle of the screen leads the pinned frame
  const steps = [...document.querySelectorAll('.ph')];
  const imgs = [...document.querySelectorAll('#x-frame img')], dots = [...document.querySelectorAll('#x-dots li')];
  const day = document.getElementById('x-day');
  let cur = -1, shown = 1, anim = 0;
  function countDay(to) {
    cancelAnimationFrame(anim);
    const from = shown, t0 = performance.now();
    (function step(now) {
      const k = Math.min(1, (now - t0) / 1100);
      shown = Math.round(from + (to - from) * ease(k));
      day.textContent = String(shown).padStart(3, '0');
      if (k < 1) anim = requestAnimationFrame(step);
    })(t0);
  }
  function setPhase(i) {
    if (i === cur) return;
    cur = i;
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    imgs.forEach((m, k) => m.classList.toggle('on', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    if (day) countDay(parseInt(steps[i].dataset.day.replace(/\D/g, ''), 10));
  }
  if (steps.length) {
    const phaseIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setPhase(+e.target.dataset.i); }),
      { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => phaseIO.observe(s));
    setPhase(0);
  }

  // the quote image drifts slower than the page
  const q = document.querySelector('.x-quote'), bg = q && q.querySelector('.x-quote-bg');
  if (bg && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    (function frame() {
      requestAnimationFrame(frame);
      const r = q.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight + r.height);
      bg.style.setProperty('--py', `${(p * -18).toFixed(2)}%`);
    })();
  }
})();
