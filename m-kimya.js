// 1.5.3 Burun ve Dil: koku epiteli, dil, tat tomurcuğu + 2D simülasyonlar
import { THREE, createViewer, explorer, tools, mat, tube, V, rng, glow } from './viewer.js';
import { setupCanvas, loop, segValue, C, bars } from './app.js';
const $ = (s) => document.querySelector(s);
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const A = (g, pos) => { const a = new THREE.Object3D(); a.position.set(...pos); g.add(a); return a; };

/* =====================================================================
   BURUN
   ===================================================================== */
const NOSE = {
  sogancik: { name: 'Koku soğancığı', group: 'Beyin', info: 'Koku reseptörlerinin aksonlarının sonlandığı yapıdır. Buradan çıkan sinirler impulsu beyin kabuğundaki koku merkezine iletir.' },
  glomerul: { name: 'Soğancıktaki sinaps bölgeleri', group: 'Koku soğancığı', info: 'Aynı tip reseptörden gelen aksonlar soğancıkta aynı bölgede toplanır; her koku farklı bir desen oluşturur.' },
  yol: { name: 'Koku yolu', group: 'Beyin', info: 'Uyartıları koku merkezine taşır. Diğer duyuların aksine koku uyartıları talamusa uğramadan beyne gider.' },
  kalbur: { name: 'Kalbur kemiği', group: 'Kafatası', info: 'Burun boşluğunu beyinden ayıran delikli kemiktir. Koku reseptörlerinin aksonları bu deliklerden geçer.' },
  reseptor: { name: 'Koku reseptör hücresi', group: 'Sarı bölge (koku epiteli)', info: 'Kemoreseptör görevi yapan özelleşmiş sinir hücresidir. Dendritleri burnun sarı bölgesinde, akson uçları beyindeki koku soğancığındadır. Uçlarında siller bulunur.' },
  sil: { name: 'Koku silleri', group: 'Koku reseptörü', info: 'Mukusa uzanan sillerdeki reseptörlere çözünmüş koku molekülleri bağlanır.' },
  destek: { name: 'Destek hücresi', group: 'Sarı bölge', info: 'Koku reseptör hücrelerinin arasında bulunan epitel hücreleri.' },
  mukus: { name: 'Mukus tabakası', group: 'Sarı bölge', info: 'Uçucu koku molekülleri önce mukusta çözünür, sonra reseptörlere ulaşır. Nezle ve gripte mukusun artması koku kaybına neden olabilir.' },
};
const SMELLS = [
  { n: 'Limon', col: 0xf5c400, css: '#f5c400', geo: () => new THREE.TetrahedronGeometry(0.13) },
  { n: 'Lavanta', col: 0x9b6bff, css: '#9b6bff', geo: () => new THREE.OctahedronGeometry(0.12) },
  { n: 'Kahve', col: 0xa0663d, css: '#c0804d', geo: () => new THREE.BoxGeometry(0.16, 0.16, 0.16) },
];

