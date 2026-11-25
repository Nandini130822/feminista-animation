/* Quiet motion only: things fade in as they arrive, the hero settles once. */
(() => {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.r').forEach((el) => io.observe(el));
  const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  requestAnimationFrame(() => document.body.classList.add('ready'));
})();
