/* FEMINISTA — The Art of 180, a composition in five rooms.
   One sculpture of light, ~22,000 particles, becomes each stage of the perfume.
   Forms are sampled from the House's own imagery (ingredient cut-outs, the bottles),
   and between rooms every particle swirls through curl noise to its next place. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const qs = new URLSearchParams(location.search);
const FIXED = qs.has('s') ? +qs.get('s') : null;
const MOBILE = innerWidth < 760;
const N = MOBILE ? 18000 : 38000;

/* ── renderer ─────────────────────────────────────────────────────────── */
const canvas = document.getElementById('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { document.body.classList.add('no-gl'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x0a0706, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, .1, 100); camera.position.set(0, 0, 10);
const composer = new EffectComposer(renderer);
composer.renderTarget1.texture.format = THREE.RGBAFormat;
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .32, .35, .72);
composer.addPass(bloom); composer.addPass(new OutputPass());

/* ── helpers ──────────────────────────────────────────────────────────── */
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lin = (c) => Math.pow(c / 255, 2.2);
const R = Math.random;
const loadImg = (url) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });

// a form: n points with position, colour and a 'flow' flag (1 = rises as scent)
const form = (n) => ({ n, pos: new Float32Array(n * 3), col: new Float32Array(n * 3), flow: new Float32Array(n), k: 0 });
function put(f, x, y, z, r, g, b, fl = 0) { if (f.k >= f.n) return; const i = f.k++; f.pos[i * 3] = x; f.pos[i * 3 + 1] = y; f.pos[i * 3 + 2] = z; f.col[i * 3] = r; f.col[i * 3 + 1] = g; f.col[i * 3 + 2] = b; f.flow[i] = fl; }
function fill(f) { while (f.k < f.n) { const j = Math.floor(R() * Math.max(1, f.k)); put(f, f.pos[j * 3] + (R() - .5) * .02, f.pos[j * 3 + 1] + (R() - .5) * .02, f.pos[j * 3 + 2], f.col[j * 3], f.col[j * 3 + 1], f.col[j * 3 + 2], f.flow[j]); } return f; }

// sample an image's opaque pixels into points (with a little body, so it turns in 3D)
async function sampleImage(f, url, n, cx, cy, h, opts = {}) {
  const img = await loadImg(url);
  const S = 300, sc = S / Math.max(img.width, img.height), w = Math.round(img.width * sc), hh = Math.round(img.height * sc);
  const c = document.createElement('canvas'); c.width = w; c.height = hh; const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, hh); const d = g.getImageData(0, 0, w, hh).data;
  const idx = []; for (let i = 0; i < w * hh; i++) if (d[i * 4 + 3] > 150) idx.push(i);
  const unit = h / hh, W = w * unit, thick = opts.thick ?? .35, boost = opts.boost ?? 1.15;
  for (let k = 0; k < n && idx.length; k++) {
    const i = idx[Math.floor(R() * idx.length)], px = i % w + R() - .5, py = Math.floor(i / w) + R() - .5;
    const x = (px - w / 2) * unit, y = -(py - hh / 2) * unit, body = Math.sqrt(Math.max(0, 1 - Math.pow(2 * x / W, 2)));
    let r = lin(d[i * 4]) * boost, gg = lin(d[i * 4 + 1]) * boost, b = lin(d[i * 4 + 2]) * boost;
    const L = .2126 * r + .7152 * gg + .0722 * b, lift = opts.lift !== false && L < .12 ? (.12 + R() * .08) / Math.max(.01, L) : 1;
    put(f, cx + x, cy + y, (R() * 2 - 1) * body * thick, Math.min(1, r * lift), Math.min(1, gg * lift), Math.min(1, b * lift));
  }
}
function sampleText(f, text, n, h, col, font) {
  const c = document.createElement('canvas'); c.width = 900; c.height = 360; const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 450, 190);
  const d = g.getImageData(0, 0, 900, 360).data, idx = []; for (let i = 0; i < 900 * 360; i++) if (d[i * 4 + 3] > 128) idx.push(i);
  const unit = h / 260;
  for (let k = 0; k < n; k++) { const i = idx[Math.floor(R() * idx.length)], x = (i % 900 - 450 + R() - .5) * unit, y = -(Math.floor(i / 900) - 190 + R() - .5) * unit;
    const t = (y / h + .5); put(f, x, y, (R() - .5) * .35, col[0] * (.7 + .5 * t), col[1] * (.7 + .5 * t), col[2] * (.7 + .5 * t)); }
}
const GOLD = [1, .62, .22], ROSE = [.95, .32, .42], AMBER = [.62, .26, .07], CREAM = [.92, .84, .7];

