/* FEMINISTA — 3D ingredients, modelled in code.
   Each maker returns a fresh Object3D about 1 unit across; geometry and
   materials are built once and shared between copies. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
let seed = 1234567;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// smooth pseudo-noise, deterministic in space so sphere seams stay closed
const nz = (x, y, z) =>
  Math.sin(x * 1.9 + Math.sin(y * 2.7)) * Math.sin(y * 2.3 + Math.sin(z * 1.7)) * Math.sin(z * 2.1 + Math.sin(x * 3.1));

function shape(geo, fn) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  return geo;
}
const mat = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: .5, envMapIntensity: .9, ...o });

// build once, clone after
const protos = new Map();
const proto = (key, build) => () => {
  if (!protos.has(key)) protos.set(key, build());
  return protos.get(key).clone(true);
};
const wrap = (...objs) => { const g = new THREE.Group(); objs.forEach((o) => g.add(o)); return g; };

/* ── textures ─────────────────────────────────────────────────────────── */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
function citrusTex(pulp, rind, pith = '#fbf3d9') {
  return canvasTex(512, 512, (g) => {
    const R = 256;
    g.fillStyle = rind; g.beginPath(); g.arc(R, R, R, 0, TAU); g.fill();
    g.fillStyle = pith; g.beginPath(); g.arc(R, R, R * .9, 0, TAU); g.fill();
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU + .035, a1 = (i + 1) / n * TAU - .035, am = (a0 + a1) / 2;
      const grd = g.createRadialGradient(R, R, R * .1, R, R, R * .84);
      grd.addColorStop(0, pith); grd.addColorStop(.18, pulp); grd.addColorStop(1, pulp);
      g.fillStyle = grd; g.beginPath(); g.moveTo(R + Math.cos(am) * R * .09, R + Math.sin(am) * R * .09);
      g.arc(R, R, R * .84, a0, a1); g.closePath(); g.fill();
      for (let k = 0; k < 90; k++) {
        const a = a0 + rnd() * (a1 - a0), r = R * (.16 + rnd() * .66);
        g.save(); g.translate(R + Math.cos(a) * r, R + Math.sin(a) * r); g.rotate(a);
        g.fillStyle = `rgba(255,255,255,${.06 + rnd() * .2})`;
        g.beginPath(); g.ellipse(0, 0, 9 + rnd() * 10, 2 + rnd() * 2.5, 0, 0, TAU); g.fill(); g.restore();
      }
    }
    g.fillStyle = pith; g.beginPath(); g.arc(R, R, R * .06, 0, TAU); g.fill();
  });
}
function woodTex(a, b) {
  return canvasTex(128, 512, (g, w, h) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * w, wd = .6 + rnd() * 2.6;
      g.strokeStyle = b; g.globalAlpha = .12 + rnd() * .35; g.lineWidth = wd;
      g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * .02 + i) * 3, y);
      g.stroke();
    }
    g.globalAlpha = 1;
  }, true);
}

/* ── seeds, beans, nuts ───────────────────────────────────────────────── */
export const coffeeBean = proto('coffee', () => {
  const geo = shape(new THREE.SphereGeometry(.5, 40, 28), (v) => {
    v.set(v.x * 1, v.y * .72, v.z * .5);
    if (v.z > 0) v.z -= .12 * Math.exp(-(v.x * v.x) / .0018) * Math.min(1, v.z / .12 + .3);
    v.z += .006 * nz(v.x * 30, v.y * 30, v.z * 30);
  });
  geo.rotateZ(Math.PI / 2);
  return new THREE.Mesh(geo, mat('#3b2213', { roughness: .36, clearcoat: .55, clearcoatRoughness: .35 }));
});

export const almond = proto('almond', () => {
  const geo = shape(new THREE.SphereGeometry(.5, 40, 30), (v) => {
    const t = v.y / .5;
    v.set(v.x * .62, v.y, v.z * .34);
    if (t > 0) { const k = 1 - .62 * Math.pow(t, 1.4); v.x *= k; v.z *= .4 + .6 * k; }
    const n = .014 * nz(v.x * 26, v.y * 40, v.z * 26);
    v.x *= 1 + n; v.z *= 1 + n;
  });
  return new THREE.Mesh(geo, mat('#a8693a', { roughness: .78, sheen: .4, sheenColor: '#e0b080' }));
});