export function mountBurun() {
  const host = $('#nose3d');
  const v = createViewer(host, { cam: [1.5, 1.6, 10.5], target: [0, 0.6, 0], parts: NOSE, minD: 3, maxD: 22 });
  tools(host, v);
  explorer(v, $('#noseChips'), $('#noseInfo'), NOSE);
  const g = new THREE.Group(); v.root.add(g);
  const R = rng(17);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), mat(0xf2c14e, { opacity: 0.55, rough: 0.5 })); bulb.scale.set(2.8, 0.55, 1.1); bulb.position.y = 3.05; g.add(bulb); v.addPart('sogancik', bulb);
  const gloms = SMELLS.map((s, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), mat(s.col, { emissive: s.col, ei: 0.15 })); m.position.set(-1.3 + i * 1.3, 3.0, 0); g.add(m); v.addPart('glomerul', m); return m; });
  const tract = tube([[2.2, 3.15, 0], [3.2, 3.5, 0], [4.3, 4.1, 0]], 0.2, mat(0xf2c14e), 20, 10); g.add(tract); v.addPart('yol', tract);
  const bone = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.32, 2.2), mat(0xe9dcc3, { rough: 0.9 })); bone.position.y = 2.1; g.add(bone); v.addPart('kalbur', bone);
  const mucus = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.6, 2.2), mat(0x7cc4ff, { opacity: 0.25 })); mucus.position.y = -0.35; g.add(mucus); v.addPart('mukus', mucus);
  const supM = mat(0xf3a6b8, { rough: 0.7 });
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 1.2, 4, 12), supM); s.position.set(-2.5 + i * 0.55, 0.85, -0.45); g.add(s); v.addPart('destek', s); }
  const cells = [];
  const cellM = mat(0x8b5cf6, { rough: 0.4 });
  const axM = mat(0xf2c14e);
  for (let i = 0; i < 9; i++) {
    const type = i % 3; const x = -2.3 + i * 0.58; const z = 0.15 + (i % 2) * 0.2;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.35, 6, 14), cellM); body.position.set(x, 1.05, z); g.add(body); v.addPart('reseptor', body);
    const den = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 8), cellM); den.position.set(x, 0.42, z); g.add(den); v.addPart('reseptor', den);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), mat(SMELLS[type].col, { emissive: SMELLS[type].col, ei: 0.25 })); knob.position.set(x, -0.05, z); g.add(knob); v.addPart('reseptor', knob);
    const ciliaM = mat(0xd9c8ff);
    for (let k = -1; k <= 1; k++) { const c = tube([[x, -0.05, z], [x + k * 0.12, -0.3, z + 0.05], [x + k * 0.25, -0.55, z]], 0.012, ciliaM, 8, 4); g.add(c); v.addPart('sil', c); }
    const gp = gloms[type].position;
    const ax = tube([[x, 1.3, z], [x, 1.9, z * 0.5], [x * 0.6 + gp.x * 0.4, 2.4, 0.1], [gp.x, gp.y - 0.15, 0]], 0.03, axM, 24, 5); g.add(ax); v.addPart('reseptor', ax);
    const gl = glow(SMELLS[type].col, 0.1); gl.position.set(x, 1.05, z + 0.2); g.add(gl);
    cells.push({ type, tip: V(x, -0.5, z), curve: ax.userData.curve, gl });
  }
  const glGlow = gloms.map(m => { const s = glow(m.material.color.getHex(), 0.1); s.position.copy(m.position); g.add(s); return s; });
  const lab = (k, t, p) => v.addLabel(k, t, A(g, p), [0, 0, 0]);
  lab('sogancik', 'Koku soğancığı', [-2.3, 3.55, 0]); lab('yol', 'Koku merkezine', [4.0, 4.35, 0]); lab('kalbur', 'Kalbur kemiği', [2.4, 2.1, 1.15]);
  lab('reseptor', 'Koku reseptör hücresi', [2.75, 1.05, 0.35]); lab('destek', 'Destek hücresi', [-2.6, 1.6, -0.45]); lab('mukus', 'Mukus', [-2.4, -0.35, 1.15]); lab('sil', 'Siller', [2.6, -0.55, 0.3]);
  const airLabel = A(g, [0, -2.2, 1.0]); v.addLabel('mukus', 'Burun boşluğu (hava)', airLabel, [0, 0, 0]);

  const adapt = [1, 1, 1];
  const setBars = bars($('#noseBars'), SMELLS.map(s => ({ name: s.n, color: s.css })));
  setBars(adapt);
  const read = $('#noseRead');
  const mols = [];
  const flashes = [];
  function sniff(k) {
    const resp = adapt[k];
    const targets = cells.filter(c => c.type === k);
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(SMELLS[k].geo(), mat(SMELLS[k].col, { emissive: SMELLS[k].col, ei: 0.3, flat: true }));
      const from = V((R() - 0.5) * 4.6, -3.2 - R() * 0.8, (R() - 0.5) * 1.4);
      const tgt = targets[i % targets.length].tip.clone().add(V((R() - 0.5) * 0.25, -0.05, (R() - 0.5) * 0.2));
      m.position.copy(from); g.add(m);
      mols.push({ m, from, tgt, t: -i * 0.05 });
    }
    setTimeout(() => {
      targets.forEach(c => {
        flashes.push({ s: c.gl, t: 0, amp: 1.6 * resp });
        const n = Math.max(1, Math.round(resp * 3));
        for (let j = 0; j < n; j++) v.pulse(c.curve, { dur: 0.7, delay: j * 0.18, color: SMELLS[k].col, size: 0.35 });
      });
      setTimeout(() => { flashes.push({ s: glGlow[k], t: 0, amp: 2.2 * resp }); v.pulse(tract.userData.curve, { dur: 0.6, color: SMELLS[k].col }); }, 750);
      read.textContent = resp > 0.8 ? `${SMELLS[k].n}: reseptörler güçlü tepki verdi → koku soğancığı → koku merkezi (talamusa uğramadan).` : resp > 0.35 ? `${SMELLS[k].n} yine gönderildi: tepki azaldı. Reseptörler aynı kokuya uyum sağlıyor (duyu adaptasyonu).` : `${SMELLS[k].n} neredeyse hiç algılanmıyor. Şimdi farklı bir koku gönder.`;
      adapt[k] = Math.max(0.12, adapt[k] * 0.5);
      setBars(adapt);
    }, 1200);
  }
  host.closest('.lab').querySelectorAll('[data-k]').forEach(b => b.onclick = () => sniff(+b.dataset.k));
  let acc = 0;
  v.onFrame((dt) => {
    for (let i = mols.length - 1; i >= 0; i--) {
      const o = mols[i]; o.t += dt;
      const u = ease(o.t / 1.1);
      o.m.position.lerpVectors(o.from, o.tgt, u); o.m.rotation.x += dt * 2; o.m.rotation.y += dt * 1.5;
      if (o.t > 2.4) { g.remove(o.m); o.m.geometry.dispose(); o.m.material.dispose(); mols.splice(i, 1); }
    }
    for (let i = flashes.length - 1; i >= 0; i--) { const f = flashes[i]; f.t += dt; const k = Math.sin(Math.min(1, f.t / 1.0) * Math.PI); f.s.scale.setScalar(0.1 + k * f.amp); if (f.t > 1) { f.s.scale.setScalar(0.1); flashes.splice(i, 1); } }
    acc += dt; if (acc > 0.5) { acc = 0; let ch = false; for (let k = 0; k < 3; k++) if (adapt[k] < 1) { adapt[k] = Math.min(1, adapt[k] + 0.02); ch = true; } if (ch) setBars(adapt); }
  });

  const stops = [smellCount(), smellDir()];
  return () => { v.dispose(); stops.forEach(s => s()); };
}