/* ── the seven forms ──────────────────────────────────────────────────── */
await (document.fonts ? document.fonts.load('400 200px Marcellus') : Promise.resolve());
const F = [];
{ // 0 · "180", and a field of dust around it
  const f = form(N); sampleText(f, '180', Math.floor(N * .8), 3.1, GOLD, '400 300px Marcellus, Georgia, serif');
  while (f.k < f.n) { const a = R() * 6.28, r = 3 + R() * 4; put(f, Math.cos(a) * r, (R() - .5) * 6, Math.sin(a) * r - 2, .5, .32, .12); }
  F.push(f);
}
const ING = [['rose', 'Bulgarian rose', -2.15, .55], ['coffee', 'Coffee', -1.05, -.6], ['vanilla', 'Vanilla', 0, .6], ['almond', 'Almond', 1.05, -.6], ['bergamot', 'Bergamot', 2.15, .55]];
{ // 1 · the ingredients, from their photographs
  const f = form(N);
  for (const [key, , x, y] of ING) await sampleImage(f, `assets/ing/${key}.webp`, Math.floor(N / ING.length), x, y, 1.15, { thick: .12, boost: 1.35 });
  F.push(fill(f));
}
{ // 2 · the accord: one drop, three notes swirling in it
  const f = form(N), tiers = [GOLD, ROSE, AMBER];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996, rr = 1.35 * Math.cbrt(.25 + .75 * R());
    const ang = th % 6.2832, band = Math.floor((((y + 1) * .9 + ang / 6.2832 * .6) % 1) * 3), c = tiers[band];
    const taper = y > 0 ? 1 - Math.pow(y, 1.6) * .72 : 1, yy = y > 0 ? y * 1.55 : y;     // a drop: round below, drawn to a point above
    const k = .85 + R() * .3;
    put(f, Math.cos(th) * r * rr * taper, yy * rr - .35, Math.sin(th) * r * rr * taper, c[0] * k, c[1] * k, c[2] * k);
  }
  F.push(f);
}
{ // 3 · a dial of 180 days around the resting drop
  const f = form(N), ticks = 180, perTick = Math.floor(N * .55 / ticks);
  for (let t = 0; t < ticks; t++) { const a = Math.PI / 2 - (t / ticks) * Math.PI * 2, long = t % 30 === 0 ? 1.9 : t % 10 === 0 ? 1.4 : 1;
    for (let k = 0; k < perTick; k++) { const r = 2.15 + R() * .22 * long; put(f, Math.cos(a) * r + (R() - .5) * .01, Math.sin(a) * r, (R() - .5) * .05, CREAM[0], CREAM[1], CREAM[2]); } }
  while (f.k < N * .97) { const y = R() * 2 - 1, th = R() * 6.28, rr = .72 * Math.cbrt(R()), r = Math.sqrt(1 - y * y); put(f, Math.cos(th) * r * rr, y * rr * 1.1, Math.sin(th) * r * rr, .78, .34, .07); }
  while (f.k < N) { const a = R() * 6.28, r = 1.1 + R() * .5; put(f, Math.cos(a) * r, Math.sin(a) * r, (R() - .5) * .3, .9, .6, .3); }
  F.push(f);
}
{ // 4 · three smelling strips, scent rising from their tips
  const f = form(N), strips = Math.floor(N * .62);
  const PIV = [-2.1, -.9], ANG = [.42, .2, -.02];
  for (let k = 0; k < strips; k++) { const s = k % 3, ang = ANG[s], u = R(), v = R() - .5;
    const x0 = u * 4, y0 = v * .3, ca = Math.cos(ang), sa = Math.sin(ang);
    const ink = u > .74 && u < .93 && Math.abs(v) < .22 && R() < .55;
    const c = ink ? [.1, .07, .05] : CREAM; put(f, PIV[0] + x0 * ca - y0 * sa, PIV[1] + x0 * sa + y0 * ca, (R() - .5) * .04 + s * .06, c[0], c[1], c[2]); }
  while (f.k < N) { const s = Math.floor(R() * 3), ang = ANG[s]; put(f, PIV[0] + 4 * Math.cos(ang) + (R() - .5) * .25, PIV[1] + 4 * Math.sin(ang) + (R() - .5) * .2, (R() - .5) * .2, 1, .72, .38, 1); }
  F.push(f);
}
{ // 5 · the bottle: Locken, made of the perfume itself
  const f = form(N); await sampleImage(f, 'assets/locken-cut.webp', N, 0, -.1, 4.4, { thick: .16, boost: 1.5, lift: false }); F.push(fill(f));
}
{ // 6 · the collection
  const f = form(N);
  await sampleImage(f, 'assets/vers-cut.webp', Math.floor(N / 3), -2.2, .75, 2.3, { thick: .14, boost: 1.5, lift: false });
  await sampleImage(f, 'assets/locken-cut.webp', Math.floor(N / 3), 0, .9, 2.65, { thick: .14, boost: 1.5, lift: false });
  await sampleImage(f, 'assets/fresca-cut.webp', Math.floor(N / 3), 2.2, .75, 2.3, { thick: .14, boost: 1.5, lift: false });
  F.push(fill(f));
}

