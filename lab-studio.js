/* FEMINISTA — The Art of 180, inside the laboratory.
   The House's own photograph becomes a 3D surface (a hand-built depth map pushes every
   bottle, hand and bench toward the camera), so the camera can move, close in and pull focus
   for real. Each phase then plays out in the scene itself. */
import * as THREE from 'three';

const qs = new URLSearchParams(location.search);
const FIXED = qs.has('s') ? +qs.get('s') : null;
const IW = 1449, IH = 638, PW = 14.49, PH = 6.38, DZ = 2.1;

/* ── renderer ─────────────────────────────────────────────────────────── */
const canvas = document.getElementById('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { document.body.classList.add('no-gl'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#120c08');
const camera = new THREE.PerspectiveCamera(30, 1, .05, 100);
scene.add(new THREE.AmbientLight('#fff1dc', 1.1));
const sun = new THREE.DirectionalLight('#ffe2b8', 2.2); sun.position.set(6, 4, 6); scene.add(sun);

/* ── helpers ──────────────────────────────────────────────────────────── */
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const smokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  for (let i = 0; i < 20; i++) { const x = 64 + (Math.random() - .5) * 50, y = 64 + (Math.random() - .5) * 50, r = 16 + Math.random() * 30;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  g.globalCompositeOperation = 'destination-in'; const m = g.createRadialGradient(64, 64, 8, 64, 64, 62); m.addColorStop(0, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c); })();

/* ── assets ───────────────────────────────────────────────────────────── */
const loadTex = (url, color) => new Promise((res, rej) => new THREE.TextureLoader().load(url, (t) => { if (color) t.colorSpace = THREE.NoColorSpace; res(t); }, undefined, rej));
const loadImg = (url) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
const [photo, depthTex, maskTex, depthImg] = await Promise.all([
  loadTex('assets/lab/art-of-180-lab.webp', true), loadTex('assets/lab/lab-depth.png'), loadTex('assets/lab/lab-mask.png'), loadImg('assets/lab/lab-depth.png'),
]);
photo.minFilter = THREE.LinearMipmapLinearFilter; photo.generateMipmaps = true; photo.anisotropy = 8;
const dCan = document.createElement('canvas'); dCan.width = IW; dCan.height = IH;
const dCtx = dCan.getContext('2d', { willReadFrequently: true }); dCtx.drawImage(depthImg, 0, 0);
const dData = dCtx.getImageData(0, 0, IW, IH).data;
const depthAt = (px, py) => dData[(Math.min(IH - 1, Math.max(0, Math.round(py))) * IW + Math.min(IW - 1, Math.max(0, Math.round(px)))) * 4] / 255;
// a pixel of the photograph → its place in the 3D scene
const P3 = (px, py, lift = 0) => V((px / IW - .5) * PW, (.5 - py / IH) * PH, depthAt(px, py) * DZ + lift);

