/* FEMINISTA — The Fusion.
   Three bottles stand on a turntable. Bring one forward and its notes arrive
   in three rings (top, heart, base) and float around it; the cap lifts, every
   note spirals into the open neck as light, the cap seals, and the perfume fuses. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as I from './ingredients.js';

const qs = new URLSearchParams(location.search);
const PREVIEW = qs.has('preview');
const EMBED = qs.has('embed');
const SPRAY = qs.has('spray');                                   // embedded on a perfume page: only cap off, two sprays, cap on
const SOLO = qs.has('solo') || SPRAY;
if (SOLO) document.body.classList.add('solo');
if (SPRAY) document.body.classList.add('spray-only');
if (EMBED) document.body.classList.add('embed');
const STAGE = document.body.dataset.mode === 'stage';
const LAB = document.body.dataset.scene === 'lab';
if (PREVIEW) document.body.classList.add('preview');

/* ── the three perfumes and their notes ─────────────────────────────────
   split: where the cap ends, as a fraction of the bottle height from the bottom */
const PERFUMES = [
  {
    name: 'Vers', slug: 'vers', price: 2950, family: 'Spice & Vanilla', split: ['Ve', 'rs'], num: 'N°01', img: 'assets/vers-cut.webp', accent: '#f0915a', liquid: '#ff7a3a', top: .6, cap: .765, neck: .42, metal: '#d6b06a', act: '#151314',
    tiers: [
      [['Cinnamon', ['cinnamon'], '#c06a30'], ['Cardamom', ['cardamom'], '#a8c070'], ['Ginger', ['ginger'], '#e8c080']],
      [['Praline', ['praline'], '#d08a40'], ['Candied fruits', ['candied'], '#ff6a50'], ['White flowers', ['jasmine', 'tuberose', 'orangeblossom'], '#fff6ea']],
      [['Vanilla', ['vanilla'], '#f4dfb0'], ['Coffee', ['coffee'], '#a0603a'], ['Tonka bean', ['tonka'], '#b07a50'], ['Benzoin', ['benzoin'], '#e07a30'], ['Musk', [], '#fff0f4']],
    ],
  },
  {
    name: 'Locken', slug: 'locken', price: 3450, family: 'Amber & Gourmand', split: ['Loc', 'ken'], num: 'N°02', img: 'assets/locken-cut.webp', accent: '#e3b860', liquid: '#ffbe45', top: .62, cap: .835, neck: .34, metal: '#e2c27c', act: '#e2c27c',
    tiers: [
      [['Almond', ['almond'], '#e0b080'], ['Coffee', ['coffee'], '#a0603a'], ['Bergamot', ['bergamot'], '#d8e070'], ['Lemon', ['lemon'], '#fff060']],
      [['Tuberose', ['tuberose'], '#fff4ee'], ['Jasmine sambac', ['jasmine'], '#fffbe8'], ['Orange blossom', ['orangeblossom'], '#fff2c0'], ['Bulgarian rose', ['rose'], '#ff4a7a'], ['Orris', ['iris'], '#b090ff']],
      [['Tonka bean', ['tonka'], '#b07a50'], ['Cacao', ['cacao'], '#a05a3a'], ['Vanilla', ['vanilla'], '#f4dfb0'], ['Praline', ['praline'], '#d08a40'],
        ['Sandalwood', ['sandalwood'], '#e0b890'], ['Musk', [], '#fff0f4'], ['Amber', ['amber'], '#ffa030'], ['Cashmere wood', ['woodchips'], '#c8a088'],
        ['Patchouli', ['patchouli'], '#90c070'], ['Cinnamon', ['cinnamon'], '#c06a30'], ['Cedar', ['cedar'], '#d08050']],
    ],
  },
  {
    name: 'Fresca', slug: 'fresca', price: 2750, family: 'Fruit & Cream', split: ['Fres', 'ca'], num: 'N°03', img: 'assets/fresca-cut.webp', accent: '#df6b74', liquid: '#ff3a64', top: .58, cap: .815, neck: .33, metal: '#c8ccd2', act: '#151314',
    tiers: [
      [['Fruits', ['raspberry', 'cherry', 'blackberry', 'strawberry'], '#ff3060']],
      [['Apple', ['apple'], '#ff4040']],
      [['Whipped cream', ['cream'], '#fff8ee'], ['Vanilla', ['vanilla'], '#f4dfb0']],
    ],
  },
];
// photographs: display size (world units, longest side) and the 3D model used if a photo is missing
const PSIZE = { coffee: .5, almond: .48, bergamot: .55, lemon: .55, tuberose: .62, jasmine: .55, orangeblossom: .55, rose: .62, iris: .68,
  tonka: .5, cacao: .66, vanilla: .8, praline: .5, sandalwood: .66, amber: .5, woodchips: .58, patchouli: .64, cinnamon: .66, cedar: .66,
  cardamom: .46, ginger: .62, candied: .55, benzoin: .5, raspberry: .44, cherry: .5, blackberry: .44, strawberry: .5, apple: .62, cream: .62 };
const FALLBACK = { coffee: I.coffeeBean, almond: I.almond, bergamot: I.bergamotSlice, lemon: I.lemonSlice, tuberose: I.tuberose, jasmine: I.jasmine,
  orangeblossom: I.orangeBlossom, rose: I.rose, iris: I.iris, tonka: I.tonkaBean, cacao: I.cacaoBean, vanilla: I.vanillaPod, praline: I.praline,
  sandalwood: I.sandalwood, amber: I.amber, woodchips: I.cashmereWood, patchouli: I.leaf, cinnamon: I.cinnamon, cedar: I.cedar, cardamom: I.cardamom,
  ginger: I.ginger, candied: I.candiedRed, benzoin: I.benzoin, raspberry: I.raspberry, cherry: I.cherry, blackberry: I.blackberry, strawberry: I.raspberry,
  apple: I.apple, cream: I.whippedCream };
const SIZE = new Map([
  [I.coffeeBean, .2], [I.almond, .26], [I.tonkaBean, .26], [I.cacaoBean, .26], [I.chocolate, .3], [I.cardamom, .2], [I.praline, .3],
  [I.cinnamon, .5], [I.ginger, .42], [I.vanillaPod, .62], [I.lemonSlice, .4], [I.bergamotSlice, .4], [I.jasmine, .42], [I.tuberose, .42],
  [I.orangeBlossom, .42], [I.rose, .44], [I.iris, .44], [I.leaf, .4], [I.sandalwood, .44], [I.cedar, .44], [I.cashmereWood, .44],
  [I.amber, .3], [I.benzoin, .28], [I.musk, .42], [I.raspberry, .3], [I.blackberry, .3], [I.cherry, .34], [I.apple, .46],
  [I.candiedRed, .22], [I.candiedGreen, .22], [I.candiedOrange, .22], [I.whippedCream, .5],
]);

/* ── timeline (seconds after a bottle arrives at the front) ────────────── */
const T = {
  tier: [.5, 1.5, 2.5], fly: 1.2,   // notes arrive, ring by ring, and float
  capOpen: 4.6,                      // the cap lifts off
  vortex: 5.4, spiral: 1.3,          // a funnel of light pulls every note into the neck
  fuse: 8.4,                         // the colours inside become one
  crimp: 8.8, reveal: 9.2,           // the atomiser comes down and clicks on
  capRest: 9.6,                      // the cap is set down beside the bottle
  sprays: [10.6, 11.3],              // two pumps of spray
  capClose: 12.2,                    // the cap goes back on
  done: 13.6, previewNext: 16,
};
if (SPRAY) Object.assign(T, { tier: [900, 901, 902], vortex: 950, fuse: -3, capOpen: 1.55, crimp: 2.15, reveal: 2.3, capRest: 2.5, sprays: [3.35, 4.05], capClose: 4.9, done: 6.4 });
const TURN = 1.6; // seconds for the turntable to bring the next bottle forward

/* ── renderer, scene, camera ──────────────────────────────────────────── */
const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { document.body.classList.add('no-gl'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, PREVIEW ? 1 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#060507');
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .45, .65, .9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const key = new THREE.SpotLight('#ffe9d2', 38, 30, .6, .7, 1.4); key.position.set(2.5, 7, 6); scene.add(key);
const rimL = new THREE.DirectionalLight('#cfd6ff', 1.2); rimL.position.set(-4, 3, -4); scene.add(rimL);
const rimR = new THREE.DirectionalLight('#ffe2c8', 1.2); rimR.position.set(4, 2, -4); scene.add(rimR);
const core = new THREE.PointLight('#ffffff', 0, 6, 1.5); core.position.set(0, -.2, .6); scene.add(core);
scene.add(new THREE.HemisphereLight('#3a3036', '#050405', .5));

/* ── backdrop ─────────────────────────────────────────────────────────── */
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(70, 40), new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color() }, uGlow: { value: .3 } },
  depthWrite: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `
    uniform float uTime, uGlow; uniform vec3 uColor; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
      return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float s = 0., a = .5; for(int i=0;i<5;i++){ s += a*n(p); p *= 2.03; a *= .5; } return s; }
    void main(){
      vec2 p = (vUv - vec2(.5, .53)) * vec2(1.76, 1.);
      float r = length(p);
      float smoke = fbm(p * 5. + vec2(uTime * .03, -uTime * .05)) * fbm(p * 2.5 - uTime * .02);
      vec3 col = vec3(.018, .015, .02) + uColor * (exp(-r * r * 34.) * .045 + exp(-r * 7.) * .012) * uGlow;
      col += uColor * smoke * .014 * smoothstep(.55, .05, r);
      gl_FragColor = vec4(col, 1.);
    }`,
}));
backdrop.position.set(0, .5, -12);
scene.add(backdrop);

