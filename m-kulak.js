// 1.5.3 Kulak: 3D kulak + salyangoz/Corti, işitme aralıkları, denge
import { THREE, createViewer, explorer, tools, mat, tube, V, glow } from './viewer.js';
import { setupCanvas, loop, C } from './app.js';
const $ = (s) => document.querySelector(s);

const EAR = {
  kepce: { name: 'Kulak kepçesi', group: 'Dış kulak', info: 'Çevreden gelen ses dalgalarını toplar ve kulak yoluna iletir.' },
  yol: { name: 'Kulak yolu', group: 'Dış kulak', info: 'Ses dalgalarını kulak zarına taşır. Sonunda kulak zarı bulunur.' },
  bez: { name: 'Salgı bezleri', group: 'Dış kulak', info: 'Kulak yolundaki salgı bezleri kulağa giren maddeleri tutan ve kulak zarının esnekliğini sağlayan salgılar üretir.' },
  zar: { name: 'Kulak zarı', group: 'Dış kulak', info: 'Kulak yolunun sonunda, ses dalgalarını titreşimlere dönüştürür. Dış kulağı orta kulaktan ayırır.' },
  orta: { name: 'Orta kulak boşluğu', group: 'Orta kulak', info: 'Dış kulak ile iç kulak arasında yer alan, içi hava dolu odacıktır. Kulak zarı ile dış kulaktan, oval pencere ile iç kulaktan ayrılır.' },
  cekic: { name: 'Çekiç', group: 'Orta kulak kemikçikleri', info: 'Kulak zarına bağlıdır, titreşimi örse aktarır.' },
  ors: { name: 'Örs', group: 'Orta kulak kemikçikleri', info: 'Çekiç ile üzengi arasındaki kemik.' },
  uzengi: { name: 'Üzengi', group: 'Orta kulak kemikçikleri', info: 'Titreşimi oval pencereye aktarır. Çekiç, örs ve üzengi birlikte kulak zarındaki titreşimlerin şiddetini artırır.' },
  oval: { name: 'Oval pencere', group: 'Orta kulak / iç kulak sınırı', info: 'Orta kulağın sonunda yer alır. Titreşimleri iç kulaktaki vestibüler kanala aktarır.' },
  yuvarlak: { name: 'Yuvarlak pencere', group: 'İç kulak', info: 'Timpanik kanal yuvarlak pencereye açılır. Sıvı dalgaları burada sönümlenir, iç kulak yeni titreşimlere hazır olur.' },
  ostaki: { name: 'Östaki borusu', group: 'Orta kulak', info: 'Orta kulağı yutağa bağlar. Yükseğe çıkıldığında ya da şiddetli seste kulak zarının iki yanındaki hava basıncını dengeler. Burundan gelen mikroorganizmaların orta kulağa ulaşmasına da yol açabilir.' },
  daliz: { name: 'Dalız', group: 'İç kulak · işitme', info: 'Orta kulaktan sonraki ilk bölümdür. Oval pencereden gelen ses dalgalarını salyangoza iletir.' },
  salyangoz: { name: 'Salyangoz (kohlea)', group: 'İç kulak · işitme', info: 'Üstte vestibüler kanal, ortada kohlear kanal, altta timpanik kanal olmak üzere üç kanaldan oluşur. Vestibüler ve timpanik kanalda perilenf, kohlear kanalda endolenf sıvısı bulunur. Kohlear kanalın tabanındaki temel zarda Corti organı yer alır.' },
  yarim: { name: 'Yarım daire kanalları', group: 'İç kulak · denge', info: 'Birbirine dik konumda üç kanaldır. Uçlarındaki ampullada tüylü duyu hücreleri vardır; içlerindeki endolenf sıvısı dönme, hızlanma ve yavaşlama hareketlerini algılatır.' },
  tulumcuk: { name: 'Tulumcuk', group: 'İç kulak · denge', info: 'Yarım daire kanallarını birbirine bağlar. İçinde otolit (denge taşları) ve tüylü duyu hücreleri vardır; yer çekimine göre konum değişimini algılar.' },
  kesecik: { name: 'Kesecik', group: 'İç kulak · denge', info: 'Tulumcuğun altındadır, salyangozla bağlantılıdır. Otolitler ve tüylü duyu hücreleriyle başın konumunu algılar.' },
  isitme: { name: 'İşitme siniri', group: 'Sinirler', info: 'Corti organındaki uyartıları önce talamusa, sonra beyin kabuğundaki işitme merkezine taşır.' },
  denge: { name: 'Denge siniri', group: 'Sinirler', info: 'Denge yapılarından gelen uyartıları beyin ve beyinciğe iletir; kas faaliyetleri düzenlenerek vücut pozisyonu ayarlanır.' },
};