/* ── the photograph, in depth ─────────────────────────────────────────── */
const U = {
  map: { value: photo }, dmap: { value: depthTex }, mmap: { value: maskTex }, uD: { value: DZ },
  uFocus: { value: .5 }, uBlur: { value: 0 }, uNight: { value: 0 }, uSweep: { value: 0 }, uSweepAmt: { value: 0 },
  uBeak: { value: new THREE.Color('#e9b54a') }, uBeakAmt: { value: 0 }, uFill: { value: 0 }, uGlow: { value: 0 },
  uHerb: { value: 0 }, uPaper: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 0 },
};
const room = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH, 360, 160), new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: `uniform sampler2D dmap; uniform float uD; varying vec2 vUv; varying float vDepth;
    void main(){ vUv = uv; float d = texture2D(dmap, uv).r; vDepth = d; vec3 p = position; p.z += d * uD;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
  fragmentShader: `uniform sampler2D map, mmap; uniform float uFocus, uBlur, uNight, uSweep, uSweepAmt, uBeakAmt, uFill, uGlow, uHerb, uPaper, uTime, uWarm; uniform vec3 uBeak;
    varying vec2 vUv; varying float vDepth;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 m = texture2D(mmap, vUv);
      float lod = clamp(abs(vDepth - uFocus) * uBlur, 0., 3.6);
      vec3 c = textureLod(map, vUv, lod).rgb;
      float lum = dot(c, vec3(.299, .587, .114));
      // composition: the beaker takes the colour of each note, then the accord
      c = mix(c, uBeak * (.25 + lum * 1.35), m.r * uBeakAmt);
      // selection: the herbs catch the light
      c += m.a * uHerb * vec3(1., .78, .42) * .22 * (.6 + .4 * sin(uTime * 2. + vUv.x * 40.));
      // evaluation: the papers warm under the lamp
      c += m.b * uPaper * vec3(1., .86, .62) * .08;
      // bottling: the bottle fills with light from the bottom up
      float L = 1. - mix(414., 180., uFill) / 638.;
      float below = smoothstep(L + .004, L - .004, vUv.y);
      float shimmer = .65 + .35 * sin(vUv.x * 90. + uTime * 2.5 + sin(vUv.y * 60. - uTime * 1.7) * 2.);
      c += m.g * below * uGlow * vec3(1., .74, .3) * .32 * shimmer;
      c += m.g * uGlow * exp(-pow((vUv.y - L) / .0045, 2.)) * vec3(1., .9, .6) * .7 * step(.002, uFill) * (1. - step(.995, uFill));
      // maturation: days and nights pass across the bench
      float band = exp(-pow((vUv.x - (1. - vUv.y) * .4 - uSweep) / .16, 2.));
      c += c * band * .5 * uSweepAmt * (1. - uNight);
      c = mix(c, c * vec3(.42, .5, .72), uNight * .75);
      c *= 1. + uWarm * .06;
      c += (h(vUv * 811. + uTime) - .5) * .012;
      gl_FragColor = vec4(c, 1.);
    }`,
}));
scene.add(room);

/* ── particles: dust in the light, motes from the herbs ───────────────── */
function points(n, tex, blending, order) {
  const g = new THREE.BufferGeometry(), o = { n, pos: new Float32Array(n * 3), col: new Float32Array(n * 3), size: new Float32Array(n), alpha: new Float32Array(n) };
  g.setAttribute('position', new THREE.BufferAttribute(o.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(o.col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(o.size, 1)); g.setAttribute('aAlpha', new THREE.BufferAttribute(o.alpha, 1));
  o.mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uScale: { value: 400 } }, transparent: true, depthWrite: false, blending, vertexColors: true,
    vertexShader: `attribute float aSize, aAlpha; varying float vA; varying vec3 vC; uniform float uScale;
      void main(){ vA = aAlpha; vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D map; varying float vA; varying vec3 vC; void main(){ float a = texture2D(map, gl_PointCoord).a * vA; if (a < .003) discard; gl_FragColor = vec4(vC, a); }` });
  o.points = new THREE.Points(g, o.mat); o.points.frustumCulled = false; o.points.renderOrder = order; scene.add(o.points);
  o.flush = () => { for (const k of ['position', 'color', 'aSize', 'aAlpha']) g.attributes[k].needsUpdate = true; };
  return o;
}
const dust = points(520, glowTex, THREE.AdditiveBlending, 5);
const dustD = Array.from({ length: dust.n }, () => ({ x: Math.random(), y: Math.random(), z: .3 + Math.random() * 3.2, s: .006 + Math.random() * .016, ph: Math.random() * 6.28, sp: .2 + Math.random() * .6 }));
const motes = points(160, glowTex, THREE.AdditiveBlending, 6);
const moteD = Array.from({ length: motes.n }, () => ({ px: 945 + Math.random() * 225, py: 545 + Math.random() * 50, ph: Math.random(), sp: .12 + Math.random() * .2, s: .015 + Math.random() * .03, sw: Math.random() * 6.28 }));
const wisps = points(70, smokeTex, THREE.AdditiveBlending, 7);
const wispD = Array.from({ length: wisps.n }, (_, i) => ({ px: i % 2 ? 560 + Math.random() * 160 : 800 + Math.random() * 380, py: i % 2 ? 560 + Math.random() * 60 : 470 + Math.random() * 90, ph: Math.random(), sp: .08 + Math.random() * .08, s: .3 + Math.random() * .5, sw: Math.random() * 6.28 }));
const sparks = points(90, glowTex, THREE.AdditiveBlending, 8);
const sparkD = Array.from({ length: sparks.n }, () => ({ px: 800 + Math.random() * 210, py: 80 + Math.random() * 350, ph: Math.random(), sp: .3 + Math.random() * .6, s: .02 + Math.random() * .04 }));

/* ── composition: drops from the pipette, ripples in the beaker ───────── */
const TIER = [{ name: 'Top', col: new THREE.Color('#f2d36b') }, { name: 'Heart', col: new THREE.Color('#e98fa3') }, { name: 'Base', col: new THREE.Color('#9a5a2c') }];
const ACCORD = new THREE.Color('#e8a83c');
const TIP = P3(424, 286, .02), SURF = P3(412, 446, .03);
const drops = TIER.map((t) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(.045, 24, 16), new THREE.MeshStandardMaterial({ color: t.col, emissive: t.col, emissiveIntensity: .55, roughness: .08, metalness: 0, transparent: true }));
  m.scale.set(1, 1.25, 1); scene.add(m);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 64), new THREE.MeshBasicMaterial({ color: '#fff2d6', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.position.copy(SURF); scene.add(ring);
  const ring2 = ring.clone(); ring2.material = ring.material.clone(); scene.add(ring2);
  return { m, ring, ring2 };
});
const beakGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffcf7a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
beakGlow.position.copy(P3(412, 478, .05)); beakGlow.scale.set(1.5, .9, 1); scene.add(beakGlow);
const bottleGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffc964', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
bottleGlow.position.copy(P3(905, 300, .1)); bottleGlow.scale.set(3.2, 3.6, 1); scene.add(bottleGlow);

/* ── selection: the notes rise from the bowl as words ────────────────── */
const NOTES = ['Almond', 'Coffee', 'Bergamot', 'Lemon', 'Tuberose', 'Jasmine sambac', 'Orange blossom', 'Bulgarian rose', 'Tonka bean', 'Cacao', 'Vanilla', 'Sandalwood', 'Amber', 'Cashmere wood'];
const tagsEl = document.getElementById('tags');
const tags = NOTES.map((n, i) => { const el = document.createElement('span'); el.className = 'tag'; el.textContent = n; tagsEl.appendChild(el);
  return { el, i, px: 960 + ((i * 53) % 200), py: 548 + ((i * 29) % 44), sw: i * 1.7 }; });

/* ── scroll → story ───────────────────────────────────────────────────── */
const secs = [...document.querySelectorAll('[data-k]')];
const panels = secs.map((s) => s.querySelector('.panel'));
const rail = [...document.querySelectorAll('.rail a')];
function readScroll() {
  const mid = scrollY + innerHeight * .5; let s = 0;
  secs.forEach((el, k) => { if (mid >= el.offsetTop) s = k + clamp01((mid - el.offsetTop) / el.offsetHeight); });
  return s;
}
if (FIXED !== null) { document.body.classList.add('fixed'); }

/* ── camera: where to look in each phase (photo pixels, zoom, focus) ──── */
const KEYS = [
  { px: 724, py: 330, zoom: 1.0, blur: 0 },     // the bench
  { px: 1062, py: 548, zoom: 2.15, blur: 6 },  // selection: the bowl of herbs
  { px: 455, py: 372, zoom: 1.7, blur: 5 },    // composition: pipette and beaker
  { px: 724, py: 330, zoom: 1.12, blur: 1.2 },  // maturation: the whole bench, time passing
  { px: 700, py: 548, zoom: 1.75, blur: 7 },   // evaluation: the papers
  { px: 905, py: 262, zoom: 2.25, blur: 6 },   // bottling: Locken
  { px: 724, py: 330, zoom: 1.0, blur: 0 },     // the end
];
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; });
const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
function frameCam(s, t, dt) {
  const k = Math.floor(s), f = s - k;
  const c = Math.min(6, k + smooth(.74, 1, f));
  const A = KEYS[Math.floor(c)], B = KEYS[Math.min(6, Math.ceil(c))], u = ease(c - Math.floor(c));
  const px = lerp(A.px, B.px, u), py = lerp(A.py, B.py, u), zoom = lerp(A.zoom, B.zoom, u) * (1 + Math.sin(t * .11) * .015);
  const aspect = innerWidth / innerHeight, mobile = innerWidth < 760;
  const base = Math.min(PH, PW / aspect) * .9;
  const visH = base / (zoom * (mobile ? .9 : 1)), visW = visH * aspect;
  const target = P3(px, py);
  target.x = Math.max(-PW / 2 + visW / 2 + .2, Math.min(PW / 2 - visW / 2 - .2, target.x));
  target.y = Math.max(-PH / 2 + visH / 2 + .15, Math.min(PH / 2 - visH / 2 - .15, target.y));
  const dist = (visH / 2) / tan;
  mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 3); mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 3);
  const sway = V(Math.sin(t * .17) * .12 + mouse.x * .6, Math.sin(t * .13) * .06 - mouse.y * .3, 0).multiplyScalar(dist / 9);
  camera.position.set(target.x + sway.x, target.y + sway.y, target.z + dist);
  camera.lookAt(target);
  U.uFocus.value = depthAt(px, py); U.uBlur.value = lerp(A.blur, B.blur, u);
}

/* ── each frame ───────────────────────────────────────────────────────── */
const P = [0, 0, 0, 0, 0, 0];
const tmp = V(), col = new THREE.Color();
function phases(t) {
  // 1 · Selection
  U.uHerb.value = Math.sin(Math.PI * clamp01(P[1] * 1.05)) * (P[1] > 0 && P[1] < 1 ? 1 : 0);
  tags.forEach((g) => {
    const t0 = g.i / tags.length * .62, u = clamp01((P[1] - t0) / .34);
    const on = u > 0 && u < 1;
    g.el.classList.toggle('on', on);
    if (!on) return;
    tmp.copy(P3(g.px, g.py, .1)).add(V(Math.sin(u * 4 + g.sw) * .18, u * 1.35, u * 1.1)).project(camera);
    g.el.style.transform = `translate(${((tmp.x * .5 + .5) * innerWidth).toFixed(1)}px, ${((-tmp.y * .5 + .5) * innerHeight).toFixed(1)}px) translate(-50%, -50%)`;
    g.el.style.opacity = (Math.sin(Math.PI * u) * 1.4).toFixed(2);
  });
  const mOn = P[1] > 0 && P[1] < 1 ? 1 : 0;
  moteD.forEach((d, i) => { const f = (t * d.sp + d.ph) % 1; const p = P3(d.px, d.py, .05);
    motes.pos[i * 3] = p.x + Math.sin(f * 5 + d.sw) * .12; motes.pos[i * 3 + 1] = p.y + f * 1.4; motes.pos[i * 3 + 2] = p.z + f * .9;
    motes.col[i * 3] = 1; motes.col[i * 3 + 1] = .8; motes.col[i * 3 + 2] = .45; motes.size[i] = d.s; motes.alpha[i] = mOn * Math.sin(Math.PI * f) * .9; });
  motes.flush();
  // 2 · Composition: three drops, three ripples; the beaker becomes the accord
  let amt = 0; col.set('#e9b54a');
  TIER.forEach((tier, i) => {
    const at = .18 + i * .24, d = drops[i];
    const grow = clamp01((P[2] - (at - .07)) / .07), fall = clamp01((P[2] - at) / .06), rip = clamp01((P[2] - at - .06) / .16);
    d.m.visible = P[2] > at - .07 && fall < 1 && P[2] < 1;
    const sc = .35 + .65 * grow;
    d.m.scale.set(sc, sc * (1.2 + fall * .5), sc);
    d.m.position.lerpVectors(TIP, SURF, fall * fall); d.m.position.y -= grow * .03 * (1 - fall);
    d.ring.material.opacity = rip > 0 && rip < 1 ? (1 - rip) * .75 : 0;
    d.ring.scale.set(.06 + rip * .55, (.06 + rip * .55) * .3, 1);
    d.ring2.material.opacity = rip > .15 && rip < 1 ? (1 - rip) * .45 : 0;
    const r2 = Math.max(0, rip - .15); d.ring2.scale.set(.04 + r2 * .5, (.04 + r2 * .5) * .3, 1);
    if (P[2] >= at + .06) { amt = Math.min(1, amt + .34); col.lerp(tier.col, .55); }
  });
  const accord = smooth(.78, .96, P[2]);
  col.lerp(ACCORD, accord);
  // 3 · Maturation: the accord deepens while days pass
  const deep = new THREE.Color('#b8661c');
  if (P[3] > 0) { col.copy(ACCORD).lerp(deep, smooth(0, 1, P[3]) * .55); amt = 1; }
  U.uBeak.value.copy(col); U.uBeakAmt.value = (P[2] > 0 ? Math.min(1, amt) * .85 : 0) * (1 - smooth(.6, 1, P[5]) * .6);
  beakGlow.material.color.copy(col); beakGlow.material.opacity = (P[2] > 0 ? accord * .55 + amt * .1 : 0) * (P[4] > 0 ? .4 : 1) + (P[2] > .9 && P[2] < 1 ? Math.exp(-Math.pow((P[2] - .95) / .02, 2)) * .8 : 0);
  const cycles = 6, ph = P[3] * cycles;
  const inMat = P[3] > 0 && P[3] < 1 ? 1 : 0;
  U.uNight.value = inMat * (.5 - .5 * Math.cos(ph * Math.PI * 2)) * smooth(0, .06, P[3]) * (1 - smooth(.94, 1, P[3]));
  U.uSweep.value = -.4 + (ph % 1) * 1.8; U.uSweepAmt.value = inMat;
  document.getElementById('day').textContent = String(Math.round(smooth(.03, .97, P[3]) * 180)).padStart(3, '0');
  // 4 · Evaluation: scent rises from the papers
  const wOn = P[4] > 0 && P[4] < 1 ? smooth(0, .12, P[4]) * (1 - smooth(.88, 1, P[4])) : 0;
  U.uPaper.value = wOn;
  wispD.forEach((d, i) => { const f = (t * d.sp + d.ph) % 1; const p = P3(d.px, d.py, .05);
    wisps.pos[i * 3] = p.x + Math.sin(f * 3 + d.sw) * .25 * f; wisps.pos[i * 3 + 1] = p.y + f * 1.6; wisps.pos[i * 3 + 2] = p.z + f * .6;
    wisps.col[i * 3] = 1; wisps.col[i * 3 + 1] = .78; wisps.col[i * 3 + 2] = .45; wisps.size[i] = d.s * (.4 + f); wisps.alpha[i] = wOn * Math.sin(Math.PI * f) * .55; });
  wisps.flush();
  document.getElementById('status').textContent = P[4] > .8 ? 'Balanced. Ready.' : P[4] > .4 ? 'Refining…' : 'Assessing the balance…';
  // 5 · Bottling: the Locken bottle fills with light
  U.uFill.value = smooth(.08, .8, P[5]); U.uGlow.value = P[5] > 0 ? 1 - smooth(.9, 1.4, P[5]) * .3 : 0;
  bottleGlow.material.opacity = P[5] > 0 ? .1 + smooth(.6, .95, P[5]) * .35 : 0;
  const spOn = P[5] > .55 ? smooth(.55, .8, P[5]) : 0;
  sparkD.forEach((d, i) => { const f = (t * d.sp + d.ph) % 1; const p = P3(d.px, d.py, .15);
    sparks.pos[i * 3] = p.x; sparks.pos[i * 3 + 1] = p.y + f * .25; sparks.pos[i * 3 + 2] = p.z;
    sparks.col[i * 3] = 1; sparks.col[i * 3 + 1] = .88; sparks.col[i * 3 + 2] = .55; sparks.size[i] = d.s; sparks.alpha[i] = spOn * Math.pow(Math.sin(Math.PI * f), 4); });
  sparks.flush();
  document.querySelectorAll('.drops li').forEach((li) => li.classList.toggle('on', P[2] >= +li.dataset.at));
  document.querySelectorAll('.checks li').forEach((li) => li.classList.toggle('on', P[5] >= +li.dataset.at));
  // dust, everywhere, brightest in the light from the right
  dustD.forEach((d, i) => {
    const x = ((d.x + t * .004 * d.sp) % 1 - .5) * PW, y = ((d.y + Math.sin(t * .2 * d.sp + d.ph) * .02 + t * .003 * d.sp) % 1 - .5) * PH;
    dust.pos[i * 3] = x; dust.pos[i * 3 + 1] = y; dust.pos[i * 3 + 2] = d.z;
    dust.col[i * 3] = 1; dust.col[i * 3 + 1] = .86; dust.col[i * 3 + 2] = .62;
    dust.size[i] = d.s; dust.alpha[i] = (.25 + .75 * clamp01((x / PW + .5) * 1.3)) * (.35 + .4 * Math.sin(t * d.sp + d.ph)) * (1 - U.uNight.value * .8);
  });
  dust.flush();
  U.uWarm.value = P[5] >= 1 ? 1 : 0;
}

/* ── loop ─────────────────────────────────────────────────────────────── */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  for (const o of [dust, motes, wisps, sparks]) o.mat.uniforms.uScale.value = h * renderer.getPixelRatio() * .9;
}
addEventListener('resize', resize); resize();
let last = performance.now(), clock = 0, sm = FIXED ?? 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden) { last = now; return; }
  const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
  const target = FIXED !== null ? FIXED : readScroll();
  sm = FIXED !== null ? target : sm + (target - sm) * Math.min(1, dt * 4);
  const k = Math.floor(sm), f = sm - k;
  for (let i = 1; i <= 5; i++) P[i] = i < k ? 1 : i > k ? 0 : clamp01(f / .74);
  U.uTime.value = clock;
  frameCam(sm, clock, dt);
  phases(clock);
  panels.forEach((p, i) => p && p.classList.toggle('in', FIXED !== null ? Math.floor(sm) === i : Math.abs(sm - (i + .38)) < .5 || (i === 0 && sm < .5)));
  rail.forEach((a) => a.classList.toggle('on', k === +a.dataset.i));
  document.body.classList.toggle('inside', sm > .7 && sm < 5.9);
  renderer.render(scene, camera);
}
document.body.classList.add('ready');
requestAnimationFrame(loop);