/* ── the rooms' photographs, rendered behind the sculpture ────────────── */
const BG = ['art-of-180-lab.webp', 'locken-ingredients.jpg', 'art-of-180-lab.webp', 'art-of-180-maturation.webp', 'art-of-180-evaluation.webp', 'art-of-180-locken-loom.webp', 'art-of-180-maturation.webp'].map((n) => `assets/lab/${n}`);
const bgTex = await Promise.all(BG.map((u) => new Promise((res) => new THREE.TextureLoader().load(u, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; res(t); }))));
const BU = { tA: { value: bgTex[0] }, tB: { value: bgTex[1] }, uM: { value: 0 }, uAspA: { value: 1 }, uAspB: { value: 1 }, uScreen: { value: 1.7 }, uZoom: { value: 0 } };
const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: BU, depthTest: false, depthWrite: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, .9999, 1.); }',
  fragmentShader: `uniform sampler2D tA, tB; uniform float uM, uAspA, uAspB, uScreen, uZoom; varying vec2 vUv;
    vec2 cover(vec2 uv, float ia){ vec2 c = uv - .5; if (uScreen > ia) c.y *= ia / uScreen; else c.x *= uScreen / ia; return c / (1.03 + uZoom * .03) + .5; }
    void main(){
      vec2 q = (vUv - vec2(uZoom, .5)) * vec2(uScreen, 1.);
      float g = exp(-dot(q, q) * 3.2);
      vec3 tint = mix(texture2D(tA, vec2(.5)).rgb, texture2D(tB, vec2(.5)).rgb, smoothstep(0., 1., uM));
      vec3 c = vec3(.0035, .0025, .002) + mix(vec3(.05, .028, .012), tint * .08, .5) * g * .6;
      c += (fract(sin(dot(vUv * 913., vec2(12.9898, 78.233))) * 43758.5453) - .5) * .01;
      gl_FragColor = vec4(c, 1.);
    }` }));