export const tonkaBean = proto('tonka', () => {
  const geo = shape(new THREE.SphereGeometry(.5, 40, 30), (v) => {
    v.set(v.x * .34, v.y, v.z * .27);
    const n = 1 + .09 * nz(v.x * 34, v.y * 22, v.z * 34);
    v.x *= n; v.z *= n;
  });
  return new THREE.Mesh(geo, mat('#2a1810', { roughness: .5, clearcoat: .4, clearcoatRoughness: .5 }));
});

export const cacaoBean = proto('cacao', () => {
  const geo = shape(new THREE.SphereGeometry(.5, 36, 26), (v) => {
    v.set(v.x * .56, v.y * .82, v.z * .42);
    const n = 1 + .05 * nz(v.x * 20, v.y * 20, v.z * 20); v.multiplyScalar(n);
  });
  return new THREE.Mesh(geo, mat('#5d2e1b', { roughness: .62, sheen: .3, sheenColor: '#a0603a' }));
});

export const chocolate = proto('chocolate', () => {
  const g = new THREE.Group();
  const m = mat('#3a1c0f', { roughness: .24, clearcoat: .9, clearcoatRoughness: .15 });
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const b = new THREE.Mesh(new RoundedBoxGeometry(.44, .44, .18, 3, .05), m);
    b.position.set((i - .5) * .48, (j - .5) * .48, 0); g.add(b);
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(.96, .96, .08), m); base.position.z = -.1; g.add(base);
  return g;
});

export const cardamom = proto('cardamom', () => {
  const geo = shape(new THREE.SphereGeometry(.5, 36, 28), (v) => {
    const t = Math.abs(v.y / .5), a = Math.atan2(v.z, v.x);
    const k = (1 + .08 * Math.cos(a * 3)) * (1 - .25 * Math.pow(t, 3));
    v.set(v.x * .5 * k, v.y, v.z * .5 * k);
  });
  return new THREE.Mesh(geo, mat('#94a85d', { roughness: .7, sheen: .5, sheenColor: '#d8e6a0' }));
});

export const praline = proto('praline', () => {
  const geo = shape(new THREE.IcosahedronGeometry(.45, 3), (v) => {
    v.multiplyScalar(1 + .16 * nz(v.x * 5, v.y * 5, v.z * 5) + .05 * nz(v.x * 16, v.y * 16, v.z * 16));
  });
  const nut = new THREE.Mesh(geo, mat('#b5702f', { roughness: .22, clearcoat: 1, clearcoatRoughness: .08 }));
  const chips = new THREE.Group();
  const cm = mat('#e0b07a', { roughness: .7 });
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(.07 + rnd() * .05, 0), cm);
    const d = new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).normalize().multiplyScalar(.44);
    c.position.copy(d); chips.add(c);
  }
  return wrap(nut, chips);
});

/* ── spices & roots ───────────────────────────────────────────────────── */
export const cinnamon = proto('cinnamon', () => {
  const m = mat('#7c3c1a', { roughness: .88, side: THREE.DoubleSide, sheen: .3, sheenColor: '#c47a46' });
  const bark = (r, len) => shape(new THREE.CylinderGeometry(r, r, len, 30, 12, true, 0, TAU * .86), (v) => {
    const k = 1 + .05 * nz(v.x * 30, v.y * 9, v.z * 30); v.x *= k; v.z *= k;
  });
  const a = new THREE.Mesh(bark(.14, 1), m);
  const b = new THREE.Mesh(bark(.09, 1), m); b.rotation.y = 2.4;
  const g = wrap(a, b); g.rotation.z = Math.PI / 2;
  return g;
});

export const ginger = proto('ginger', () => {
  const parts = [[0, 0, 0, .3, .2, .2], [.28, .1, 0, .16, .14, .14], [-.26, .08, .03, .17, .13, .13], [.05, .2, .02, .13, .12, .12], [.42, .2, 0, .1, .09, .09]];
  const geos = parts.map(([x, y, z, sx, sy, sz]) => {
    const g = new THREE.SphereGeometry(1, 24, 18); g.scale(sx, sy, sz); g.translate(x, y, z); return g;
  });
  const geo = shape(mergeGeometries(geos), (v) => v.multiplyScalar(1 + .05 * nz(v.x * 24, v.y * 24, v.z * 24)));
  return new THREE.Mesh(geo, mat('#d1a86a', { roughness: .82, sheen: .4, sheenColor: '#f0d4a0' }));
});

