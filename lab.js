/* FEMINISTA — The Art of 180: a scroll-driven 3D laboratory.
   One long lab bench, five stations. Scrolling moves the camera from station to
   station and plays each phase: selection, composition, maturation, evaluation, bottling. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const qs = new URLSearchParams(location.search);
const PREVIEW = qs.has('preview');

/* ── the three compositions (ingredient photos live in assets/ing/<key>.webp) ── */
const PERFUMES = [
  { name: 'Locken', img: 'assets/locken-cut.webp', liquid: '#f2b23e', deep: '#b8701a', accent: '#e3b860', cap: .835, top: .62,
    tiers: [[['almond', 'Almond'], ['coffee', 'Coffee'], ['bergamot', 'Bergamot'], ['lemon', 'Lemon']],
      [['tuberose', 'Tuberose'], ['jasmine', 'Jasmine sambac'], ['orangeblossom', 'Orange blossom'], ['rose', 'Bulgarian rose'], ['iris', 'Orris']],
      [['tonka', 'Tonka bean'], ['cacao', 'Cacao'], ['vanilla', 'Vanilla'], ['sandalwood', 'Sandalwood'], ['amber', 'Amber'], ['woodchips', 'Cashmere wood'], ['patchouli', 'Patchouli'], ['cinnamon', 'Cinnamon'], ['cedar', 'Cedar']]],
    extra: [['Praline', 2], ['Musk', 2]], tint: ['#e0b43a', '#d87a8e', '#7a3f1c'] },
  { name: 'Vers', img: 'assets/vers-cut.webp', liquid: '#ff7a3a', deep: '#c2401c', accent: '#f0915a', cap: .765, top: .6,
    tiers: [[['cinnamon', 'Cinnamon'], ['cardamom', 'Cardamom'], ['ginger', 'Ginger']],
      [['candied', 'Candied fruits'], ['jasmine', 'White flowers']],
      [['vanilla', 'Vanilla'], ['coffee', 'Coffee'], ['tonka', 'Tonka bean'], ['benzoin', 'Benzoin']]],
    extra: [['Praline', 1], ['Musk', 2]], tint: ['#c8742a', '#ff8a5a', '#6a2e14'] },
  { name: 'Fresca', img: 'assets/fresca-cut.webp', liquid: '#ff3a64', deep: '#b0123a', accent: '#df6b74', cap: .815, top: .58,
    tiers: [[['raspberry', 'Raspberry'], ['cherry', 'Cherry'], ['strawberry', 'Strawberry'], ['blackberry', 'Blackberry']],
      [['apple', 'Apple']],
      [['cream', 'Whipped cream'], ['vanilla', 'Vanilla']]],
    extra: [], tint: ['#e0183e', '#ff4a3a', '#f0c8b8'] },
];
const TIER = ['Top', 'Heart', 'Base'];
const ST = [0, 0, 6, 12, 18, 24]; // station x positions (index 1..5)

/* ── renderer ─────────────────────────────────────────────────────────── */
const canvas = document.getElementById('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { document.body.classList.add('no-gl'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, PREVIEW ? 1 : 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .98;
renderer.localClippingEnabled = true;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0c0d');
scene.fog = new THREE.Fog('#0b0c0d', 14, 34);
const pmrem = new THREE.PMREMGenerator(renderer);
{
  const env = new THREE.Scene();
  const sg = new THREE.SphereGeometry(20, 32, 16), cols = [], top = new THREE.Color('#8b9097'), bot = new THREE.Color('#0c0d0f'), cc = new THREE.Color();
  for (let i = 0; i < sg.attributes.position.count; i++) { const y = sg.attributes.position.getY(i) / 20; cc.copy(bot).lerp(top, Math.pow((y + 1) / 2, 1.6)); cols.push(cc.r, cc.g, cc.b); }
  sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const shell = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })); env.add(shell);
  const stripM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff6ea').multiplyScalar(9) });
  for (let i = -2; i <= 2; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(14, .18, .18), stripM); st.position.set(0, 7, i * 2.6); env.add(st); }
  const side = new THREE.Mesh(new THREE.BoxGeometry(.2, 3, 9), new THREE.MeshBasicMaterial({ color: new THREE.Color('#dfe8ff').multiplyScalar(1.6) })); side.position.set(-9, 2, 0); env.add(side);
  const floorE = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: '#0c0c0d' })); floorE.rotation.x = -Math.PI / 2; floorE.position.y = -2; env.add(floorE);
  scene.environment = pmrem.fromScene(env, .02).texture;
}
void RoomEnvironment;
const camera = new THREE.PerspectiveCamera(34, 1, .1, 120);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .35, .5, .92);
composer.addPass(bloom); composer.addPass(new OutputPass());

/* ── helpers ──────────────────────────────────────────────────────────── */
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const lathe = (pts, seg = 56) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const glowTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
glowTex.colorSpace = THREE.NoColorSpace;

/* ── materials ────────────────────────────────────────────────────────── */
const glass = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: .02, transmission: 1, thickness: .05, ior: 1.47,
  attenuationColor: new THREE.Color('#e9f3f1'), attenuationDistance: 2.5, envMapIntensity: 1.25, clearcoat: 1, clearcoatRoughness: .03,
  specularIntensity: 1, side: THREE.DoubleSide, depthWrite: false });
const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', metalness: 1, roughness: .28 });
const steel = new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 1, roughness: .22 });
const darkWood = new THREE.MeshStandardMaterial({ color: '#2a1d16', roughness: .55 });
const paper = new THREE.MeshStandardMaterial({ color: '#b9b2a6', roughness: 1, side: THREE.DoubleSide });
function liquidMat(color) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .1, roughness: .35, metalness: 0, envMapIntensity: .25, transparent: true, opacity: .95, side: THREE.FrontSide, depthWrite: false });
  m.clippingPlanes = [new THREE.Plane(V(0, -1, 0), -99)];
  return m;
}
// fill a liquid to a world height
const setLevel = (mat, y) => { mat.clippingPlanes[0].constant = y; };