const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.35, 'rgba(255,255,255,.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const FLOOR_Y = -1.42;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.MeshBasicMaterial({ color: '#050405', transparent: true, alphaMap: glowTex }));
floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR_Y, -3); scene.add(floor);
const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .3 }));
pool.rotation.x = -Math.PI / 2; pool.position.y = FLOOR_Y + .005; scene.add(pool);
// the turntable: a faint ring of light the bottles stand on
const R = 4.6, CENTER = new THREE.Vector3(0, 0, -R);
const track = new THREE.Mesh(new THREE.RingGeometry(R - .012, R + .012, 220), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false }));
track.rotation.x = -Math.PI / 2; track.position.set(CENTER.x, FLOOR_Y + .004, CENTER.z); scene.add(track);
if (STAGE) { floor.visible = false; track.visible = false; }
if (SOLO) track.visible = false;

/* ── STAGE mode: a scene behind, a stone pedestal, the name in giant letters ── */
const stageBg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  depthWrite: false, depthTest: false,
  uniforms: { uA: { value: 1 }, uB: { value: 1 }, uMix: { value: 1 }, uTime: { value: 0 },
    mapA: { value: null }, mapB: { value: null }, hasA: { value: 0 }, hasB: { value: 0 }, uScreen: { value: 1.78 }, uImg: { value: 1376 / 768 }, uZoom: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, .9999, 1.); }',
  fragmentShader: `
    uniform float uA, uB, uMix, uTime, hasA, hasB, uScreen, uImg, uZoom; uniform sampler2D mapA, mapB; varying vec2 vUv;
    vec3 L(vec3 c){ return pow(c, vec3(2.2)); }
    float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
    float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
      return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * n(p); p *= 2.03; a *= .5; } return s; }
    // soft out-of-focus lights
    vec3 bokeh(vec2 p, float scale, vec3 c1, vec3 c2, float dens, float t){
      vec3 acc = vec3(0.);
      vec2 q = p / scale + vec2(t * .05, 0.);
      vec2 id = floor(q), f = fract(q) - .5;
      float r = h2(id);
      if (r < dens) {
        vec2 o = vec2(h2(id + 3.1), h2(id + 7.7)) - .5;
        float d = length(f - o * .6);
        float rad = .18 + .22 * h2(id + 1.3);
        float disc = smoothstep(rad, rad * .82, d) * (.55 + .45 * smoothstep(rad * .5, rad, d));
        acc = mix(c1, c2, h2(id + 9.1)) * disc * (.4 + .6 * h2(id + 5.5));
      }
      return acc;
    }
    vec3 scene(float id, vec2 p, float t){
      float hz = -.4;                                    // horizon, just behind the pedestal
      vec3 col;
      if (id < .5) {                                     // VERS — a spice-road dusk over dunes
        col = mix(L(vec3(.88,.42,.2)), L(vec3(.2,.07,.11)), smoothstep(hz, 6.5, p.y));
        vec2 sp = p - vec2(4.2, 1.1);
        col += L(vec3(1.,.72,.42)) * (exp(-dot(sp,sp) * .9) * 1.4 + exp(-length(sp) * .55) * .35);
        float d1 = hz + .7 + 1.1 * fbm(vec2(p.x * .09 + 4., 1.));
        col = mix(col, L(vec3(.55,.24,.14)) * (1. + .35 * smoothstep(d1 - .25, d1, p.y)), smoothstep(d1 + .02, d1 - .02, p.y));
        float d2 = hz - .3 + 1.3 * fbm(vec2(p.x * .07 - 3., 2.));
        col = mix(col, L(vec3(.33,.13,.09)) * (1. + .5 * smoothstep(d2 - .35, d2, p.y)), smoothstep(d2 + .02, d2 - .02, p.y));
        col += bokeh(p, 1.7, L(vec3(1.,.66,.36)), L(vec3(1.,.85,.6)), .18, t) * .55 * smoothstep(-3., 2., p.y);
      } else if (id < 1.5) {                             // LOCKEN — golden-hour amber light
        col = mix(L(vec3(.95,.66,.27)), L(vec3(.16,.09,.03)), smoothstep(hz - .5, 7., p.y));
        vec2 lp = p - vec2(-3.5, 7.5);
        float ang = atan(lp.y, lp.x);
        float rays = pow(n(vec2(ang * 9., t * .06)), 3.) * smoothstep(14., 2., length(lp));
        col += L(vec3(1.,.82,.5)) * rays * .6;
        col += L(vec3(1.,.8,.45)) * exp(-length(p - vec2(-2.5, 3.)) * .32) * .55;
        float m = hz + .2 + .8 * fbm(vec2(p.x * .12, 5.));
        col = mix(col, L(vec3(.42,.26,.09)) * (.8 + .5 * fbm(p * vec2(.6, 3.))), smoothstep(m + .05, m - .05, p.y));
        col += bokeh(p, 1.3, L(vec3(1.,.78,.36)), L(vec3(1.,.92,.68)), .28, t) * .7;
        col += bokeh(p + 9., 2.6, L(vec3(1.,.7,.3)), L(vec3(1.,.86,.5)), .2, t * .6) * .45;
      } else {                                           // FRESCA — a rose garden at dusk
        col = mix(L(vec3(.86,.36,.48)), L(vec3(.17,.05,.12)), smoothstep(hz - .6, 6.5, p.y));
        col += L(vec3(1.,.62,.7)) * exp(-length(p - vec2(0., .8)) * .38) * .45;
        float fol = fbm(p * .35 + vec2(t * .01, 0.)) + .45 * smoothstep(3., 10., abs(p.x));
        col = mix(col, L(vec3(.12,.06,.09)) * (.8 + .6 * fbm(p * 1.3)), smoothstep(.62, .78, fol) * .85);
        float g = hz + .1 + .6 * fbm(vec2(p.x * .15, 9.));
        col = mix(col, L(vec3(.26,.08,.15)), smoothstep(g + .05, g - .05, p.y));
        col += bokeh(p, 1.2, L(vec3(1.,.35,.5)), L(vec3(1.,.8,.86)), .3, t) * .8;
        col += bokeh(p + 4., 2.2, L(vec3(.95,.22,.38)), L(vec3(1.,.55,.66)), .22, t * .7) * .5;
      }
      col *= 1. - .35 * smoothstep(5., 13., length(p * vec2(.75, 1.)));   // vignette
      return col;
    }
    void main(){
      vec2 p = (vUv - .5) * vec2(13. * uScreen, 13.) + vec2(0., .4);
      vec2 c = vUv;                                   // cover-fit the photograph to the screen
      if (uScreen > uImg) c.y = (c.y - .5) * (uImg / uScreen) + .5; else c.x = (c.x - .5) * (uScreen / uImg) + .5;
      vec3 a = hasA > .5 ? L(texture2D(mapA, c).rgb) : scene(uA, p, uTime);
      vec2 cb = (c - .5) / uZoom + .5;
      vec3 b = hasB > .5 ? L(texture2D(mapB, cb).rgb) : scene(uB, p / uZoom, uTime);
      vec3 col = mix(a, b, uMix);
      col += (h2(vUv * 913. + uTime) - .5) * .012;      // film grain
      gl_FragColor = vec4(col, 1.);
    }`,
}));
stageBg.frustumCulled = false; stageBg.renderOrder = -100; stageBg.visible = STAGE; scene.add(stageBg);
if (STAGE) renderer.toneMapping = THREE.NoToneMapping; // keep the photographs true to colour
if (LAB) renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
// optional photographs: drop assets/bg/<slug>.webp in and they replace the painted scene
const DISC = LAB ? { x: .5, y: .815 } : { x: .5, y: .755 };
const bgPhotos = PERFUMES.map((p) => {
  const rec = { tex: null, ok: false };
  rec.tex = new THREE.TextureLoader().load(LAB ? 'assets/lab/lab-bg-hd.webp?v=3' : `assets/bg/${p.slug}.webp`, (tx) => { rec.ok = true; stageBg.material.uniforms.uImg.value = tx.image.width / tx.image.height; }, undefined, () => {});
  rec.tex.colorSpace = THREE.NoColorSpace; rec.tex.minFilter = LAB ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; rec.tex.generateMipmaps = LAB; rec.tex.anisotropy = 4;
  return rec;
});