function smellCount() {
  const c = $('#smellCountCanvas'); const { ctx, W, H } = setupCanvas(c);
  const rows = [['İnsan', 25, '25 milyon', '#ff8fa0'], ['Köpek', 220, '220 milyon', '#ffc94d'], ['Boz ayı', 1000, '1 milyarın üzerinde', '#c0804d']];
  let t = 0;
  return loop((dt) => {
    if (t > 1.2) return; t += dt;
    const k = ease(t / 1.1);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    rows.forEach(([n, val, lab, col], i) => {
      const y = 36 + i * 64;
      ctx.font = C.sans; ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.fillText(n, 16, y);
      const w = (W - 32) * val / 1000 * k;
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(16, y + 10, W - 32, 18);
      ctx.fillStyle = col; ctx.fillRect(16, y + 10, Math.max(3, w), 18);
      ctx.font = C.mono; ctx.fillStyle = C.dim; ctx.textAlign = 'right'; ctx.fillText(lab, W - 16, y);
    });
  });
}

function smellDir() {
  const c = $('#smellDirCanvas'); const { ctx, W, H } = setupCanvas(c);
  const parts = [];
  for (let i = 0; i < 40; i++) parts.push({ p: Math.random(), side: i % 2, j: Math.random() });
  const out = $('#dirOut');
  return loop((dt) => {
    const sx = W / 2 + (+$('#dirX').value / 100) * (W / 2 - 40), sy = 36;
    const val = +$('#dirX').value; out.textContent = Math.abs(val) < 12 ? 'tam karşıda' : val > 0 ? 'sağ' : 'sol';
    const nL = [W / 2 - 22, H - 52], nR = [W / 2 + 22, H - 52];
    const dL = Math.hypot(sx - nL[0], sy - nL[1]), dR = Math.hypot(sx - nR[0], sy - nR[1]);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f2b49c'; ctx.beginPath(); ctx.ellipse(W / 2, H + 40, 90, 120, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e09a84'; ctx.beginPath(); ctx.ellipse(W / 2, H - 50, 40, 30, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a0d14'; ctx.beginPath(); ctx.ellipse(nL[0], nL[1], 8, 12, 0.2, 0, 7); ctx.ellipse(nR[0], nR[1], 8, 12, -0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff8fa0'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(sx + Math.cos(i) * 10, sy + Math.sin(i) * 10, 7, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 7); ctx.fill();
    parts.forEach(q => {
      const tgt = q.side ? nR : nL; const d = q.side ? dR : dL;
      q.p += dt * 60 / d; if (q.p > 1) { q.p = 0; q.j = Math.random(); }
      ctx.fillStyle = q.side ? 'rgba(106,168,255,.9)' : 'rgba(67,209,138,.9)';
      ctx.beginPath(); ctx.arc(sx + (tgt[0] - sx) * q.p + (q.j - 0.5) * 18 * (1 - q.p), sy + (tgt[1] - sy) * q.p, 3, 0, 7); ctx.fill();
    });
    const diff = Math.round(Math.abs(dL - dR) * 1.6);
    ctx.font = C.mono; ctx.fillStyle = C.ink; ctx.textAlign = 'left';
    ctx.fillText(diff < 3 ? 'iki deliğe aynı anda' : `${dL < dR ? 'sol' : 'sağ'} deliğe ${diff} ms önce (temsilî)`, 12, H - 12);
  });
}

/* =====================================================================
   DİL
   ===================================================================== */
const TONGUE = {
  dil: { name: 'Dil', group: 'Tat alma organı', info: 'Konuşma, beslenme ve yutmaya yardım eder. Üzeri epitel dokuyla örtülüdür.' },
  papilla: { name: 'Papillalar', group: 'Dil yüzeyi', info: 'Dil üzerinde ve ağız boşluğunda bulunan çıkıntılardır. Tadın algılanmasını sağlayan tat tomurcukları papillalarda yer alır.' },
  buyuk: { name: 'Büyük papillalar', group: 'Dil kökü', info: 'Dilin arka kısmında V şeklinde dizilen büyük papillalardır; yanlarında çok sayıda tat tomurcuğu bulunur.' },
  oluk: { name: 'Orta oluk', group: 'Dil yüzeyi', info: 'Dili iki yarıya ayıran ortadaki çizgi.' },
};
const BUD = {
  kemo: { name: 'Kemoreseptör hücreler', group: 'Tat tomurcuğu', info: 'Tükürükte çözünen tat moleküllerini algılar ve tat alma sinirleriyle bağlantılıdır.' },
  destek: { name: 'Destek hücreleri', group: 'Tat tomurcuğu', info: 'Kemoreseptörlerin arasında bulunan, onları destekleyen hücreler.' },
  por: { name: 'Tat poru', group: 'Tat tomurcuğu', info: 'Tat moleküllerinin tomurcuğa girdiği açıklık.' },
  tukuruk: { name: 'Tükürük', group: 'Ağız', info: 'Çiğneme sırasında çözünen maddeler tükürükte kemoreseptörlere ulaşır. Reseptörler yalnızca sıvı içinde çözünmüş molekülleri algılar.' },
  epitel: { name: 'Dil epiteli', group: 'Papilla', info: 'Tat tomurcuğu papillanın epitel dokusuna gömülüdür.' },
  sinir: { name: 'Duyu nöronu (tat siniri)', group: 'Sinir', info: 'Uyartıları önce talamusa, ardından beyin kabuğundaki tat alma merkezine taşır.' },
};
const TASTES = [
  { n: 'Tuzlu', col: 0x3b82f6, ex: 'sofra tuzu' },
  { n: 'Tatlı', col: 0xec4899, ex: 'şeker, çikolata' },
  { n: 'Ekşi', col: 0xeab308, ex: 'limon' },
  { n: 'Acı', col: 0x8b5cf6, ex: 'kahve çekirdeği' },
  { n: 'Umami', col: 0x16a34a, ex: 'domates, glutamat' },
];

export function mountDil() {
  const s1 = tongueViewer();
  const s2 = budViewer();
  const stops = [oliveSim(), ageSim()];
  return () => { s1(); s2(); stops.forEach(s => s()); };
}

function tongueViewer() {
  const host = $('#tongue3d');
  const v = createViewer(host, { cam: [2.4, 3.1, 3.9], target: [0, 0, 0.1], parts: TONGUE, minD: 2.5, maxD: 14 });
  tools(host, v);
  explorer(v, $('#tongueChips'), $('#tongueInfo'), TONGUE);
  const g = new THREE.Group(); v.root.add(g);
  const XS = 1.45, YS = 0.48, ZS = 2.3;
  const xsAt = (z) => XS * (z > 0 ? 1 - 0.38 * Math.pow(z / ZS, 2) : 1);
  const geo = new THREE.SphereGeometry(1, 96, 64); const p = geo.attributes.position; const t = V();
  for (let i = 0; i < p.count; i++) {
    t.fromBufferAttribute(p, i);
    let z = t.z * ZS, x = t.x * xsAt(z), y = t.y * YS;
    if (y > 0) y -= 0.08 * Math.exp(-Math.pow(x / 0.16, 2)) * (1 - Math.abs(z) / ZS);
    else y *= 0.55;
    p.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  const body = new THREE.Mesh(geo, mat(0xe57f88, { rough: 0.65 })); g.add(body); v.addPart('dil', body);
  const topY = (x, z) => { const xs = xsAt(z); const q = 1 - Math.pow(x / xs, 2) - Math.pow(z / ZS, 2); if (q <= 0) return null; let y = YS * Math.sqrt(q); y -= 0.08 * Math.exp(-Math.pow(x / 0.16, 2)) * (1 - Math.abs(z) / ZS); return y; };
  const R = rng(3);
  const dummy = new THREE.Object3D();
  const fil = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 4), mat(0xf6b6bb, { rough: 0.8 }), 1400);
  let n = 0;
  while (n < 1400) { const x = (R() - 0.5) * 2.8, z = (R() - 0.5) * 4.4; const y = topY(x, z); if (y === null || y < 0.12 || z < -1.9) continue; dummy.position.set(x, y + 0.01, z); dummy.scale.setScalar(0.7 + R() * 0.6); dummy.updateMatrix(); fil.setMatrixAt(n++, dummy.matrix); }
  g.add(fil); v.addPart('papilla', fil);
  const fun = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0xd23c4f, { rough: 0.5 }), 110);
  n = 0;
  while (n < 110) { const x = (R() - 0.5) * 2.8, z = -0.6 + R() * 2.9; const y = topY(x, z); if (y === null || y < 0.1) continue; const edge = Math.abs(x) / xsAt(z); if (z < 1.4 && edge < 0.5 && R() < 0.8) continue; dummy.position.set(x, y + 0.02, z); dummy.scale.setScalar(0.8 + R() * 0.5); dummy.updateMatrix(); fun.setMatrixAt(n++, dummy.matrix); }
  g.add(fun); v.addPart('papilla', fun);
  const bigM = mat(0xc22f45, { rough: 0.5 });
  for (let i = 0; i < 9; i++) {
    const s = (i - 4) / 4; const x = s * 0.95, z = -1.45 + Math.abs(s) * 0.55; const y = topY(x, z) || 0.3;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.08, 18), bigM); b.position.set(x, y + 0.02, z); g.add(b); v.addPart('buyuk', b);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 18), bigM); ring.rotation.x = Math.PI / 2; ring.position.set(x, y + 0.01, z); g.add(ring); v.addPart('buyuk', ring);
  }
  const lab = (k, t2, pos) => v.addLabel(k, t2, A(g, pos), [0, 0, 0]);
  lab('dil', 'Dil', [1.1, 0.1, 1.4]); lab('papilla', 'Papillalar', [-0.7, 0.42, 0.8]); lab('buyuk', 'Büyük papillalar', [0.95, 0.4, -1.0]); lab('oluk', 'Orta oluk', [0, 0.42, 0.4]);
  return () => v.dispose();
}