export function mountKulak() {
  const host = $('#ear3d');
  const v = createViewer(host, { cam: [-0.3, 0.9, 9.2], target: [-0.4, -0.1, 0], parts: EAR, minD: 3, maxD: 20 });
  tools(host, v);
  explorer(v, $('#earChips'), $('#earInfo'), EAR);
  const g = new THREE.Group(); v.root.add(g);
  const skin = mat(0xf2b49c, { rough: 0.75, side: THREE.DoubleSide });
  // kulak kepçesi
  const helix = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.17, 18, 70, Math.PI * 1.55), skin);
  helix.rotation.set(0, Math.PI / 2, Math.PI * 0.62); helix.scale.set(1, 1.45, 1); helix.position.set(-3.55, 0.3, 0); g.add(helix);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 30, 0, Math.PI), skin); bowl.rotation.y = -Math.PI / 2; bowl.scale.set(0.95, 1.35, 0.55); bowl.position.set(-3.45, 0.25, 0); g.add(bowl);
  const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 18), skin); lobe.scale.set(0.5, 1, 1); lobe.position.set(-3.55, -1.35, 0.15); g.add(lobe);
  [helix, bowl, lobe].forEach(m => v.addPart('kepce', m));
  // kulak yolu
  const canal = tube([[-3.35, 0, 0], [-2.6, 0.08, 0], [-1.7, -0.02, 0], [-1.0, 0.04, 0]], 0.3, mat(0xe38f84, { opacity: 0.45, side: THREE.DoubleSide }), 40, 24);
  g.add(canal); v.addPart('yol', canal);
  const bezM = mat(0xf2c14e);
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), bezM); b.position.set(-3.0 + i * 0.35, 0.33, (i % 2 ? 0.08 : -0.08)); g.add(b); v.addPart('bez', b); }
  // kulak zarı
  const drum = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), mat(0xe8d6cf, { opacity: 0.9, side: THREE.DoubleSide })); drum.rotation.y = Math.PI / 2; drum.rotation.x = 0.25; drum.position.set(-0.95, 0.04, 0); g.add(drum); v.addPart('zar', drum);
  // orta kulak
  const cav = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 24), mat(0xffd7a8, { opacity: 0.1, side: THREE.BackSide })); cav.scale.set(1.05, 1, 0.8); cav.position.set(-0.25, 0.2, 0); g.add(cav); v.addPart('orta', cav);
  const bone = () => mat(0xf3e3c3, { rough: 0.5 });
  const ossic = new THREE.Group(); g.add(ossic);
  const cek = new THREE.Group(); ossic.add(cek);
  cek.add(tube([[-0.93, 0.0, 0], [-0.82, 0.3, 0], [-0.66, 0.55, 0]], 0.05, bone(), 12, 8));
  const ch = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), bone()); ch.position.set(-0.6, 0.66, 0); cek.add(ch);
  v.addPart('cekic', cek);
  const ors = new THREE.Group(); ossic.add(ors);
  const ob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), bone()); ob.scale.set(1.2, 1, 1); ob.position.set(-0.33, 0.66, 0); ors.add(ob);
  ors.add(tube([[-0.3, 0.6, 0], [-0.2, 0.38, 0], [-0.12, 0.17, 0]], 0.045, bone(), 12, 8));
  v.addPart('ors', ors);
  const uz = new THREE.Group(); ossic.add(uz);
  const uh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), bone()); uh.position.set(-0.1, 0.14, 0); uz.add(uh);
  uz.add(tube([[-0.08, 0.14, 0], [0.12, 0.22, 0.06], [0.36, 0.14, 0.06]], 0.028, bone(), 12, 6));
  uz.add(tube([[-0.08, 0.12, 0], [0.12, 0.0, -0.04], [0.36, -0.02, -0.04]], 0.028, bone(), 12, 6));
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.14), bone()); foot.position.set(0.38, 0.06, 0); uz.add(foot);
  v.addPart('uzengi', uz);
  const oval = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24), mat(0x9cc6ff, { side: THREE.DoubleSide, emissive: 0x0a1a40 })); oval.rotation.y = Math.PI / 2; oval.position.set(0.42, 0.06, 0); g.add(oval); v.addPart('oval', oval);
  const round = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), mat(0xc7a8ff, { side: THREE.DoubleSide })); round.rotation.y = Math.PI / 2; round.position.set(0.45, -0.38, 0.05); g.add(round); v.addPart('yuvarlak', round);
  // östaki
  const ost = tube([[-0.25, -0.65, 0], [-0.1, -1.3, 0.1], [0.3, -1.9, 0.25], [0.7, -2.4, 0.3]], 0.13, mat(0xe38f84, { opacity: 0.85 }), 30, 12);
  g.add(ost); v.addPart('ostaki', ost);
  // iç kulak
  const inner = mat(0x8fb6ff, { rough: 0.35, opacity: 0.92 });
  const dal = new THREE.Mesh(new THREE.SphereGeometry(0.36, 28, 20), inner); dal.scale.set(1.1, 1, 0.9); dal.position.set(0.78, 0.12, 0); g.add(dal); v.addPart('daliz', dal);
  const tul = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), mat(0x7ee0b0)); tul.scale.set(1.5, 0.9, 1); tul.position.set(0.85, 0.38, 0.16); g.add(tul); v.addPart('tulumcuk', tul);
  const kes = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), mat(0xffc6e0)); kes.position.set(0.75, -0.12, 0.27); g.add(kes); v.addPart('kesecik', kes);
  const canM = mat(0x8fb6ff, { rough: 0.35 });
  const ampM = mat(0xb3c9ff);
  [
    { c: [1.05, 0.62, 0], r: [Math.PI / 2, 0, 0], amp: [0.65, 0.62, 0.0] },
    { c: [0.9, 0.95, -0.15], r: [0, Math.PI / 2, 0], amp: [0.9, 0.55, -0.45] },
    { c: [1.2, 0.95, 0.2], r: [0, 0, 0], amp: [0.78, 0.98, 0.2] },
  ].forEach(s => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 12, 56), canM); t.position.set(...s.c); t.rotation.set(...s.r); g.add(t); v.addPart('yarim', t);
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), ampM); a.position.set(...s.amp); g.add(a); v.addPart('yarim', a);
  });
  const sp = [];
  for (let i = 0; i <= 120; i++) { const t = i / 120; const a = Math.PI * 0.75 + t * 2.6 * Math.PI * 2; const r = 0.62 * (1 - 0.72 * t); sp.push(V(1.15 + r * Math.cos(a), -0.62 + r * Math.sin(a), t * 0.5)); }
  const coch = tube(sp, 0.12, mat(0x7aa7ff, { rough: 0.3 }), 200, 14); g.add(coch); v.addPart('salyangoz', coch);
  const nerveM = mat(0xf2c14e);
  const nA = tube([[1.15, -0.62, 0.35], [1.8, -0.5, 0.2], [2.5, -0.3, 0], [3.2, -0.1, 0]], 0.09, nerveM, 30, 8); g.add(nA); v.addPart('isitme', nA);
  const nB = tube([[0.95, 0.35, 0.05], [1.7, 0.25, 0.05], [2.5, 0.15, 0], [3.2, 0.1, 0]], 0.08, nerveM, 30, 8); g.add(nB); v.addPart('denge', nB);

  const A = (pos) => { const a = new THREE.Object3D(); a.position.set(...pos); g.add(a); return a; };
  const lab = (k, txt, pos) => v.addLabel(k, txt, A(pos), [0, 0, 0]);
  lab('kepce', 'Kulak kepçesi', [-3.6, 1.75, 0]); lab('yol', 'Kulak yolu', [-2.2, -0.42, 0]); lab('zar', 'Kulak zarı', [-1.05, -0.55, 0]);
  lab('cekic', 'Çekiç', [-0.75, 0.95, 0]); lab('ors', 'Örs', [-0.25, 0.92, 0]); lab('uzengi', 'Üzengi', [0.12, 0.32, 0.1]);
  lab('oval', 'Oval pencere', [0.42, -0.15, 0.1]); lab('ostaki', 'Östaki borusu', [0.2, -1.9, 0.3]);
  lab('yarim', 'Yarım daire kanalları', [1.2, 1.5, 0]); lab('salyangoz', 'Salyangoz', [1.3, -1.35, 0.3]); lab('daliz', 'Dalız', [0.95, 0.05, 0.35]);
  lab('isitme', 'İşitme siniri', [2.6, -0.55, 0]); lab('denge', 'Denge siniri', [2.6, 0.4, 0]);

  // ses dalgası animasyonu
  const rings = [];
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 40), new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); r.rotation.y = Math.PI / 2; g.add(r); rings.push(r); }
  const fluid = glow(0x6ab8ff, 0.1); g.add(fluid);
  const cochCurve = coch.userData.curve;
  let t = -1, f1 = false, f2 = false;
  const drumBase = drum.position.x, ossBase = ossic.position.x;
  $('#earGo').onclick = () => { if (t >= 0) return; t = 0; v.select('zar'); };
  v.onFrame((dt) => {
    if (t < 0) return;
    t += dt;
    rings.forEach((r, i) => { const u = (t - i * 0.25) / 1.1; r.material.opacity = u > 0 && u < 1 ? 0.8 * (1 - u * 0.6) : 0; r.position.x = -6 + Math.max(0, Math.min(1, u)) * 5.0; const s = 2.4 - Math.min(1, Math.max(0, u)) * 1.9; r.scale.set(s, s, s); });
    const vib = t > 1.0 && t < 3.4 ? Math.sin(t * 40) * Math.min(1, (t - 1.0) * 3) * Math.min(1, (3.4 - t) * 3) : 0;
    drum.position.x = drumBase + vib * 0.04;
    ossic.position.x = ossBase + vib * 0.05;
    if (t > 1.25 && !f1) { f1 = true; v.pulse(cochCurve, { dur: 1.4, color: 0x7fd0ff, size: 0.45 }); v.pulse(cochCurve, { dur: 1.4, color: 0x7fd0ff, size: 0.45, delay: 0.3 }); }
    if (t > 2.4 && !f2) { f2 = true; [0, 0.15, 0.3].forEach(d => v.pulse(nA.userData.curve, { dur: 0.8, delay: d })); }
    if (t > 3.6) { t = -1; f1 = f2 = false; drum.position.x = drumBase; ossic.position.x = ossBase; }
  });

  const stops = [cochleaSim(), rangeSim(), balanceSim()];
  return () => { v.dispose(); stops.forEach(s => s()); };
}