bgMesh.frustumCulled = false; bgMesh.renderOrder = -10; scene.add(bgMesh);

/* ── the sculpture ────────────────────────────────────────────────────── */
const geo = new THREE.BufferGeometry();
const aA = new THREE.BufferAttribute(new Float32Array(N * 3), 3), aB = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
const cA = new THREE.BufferAttribute(new Float32Array(N * 3), 3), cB = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
const fA = new THREE.BufferAttribute(new Float32Array(N), 1), fB = new THREE.BufferAttribute(new Float32Array(N), 1);
const rnd = new Float32Array(N * 4); for (let i = 0; i < N * 4; i++) rnd[i] = R();
geo.setAttribute('position', aA); geo.setAttribute('aB', aB); geo.setAttribute('cA', cA); geo.setAttribute('cB', cB);
geo.setAttribute('fA', fA); geo.setAttribute('fB', fB); geo.setAttribute('aR', new THREE.BufferAttribute(rnd, 4));
let curA = -1, curB = -1;
function setPair(a, b) {
  if (a === curA && b === curB) return; curA = a; curB = b;
  aA.array.set(F[a].pos); cA.array.set(F[a].col); fA.array.set(F[a].flow);
  aB.array.set(F[b].pos); cB.array.set(F[b].col); fB.array.set(F[b].flow);
  for (const t of [aA, aB, cA, cB, fA, fB]) t.needsUpdate = true;
}
const U = { uMix: { value: 0 }, uTime: { value: 0 }, uMouse: { value: new THREE.Vector3(99, 99, 0) }, uSize: { value: 12 }, uScale: { value: 1 },
  uDay: { value: 0 }, uDialA: { value: 0 }, uDialB: { value: 0 }, uBright: { value: 1 } };
const NOISE = `
  vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;} vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);} vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){ const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx); vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy); vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=m289(i);
    vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y); vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.)); vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3))); p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3))); }
  vec3 curl(vec3 p){ const float e=.1; vec3 dx=vec3(e,0.,0.), dy=vec3(0.,e,0.), dz=vec3(0.,0.,e);
    vec3 a=vec3(snoise(p), snoise(p+vec3(31.4,7.1,2.9)), snoise(p+vec3(9.2,53.7,17.3)));
    float x=(snoise(p+dy+vec3(9.2,53.7,17.3))-snoise(p-dy+vec3(9.2,53.7,17.3)))-(snoise(p+dz+vec3(31.4,7.1,2.9))-snoise(p-dz+vec3(31.4,7.1,2.9)));
    float y=(snoise(p+dz)-snoise(p-dz))-(snoise(p+dx+vec3(9.2,53.7,17.3))-snoise(p-dx+vec3(9.2,53.7,17.3)));
    float z=(snoise(p+dx+vec3(31.4,7.1,2.9))-snoise(p-dx+vec3(31.4,7.1,2.9)))-(snoise(p+dy)-snoise(p-dy));
    return vec3(x,y,z)/(2.*e); }`;
