/* FEMINISTA demo website: shared header, menu, cart and footer. Product copy is from feminista.co.in. */
const PRODUCTS = {
  locken: { slug: 'locken', name: 'Locken', tag: 'The Magnetic', tagline: 'Never Just Sweet.', price: 8000, size: '100 ml', rating: '4.9', reviews: 128,
    short: 'Beneath the familiar lies something unexpected. A depth that reveals itself slowly.',
    card: 'img/p-locken-3.webp', list: 'img/p-locken-3.webp', gallery: ['img/p-locken-1.webp', 'img/p-locken-2.webp', 'img/p-locken-3.webp', 'img/p-locken-4.webp'],
    story: [['A Presence That Lingers', 'Locken is warm, magnetic and unapologetically expressive. It opens with the addictive contrast of almond, coffee, bergamot and lemon, before unfolding into a luminous floral heart of tuberose, jasmine sambac, orange blossom and Bulgarian rose.'],
      ['Composed Without Haste', 'Every detail of Locken is shaped with intention. The composition is given nearly 180 days to mature, allowing its notes to deepen, soften and come together with greater balance.'],
      ['Made to Be Remembered', 'Locken is created for evenings, celebrations and moments that call for presence. Bold without becoming overwhelming, it is designed for the woman who never needs to announce her arrival. She enters. The room remembers.']],
    notes: [['Almond', 'Coffee', 'Bergamot', 'Lemon'], ['Tuberose', 'Jasmine Sambac', 'Orange Blossom', 'Bulgarian Rose'], ['Tonka Bean', 'Cacao', 'Vanilla', 'Praline', 'Sandalwood', 'Musk', 'Amber', 'Cashmere Wood', 'Patchouli', 'Cinnamon', 'Cedar']],
    wear: 'Apply to pulse points — wrists, neck and behind the ears — just after showering, when skin is warm and hydrated. For a longer trail, layer one spray on clothing. Reapply after 6–8 hours for evenings that run late.',
    ingredients: 'Alcohol Denat., Parfum (Fragrance), Aqua (Water), Limonene, Linalool, Citral, Geraniol, Benzyl Benzoate, Coumarin.' },
  vers: { slug: 'vers', name: 'Vers', tag: 'The Intimate', tagline: 'The Beauty of Contrast.', price: 8000, size: '100 ml', rating: '4.8', reviews: 96,
    short: 'A little unexpected. A little irresistible. Never quite what it seems.',
    card: 'img/p-vers-4.webp', list: 'img/p-vers-4.webp', gallery: ['img/p-vers-1.webp', 'img/p-vers-2.webp', 'img/p-vers-3.webp', 'img/p-vers-4.webp'],
    story: [['A Quiet Kind of Power', 'Vers is soft, graceful and quietly expressive. It opens with the subtle warmth of cinnamon, cardamom and ginger, before unfolding into a smooth heart of praline, candied fruits and white flowers.'],
      ['Composed Without Haste', 'Every element of Vers is shaped with patience. The composition is given nearly 180 days to mature, allowing its spice, softness and warmth to settle into a more balanced expression.'],
      ['Made to Stay Close', 'Vers is created for everyday rituals, intimate occasions and moments of quiet confidence. It does not demand attention; it draws people closer. Softness becomes its strength.']],
    notes: [['Cinnamon', 'Cardamom', 'Ginger'], ['Peony', 'Rose de Mai', 'Lily of the Valley', 'Iris'], ['White Musk', 'Cashmere Wood', 'Ambrette', 'Vanilla', 'Soft Suede']],
    wear: 'Mist lightly onto skin from a short distance, focusing on the collarbone and wrists so the scent stays close and personal. Ideal for daytime wear — refresh once in the early evening to keep its trail alive.',
    ingredients: 'Alcohol Denat., Parfum (Fragrance), Aqua (Water), Linalool, Citral, Geraniol, Benzyl Salicylate, Alpha-Isomethyl Ionone.' },
  fresca: { slug: 'fresca', name: 'Fresca', tag: 'The Luminous', tagline: 'The Art of Subtlety.', price: 7000, size: '100 ml', rating: '4.9', reviews: 74,
    short: 'Delicate at first. A little more indulgent with time. Effortlessly intriguing.',
    card: 'img/p-fresca-4.webp', list: 'img/p-fresca-4.webp', gallery: ['img/p-fresca-1.webp', 'img/p-fresca-2.webp', 'img/p-fresca-3.webp', 'img/p-fresca-4.webp'],
    story: [['A Light That Lingers', 'Fresca is fresh, radiant and confidently expressive. It opens with a bright fruity freshness, before unfolding into a soft apple heart and settling into a smooth base of whipped cream and vanilla.'],
      ['Perfected Through Time', 'Fresca is given nearly 180 days to mature, allowing its freshness and softness to settle into balance — becoming smoother, creamier and more complete.'],
      ['Made to Be Remembered', 'Fresca is created for spontaneous days, special occasions and moments that call for effortless confidence. It does not follow the moment. She transforms it.']],
    notes: [['Fruits'], ['Magnolia', 'Orange Blossom', 'Jasmine', 'Water Lily'], ['Amber', 'Musk', 'Vetiver', 'Sandalwood', 'Soft Woods']],
    wear: 'Spray onto pulse points and hair ends for a diffused trail that moves with you through the day. Layer with the matching body lotion, when available, for a longer-lasting effect.',
    ingredients: 'Alcohol Denat., Parfum (Fragrance), Aqua (Water), Limonene, Citral, Linalool, Hexyl Cinnamal, Benzyl Alcohol.' },
  'discovery-set': { slug: 'discovery-set', name: 'The Discovery Set', tag: 'Meet All Three', tagline: 'Three scents. One unforgettable you.', price: 2500, was: 3600, size: '3 × 10 ml', rating: '5', reviews: 51,
    short: 'A curated set of Locken, Vers and Fresca in 10ml travel formats — the complete house of Feminista, in miniature.',
    card: 'img/p-set-1.webp', list: 'img/discovery-wine.webp', gallery: ['img/p-set-1.webp', 'img/p-set-2.webp', 'img/p-set-3.webp', 'img/p-set-4.webp'],
    story: [['Meet All Three', 'For the woman who cannot choose just one. The Discovery Set brings together Locken, Vers and Fresca in considered 10ml formats — travel-ready, gift-ready, and the easiest way to find your signature.'],
      ['Own the Full Story', 'Each bottle is finished with the same craftsmanship as its full-size counterpart, so nothing about the experience feels reduced — only distilled.']],
    notes: [['A taste of Locken', 'Vers and Fresca'], ['Three complete compositions'], ['Travel-ready 10ml formats']],
    wear: 'Wear each scent on a different day to let it develop fully on your skin before deciding on your signature.',
    ingredients: 'See individual fragrance listings for Locken, Vers and Fresca.' },
};
const ORDER = ['locken', 'vers', 'fresca', 'discovery-set'];
const inr = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
const $ = (s, r = document) => r.querySelector(s);

