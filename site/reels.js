/* Films in an arched frame: choose one and it crossfades in; each plays through to the next. */
(() => {
  const sec = document.getElementById('bfilm'); if (!sec) return;
  const vids = [...sec.querySelectorAll('.bf-screen video')];
  const btns = [...sec.querySelectorAll('.bf-prog button')], bars = btns.map((b) => b.querySelector('em'));
  const num = document.getElementById('bf-num'), cap = document.getElementById('bf-cap'), sound = document.getElementById('bf-sound');
  let cur = 0, visible = false, muted = true;

  function play() {
    const v = vids[cur];
    if (visible) { v.preload = 'auto'; v.muted = muted; v.play().catch(() => {}); } else v.pause();
  }
  function show(i) {
    i = (i + vids.length) % vids.length;
    if (i === cur) return;
    const prev = vids[cur]; cur = i;
    btns.forEach((b, k) => b.classList.toggle('on', k === cur));
    vids.forEach((v, k) => v.classList.toggle('on', k === cur));
    num.textContent = String(cur + 1).padStart(2, '0'); cap.textContent = btns[cur].querySelector('span').textContent;
    vids[cur].currentTime = 0; play();
    setTimeout(() => { if (prev !== vids[cur]) prev.pause(); }, 1200);
  }
  vids.forEach((v, i) => v.addEventListener('ended', () => { if (i === cur) show(cur + 1); }));
  btns.forEach((b, i) => b.addEventListener('click', () => show(i)));
  sound.addEventListener('click', () => {
    muted = !muted; vids[cur].muted = muted; if (!muted) vids[cur].play().catch(() => {});
    sound.setAttribute('aria-pressed', String(!muted)); sound.textContent = muted ? 'Sound off' : 'Sound on';
  });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) sec.classList.add('in');
    if (!visible && !muted) sound.click();
    play();
  }, { threshold: .25 }).observe(sec);

  (function tick() {
    requestAnimationFrame(tick);
    const v = vids[cur];
    bars.forEach((b, k) => { b.style.width = k === cur && v.duration ? `${(v.currentTime / v.duration) * 100}%` : '0%'; });
  })();
})();