const mat = new THREE.ShaderMaterial({
  uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute vec3 aB, cA, cB; attribute float fA, fB; attribute vec4 aR;
    uniform float uMix, uTime, uSize, uScale, uDay, uDialA, uDialB, uBright; uniform vec3 uMouse;
    varying vec3 vC; varying float vA;
    ${NOISE}
    void main(){
      float t = clamp(uMix * 1.5 - aR.x * .5, 0., 1.); float e = t * t * (3. - 2. * t);
      vec3 p = mix(position, aB, e);
      float swirl = sin(3.14159 * t);
      p += curl(p * .35 + vec3(aR.y * 4., uTime * .08, aR.z * 4.)) * swirl * (.9 + aR.w * .9);
      p += vec3(sin(uTime * (.6 + aR.y) + aR.z * 6.28), cos(uTime * (.5 + aR.z) + aR.w * 6.28), sin(uTime * .4 + aR.x * 6.28)) * .012;
      // scent: some points rise and curl away
      float flow = mix(fA, fB, e);
      float fr = fract(uTime * (.09 + aR.y * .08) + aR.z);
      p += flow * vec3(sin(fr * 6. + aR.w * 6.28) * .35 * fr, fr * 2.4, cos(fr * 5. + aR.x * 6.28) * .2 * fr);
      // the cursor parts the light
      vec2 d = p.xy - uMouse.xy; float dl = length(d);
      p.xy += normalize(d + 1e-4) * .55 * exp(-dl * dl * 2.2);
      vec3 col = mix(cA, cB, e);
      // the dial lights up one day at a time
      float dial = mix(uDialA, uDialB, e);
      float rr = length(p.xy); float ang = fract(.25 - atan(p.y, p.x) / 6.28318);
      float ring = smoothstep(1.95, 2.1, rr) * (1. - smoothstep(2.6, 2.8, rr));
      float lit = step(ang, uDay);
      col = mix(col, col * mix(.05, 1.5, lit), ring * dial);
      vC = col * uBright;
      vA = (1. - flow * pow(fr, 2.)) * (.7 + .3 * aR.w);
      vec4 mv = modelViewMatrix * vec4(p, 1.);
      gl_PointSize = uSize * uScale * (.45 + aR.w * .8) / -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `varying vec3 vC; varying float vA;
    void main(){ float d = length(gl_PointCoord - .5); float a = 1. - smoothstep(.32, .5, d); if (a < .01) discard; gl_FragColor = vec4(vC * a * vA, 1.); }`,
});
const sculpt = new THREE.Points(geo, mat); sculpt.frustumCulled = false; scene.add(sculpt);
const DIAL = [0, 0, 0, 1, 0, 0, 0];

/* ── ingredient names ─────────────────────────────────────────────────── */
const labelsEl = document.getElementById('labels');
const labels = ING.map(([, name, x, y]) => { const el = document.createElement('span'); el.className = 'lbl'; el.textContent = name; labelsEl.appendChild(el); return { el, x, y: y - .78 }; });

/* ── scroll ───────────────────────────────────────────────────────────── */
const secs = [...document.querySelectorAll('[data-k]')], panels = secs.map((s) => s.querySelector('.panel'));
const rail = [...document.querySelectorAll('.rail a')], bgs = [...document.querySelectorAll('.bgs i')];
function readScroll() { const mid = scrollY + innerHeight * .5; let s = 0; secs.forEach((el, k) => { if (mid >= el.offsetTop) s = k + clamp01((mid - el.offsetTop) / el.offsetHeight); }); return s; }
if (FIXED !== null) document.body.classList.add('fixed');
const mouse = new THREE.Vector2(9, 9), mouseS = new THREE.Vector2(9, 9);
addEventListener('pointermove', (e) => { mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); document.body.classList.add('moved'); });
addEventListener('pointerleave', () => mouse.set(9, 9));

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h);
  BU.uScreen.value = w / h; camera.aspect = w / h; camera.position.z = w / h < 1 ? 15 : 10; camera.updateProjectionMatrix();
  U.uScale.value = h * renderer.getPixelRatio() / 900;
}
addEventListener('resize', resize); resize();