/* ── chrome ─────────────────────────────────────────────────────────── */
const page = document.body.dataset.page || '';
const navLink = (href, label, key) => `<a href="${href}"${page === key ? ' class="on"' : ''}>${label}</a>`;
document.body.insertAdjacentHTML('afterbegin', `
<header class="site-head" id="site-head">
  <div class="announce">Complimentary shipping across India<span class="a-more"> <b>·</b> Delivered within 7 days</span></div>
  <div class="bar">
    <nav class="nav" aria-label="Main">${navLink('fragrances.html', 'Fragrances', 'fragrances')}${navLink('art-of-180.html', 'The Art of 180', 'art')}${navLink('our-story.html', 'Our Story', 'story')}</nav>
    <a class="logo" href="index.html" aria-label="Feminista home"><img class="b" src="img/logo-black.webp" alt="Feminista"><img class="w" src="img/logo.webp" alt="Feminista"></a>
    <div class="tools">
      <a class="ico" href="fragrances.html" aria-label="Search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></a>
      <a class="t-acc t-txt" href="contact.html">Account</a>
      <button type="button" id="open-cart" aria-label="Bag"><span class="t-txt">Bag</span> <span class="cart-count" id="cart-count">0</span></button>
      <button type="button" id="open-menu" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg></button>
    </div>
  </div>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <div class="m-img"></div>
  <div class="m-body">
    <button class="m-close" type="button" id="close-menu">Close ×</button>
    <p class="eyebrow">Feminista</p>
    <a class="big" href="index.html">Home</a>
    <a class="big" href="fragrances.html">Fragrances</a>
    <a class="big" href="art-of-180.html">The Art of 180</a>
    <a class="big" href="our-story.html">Our Story</a>
    <a class="big" href="product.html?p=discovery-set">The Discovery Set</a>
    <div class="m-small"><a href="contact.html">My account</a><a href="fragrances.html">Wishlist</a><a href="#" id="menu-cart">View cart</a></div>
  </div>
</div>
<aside class="drawer" id="drawer" aria-label="Your cart" aria-hidden="true">
  <div class="drawer-head"><p class="eyebrow">Your cart</p><button type="button" class="link" id="close-cart">Close</button></div>
  <ul class="drawer-list" id="drawer-list"></ul>
  <p class="drawer-empty" id="drawer-empty">Your cart is empty.</p>
  <div class="drawer-foot"><p class="tot"><span>Subtotal</span><span id="drawer-total">₹0</span></p><button type="button" class="btn" id="checkout">Checkout</button><p>Complimentary shipping · Delivered within 7 days</p></div>
</aside>
<div class="veil" id="veil"></div>
<p class="toast" id="toast" role="status"></p>`);