/* ── the room ─────────────────────────────────────────────────────────── */
const room = new THREE.Group(); scene.add(room);
{
  // epoxy-black bench with a brass edge
  const bench = new THREE.Mesh(new THREE.BoxGeometry(36, .12, 3.6), new THREE.MeshStandardMaterial({ color: '#141516', roughness: .3, metalness: .2 }));
  bench.position.set(12, -.06, -.2); bench.receiveShadow = true; room.add(bench);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(36, .02, .02), brass); edge.position.set(12, -.005, 1.6); room.add(edge);
  const front = new THREE.Mesh(new THREE.BoxGeometry(36, 1.4, .1), new THREE.MeshStandardMaterial({ color: '#0f1011', roughness: .6 }));
  front.position.set(12, -.82, 1.55); room.add(front);
  // tiled back wall
  const tiles = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#1b1d1f'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 4;
    for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .025})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(18, 3);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(44, 8), new THREE.MeshStandardMaterial({ map: tiles, roughness: .45, metalness: .1 }));
  wall.position.set(12, 2.4, -2.1); room.add(wall);
  // shelves of reference bottles along the wall
  const shelfMat = new THREE.MeshStandardMaterial({ color: '#2b2e31', roughness: .4, metalness: .6 });
  const amberGlass = new THREE.MeshPhysicalMaterial({ color: '#5a2c08', roughness: .12, transparent: true, opacity: .8, envMapIntensity: .7, clearcoat: 1 });
  const clearGlass = new THREE.MeshPhysicalMaterial({ color: '#9fb2b8', roughness: .08, transparent: true, opacity: .35, envMapIntensity: .6, clearcoat: 1 });
  const bottleGeo = lathe([[0, 0], [.09, 0], [.1, .02], [.1, .22], [.05, .27], [.035, .3], [.035, .34], [0, .34]], 20);
  for (const y of [1.55, 2.45]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(36, .04, .34), shelfMat); shelf.position.set(12, y, -1.9); room.add(shelf);
    for (let x = -5; x < 30; x += rand(.28, .5)) {
      const b = new THREE.Mesh(bottleGeo, Math.random() < .55 ? amberGlass : clearGlass);
      const s = rand(.8, 1.5); b.scale.set(s, s * rand(.9, 1.4), s); b.position.set(x, y + .02, -1.9 + rand(-.06, .06)); room.add(b);
    }
  }
  // overhead light tubes
  const tubeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4e6').multiplyScalar(1.6) });
  for (let x = -2; x <= 26; x += 6) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 3.4, 10), tubeMat); t.rotation.z = Math.PI / 2; t.position.set(x, 4.2, -.3); room.add(t);
  }
  // floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: '#0d0e0f', roughness: .5, metalness: .2 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.6; floor.receiveShadow = true; room.add(floor);
}
scene.add(new THREE.HemisphereLight('#c9d2dc', '#0b0a0a', .3));
const keyL = new THREE.DirectionalLight('#fff1e0', .7); keyL.position.set(4, 8, 6); scene.add(keyL);
// a warm spot above every station
for (let i = 1; i <= 5; i++) {
  const sp = new THREE.SpotLight('#ffe7c8', 26, 12, .5, .75, 1.6); sp.position.set(ST[i], 4, 1.2); sp.target.position.set(ST[i], 0, -.2);
  if (i === 1 || i === 2 || i === 5) { sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.shadow.bias = -.0004; sp.shadow.normalBias = .02; sp.shadow.radius = 5; }
  scene.add(sp, sp.target);
}

/* ── labels that follow 3D points ─────────────────────────────────────── */
const labelsEl = document.getElementById('labels');
const labels = [];
function addLabel(text, obj, offset) { const el = document.createElement('div'); el.className = 'lbl'; el.textContent = text; labelsEl.appendChild(el); const l = { el, obj, offset, on: 0 }; labels.push(l); return l; }

/* ── particles (glowing droplets, streams, motes) ─────────────────────── */
class Particles {
  constructor(n) {
    this.n = n; this.p = new Array(n).fill(null); this.k = 0;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.size = new Float32Array(n); this.alpha = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1)); g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({ uniforms: { uScale: { value: 400 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: `attribute float aSize, aAlpha; varying float vA; varying vec3 vC; uniform float uScale;
        void main(){ vA = aAlpha; vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); float a = pow(smoothstep(.5, 0., d), 1.6) * vA; if (a < .003) discard; gl_FragColor = vec4(vC * (1. + 1.2 * a), a); }` });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; scene.add(this.points);
  }
  emit(o) { o.age = -(o.delay || 0); this.p[this.k] = o; this.k = (this.k + 1) % this.n; }
  clear() { this.p.fill(null); }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      const p = this.p[i];
      if (!p) { this.alpha[i] = 0; continue; }
      p.age += dt; if (p.age < 0) { this.alpha[i] = 0; continue; }
      const u = p.age / p.life; if (u >= 1) { this.p[i] = null; this.alpha[i] = 0; continue; }
      const e = p.lin ? u : 1 - (1 - u) * (1 - u), k = 1 - e;
      for (let j = 0; j < 3; j++) { const a = p.a.getComponent(j), b = p.b.getComponent(j), c = p.c.getComponent(j); this.pos[i * 3 + j] = k * k * a + 2 * k * e * b + e * e * c; }
      this.col[i * 3] = p.color.r; this.col[i * 3 + 1] = p.color.g; this.col[i * 3 + 2] = p.color.b;
      this.size[i] = p.size * (1 - u * .5);
      this.alpha[i] = p.alpha * Math.min(1, u * 8) * (1 - u * u);
    }
    for (const k of ['position', 'color', 'aSize', 'aAlpha']) this.geo.attributes[k].needsUpdate = true;
  }
}
const fx = new Particles(PREVIEW ? 1500 : 3000);

const dishMat = new THREE.MeshPhysicalMaterial({ color: '#d8e6ea', roughness: .35, transmission: 0, transparent: true, opacity: .35, clearcoat: 1, envMapIntensity: .8 });
/* ── station 1 · Selection: specimen dishes ───────────────────────────── */
const loader = new THREE.TextureLoader();
const texCache = {};
const tex = (url) => { if (!texCache[url]) { texCache[url] = loader.load(url); texCache[url].colorSpace = THREE.SRGBColorSpace; texCache[url].anisotropy = 8; } return texCache[url]; };
const dishGeo = lathe([[0, 0], [.4, 0], [.42, .01], [.42, .07], [.44, .075], [.41, .075], [.4, .015], [0, .015]], 48);
const st1 = new THREE.Group(); st1.position.x = ST[1]; scene.add(st1);
let specimens = []; // { sprite, dish, tier, home, label }

/* ── station 2 · Composition: three beakers and a flask ───────────────── */
const beakerGeo = lathe([[0, 0], [.34, 0], [.36, .02], [.36, 1.05], [.39, 1.1]], 48);
const beakerBase = new THREE.CircleGeometry(.34, 48); beakerBase.rotateX(-Math.PI / 2); beakerBase.translate(0, .006, 0);
const beakerLiqGeo = lathe([[0, .012], [.33, .012], [.345, .03], [.345, 1.04], [0, 1.04]], 40);
const ticks = canvasTex(256, 512, (g, w, h) => { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; for (let i = 1; i < 10; i++) { const y = h - i * h / 10; g.beginPath(); g.moveTo(10, y); g.lineTo(i % 5 ? 46 : 80, y); g.stroke(); } });
const flaskPts = []; for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * .86; flaskPts.push([Math.sin(a) * .56, .56 - Math.cos(a) * .56]); }
flaskPts.push([.13, 1.3], [.13, 1.62], [.16, 1.66]); flaskPts.unshift([0, 0]);
const flaskGeo = lathe(flaskPts, 56);
const flaskLiqGeo = (() => { const p = []; for (let i = 0; i <= 18; i++) { const a = (i / 18) * Math.PI * .86; p.push([Math.sin(a) * .54, .56 - Math.cos(a) * .54]); } p.push([.115, 1.3], [.115, 1.6]); p.unshift([0, .02]); return lathe(p, 48); })();