export const vanillaPod = proto('vanilla', () => {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.5, -.05, 0), new THREE.Vector3(-.2, .05, .02), new THREE.Vector3(.15, .02, -.02), new THREE.Vector3(.5, .1, 0)]);
  const geo = shape(new THREE.TubeGeometry(curve, 80, .045, 12), (v) => {
    const t = Math.min(1, (.5 - Math.abs(v.x)) / .06);
    const c = curve.getPoint(Math.min(1, Math.max(0, v.x + .5))); // pull the ends to a point
    v.y = c.y + (v.y - c.y) * t; v.z = c.z + (v.z - c.z) * t;
    v.y += .004 * nz(v.x * 60, v.y * 60, v.z * 60);
  });
  return new THREE.Mesh(geo, mat('#22140b', { roughness: .4, clearcoat: .6, clearcoatRoughness: .3 }));
});

/* ── citrus ───────────────────────────────────────────────────────────── */
const slice = (key, pulp, rind) => proto(key, () => {
  const top = mat('#d8d0c4', { map: citrusTex(pulp, rind), roughness: .38, clearcoat: .45, clearcoatRoughness: .3, transmission: .25, thickness: .1 });
  const side = mat(rind, { roughness: .55 });
  return new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .09, 64), [side, top, top]);
});
export const lemonSlice = slice('lemon', '#f6d63c', '#f1c72a');
export const bergamotSlice = slice('bergamot', '#e8e070', '#9fbf3e');
export const orangeSlice = slice('orange', '#f59a2e', '#ee8a1a');

/* ── flowers & leaves ─────────────────────────────────────────────────── */
function petalGeo(len, wid, cup, curl) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(wid, len * .22, wid * .95, len * .78, 0, len);
  s.bezierCurveTo(-wid * .95, len * .78, -wid, len * .22, 0, 0);
  return shape(new THREE.ShapeGeometry(s, 14), (v) => {
    const t = v.y / len;
    v.z = cup * t * t + curl * (v.x / wid) * (v.x / wid) * t;
  });
}
function flower({ layers, color, center = '#f2d36a', emissive = '#000000', glow = 0 }) {
  const g = new THREE.Group();
  layers.forEach((L, li) => {
    const geo = petalGeo(L.len, L.wid, L.cup, L.curl ?? .06);
    const m = mat(L.color || color, { roughness: .55, side: THREE.DoubleSide, sheen: 1, sheenColor: '#ffffff', sheenRoughness: .5, emissive, emissiveIntensity: glow, transmission: L.trans ?? .1, thickness: .05 });
    for (let i = 0; i < L.n; i++) {
      const pivot = new THREE.Object3D();
      pivot.rotation.z = (i / L.n) * TAU + (L.offset || 0) + li * .5;
      const p = new THREE.Mesh(geo, m);
      p.rotation.x = -(L.open);
      p.position.z = li * .015;
      pivot.add(p); g.add(pivot);
    }
  });
  const c = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 12), mat(center, { roughness: .6, emissive: center, emissiveIntensity: .15 }));
  c.position.z = .06; g.add(c);
  return g;
}
export const jasmine = proto('jasmine', () => flower({ color: '#fbf8f0', center: '#f3e3a3', emissive: '#fff6e8', glow: .12,
  layers: [{ n: 5, len: .48, wid: .17, cup: -.05, curl: .05, open: 1.25 }] }));
export const tuberose = proto('tuberose', () => flower({ color: '#fbf3ee', center: '#efe0c0', emissive: '#fff0ea', glow: .1,
  layers: [{ n: 6, len: .46, wid: .13, cup: .06, curl: .08, open: 1.05 }, { n: 6, len: .3, wid: .11, cup: .1, open: .7, offset: .5 }] }));
