// 1.5.3 Deri: 3D deri kesiti, yedi reseptör, uyaran araçları, iki nokta testi
import { THREE, createViewer, explorer, tools, mat, tube, V, rng, glow } from './viewer.js';
import { setupCanvas, C } from './app.js';
const $ = (s) => document.querySelector(s);
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

const SKIN = {
  korun: { name: 'Korun tabakası', group: 'Üst deri (epidermis)', info: 'Epidermisin üst kısmındaki hücreler ölüdür ve keratin proteini içerir. Deriyi mikroorganizmalara ve dış etkilere karşı korur. Saç ve tırnak bu tabakadan oluşur.' },
  malpighi: { name: 'Malpighi tabakası', group: 'Üst deri (epidermis)', info: 'Korun tabakasının altındaki canlı hücrelerdir. Bölünerek zamanla dökülen korun tabakasını yeniler. Üst deride kan damarı yoktur.' },
  melanosit: { name: 'Melanosit', group: 'Malpighi tabakası', info: 'Deriye rengini veren melanin pigmentini sentezler; melanin morötesi ışınları süzerek zararlarını azaltır.' },
  dermis: { name: 'Alt deri (dermis)', group: 'Deri', info: 'Temel bağ dokudan yapılmıştır. Kan damarları, sinir uçları, ter ve yağ bezleri, reseptörler, kıl kökleri, düz kaslar ile kolajen, elastik ve ağsı lifler bulunur.' },
  yag: { name: 'Yağ doku', group: 'Derinin altı', info: 'Alt derinin en alt kısmında bulunur. Isı kaybını önler ve vücudu dış etkilere karşı korur.' },
  kil: { name: 'Kıl ve kıl kökü', group: 'Dermis', info: 'Kıl, korun tabakasından oluşur; kökü dermiste yer alır.' },
  kilkoku: { name: 'Kıl kökü reseptörü', group: 'Mekanoreseptör', info: 'Her kıl tabanında bulunur. Kılın hafif bir hareketinde uyarılıp dokunma duyusunu algılayan mekanoreseptördür.' },
  yagbezi: { name: 'Yağ bezi', group: 'Dermis', info: 'Kıl kökleriyle bağlantılıdır; ürettiği salgılar derinin yumuşak kalmasını sağlar.' },
  terbezi: { name: 'Ter bezi', group: 'Dermis', info: 'Vücut sıcaklığının ayarlanmasında ve atık maddelerin vücuttan uzaklaştırılmasında görev alır.' },
  kas: { name: 'Düz kas', group: 'Dermis', info: 'Kıl köküne bağlı düz kas.' },
  damar: { name: 'Kan damarları', group: 'Dermis', info: 'Derinin beslenmesinde rol oynar. Üst deride kan damarı bulunmaz.' },
  sinir: { name: 'Duyu sinirleri', group: 'Dermis', info: 'Reseptörlerde oluşan uyartıları omurilik ve beyne taşır.' },
  meissner: { name: 'Meissner cisimciği', group: 'Dokunma reseptörü', info: 'Hafif dokunmaları algılar. Dermisin üst kısmında, epidermise yakın bulunur.' },
  merkel: { name: 'Merkel diskleri', group: 'Dokunma reseptörü', info: 'Sürekli ve hafif temasın algılanmasında görevlidir.' },
  pacini: { name: 'Pacini cisimciği', group: 'Basınç reseptörü', info: 'Basınç ve titreşim duyusunu algılar. Derinin derin kısmında, soğan zarı gibi katmanlı yapıdadır.' },
  ruffini: { name: 'Ruffini cisimciği', group: 'Termoreseptör', info: 'Sıcağa duyarlıdır.' },
  krause: { name: 'Krause cisimciği', group: 'Termoreseptör', info: 'Soğuğa duyarlıdır.' },
  serbest: { name: 'Serbest sinir uçları', group: 'Nosiseptör ve termoreseptör', info: 'Aşırı sıcağa, basınca, kimyasala, doku hasarına ve iltihaplanmaya karşı duyarlıdır. Ağrı reseptörü (nosiseptör) olarak görev yapar.' },
};
const STIM = {
  hafif: { rec: ['meissner'], tool: 'finger', depth: 0.08, txt: 'Hafif dokunma → Meissner cisimciği uyarıldı.' },
  surekli: { rec: ['merkel', 'meissner'], tool: 'finger', depth: 0.12, hold: true, txt: 'Sürekli temas → Merkel diskleri uyarılıyor (hafif ve sürekli temas). Meissner kısa süre tepki verdi.' },
  basinc: { rec: ['pacini'], tool: 'finger', depth: 0.38, vib: true, txt: 'Basınç ve titreşim → derindeki Pacini cisimciği uyarıldı.' },
  kil: { rec: ['kilkoku'], tool: 'hair', txt: 'Kıl hareket etti → kıl kökü reseptörü (mekanoreseptör) uyarıldı.' },
  sicak: { rec: ['ruffini', 'serbest'], tool: 'heat', txt: 'Sıcak → Ruffini cisimciği uyarıldı. Aşırı sıcakta serbest sinir uçları da ağrı uyartısı üretir.' },
  soguk: { rec: ['krause'], tool: 'ice', txt: 'Soğuk → Krause cisimciği uyarıldı.' },
  agri: { rec: ['serbest'], tool: 'needle', txt: 'Doku hasarı → serbest sinir uçları (nosiseptör) yüksek sıklıkta uyartı üretti → ağrı.' },
};