function makeFlask(color) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(flaskGeo, glass);
  const lm = liquidMat(color); const liq = new THREE.Mesh(flaskLiqGeo, lm);
  liq.renderOrder = 1; shell.renderOrder = 2;
  g.add(liq, shell); g.userData = { lm };
  return g;
}
const st2 = new THREE.Group(); st2.position.x = ST[2]; scene.add(st2);
const beakers = [-1.15, 0, 1.15].map((x, t) => {
  const g = new THREE.Group(); g.position.set(x, 0, .45);
  const shell = new THREE.Mesh(beakerGeo, glass); shell.renderOrder = 2;
  g.add(new THREE.Mesh(beakerBase, dishMat));
  const lm = liquidMat('#ffffff'); const liq = new THREE.Mesh(beakerLiqGeo, lm); liq.renderOrder = 1;
  const scale = new THREE.Mesh(new THREE.CylinderGeometry(.362, .362, 1, 40, 1, true, -.6, 1.2), new THREE.MeshBasicMaterial({ map: ticks, transparent: true, opacity: .5, depthWrite: false }));
  scale.position.y = .55;
  g.add(liq, shell, scale); st2.add(g);
  return { g, lm, tier: t, level: 0, label: addLabel(TIER[t], g, V(0, 1.32, 0)) };
});
const stand = new THREE.Group();
{ const base = new THREE.Mesh(new THREE.CylinderGeometry(.5, .55, .06, 40), steel); base.position.y = .03;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.1, 12), steel); rod.position.set(.62, .55, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.42, .02, 10, 40), steel); ring.rotation.x = Math.PI / 2; ring.position.y = .62;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .22, 8), steel); arm.rotation.z = Math.PI / 2; arm.position.set(.51, .62, 0);
  stand.add(base, rod, ring, arm); }
stand.position.set(0, 0, -.85); st2.add(stand);
const flask2 = makeFlask('#ffffff'); flask2.position.set(0, .44, -.85); st2.add(flask2);
const accordLabel = addLabel('The accord', flask2, V(0, 1.9, 0));
let relabel = true;

/* ── station 2 · The fusion vessel: a round flask on a magnetic stirrer ── */
beakers.forEach((b) => { b.g.visible = false; }); stand.visible = false; flask2.visible = false;
const VZ = -.2, FR = .8, FCY = .22 + FR * .97, NECK = .2, NECK_TOP = FCY + Math.sqrt(FR * FR - NECK * NECK) + .62;
const LR = FR - .03, LEVEL_L = FCY + .22, SURF_R = Math.sqrt(LR * LR - (LEVEL_L - FCY) ** 2);
const vessel = new THREE.Group(); vessel.position.set(0, 0, VZ); st2.add(vessel);
const ledMat = new THREE.MeshBasicMaterial({ color: '#3a1010' });
{
  const enamel = new THREE.MeshStandardMaterial({ color: '#a9acae', roughness: .5, metalness: .05 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.8, .22, 1.55, 4, .05), enamel); body.position.y = .11; body.castShadow = body.receiveShadow = true;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.66, .66, .014, 64), steel); plate.position.y = .227; plate.receiveShadow = true;
  const knobM = new THREE.MeshStandardMaterial({ color: '#1d1f21', roughness: .45 });
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .07, 32), knobM); knob.rotation.x = Math.PI / 2; knob.position.set(-.45, .11, .79);
  const knob2 = knob.clone(); knob2.position.x = .05;
  const led = new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 8), ledMat); led.position.set(.55, .12, .776);
  vessel.add(body, plate, knob, knob2, led);
}
const flaskPts2 = [[0, FCY - FR + .002]];
for (let i = 0; i <= 44; i++) { const a = .03 + (i / 44) * (Math.PI - Math.asin(NECK / FR) - .03); flaskPts2.push([Math.sin(a) * FR, FCY - Math.cos(a) * FR]); }
flaskPts2.push([NECK, NECK_TOP], [NECK + .035, NECK_TOP + .03], [NECK + .035, NECK_TOP + .055]);
const vesselGlass = new THREE.Mesh(lathe(flaskPts2, 80), glass); vesselGlass.renderOrder = 2; vessel.add(vesselGlass);
const liqPts = [[0, FCY - LR + .004]]; for (let i = 1; i <= 34; i++) { const a = (i / 34) * Math.PI * .8; liqPts.push([Math.sin(a) * LR, FCY - Math.cos(a) * LR]); }
const vLiqMat = new THREE.MeshPhysicalMaterial({ color: '#dfe9ea', transparent: true, opacity: .06, roughness: .06, envMapIntensity: .6, depthWrite: false, side: THREE.DoubleSide, emissive: '#000000' });
vLiqMat.clippingPlanes = [new THREE.Plane(V(0, -1, 0), LEVEL_L)];
const vLiq = new THREE.Mesh(lathe(liqPts, 72), vLiqMat); vLiq.renderOrder = 3; vessel.add(vLiq);
const surfGeo = new THREE.RingGeometry(.001, SURF_R, 72, 16); surfGeo.rotateX(-Math.PI / 2);
const surfMat = new THREE.MeshPhysicalMaterial({ color: '#e8f0f0', transparent: true, opacity: .4, roughness: .03, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.7, depthWrite: false, side: THREE.DoubleSide });
const surf = new THREE.Mesh(surfGeo, surfMat); surf.position.y = LEVEL_L; surf.renderOrder = 4; vessel.add(surf);
const stirG = new THREE.Group(); stirG.position.y = FCY - FR + .055; vessel.add(stirG);
{ const bar = new THREE.Mesh(new THREE.CapsuleGeometry(.032, .24, 6, 14), new THREE.MeshStandardMaterial({ color: '#f3f2ee', roughness: .28 })); bar.rotation.z = Math.PI / 2; stirG.add(bar); }
const caustic = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.3), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
caustic.rotation.x = -Math.PI / 2; caustic.position.set(.75, .006, .95); vessel.add(caustic);
const vesselLight = new THREE.PointLight('#ffffff', 0, 3.2, 2); vesselLight.position.set(0, FCY, .2); vessel.add(vesselLight);

// ink (soft, normally blended puffs) and bubbles: both computed from the scroll position, so they scrub
const puffTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  for (let i = 0; i < 22; i++) { const x = 64 + rand(-26, 26), y = 64 + rand(-26, 26), r = rand(16, 40); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  g.globalCompositeOperation = 'destination-in'; const m = g.createRadialGradient(64, 64, 8, 64, 64, 62); m.addColorStop(0, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); return t; })();
const inkMat = new THREE.ShaderMaterial({ uniforms: { map: { value: puffTex }, uScale: { value: 400 } }, transparent: true, depthWrite: false, vertexColors: true,
  vertexShader: `attribute float aSize, aAlpha; varying float vA, vR; varying vec3 vC; uniform float uScale;
    void main(){ vA = aAlpha; vC = color; vR = fract(sin(dot(position.xz, vec2(12.9, 78.2))) * 437.5) * 6.28;
      vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform sampler2D map; varying float vA, vR; varying vec3 vC;
    void main(){ vec2 c = gl_PointCoord - .5; float s = sin(vR), k = cos(vR); c = mat2(k, -s, s, k) * c;
      float a = texture2D(map, c + .5).a * vA; if (a < .003) discard; gl_FragColor = vec4(vC, a); }` });