const pedestal = new THREE.Group();
{
  const stone = new THREE.MeshStandardMaterial({ color: '#ebe4d8', roughness: .66, metalness: 0, envMapIntensity: .55 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.9, .24, 96), stone); top.position.y = FLOOR_Y - .12;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.86, .03, 12, 96), stone); lip.rotation.x = Math.PI / 2; lip.position.y = FLOOR_Y - .005;
  const contact = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: glowTex, color: '#000', transparent: true, opacity: .42, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = FLOOR_Y + .004; contact.scale.set(.9, .55, 1);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: glowTex, color: '#000', transparent: true, opacity: .55, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = FLOOR_Y - .25; ground.scale.set(3.4, 2.2, 1);
  pedestal.add(ground, top, lip, contact);
}
pedestal.visible = STAGE; scene.add(pedestal);
const stageKey = new THREE.DirectionalLight('#fff3e2', STAGE ? 1.6 : 0); stageKey.position.set(-3, 6, 5); scene.add(stageKey);

// the name, set huge behind the bottle (two planes so one can fade into the next)
function nameTex(text) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 512;
  const g = c.getContext('2d');
  g.font = '300 400px Manrope, Arial, sans-serif';
  try { g.letterSpacing = '24px'; } catch (_) { /* older browsers */ }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(246,239,228,.92)';
  g.fillText(text.toUpperCase(), 1024, 270);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const nameMat = () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const nameA = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 2.6), nameMat()), nameB = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 2.6), nameMat());
for (const m of [nameA, nameB]) { m.position.set(0, .55, -2.8); m.visible = STAGE; scene.add(m); }
let fontsReady = false;
if (STAGE) (document.fonts ? document.fonts.load('300 100px Manrope') : Promise.resolve()).then(() => { fontsReady = true; nameB.material.map = nameTex(PERFUMES[active].name); nameB.material.needsUpdate = true; });
let stageMix = 1, prevActive = -1, stageLanded = true, shakeT = 9;
function landDust() {                                               // a puff of dust off the stone where it lands
  const col = new THREE.Color('#efe2cc');
  for (let i = 0; i < (PREVIEW ? 60 : 130); i++) {
    const a = Math.random() * Math.PI * 2, r0 = .35 + Math.random() * .25, r1 = .9 + Math.random() * 1.4;
    const o = new THREE.Vector3(Math.cos(a) * r0, FLOOR_Y + .03, Math.sin(a) * r0 * .55);
    const e = new THREE.Vector3(Math.cos(a) * r1, FLOOR_Y + .05 + Math.random() * .45, Math.sin(a) * r1 * .55);
    sparks.emit({ a: o, b: o.clone().lerp(e, .5).setY(FLOOR_Y + .25 + Math.random() * .2), c: e, life: .7 + Math.random() * .8,
      size: .02 + Math.random() * .035, alpha: .25 + Math.random() * .3, color: col, shrink: true, fadeIn: 6 });
  }
}
if (STAGE) { backdrop.visible = false; }