export const orangeBlossom = proto('orangeBlossom', () => {
  const f = flower({ color: '#fffdf6', center: '#f7d24a', emissive: '#fffaf0', glow: .12,
    layers: [{ n: 5, len: .44, wid: .17, cup: .12, curl: .1, open: 1.0 }] });
  const sm = mat('#f4c840', { roughness: .5, emissive: '#f4c840', emissiveIntensity: .25 });
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .2, 5), sm);
    const a = i / 12 * TAU; s.position.set(Math.cos(a) * .04, Math.sin(a) * .04, .12);
    s.rotation.set(Math.PI / 2 + Math.sin(a) * .3, 0, Math.cos(a) * .3);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), sm); tip.position.y = .1; s.add(tip);
    f.add(s);
  }
  return f;
});
export const rose = proto('rose', () => flower({ color: '#c41e52', center: '#8a0f33',
  layers: [
    { n: 6, len: .5, wid: .3, cup: .22, curl: .14, open: 1.15, trans: .15 },
    { n: 5, len: .4, wid: .26, cup: .3, curl: .16, open: .55, color: '#b3184a' },
    { n: 4, len: .3, wid: .22, cup: .32, curl: .18, open: .18, color: '#a3133f' },
  ] }));
export const iris = proto('iris', () => {
  const f = flower({ color: '#7b55c4', center: '#f3c53c',
    layers: [{ n: 3, len: .56, wid: .22, cup: -.16, curl: .12, open: 1.7 }, { n: 3, len: .44, wid: .14, cup: .14, curl: .1, open: .45, offset: Math.PI / 3, color: '#9a78e0' }] });
  return f;
});
export const leaf = proto('leaf', () => {
  const s = new THREE.Shape(); const L = 1, W = .26;
  s.moveTo(0, -L / 2); s.bezierCurveTo(W, -L * .3, W, L * .2, 0, L / 2); s.bezierCurveTo(-W, L * .2, -W, -L * .3, 0, -L / 2);
  const geo = shape(new THREE.ShapeGeometry(s, 16), (v) => { v.z = -Math.abs(v.x) * .35 + .12 * Math.cos(v.y * 2.4); });
  const m = mat('#3c5a2a', { roughness: .55, side: THREE.DoubleSide, sheen: .6, sheenColor: '#9fc48a' });
  const rib = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, L * .95, 5), mat('#5a7a3c', { roughness: .6 }));
  rib.position.z = .1;
  return wrap(new THREE.Mesh(geo, m), rib);
});

/* ── woods, resins, musks ─────────────────────────────────────────────── */
const wood = (key, a, b) => proto(key, () => {
  const t = woodTex(a, b);
  return new THREE.Mesh(new RoundedBoxGeometry(.18, 1, .18, 2, .03), mat('#ffffff', { map: t, roughness: .8 }));
});
export const sandalwood = wood('sandal', '#c79e72', '#8a6040');
export const cedar = wood('cedar', '#a8623a', '#5e2e16');
export const cashmereWood = wood('cashmere', '#8f7058', '#4a3426');

const resin = (key, color, att, trans, detail) => proto(key, () => {
  const geo = shape(new THREE.IcosahedronGeometry(.45, detail), (v) => {
    v.multiplyScalar(1 + .14 * nz(v.x * 4, v.y * 4, v.z * 4));
  });
  return new THREE.Mesh(geo, mat(color, {
    roughness: .1, transmission: trans, thickness: .7, ior: 1.54, attenuationColor: att, attenuationDistance: .5,
    emissive: att, emissiveIntensity: .12, flatShading: detail === 0, clearcoat: 1,
  }));
});
export const amber = resin('amber', '#f2a33a', '#c95e00', 1, 0);
export const benzoin = resin('benzoin', '#c56a2a', '#7a2c08', .65, 1);

export const musk = proto('musk', () => {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color: '#ffe6ee', transparent: true, opacity: .09, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(.08 + rnd() * .16, 20, 14), m);
    s.position.set((rnd() - .5) * .6, (rnd() - .5) * .4, (rnd() - .5) * .4);
    g.add(s);
  }
  return g;
});

