/* The Turn — Locken in real 3D. Scroll: a full 360° turn with the cap lifting away,
   it comes to rest facing you, sprays once, and the cap closes. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const sec = document.getElementById('s-turn'), host = document.getElementById('turn-gl');
if (sec && host) {
  const qs = new URLSearchParams(location.search);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 100);
  const key = new THREE.DirectionalLight('#fff1dc', 1.6); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight('#ffe2b8', 1.2); rim.position.set(4, 3, -3); scene.add(rim);

  // ── the faceted body: octagonal rings lofted along Locken's profile ──
  const PROFILE = [[0, .84], [.07, .97], [.2, 1], [1.55, .72], [1.68, .58], [1.75, .32]];   // [height, half-width factor]
  const HW = .62, DEPTH = .6;
  function ring(hw, hd) {
    const c = Math.min(hw, hd) * .3;
    return [[hw - c, hd], [-(hw - c), hd], [-hw, hd - c], [-hw, -(hd - c)], [-(hw - c), -hd], [hw - c, -hd], [hw, -(hd - c)], [hw, hd - c]];
  }
  function loft(prof, sx = 1, y0 = 0, yMax = 99) {
    const rings = prof.filter(([y]) => y <= yMax).map(([y, f]) => [Math.max(y, y0), ring(f * HW * sx, f * HW * DEPTH * sx)]);
    const pos = [];
    const tri = (a, b, c) => pos.push(...a, ...b, ...c);
    for (let r = 0; r < rings.length - 1; r++) {
      const [ya, A] = rings[r], [yb, B] = rings[r + 1];
      for (let i = 0; i < 8; i++) {
        const j = (i + 1) % 8;
        const a = [A[i][0], ya, A[i][1]], b = [A[j][0], ya, A[j][1]], c = [B[j][0], yb, B[j][1]], d = [B[i][0], yb, B[i][1]];
        tri(a, b, c); tri(a, c, d);
      }
    }
    for (const [y, R, flip] of [[rings[0][0], rings[0][1], true], [rings[rings.length - 1][0], rings[rings.length - 1][1], false]])
      for (let i = 0; i < 8; i++) { const j = (i + 1) % 8, a = [0, y, 0], b = [R[i][0], y, R[i][1]], c = [R[j][0], y, R[j][1]]; flip ? tri(a, c, b) : tri(a, b, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }
  const bottle = new THREE.Group(); scene.add(bottle);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#fff7ec', transmission: 1, thickness: .35, roughness: .04, ior: 1.5, metalness: 0, envMapIntensity: 1.3, specularIntensity: 1, transparent: true });
  bottle.add(new THREE.Mesh(loft(PROFILE), glass));

  // the gold liquid, with a fine shimmer
  const shimmer = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#e9a238'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) { const v = Math.random(); g.fillStyle = v > .6 ? `rgba(255,232,170,${v * .8})` : `rgba(160,90,10,${v * .35})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 3); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const liquid = new THREE.Mesh(loft(PROFILE.map(([y, f]) => [y, f]), .9, .07, 1.56),
    new THREE.MeshPhysicalMaterial({ map: shimmer, color: '#ffffff', emissive: '#7a4100', emissiveIntensity: .14, roughness: .16, metalness: .35, clearcoat: 1, clearcoatRoughness: .1, envMapIntensity: 1.5 }));
  bottle.add(liquid);

  // the triangular gold label, taken from the photograph, on the front face
  const fz = (y) => { let f = 1; for (let i = 0; i < PROFILE.length - 1; i++) { const [y0, a] = PROFILE[i], [y1, b] = PROFILE[i + 1]; if (y >= y0 && y <= y1) f = a + (b - a) * (y - y0) / (y1 - y0); } return f * HW * DEPTH; };
  const lt = 1.24, lb = .5, lz0 = fz(lb), lz1 = fz(lt);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.8, Math.hypot(lt - lb, lz1 - lz0)),
    new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load('assets/locken-label.png', (t) => { t.colorSpace = THREE.SRGBColorSpace; }), transparent: true, alphaTest: .4, metalness: .35, roughness: .32, envMapIntensity: 1 }));
  label.position.set(0, (lt + lb) / 2, (lz0 + lz1) / 2 + .006); label.rotation.x = Math.atan2(lz0 - lz1, lt - lb);
  bottle.add(label);

  // the gold collar and the sprayer beneath the cap
  const gold = new THREE.MeshPhysicalMaterial({ color: '#ecc172', metalness: 1, roughness: .3, clearcoat: .6, envMapIntensity: 1.8 });
  const cyl = (r0, r1, h, y, seg = 40) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), gold); m.position.y = y; bottle.add(m); return m; };
  cyl(.2, .21, .1, 1.79); cyl(.18, .18, .16, 1.92); cyl(.2, .2, .04, 2.02);
  const actuator = new THREE.Group(); bottle.add(actuator);
  const act = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .12, 32), gold); act.position.y = 2.1; actuator.add(act);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.018, 16), new THREE.MeshBasicMaterial({ color: '#2a1a08' })); hole.position.set(0, 2.11, .111); actuator.add(hole);

  // the crystal cap, faceted
  const capPts = [[.001, 0], [.2, 0], [.34, .14], [.34, .22], [.28, .33], [.16, .4], [.001, .41]].map(([x, y]) => new THREE.Vector2(x, y));
  const cap = new THREE.Mesh(new THREE.LatheGeometry(capPts, 10), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, thickness: .6, roughness: .02, ior: 1.9, flatShading: true, envMapIntensity: 1.6, specularIntensity: 1, transparent: true }));
  const capRest = 2.0; cap.position.y = capRest; bottle.add(cap);

  // a soft shadow on the ground
  const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(70,35,20,.38)'); gr.addColorStop(1, 'rgba(70,35,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .002; scene.add(shadow);

  // the spray: fine droplets, scrubbed by scroll so it plays backwards too
  const N = 1400, birth = new Float32Array(N), seed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { birth[i] = Math.pow(Math.random(), 1.6) * .55; for (let k = 0; k < 4; k++) seed[i * 4 + k] = Math.random(); }
  const pg = new THREE.BufferGeometry(); const P = new Float32Array(N * 3), A = new Float32Array(N), S = new Float32Array(N);
  pg.setAttribute('position', new THREE.BufferAttribute(P, 3)); pg.setAttribute('alpha', new THREE.BufferAttribute(A, 1)); pg.setAttribute('size', new THREE.BufferAttribute(S, 1));
  const mist = new THREE.Points(pg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    uniforms: { uScale: { value: 300 } },
    vertexShader: 'attribute float alpha; attribute float size; varying float vA; uniform float uScale; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; void main(){ vec2 d = gl_PointCoord - .5; float r = length(d); if (r > .5) discard; float a = smoothstep(.5, .0, r); gl_FragColor = vec4(mix(vec3(.62,.55,.47), vec3(1.), .55), a * vA); }' }));
  mist.frustumCulled = false; scene.add(mist);
  function spray(t, origin) {           // t: seconds-ish into the spray (0 → 1.6)
    for (let i = 0; i < N; i++) {
      const age = t - birth[i], s = i * 4;
      if (age <= 0 || age > 1.1) { A[i] = 0; continue; }
      const sp = 2.4 + seed[s] * 1.6, spread = .18 + age * .55;
      const dx = -1, dy = .08 + (seed[s + 1] - .5) * spread, dz = .45 + (seed[s + 2] - .5) * spread;
      const k = age * sp * (1 - .38 * age);
      P[i * 3] = origin.x + dx * k; P[i * 3 + 1] = origin.y + dy * k - age * age * .25; P[i * 3 + 2] = origin.z + dz * k;
      A[i] = (1 - age / 1.1) * (.55 + seed[s + 3] * .45) * Math.min(1, age * 10);
      S[i] = .012 + seed[s + 3] * .03 + age * .05;
    }
    pg.attributes.position.needsUpdate = true; pg.attributes.alpha.needsUpdate = true; pg.attributes.size.needsUpdate = true;
  }

  // ── scroll → the turn ──
  const steps = [...sec.querySelectorAll('.turn-steps li')];
  function size() {
    const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false);
    camera.aspect = w / h; const d = Math.max(9.6, 9.6 * .75 / camera.aspect);
    camera.position.set(0, 1.55, d); camera.lookAt(0, 1.38, 0); camera.updateProjectionMatrix();
    mist.material.uniforms.uScale.value = h * 1.1;
  }
  addEventListener('resize', size); size();
  const origin = new THREE.Vector3();
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '200px' }).observe(sec);
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible && !qs.has('spin')) return;
    const r = sec.getBoundingClientRect(), p = qs.has('spin') ? +qs.get('spin') : clamp(-r.top / Math.max(1, sec.offsetHeight - innerHeight));
    const turn = ease(seg(p, .12, .6));
    const lift = ease(seg(p, .16, .28)) * (1 - ease(seg(p, .82, .92)));
    const press = Math.sin(Math.PI * seg(p, .66, .72)) ;
    bottle.rotation.y = turn * Math.PI * 2 + Math.sin(now / 3200) * .05 * (1 - Math.min(1, turn * (1 - turn) * 8));
    bottle.rotation.x = Math.sin(Math.PI * seg(p, .64, .82)) * -.04;
    cap.position.y = capRest + lift * .7; cap.position.x = lift * .5; cap.rotation.z = -lift * .22;
    actuator.position.y = -press * .035;
    hole.getWorldPosition(origin);
    spray(seg(p, .66, .86) * 1.6, origin);
    const st = p < .14 ? 0 : p < .6 ? 1 : p < .82 ? 2 : 3;
    steps.forEach((li, i) => li.classList.toggle('on', i === st));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