document.body.insertAdjacentHTML('beforeend', `
<section class="circle">
  <div class="wrap">
    <div><p class="eyebrow">Join the circle</p><h2 class="h2" style="margin-top:14px">Never miss a new scent</h2></div>
    <div><p class="lede">Be the first to know about new compositions, private launches and stories from the house of Feminista.</p><p style="margin-top:22px"><a class="btn" href="contact.html">Create an account</a></p></div>
  </div>
</section>
<footer class="site-foot">
  <div class="wrap cols">
    <div class="brand"><img src="img/logo.webp" alt="Feminista"><p>Created for her.<br>Never adapted to her.</p></div>
    <div><h4>Fragrances</h4><ul><li><a href="fragrances.html">Shop All</a></li><li><a href="product.html?p=locken">Locken</a></li><li><a href="product.html?p=vers">Vers</a></li><li><a href="product.html?p=fresca">Fresca</a></li><li><a href="product.html?p=discovery-set">Discovery Set</a></li></ul></div>
    <div><h4>Customer Care</h4><ul><li><a href="contact.html">Contact Us</a></li><li><a href="shipping.html">Shipping &amp; Delivery</a></li><li><a href="returns.html">Returns &amp; Refunds</a></li><li><a href="contact.html">Track Your Order</a></li></ul></div>
    <div><h4>The House</h4><ul><li><a href="our-story.html">Our Story</a></li><li><a href="art-of-180.html">The Art of 180</a></li><li><a href="fragrances.html">Find Your Essence</a></li></ul></div>
    <div class="nl"><h4>Newsletter</h4><p style="font-size:14px;color:rgba(233,226,228,.7)">Receive product updates, exclusive offers and early access.</p>
      <form class="news" onsubmit="event.preventDefault(); this.reset(); showToast('Thank you. You are on the list.');"><input type="email" required placeholder="Your email" aria-label="Your email"><button>Subscribe →</button></form></div>
  </div>
  <div class="wrap base"><p>© ${new Date().getFullYear()} Feminista · All rights reserved · Demo site</p><nav><a href="privacy.html">Privacy Policy</a><a href="returns.html">Returns</a></nav></div>
</footer>`);

