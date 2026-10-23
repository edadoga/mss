// 1.5.3 Göz: 3D göz küresi + görüntü oluşumu, çubuk–koni, karanlığa uyum, kör nokta
import { THREE, createViewer, explorer, tools, mat, tube, V, glow } from './viewer.js';
import { setupCanvas, loop, segValue, C, bars } from './app.js';
const $ = (s) => document.querySelector(s);
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const smooth = (a, b, x) => ease((x - a) / (b - a));

const EYE = {
  sklera: { name: 'Sert tabaka (sklera)', group: 'Göz küresinin tabakaları', info: 'Göz beyazı da denilen, gözün en dış tabakasıdır. Bağ dokudan oluşur; göze şeklini vermeye yardım eder ve iç kısmı korur. Göz kaslarının tutunma yeridir.' },
  kornea: { name: 'Saydam tabaka (kornea)', group: 'Sert tabaka', info: 'Sert tabaka ön tarafta incelip hafif şişkinleşerek korneayı oluşturur. Saydam ve renksizdir, kan ve lenf damarı yoktur. Gelen ışığı kırarak göze iletir.' },
  koroid: { name: 'Damar tabaka (koroid)', group: 'Göz küresinin tabakaları', info: 'Sert tabakanın altındadır; kan damarları ve pigmentler bakımından zengindir. Koyu pigmentler ışığın çoğunu emerek iç yansımaları önler, görüntünün net olmasını sağlar (sinema perdesi etkisi).' },
  iris: { name: 'İris', group: 'Damar tabaka', info: 'Damar tabakanın ön kısmında kalınlaşarak oluşturduğu renkli kısımdır. Düz kaslardan oluşur, göze renk veren pigmentler içerir. Kasılıp gevşeyerek göz bebeğinin büyüklüğünü ayarlar.' },
  pupil: { name: 'Göz bebeği (pupil)', group: 'İris', info: 'İrisin tam ortasında ışığın girdiği açıklıktır. Fazla ışıkta daralır, az ışıkta genişler; böylece göze giren ışık miktarı ayarlanır.' },
  mercek: { name: 'Göz merceği', group: 'Göz küresi', info: 'Göz bebeğinin arkasında, saydam proteinden yapılı ince kenarlı mercektir. Işığı ikinci kez kırarak görüntüyü retinaya (sarı beneğe) odaklar.' },
  kirpiksi: { name: 'Kirpiksi cisim', group: 'Damar tabaka', info: 'Merceği asıcı bağlarla tutan halka şeklindeki yapıdır; merceğin şeklini ayarlamaya yardım eder.' },
  asici: { name: 'Asıcı bağlar', group: 'Mercek', info: 'Merceği kirpiksi cisme bağlayan ince bağlardır.' },
  camsi: { name: 'Camsı sıvı (camsı cisim)', group: 'Göz küresi', info: 'Mercek ile retina arasındaki en büyük boşluğu dolduran sıvıdır. Göz küresinin iç basıncını ayarlar, mercek ve gözün şeklinin sabit kalmasını sağlar, damar tabakanın ulaşamadığı bölümlerin madde alışverişini karşılar.' },
  onoda: { name: 'Ön oda', group: 'Göz odaları', info: 'Kornea ile iris arasındaki boşluktur. Gözün canlılığını ve şeklini koruyan özel bir sıvıyla doludur.' },
  arkaoda: { name: 'Arka oda', group: 'Göz odaları', info: 'İris ile mercek arasındaki boşluktur; ön oda gibi özel bir sıvıyla doludur.' },
  retina: { name: 'Ağ tabaka (retina)', group: 'Göz küresinin tabakaları', info: 'Gözün en içteki tabakasıdır. Işığı algılayan fotoreseptörler (çubuk ve koni hücreleri) ve gözü beyne bağlayan görme sinirleri burada bulunur.' },
  sari: { name: 'Sarı benek', group: 'Ağ tabaka', info: 'Optik eksenin retinayı kestiği çukur bölgedir. Görüntünün ters olarak ilk oluştuğu yerdir. Merkezinde koniler, kenarlarında çubuklar yoğundur; görüntü en net burada oluşur.' },
  kor: { name: 'Kör nokta', group: 'Ağ tabaka', info: 'Göz sinirlerinin retinadan çıktığı noktadır. Burada fotoreseptör bulunmadığından görüntü oluşmaz ve ışık algılanmaz.' },
  optik: { name: 'Optik sinir (görme siniri)', group: 'Sinirler', info: 'Çubuk ve koni hücrelerinin uyarılmasıyla oluşan uyartıları önce talamusa, sonra beyin kabuğundaki görme merkezine taşır.' },
  damar: { name: 'Kan damarları', group: 'Ağ tabaka', info: 'Retinaya kan taşıyan damarlar kör noktadan girip çıkar.' },
  kas: { name: 'Göz kasları', group: 'Yardımcı yapılar', info: 'Sert tabakaya tutunur ve göz küresinin hareketini sağlar.' },
};