/* ── fruits & sweets ──────────────────────────────────────────────────── */
const berry = (key, color, drupe) => proto(key, () => {
  const geos = [];
  const N = 46;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 1.7; // upper ~85% of a sphere
    const r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996;
    const g = new THREE.SphereGeometry(drupe, 12, 9);
    g.translate(Math.cos(a) * r * .36, y * .42, Math.sin(a) * r * .36);
    geos.push(g);
  }
  const core = new THREE.SphereGeometry(.33, 16, 12); core.scale(1, 1.2, 1); geos.push(core);
  return new THREE.Mesh(mergeGeometries(geos), mat(color, { roughness: .26, clearcoat: .8, clearcoatRoughness: .2, transmission: .12, thickness: .2, sheen: .4 }));
});
export const raspberry = berry('raspberry', '#c8143c', .1);
export const blackberry = berry('blackberry', '#2b0d2f', .1);

export const cherry = proto('cherry', () => {
  const geo = shape(new THREE.SphereGeometry(.4, 40, 30), (v) => {
    v.y *= .9; const t = v.y / .36;
    if (t > .55) v.y -= (t - .55) * .12; // dimple
  });
  const body = new THREE.Mesh(geo, mat('#9e0c22', { roughness: .12, clearcoat: 1, clearcoatRoughness: .05 }));
  const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, .3, 0), new THREE.Vector3(.05, .6, 0), new THREE.Vector3(.22, .78, 0)), 16, .014, 6), mat('#5b6b2a', { roughness: .6 }));
  return wrap(body, stem);
});

export const apple = proto('apple', () => {
  const pts = [[0, -.42], [.12, -.44], [.28, -.4], [.42, -.26], [.5, -.06], [.5, .12], [.44, .28], [.32, .38], [.16, .38], [.05, .3], [0, .27]].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(pts, 64);
  const col = []; const c1 = new THREE.Color('#b0102a'), c2 = new THREE.Color('#e0a030'), tmp = new THREE.Color();
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = THREE.MathUtils.clamp(.12 + .25 * nz(x * 6, y * 9, z * 6) + .15 * Math.sin(Math.atan2(z, x) * 14) * .3 - y * .2, 0, .6);
    tmp.copy(c1).lerp(c2, k); col.push(tmp.r, tmp.g, tmp.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const body = new THREE.Mesh(geo, mat('#ffffff', { vertexColors: true, roughness: .28, clearcoat: .8, clearcoatRoughness: .2 }));
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.015, .02, .2, 6), mat('#4a3020', { roughness: .8 }));
  stem.position.y = .36; stem.rotation.z = .2;
  const lf = leaf(); lf.scale.setScalar(.28); lf.position.set(.1, .42, 0); lf.rotation.set(.3, 0, -1);
  return wrap(body, stem, lf);
});

export const candied = (color, key) => proto('candied' + key, () => new THREE.Mesh(
  new RoundedBoxGeometry(.66, .66, .66, 3, .12),
  mat(color, { roughness: .32, transmission: .75, thickness: .6, ior: 1.45, clearcoat: .6, clearcoatRoughness: .4, sheen: .6, sheenColor: '#ffffff', attenuationColor: color, attenuationDistance: .8 }),
));
export const candiedRed = candied('#d82341', 'r');
export const candiedGreen = candied('#5aae3a', 'g');
export const candiedOrange = candied('#f2891c', 'o');

export const whippedCream = proto('cream', () => {
  const star = new THREE.Shape(); const P = 8;
  for (let i = 0; i <= P * 2; i++) {
    const a = i / (P * 2) * TAU, r = i % 2 ? .085 : .12;
    i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const N = 70, pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = t * TAU * 2.6, r = .36 * Math.pow(1 - t, .85);
    pts.push(new THREE.Vector3(Math.cos(a) * r, -.3 + t * .62, Math.sin(a) * r));
  }
  const geo = new THREE.ExtrudeGeometry(star, { steps: 220, bevelEnabled: false, extrudePath: new THREE.CatmullRomCurve3(pts) });
  shape(geo, (v) => { const t = (v.y + .3) / .62; if (t > .85) { const k = 1 - (t - .85) * 4; v.x *= k; v.z *= k; } });
  return new THREE.Mesh(geo, mat('#fbf4e8', { roughness: .5, sheen: 1, sheenColor: '#ffffff', emissive: '#3a2a1a', emissiveIntensity: .12 }));
});
