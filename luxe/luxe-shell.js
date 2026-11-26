/* FEMINISTA — Maison: the header, menu, bag and footer every page shares, and the quiet reveals. */
const ORDER = ['locken', 'vers', 'fresca', 'discovery-set'];
const CUT = { locken: '../assets/locken-cut.webp', vers: '../assets/vers-cut.webp', fresca: '../assets/fresca-cut.webp', 'discovery-set': '../site/img/p-set-1.webp' };
const BANNER = { locken: 'img/locken-driftwood-bg.webp', vers: 'img/vers-stone-bg.webp', fresca: 'img/fresca-true-bg.webp', 'discovery-set': 'img/discovery-set-banner.webp' };
const BANNER_P = { ...BANNER, 'discovery-set': 'img/discovery-set-portrait.webp' };
const inr = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

(() => {
  const page = document.body.dataset.page || '';
  const nl = (href, label, key) => `<a href="${href}"${page === key ? ' class="on"' : ''}>${label}</a>`;
  const icon = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 9h18M3 15h18"/></svg>',
  };
  document.body.insertAdjacentHTML('afterbegin', `
<div class="announce">Complimentary shipping across India<b>·</b>Delivered within 7 days</div>
<header class="head" id="head">
  <nav aria-label="Main">${nl('fragrances.html', 'Fragrances', 'shop')}${nl('product.html?p=discovery-set', 'Discovery Set', 'set')}${nl('art-of-180.html', 'The Art of 180', 'art')}</nav>
  <button class="burger" type="button" id="open-menu" aria-label="Menu">${icon.menu}</button>
  <a class="mark" href="index.html" aria-label="Feminista, home"><img class="b" src="../site/img/logo-black.webp" alt="Feminista"><img class="w" src="../site/img/logo.webp" alt=""></a>
  <div class="tools">
    <nav aria-label="House">${nl('our-story.html', 'Our Story', 'story')}</nav>
    <a class="t-search" href="fragrances.html" aria-label="Search">${icon.search}</a>
    <a class="t-acc" href="account.html" aria-label="Account">${icon.user}</a>
    <button type="button" id="open-bag" aria-label="Bag">Bag<span class="count" id="count">0</span></button>
  </div>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <button class="close" type="button" id="close-menu">Close</button>
  <a class="big" href="index.html">Home</a><a class="big" href="fragrances.html">Fragrances</a><a class="big" href="product.html?p=discovery-set">The Discovery Set</a>
  <a class="big" href="art-of-180.html">The Art of 180</a><a class="big" href="our-story.html">Our Story</a>
  <div class="sub"><a href="account.html">Account</a><a href="contact.html">Contact</a><a href="shipping.html">Shipping</a><a href="returns.html">Returns</a></div>
</div>
<div class="veil" id="veil"></div>
<aside class="bag" id="bag" aria-label="Your bag" aria-hidden="true">
  <div class="bag-head"><p>Your bag</p><button class="link" type="button" id="close-bag">Close</button></div>
  <ul class="bag-list" id="bag-list"></ul>
  <div class="bag-empty" id="bag-empty"><p>Nothing here yet</p>Each Feminista composition is rested 180 days. Take your time.</div>
  <div class="bag-foot"><div class="tot"><span class="small">Subtotal</span><b id="bag-total">₹0</b></div><p class="small">Inclusive of all taxes · Complimentary shipping</p>
    <a class="btn" href="contact.html">Checkout</a><p class="small">Demo site · checkout is not connected</p></div>
</aside>
<p class="toast" id="toast" role="status"></p>`);

  document.body.insertAdjacentHTML('beforeend', `
<footer class="foot">
  <div class="wrap news">
    <h3>Be the first to know <em>what she wears next.</em></h3>
    <form onsubmit="event.preventDefault(); this.reset(); toast('Thank you. You are on the list.');"><input type="email" required placeholder="Your email address" aria-label="Your email address"><button>Subscribe</button></form>
  </div>
  <div class="wrap cols">
    <div><img src="../site/img/logo.webp" alt="Feminista"><p class="sign">Created for her.<br>Never adapted to her.</p></div>
    <div><h4>Fragrances</h4><ul><li><a href="fragrances.html">Shop all</a></li><li><a href="product.html?p=locken">Locken</a></li><li><a href="product.html?p=vers">Vers</a></li><li><a href="product.html?p=fresca">Fresca</a></li><li><a href="product.html?p=discovery-set">Discovery Set</a></li></ul></div>
    <div><h4>The House</h4><ul><li><a href="our-story.html">Our Story</a></li><li><a href="art-of-180.html">The Art of 180</a></li><li><a href="account.html">Account</a></li></ul></div>
    <div><h4>Client care</h4><ul><li><a href="contact.html">Contact us</a></li><li><a href="shipping.html">Shipping &amp; delivery</a></li><li><a href="returns.html">Returns &amp; refunds</a></li><li><a href="privacy.html">Privacy policy</a></li></ul></div>
  </div>
  <div class="foot-word rv-word" aria-hidden="true"><span>Feminista</span></div>
  <div class="wrap base"><p>© ${new Date().getFullYear()} Feminista · Maison de parfum, India · Demo site</p><nav><a href="privacy.html">Privacy</a><a href="returns.html">Returns</a><a href="../index.html">All studies</a></nav></div>
</footer>`);

  // header over a hero turns solid on scroll
  const onScroll = () => document.body.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menu = $('#menu');
  $('#open-menu').onclick = () => { menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false'); };
  $('#close-menu').onclick = () => { menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); };

  // the bag, remembered between pages
  const bag = $('#bag'), veil = $('#veil');
  let items = {}; try { items = JSON.parse(localStorage.getItem('feminista-maison') || '{}'); } catch (_) { /* private mode */ }
  const save = () => { try { localStorage.setItem('feminista-maison', JSON.stringify(items)); } catch (_) { /* private mode */ } };
  function render() {
    const keys = Object.keys(items).filter((k) => items[k] > 0 && PRODUCTS[k]);
    $('#count').textContent = keys.reduce((n, k) => n + items[k], 0);
    $('#bag-list').innerHTML = keys.map((k) => { const p = PRODUCTS[k]; return `<li><div class="th"><img src="${CUT[k]}" alt=""></div>
      <div><b>${p.name}</b><small>${p.size}</small><br><span class="qty"><button type="button" data-q="${k}" data-d="-1" aria-label="One less">−</button>${items[k]}<button type="button" data-q="${k}" data-d="1" aria-label="One more">+</button></span></div>
      <span>${inr(p.price * items[k])}</span></li>`; }).join('');
    $('#bag-empty').style.display = keys.length ? 'none' : 'block';
    $('#bag-total').textContent = inr(keys.reduce((n, k) => n + PRODUCTS[k].price * items[k], 0));
  }
  const openBag = (o) => { bag.classList.toggle('open', o); veil.classList.toggle('on', o); bag.setAttribute('aria-hidden', String(!o)); };
  $('#open-bag').onclick = () => openBag(true); $('#close-bag').onclick = () => openBag(false); veil.onclick = () => openBag(false);
  $('#bag-list').addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (!b) return; items[b.dataset.q] = Math.max(0, (items[b.dataset.q] || 0) + +b.dataset.d); save(); render(); });
  window.addToBag = (k, n = 1) => { items[k] = (items[k] || 0) + n; save(); render(); toast(`${PRODUCTS[k].name} added to your bag`); setTimeout(() => openBag(true), 350); };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-add]'); if (b) { e.preventDefault(); addToBag(b.dataset.add); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { openBag(false); $('#close-menu').click(); } });
  render();

  let tt = 0;
  window.toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); };

  // quiet reveals
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  const watch = () => $$('.rv:not(.in), .rv-img:not(.in), .foot-word:not(.in)').forEach((el) => io.observe(el));
  watch(); window.watchReveals = watch;
})();

/* a product card, used on every page */
function pcard(k, opts = {}) {
  const p = PRODUCTS[k], g = p.gallery;
  return `<article class="pcard ${opts.cls || ''}"><a href="product.html?p=${k}" class="ph rv-img">
      <img src="${opts.img || g[g.length - 1]}" alt="${p.name} by Feminista" loading="lazy"><img class="alt" src="${opts.alt || BANNER_P[k]}" alt="" loading="lazy">
      <button type="button" class="quick" data-add="${k}">Add to bag · ${inr(p.price)}</button></a>
    <div class="meta"><div><h3><a href="product.html?p=${k}">${p.name}</a></h3><p>${p.tagline}</p></div><b>${inr(p.price)}</b></div>
    <p class="tag">${p.tag}</p></article>`;
}