/* ── bottles: the cut-out photograph in two pieces, cap and body ──────── */
const BOTTLE_H = 2.75;
const bottleMat = (reflect) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: !reflect, side: THREE.DoubleSide,
  uniforms: { map: { value: null }, uTime: { value: 0 }, uFill: { value: 0 }, uGlow: { value: 0 }, uFlash: { value: 0 },
    uColor: { value: new THREE.Color() }, uTop: { value: .62 }, uOpacity: { value: 1 }, uReflect: { value: reflect ? 1 : 0 },
    uRange: { value: new THREE.Vector2(0, 1) }, uDim: { value: 1 }, uReflectK: { value: .3 } },
  vertexShader: `uniform vec2 uRange; varying vec2 vUv;
    void main(){ vUv = vec2(uv.x, mix(uRange.x, uRange.y, uv.y)); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `
    uniform sampler2D map; uniform float uTime, uFill, uGlow, uFlash, uTop, uOpacity, uReflect, uDim, uReflectK; uniform vec3 uColor;
    varying vec2 vUv;
    void main(){
      vec4 tex = texture2D(map, vUv);
      if (tex.a < .02) discard;
      vec3 col = tex.rgb;
      float body = smoothstep(.55, .95, tex.a) * (1. - smoothstep(uTop - .05, uTop + .01, vUv.y));
      float L = mix(.03, uTop, uFill);
      float below = 1. - smoothstep(L - .006, L + .006, vUv.y);
      float c1 = sin(vUv.x * 36. + uTime * 1.6 + sin(vUv.y * 22. - uTime * 2.2) * 1.7) * .5 + .5;
      float c2 = sin(vUv.x * -19. + vUv.y * 15. + uTime * 1.1) * .5 + .5;
      col += uColor * body * below * (.07 + .26 * c1 * c2) * (.3 + uGlow * .6);
      float band = exp(-pow((vUv.y - L) / .011, 2.)) * step(.002, uFill) * (1. - step(.995, uFill));
      col += uColor * band * body * 1.6;
      col *= 1. + uFlash * .45;
      col += uColor * uFlash * .3 * smoothstep(.3, .9, tex.a);
      col *= uDim;
      float a = tex.a * uOpacity;
      if (uReflect > .5) a *= (1. - smoothstep(0., .42, vUv.y)) * uReflectK;
      gl_FragColor = vec4(col, a);
    }`,
});

// the atomiser: crimp collar, stem, actuator with a side nozzle (built 1 unit = neck width)
function makeSprayer(p) {
  const g = new THREE.Group();
  const metal = new THREE.MeshPhysicalMaterial({ color: p.metal, metalness: 1, roughness: .2, envMapIntensity: 1.3 });
  const act = p.act === p.metal ? metal : new THREE.MeshPhysicalMaterial({ color: p.act, roughness: .22, clearcoat: 1, clearcoatRoughness: .08 });
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(.5, .53, .24, 56), metal); ferrule.position.y = .12;
  const ridge = new THREE.Mesh(new THREE.TorusGeometry(.505, .022, 10, 56), metal); ridge.rotation.x = Math.PI / 2; ridge.position.y = .2;
  const ridge2 = ridge.clone(); ridge2.position.y = .05;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .16, 16), metal); stem.position.y = .31;
  const actuator = new THREE.Group();
  const button = new THREE.Mesh(new THREE.CylinderGeometry(.3, .31, .34, 56), act); button.position.y = .17;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.3, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), act); dome.scale.y = .22; dome.position.y = .34;
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .04, 16), new THREE.MeshBasicMaterial({ color: '#050505' }));
  nozzle.rotation.z = Math.PI / 2; nozzle.position.set(-.3, .2, 0);
  actuator.add(button, dome, nozzle); actuator.position.y = .37;
  g.add(ferrule, ridge, ridge2, stem, actuator);
  g.visible = false;
  return { g, actuator, nozzle };
}

const loader = new THREE.TextureLoader();
const loads = [];
const rigs = PERFUMES.map((p, i) => {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bottleMat(false));
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bottleMat(false));
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bottleMat(true));
  mirror.renderOrder = -1;
  const mats = [body.material, cap.material, mirror.material];
  if (LAB) mirror.material.uniforms.uReflectK.value = .16;
  body.material.uniforms.uRange.value.set(0, p.cap);
  cap.material.uniforms.uRange.value.set(p.cap, 1);
  for (const m of mats) { m.uniforms.uColor.value.set(p.liquid); m.uniforms.uTop.value = p.top; }
  // a soft shaft of light that rises from the open neck
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, color: p.liquid, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const spray = makeSprayer(p);
  group.add(mirror, body, cap, shaft, spray.g);
  scene.add(group);
  let done; loads.push(new Promise((r) => { done = r; }));
  const tex = loader.load(p.img, (tx) => { p.aspect = tx.image.width / tx.image.height; layout(rig); done(); }, undefined, () => done());
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  for (const m of mats) m.uniforms.map.value = tex;
  const rig = { p, i, group, body, cap, mirror, shaft, mats, spray, w: BOTTLE_H * .45, neckY: 0, scale: 1 };
  layout(rig);
  return rig;
});
function layout(r) {
  const asp = r.p.aspect || .45, s = r.scale, H = BOTTLE_H * s, w = H * asp, c = r.p.cap;
  r.w = w;
  r.body.scale.set(w, H * c, 1); r.body.position.set(0, FLOOR_Y + H * c / 2, 0);
  r.capBase = FLOOR_Y + H * c + H * (1 - c) / 2;
  r.cap.scale.set(w, H * (1 - c), 1); r.cap.position.set(0, r.capBase, .002);
  r.mirror.scale.set(w, -H, 1); r.mirror.position.set(0, FLOOR_Y - H / 2, 0);
  r.neckY = FLOOR_Y + H * c;
  r.W = w * r.p.neck;
  r.spray.g.scale.setScalar(r.W); r.spray.g.position.set(0, r.neckY - r.W * .03, -r.W * .55);
  r.shaft.scale.set(w * .8, H * .75, 1); r.shaft.position.set(0, r.neckY + H * .22, -.01);
}
const setU = (r, k, v) => { for (const m of r.mats) m.uniforms[k].value = v; };

// ingredient photographs: cut-outs that always face the camera
const PHOTO = {};
function photoRec(key) {
  if (PHOTO[key]) return PHOTO[key];
  const rec = PHOTO[key] = { aspect: 1, ok: false, fail: false, waiters: [] };
  const settle = () => { rec.waiters.forEach((f) => f()); rec.waiters = []; };
  let done; loads.push(new Promise((r) => { done = r; }));
  rec.tex = loader.load(`assets/ing/${key}.webp`, (tx) => { rec.aspect = tx.image.width / tx.image.height; rec.ok = true; settle(); done(); },
    undefined, () => { rec.fail = true; settle(); done(); });
  rec.tex.colorSpace = THREE.SRGBColorSpace; rec.tex.anisotropy = 8;
  return rec;
}
function makePhoto(key) {
  const rec = photoRec(key), g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ map: rec.tex, transparent: true, alphaTest: .04, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  g.add(m); g.userData = { photo: true, mat };
  const fit = () => {
    if (rec.fail) { g.remove(m); g.userData.photo = false; const fb = FALLBACK[key]; if (fb) { const o = fb(); o.scale.setScalar(.75); g.add(o); } return; }
    const a = rec.aspect; m.scale.set(a >= 1 ? 1 : a, a >= 1 ? 1 / a : 1, 1);
  };
  if (rec.ok || rec.fail) fit(); else rec.waiters.push(fit);
  return g;
}
Object.keys(PSIZE).forEach(photoRec); // start loading every photograph now

// the shockwave ring at the moment of fusion
const ring = new THREE.Mesh(new THREE.RingGeometry(.988, 1, 160), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
ring.rotation.x = -Math.PI / 2.2; scene.add(ring);

/* ── light particles ──────────────────────────────────────────────────── */
class Sparks {
  constructor(n) {
    this.n = n; this.p = new Array(n).fill(null); this.cursor = 0;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.size = new Float32Array(n); this.alpha = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 400 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: `attribute float aSize, aAlpha; varying float vA; varying vec3 vC; uniform float uScale;
        void main(){ vA = aAlpha; vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.);
          gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; varying vec3 vC;
        void main(){ float d = length(gl_PointCoord - .5); float a = pow(smoothstep(.5, 0., d), 1.7) * vA;
          if (a < .003) discard; gl_FragColor = vec4(vC * (1. + 1.4 * a), a); }`,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
  }
  emit(o) { const i = this.cursor; this.cursor = (i + 1) % this.n; o.age = -(o.delay || 0); this.p[i] = o; }
  clear() { this.p.fill(null); }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      const p = this.p[i];
      if (!p) { this.alpha[i] = 0; continue; }
      p.age += dt;
      if (p.age < 0) { this.alpha[i] = 0; continue; }
      const u = p.age / p.life;
      if (u >= 1) { this.p[i] = null; this.alpha[i] = 0; continue; }
      const e = p.ease ? (u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2) : 1 - Math.pow(1 - u, 2);
      const a = p.a, b = p.b, c = p.c, k = 1 - e;
      this.pos[i * 3] = k * k * a.x + 2 * k * e * b.x + e * e * c.x;
      this.pos[i * 3 + 1] = k * k * a.y + 2 * k * e * b.y + e * e * c.y;
      this.pos[i * 3 + 2] = k * k * a.z + 2 * k * e * b.z + e * e * c.z;
      this.col[i * 3] = p.color.r; this.col[i * 3 + 1] = p.color.g; this.col[i * 3 + 2] = p.color.b;
      this.size[i] = p.size * (p.shrink ? 1 - u * .7 : 1) * (p.grow ? 1 + u * 2.6 : 1);
      this.alpha[i] = p.alpha * Math.sqrt(Math.min(1, u * (p.fadeIn || 1.6) * 2)) * (1 - u * u);
    }
    for (const k of ['position', 'color', 'aSize', 'aAlpha']) this.geo.attributes[k].needsUpdate = true;
  }
}
const sparks = new Sparks(PREVIEW ? 1600 : 3000);

// mist: soft, slow, widening puffs of vapour (normal blending, so it reads as a cloud, not sparks)
const smokeTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  for (let i = 0; i < 18; i++) {
    const x = 64 + (Math.random() - .5) * 46, y = 64 + (Math.random() - .5) * 46, r = 18 + Math.random() * 26;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255,.22)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  }
  g.globalCompositeOperation = 'destination-in';
  const m = g.createRadialGradient(64, 64, 10, 64, 64, 62); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = m; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
class Mist {
  constructor(n) {
    this.n = n; this.p = new Array(n).fill(null); this.cursor = 0;
    this.pos = new Float32Array(n * 3); this.size = new Float32Array(n); this.alpha = new Float32Array(n); this.rot = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1)); g.setAttribute('aRot', new THREE.BufferAttribute(this.rot, 1));
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: smokeTex }, uScale: { value: 400 }, uColor: { value: new THREE.Color('#fff') } },
      transparent: true, depthWrite: false,
      vertexShader: `attribute float aSize, aAlpha, aRot; varying float vA, vR; uniform float uScale;
        void main(){ vA = aAlpha; vR = aRot; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 uColor; varying float vA, vR;
        void main(){ vec2 c = gl_PointCoord - .5; float s = sin(vR), k = cos(vR); c = mat2(k, -s, s, k) * c;
          vec4 tx = texture2D(map, c + .5); float a = tx.a * vA; if (a < .002) discard; gl_FragColor = vec4(uColor, a); }`,
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 5;
  }
  burst(p0, dir, n) {
    for (let i = 0; i < n; i++) {
      const v = dir.clone().multiplyScalar(rand(2.2, 4.8));
      const perp = V(rand(-1, 1), rand(-1, 1), rand(-1, 1)); perp.addScaledVector(dir, -perp.dot(dir)).normalize().multiplyScalar(rand(0, 1) * v.length() * .26);
      v.add(perp);
      const k = this.cursor; this.cursor = (k + 1) % this.n;
      this.p[k] = { p: p0.clone(), v, age: -rand(0, .28), life: rand(1.8, 3.6), s0: rand(.05, .1), s1: rand(.45, 1), a: rand(.025, .06), r: rand(0, 6), rv: rand(-.7, .7) };
    }
  }
  clear() { this.p.fill(null); }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      const p = this.p[i];
      if (!p) { this.alpha[i] = 0; continue; }
      p.age += dt;
      if (p.age < 0) { this.alpha[i] = 0; this.pos[i * 3 + 1] = -99; continue; }
      const u = p.age / p.life;
      if (u >= 1) { this.p[i] = null; this.alpha[i] = 0; continue; }
      p.v.multiplyScalar(Math.exp(-dt * 2.6)); p.v.y += dt * .12;
      p.p.addScaledVector(p.v, dt); p.p.x += Math.sin(p.age * 1.7 + i) * dt * .05; p.r += p.rv * dt;
      this.pos[i * 3] = p.p.x; this.pos[i * 3 + 1] = p.p.y; this.pos[i * 3 + 2] = p.p.z;
      this.size[i] = p.s0 + (p.s1 - p.s0) * (1 - Math.pow(1 - u, 2));
      this.alpha[i] = p.a * Math.min(1, u / .06) * Math.pow(1 - u, 1.6);
      this.rot[i] = p.r;
    }
    for (const k of ['position', 'aSize', 'aAlpha', 'aRot']) this.geo.attributes[k].needsUpdate = true;
  }
}
const mist = new Mist(PREVIEW ? 360 : 700);
scene.add(mist.points);
scene.add(sparks.points);

// analytic point clouds: the funnel of light above the neck, and the swirl of colour inside
function cloud(n) {
  const g = new THREE.BufferGeometry();
  const c = { n, pos: new Float32Array(n * 3), col: new Float32Array(n * 3), size: new Float32Array(n), alpha: new Float32Array(n), d: [] };
  g.setAttribute('position', new THREE.BufferAttribute(c.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(c.col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(c.size, 1)); g.setAttribute('aAlpha', new THREE.BufferAttribute(c.alpha, 1));
  c.points = new THREE.Points(g, sparks.mat); c.points.frustumCulled = false; scene.add(c.points);
  for (let i = 0; i < n; i++) c.d.push({ u: Math.random(), a: Math.random() * Math.PI * 2, s: .6 + Math.random() * .8, z: .025 + Math.random() * .04, r: Math.sqrt(Math.random()), y: Math.random(), color: new THREE.Color() });
  c.flush = () => { for (const k of ['position', 'color', 'aSize', 'aAlpha']) g.attributes[k].needsUpdate = true; };
  return c;
}
const funnel = cloud(PREVIEW ? 500 : 900), swirl = cloud(PREVIEW ? 260 : 460);
function paintClouds() {
  const cols = current.tiers.flat().map((n) => new THREE.Color(n[2]));
  for (const c of [funnel, swirl]) c.d.forEach((d) => d.color.copy(cols[Math.floor(Math.random() * cols.length)]));
}

const dust = (() => {
  const n = 420, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 16; pos[i * 3 + 1] = Math.random() * 7 - 2; pos[i * 3 + 2] = (Math.random() - .5) * 10 - 2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: .025, map: glowTex, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffe6c8' }));
  scene.add(pts); return pts;
})();

/* ── helpers ──────────────────────────────────────────────────────────── */
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

/* ── the active bottle's cast of ingredients ──────────────────────────── */
const stage = new THREE.Group(); scene.add(stage);
let active = 1, current = PERFUMES[1], items = [], leaving = [], absorbed = 0, clock = 0, fused = false, crimped = false, opened = false, capped = false, sprayed = [];
const bodyBox = { x: .4, y0: -1.2, y1: .2 };
const labelsEl = document.getElementById('labels');

function cast(idx) {
  current = PERFUMES[idx];
  // the previous notes drift away
  for (const it of items) if (!it.done && it.obj.visible) { it.leaveAt = 0; it.leaveFrom = it.obj.position.clone(); it.leaveScale = it.obj.scale.x; leaving.push(it); } else stage.remove(it.obj);
  items = []; absorbed = 0; fused = false; crimped = false; opened = false; capped = false; sprayed = []; mist.clear(); plumeT = -1; plume.material.opacity = 0;
  labelsEl.innerHTML = '';
  paintClouds();
  const r = rigs[idx];
  bodyBox.x = r.w * .3; bodyBox.y0 = FLOOR_Y + BOTTLE_H * .08; bodyBox.y1 = FLOOR_Y + BOTTLE_H * (current.top - .06);
  const total = current.tiers.reduce((s, t) => s + t.length, 0);
  const per = 1;
  const ringR = [2.0, 2.4, 2.1], ringY = [1.3, .3, -.75], dir = [1, -1, 1];
  current.tiers.forEach((notes, tier) => {
    const count = Math.max(1, notes.reduce((s, n) => s + n[1].length, 0));
    let k = 0;
    notes.forEach(([name, makers, color]) => {
      const reps = makers.length;
      for (let c = 0; c < reps; c++, k++) {
        const make = makers[c % makers.length];
        const isPhoto = typeof make === 'string';
        const obj = isPhoto ? makePhoto(make) : make();
        obj.scale.setScalar(.0001); obj.visible = false;
        obj.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
        stage.add(obj);
        const side = Math.random() < .5 ? -1 : 1;
        const it = {
          obj, s: (isPhoto ? PSIZE[make] : SIZE.get(make) || .3) * rand(.9, 1.1), tier, color: new THREE.Color(color),
          th: (k / count) * TAU + rand(-.12, .12) + tier * .7,
          r: ringR[tier] + rand(-.3, .3), y: ringY[tier] + rand(-.25, .25), w: .34 * dir[tier] * rand(.85, 1.15),
          bob: rand(0, 6), bobA: rand(.05, .12), roll: rand(-.5, .5), rollV: rand(-.18, .18),
          spin: V(rand(-.6, .6), rand(-.8, .8), rand(-.5, .5)),
          from: V(side * rand(6, 9), rand(-2.5, 4), rand(-5, 3)),
          tA: T.tier[tier] + (k / count) * .8 + rand(0, .12),
          tV: T.vortex + tier * .3 + rand(0, .6),
          done: false, trail: 0,
        };
        if (c === 0) { const el = document.createElement('div'); el.className = 'lbl'; el.innerHTML = `<i></i><span>${name}</span>`; labelsEl.appendChild(el); it.label = el; }
        items.push(it);
      }
    });
  });
  // interface
  const tiersEl = document.querySelectorAll('.tier');
  current.tiers.forEach((notes, i) => { tiersEl[i].querySelector('p').textContent = notes.map((n) => n[0]).join(' · '); });
  document.getElementById('r-num').textContent = STAGE ? `${current.num} · ${current.family}` : `${current.num} · Extrait de parfum`;
  const priceEl = document.getElementById('r-price');
  if (priceEl) priceEl.textContent = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(current.price);
  document.querySelectorAll('[data-href-slug]').forEach((a) => { a.href = `${a.dataset.hrefSlug}#${current.slug}`; });
  document.getElementById('r-name').innerHTML = `${current.split[0]}<em>${current.split[1]}</em>`;
  document.querySelectorAll('.tabs [data-p]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.p === idx)));
  document.getElementById('pos').textContent = `${String(idx + 1).padStart(2, '0')} / ${String(PERFUMES.length).padStart(2, '0')}`;
  const nx = PERFUMES[(idx + 1) % PERFUMES.length];
  document.getElementById('next-name').textContent = nx.name;
  document.title = `${current.name} · ${STAGE ? 'The Stage' : 'The Fusion'} · FEMINISTA`;
  if (EMBED && parent !== window) parent.postMessage({ type: 'fusion-active', i: idx }, '*');
  document.documentElement.style.setProperty('--accent', current.accent);
  core.color.set(current.liquid);
  for (const rg of rigs) { setU(rg, 'uFill', 0); setU(rg, 'uFlash', 0); }
}

/* ── the turntable ────────────────────────────────────────────────────── */
let phi = -active * TAU / 3, turnFrom = phi, turnTo = phi, turnT = 1;
function go(idx, instant) {
  idx = ((idx % 3) + 3) % 3;
  const target = -idx * TAU / 3;
  // the shortest way round
  let d = target - phi; d = Math.atan2(Math.sin(d), Math.cos(d));
  turnFrom = phi; turnTo = phi + d; turnT = instant ? 1 : 0;
  if (instant) phi = turnTo;
  prevActive = instant ? -1 : active;
  if (STAGE) {
    const u = stageBg.material.uniforms;
    u.uA.value = instant ? idx : u.uB.value; u.uB.value = idx;
    u.mapA.value = u.mapB.value; u.hasA.value = u.hasB.value;
    u.mapB.value = bgPhotos[idx].tex; u.hasB.value = bgPhotos[idx].ok ? 1 : 0;
    stageMix = instant ? 1 : 0;
    nameA.material.map = nameB.material.map; nameA.material.needsUpdate = true;
    if (fontsReady) { nameB.material.map = nameTex(PERFUMES[idx].name); nameB.material.needsUpdate = true; }
  }
  active = idx;
  stageLanded = !!instant;
  clock = instant ? 0 : -TURN * .75;
  cast(idx);
}

/* ── per-frame choreography ───────────────────────────────────────────── */
const tmp = V(), bg = new THREE.Color(), bgTo = new THREE.Color();
function orbitPos(it, t, out) {
  const a = it.th + it.w * t;
  return out.set(Math.cos(a) * it.r, it.y + Math.sin(t * 1.1 + it.bob) * it.bobA, Math.sin(a) * it.r * .8);
}
function pour(it, neck) {
  const n = PREVIEW ? 16 : 26;
  for (let i = 0; i < n; i++) {
    const end = V(rand(-bodyBox.x, bodyBox.x), rand(bodyBox.y0, bodyBox.y1), rand(-.05, .12));
    sparks.emit({ a: V(rand(-.05, .05), neck + rand(.05, .25), .05), b: V(rand(-.1, .1), neck - .4, .1), c: end,
      life: rand(.9, 1.5), delay: rand(0, .45), size: rand(.035, .07), alpha: rand(.6, 1), color: it.color, ease: true, shrink: true });
  }
}
function burstAt(y, n, col, spread = 1) {
  for (let i = 0; i < n; i++) {
    const o = V(rand(-.1, .1), y, rand(-.1, .1));
    const d = V(rand(-1, 1), rand(.1, 1.2), rand(-1, 1)).normalize().multiplyScalar(rand(.4, 1.1) * spread);
    sparks.emit({ a: o, b: o.clone().add(d.clone().multiplyScalar(.6)), c: o.clone().add(d), life: rand(.7, 1.4), size: rand(.025, .06), alpha: rand(.5, 1), color: col, shrink: true, fadeIn: 4 });
  }
}
function fuse() {
  fused = true;
  const col = new THREE.Color(current.liquid), white = new THREE.Color('#ffffff');
  const n = PREVIEW ? 160 : 300;
  for (let i = 0; i < n; i++) {
    const o = V(rand(-bodyBox.x, bodyBox.x), rand(bodyBox.y0, bodyBox.y1), 0);
    const d = V(rand(-1, 1), rand(-.4, 1), rand(-1, 1)).normalize().multiplyScalar(rand(1.4, 3.6));
    sparks.emit({ a: o, b: o.clone().add(d.clone().multiplyScalar(.6)), c: o.clone().add(d), life: rand(1.2, 2.4), size: rand(.03, .08), alpha: rand(.5, 1),
      color: Math.random() < .3 ? white : col, shrink: true, fadeIn: 4 });
  }
}

// the atomised plume: a fine, fast cone of vapour that bursts from the nozzle (a streaked cone texture)
const plumeTex = (() => {
  const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  const streak = Array.from({ length: 90 }, () => [Math.random() * 2 - 1, .3 + Math.random() * .7]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = (y / H) * 2 - 1;              // u: along the jet, v: across
    const half = .035 + u * .9;                          // the cone widens
    const k = v / half; if (Math.abs(k) > 1.2) continue;
    let a = Math.exp(-k * k * 2.2) * Math.pow(1 - u, 1.2) * Math.min(1, u * 30);
    let st = 0; for (const [o, w] of streak) st += w * Math.exp(-Math.pow((k - o) * 26, 2)); // fine radial streaks
    a *= .45 + .55 * Math.min(1, st);
    a *= .75 + .25 * Math.random();                      // droplet grain
    const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.min(255, a * 255);
  }
  g.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(c);
})();
const plume = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: plumeTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
plume.renderOrder = 6; scene.add(plume);
let plumeT = -1; const plumeP0 = V(), plumeDir = V();

function spray(r) {
  r.group.updateMatrixWorld(true);
  const p0 = V(); r.spray.nozzle.getWorldPosition(p0);
  const dir = V(-1, .1, 0).applyQuaternion(r.group.quaternion).normalize();
  const tint = new THREE.Color('#ffffff').lerp(new THREE.Color(current.liquid), .12);
  // 1. the jet: a cone streaked with fine vapour, flashing out over a split second
  const L = 2.3;
  plume.quaternion.copy(r.group.quaternion); plume.rotateZ(Math.PI - .1);
  plume.position.copy(p0).addScaledVector(dir, L / 2);
  plume.scale.set(L, L * .5, 1); plume.material.color.copy(tint);
  plumeT = 0; plumeP0.copy(p0); plumeDir.copy(dir);
  // 2. thousands of atomised droplets: fast out of the nozzle, slowing, spreading in a cone, drifting down a touch
  const n = PREVIEW ? 650 : 1400;
  for (let i = 0; i < n; i++) {
    const dist = L * Math.pow(Math.random(), .7) * rand(.85, 1.2);
    const cone = dist * .32 * Math.sqrt(Math.random()), ang = rand(0, TAU);
    const perp = V(0, Math.cos(ang), Math.sin(ang)).applyQuaternion(r.group.quaternion).multiplyScalar(cone);
    const end = p0.clone().addScaledVector(dir, dist).add(perp); end.y -= dist * dist * .03;
    const mid = p0.clone().addScaledVector(dir, dist * .55).addScaledVector(perp, .4);
    sparks.emit({ a: p0.clone(), b: mid, c: end, life: rand(.5, 1.2), delay: rand(0, .3), size: rand(.005, .012), alpha: rand(.35, .8), color: tint, fadeIn: 10 });
  }
  // 3. the haze that lingers after the jet

}

let idleT = 0;
const tmpC = new THREE.Color(), tmpC2 = new THREE.Color(), tmpL = V();
function frame(t, dt) {
  // turntable
  if (turnT < 1) { turnT = Math.min(1, turnT + dt / TURN); phi = turnFrom + (turnTo - turnFrom) * easeInOut(turnT); }
  const turning = turnT < 1;
  rigs.forEach((r) => {
    const a = r.i * TAU / 3 + phi;
    r.group.position.set(CENTER.x + Math.sin(a) * R, 0, CENTER.z + Math.cos(a) * R);
    r.group.rotation.y = Math.atan2(camera.position.x - r.group.position.x, camera.position.z - r.group.position.z);
    const front = Math.pow((Math.cos(a) + 1) / 2, 3); // 1 at the front, 0 at the back
    const quiet = r.i === active ? 1 : 1 - .55 * smooth(T.reveal - .5, T.reveal + 1, clock) - .25 * smooth(T.tier[0], T.tier[1], clock) * (1 - smooth(T.fuse, T.reveal, clock));
    setU(r, 'uDim', (.16 + .84 * front) * quiet);
    setU(r, 'uTime', t);
    r.front = front;
    if (SOLO) r.group.visible = r.i === active;                    // embedded with &solo: only the chosen perfume
  });
  track.rotation.z = -phi;
  if (STAGE) {
    const ts = turnT * TURN;                                       // seconds since the switch
    const fall = clamp01((ts - .35) / .5);                          // the drop: .35s -> .85s
    const landed = ts - .85;
    rigs.forEach((r) => {
      const on = r.i === active, old = r.i === prevActive && turnT < 1;
      const vis = on ? (ts > .3 ? 1 : 0) : old ? 1 - clamp01(ts / .14) : 0;
      r.group.visible = vis > .005;
      let y = 0, sx = 1, sy = 1;
      if (on) {
        y = 5.2 * (1 - fall * fall);                                // falls, speeding up, like the bull
        if (landed > 0 && landed < .6) {                            // lands: a quick squash and settle
          const w = Math.exp(-landed * 9) * Math.sin(landed * 26);
          sy = 1 - w * .07; sx = 1 + w * .045;
        }
      }
      r.group.position.set(0, y, 0);
      r.group.scale.set(sx, sy, 1);
      r.group.rotation.y = Math.atan2(camera.position.x, camera.position.z);
      r.mirror.visible = LAB;
      setU(r, 'uOpacity', vis); setU(r, 'uDim', 1); r.front = 1;
    });
    const contact = pedestal.children[pedestal.children.length - 1];
    contact.material.opacity = .42 * fall * fall;
    if (landed > 0 && !stageLanded) { stageLanded = true; shakeT = 0; landDust(); }
    stageMix = Math.min(1, stageMix + dt / .9);
    const u = stageBg.material.uniforms; u.uMix.value = 1 - Math.pow(1 - stageMix, 3); u.uZoom.value = 1.04 - .04 * u.uMix.value; u.uTime.value = clockTotal;
    if (bgPhotos[active].ok && !u.hasB.value) { u.mapB.value = bgPhotos[active].tex; u.hasB.value = 1; }
    const photo = u.hasB.value > .5;
    pedestal.children.forEach((m, i) => { m.visible = !photo || i === pedestal.children.length - 1; });
    const e = easeInOut(stageMix);
    nameA.material.opacity = nameA.material.map && !LAB ? (1 - e) * .9 : 0; nameB.material.opacity = nameB.material.map && !LAB ? e * .9 : 0;
    nameA.position.y = .55 + e * .25; nameB.position.y = .55 - (1 - e) * .25;
  }

  const r = rigs[active], bu = r.body.material.uniforms;
  // colour of the room follows the bottle in front
  bgTo.set(current.accent); bg.lerp(bgTo, Math.min(1, dt * 2.5));
  backdrop.material.uniforms.uColor.value.copy(bg); pool.material.color.copy(bg);

  // cap: lifts off and hovers, is set down beside the bottle, then goes back on
  const open = smooth(T.capOpen, T.capOpen + .8, t);
  const rest = easeInOut(clamp01((t - T.capRest) / 1));
  const capBack = clamp01((t - T.capClose) / 1.2);
  const hx = open * .16, hy = r.capBase + open * (.5 + Math.sin(t * 1.4) * .04), hr = -open * (.24 + Math.sin(t * 1.1) * .03);
  const restX = r.w * .5 + r.cap.scale.x * .6 + .15, restY = FLOOR_Y + r.cap.scale.y / 2;
  let cx = THREE.MathUtils.lerp(hx, restX, rest), cy = THREE.MathUtils.lerp(hy, restY, rest) + Math.sin(Math.PI * rest) * .3, cz = .002 + rest * .3, cr = hr * (1 - rest);
  if (capBack > 0) {
    const above = r.capBase + .32;
    if (capBack < .72) { const u = easeInOut(capBack / .72); cx = THREE.MathUtils.lerp(restX, 0, u); cy = THREE.MathUtils.lerp(restY, above, u) + Math.sin(Math.PI * u) * .35; cz = THREE.MathUtils.lerp(.302, .05, u); }
    else { const u = easeIn((capBack - .72) / .28); cx = 0; cy = above + (r.capBase - above) * u; cz = .05 * (1 - u) + .002; }
    cr = 0;
  }
  r.cap.position.set(cx, cy, cz); r.cap.rotation.z = cr;
  const closed = capBack >= 1;
  // the atomiser comes down from above, clicks onto the neck, and sprays twice
  const drop = clamp01((t - T.crimp) / .8), land = 1 - Math.pow(1 - drop, 3);
  const after = t - T.crimp - .8, bounce = after > 0 ? Math.exp(-after * 9) * Math.sin(after * 30) * .015 : 0;
  r.spray.g.visible = t > T.crimp && !closed;
  r.spray.g.position.y = r.neckY - r.W * .03 + (1 - land) * 1.6 + bounce;
  let press = 0;
  for (const st of T.sprays) { const k = (t - st) / .35; if (k >= 0 && k < 1) press = Math.sin(Math.PI * k); }
  r.spray.actuator.position.y = .37 - press * .09;
  if (t > T.crimp + .8 && !crimped) { crimped = true; burstAt(r.neckY + r.W * .25, PREVIEW ? 40 : 70, new THREE.Color('#fff3dc'), .7); }
  T.sprays.forEach((st, i) => { if (t > st && !sprayed[i]) { sprayed[i] = true; spray(r); if (SPRAY && !i && !still && parent !== window) parent.postMessage({ type: 'fusion-sprayed' }, '*'); } });
  if (closed && !capped) { capped = true; burstAt(r.capBase - r.cap.scale.y * .4, PREVIEW ? 30 : 50, new THREE.Color('#fff3dc'), .5); }
  rigs.forEach((o) => { if (o !== r) { o.cap.position.set(0, o.capBase, .002); o.cap.rotation.z = 0; o.spray.g.visible = false; o.shaft.material.opacity = 0; } });
  r.shaft.material.opacity = open * (1 - smooth(T.fuse - .3, T.crimp, t)) * (.22 + Math.sin(t * 3) * .03);
  if (t > T.capOpen + .3 && !opened) { opened = true; burstAt(r.neckY + .05, PREVIEW ? 40 : 70, new THREE.Color('#fff3dc'), .9); }

  // liquid light
  const fill = absorbed / Math.max(1, items.length);
  let f = bu.uFill.value + (fill - bu.uFill.value) * Math.min(1, dt * 3);
  if (t > T.fuse) f = 1;
  if (t < 0) f = 0;
  setU(r, 'uFill', f);
  const flash = t > T.fuse ? Math.exp(-(t - T.fuse) * 2.6) : 0;
  const glow = .25 + f * .5 + smooth(T.fuse, T.reveal + .5, t) * .2;
  setU(r, 'uGlow', glow);
  setU(r, 'uFlash', flash);
  rigs.forEach((o) => { if (o !== r) { setU(o, 'uGlow', .2); setU(o, 'uFill', 0); setU(o, 'uFlash', 0); } });
  backdrop.material.uniforms.uGlow.value = .6 + glow * .7 + flash * 2.2;
  backdrop.material.uniforms.uTime.value = clockTotal;
  pool.material.opacity = (.12 + glow * .25 + flash * .5) * r.front;
  core.intensity = (f * 6 + flash * 30) * r.front;
  bloom.strength = .42 + flash * 1.3 + f * .12;

  // shockwave
  if (t > T.fuse && t < T.fuse + 2) {
    const u = (t - T.fuse) / 2;
    ring.scale.setScalar(.3 + easeOut(u) * 2.3); ring.position.set(0, FLOOR_Y + BOTTLE_H * .35, 0);
    ring.material.opacity = Math.pow(1 - u, 3) * .55; ring.material.color.set(current.liquid);
  } else ring.material.opacity = 0;
  if (t > T.fuse && !fused) fuse();

  // ingredients
  for (const it of items) {
    const o = it.obj;
    if (it.done) continue;
    if (t < it.tA) { o.visible = false; continue; }
    o.visible = true;
    if (o.userData.photo) {
      o.quaternion.copy(camera.quaternion); o.rotateZ(it.roll + t * it.rollV);
      o.userData.mat.color.setScalar(.7 + .3 * clamp01((o.position.z + 2) / 3.5));
    } else { o.rotation.x += it.spin.x * dt; o.rotation.y += it.spin.y * dt; o.rotation.z += it.spin.z * dt; }
    const a = clamp01((t - it.tA) / T.fly);
    orbitPos(it, t, tmp);
    if (t < it.tV) {
      const e = easeOut(a);
      o.position.lerpVectors(it.from, tmp, e);
      o.position.y += Math.sin(Math.PI * a) * .6;
      o.scale.setScalar(it.s * Math.max(.0001, Math.pow(e, .6)));
    } else {
      // spiral up and into the open neck
      const v = clamp01((t - it.tV) / T.spiral), e = easeIn(v);
      const ang = it.th + it.w * t + e * 5 * Math.sign(it.w);
      const rad = it.r * (1 - e);
      o.position.set(Math.cos(ang) * rad, THREE.MathUtils.lerp(it.y, r.neckY + .12, Math.pow(v, 1.5)), Math.sin(ang) * rad * .8);
      o.scale.setScalar(it.s * (1 - smooth(.45, 1, v)) + .0001);
      it.trail += dt;
      if (v > .15 && it.trail > (PREVIEW ? .07 : .04)) {
        it.trail = 0;
        const p0 = o.position.clone();
        sparks.emit({ a: p0, b: p0.clone().add(V(rand(-.05, .05), .05, rand(-.05, .05))), c: p0.clone().add(V(rand(-.15, .15), rand(-.1, .2), rand(-.15, .15))),
          life: rand(.5, .9), size: rand(.025, .05), alpha: .8, color: it.color, shrink: true });
      }
      if (v >= 1) { it.done = true; o.visible = false; absorbed++; pour(it, r.neckY); }
    }
  }
  // name labels
  const pxPerUnit = innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  let shown = 0;
  for (const it of items) {
    if (!it.label) continue;
    const sx = it.obj.position.x, sideways = Math.abs(sx) > bodyBox.x * 1.6 + .25;
    const show = !it.done && !turning && sideways && it.obj.position.z > -.35 && t > it.tA + .4 && t < Math.min(it.tA + 2.4, it.tV - .2) && shown < 5;
    if (show) shown++;
    it.label.classList.toggle('on', show);
    if (show) {
      tmpL.copy(it.obj.position).project(camera);
      const d = camera.position.distanceTo(it.obj.position);
      const left = sx < 0, off = it.s * .42 * pxPerUnit / d + 4;
      const x = (tmpL.x * .5 + .5) * innerWidth + (left ? -off : off), y = (-tmpL.y * .5 + .5) * innerHeight;
      it.label.classList.toggle('left', left);
      it.label.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)${left ? ' translateX(-100%)' : ''}`;
    }
  }
  // notes from the last bottle drift off as the table turns
  for (let k = leaving.length - 1; k >= 0; k--) {
    const it = leaving[k]; it.leaveAt += dt;
    const u = clamp01(it.leaveAt / .9);
    it.obj.position.copy(it.leaveFrom).multiplyScalar(1 + easeIn(u) * 2.2);
    it.obj.position.y += u * .8;
    it.obj.scale.setScalar(it.leaveScale * (1 - u) + .0001);
    if (u >= 1) { stage.remove(it.obj); leaving.splice(k, 1); }
  }
  // once fused, the bottle keeps breathing light
  if (t > T.reveal) {
    idleT += dt;
    if (idleT > (PREVIEW ? .14 : .08)) {
      idleT = 0;
      const a = rand(0, TAU), rr = rand(.5, 1.6), p0 = V(Math.cos(a) * rr, FLOOR_Y + rand(0, .3), Math.sin(a) * rr * .6);
      sparks.emit({ a: p0, b: p0.clone().add(V(0, rand(.8, 1.4), 0)), c: p0.clone().add(V(rand(-.3, .3), rand(1.6, 2.8), rand(-.2, .2))),
        life: rand(2.4, 3.6), size: rand(.02, .045), alpha: rand(.35, .7), color: new THREE.Color(current.liquid), shrink: true, fadeIn: 3 });
    }
  }
  // the funnel of light above the neck
  const fa = smooth(T.vortex - .5, T.vortex + .8, t) * (1 - smooth(T.fuse - .6, T.fuse + .1, t));
  for (let i = 0; i < funnel.n; i++) {
    const d = funnel.d[i];
    const u = (((d.u - t * .3 * d.s) % 1) + 1) % 1;
    const rad = .04 + 1.05 * Math.pow(u, 1.3), ang = d.a + t * (1.2 + (1 - u) * 4) * d.s;
    funnel.pos[i * 3] = Math.cos(ang) * rad; funnel.pos[i * 3 + 1] = r.neckY + .04 + u * 1.15; funnel.pos[i * 3 + 2] = Math.sin(ang) * rad * .8;
    funnel.col[i * 3] = d.color.r; funnel.col[i * 3 + 1] = d.color.g; funnel.col[i * 3 + 2] = d.color.b;
    funnel.size[i] = d.z * (.6 + .8 * u);
    funnel.alpha[i] = fa * .55 * smooth(0, .08, u) * (1 - smooth(.75, 1, u));
  }
  funnel.flush();
  // inside the glass every note keeps its colour and swirls, until they become one
  const conv = smooth(T.fuse - 1.4, T.fuse, t), gone = smooth(T.fuse, T.fuse + .9, t);
  tmpC.set(current.liquid);
  const topY = bodyBox.y0 + (bodyBox.y1 - bodyBox.y0) * Math.max(.05, f);
  for (let i = 0; i < swirl.n; i++) {
    const d = swirl.d[i];
    const on = i / swirl.n < f * 1.05 ? 1 : 0;
    const ang = d.a + t * (.8 + d.s * 1.4) * (1 + conv * 2);
    const rr = d.r * (1 - conv * .55);
    swirl.pos[i * 3] = Math.sin(ang) * bodyBox.x * rr;
    swirl.pos[i * 3 + 1] = bodyBox.y0 + (topY - bodyBox.y0) * (d.y * (1 - conv * .3) + conv * .15) + Math.sin(t * 1.3 + d.a) * .03;
    swirl.pos[i * 3 + 2] = Math.cos(ang) * .08 + .08;
    tmpC2.copy(d.color).lerp(tmpC, conv);
    swirl.col[i * 3] = tmpC2.r; swirl.col[i * 3 + 1] = tmpC2.g; swirl.col[i * 3 + 2] = tmpC2.b;
    swirl.size[i] = d.z * 1.3 * (1 + conv * .6);
    swirl.alpha[i] = on * .5 * (1 - gone) * r.front;
  }
  swirl.flush();
  sparks.update(dt);
  mist.update(dt);
  if (plumeT >= 0) {
    plumeT += dt;
    const k = plumeT;
    plume.material.opacity = 0;
    plume.scale.x = 2.3 * (.55 + .45 * Math.min(1, k / .25)); plume.scale.y = plume.scale.x * (.5 + Math.min(.3, k * .4));
    plume.position.copy(plumeP0).addScaledVector(plumeDir, plume.scale.x / 2);
    if (k > 2) { plumeT = -1; plume.material.opacity = 0; }
  }
  dust.rotation.y = clockTotal * .01; dust.position.y = Math.sin(clockTotal * .2) * .1;

  // camera: slow sway; leans in for the pour, eases back for the reveal and the turn
  const yaw = Math.sin(clockTotal * .13) * .16;
  const lean = SPRAY ? 0 : smooth(T.capOpen, T.fuse, t) - smooth(T.reveal, T.done + 1, t) * .7;
  const back = turning ? Math.sin(Math.PI * turnT) * .12 : 0;
  const dist = baseDist * (1 - lean * .12 + back);
  camera.position.set(Math.sin(yaw) * dist, .35 + lean * .12 + back * 2, Math.cos(yaw) * dist);
  if (STAGE && shakeT < .4) { shakeT += dt; const q = Math.exp(-shakeT * 12) * .05; camera.position.y += Math.sin(shakeT * 70) * q; }
  camera.lookAt(0, .05 + lean * .08, 0);
  if (STAGE && stageBg.material.uniforms.hasB.value > .5) {
    // nudge the view so the bottle's foot lands on the stone disc in the photograph
    const W = innerWidth, H = innerHeight, sa = W / H, ia = stageBg.material.uniforms.uImg.value;
    let dx = DISC.x, dy = 1 - DISC.y;                              // image uv (y up)
    if (sa > ia) dy = (dy - .5) / (ia / sa) + .5; else dx = (dx - .5) / (sa / ia) + .5;
    camera.clearViewOffset(); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const f = V(0, FLOOR_Y + .02, 0).project(camera);
    camera.setViewOffset(W, H, (f.x - (dx * 2 - 1)) * W / 2, ((dy * 2 - 1) - f.y) * H / 2, W, H);
    camera.updateProjectionMatrix();
  }

  ui(t, turning);
}

/* ── interface timing ─────────────────────────────────────────────────── */
const notesEl = document.getElementById('notes'), tierEls = [...document.querySelectorAll('.tier')];
const capEl = document.getElementById('caption'), capText = document.getElementById('caption-text');
const revEl = document.getElementById('reveal'), barEl = document.getElementById('bar'), nextEl = document.getElementById('next-hint');
let capMode = '';
function ui(t, turning) {
  notesEl.classList.toggle('show', t > T.tier[0] - .3);
  tierEls.forEach((el, i) => {
    el.classList.toggle('in', t > T.tier[i]);
    const nx = i < 2 ? T.tier[i + 1] : T.capOpen;
    el.classList.toggle('now', t > T.tier[i] && t < nx + .4);
  });
  notesEl.classList.toggle('fade', t > T.vortex + .6 || t < 0);
  const mode = t > T.capOpen && t < T.vortex + .3 ? 'open' : t >= T.vortex + .3 && t < T.fuse + .2 ? 'pour' : t > T.sprays[0] - .2 && t < T.capClose + 1.6 ? 'wear' : '';
  if (mode !== capMode) {
    capMode = mode;
    if (mode === 'open') capText.innerHTML = 'The flacon <em>opens</em>';
    if (mode === 'pour') capText.innerHTML = 'Every note, <em>becoming one</em>';
    if (mode === 'wear') capText.innerHTML = 'Ready to <em>wear</em>';
  }
  capEl.classList.toggle('on', !!mode);
  revEl.classList.toggle('on', STAGE || t > T.reveal);
  nextEl.classList.toggle('on', t > T.done && !PREVIEW);
  barEl.style.width = `${clamp01(t / T.done) * 100}%`;
  document.body.classList.toggle('turning', turning);
}

/* ── sizing ───────────────────────────────────────────────────────────── */
let baseDist = 8.4;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h;
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  baseDist = Math.max(2.55 / halfH, 2.9 / (halfH * camera.aspect));
  if (SPRAY) baseDist = Math.max(BOTTLE_H / (2 * halfH * .56), 2.75 / (halfH * camera.aspect));
  if (STAGE) { baseDist = Math.max(BOTTLE_H / (2 * halfH * (w < 760 ? .36 : LAB ? .56 : .5)), 3.1 / (halfH * camera.aspect)); stageBg.material.uniforms.uScreen.value = w / h; }
  if (w < 760 && !STAGE) camera.setViewOffset(w, h, 0, h * .1, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  sparks.mat.uniforms.uScale.value = h * renderer.getPixelRatio() * .9;
  mist.mat.uniforms.uScale.value = h * renderer.getPixelRatio() * .9;
}
addEventListener('resize', resize);
resize();

/* ── controls ─────────────────────────────────────────────────────────── */
let clockTotal = 0, last = performance.now(), paused = false, still = false;
const next = () => go(active + 1), prev = () => go(active - 1);
document.querySelectorAll('.tabs [data-p]').forEach((b) => b.addEventListener('click', () => { if (+b.dataset.p !== active) go(+b.dataset.p); }));
document.getElementById('replay').addEventListener('click', () => { clock = 0; cast(active); });
document.getElementById('next').addEventListener('click', next);
document.getElementById('prev').addEventListener('click', prev);
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); });
let sx = null;
canvas.addEventListener('pointerdown', (e) => { sx = e.clientX; });
addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 60) (dx < 0 ? next : prev)(); });
document.addEventListener('visibilitychange', () => { paused = document.hidden; last = performance.now(); });

go(qs.has('p') ? +qs.get('p') : 1, true);
// inside another page: wait until it says play, restart from the beginning the first time
let hold = EMBED && parent !== window && !SPRAY, started = !hold;
if (SPRAY) still = true;                                          // rests, lit and closed, until the page says spray
// run the whole short sequence once, unseen, so the resting bottle is already in its warm light
function warmUp() { while (clock < T.done) { const dt = 1 / 30; clock += dt; clockTotal += dt; frame(clock, dt); } sparks.clear(); sparks.update(0); mist.clear(); mist.update(0); }
function sprays_reset() { sprayed = []; opened = false; crimped = false; capped = false; }
addEventListener('message', (e) => {
  const m = e.data || {};
  if (m.type === 'fusion-play') { hold = false; last = performance.now(); if (!started) { started = true; clock = 0; cast(active); } }
  if (m.type === 'fusion-pause') hold = true;
  if (m.type === 'fusion-spray' && SPRAY) { still = false; hold = false; clock = 1.15; sprays_reset(); last = performance.now(); }
  if (m.type === 'fusion-go' && m.i !== active) { started = true; go(m.i); }
});
// tell the page around us once every picture is in and a frame has been drawn, so it never shows an empty stage
if (SPRAY && !qs.has('t')) Promise.all(loads).then(warmUp);
if (EMBED && parent !== window) Promise.all(loads).then(() => requestAnimationFrame(() => requestAnimationFrame(() => parent.postMessage({ type: 'fusion-ready' }, '*'))));
if (STAGE && !qs.has('t')) { turnT = 0; prevActive = -1; stageLanded = false; clock = -TURN * .75; }
// ?t=8.5 jumps to that moment; add &still to freeze it
if (qs.has('t')) {
  paused = true;
  Promise.all(loads).then(() => {
    const target = +qs.get('t');
    while (clock < target) { const dt = 1 / 30; clock += dt; clockTotal += dt; frame(clock, dt); }
    still = qs.has('still'); paused = false; last = performance.now();
  });
}
function loop(now) {
  requestAnimationFrame(loop);
  if (paused || hold) return;
  if (still) { frame(clock, 0); window.__fusion = { t: clock, T, active, turning: false }; composer.render(); return; }
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  clock += dt; clockTotal += dt;
  if ((PREVIEW || STAGE) && clock > (STAGE ? T.done + (LAB ? 3.2 : 2.4) : T.previewNext)) next();
  window.__fusion = { t: clock, T, active, turning: turnT < 1 };
  frame(clock, dt);
  composer.render();
  if (SPRAY && clock > T.done && !still) { still = true; if (parent !== window) parent.postMessage({ type: 'fusion-done' }, '*'); }
}
requestAnimationFrame(loop);