function budViewer() {
  const host = $('#bud3d');
  const v = createViewer(host, { cam: [3.0, 2.0, 6.4], target: [0, 0.2, 0], parts: BUD, minD: 2.5, maxD: 14 });
  tools(host, v);
  explorer(v, $('#budChips'), $('#budInfo'), BUD);
  const g = new THREE.Group(); v.root.add(g);
  const epi = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.9, 3), mat(0xffb3b3, { opacity: 0.14 })); epi.position.y = 0.05; g.add(epi); v.addPart('epitel', epi);
  const saliva = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.3, 3), mat(0x9fd8ff, { opacity: 0.28 })); saliva.position.y = 1.65; g.add(saliva); v.addPart('tukuruk', saliva);
  const pore = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 10, 30), mat(0x5a1a24)); pore.rotation.x = Math.PI / 2; pore.position.y = 1.5; g.add(pore); v.addPart('por', pore);
  const cells = [];
  const N = 15;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2;
    const isRec = i % 3 !== 2;
    const type = isRec ? cells.filter(c => c.type >= 0).length % 5 : -1;
    const B = V(Math.cos(a) * 0.8, -0.85, Math.sin(a) * 0.8);
    const T = V(Math.cos(a) * 0.15, 1.3, Math.sin(a) * 0.15);
    const len = B.distanceTo(T);
    const dir = T.clone().sub(B).normalize();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, len - 0.28, 6, 14), mat(isRec ? TASTES[type].col : 0xf3d1d6, { rough: 0.4 }));
    m.position.copy(B).lerp(T, 0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
    g.add(m); v.addPart(isRec ? 'kemo' : 'destek', m);
    const gl = glow(isRec ? TASTES[type].col : 0xffffff, 0.1); gl.position.copy(m.position).add(V(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25)); g.add(gl);
    cells.push({ m, type, gl, tipPos: T.clone().sub(dir.clone().multiplyScalar(0.12)) });
  }
  const mvM = mat(0xffe0e6);
  cells.forEach(c => { if (c.type < 0) return; const t = tube([c.tipPos, c.tipPos.clone().lerp(V(0, 1.5, 0), 0.6)], 0.012, mvM, 4, 4); g.add(t); v.addPart('kemo', t); });
  const nerveM = mat(0xf2c14e);
  const nerves = [[-0.5, 0.3], [0.1, -0.4], [0.5, 0.2]].map(([x, z]) => { const t = tube([[x * 0.6, -0.9, z * 0.6], [x, -1.6, z], [x * 1.4, -2.3, z], [x * 1.6, -3.0, z]], 0.05, nerveM, 20, 6); g.add(t); v.addPart('sinir', t); return t.userData.curve; });
  const lab = (k, t2, pos) => v.addLabel(k, t2, A(g, pos), [0, 0, 0]);
  lab('por', 'Tat poru', [0, 1.85, 0.3]); lab('kemo', 'Kemoreseptör', [0.95, 0.4, 0.4]); lab('destek', 'Destek hücresi', [-1.0, 0.1, -0.4]); lab('tukuruk', 'Tükürük', [-1.9, 1.7, 1.4]); lab('sinir', 'Duyu nöronu', [0.75, -2.4, 0.2]); lab('epitel', 'Epitel', [1.9, -1.0, 1.4]);
  const mols = [];
  const flashes = [];
  const read = $('#budRead');
  const R = rng(8);
  function taste(k) {
    const T = TASTES[k];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(T.col, { emissive: T.col, ei: 0.5 }));
      const from = V((R() - 0.5) * 3.4, 3.0 + R() * 0.8, (R() - 0.5) * 2);
      const targetsK = cells.filter(c => c.type === k);
      const to = targetsK[i % targetsK.length].tipPos.clone();
      m.position.copy(from); g.add(m);
      mols.push({ m, from, mid: V((R() - 0.5) * 0.2, 1.55, (R() - 0.5) * 0.2), to, t: -i * 0.06 });
    }
    setTimeout(() => {
      cells.filter(c => c.type === k).forEach(c => flashes.push({ s: c.gl, t: 0 }));
      nerves.forEach((cu, i) => v.pulse(cu, { dur: 0.8, delay: i * 0.12, color: T.col, size: 0.4 }));
      read.textContent = `${T.n} (${T.ex}): tükürükte çözünen moleküller tat porundan girdi → ${T.n.toLocaleLowerCase('tr')} tada duyarlı kemoreseptörler uyarıldı → duyu siniri → talamus → beyin kabuğu.`;
    }, 1300);
  }
  document.querySelectorAll('#tasteBtns [data-t]').forEach(b => b.onclick = () => taste(+b.dataset.t));
  v.onFrame((dt) => {
    for (let i = mols.length - 1; i >= 0; i--) {
      const o = mols[i]; o.t += dt;
      if (o.t < 0) continue;
      if (o.t < 0.8) o.m.position.lerpVectors(o.from, o.mid, ease(o.t / 0.8)); else o.m.position.lerpVectors(o.mid, o.to, ease((o.t - 0.8) / 0.5));
      if (o.t > 2.2) { g.remove(o.m); o.m.geometry.dispose(); o.m.material.dispose(); mols.splice(i, 1); }
    }
    for (let i = flashes.length - 1; i >= 0; i--) { const f = flashes[i]; f.t += dt; f.s.scale.setScalar(0.1 + Math.sin(Math.min(1, f.t / 1.1) * Math.PI) * 1.3); if (f.t > 1.1) { f.s.scale.setScalar(0.1); flashes.splice(i, 1); } }
  });
  return () => v.dispose();
}