function makePoints(n, mat, order) {
  const g = new THREE.BufferGeometry(), o = { n, pos: new Float32Array(n * 3), col: new Float32Array(n * 3), size: new Float32Array(n), alpha: new Float32Array(n) };
  g.setAttribute('position', new THREE.BufferAttribute(o.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(o.col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(o.size, 1)); g.setAttribute('aAlpha', new THREE.BufferAttribute(o.alpha, 1));
  o.points = new THREE.Points(g, mat); o.points.frustumCulled = false; o.points.renderOrder = order; scene.add(o.points);
  o.flush = () => { for (const k of ['position', 'color', 'aSize', 'aAlpha']) g.attributes[k].needsUpdate = true; };
  return o;
}
const INK_K = PREVIEW ? 22 : 34;
const ink = makePoints(12 * INK_K, inkMat, 5);
const bub = makePoints(110, fx.mat, 6);
const bubD = Array.from({ length: 110 }, () => ({ a: rand(0, TAU), r: Math.sqrt(Math.random()) * .5, ph: Math.random(), sp: rand(.18, .45), z: rand(.012, .03), k: Math.random() }));

/* ── ingredients with real depth: each photo becomes a relief that catches light and casts a shadow ── */
const reliefCache = {};
function reliefFor(key, texture) {
  if (reliefCache[key]) return reliefCache[key];
  const img = texture.image; if (!img || !img.width) return null;
  const N = 72, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.drawImage(img, 0, 0, N, N); const d = g.getImageData(0, 0, N, N).data;
  let h = new Float32Array(N * N); let r = 0, gg = 0, b = 0, w = 0;
  for (let i = 0; i < N * N; i++) { const a = d[i * 4 + 3] / 255; h[i] = a; if (a > .5) { r += d[i * 4]; gg += d[i * 4 + 1]; b += d[i * 4 + 2]; w++; } }
  for (let pass = 0; pass < 4; pass++) { const o = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let sum = 0, cnt = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < N && yy < N) { sum += h[yy * N + xx]; cnt++; } } o[y * N + x] = sum / cnt; }
    h = o; }
  const geo = new THREE.PlaneGeometry(1, 1, N - 1, N - 1), pa = geo.attributes.position;
  for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sqrt(h[i]) * .13 - .05);
  geo.computeVertexNormals();
  const col = new THREE.Color(); col.setRGB(r / w / 255 || .8, gg / w / 255 || .8, b / w / 255 || .8, THREE.SRGBColorSpace);
  const hsl = {}; col.getHSL(hsl); col.setHSL(hsl.h, Math.min(1, hsl.s * 1.35), Math.min(.62, Math.max(.28, hsl.l)));
  return (reliefCache[key] = { geo, col, aspect: img.width / img.height });
}
const flatGeo = new THREE.PlaneGeometry(1, 1);

/* ── station 3 · Maturation: the flask rests under a bell jar ─────────── */
const st3 = new THREE.Group(); st3.position.x = ST[3]; scene.add(st3);
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.9, .95, .14, 56), darkWood); plinth.position.y = .07; st3.add(plinth);
const flask3 = makeFlask('#ffffff'); flask3.position.y = .14; st3.add(flask3);
const jarPts = [[.86, 0], [.86, 1.7]]; for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; jarPts.push([Math.cos(a) * .86, 1.7 + Math.sin(a) * .55]); }
const jar = new THREE.Group();
{ const shell = new THREE.Mesh(lathe(jarPts, 64), glass); shell.renderOrder = 3;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 14), glass); knob.position.y = 2.3;
  jar.add(shell, knob); }
jar.position.y = .14; st3.add(jar);
const orbitLamp = new THREE.PointLight('#ffd29a', 0, 5, 1.6); st3.add(orbitLamp);
const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffd29a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); lampGlow.scale.setScalar(.5); st3.add(lampGlow);
addLabel('Day 0 → 180', jar, V(0, 2.6, 0));

/* ── station 4 · Evaluation: blotters dipped and read ─────────────────── */
const st4 = new THREE.Group(); st4.position.x = ST[4]; scene.add(st4);
const flask4 = makeFlask('#ffffff'); st4.add(flask4);
const rack = new THREE.Group(); st4.add(rack);
{ const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, .04, .04), brass); bar.position.y = 2.55; rack.add(bar);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 2.55, 10), brass); post.position.set(-.7, 1.275, 0); rack.add(post);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(.16, .18, .04, 24), brass); foot.position.set(-.7, .02, 0); rack.add(foot); }
const blotters = [-.06, .06, 0].map((x, i) => {
  const g = new THREE.Group(); g.position.set(x, 2.5, i === 2 ? .05 : -.02);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(.07, .95), paper); strip.position.y = -.475;
  const stain = new THREE.Mesh(new THREE.PlaneGeometry(.072, .3), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  stain.position.set(0, -.8, .001);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(.09, .05, .03), steel);
  g.add(strip, stain, clip); g.rotation.z = (i - 1) * .08; rack.add(g);
  return { g, stain };
});
rack.position.set(0, 0, 0);
const tubes = new THREE.Group(); st4.add(tubes);
{ const tubeGeo = lathe([[0, 0], [.05, .005], [.065, .04], [.065, .78], [.075, .8]], 24);
  const holder = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .22), darkWood); holder.position.y = .42; tubes.add(holder);
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(tubeGeo, glass); t.position.set(-.3 + i * .3, .02, 0); t.renderOrder = 2; tubes.add(t);
    const lm = liquidMat('#fff'); const l = new THREE.Mesh(new THREE.CylinderGeometry(.058, .058, .8, 16), lm); l.position.set(-.3 + i * .3, .42, 0); tubes.add(l);
    t.userData.lm = lm; t.userData.i = i;
  } }
tubes.position.set(1.15, 0, .2);
addLabel('Blotters', rack, V(.15, 2.75, 0));