/* ---------- salyangoz / Corti ---------- */
const fOf = (s) => 20 * Math.pow(1000, s / 1000);
function hz(f) { if (f < 1000) return Math.round(f) + ' Hz'; return Math.round(f).toLocaleString('tr-TR') + ' Hz'; }
function cochleaSim() {
  const c = $('#cochCanvas'); const { ctx, W, H } = setupCanvas(c);
  const x0 = 80, x1 = W - 40;
  let ac = null, osc = null, gain = null, playing = false;
  const read = $('#cochRead');
  const params = () => { const f = fOf(+$('#cochF').value); const a = +$('#cochA').value / 100; return { f, a }; };
  const peakX = (f) => x0 + (1 - Math.log(f / 20) / Math.log(1000)) * (x1 - x0);
  const env = (x, xp) => x < xp ? Math.exp(-Math.pow((xp - x) / 170, 2)) : Math.exp(-Math.pow((x - xp) / 32, 2));
  const out = () => { const { f, a } = params(); $('#cochFOut').textContent = hz(f); $('#cochAOut').textContent = a < 0.3 ? 'düşük' : a > 0.7 ? 'yüksek' : 'orta'; if (osc) { osc.frequency.setTargetAtTime(f, ac.currentTime, 0.02); gain.gain.setTargetAtTime(0.015 + a * 0.08, ac.currentTime, 0.05); } };
  $('#cochF').oninput = out; $('#cochA').oninput = out; out();
  const btn = $('#cochPlay');
  btn.onclick = () => {
    if (!playing) {
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        osc = ac.createOscillator(); gain = ac.createGain(); osc.type = 'sine';
        const { f, a } = params(); osc.frequency.value = f; gain.gain.value = 0.015 + a * 0.08;
        osc.connect(gain).connect(ac.destination); osc.start(); playing = true;
        btn.setAttribute('aria-pressed', 'true'); btn.textContent = 'Sesi durdur';
      } catch (e) { btn.textContent = 'Ses çalınamadı'; }
    } else stopAudio();
  };
  function stopAudio() { try { osc && osc.stop(); } catch (e) { /* zaten durdu */ } osc = null; playing = false; btn.setAttribute('aria-pressed', 'false'); btn.textContent = 'Sesi çal'; }
  const N = 46;
  const stop = loop((dt, time) => {
    const { f, a } = params();
    const xp = peakX(f);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    // kanallar
    ctx.fillStyle = 'rgba(122,167,255,.16)'; ctx.fillRect(x0, 34, x1 - x0, 58); ctx.fillRect(x0, 128, x1 - x0, 50);
    ctx.fillStyle = 'rgba(255,143,160,.12)'; ctx.fillRect(x0, 92, x1 - x0, 36);
    ctx.font = C.mono; ctx.fillStyle = C.dim; ctx.textAlign = 'left';
    ctx.fillText('VESTİBÜLER KANAL · perilenf', x0 + 8, 52); ctx.fillText('KOHLEAR KANAL · endolenf', x0 + 8, 108); ctx.fillText('TİMPANİK KANAL · perilenf', x0 + 8, 172);
    // sıvı akışı okları
    ctx.fillStyle = C.blue;
    for (let i = 0; i < 9; i++) { const x = x0 + ((time * 60 * (0.4 + a) + i * 80) % (x1 - x0)); ctx.beginPath(); ctx.moveTo(x, 74); ctx.lineTo(x - 9, 69); ctx.lineTo(x - 9, 79); ctx.fill(); const x2 = x1 - ((time * 60 * (0.4 + a) + i * 80) % (x1 - x0)); ctx.beginPath(); ctx.moveTo(x2, 150); ctx.lineTo(x2 + 9, 145); ctx.lineTo(x2 + 9, 155); ctx.fill(); }
    // pencereler
    ctx.fillStyle = '#9cc6ff'; ctx.fillRect(x0 - 16, 40, 10, 46); ctx.fillStyle = '#c7a8ff'; ctx.fillRect(x0 - 16, 132, 10, 42);
    ctx.fillStyle = C.ink; ctx.textAlign = 'right'; ctx.fillText('oval', x0 - 20, 60); ctx.fillText('pencere', x0 - 20, 74); ctx.fillText('yuvarlak', x0 - 20, 150); ctx.fillText('pencere', x0 - 20, 164);
    // temel zar
    ctx.strokeStyle = C.pink; ctx.lineWidth = 3; ctx.beginPath();
    const k = 0.09 * Math.pow(f / 20, 0.12), w = 10 + Math.log(f) * 1.2;
    for (let x = x0; x <= x1; x += 3) { const y = 125 + a * 26 * env(x, xp) * Math.sin(x * k - time * w); x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = C.pink; ctx.textAlign = 'right'; ctx.fillText('temel zar', x1, 120);
    // Corti tüylü hücreleri
    let n = 0;
    for (let i = 0; i < N; i++) {
      const x = x0 + 8 + i / (N - 1) * (x1 - x0 - 16);
      const e = env(x, xp) * a;
      const on = e > 0.18; n += on;
      const bend = (on ? Math.sin(time * 14) * 0.6 * e + 0.5 * e : 0);
      ctx.fillStyle = on ? '#ffd34d' : 'rgba(180,140,255,.55)'; rr(ctx, x - 5, 214, 10, 26, 4); ctx.fill();
      ctx.strokeStyle = on ? '#ffe9a0' : 'rgba(220,200,255,.6)'; ctx.lineWidth = 1.5;
      for (let h = -1; h <= 1; h++) { ctx.beginPath(); ctx.moveTo(x + h * 2.5, 214); ctx.lineTo(x + h * 2.5 + bend * 10, 202); ctx.stroke(); }
      if (on && Math.random() < e * 0.5) { ctx.fillStyle = C.red; ctx.fillRect(x - 1, 248 + Math.random() * 40, 2, 10); }
    }
    ctx.fillStyle = 'rgba(255,214,77,.25)'; ctx.fillRect(x0, 196, x1 - x0, 5);
    ctx.fillStyle = C.dim; ctx.textAlign = 'left'; ctx.fillText('çatı zarı', x0, 192); ctx.fillText('Corti organı · tüylü duyu hücreleri', x0, 256);
    ctx.fillStyle = C.gold; ctx.fillText('işitme siniri uyartıları', x0, H - 8);
    ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.fillText('taban · yüksek frekans', x0, 24); ctx.textAlign = 'right'; ctx.fillText('tepe · düşük frekans', x1, 24);
    ctx.fillStyle = 'rgba(255,59,78,.9)'; ctx.beginPath(); ctx.moveTo(xp, 192); ctx.lineTo(xp - 6, 182); ctx.lineTo(xp + 6, 182); ctx.fill();
    const txt = `${hz(f)} · titreşen tüylü hücre: ${n}/${N}. ${n > 14 ? 'Çok sayıda hücre uyarıldı → ses şiddetli algılanır.' : n > 5 ? 'Orta sayıda hücre uyarıldı.' : 'Az hücre uyarıldı → ses zayıf algılanır.'}`;
    if (txt !== read.textContent) read.textContent = txt;
  });
  return () => { stop(); stopAudio(); if (ac) { ac.close(); ac = null; } };
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

/* ---------- işitme aralıkları ---------- */
function rangeSim() {
  const c = $('#rangeCanvas'); const { ctx, W, H } = setupCanvas(c);
  const rows = [
    { n: 'İnsan', a: 20, b: 20000, c: '#ff3b4e' },
    { n: 'Köpek', a: 67, b: 100000, c: '#ffc94d' },
    { n: 'Yarasa', a: 1000, b: 200000, c: '#b48cff' },
    { n: 'Güve', a: 20000, b: 100000, c: '#43d18a' },
  ];
  const lo = 1, hi = Math.log10(300000);
  const xL = 110, xR = W - 24;
  const X = (f) => xL + (Math.log10(f) - lo) / (hi - lo) * (xR - xL);
  const fOfR = (s) => 10 * Math.pow(30000, s / 1000);
  function draw() {
    const f = fOfR(+$('#rangeF').value);
    $('#rangeOut').textContent = hz(f);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.font = C.mono; ctx.textAlign = 'center'; ctx.fillStyle = C.dim;
    [20, 100, 1000, 20000, 100000].forEach(t => { const x = X(t); ctx.strokeStyle = C.faint; ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H - 36); ctx.stroke(); ctx.fillText(t >= 1000 ? (t / 1000) + ' kHz' : t + ' Hz', x, H - 16); });
    ctx.fillStyle = 'rgba(106,168,255,.12)'; ctx.fillRect(X(20000), 20, xR - X(20000), H - 56);
    ctx.fillStyle = C.blue; ctx.textAlign = 'left'; ctx.fillText('ultrason', X(20000) + 6, 34);
    const hear = [];
    rows.forEach((r, i) => {
      const y = 52 + i * 40; const inR = f >= r.a && f <= r.b; if (inR) hear.push(r.n);
      ctx.fillStyle = C.ink; ctx.textAlign = 'right'; ctx.font = C.sans; ctx.fillText(r.n, xL - 12, y + 5);
      ctx.fillStyle = r.c; ctx.globalAlpha = inR ? 1 : 0.45; rr(ctx, X(r.a), y - 8, X(r.b) - X(r.a), 16, 8); ctx.fill(); ctx.globalAlpha = 1;
    });
    ctx.font = C.mono;
    const x = X(f); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H - 36); ctx.stroke();
    $('#rangeRead').textContent = hear.length ? `${hz(f)} sesini duyabilenler: ${hear.join(', ')}` : `${hz(f)}: bu canlıların hiçbiri duyamaz.`;
  }
  $('#rangeF').oninput = draw; draw();
  return () => {};
}