function oliveSim() {
  const c = $('#oliveCanvas'); const { ctx, W, H } = setupCanvas(c);
  const data = [[7, 6, 7], [2, 6, 7], [7, 6, 9]];
  const names = ['Normal (22 °C)', 'Burun klipsi', '38 °C sunum'];
  const attrs = ['Meyvemsi aroma', 'Acılık', 'Boğazda yanma'];
  const why = [
    'Normal koşulda M örneği: meyvemsi aroma 7, acılık 6, boğazda yanma 7.',
    'Burun klipsi takılınca yalnız meyvemsi aroma 7 → 2 düştü. Aroma algısı burun epitelindeki kemoreseptörlere de bağlıdır; acılık ve yanma değişmedi.',
    '38 °C sunumda yalnız boğazda yanma 7 → 9 arttı. Yanmayı oluşturan yutaktaki serbest sinir uçları (nosiseptörler) hem kimyasal hem ısıl uyaranla etkinleşir.',
  ];
  let sel = 0;
  const cols = ['#ff8fa0', '#6aa8ff', '#ffc94d'];
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const x0 = 70, gw = (W - x0 - 20) / 3, base = H - 46, sc = (base - 30) / 10;
    ctx.font = C.mono; ctx.textAlign = 'right'; ctx.fillStyle = C.dim;
    [0, 5, 10].forEach(v => { const y = base - v * sc; ctx.strokeStyle = C.faint; ctx.beginPath(); ctx.moveTo(x0 - 6, y); ctx.lineTo(W - 20, y); ctx.stroke(); ctx.fillText(v, x0 - 10, y + 4); });
    attrs.forEach((a, i) => {
      const gx = x0 + i * gw + 20;
      data.forEach((d, j) => {
        const bw = (gw - 60) / 3; const x = gx + j * (bw + 6); const h = d[i] * sc;
        ctx.globalAlpha = j === sel ? 1 : 0.28; ctx.fillStyle = cols[j]; ctx.fillRect(x, base - h, bw, h); ctx.globalAlpha = 1;
        if (j === sel) { ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(d[i], x + bw / 2, base - h - 6); }
      });
      ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.font = C.sans; ctx.fillText(a, gx + (gw - 40) / 2, base + 22); ctx.font = C.mono;
    });
    ctx.textAlign = 'left'; names.forEach((n, j) => { ctx.fillStyle = cols[j]; ctx.globalAlpha = j === sel ? 1 : 0.5; ctx.fillRect(x0 + j * 170, 10, 10, 10); ctx.fillStyle = C.ink; ctx.fillText(n, x0 + j * 170 + 16, 20); ctx.globalAlpha = 1; });
    $('#oliveRead').textContent = why[sel];
  }
  segValue($('#oliveCond'), 'c', x => { sel = +x; draw(); });
  draw();
  return () => {};
}