let last = performance.now(), clock = 0, sm = FIXED ?? 0;
const tmp = new THREE.Vector3();
function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden) { last = now; return; }
  const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
  const target = FIXED !== null ? FIXED : readScroll();
  sm = FIXED !== null ? target : sm + (target - sm) * Math.min(1, dt * 3.2);
  const k = Math.floor(sm), f = sm - k, P = clamp01(f / .62);
  // the form: hold, then morph to the next room in the last part of each section
  const c = Math.min(6, k + smooth(.62, 1, f)), a = Math.floor(c), b = Math.min(6, a + 1);
  setPair(a, b); U.uMix.value = c - a;
  U.uDialA.value = DIAL[a]; U.uDialB.value = DIAL[b];
  U.uDay.value = k === 3 ? smooth(.05, .95, P) : k > 3 ? 1 : 0;
  U.uTime.value = clock;
  // place the sculpture: right of the copy in the rooms, centred at the start and end
  const side = MOBILE ? 0 : 2.0, inRoom = (i) => (i >= 1 && i <= 5 ? 1 : 0);
  const ox = side * (inRoom(a) + (inRoom(b) - inRoom(a)) * (c - a));
  sculpt.position.x += (ox - sculpt.position.x) * Math.min(1, dt * 4);
  sculpt.position.y = MOBILE ? 1.3 * (inRoom(a) || inRoom(b) ? 1 : 0) : 0;
  mouseS.lerp(mouse, Math.min(1, dt * 5));
  sculpt.rotation.y = Math.sin(clock * .25) * .22 + (mouseS.x < 5 ? mouseS.x * .25 : 0);
  sculpt.rotation.x = Math.sin(clock * .19) * .06 + (mouseS.x < 5 ? -mouseS.y * .12 : 0);
  if (mouseS.x < 5) { tmp.set(mouseS.x, mouseS.y, .5).unproject(camera).sub(camera.position).normalize(); const d = -camera.position.z / tmp.z;
    U.uMouse.value.copy(camera.position).addScaledVector(tmp, d).sub(sculpt.position); } else U.uMouse.value.set(99, 99, 0);
  // the room's photograph behind
  BU.tA.value = bgTex[a]; BU.tB.value = bgTex[b]; BU.uM.value = c - a;
  const sx = new THREE.Vector3(sculpt.position.x, 0, 0).project(camera).x * .5 + .5; BU.uZoom.value = sx;
  BU.uAspA.value = bgTex[a].image.width / bgTex[a].image.height; BU.uAspB.value = bgTex[b].image.width / bgTex[b].image.height;
  // labels for the ingredients
  labels.forEach((l) => { const on = Math.abs(c - 1) < .12; l.el.classList.toggle('on', on); if (!on) return;
    tmp.set(l.x, l.y, 0).applyMatrix4(sculpt.matrixWorld).project(camera);
    l.el.style.transform = `translate(${((tmp.x * .5 + .5) * innerWidth).toFixed(1)}px, ${((-tmp.y * .5 + .5) * innerHeight).toFixed(1)}px) translate(-50%, 0)`; });
  // copy
  document.getElementById('day').textContent = String(Math.round(U.uDay.value * 180)).padStart(3, '0');
  const S4 = k === 4 ? P : k > 4 ? 1 : 0; document.getElementById('status').textContent = S4 > .8 ? 'Balanced. Ready.' : S4 > .4 ? 'Refining…' : 'Assessing the balance…';
  document.querySelectorAll('.tiers li').forEach((li) => li.classList.toggle('on', (k === 2 ? P : k > 2 ? 1 : 0) >= +li.dataset.at));
  document.querySelectorAll('.checks li').forEach((li) => li.classList.toggle('on', (k === 5 ? P : k > 5 ? 1 : 0) >= +li.dataset.at));
  panels.forEach((p, i) => p && p.classList.toggle('in', FIXED !== null ? k === i : Math.abs(sm - (i + .32)) < .42 || (i === 0 && sm < .45)));
  rail.forEach((r) => r.classList.toggle('on', k === +r.dataset.i));
  document.body.classList.toggle('inside', sm > .6 && sm < 5.9);
  bloom.strength = .32 + Math.sin(Math.PI * (c - a)) * .3;
  composer.render();
}
document.body.classList.add('ready');
requestAnimationFrame(loop);