/* ── station 5 · Bottling ─────────────────────────────────────────────── */
const st5 = new THREE.Group(); st5.position.x = ST[5]; scene.add(st5);
const stand5 = stand.clone(); stand5.visible = true; stand5.position.set(-.95, 0, -.2); stand5.scale.setScalar(1.7); st5.add(stand5);
const flask5 = makeFlask('#ffffff'); flask5.position.set(-.95, .5, -.2); st5.add(flask5);
const funnel = new THREE.Mesh(lathe([[.025, 0], [.025, .25], [.22, .5], [.24, .52]], 32), glass); funnel.renderOrder = 2; st5.add(funnel);
const bottleMat = () => new THREE.ShaderMaterial({
  transparent: true, side: THREE.DoubleSide,
  uniforms: { map: { value: null }, uFill: { value: 0 }, uTop: { value: .6 }, uColor: { value: new THREE.Color() }, uRange: { value: new THREE.Vector2(0, 1) }, uTime: { value: 0 } },
  vertexShader: 'uniform vec2 uRange; varying vec2 vUv; void main(){ vUv = vec2(uv.x, mix(uRange.x, uRange.y, uv.y)); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform sampler2D map; uniform float uFill, uTop, uTime; uniform vec3 uColor; varying vec2 vUv;
    void main(){ vec4 t = texture2D(map, vUv); if (t.a < .02) discard; vec3 c = t.rgb;
      float body = smoothstep(.55, .95, t.a) * (1. - smoothstep(uTop - .05, uTop + .01, vUv.y));
      float L = mix(.03, uTop, uFill), below = 1. - smoothstep(L - .006, L + .006, vUv.y);
      float w = sin(vUv.x * 30. + uTime * 1.5 + sin(vUv.y * 20. - uTime * 2.) * 1.5) * .5 + .5;
      c += uColor * body * below * (.06 + .22 * w);
      c += uColor * exp(-pow((vUv.y - L) / .012, 2.)) * body * step(.003, uFill) * (1. - step(.995, uFill)) * 1.4;
      gl_FragColor = vec4(c, t.a); }`,
});
const bottleBody = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bottleMat());
const bottleCap = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bottleMat());
st5.add(bottleBody, bottleCap);
const BH = 1.75;
let bottle = { aspect: .45, w: .8, capBase: 0, neckY: 0 };
function layoutBottle(p) {
  const w = BH * bottle.aspect, c = p.cap;
  bottle.w = w;
  bottleBody.scale.set(w, BH * c, 1); bottleBody.position.set(.95, BH * c / 2, .1);
  bottle.capBase = BH * c + BH * (1 - c) / 2;
  bottleCap.scale.set(w, BH * (1 - c), 1); bottleCap.position.set(.95, bottle.capBase, .102);
  bottle.neckY = BH * c;
  bottleBody.material.uniforms.uRange.value.set(0, c); bottleCap.material.uniforms.uRange.value.set(c, 1);
  funnel.position.set(.95, bottle.neckY + .02, .1);
}
addLabel('Finished by hand', bottleBody, V(0, 1.35, 0));

/* ── load a composition into the lab ──────────────────────────────────── */
let cur = PERFUMES[0], tierCols = [];
function build(i) {
  cur = PERFUMES[i];
  document.documentElement.style.setProperty('--accent', cur.accent);
  document.querySelectorAll('.pills [data-p]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.p === i)));
  // specimens: up to 3 per tier, in rows by tier
  for (const s of specimens) { st1.remove(s.dish); scene.remove(s.mesh); s.label.el.remove(); labels.splice(labels.indexOf(s.label), 1); }
  specimens = [];
  tierCols = cur.tint.map((c) => new THREE.Color(c));
  prevP2 = 0;
  cur.tiers.forEach((notes, t) => {
    const pick = notes.slice(0, 3), n = pick.length;
    pick.forEach(([key, name], j) => {
      const x = (j - (n - 1) / 2) * 1.05, z = .7 - t * .85;
      const dish = new THREE.Mesh(dishGeo, dishMat); dish.position.set(x, 0, z); dish.renderOrder = 2; st1.add(dish);
      const map = tex(`assets/ing/${key}.webp`);
      const mat = new THREE.MeshStandardMaterial({ map, alphaTest: .45, transparent: true, roughness: .55, metalness: 0, envMapIntensity: .55, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(flatGeo, mat); mesh.castShadow = true;
      mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: .45 });
      scene.add(mesh);
      const home = V(ST[1] + x, .4, z);
      mesh.position.copy(home);
      const label = addLabel(name, mesh, V(0, -.42, 0));
      const inkD = Array.from({ length: INK_K }, () => ({ r: Math.random(), dir: V(rand(-1, 1), rand(-.35, .7), rand(-1, 1)).normalize(), s: rand(0, 6), z: rand(.42, .85) }));
      specimens.push({ mesh, mat, key, dish, tier: t, home, label, j, idx: specimens.length, ready: false, aspect: 1, col: tierCols[t].clone(),
        jx: rand(-1, 1), jy: rand(-1, 1), jz: rand(-1, 1), inkD });
    });
  });
  // read-outs
  const all = cur.tiers.flat();
  document.getElementById('ro-specimens').innerHTML = cur.tiers.map((notes, t) => notes.map(([, n]) => `<li data-t="${t}"><i>${TIER[t][0]}</i>${n}</li>`).join('')).join('')
    + cur.extra.map(([n, t]) => `<li data-t="${t}"><i>${TIER[t][0]}</i>${n}</li>`).join('');
  document.getElementById('ro-accord').innerHTML = cur.tiers.map((notes, t) => `<div><dt>${TIER[t]}</dt><dd>${notes.map((x) => x[1]).concat(cur.extra.filter((e) => e[1] === t).map((e) => e[0])).join(' · ')}</dd></div>`).join('');
  void all;
  // colours
  beakers.forEach((b) => { b.lm.color.copy(tierCols[b.tier]); b.lm.emissive.copy(tierCols[b.tier]); });
  // bottle
  const t = tex(cur.img);
  for (const m of [bottleBody.material, bottleCap.material]) { m.uniforms.map.value = t; m.uniforms.uColor.value.set(cur.liquid); m.uniforms.uTop.value = cur.top; }
  const apply = () => { if (t.image) { bottle.aspect = t.image.width / t.image.height; layoutBottle(cur); } };
  if (t.image) apply(); else { const iv = setInterval(() => { if (t.image) { clearInterval(iv); apply(); } }, 60); }
  layoutBottle(cur);
  fx.clear();
}
document.querySelectorAll('.pills [data-p]').forEach((b) => b.addEventListener('click', () => build(+b.dataset.p)));

/* ── scroll → story position ──────────────────────────────────────────── */
const secs = [...document.querySelectorAll('[data-k]')];
const panels = secs.map((s) => s.querySelector('.panel'));
const railLinks = [...document.querySelectorAll('.rail a')];
const rail = document.querySelector('.rail');
let story = 0; // section index + local progress
function readScroll() {
  const mid = scrollY + innerHeight * .5;
  let s = 0;
  secs.forEach((el, k) => { const top = el.offsetTop, h = el.offsetHeight; if (mid >= top) s = k + clamp01((mid - top) / h); });
  return s;
}

/* ── camera path ──────────────────────────────────────────────────────── */
function key(k) {
  const mobile = innerWidth < 760;
  if (k <= 0) return { p: V(12, 5.2, 15.5), t: V(12, .6, -.5) };
  if (k >= 6) return { p: V(12, 6.5, 17), t: V(12, .2, -1) };
  const x = ST[k], side = mobile ? 0 : (k % 2 ? -1.15 : 1.15); // panel left → subject right
  const lift = [0, 0, .78, .35, .45, .3][k];
  return { p: V(x + side * 1.3, 2.5 + lift, mobile ? 8.4 : 6.9), t: V(x + side * 1.45, .72 + lift * .6, -.3) };
}
const camP = V(), camT = V(), tmpA = V(), tmpB = V();
function placeCamera(s, t) {
  const k = Math.floor(s), f = s - k;
  const c = k + smooth(.74, 1, f);             // hold on a station, then travel to the next
  const a = key(Math.floor(c)), b = key(Math.ceil(c)), u = ease(c - Math.floor(c));
  camP.lerpVectors(a.p, b.p, u); camT.lerpVectors(a.t, b.t, u);
  camP.x += Math.sin(t * .2) * .08; camP.y += Math.sin(t * .27) * .05;    // a slow handheld drift
  camera.position.copy(camP); camera.lookAt(camT);
}

/* ── the phases ───────────────────────────────────────────────────────── */
const P = [0, 0, 0, 0, 0, 0];
const liq = new THREE.Color(), deep = new THREE.Color(), mix = new THREE.Color(), tmpC = new THREE.Color();
const specLis = () => [...document.querySelectorAll('#ro-specimens li')];
let flowT = 0, prevP2 = 0;
function phases(t, dt) {
  liq.set(cur.liquid); deep.set(cur.deep);
  mix.setRGB(0, 0, 0); tierCols.forEach((c) => mix.add(c)); mix.multiplyScalar(1 / 3);
  // 1 · Selection, 2 · Composition: notes leave their dishes, queue above the vessel, drop in one by one
  const NS = Math.max(1, specimens.length), W = V(ST[2], 0, VZ);
  const hitT = (i) => .12 + (i / NS) * .5;
  const v = smooth(.64, .86, P[2]), fuseC = smooth(.8, .96, P[2]), flash = Math.exp(-Math.pow((P[2] - .955) / .03, 2));
  const mouth = V(W.x, NECK_TOP + .2, W.z), surfY = LEVEL_L;
  const avg = tmpA.set(0, 0, 0); let hits = 0;
  const tierDone = [0, 0, 0], tierAll = [0, 0, 0];
  specimens.forEach((s) => {
    if (!s.ready) { const r = reliefFor(s.key, s.mat.map); if (r) { s.mesh.geometry = r.geo; s.col.copy(r.col); s.aspect = r.aspect; s.ready = true; } }
    const k = s.idx / NS, on = smooth(k * .7, k * .7 + .2, P[1]), h = hitT(s.idx);
    const Q = V(W.x + (NS > 1 ? s.idx / (NS - 1) - .5 : 0) * 3.3, 2.72 + Math.sin(s.idx * 1.7) * .08, .3);
    const sinkTo = V(W.x + s.jx * .3, FCY - .4 + s.jy * .16, W.z + s.jz * .22);
    let sc = .62, op = 1, inside = 0;
    const pos = s.mesh.position;
    tierAll[s.tier]++;
    if (P[2] <= 0) { pos.copy(s.home); pos.y += Math.sin(t * 1.3 + s.idx) * .025; sc = .62 * (.3 + .7 * on); op = .3 + .7 * on; }
    else if (P[2] < h - .07) {                                        // lift off the dish, glide to the queue, hover
      const e = ease(smooth(0, .1, P[2])), mid = tmpB.copy(s.home).lerp(Q, .5); mid.y += 1.6;
      const q = 1 - e; pos.set(q * q * s.home.x + 2 * q * e * mid.x + e * e * Q.x, q * q * s.home.y + 2 * q * e * mid.y + e * e * Q.y, q * q * s.home.z + 2 * q * e * mid.z + e * e * Q.z);
      pos.y += Math.sin(t * 1.4 + s.idx * 1.3) * .04 * e; sc = .62 - .1 * e;
    } else if (P[2] < h - .015) {                                     // swing over to the neck
      const u = ease((P[2] - (h - .07)) / .055), mid = tmpB.copy(Q).lerp(mouth, .5); mid.y += .35;
      const q = 1 - u; pos.set(q * q * Q.x + 2 * q * u * mid.x + u * u * mouth.x, q * q * Q.y + 2 * q * u * mid.y + u * u * mouth.y, q * q * Q.z + 2 * q * u * mid.z + u * u * mouth.z);
      sc = .52 - .24 * u;
    } else if (P[2] < h) {                                            // fall through the neck
      const u = (P[2] - (h - .015)) / .015; pos.set(mouth.x, mouth.y + (surfY - mouth.y) * u * u, mouth.z); sc = .28;
    } else {                                                          // sink, turning, and dissolve
      const u = clamp01((P[2] - h) / .26); inside = 1;
      pos.set(W.x, surfY, W.z).lerp(sinkTo, 1 - Math.pow(1 - u, 2)); sc = .28 * (1 - .35 * u); op = 1 - smooth(.2, 1, u);
      hits++; avg.add(V(s.col.r, s.col.g, s.col.b)); tierDone[s.tier]++;
    }
    s.mesh.visible = op > .01;
    s.mat.opacity = op;
    const a = s.aspect || 1;
    s.mesh.scale.set(sc * Math.min(1, a), sc / Math.max(1, a), sc);
    s.mesh.rotation.set(-.14 + Math.sin(t * .7 + s.idx) * .06, Math.sin(t * .5 + s.idx * 2.1) * .42 + inside * (P[2] - h) * 9, Math.sin(t * .4 + s.idx) * .08 + inside * (P[2] - h) * 4);
    s.label.on = (P[2] <= 0 && on > .6) || (P[2] > .07 && P[2] < h - .075) ? 1 : 0;
    s.label.offset.y = P[2] > 0 ? .38 : -.42;
    // the splash as it breaks the surface
    if (prevP2 < h && P[2] >= h && P[2] - prevP2 < .05) {
      for (let n = 0; n < 16; n++) { const a0 = rand(0, TAU), o = V(W.x + Math.cos(a0) * .05, surfY + .01, W.z + Math.sin(a0) * .05);
        fx.emit({ a: o, b: o.clone().add(V(Math.cos(a0) * .1, rand(.15, .3), Math.sin(a0) * .1)), c: o.clone().add(V(Math.cos(a0) * .18, -.02, Math.sin(a0) * .18)), life: rand(.35, .6), size: rand(.012, .022), alpha: .8, color: new THREE.Color('#ffffff') }); }
    }
    // its colour bleeding into the liquid like ink
    for (let k2 = 0; k2 < INK_K; k2++) {
      const d = s.inkD[k2], i3 = s.idx * INK_K + k2, rel = h + d.r * .22, age = (P[2] - rel) / .38;
      if (age <= 0 || s.idx >= 12) { if (s.idx < 12) ink.alpha[i3] = 0; continue; }
      const a1 = Math.min(1, age), eo = 1 - Math.pow(1 - a1, 2);
      const base = tmpB.set(W.x, surfY, W.z).lerp(sinkTo, 1 - Math.pow(1 - d.r, 2));
      let x = base.x + d.dir.x * (.05 + .34 * eo) + Math.sin(t * .45 + d.s) * .03, y = base.y + d.dir.y * (.05 + .2 * eo) + .1 * a1, z = base.z + d.dir.z * (.05 + .26 * eo) + Math.cos(t * .4 + d.s) * .03;
      if (v > 0) {                                                     // the stirrer pulls everything into a spiral
        let dx = x - W.x, dz = z - W.z, rr = Math.hypot(dx, dz), an = Math.atan2(dz, dx);
        an += v * (2.4 + 3.2 * (1 - Math.min(1, rr / .8))) + t * (.6 + 2.4 * v) * v; rr *= 1 - .32 * v;
        x = W.x + Math.cos(an) * rr; z = W.z + Math.sin(an) * rr; y += (FCY - .05 + (y - FCY) * .55 - y) * v;
      }
      let ox = x - W.x, oy = y - FCY, oz = z - W.z; const L = Math.hypot(ox, oy, oz), lim = LR - .12;
      if (L > lim) { const f = lim / L; ox *= f; oy *= f; oz *= f; }
      ink.pos[i3 * 3] = W.x + ox; ink.pos[i3 * 3 + 1] = Math.min(FCY + oy, surfY - .05); ink.pos[i3 * 3 + 2] = W.z + oz;
      tmpC.copy(s.col).lerp(liq, fuseC);
      ink.col[i3 * 3] = tmpC.r; ink.col[i3 * 3 + 1] = tmpC.g; ink.col[i3 * 3 + 2] = tmpC.b;
      ink.size[i3] = d.z * (.25 + .75 * eo) * (1 + .3 * v);
      ink.alpha[i3] = .8 * Math.min(1, age * 6) * (1 - .25 * a1) * (1 - smooth(.9, 1, P[2]));
    }
  });
  for (let i = specimens.length * INK_K; i < ink.n; i++) ink.alpha[i] = 0;
  ink.flush();
  specLis().forEach((li, i, arr) => li.classList.toggle('on', P[1] > (i / arr.length) * .85));
  document.querySelectorAll('#ro-accord div').forEach((el, i) => el.classList.toggle('on', P[2] > 0 && tierAll[i] > 0 && tierDone[i] >= tierAll[i]));
  const fs = document.getElementById('fuse-state');
  if (fs) fs.textContent = P[2] <= .06 ? 'Charging the vessel' : hits < specimens.length ? `Adding notes · ${hits} / ${specimens.length}` : P[2] < .86 ? 'Stirring' : 'Fused · one accord';
  // the liquid: clear, tinted by each note, then one colour
  if (hits) avg.multiplyScalar(1 / hits);
  const tint = tmpC.set('#cfdde0').lerp(mix.setRGB(avg.x, avg.y, avg.z), hits ? .5 * Math.min(1, hits / specimens.length) : 0).lerp(liq, fuseC);
  vLiqMat.color.copy(tint); vLiqMat.opacity = .05 + .08 * (hits / NS) + .8 * fuseC; vLiqMat.emissive.copy(liq).multiplyScalar(.06 * fuseC + flash * .9);
  surfMat.color.copy(tint); surfMat.opacity = .14 + .66 * fuseC;
  caustic.material.color.copy(liq); caustic.material.opacity = (.12 + .4 * fuseC) * (P[2] > 0 ? 1 : 0) + flash * .5;
  vesselLight.color.copy(liq); vesselLight.intensity = fuseC * 1.6 + flash * 7;
  stirG.rotation.y += dt * 26 * v; ledMat.color.set(v > .01 ? '#5dff7a' : P[2] > 0 ? '#ffb020' : '#3a1010');
  // the surface: ripples where each note lands, then the vortex
  { const pa = surfGeo.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), z = pa.getZ(i), r = Math.hypot(x, z);
      let y = -v * .15 * Math.exp(-(r * r) / .07) * (1 + .08 * Math.sin(t * 3 + r * 9));
      specimens.forEach((sp) => { const w = (P[2] - hitT(sp.idx)) / .1; if (w > 0 && w < 1) { const R = w * SURF_R; y += .022 * (1 - w) * Math.sin((r - R) * 46) * Math.exp(-Math.pow((r - R) / .07, 2)); } });
      pa.setY(i, y);
    }
    pa.needsUpdate = true; surfGeo.computeVertexNormals(); }
  // bubbles rising, more of them while it stirs
  const bubOn = P[2] > .06 && P[2] < .99 ? 1 : 0, y0 = FCY - FR + .12;
  bubD.forEach((b, i) => {
    const f = (t * b.sp + b.ph) % 1, an = b.a + t * v * 3.5, rr = b.r * (1 - .3 * v);
    bub.pos[i * 3] = W.x + Math.cos(an) * rr; bub.pos[i * 3 + 1] = y0 + f * (surfY - .03 - y0); bub.pos[i * 3 + 2] = W.z + Math.sin(an) * rr;
    bub.col[i * 3] = bub.col[i * 3 + 1] = bub.col[i * 3 + 2] = .9;
    bub.size[i] = b.z; bub.alpha[i] = bubOn * (b.k < .3 + .7 * v ? .55 : 0) * Math.sin(Math.PI * f);
  });
  bub.flush();
  accordLabel.on = P[2] > .9 && P[2] < 1.01 ? 1 : 0;
  prevP2 = P[2];
    if (relabel) { accordLabel.obj = vessel; accordLabel.offset = V(0, NECK_TOP + .55, 0); relabel = false; }
  // 3 · Maturation: the bell jar comes down; days and nights pass; the colour deepens
  const jarDown = smooth(0, .14, P[3]);
  jar.position.y = .14 + (1 - jarDown) * 2.4;
  jar.visible = P[3] > 0 || P[4] > 0;
  tmpC.copy(liq).lerp(deep, .25 + smooth(.1, .95, P[3]) * .55);
  for (const f of [flask3, flask4, flask5]) { f.userData.lm.color.copy(tmpC); f.userData.lm.emissive.copy(tmpC).multiplyScalar(.5); }
  setLevel(flask3.userData.lm, P[3] > 0 ? flask3.position.y + .02 + .95 : -99);
  const cyc = P[3] * 6 * TAU;                                         // six days-and-nights sweep past
  orbitLamp.position.set(Math.cos(cyc) * 1.6, 1.2 + Math.sin(cyc) * .9, Math.sin(cyc) * .9 + .4);
  lampGlow.position.copy(orbitLamp.position);
  const day = Math.max(0, Math.sin(cyc));
  orbitLamp.color.set(day > .1 ? '#ffd9a8' : '#9fb4ff'); lampGlow.material.color.copy(orbitLamp.color);
  orbitLamp.intensity = P[3] > 0 && P[3] < 1 ? 3 + day * 6 : 0; lampGlow.material.opacity = P[3] > 0 && P[3] < 1 ? .5 + day * .5 : 0;
  if (P[3] > 0 && P[3] < 1 && Math.random() < (1 - P[3]) * .8) {                 // motes settle out of the liquid
    const a = V(ST[3] + rand(-.35, .35), .4 + rand(.2, .9), rand(-.25, .25));
    fx.emit({ a, b: a.clone().add(V(rand(-.05, .05), -.2, 0)), c: a.clone().add(V(rand(-.08, .08), -.45, 0)), life: rand(1.2, 2.2), size: rand(.015, .03), alpha: .6, color: tmpC.clone().lerp(new THREE.Color('#fff'), .4) });
  }
  const dayN = Math.round(smooth(.08, .96, P[3]) * 180);
  document.getElementById('day').textContent = String(dayN).padStart(3, '0');
  document.getElementById('days-bar').style.width = `${dayN / 180 * 100}%`;
  // 4 · Evaluation: blotters dip, rise stained; the balance settles
  setLevel(flask4.userData.lm, P[4] > 0 || P[3] > .9 ? flask4.position.y + .02 + .95 : -99);
  const dip = smooth(.05, .3, P[4]) - smooth(.32, .55, P[4]);
  blotters.forEach((b, i) => { b.g.position.y = 2.5 - dip * 1.15; b.stain.material.color.copy(tmpC); b.stain.material.opacity = smooth(.25, .32, P[4]) * .85; });
  if (P[4] > .55 && P[4] < 1 && Math.random() < .6) {
    const bl = blotters[Math.floor(rand(0, 3))], a = V(ST[4] + bl.g.position.x + rand(-.03, .03), bl.g.position.y - .85, 0);
    fx.emit({ a, b: a.clone().add(V(rand(-.15, .15), .5, rand(-.1, .1))), c: a.clone().add(V(rand(-.4, .4), 1.2, rand(-.2, .2))), life: rand(1.5, 2.4), size: rand(.02, .035), alpha: .45, color: tmpC });
  }
  tubes.children.forEach((c) => { if (c.userData.lm) { const lv = .1 + .7 * smooth(.55 + c.userData.i * .1, .8 + c.userData.i * .05, P[4]); setLevel(c.userData.lm, P[4] > .55 ? lv + .02 : -99); c.userData.lm.color.copy(tmpC); c.userData.lm.emissive.copy(tmpC); } });
  const settle = smooth(.45, .95, P[4]);
  const ang = (1 - settle) * (Math.sin(t * 2.3) * 38 + Math.sin(t * 5.1) * 12) + (1 - settle) * 20;
  document.getElementById('needle').style.transform = `rotate(${ang.toFixed(1)}deg)`;
  document.getElementById('verdict').textContent = P[4] >= .95 ? 'Balanced. Ready.' : P[4] > .45 ? 'Refining…' : 'Assessing…';
  // 5 · Bottling: cap off, the flask tips and pours, cap on
  const lift = smooth(.04, .14, P[5]) * (1 - smooth(.78, .9, P[5]));
  bottleCap.position.set(.95 + lift * .32, bottle.capBase + lift * .55, .102); bottleCap.rotation.z = -lift * .3;
  const tilt = smooth(.12, .22, P[5]) * (1 - smooth(.72, .8, P[5]));
  const pv = V(-.95, 1.06, -.2);                                // pivot: the ring of the stand
  flask5.rotation.z = -tilt * 1.15;
  flask5.position.set(pv.x, pv.y, pv.z).add(V(0, .5 - pv.y + .56, 0).applyAxisAngle(V(0, 0, 1), -tilt * 1.15)).sub(V(0, .56, 0).applyAxisAngle(V(0, 0, 1), -tilt * 1.15)).add(V(0, 0, 0));
  const poured = smooth(.2, .74, P[5]);
  setLevel(flask5.userData.lm, P[5] > 0 || P[4] > .9 ? flask5.position.y + .02 + .95 * (1 - poured * .85) : -99);
  for (const m of [bottleBody.material, bottleCap.material]) { m.uniforms.uFill.value = poured; m.uniforms.uTime.value = t; }
  if (tilt > .6 && P[5] < .76) {
    const sp = V(ST[5] - .95, 0, -.2); const mouth = V(0, 1.64, 0).applyAxisAngle(V(0, 0, 1), -tilt * 1.15).add(flask5.position).add(V(ST[5], 0, 0));
    const c = V(ST[5] + .95, bottle.neckY + .5, .1);
    for (let n = 0; n < 4; n++) fx.emit({ a: mouth.clone().add(V(rand(-.02, .02), 0, 0)), b: mouth.clone().lerp(c, .5).add(V(0, .25, 0)), c: c.clone().add(V(rand(-.02, .02), 0, 0)), life: rand(.35, .5), size: rand(.035, .05), alpha: .95, color: tmpC, lin: true });
    void sp;
  }
  document.querySelectorAll('.checks li').forEach((li) => li.classList.toggle('on', P[5] >= +li.dataset.at));
}

/* ── sizing, loop ─────────────────────────────────────────────────────── */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  fx.mat.uniforms.uScale.value = h * renderer.getPixelRatio() * .9;
  inkMat.uniforms.uScale.value = h * renderer.getPixelRatio() * .9;
}
addEventListener('resize', resize); resize();
build(qs.has('p') ? +qs.get('p') : 0);
const FIXED = qs.has('s') ? +qs.get('s') : null;
if (FIXED !== null && false) { const s = +qs.get('s'); requestAnimationFrame(() => { const k = Math.floor(s), el = secs[Math.min(k, secs.length - 1)]; scrollTo(0, el.offsetTop + (s - k) * el.offsetHeight - innerHeight * .5); }); }

const tmpL = V();
let last = performance.now(), clock = 0, sm = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden || window.__labHold) { last = now; return; }
  const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
  const target = FIXED !== null ? FIXED : PREVIEW ? 1 + ((clock * .09) % 5) : readScroll();
  sm = FIXED !== null ? target : sm + (target - sm) * Math.min(1, dt * 5);                     // eased scroll
  story = sm;
  const k = Math.floor(story), f = story - k;
  for (let i = 1; i <= 5; i++) P[i] = i < k ? 1 : i > k ? 0 : clamp01(f / .74);
  phases(clock, dt);
  fx.update(dt);
  placeCamera(story, clock);
  // interface
  panels.forEach((p, i) => p && p.classList.toggle('in', FIXED !== null ? Math.floor(story) === i : (Math.abs(story - (i + .37)) < .55 || (i === 0 && story < .5))));
  if (FIXED !== null) panels.forEach((p) => p && (p.style.position = 'fixed', p.style.inset = '0'));
  railLinks.forEach((a) => a.classList.toggle('on', k === +a.dataset.i));
  rail.classList.toggle('hide', story < .7 || story > 5.9);
  const pxu = innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  for (const l of labels) {
    const vis = l.on && l.obj.visible !== false;
    l.el.classList.toggle('on', !!vis);
    if (!vis) continue;
    l.obj.getWorldPosition(tmpL).add(l.offset); tmpL.project(camera);
    if (tmpL.z > 1) { l.el.classList.remove('on'); continue; }
    l.el.style.transform = `translate(${((tmpL.x * .5 + .5) * innerWidth).toFixed(1)}px, ${((-tmpL.y * .5 + .5) * innerHeight).toFixed(1)}px) translate(-50%, -50%)`;
  }
  void pxu;
  composer.render();
}
// station-level labels switch on with their phase
const stationLabels = labels.slice(); // created before build(): beakers, accord, jar, blotters, bottle
function wireStationLabels() {
  const [b0, b1, b2, acc, jarL, blot, bot] = stationLabels;
  void b0; void b1; void b2; void acc;
  const tick = () => { jarL.on = P[3] > 0 && P[3] < 1 ? 1 : 0; blot.on = P[4] > 0 && P[4] < .5 ? 1 : 0; bot.on = P[5] > .9 ? 1 : 0; requestAnimationFrame(tick); };
  tick();
}
wireStationLabels();
requestAnimationFrame(loop);
