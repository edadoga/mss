// Ortak 3D görüntüleyici: sahne, ışıklar, yörünge kontrolü, seçilebilir parçalar, etiketler, uyartı (impuls) animasyonu
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export { THREE };

const active = new Set();
let raf = 0;
let last = performance.now();
function loop(now) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  for (const v of active) v._frame(dt, now / 1000);
}
function startLoop() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }

export const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- küçük yardımcılar ---------- */
export function mat(color, o = {}) {
  const transparent = o.opacity !== undefined && o.opacity < 1;
  return new THREE.MeshStandardMaterial({
    color,
    roughness: o.rough ?? 0.55,
    metalness: o.metal ?? 0.04,
    transparent,
    opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide,
    depthWrite: o.depthWrite ?? !transparent,
    emissive: o.emissive ?? 0x000000,
    emissiveIntensity: o.ei ?? 1,
    flatShading: !!o.flat,
  });
}
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function tube(points, r, material, segs = 48, radial = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => Array.isArray(p) ? V(...p) : p));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, r, radial, false), material);
  m.userData.curve = curve;
  return m;
}
export function rng(seed = 7) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}
export function glow(color = 0xff3344, size = 0.6) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.scale.setScalar(size);
  s.userData.noClip = true;
  return s;
}

/* ---------- görüntüleyici ---------- */
export function createViewer(host, opts = {}) {
  host.classList.add('stage-live');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const el = renderer.domElement;
  el.className = 'gl';
  host.prepend(el);

  const labelLayer = document.createElement('div'); labelLayer.className = 'lbl-layer'; host.appendChild(labelLayer);
  const tip = document.createElement('div'); tip.className = 'gl-tip'; tip.hidden = true; host.appendChild(tip);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov || 38, 1, 0.05, 300);
  const cam0 = V(...(opts.cam || [0, 0, 9]));
  const tgt0 = V(...(opts.target || [0, 0, 0]));
  camera.position.copy(cam0);
  const controls = new OrbitControls(camera, el);
  controls.target.copy(tgt0);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = opts.minD ?? 2; controls.maxDistance = opts.maxD ?? 40;
  controls.autoRotate = !!opts.autoRotate && !reduceMotion; controls.autoRotateSpeed = 0.7;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xfff0ee, 0x3a0d14, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(5, 8, 7); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd9d2, 0.6); fill.position.set(-6, 3, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff2a3c, 1.3); rim.position.set(-4, -3, -7); scene.add(rim);

  const root = new THREE.Group(); scene.add(root);
  const parts = new Map();
  const pickables = [];
  const labels = [];
  const updaters = [];
  const pulses = [];
  let clipPlanes = null;
  let selected = null, hovered = null;
  let labelsOn = opts.labels ?? true;
  let visible = false;
  const api = {};

  function setGlow(k, amt) {
    const p = parts.get(k); if (!p) return;
    p.meshes.forEach(m => {
      const mt = m.material; if (!mt || !mt.emissive) return;
      if (m.userData.baseEm === undefined) { m.userData.baseEm = mt.emissive.getHex(); m.userData.baseEi = mt.emissiveIntensity; }
      if (amt > 0) { mt.emissive.setHex(0xff2238); mt.emissiveIntensity = amt; }
      else { mt.emissive.setHex(m.userData.baseEm); mt.emissiveIntensity = m.userData.baseEi; }
    });
  }
  function refreshGlow() {
    for (const k of parts.keys()) setGlow(k, k === selected ? 0.55 : k === hovered ? 0.3 : 0);
    labels.forEach(l => l.el.classList.toggle('on', l.key === selected));
  }

  api.addPart = (k, obj, labelOffset, labelText) => {
    if (!parts.has(k)) parts.set(k, { meshes: [] });
    const p = parts.get(k);
    obj.traverse(o => { if (o.isMesh || o.isInstancedMesh) { o.userData.part = k; p.meshes.push(o); pickables.push(o); } });
    if (labelOffset) api.addLabel(k, labelText || (opts.parts && opts.parts[k] ? opts.parts[k].name : k), obj, labelOffset);
    return obj;
  };
  api.addLabel = (k, text, obj, offset) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'lbl'; d.textContent = text;
    d.addEventListener('click', ev => { ev.stopPropagation(); api.select(k); });
    labelLayer.appendChild(d);
    labels.push({ key: k, el: d, obj, offset: Array.isArray(offset) ? V(...offset) : offset });
  };
  api.select = (k) => {
    selected = k;
    refreshGlow();
    if (api.onSelect) api.onSelect(k);
  };
  api.setLabels = (on) => { labelsOn = on; labelLayer.hidden = !on; };
  api.setLabels(labelsOn);
  api.setClip = (planes) => {
    clipPlanes = planes;
    root.traverse(o => {
      if (!o.material || o.userData.noClip) return;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach(m => { m.clippingPlanes = planes; m.clipShadows = true; m.needsUpdate = true; });
    });
  };
  api.reset = () => { camera.position.copy(cam0); controls.target.copy(tgt0); controls.update(); };
  api.onFrame = (fn) => updaters.push(fn);
  api.isClipped = (p) => !!clipPlanes && clipPlanes.some(pl => pl.distanceToPoint(p) < 0);

  // Bir eğri boyunca parlayan uyartı noktası gönderir
  api.pulse = (curve, o = {}) => {
    const g = glow(o.color ?? 0xffe36b, o.size ?? 0.55);
    root.add(g);
    const p = { g, curve, t: 0, dur: o.dur ?? 1.2, onDone: o.onDone, steps: o.steps, delay: o.delay ?? 0 };
    g.visible = false;
    pulses.push(p);
    return p;
  };

  function visibleChain(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  function pick(e) {
    const r = el.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(pickables, false);
    for (const h of hits) {
      if (!visibleChain(h.object)) continue;
      if (h.object.material && h.object.material.opacity < 0.05) continue;
      if (api.isClipped(h.point)) continue;
      return h;
    }
    return null;
  }
  let down = null;
  el.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  el.addEventListener('pointerup', e => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
    down = null;
    if (moved > 6) return;
    const h = pick(e);
    if (h) api.select(h.object.userData.part);
  });
  el.addEventListener('pointermove', e => {
    if (e.buttons) { tip.hidden = true; return; }
    const h = pick(e);
    const k = h ? h.object.userData.part : null;
    if (k !== hovered) { hovered = k; refreshGlow(); }
    if (k) {
      const name = opts.parts && opts.parts[k] ? opts.parts[k].name : k;
      tip.textContent = name; tip.hidden = false;
      const r = host.getBoundingClientRect();
      tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 10}px)`;
      el.style.cursor = 'pointer';
    } else { tip.hidden = true; el.style.cursor = 'grab'; }
  });
  el.addEventListener('pointerleave', () => { tip.hidden = true; if (hovered) { hovered = null; refreshGlow(); } });

  let w = 0, h = 0;
  const ro = new ResizeObserver(() => {
    w = host.clientWidth; h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    // dar ekranda (telefon) modeli sığdırmak için kamerayı geri çek
    const f = camera.aspect < 1.35 ? Math.pow(1.35 / camera.aspect, 0.85) : 1;
    if (Math.abs(f - (api._fit || 1)) > 0.01) {
      const ratio = f / (api._fit || 1); api._fit = f;
      cam0.sub(tgt0).multiplyScalar(ratio).add(tgt0);
      camera.position.sub(controls.target).multiplyScalar(ratio).add(controls.target);
      controls.maxDistance = Math.max(controls.maxDistance, cam0.distanceTo(tgt0) * 1.6);
    }
  });
  ro.observe(host);
  const io = new IntersectionObserver(ents => {
    visible = ents[0].isIntersecting;
    if (visible) { active.add(api); startLoop(); } else active.delete(api);
  });
  io.observe(host);

  const tmp = V();
  api._frame = (dt, t) => {
    if (!w || !h) return;
    controls.update();
    for (const fn of updaters) fn(dt, t);
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.g.visible = true;
      p.t += dt / p.dur;
      let u = Math.min(1, p.t);
      if (p.steps) u = Math.min(1, Math.floor(u * p.steps + 0.0001) / p.steps + 0.0001);
      p.curve.getPointAt(Math.min(1, u), p.g.position);
      if (p.t >= 1) { root.remove(p.g); p.g.material.dispose(); pulses.splice(i, 1); p.onDone && p.onDone(); }
    }
    renderer.render(scene, camera);
    if (labelsOn) {
      for (const l of labels) {
        l.obj.updateWorldMatrix(true, false);
        tmp.copy(l.offset); l.obj.localToWorld(tmp);
        const hidden = !visibleChain(l.obj) || api.isClipped(tmp);
        tmp.project(camera);
        if (hidden || tmp.z > 1) { l.el.style.visibility = 'hidden'; continue; }
        l.el.style.visibility = 'visible';
        l.el.style.transform = `translate(${(tmp.x + 1) / 2 * w}px, ${(1 - tmp.y) / 2 * h}px) translate(-50%, -50%)`;
      }
    }
  };

  api.dispose = () => {
    active.delete(api); io.disconnect(); ro.disconnect();
    scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    });
    renderer.dispose();
    renderer.forceContextLoss();
    el.remove(); labelLayer.remove(); tip.remove();
    host.classList.remove('stage-live');
  };

  Object.assign(api, { THREE, scene, camera, controls, renderer, root, host, parts });
  return api;
}

/* ---------- bölüm yardımcıları ---------- */
// Parça listesi (çipler) + bilgi kartı
export function explorer(v, chipsEl, infoEl, defs) {
  chipsEl.innerHTML = '';
  for (const [k, d] of Object.entries(defs)) {
    if (d.hidden) continue;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = d.name; b.dataset.k = k;
    b.addEventListener('click', () => v.select(k));
    chipsEl.appendChild(b);
  }
  const prev = v.onSelect;
  v.onSelect = (k) => {
    chipsEl.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.k === k));
    const d = defs[k];
    if (d) infoEl.innerHTML = `<p class="eyebrow">${d.group || 'Yapı'}</p><h4>${d.name}</h4><p>${d.info}</p>`;
    prev && prev(k);
  };
}
// Sahne üzerindeki araç düğmeleri
export function tools(host, v, extra = {}) {
  const bar = host.querySelector('.stage-tools');
  if (!bar) return;
  bar.querySelectorAll('button[data-act]').forEach(b => {
    const act = b.dataset.act;
    b.onclick = () => {
      if (act === 'labels') { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); v.setLabels(on); }
      else if (act === 'reset') v.reset();
      else if (act === 'spin') { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); v.controls.autoRotate = on; }
      else if (extra[act]) extra[act](b);
    };
  });
}
