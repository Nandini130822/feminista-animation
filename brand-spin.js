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
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#f8efe3');
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
  // glass that reads the same on every screen: clear at the centre, a faint smoky edge, sharp highlights on each facet
  const glassShader = (edge, alpha0) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `varying vec3 vV;
      void main(){
        vec3 v = normalize(vV), n = normalize(cross(dFdx(-vV), dFdy(-vV)));
        if (dot(n, v) < 0.) n = -n;
        float f = pow(1. - max(dot(n, v), 0.), 2.2);
        vec3 l1 = normalize(vec3(-.5, .65, .55)), l2 = normalize(vec3(.6, .3, .4));
        float s1 = pow(max(dot(reflect(-v, n), l1), 0.), 90.), s2 = pow(max(dot(reflect(-v, n), l2), 0.), 30.);
        vec3 col = mix(vec3(1., .985, .955), vec3(${edge}), f);
        float a = ${alpha0} + f * .62 + s1 * .9 + s2 * .25;
        col = mix(col, vec3(1.), clamp(s1 * 1.2 + s2 * .35, 0., 1.));
        gl_FragColor = vec4(col, clamp(a, 0., .95));
      }` });
  const bottle = new THREE.Group(); scene.add(bottle);
  const glass = glassShader('.58, .52, .45', '.05');
  const body = new THREE.Mesh(loft(PROFILE), glass); body.renderOrder = 2; bottle.add(body);

  // the gold liquid: luminous at the centre, deep amber at the edges, with a fine glitter that twinkles as it turns
  const liquidMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vN, vV, vP; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = -mv.xyz; vP = position; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uTime; varying vec3 vN, vV, vP;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      void main(){
        vec3 n = normalize(vN), v = normalize(vV);
        float f = pow(1. - abs(dot(n, v)), 1.4);
        vec3 col = mix(vec3(1., .80, .38), vec3(.62, .33, .05), f);
        col *= .88 + .2 * smoothstep(.1, 1.5, vP.y);
        float spec = pow(max(dot(reflect(-v, n), normalize(vec3(-.4, .7, .6))), 0.), 40.);
        col += vec3(1., .93, .78) * spec * .55;
        float g = h(floor(vP * 70.));
        float tw = step(.988, g) * pow(.5 + .5 * sin(uTime * 2.4 + g * 60. + dot(n, v) * 9.), 6.);
        col += vec3(1., .94, .72) * tw * .6;
        gl_FragColor = vec4(col, 1.);
      }` });
  const liquid = new THREE.Mesh(loft(PROFILE, .955, .17, 1.58), liquidMat);
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
  const cap = new THREE.Mesh(new THREE.LatheGeometry(capPts, 10), glassShader('.62, .57, .5', '.1'));
  const capRest = 2.0; cap.position.y = capRest; cap.renderOrder = 3; bottle.add(cap);

  // a soft shadow on the ground
  const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(70,35,20,.38)'); gr.addColorStop(1, 'rgba(70,35,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .002; scene.add(shadow);

  // the spray, as in the Fusion study: thousands of atomised droplets bursting from the nozzle in a cone,
  // slowing and spreading, then a soft haze that lingers. Scrubbed by scroll, so it plays backwards too.
  const rnd = (() => { let x = 7; return () => ((x = (x * 16807) % 2147483647) / 2147483647); })();
  const ND = 1600, NH = 90, L = 2.5;
  const drop = Array.from({ length: ND }, () => ({ dist: L * Math.pow(rnd(), .7) * (.85 + rnd() * .35), cone: Math.sqrt(rnd()), ang: rnd() * 6.283, life: .5 + rnd() * .7, delay: rnd() * .3, size: .006 + rnd() * .012, a: .35 + rnd() * .45 }));
  const haze = Array.from({ length: NH }, () => ({ dist: .4 + rnd() * 1.9, off: [(rnd() - .5) * .5, (rnd() - .5) * .35], delay: .1 + rnd() * .4, life: 1.6 + rnd() * 1.6, s0: .08 + rnd() * .1, s1: .5 + rnd() * .6, a: .05 + rnd() * .06, r: rnd() * 6 }));
  const pointsOf = (n, frag) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    for (const k of ['alpha', 'size', 'rot']) g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(n), 1));
    const m = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uScale: { value: 300 }, map: { value: null } },
      vertexShader: 'attribute float alpha, size, rot; varying float vA, vR; uniform float uScale; void main(){ vA = alpha; vR = rot; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: frag }));
    m.frustumCulled = false; scene.add(m); return m;
  };
  // droplets: fine, a warm pale gold so they read against cream, each with a bright core
  const drops = pointsOf(ND, 'varying float vA, vR; void main(){ float r = length(gl_PointCoord - .5); if (r > .5) discard; float a = smoothstep(.5, .1, r); gl_FragColor = vec4(mix(vec3(.78,.64,.42), vec3(1.,.97,.9), smoothstep(.3,.0,r)), a * vA); }');
  // haze: the Fusion study's soft vapour texture
  const smokeTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    for (let i = 0; i < 18; i++) { const x = 64 + (rnd() - .5) * 46, y = 64 + (rnd() - .5) * 46, r = 18 + rnd() * 26, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    g.globalCompositeOperation = 'destination-in'; const m = g.createRadialGradient(64, 64, 10, 64, 64, 62); m.addColorStop(0, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const hazePts = pointsOf(NH, 'uniform sampler2D map; varying float vA, vR; void main(){ vec2 c = gl_PointCoord - .5; float s = sin(vR), k = cos(vR); c = mat2(k,-s,s,k) * c; float a = texture2D(map, c + .5).a * vA; if (a < .002) discard; gl_FragColor = vec4(.80,.70,.56, a * 2.4); }');
  hazePts.material.uniforms.map.value = smokeTex;
  const DIR = new THREE.Vector3(-1, .1, .28).normalize(), UPV = new THREE.Vector3(0, 1, 0);
  const SIDE = new THREE.Vector3().crossVectors(DIR, UPV).normalize(), UP2 = new THREE.Vector3().crossVectors(SIDE, DIR).normalize();
  function spray(t, o) {
    const D = drops.geometry.attributes, Hz = hazePts.geometry.attributes;
    drop.forEach((d, i) => {
      const u = (t - d.delay) / d.life;
      if (u <= 0 || u >= 1) { D.alpha.array[i] = 0; return; }
      const e = 1 - Math.pow(1 - u, 2.4), dist = d.dist * e, c = dist * .32 * d.cone, ca = Math.cos(d.ang), sa = Math.sin(d.ang);
      D.position.array[i * 3] = o.x + DIR.x * dist + (SIDE.x * ca + UP2.x * sa) * c;
      D.position.array[i * 3 + 1] = o.y + DIR.y * dist + (SIDE.y * ca + UP2.y * sa) * c - dist * dist * .03;
      D.position.array[i * 3 + 2] = o.z + DIR.z * dist + (SIDE.z * ca + UP2.z * sa) * c;
      D.alpha.array[i] = d.a * Math.min(1, u * 10) * (1 - u); D.size.array[i] = d.size;
    });
    haze.forEach((q, i) => {
      const u = (t - q.delay) / q.life;
      if (u <= 0 || u >= 1) { Hz.alpha.array[i] = 0; return; }
      const e = 1 - Math.pow(1 - u, 3), dist = q.dist * e;
      Hz.position.array[i * 3] = o.x + DIR.x * dist + SIDE.x * q.off[0];
      Hz.position.array[i * 3 + 1] = o.y + DIR.y * dist + q.off[1] * e + u * .15;
      Hz.position.array[i * 3 + 2] = o.z + DIR.z * dist + SIDE.z * q.off[0];
      Hz.size.array[i] = q.s0 + (q.s1 - q.s0) * (1 - Math.pow(1 - u, 2)); Hz.alpha.array[i] = q.a * Math.min(1, u / .06) * Math.pow(1 - u, 1.6); Hz.rot.array[i] = q.r + u;
    });
    for (const A of [D, Hz]) for (const k of ['position', 'alpha', 'size', 'rot']) A[k].needsUpdate = true;
  }

  // ── scroll → the turn ──
  const steps = [...sec.querySelectorAll('.turn-steps li')];
  function size() {
    const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false);
    camera.aspect = w / h; const d = Math.max(9.6, 9.6 * .75 / camera.aspect);
    camera.position.set(0, 1.55, d); camera.lookAt(0, 1.38, 0); camera.updateProjectionMatrix();
    drops.material.uniforms.uScale.value = hazePts.material.uniforms.uScale.value = h * renderer.getPixelRatio() * .9;
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
    spray(seg(p, .66, .9) * 3, origin); liquidMat.uniforms.uTime.value = now / 1000;
    const st = p < .14 ? 0 : p < .6 ? 1 : p < .82 ? 2 : 3;
    steps.forEach((li, i) => li.classList.toggle('on', i === st));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