export function mountDeri() {
  const host = $('#skin3d');
  const v = createViewer(host, { cam: [3.6, 3.0, 9.5], target: [0, 0.2, 0], parts: SKIN, minD: 3, maxD: 22 });
  tools(host, v);
  explorer(v, $('#skinChips'), $('#skinInfo'), SKIN);
  const g = new THREE.Group(); v.root.add(g);
  const R = rng(31);
  const XW = 6.4, ZD = 3.6;
  const box = (h, y, col, o, key) => { const m = new THREE.Mesh(new THREE.BoxGeometry(XW, h, ZD), mat(col, o)); m.position.y = y; g.add(m); v.addPart(key, m); return m; };
  box(0.22, 2.11, 0xe8c4a2, { opacity: 0.92, rough: 0.9 }, 'korun');
  box(0.55, 1.725, 0xf09a95, { opacity: 0.5 }, 'malpighi');
  box(2.25, 0.325, 0xf7c3c7, { opacity: 0.2 }, 'dermis');
  box(1.0, -1.3, 0xffd77a, { opacity: 0.22 }, 'yag');
  const fat = new THREE.InstancedMesh(new THREE.SphereGeometry(0.19, 12, 10), mat(0xffd36b, { rough: 0.5, opacity: 0.8 }), 60);
  let n = 0;
  for (let ix = 0; ix < 15; ix++) for (let iz = 0; iz < 4; iz++) { const d = new THREE.Object3D(); d.position.set(-XW / 2 + 0.25 + ix * 0.42 + (iz % 2) * 0.1, -1.3 + (R() - 0.5) * 0.45, -ZD / 2 + 0.3 + iz * 0.55); d.scale.setScalar(0.8 + R() * 0.4); d.updateMatrix(); fat.setMatrixAt(n++, d.matrix); }
  g.add(fat); v.addPart('yag', fat);
  // melanositler
  const melM = mat(0x5a3220);
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), melM); m.position.set(-2.6 + i * 1.3, 1.52, -0.8 + R() * 1.6); g.add(m); v.addPart('melanosit', m); for (let k = 0; k < 3; k++) { const t = tube([m.position, m.position.clone().add(V((R() - 0.5) * 0.5, 0.18, (R() - 0.5) * 0.5))], 0.018, melM, 4, 4); g.add(t); v.addPart('melanosit', t); } }
  // kıl
  const hairBase = V(-1.3, -0.5, -0.2);
  const hairG = new THREE.Group(); hairG.position.copy(hairBase); g.add(hairG);
  const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 3.9, 10), mat(0x3b2416)); hair.position.set(0, 1.95, 0); hairG.add(hair); hairG.rotation.z = 0.12;
  v.addPart('kil', hairG);
  const fol = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.3, 18, 1, true), mat(0xd9a07a, { opacity: 0.5, side: THREE.DoubleSide })); fol.position.set(-1.21, 0.62, -0.2); fol.rotation.z = 0.12; g.add(fol); v.addPart('kil', fol);
  const bulbH = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), mat(0x8a4a2a)); bulbH.position.copy(hairBase); g.add(bulbH); v.addPart('kil', bulbH);
  const hel = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 8; hel.push(V(-1.25 + Math.cos(a) * 0.24 + i / 60 * -0.06, -0.05 + i / 60 * 0.75, -0.2 + Math.sin(a) * 0.24)); }
  const hfr = tube(hel, 0.025, mat(0xffd34d, { emissive: 0x3a2a00 }), 120, 5); g.add(hfr); v.addPart('kilkoku', hfr);
  const sebM = mat(0xfff0b8, { rough: 0.6 });
  [[-0.8, 1.0, -0.2], [-0.7, 0.8, -0.05], [-0.75, 0.85, -0.38], [-0.62, 1.0, -0.25], [-0.85, 0.75, -0.25]].forEach(p => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), sebM); s.position.set(...p); g.add(s); v.addPart('yagbezi', s); });
  const ark = tube([[-1.15, 0.2, -0.2], [-0.6, 0.6, -0.2], [-0.2, 1.4, -0.2]], 0.04, mat(0xd2475b), 16, 6); g.add(ark); v.addPart('kas', ark);
  // ter bezi
  const coil = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 10; coil.push(V(1.7 + Math.cos(a) * 0.25, -0.55 + i / 80 * 0.45, -0.7 + Math.sin(a) * 0.25)); }
  const sw = tube(coil, 0.07, mat(0xc79be0), 200, 8); g.add(sw); v.addPart('terbezi', sw);
  const duct = tube([[1.7, -0.1, -0.7], [1.55, 0.6, -0.7], [1.75, 1.3, -0.7], [1.55, 2.25, -0.7]], 0.05, mat(0xc79be0), 40, 6); g.add(duct); v.addPart('terbezi', duct);
  // damarlar
  const red = mat(0xd62839), blue = mat(0x3d6fd8);
  const art = tube([[-3.2, -0.45, -1.2], [-1, -0.5, -1.0], [1, -0.4, -1.2], [3.2, -0.5, -1.1]], 0.09, red, 40, 8); g.add(art); v.addPart('damar', art);
  const ven = tube([[-3.2, -0.62, -1.45], [-1, -0.66, -1.3], [1, -0.6, -1.45], [3.2, -0.66, -1.4]], 0.09, blue, 40, 8); g.add(ven); v.addPart('damar', ven);
  [-2.2, -0.2, 2.4].forEach(x => { const l = tube([[x, -0.45, -1.2], [x + 0.1, 0.6, -1.1], [x + 0.15, 1.35, -1.1], [x + 0.35, 0.6, -1.25], [x + 0.4, -0.62, -1.4]], 0.035, mat(0xb03050), 30, 5); g.add(l); v.addPart('damar', l); });
  // sinir gövdesi
  const nerveM = mat(0xf2c14e);
  const trunk = tube([[-3.2, -0.72, 0.85], [0, -0.75, 0.9], [3.2, -0.72, 0.85]], 0.08, nerveM, 40, 8); g.add(trunk); v.addPart('sinir', trunk);
  // reseptörler
  const RECS = {};
  const nervePath = (from, x) => new THREE.CatmullRomCurve3([from, V(from.x, (from.y + -0.75) / 2, from.z), V(x, -0.75, 0.9), V(x + 1.0, -0.74, 0.9), V(3.2, -0.72, 0.85)]);
  function addRec(key, obj, pos, glowCol) {
    obj.position.copy(pos); g.add(obj); v.addPart(key, obj);
    const curve = nervePath(pos.clone().add(V(0, -0.15, 0)), pos.x);
    const t = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.03, 5, false), nerveM); g.add(t); v.addPart('sinir', t);
    const gl = glow(glowCol, 0.1); gl.position.copy(pos); g.add(gl);
    RECS[key] = { curve, gl, pos };
  }
  const meis = new THREE.Group();
  const mb = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), mat(0xffc2d0, { opacity: 0.85 })); mb.scale.set(0.15, 0.27, 0.15); meis.add(mb);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.13 - Math.abs(i - 1.5) * 0.02, 0.012, 6, 16), mat(0xe8708a)); r.rotation.x = Math.PI / 2; r.position.y = -0.16 + i * 0.1; meis.add(r); }
  addRec('meissner', meis, V(0.2, 1.22, 0.9), 0xff8fa0);
  const merk = new THREE.Group();
  for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), mat(0x7cc4ff, { emissive: 0x0a2040 })); d.position.set(i * 0.22 - 0.33, 0, 0); merk.add(d); }
  addRec('merkel', merk, V(1.0, 1.47, 0.9), 0x7cc4ff);
  const pac = new THREE.Group();
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat(i % 2 ? 0xf4ddcf : 0xe9c7b5, { opacity: 0.35 - i * 0.03, side: THREE.DoubleSide })); s.scale.set(0.12 + i * 0.06, 0.22 + i * 0.09, 0.12 + i * 0.06); pac.add(s); }
  addRec('pacini', pac, V(0.7, -1.0, 0.9), 0xffd0b0);
  const ruf = new THREE.Group();
  const rb = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), mat(0xff9a5a, { opacity: 0.75 })); rb.scale.set(0.42, 0.11, 0.11); ruf.add(rb);
  for (let i = 0; i < 5; i++) { const l = tube([[-0.35, 0, 0], [0, (i - 2) * 0.03, (i % 2 - 0.5) * 0.06], [0.35, 0, 0]], 0.008, mat(0xffe08a), 8, 4); ruf.add(l); }
  addRec('ruffini', ruf, V(-0.2, 0.35, 0.9), 0xff7a3a);
  const kra = new THREE.Group();
  const kb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 14), mat(0x6aa8ff, { opacity: 0.75 })); kra.add(kb);
  const kc = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 6; kc.push(V(Math.cos(a) * 0.09, -0.1 + i / 40 * 0.2, Math.sin(a) * 0.09)); } kra.add(tube(kc, 0.012, mat(0xffe08a), 60, 4));
  addRec('krause', kra, V(2.15, 0.95, 0.9), 0x6aa8ff);
  // serbest sinir uçları
  const freeM = mat(0xffd34d, { emissive: 0x000000 });
  const fpos = V(-2.3, 0.35, 0.9);
  const fg = new THREE.Group();
  [[0, 0], [-0.25, 0.1], [0.25, -0.1], [-0.1, 0.25], [0.15, 0.2]].forEach(([dx, dz]) => { fg.add(tube([[0, 0, 0], [dx * 0.6, 0.6, dz * 0.6], [dx, 1.1, dz], [dx * 1.3, 1.45, dz * 1.2]], 0.02, freeM, 16, 4)); });
  addRec('serbest', fg, fpos, 0xff3b4e);

  const lab = (k, t, p) => { const a = new THREE.Object3D(); a.position.set(...p); g.add(a); v.addLabel(k, t, a, [0, 0, 0]); };
  lab('korun', 'Korun tabakası', [-2.6, 2.25, 1.8]); lab('malpighi', 'Malpighi tabakası', [-2.6, 1.7, 1.8]); lab('dermis', 'Dermis', [-2.75, 0.4, 1.8]); lab('yag', 'Yağ doku', [-2.75, -1.3, 1.8]);
  lab('kil', 'Kıl', [-1.6, 3.2, -0.2]); lab('kilkoku', 'Kıl kökü reseptörü', [-1.75, 0.3, -0.2]); lab('yagbezi', 'Yağ bezi', [-0.55, 1.15, -0.2]); lab('terbezi', 'Ter bezi', [2.1, -0.45, -0.7]);
  lab('meissner', 'Meissner', [0.2, 1.55, 0.95]); lab('merkel', 'Merkel diskleri', [1.15, 1.62, 0.95]); lab('pacini', 'Pacini', [0.7, -0.4, 0.95]); lab('ruffini', 'Ruffini', [-0.2, 0.55, 0.95]); lab('krause', 'Krause', [2.15, 1.22, 0.95]); lab('serbest', 'Serbest sinir uçları', [-2.3, 1.95, 0.95]);
  lab('damar', 'Kan damarları', [2.6, -0.35, -1.2]);

  // uyaran araçları
  const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.4, 8, 20), mat(0xf0b39c, { rough: 0.7 })); finger.visible = false; g.add(finger);
  const heat = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16), mat(0xff5a2b, { emissive: 0xff3b10, ei: 0.9 })); heat.visible = false; g.add(heat);
  const heatGl = glow(0xff6a2b, 0.1); g.add(heatGl);
  const ice = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mat(0xbfe6ff, { opacity: 0.75, rough: 0.1 })); ice.visible = false; g.add(ice);
  const needle = new THREE.Group(); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 1.6, 12), mat(0xdfe6ee, { metal: 0.8, rough: 0.2 })); cone.rotation.x = Math.PI; needle.add(cone); const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 16), mat(0xff3b4e)); hd.position.y = 1.1; needle.add(hd); needle.visible = false; g.add(needle);
  let st = null;
  const read = $('#skinRead');
  document.querySelectorAll('#skinStim [data-s]').forEach(b => b.onclick = () => {
    const s = STIM[b.dataset.s];
    st = { s, t: 0, fired: false };
    read.textContent = s.txt;
    v.select(s.rec[0]);
  });
  v.onFrame((dt) => {
    if (!st) return;
    st.t += dt; const t = st.t, s = st.s;
    const tgt = RECS[s.rec[0]].pos;
    const dur = s.hold ? 3.2 : 1.8;
    const p = t < 0.4 ? ease(t / 0.4) : t < dur - 0.5 ? 1 : 1 - ease((t - dur + 0.5) / 0.5);
    finger.visible = s.tool === 'finger'; heat.visible = s.tool === 'heat'; ice.visible = s.tool === 'ice'; needle.visible = s.tool === 'needle';
    heatGl.scale.setScalar(s.tool === 'heat' ? 0.1 + p * 2.4 : 0.1);
    const top = 2.22;
    if (s.tool === 'finger') { finger.position.set(tgt.x, top + 1.25 + 1.6 * (1 - p) - s.depth * p + (s.vib && p > 0.9 ? Math.sin(t * 50) * 0.04 : 0), 0.9); }
    if (s.tool === 'heat') { heat.position.set(tgt.x, top + 0.5 + 1.2 * (1 - p), 0.9); heatGl.position.copy(heat.position); }
    if (s.tool === 'ice') { ice.position.set(tgt.x, top + 0.36 + 1.2 * (1 - p), 0.9); ice.rotation.y += dt; }
    if (s.tool === 'needle') { needle.position.set(fpos.x + 0.1, top + 0.4 + 1.2 * (1 - p) - p * 0.6, 0.9); }
    if (s.tool === 'hair') { hairG.rotation.z = 0.12 + Math.sin(t * 9) * 0.18 * p; }
    if (t > 0.45 && !st.fired) {
      st.fired = true;
      s.rec.forEach((k, i) => {
        const r = RECS[k]; const cnt = k === 'serbest' && s.tool === 'needle' ? 6 : s.hold && k === 'meissner' ? 1 : 3;
        for (let j = 0; j < cnt; j++) v.pulse(r.curve, { dur: 1.0, delay: i * 0.2 + j * (s.hold && k === 'merkel' ? 0.5 : 0.18), size: 0.4 });
      });
    }
    s.rec.forEach((k, i) => { const r = RECS[k]; const on = t > 0.4 && t < dur - 0.2; const fade = s.hold && k === 'meissner' ? Math.max(0, 1 - (t - 0.4) * 1.5) : 1; r.gl.scale.setScalar(on ? 0.1 + (1.0 + Math.sin(t * 12) * 0.25) * fade * (i === 0 ? 1 : 0.6) : 0.1); });
    if (s.tool === 'needle') { freeM.emissive.setHex(0xff2a1a); freeM.emissiveIntensity = p * 0.9; }
    if (t > dur) { finger.visible = heat.visible = ice.visible = needle.visible = false; heatGl.scale.setScalar(0.1); hairG.rotation.z = 0.12; freeM.emissiveIntensity = 0; Object.values(RECS).forEach(r => r.gl.scale.setScalar(0.1)); st = null; }
  });

  const s2 = twoPoint();
  return () => { v.dispose(); s2(); };
}