function polyCurve(pts) {
  const cp = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) cp.add(new THREE.LineCurve3(V(...pts[i]), V(...pts[i + 1])));
  return cp;
}

export function mountGoz() {
  const host = $('#eye3d');
  const v = createViewer(host, { cam: [3.2, 2.0, 8.4], target: [0.2, 0, 0], parts: EYE, minD: 3, maxD: 18 });
  explorer(v, $('#eyeChips'), $('#eyeInfo'), EYE);
  const g = new THREE.Group(); v.root.add(g);
  const DS = THREE.DoubleSide;
  const shell = (r, open, color, o = {}) => { const geo = new THREE.SphereGeometry(r, 72, 48, 0, Math.PI * 2, open, Math.PI - open); geo.rotateZ(-Math.PI / 2); return new THREE.Mesh(geo, mat(color, { side: DS, ...o })); };
  const sclera = shell(2.0, 0.4, 0xf4ebe6, { rough: 0.7 }); g.add(sclera); v.addPart('sklera', sclera);
  const koroid = shell(1.95, 0.6, 0x6e1a26, { rough: 0.8 }); g.add(koroid); v.addPart('koroid', koroid);
  const retina = shell(1.89, 0.78, 0xf08a5d, { rough: 0.6 }); g.add(retina); v.addPart('retina', retina);
  // kornea
  const cg = new THREE.SphereGeometry(1.05, 48, 24, 0, Math.PI * 2, 0, 0.84); cg.rotateZ(-Math.PI / 2);
  const cornea = new THREE.Mesh(cg, mat(0xcfe8ff, { opacity: 0.3, side: DS, rough: 0.05 })); cornea.position.x = 1.137; g.add(cornea); v.addPart('kornea', cornea);
  // iris
  const irisM = mat(0x3f7fb0, { side: DS, rough: 0.6 });
  const ringGeo = (r) => { const geo = new THREE.RingGeometry(r, 0.98, 64, 3); geo.rotateY(Math.PI / 2); return geo; };
  const iris = new THREE.Mesh(ringGeo(0.33), irisM); iris.position.x = 1.6; g.add(iris); v.addPart('iris', iris);
  const setPupil = (r) => { iris.geometry.dispose(); iris.geometry = ringGeo(r); };
  // mercek
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 30), mat(0xffe7a8, { opacity: 0.55, rough: 0.1 })); lens.scale.set(0.42, 1, 1); lens.position.x = 1.22; g.add(lens); v.addPart('mercek', lens);
  const cil = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.13, 14, 64), mat(0xa63446)); cil.rotation.y = Math.PI / 2; cil.position.x = 1.25; g.add(cil); v.addPart('kirpiksi', cil);
  const ligM = mat(0xf5e1c8, { opacity: 0.8 });
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4), ligM); l.position.set(1.24, Math.cos(a) * 0.85, Math.sin(a) * 0.85); l.rotation.x = -a; g.add(l); v.addPart('asici', l); }
  const vit = new THREE.Mesh(new THREE.SphereGeometry(1.84, 40, 30), mat(0xbfdcff, { opacity: 0.07, side: THREE.BackSide })); g.add(vit); v.addPart('camsi', vit);
  // sarı benek, kör nokta, optik sinir
  const mac = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), mat(0xffd84a, { emissive: 0x4a3500, side: DS })); mac.position.set(-1.86, 0, 0); mac.rotation.y = Math.PI / 2; g.add(mac); v.addPart('sari', mac);
  const d = V(-0.94, -0.34, 0).normalize();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), mat(0xfff3d6, { side: DS })); disc.position.copy(d).multiplyScalar(1.855); disc.lookAt(0, 0, 0); g.add(disc); v.addPart('kor', disc);
  const nerve = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 2.4, 28), mat(0xf2c14e, { rough: 0.5 })); nerve.position.copy(d).multiplyScalar(3.05); nerve.quaternion.setFromUnitVectors(V(0, 1, 0), d); g.add(nerve); v.addPart('optik', nerve);
  // retina damarları
  const sph = (th, ph, r = 1.84) => V(-r * Math.cos(th) * Math.cos(ph), r * Math.sin(th), r * Math.cos(th) * Math.sin(ph));
  const vesM = mat(0xc81e2e, { rough: 0.5 });
  const d0th = Math.asin(-0.34);
  [[0.5, 0.15], [0.9, -0.2], [-0.35, 0.4], [0.2, -0.6], [-0.1, 0.9]].forEach(([dt, dp]) => {
    const pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push(sph(d0th + dt * u * 1.2, dp * u * 1.4 + Math.sin(u * 4) * 0.05)); }
    const t = tube(pts, 0.022, vesM, 24, 5); g.add(t); v.addPart('damar', t);
  });
  // göz kasları
  const kasM = mat(0xb5323f, { rough: 0.8 });
  [[0.2, 1], [0.2, -1]].forEach(([x, s]) => { const k = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.55), kasM); k.position.set(x - 1.0, s * 2.03, 0); k.rotation.z = s * -0.12; g.add(k); v.addPart('kas', k); });

  const A = (pos) => { const a = new THREE.Object3D(); a.position.set(...pos); g.add(a); return a; };
  const lab = (k, txt, pos) => v.addLabel(k, txt, A(pos), [0, 0, 0]);
  lab('sklera', 'Sert tabaka', [0.4, 1.98, -0.05]); lab('koroid', 'Damar tabaka', [-0.9, 1.72, -0.05]); lab('retina', 'Ağ tabaka', [-1.45, 1.05, -0.05]);
  lab('kornea', 'Kornea', [2.2, 0.15, 0]); lab('iris', 'İris', [1.6, 0.82, 0]); lab('pupil', 'Göz bebeği', [1.75, -0.05, 0]);
  lab('mercek', 'Mercek', [1.22, -0.35, 0]); lab('kirpiksi', 'Kirpiksi cisim', [1.25, -1.22, 0]); lab('camsi', 'Camsı sıvı', [-0.2, 0.5, 0]);
  lab('onoda', 'Ön oda', [1.92, 0.42, 0]); lab('arkaoda', 'Arka oda', [1.42, 0.7, 0]); lab('sari', 'Sarı benek', [-1.86, 0.18, 0]);
  lab('kor', 'Kör nokta', [-1.7, -0.78, 0]); lab('optik', 'Optik sinir', [-3.1, -1.25, 0]); lab('kas', 'Göz kası', [-1.0, 2.25, 0]);

  const planes = [new THREE.Plane(V(0, 0, -1), 0)];
  let cutOn = true;
  v.setClip(planes);
  tools(host, v, { cut: (b) => { cutOn = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', cutOn); v.setClip(cutOn ? planes : null); } });

  // göz bebeği refleksi
  const pupOut = $('#pupOut');
  const onPup = () => { const L = +$('#pupL').value / 100; setPupil(0.52 - L * 0.38); pupOut.textContent = L < 0.25 ? 'loş · göz bebeği genişledi' : L > 0.75 ? 'parlak · göz bebeği daraldı' : 'orta'; };
  $('#pupL').oninput = onPup; onPup();
  // ışık ışını
  const rayM = new THREE.LineBasicMaterial({ color: 0xffe36b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
  const paths = [
    [[7, 0.9, 0], [2.17, 0.36, 0], [1.6, 0.27, 0], [1.22, 0.22, 0], [-1.86, -0.02, 0]],
    [[7, -0.9, 0], [2.17, -0.36, 0], [1.6, -0.27, 0], [1.22, -0.22, 0], [-1.86, 0.02, 0]],
    [[7, 0, 0], [-1.86, 0, 0]],
  ];
  const lines = paths.map(p => { const geo = new THREE.BufferGeometry().setFromPoints(p.map(q => V(...q))); const l = new THREE.Line(geo, rayM); l.userData.noClip = true; g.add(l); return l; });
  const curves = paths.map(polyCurve);
  let rt = -1;
  $('#eyeRay').onclick = () => {
    rt = 0;
    curves.forEach((c, i) => v.pulse(c, { dur: 1.3, color: 0xfff1a8, size: 0.4, delay: i * 0.08 }));
    setTimeout(() => v.pulse(polyCurve([[d.x * 1.86, d.y * 1.86, 0], [d.x * 4.2, d.y * 4.2, 0]]), { dur: 0.6, color: 0xffb347 }), 1400);
    v.select('sari');
  };
  v.onFrame((dt) => { if (rt < 0) return; rt += dt; rayM.opacity = rt < 0.3 ? rt / 0.3 * 0.7 : rt < 2.2 ? 0.7 : Math.max(0, 0.7 - (rt - 2.2)); if (rt > 3) rt = -1; });

  const stops = [raySim(), rodConeSim(), darkSim(), blindSim()];
  return () => { v.dispose(); stops.forEach(s => s()); };
}

/* ---------- görüntü oluşumu ---------- */
function drawTree(ctx, x, y, s, alpha = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#8a5a35'; ctx.fillRect(-6, 10, 12, 50);
  ctx.fillStyle = '#2fbf71'; ctx.beginPath(); ctx.arc(0, -10, 34, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff3b4e'; [[-14, -18], [12, -4], [4, -30]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 6, 0, 7); ctx.fill(); });
  ctx.restore();
}
function raySim() {
  const c = $('#rayCanvas'); const { ctx, W, H } = setupCanvas(c);
  const cy = 170, ex = 560, er = 125;
  const lensX = ex - er + 40, retX = ex + er - 6;
  let show = false;
  $('#rayBrain').onchange = (e) => { show = e.target.checked; draw(); };
  function draw() {
    const k = +$('#rayD').value / 100;
    $('#rayDOut').textContent = k < 0.33 ? 'yakın' : k > 0.66 ? 'uzak' : 'orta';
    const ox = 330 - k * 270;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    // göz
    ctx.fillStyle = '#f4ebe6'; ctx.beginPath(); ctx.arc(ex, cy, er + 6, 0, 7); ctx.fill();
    ctx.fillStyle = '#6e1a26'; ctx.beginPath(); ctx.arc(ex, cy, er, 0, 7); ctx.fill();
    ctx.fillStyle = '#f08a5d'; ctx.beginPath(); ctx.arc(ex, cy, er - 6, -1.25, 1.25); ctx.arc(ex, cy, er - 14, 1.25, -1.25, true); ctx.fill();
    ctx.fillStyle = '#1c2a44'; ctx.beginPath(); ctx.arc(ex, cy, er - 14, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(207,232,255,.25)'; ctx.beginPath(); ctx.ellipse(ex - er + 4, cy, 22, 62, 0, Math.PI / 2, Math.PI * 1.5); ctx.fill();
    ctx.strokeStyle = 'rgba(207,232,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ex - er + 4, cy, 22, 62, 0, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.fillStyle = '#3f7fb0'; ctx.fillRect(lensX - 22, cy - 72, 6, 50); ctx.fillRect(lensX - 22, cy + 22, 6, 50);
    ctx.fillStyle = 'rgba(255,231,168,.85)'; ctx.beginPath(); ctx.ellipse(lensX, cy, 13, 48, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(retX - 2, cy, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2c14e'; ctx.save(); ctx.translate(ex + er * 0.93, cy + er * 0.36); ctx.rotate(0.35); ctx.fillRect(0, -12, 46, 24); ctx.restore();
    // cisim
    const oh = 70; const otop = cy - oh, obot = cy + oh * 0.9;
    drawTree(ctx, ox, cy - 6, 1.15);
    // ışınlar
    const m = (retX - lensX) / (lensX - ox);
    const imgTop = cy + (cy - otop) * m, imgBot = cy - (obot - cy) * m;
    [[otop, imgTop, '#ffd34d'], [obot, imgBot, '#6ae0ff']].forEach(([y0, yi, col]) => {
      ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.moveTo(ox, y0); ctx.lineTo(lensX, cy + (y0 - cy) * 0.25); ctx.lineTo(retX, yi); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, y0); ctx.lineTo(lensX, y0 < cy ? cy - 40 : cy + 40); ctx.lineTo(retX, yi); ctx.stroke();
      ctx.globalAlpha = 1;
    });
    // retinadaki ters görüntü
    const s = Math.max(0.12, (imgTop - imgBot) / (otop - obot) * 1.15);
    drawTree(ctx, retX - 14, cy + 6 * s, -s);
    // etiketler
    ctx.font = C.mono; ctx.fillStyle = C.ink; ctx.textAlign = 'center';
    ctx.fillText('kornea', ex - er - 6, cy - 80); ctx.fillText('mercek', lensX + 4, cy + 72); ctx.fillText('camsı sıvı', ex + 10, cy - 30);
    ctx.fillText('sarı benek', retX - 20, cy - 50); ctx.textAlign = 'right'; ctx.fillText('optik sinir', W - 8, cy + er * 0.36 + 44); ctx.textAlign = 'center';
    ctx.fillStyle = C.dim; ctx.fillText('cisim', ox, cy + 100); ctx.fillText('ters ve küçük görüntü', retX - 40, H - 14);
    if (show) {
      rr(ctx, 20, 18, 170, 108, 12); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fill();
      ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.fillText('BEYİNDEKİ ALGI', 32, 38);
      drawTree(ctx, 105, 80, 0.55);
      ctx.fillStyle = C.green; ctx.fillText('düz ve anlamlı', 32, 118);
    }
  }
  function rr(ctx2, x, y, w, h, r) { ctx2.beginPath(); ctx2.roundRect ? ctx2.roundRect(x, y, w, h, r) : ctx2.rect(x, y, w, h); }
  $('#rayD').oninput = draw; draw();
  return () => {};
}

/* ---------- çubuk ve koni ---------- */
function rodConeSim() {
  const c = $('#rcCanvas'); const { ctx, W, H } = setupCanvas(c);
  const LIGHT = { beyaz: [1, 1, 1], kirmizi: [1, 0.12, 0.02], yesil: [0.15, 1, 0.08], mavi: [0.02, 0.12, 1], sari: [1, 0.85, 0.02] };
  const TINT = { beyaz: null, kirmizi: '#ff3030', yesil: '#30ff60', mavi: '#3060ff', sari: '#ffe030' };
  let col = 'beyaz';
  const setBars = bars($('#rcBars'), [
    { name: 'Çubuk', color: '#9fb2d4' }, { name: 'Koni · kırmızı', color: '#ff4d4d' }, { name: 'Koni · yeşil', color: '#43d18a' }, { name: 'Koni · mavi', color: '#5b8cff' },
  ]);
  function scene() {
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#3d8bff'); sky.addColorStop(1, '#bfe3ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(640, 60, 34, 0, 7); ctx.fill();
    ctx.fillStyle = '#2f9e57'; ctx.beginPath(); ctx.moveTo(0, 200); ctx.quadraticCurveTo(200, 140, 420, 200); ctx.quadraticCurveTo(600, 240, 760, 190); ctx.lineTo(760, 300); ctx.lineTo(0, 300); ctx.fill();
    ctx.fillStyle = '#1f7a43'; ctx.beginPath(); ctx.moveTo(0, 250); ctx.quadraticCurveTo(300, 210, 760, 260); ctx.lineTo(760, 300); ctx.lineTo(0, 300); ctx.fill();
    ctx.fillStyle = '#e8e2d8'; ctx.fillRect(470, 150, 120, 80); ctx.fillStyle = '#c1121f'; ctx.beginPath(); ctx.moveTo(460, 152); ctx.lineTo(530, 100); ctx.lineTo(600, 152); ctx.fill();
    ctx.fillStyle = '#3d6fd8'; ctx.fillRect(492, 172, 26, 26); ctx.fillRect(545, 172, 26, 26);
    const fl = [[90, 255, '#ff2d55'], [140, 268, '#ffd000'], [200, 250, '#a855f7'], [260, 270, '#ff2d55'], [320, 258, '#ff7a00'], [660, 262, '#ff2d55'], [710, 250, '#ffd000']];
    fl.forEach(([x, y, cc]) => { ctx.strokeStyle = '#1a5a2f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 24); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = cc; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + Math.cos(i * 1.256) * 8, y + Math.sin(i * 1.256) * 8, 7, 0, 7); ctx.fill(); } ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); });
  }
  function upd() {
    const L = +$('#rcL').value / 100;
    const cone = smooth(0.22, 0.55, L);
    const rod = L < 0.6 ? Math.min(1, L / 0.12) : Math.max(0.12, 1 - (L - 0.6) * 2.2);
    const w = LIGHT[col];
    setBars([rod, cone * w[0], cone * w[1], cone * w[2]]);
    ctx.globalCompositeOperation = 'source-over'; scene();
    if (TINT[col]) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = TINT[col]; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
    c.style.filter = `saturate(${cone.toFixed(2)}) brightness(${(0.12 + 0.88 * Math.pow(L, 0.7)).toFixed(2)}) contrast(${(0.6 + 0.4 * Math.min(1, L * 3)).toFixed(2)})`;
    $('#rcOut').textContent = `%${Math.round(L * 100)} · ${cone < 0.1 ? 'siyah-beyaz' : cone < 0.9 ? 'renkler soluk' : 'renkli'}`;
  }
  segValue($('#rcColor'), 'c', x => { col = x; upd(); });
  $('#rcL').oninput = upd; upd();
  return () => { c.style.filter = ''; };
}

/* ---------- karanlığa uyum ---------- */
function darkSim() {
  const c = $('#darkCanvas'); const { ctx, W, H } = setupCanvas(c);
  let light = true, r = 0.15, flash = 0;
  $('#darkOff').onclick = () => { light = false; };
  $('#darkOn').onclick = () => { if (!light) flash = 1; light = true; };
  const room = (a, colorful) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = colorful ? '#8a5a35' : '#9aa0a8'; ctx.fillRect(40, 150, 110, 12); ctx.fillRect(48, 162, 10, 50); ctx.fillRect(132, 162, 10, 50);
    ctx.fillStyle = colorful ? '#c1121f' : '#b8bcc4'; ctx.fillRect(220, 120, 70, 92); ctx.fillRect(220, 90, 12, 40);
    ctx.fillStyle = colorful ? '#ffd34d' : '#d0d3d8'; ctx.beginPath(); ctx.moveTo(330, 80); ctx.lineTo(380, 80); ctx.lineTo(395, 115); ctx.lineTo(315, 115); ctx.fill();
    ctx.fillStyle = colorful ? '#555' : '#a6a9ae'; ctx.fillRect(351, 115, 8, 90); ctx.fillRect(330, 205, 50, 8);
    ctx.fillStyle = colorful ? '#f97316' : '#c7cace'; ctx.beginPath(); ctx.ellipse(95, 135, 26, 16, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(120, 122, 11, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  };
  return loop((dt) => {
    r += light ? -dt * 1.6 : dt * 0.11; r = Math.max(0.05, Math.min(1, r)); flash = Math.max(0, flash - dt * 1.5);
    ctx.fillStyle = light ? '#f2e3d5' : '#020103'; ctx.fillRect(0, 0, W, H);
    if (light) room(1, true); else room(smooth(0.25, 1, r) * 0.85, false);
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(110, H - 26, W - 130, 12);
    ctx.fillStyle = '#b48cff'; ctx.fillRect(110, H - 26, (W - 130) * r, 12);
    ctx.font = C.mono; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('RODOPSİN', 14, H - 15);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.fillText(light ? 'ışık: rodopsin parçalanır' : r < 0.35 ? 'karanlık: henüz bir şey görünmüyor' : 'rodopsin sentezlendi, şekiller beliriyor', W - 12, 20);
  });
}

/* ---------- kör nokta ---------- */
function blindSim() {
  const c = $('#blindCanvas'); const { ctx, W, H } = setupCanvas(c);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(70, H / 2 - 16); ctx.lineTo(70, H / 2 + 16); ctx.moveTo(54, H / 2); ctx.lineTo(86, H / 2); ctx.stroke();
  ctx.fillStyle = '#d0021b'; ctx.beginPath(); ctx.arc(330, H / 2, 16, 0, 7); ctx.fill();
  ctx.font = C.mono; ctx.fillStyle = '#555'; ctx.textAlign = 'center'; ctx.fillText('sağ gözünle + işaretine bak', W / 2, H - 16);
  return () => {};
}