function ageSim() {
  const c = $('#ageCanvas'); const { ctx, W, H } = setupCanvas(c);
  const R = rng(12); const pts = []; for (let i = 0; i < 260; i++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()); pts.push([Math.cos(a) * r, Math.sin(a) * r, R()]); }
  function draw() {
    const age = +$('#ageY').value, cold = $('#ageCold').checked;
    $('#ageOut').textContent = age;
    const buds = age < 40 ? 1 : Math.max(0.45, 1 - (age - 40) / 45 * 0.55);
    const smell = cold ? 0.15 : 1;
    const taste = buds * (0.45 + 0.55 * smell);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const cx = 170, cy = H / 2;
    ctx.fillStyle = '#e57f88'; ctx.beginPath(); ctx.ellipse(cx, cy, 120, 82, 0, 0, 7); ctx.fill();
    pts.forEach(([x, y, k]) => { if (k > buds) return; ctx.fillStyle = '#c22f45'; ctx.beginPath(); ctx.arc(cx + x * 105, cy + y * 68, 3, 0, 7); ctx.fill(); });
    ctx.font = C.mono; ctx.fillStyle = C.dim; ctx.textAlign = 'center'; ctx.fillText('tat tomurcukları', cx, H - 10);
    const bx = 340, bw = W - bx - 30;
    [['Tat tomurcuğu sayısı (göreli)', buds, '#ff8fa0'], ['Koku katkısı', smell, '#ffc94d'], ['Algılanan lezzet', taste, '#43d18a']].forEach(([n, v2, col], i) => {
      const y = 44 + i * 58;
      ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.font = C.sans; ctx.fillText(n, bx, y);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(bx, y + 10, bw, 16);
      ctx.fillStyle = col; ctx.fillRect(bx, y + 10, bw * v2, 16);
      ctx.font = C.mono; ctx.fillStyle = C.dim; ctx.textAlign = 'right'; ctx.fillText('%' + Math.round(v2 * 100), bx + bw, y);
    });
    $('#ageRead').textContent = (age >= 50 ? 'Yaşla tat tomurcuğu sayısı azaldı; tat duyusu zayıfladı. ' : 'Tat tomurcukları yerinde. ') + (cold ? 'Nezlede koku alınamadığı için besinin tadı tam olarak algılanamıyor.' : '');
  }
  $('#ageY').oninput = draw; $('#ageCold').onchange = draw; draw();
  return () => {};
}