/* ---------- denge ---------- */
function balanceSim() {
  const c = $('#balCanvas'); const { ctx, W, H } = setupCanvas(c);
  let spin = false, wC = 0, wF = 0, aC = 0, aF = 0;
  const btn = $('#balSpin'), read = $('#balRead');
  btn.onclick = () => { spin = !spin; btn.setAttribute('aria-pressed', spin); btn.textContent = spin ? 'Dönmeyi durdur' : 'Dönmeye başla'; };
  $('#balTilt').oninput = (e) => { $('#balTiltOut').textContent = e.target.value + '°'; };
  let msg = '';
  return loop((dt) => {
    const target = spin ? 2.2 : 0;
    wC += (target - wC) * Math.min(1, dt * 5);
    wF += (wC - wF) * Math.min(1, dt * 0.55);
    aC += wC * dt; aF += wF * dt;
    const defl = Math.max(-1, Math.min(1, (wC - wF) / 1.4));
    const tilt = +$('#balTilt').value * Math.PI / 180;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    // yarım daire kanalı
    const cx = 190, cy = 150, R = 92;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(aC);
    ctx.strokeStyle = 'rgba(143,182,255,.55)'; ctx.lineWidth = 28; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke();
    // kupula (ampulla tepede)
    ctx.save(); ctx.translate(0, -R); ctx.fillStyle = 'rgba(200,170,255,.85)';
    ctx.beginPath(); ctx.moveTo(-10, 14); ctx.quadraticCurveTo(defl * 22, -2, -6 + defl * 26, -14); ctx.lineTo(6 + defl * 26, -14); ctx.quadraticCurveTo(defl * 22, -2, 10, 14); ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.fillStyle = '#7fd0ff';
    for (let i = 0; i < 22; i++) { const a = aF + i / 22 * Math.PI * 2; if (Math.abs(((a - aC) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI * 1.5) < 0.14) continue; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 3.2, 0, 7); ctx.fill(); }
    // baş
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(aC);
    ctx.fillStyle = '#f2b49c'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill(); ctx.fillStyle = '#2b0c11'; ctx.beginPath(); ctx.arc(-10, -26, 4, 0, 7); ctx.arc(10, -26, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#e09a84'; ctx.beginPath(); ctx.arc(0, -32, 6, 0, 7); ctx.fill();
    ctx.restore();
    ctx.font = C.mono; ctx.fillStyle = C.dim; ctx.textAlign = 'center'; ctx.fillText('YARIM DAİRE KANALI · üstten', cx, 22); ctx.fillText('mavi noktalar: endolenf · mor: kupula', cx, H - 12);
    // otolit
    const ox = 575, oy = 175;
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(tilt);
    const shift = Math.sin(tilt) * 34;
    ctx.fillStyle = 'rgba(255,198,224,.35)'; rr(ctx, -130, 20, 260, 40, 8); ctx.fill();
    for (let i = 0; i < 11; i++) {
      const x = -110 + i * 22;
      ctx.fillStyle = Math.abs(shift) > 6 ? '#ffd34d' : 'rgba(180,140,255,.8)'; rr(ctx, x - 6, 22, 12, 30, 5); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, 22); ctx.quadraticCurveTo(x, -4, x + shift * 0.9, -22); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(200,230,255,.28)'; rr(ctx, -135 + shift, -46, 270, 30, 8); ctx.fill();
    ctx.fillStyle = '#e8eef7';
    for (let i = 0; i < 24; i++) { ctx.beginPath(); ctx.arc(-125 + shift + i * 11, -52 + (i % 3) * 3, 5, 0, 7); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W - 30, 60); ctx.lineTo(W - 30, 110); ctx.stroke(); ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(W - 36, 104); ctx.lineTo(W - 24, 104); ctx.lineTo(W - 30, 116); ctx.fill();
    ctx.fillStyle = C.dim; ctx.textAlign = 'center'; ctx.fillText('KESECİK / TULUMCUK', ox, 22); ctx.fillText('otolitler · jelatinimsi madde · tüylü hücreler', ox, H - 12); ctx.textAlign = 'right'; ctx.fillStyle = C.gold; ctx.fillText('yer çekimi', W - 40, 90);
    let m;
    if (Math.abs(defl) > 0.25) m = spin ? 'Dönme başladı: endolenf geride kaldı, kupula büküldü → denge siniri uyarıldı.' : 'Dönme durdu ama endolenf dönmeye devam ediyor: kupula ters yöne büküldü (baş dönmesi hissi).';
    else m = spin ? 'Sabit hızda dönüş: sıvı kanala yetişti, kupula düzeldi; uyartı azaldı.' : 'Baş sabit: kupula dik.';
    if (Math.abs(tilt) > 0.1) m += ' Baş eğik: otolitler kaydı, tüyler büküldü → konum değişimi algılandı.';
    if (m !== msg) { msg = m; read.textContent = m; }
  });
}