function twoPoint() {
  const c = $('#tpCanvas'); const { ctx, W, H } = setupCanvas(c);
  const pw = (W - 60) / 2, ph = H - 70, scale = pw / 60;
  const regions = [{ n: 'Parmak ucu', th: 3, r: 1.6, gap: 2.4 }, { n: 'Kol', th: 35, r: 16, gap: 22 }];
  function draw() {
    const D = +$('#tpD').value; $('#tpOut').textContent = D + ' mm';
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const res = [];
    regions.forEach((rg, i) => {
      const x0 = 20 + i * (pw + 20), y0 = 34;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();
      ctx.fillStyle = '#f2c2ae'; ctx.fillRect(x0, y0, pw, ph);
      const cx = x0 + pw / 2, cy = y0 + ph / 2;
      const p1 = cx - D / 2 * scale, p2 = cx + D / 2 * scale;
      const fields = [];
      for (let gy = -6; gy <= 6; gy++) for (let gx = -16; gx <= 16; gx++) {
        const fx = cx + (gx + (gy % 2 ? 0.5 : 0)) * rg.gap * scale, fy = cy + gy * rg.gap * scale * 0.87;
        if (fx < x0 - 60 || fx > x0 + pw + 60 || fy < y0 - 60 || fy > y0 + ph + 60) continue;
        fields.push([fx, fy]);
      }
      const near = (px) => { let best = null, bd = 1e9; fields.forEach((f, k) => { const d = Math.hypot(f[0] - px, f[1] - cy); if (d < bd) { bd = d; best = k; } }); return best; };
      const a = near(p1), b = near(p2);
      fields.forEach((f, k) => { ctx.strokeStyle = k === a || k === b ? 'rgba(193,18,31,.9)' : 'rgba(122,40,50,.35)'; ctx.fillStyle = k === a || k === b ? 'rgba(255,59,78,.25)' : 'rgba(0,0,0,0)'; ctx.lineWidth = k === a || k === b ? 2 : 1; ctx.beginPath(); ctx.arc(f[0], f[1], rg.r * scale, 0, 7); ctx.fill(); ctx.stroke(); });
      ctx.restore();
      ctx.fillStyle = '#2b0c11'; [p1, p2].forEach(px => { ctx.beginPath(); ctx.arc(px, cy, 4, 0, 7); ctx.fill(); });
      const two = D >= rg.th; res.push(`${rg.n}: ${two ? 'iki nokta' : 'tek nokta'}`);
      ctx.font = C.sans; ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.fillText(rg.n, x0, 22);
      ctx.font = C.mono; ctx.textAlign = 'right'; ctx.fillStyle = two ? C.green : C.gold; ctx.fillText(two ? 'İKİ NOKTA HİSSEDİLİR' : 'TEK NOKTA HİSSEDİLİR', x0 + pw, 22);
      ctx.fillStyle = C.dim; ctx.textAlign = 'left'; ctx.fillText(`eşik ≈ ${rg.th} mm`, x0, H - 14);
    });
    $('#tpRead').textContent = `${D} mm → ${res.join(' · ')}. Kırmızı daireler uçların düştüğü reseptör alanlarıdır.`;
  }
  $('#tpD').oninput = draw; draw();
  return () => {};
}