/* ── header behaviour ───────────────────────────────────────────────── */
const head = $('#site-head');
const onScroll = () => head.classList.toggle('solid', scrollY > (document.body.classList.contains('over-hero') ? innerHeight * .85 : 10));
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const veil = $('#veil');
const openMenu = (o) => { $('#menu').classList.toggle('open', o); $('#menu').setAttribute('aria-hidden', String(!o)); };
$('#open-menu').onclick = () => openMenu(true); $('#close-menu').onclick = () => openMenu(false);

/* ── cart ───────────────────────────────────────────────────────────── */
let cart = {};
try { cart = JSON.parse(localStorage.getItem('feminista-site-cart')) || {}; } catch (_) { cart = {}; }
const saveCart = () => { try { localStorage.setItem('feminista-site-cart', JSON.stringify(cart)); } catch (_) { /* private mode */ } };
function renderCart() {
  const keys = Object.keys(cart).filter((k) => cart[k] > 0 && PRODUCTS[k]);
  $('#cart-count').textContent = keys.reduce((s, k) => s + cart[k], 0);
  $('#drawer-total').textContent = inr(keys.reduce((s, k) => s + cart[k] * PRODUCTS[k].price, 0));
  $('#drawer-empty').style.display = keys.length ? 'none' : '';
  $('#drawer-list').innerHTML = keys.map((k) => { const p = PRODUCTS[k]; return `<li><img src="${p.gallery[0]}" alt=""><div><b>${p.name}</b><small>${p.size}</small><br>
    <span class="qty"><button data-q="${k}" data-d="-1" aria-label="One less">−</button>${cart[k]}<button data-q="${k}" data-d="1" aria-label="One more">+</button></span></div><span>${inr(p.price * cart[k])}</span></li>`; }).join('');
}
function openCart(o) { $('#drawer').classList.toggle('open', o); $('#drawer').setAttribute('aria-hidden', String(!o)); veil.classList.toggle('on', o); }
function addToCart(slug, n = 1, from) {
  if (!PRODUCTS[slug]) return;
  cart[slug] = (cart[slug] || 0) + n; saveCart();
  flyToCart(slug, from).then(() => { renderCart(); showToast(`${PRODUCTS[slug].name} added to your cart`); });
}
/* the bottle flies along an arc into the cart */
function flyToCart(slug, from) {
  const target = $('#cart-count');
  if (!target || matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  const src = ['vers', 'locken', 'fresca'].includes(slug) ? `../assets/${slug}-cut.webp` : 'img/p-set-1.webp';
  let r = from && from.getBoundingClientRect ? from.getBoundingClientRect() : from;
  if (!r || !r.width) r = { left: innerWidth / 2 - 40, top: innerHeight / 2 - 60, width: 80, height: 120 };
  const t = target.getBoundingClientRect();
  const h = Math.min(170, Math.max(90, r.height * .55)), w = h * .5;
  const sx = r.left + r.width / 2 - w / 2, sy = r.top + r.height / 2 - h / 2;
  const ex = t.left + t.width / 2 - w / 2, ey = t.top + t.height / 2 - h / 2;
  const el = document.createElement('img'); el.src = src; el.alt = ''; el.className = 'flyer' + (slug === 'discovery-set' ? ' round' : '');
  el.style.cssText = `width:${w}px;height:${h}px;left:0;top:0`;
  document.body.appendChild(el);
  const mx = (sx + ex) / 2 + (ex > sx ? -1 : 1) * Math.min(160, Math.abs(ex - sx) * .25), my = Math.max(12, Math.min(sy, ey) - Math.min(140, Math.abs(ey - sy) * .35 + 40));
  const anim = el.animate([
    { transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, opacity: 0, offset: 0 },
    { transform: `translate(${sx}px, ${sy - 18}px) scale(1.06) rotate(-4deg)`, opacity: 1, offset: .14 },
    { transform: `translate(${mx}px, ${my}px) scale(.72) rotate(-14deg)`, opacity: 1, offset: .55 },
    { transform: `translate(${ex}px, ${ey}px) scale(.1) rotate(8deg)`, opacity: .9, offset: 1 },
  ], { duration: 1150, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
  return anim.finished.then(() => {
    el.remove();
    target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump');
    const ring = document.createElement('i'); ring.className = 'cart-ring';
    ring.style.cssText = `left:${t.left + t.width / 2}px;top:${t.top + t.height / 2}px`;
    document.body.appendChild(ring); setTimeout(() => ring.remove(), 900);
  }).catch(() => el.remove());
}
$('#open-cart').onclick = () => openCart(true); $('#close-cart').onclick = () => openCart(false); veil.onclick = () => openCart(false);
$('#menu-cart').onclick = (e) => { e.preventDefault(); openMenu(false); openCart(true); };
$('#drawer-list').onclick = (e) => { const b = e.target.closest('[data-q]'); if (!b) return; cart[b.dataset.q] = Math.max(0, (cart[b.dataset.q] || 0) + +b.dataset.d); saveCart(); renderCart(); };
$('#checkout').onclick = () => showToast('Checkout is not part of this demo');
document.addEventListener('click', (e) => { const b = e.target.closest('[data-add]'); if (!b) return; e.preventDefault();
  const box = b.closest('article, .info, .banner-in, .ess'); const img = box && box.querySelector('.card-img img, .gal .main img');
  addToCart(b.dataset.add, +(b.dataset.n || 1), img || b); });
addEventListener('message', (e) => { if (!e.data || e.data.type !== 'feminista-add') return;
  const fr = [...document.querySelectorAll('iframe')].find((f) => f.contentWindow === e.source);
  const r = fr && fr.getBoundingClientRect();
  addToCart(e.data.slug, 1, r ? { left: r.left + r.width * .3, top: r.top + r.height * .25, width: r.width * .4, height: r.height * .5 } : null); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') { openCart(false); openMenu(false); } });
let tt; function showToast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400); }
renderCart();

/* ── motion: one easing, staggered reveals, image wipes ──────────── */
const io = new IntersectionObserver((es) => {
  es.filter((en) => en.isIntersecting).forEach((en, i) => { en.target.style.transitionDelay = `${Math.min(i, 5) * 90}ms`; en.target.classList.add('in'); io.unobserve(en.target); });
}, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
const watch = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
watch(); window.watchReveals = watch;

/* smooth scrolling (Lenis); the page works normally if it cannot load */
let lenis = null;
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
  sc.onload = () => {
    if (!window.Lenis) return;
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  };
  document.head.appendChild(sc);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a || !lenis) return;
  const el = document.querySelector(a.getAttribute('href')); if (!el) return;
  e.preventDefault(); lenis.scrollTo(el, { offset: 0 });
});
const pause = () => lenis && ($('#menu').classList.contains('open') || $('#drawer').classList.contains('open') ? lenis.stop() : lenis.start());
new MutationObserver(pause).observe($('#menu'), { attributes: true, attributeFilter: ['class'] });
new MutationObserver(pause).observe($('#drawer'), { attributes: true, attributeFilter: ['class'] });

/* page transitions: a curtain with the mark lifts on arrival and falls on departure */
document.body.insertAdjacentHTML('beforeend', '<div class="curtain" aria-hidden="true"><img src="img/logo.webp" alt=""></div>');
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
  e.preventDefault();
  document.body.classList.add('leaving');
  setTimeout(() => { location.href = url.href; }, 620);
});
addEventListener('pageshow', (e) => { if (e.persisted) document.body.classList.remove('leaving'); });
