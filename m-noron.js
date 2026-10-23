// 1.5.1 Reseptörler · 1.5.2 Nöron · 1.5.2a Sinaps
import { THREE, createViewer, explorer, tools, mat, tube, V, rng, glow } from './viewer.js';
import { setupCanvas, loop, segValue, C, initMatch } from './app.js';
const $ = (s) => document.querySelector(s);

function anchor(group, pos) { const a = new THREE.Object3D(); a.position.set(...pos); group.add(a); return a; }
function alongCurve(curve, u, mesh) {
  curve.getPointAt(u, mesh.position);
  const tg = curve.getTangentAt(u);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), tg.normalize());
  return mesh;
}
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

/* =====================================================================
   1.5.1  RESEPTÖR GALERİSİ
   ===================================================================== */
const REC_PARTS = {
  p_kapsul: { name: 'Kapsül katmanları', info: 'Soğan zarı gibi üst üste dizilmiş bağ doku katmanları. Basınçla şekil değiştirir ve sinir ucunu uyarır.' },
  p_uc: { name: 'Sinir ucu', info: 'Mekanik enerjiyi uyartıya dönüştüren duyu nöronunun ucu.' },
  p_sinir: { name: 'Duyu nöronu', info: 'Oluşan uyartıyı merkezî sinir sistemine taşır.' },
  k_hucre: { name: 'Kemoreseptör hücre', info: 'Kimyasal maddeleri algılayan özelleşmiş hücre. Burunda koku reseptör nöronları, dilde tat tomurcuğu hücreleri.' },
  k_sil: { name: 'Siller', info: 'Mukusa uzanan uzantılar; moleküller buradaki reseptörlere bağlanır.' },
  k_mukus: { name: 'Mukus', info: 'Moleküller mukusta çözünerek reseptörlere ulaşır.' },
  k_destek: { name: 'Destek hücresi', info: 'Reseptör hücrelerini destekler.' },
  k_sinir: { name: 'Akson', info: 'Uyartıyı beyne taşır.' },
  t_doku: { name: 'Deri dokusu', info: 'Termoreseptörler çoğunlukla deri ve dilde bulunur.' },
  t_uc: { name: 'Termoreseptör ucu', info: 'Sıcak ve soğuk gibi ısı değişimlerini algılar. Sıcaklık deri sıcaklığından ne kadar uzaksa uyartı o kadar sık oluşur.' },
  t_sinir: { name: 'Duyu nöronu', info: 'Uyartıyı taşır.' },
  n_uc: { name: 'Serbest sinir uçları', info: 'Ağrı reseptörleri (nosiseptörler) serbest sinir uçlarıdır; doku hasarına yol açabilecek uyaranları algılar. Beyin hariç tüm vücutta bulunur.' },
  n_doku: { name: 'Doku', info: 'Hasar gören doku kimyasal maddeler salar; bunlar da nosiseptörleri uyarır.' },
  n_sinir: { name: 'Duyu nöronu', info: 'Ağrı uyartısını taşır.' },
  f_cubuk: { name: 'Çubuk hücresi', info: 'Loş ışıkta şekil ve hareketi algılar, siyah-beyaz görmeyi sağlar. Retinanın çevresinde yoğundur.' },
  f_rodopsin: { name: 'Rodopsin diskleri', info: 'Çubukların dış segmentindeki diskler rodopsin pigmenti taşır. Rodopsin ışıkta parçalanır, karanlıkta A vitamini kullanılarak yeniden sentezlenir.' },
  f_koni: { name: 'Koni hücresi', info: 'Yeterli ışıkta renkleri net algılar. Kırmızı, yeşil ve maviye duyarlı üç tipi vardır; sarı benekte yoğundur.' },
  f_noron: { name: 'Sinaptik uç ve nöron', info: 'Fotoreseptörde oluşan sinyal sinaps ile görme sinirine aktarılır.' },
};
const REC_INFO = {
  meka: { eb: 'Fiziksel uyaran', h: 'Mekanoreseptör', p: 'Dokunma, basınç, gerilme, hareket ve ses dalgaları gibi mekanik enerjiyi algılar. Deri ve kulakta bulunur. Modeldeki yapı, deride basıncı ve titreşimi algılayan Pacini cisimciğidir.', btn: 'Bastır' },
  kemo: { eb: 'Kimyasal uyaran', h: 'Kemoreseptör', p: 'Koku ve tat moleküllerini algılar; burun ve dilde bulunur. Moleküller mukusta çözünür, sillerdeki reseptörlere bağlanır ve hücrede uyartı başlar.', btn: 'Molekül gönder' },
  termo: { eb: 'Fiziksel uyaran', h: 'Termoreseptör', p: 'Sıcak, soğuk gibi ısı değişikliklerini algılar; çoğunlukla deri ve dilde bulunur. Sıcaklığı değiştir: deri sıcaklığından uzaklaştıkça uyartı sıklaşır.', btn: null },
  nosi: { eb: 'Fiziksel ve kimyasal uyaran', h: 'Ağrı reseptörü (nosiseptör)', p: 'Doku hasarına duyarlı serbest sinir uçlarıdır. Aşırı sıcak, basınç, kimyasallar ve iltihaplanma onları uyarır. Beyin hariç tüm vücutta bulunur.', btn: 'İğne batır' },
  foto: { eb: 'Fiziksel uyaran · elektromanyetik', h: 'Fotoreseptör', p: 'Elektromanyetik enerjinin bir formu olan ışığı algılar. Gözün ağ tabakasındaki çubuk ve koni hücreleri elektromanyetik reseptörlere örnektir.', btn: 'Işık ver' },
};

function buildPacini(v) {
  const g = new THREE.Group(); v.root.add(g);
  const nerve = tube([[0, -0.85, 0], [0, -1.8, 0.1], [0.18, -2.8, 0], [0, -3.9, 0]], 0.07, mat(0xf2c14e, { emissive: 0x2a1b00 }), 40, 8);
  g.add(nerve); v.addPart('p_sinir', nerve);
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 20), mat(0xf9e3a6, { rough: 0.35 }));
    alongCurve(nerve.userData.curve, 0.3 + i * 0.17, m); g.add(m); v.addPart('p_sinir', m);
  }
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.9, 12), mat(0xffd34d, { emissive: 0x6b4b00, ei: 0.6 }));
  core.position.y = 0.05; g.add(core); v.addPart('p_uc', core);
  const shells = new THREE.Group(); g.add(shells);
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), mat(i % 2 ? 0xffd9cf : 0xffc4b5, { opacity: 0.2 - i * 0.017, side: THREE.DoubleSide }));
    s.scale.set(0.28 + i * 0.15, 0.7 + i * 0.21, 0.28 + i * 0.15); s.renderOrder = 10 - i;
    shells.add(s);
  }
  v.addPart('p_kapsul', shells);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 1.8), mat(0xf0b39c, { rough: 0.8 }));
  plate.position.y = 3.6; g.add(plate);
  v.addLabel('p_kapsul', 'Kapsül katmanları', anchor(g, [1.15, 0.7, 0]), [0, 0, 0]);
  v.addLabel('p_uc', 'Sinir ucu', anchor(g, [0, 0.9, 0.1]), [0, 0, 0]);
  v.addLabel('p_sinir', 'Duyu nöronu (miyelinli)', anchor(g, [0.3, -2.8, 0]), [0, 0, 0]);
  let t = -1;
  return {
    g,
    go() { if (t >= 0) return; t = 0; },
    update(dt) {
      if (t < 0) return;
      t += dt;
      const press = t < 0.35 ? ease(t / 0.35) : t < 0.75 ? 1 : 1 - ease((t - 0.75) / 0.4);
      plate.position.y = 3.6 - press * 1.55;
      shells.scale.set(1 + press * 0.1, 1 - press * 0.14, 1 + press * 0.1);
      if (t > 0.35 && !this.sent) { this.sent = true; v.pulse(nerve.userData.curve, { dur: 0.9 }); v.pulse(nerve.userData.curve, { dur: 0.9, delay: 0.25 }); this.onFire && this.onFire('Basınç kapsülü sıkıştırdı → sinir ucunda uyartı oluştu → duyu nöronuyla taşınıyor'); }
      if (t > 1.3) { t = -1; this.sent = false; }
    },
  };
}

function buildChemo(v) {
  const g = new THREE.Group(); v.root.add(g);
  const mucus = new THREE.Mesh(new THREE.BoxGeometry(5, 0.7, 2.6), mat(0x7cc4ff, { opacity: 0.22 }));
  mucus.position.y = 1.95; g.add(mucus); v.addPart('k_mukus', mucus);
  const cellM = mat(0x8b5cf6, { rough: 0.4 });
  const cell = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.1, 8, 24), cellM); cell.position.y = -0.15; g.add(cell);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), mat(0x3b0f7a)); nuc.position.set(0, -0.2, 0.25); g.add(nuc);
  const den = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.0, 12), cellM); den.position.y = 1.05; g.add(den);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), cellM); knob.position.y = 1.6; g.add(knob);
  [cell, nuc, den, knob].forEach(m => v.addPart('k_hucre', m));
  const tips = [];
  const ciliaM = mat(0xc4b5fd, { emissive: 0x1a0040 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - 0.5) * 2.2;
    const tip = V(Math.sin(a) * 1.0, 2.15 + Math.cos(a) * 0.05, (i % 2 ? 0.25 : -0.25));
    const c = tube([[0, 1.65, 0], [Math.sin(a) * 0.4, 1.95, tip.z * 0.5], tip], 0.025, ciliaM, 12, 5);
    g.add(c); v.addPart('k_sil', c); tips.push(tip);
  }
  const supM = mat(0xf3a6b8, { rough: 0.7 });
  [-1.1, 1.1].forEach(x => { const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.9, 6, 18), supM); s.position.set(x, 0.35, -0.15); g.add(s); v.addPart('k_destek', s); });
  const axon = tube([[0, -0.75, 0], [0.1, -1.8, 0], [-0.1, -2.8, 0], [0, -3.9, 0]], 0.07, mat(0xf2c14e), 30, 8);
  g.add(axon); v.addPart('k_sinir', axon);
  const mols = [];
  const R = rng(5);
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), mat(0x43d18a, { emissive: 0x0b4a2a, flat: true }));
    m.userData.home = V((R() - 0.5) * 3.4, 3.2 + R() * 1.2, (R() - 0.5) * 1.4);
    m.position.copy(m.userData.home); g.add(m); mols.push(m);
  }
  const gl = glow(0x43d18a, 2.4); gl.position.y = 0.4; gl.material.opacity = 0; g.add(gl);
  v.addLabel('k_mukus', 'Mukus', anchor(g, [-2.0, 2.0, 0.8]), [0, 0, 0]);
  v.addLabel('k_sil', 'Siller', anchor(g, [0.9, 2.25, 0.3]), [0, 0, 0]);
  v.addLabel('k_hucre', 'Kemoreseptör hücre', anchor(g, [0, -0.2, 0.45]), [0, 0, 0]);
  v.addLabel('k_destek', 'Destek hücresi', anchor(g, [1.5, 0.6, 0.2]), [0, 0, 0]);
  v.addLabel('k_sinir', 'Akson', anchor(g, [0.2, -2.9, 0]), [0, 0, 0]);
  let t = -1;
  return {
    g,
    go() { if (t >= 0) return; t = 0; },
    update(dt, time) {
      mols.forEach((m, i) => { m.rotation.x += dt * 0.8; m.rotation.y += dt * 0.6; if (t < 0) m.position.y = m.userData.home.y + Math.sin(time * 1.4 + i) * 0.08; });
      if (t < 0) return;
      t += dt;
      const u = ease(t / 1.2);
      mols.forEach((m, i) => { const tg = tips[i % tips.length]; m.position.lerpVectors(m.userData.home, tg, u); m.visible = t < 2.6; });
      gl.material.opacity = t > 1.2 && t < 2.4 ? Math.sin((t - 1.2) / 1.2 * Math.PI) * 0.9 : 0;
      if (t > 1.2 && !this.sent) { this.sent = true; [0, 0.25, 0.5].forEach(d => v.pulse(axon.userData.curve, { dur: 0.9, delay: d })); this.onFire && this.onFire('Moleküller mukusta çözündü → sillerdeki reseptörlere bağlandı → hücrede uyartı oluştu'); }
      if (t > 2.8) { t = -1; this.sent = false; mols.forEach(m => { m.position.copy(m.userData.home); m.visible = true; }); }
    },
  };
}

function branchy(g, v, key, R, start, depth, len, color, list) {
  const M = mat(color, { emissive: 0x000000 });
  function br(p0, dir, l, r, d) {
    const p1 = p0.clone().addScaledVector(dir, l);
    const mid = p0.clone().lerp(p1, 0.5).add(V((R() - 0.5) * l * 0.3, 0, (R() - 0.5) * l * 0.3));
    const t = tube([p0, mid, p1], r, M, 10, 6); g.add(t); v.addPart(key, t); list && list.push(t);
    if (d > 0) for (let k = 0; k < 2 + (R() < 0.4 ? 1 : 0); k++) {
      const nd = dir.clone().add(V((R() - 0.5) * 1.4, 0.15, (R() - 0.5) * 1.4)).normalize();
      if (nd.y < 0.25) nd.y = 0.25;
      br(p1, nd.normalize(), l * 0.72, r * 0.7, d - 1);
    }
  }
  br(start, V(0, 1, 0), len, 0.07, depth);
  return M;
}

function buildThermo(v) {
  const g = new THREE.Group(); v.root.add(g);
  const block = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.6, 2.6), mat(0xffb3b3, { opacity: 0.13 }));
  block.position.y = 0.25; g.add(block); v.addPart('t_doku', block);
  const top = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.25, 2.6), mat(0xf6c1a8, { opacity: 0.45 }));
  top.position.y = 1.67; g.add(top); v.addPart('t_doku', top);
  const R = rng(9);
  const endM = branchy(g, v, 't_uc', R, V(0, -1.05, 0), 3, 0.95, 0xffd34d);
  const nerve = tube([[0, -1.05, 0], [0.12, -2.0, 0], [-0.1, -3.0, 0], [0, -3.9, 0]], 0.07, mat(0xf2c14e), 30, 8);
  g.add(nerve); v.addPart('t_sinir', nerve);
  const rev = new THREE.CatmullRomCurve3(nerve.userData.curve.points.slice());
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.45, 28, 18), mat(0xff5a2b, { emissive: 0xff3b10, ei: 0.8 })); sun.position.y = 2.7; g.add(sun);
  const sunGlow = glow(0xff6a2b, 2.6); sunGlow.position.y = 2.7; g.add(sunGlow);
  const ice = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat(0xbfe6ff, { opacity: 0.7, rough: 0.1 })); ice.position.y = 2.7; ice.rotation.set(0.4, 0.6, 0); g.add(ice);
  v.addLabel('t_uc', 'Termoreseptör (serbest uç)', anchor(g, [0.9, 0.9, 0.3]), [0, 0, 0]);
  v.addLabel('t_doku', 'Deri', anchor(g, [-1.9, 1.3, 1.2]), [0, 0, 0]);
  v.addLabel('t_sinir', 'Duyu nöronu', anchor(g, [0.25, -2.9, 0]), [0, 0, 0]);
  let T = 33, acc = 0;
  const api = {
    g,
    setT(x) {
      T = x;
      const d = (T - 33) / 17;
      const hot = d > 0;
      endM.emissive.setHex(hot ? 0xff2a1a : 0x2a7bff); endM.emissiveIntensity = Math.min(1, Math.abs(d)) * 0.9;
      sun.visible = sunGlow.visible = T > 36; ice.visible = T < 28;
      const s = 0.6 + Math.min(1, Math.abs(d)) * 0.7; sun.scale.setScalar(s); ice.scale.setScalar(s);
      const rate = 0.3 + Math.min(1.3, Math.abs(d)) * 4;
      api.onFire && api.onFire(`${T} °C → ${hot ? 'sıcak' : T < 30 ? 'soğuk' : 'deri sıcaklığına yakın'} · yaklaşık ${rate.toFixed(1)} uyartı/sn (simülasyon)`);
    },
    go() {},
    update(dt) {
      const rate = 0.3 + Math.min(1.3, Math.abs((T - 33) / 17)) * 4;
      acc += dt * rate;
      if (acc > 1) { acc -= 1; v.pulse(rev, { dur: 0.8, color: T > 33 ? 0xffa36b : 0x8fc3ff }); }
      ice.rotation.y += dt * 0.4;
    },
  };
  return api;
}

function buildNoci(v) {
  const g = new THREE.Group(); v.root.add(g);
  const block = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.6, 2.6), mat(0xffb3b3, { opacity: 0.13 }));
  block.position.y = 0.25; g.add(block); v.addPart('n_doku', block);
  const top = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.25, 2.6), mat(0xf6c1a8, { opacity: 0.45 }));
  top.position.y = 1.67; g.add(top); v.addPart('n_doku', top);
  const R = rng(21);
  const M1 = branchy(g, v, 'n_uc', R, V(-0.6, -1.05, 0), 3, 0.9, 0xffd34d);
  const M2 = branchy(g, v, 'n_uc', R, V(0.6, -1.05, 0), 3, 0.9, 0xffd34d);
  const nerve = tube([[-0.6, -1.05, 0], [0, -1.6, 0], [0.6, -1.05, 0]], 0.07, mat(0xf2c14e), 20, 8);
  g.add(nerve); v.addPart('n_sinir', nerve);
  const down = tube([[0, -1.6, 0], [0.1, -2.6, 0], [0, -3.9, 0]], 0.08, mat(0xf2c14e), 20, 8);
  g.add(down); v.addPart('n_sinir', down);
  const needle = new THREE.Group(); g.add(needle);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.8, 16), mat(0xdfe6ee, { metal: 0.8, rough: 0.2 })); cone.rotation.x = Math.PI; needle.add(cone);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 20), mat(0xff3b4e)); handle.position.y = 1.3; needle.add(handle);
  needle.position.set(0.3, 3.4, 0.2);
  const hurt = glow(0xff1a2e, 0.1); hurt.position.set(0.3, 1.5, 0.2); g.add(hurt);
  v.addLabel('n_uc', 'Serbest sinir uçları', anchor(g, [-1.3, 0.9, 0.3]), [0, 0, 0]);
  v.addLabel('n_sinir', 'Duyu nöronu', anchor(g, [0.25, -2.9, 0]), [0, 0, 0]);
  let t = -1;
  return {
    g,
    go() { if (t >= 0) return; t = 0; },
    update(dt) {
      if (t < 0) return;
      t += dt;
      const p = t < 0.25 ? ease(t / 0.25) : t < 0.9 ? 1 : 1 - ease((t - 0.9) / 0.4);
      needle.position.y = 3.4 - p * 1.75;
      const h = t > 0.25 && t < 2 ? Math.sin(Math.min(1, (t - 0.25) / 1.75) * Math.PI) : 0;
      hurt.scale.setScalar(0.1 + h * 3.2);
      [M1, M2].forEach(M => { M.emissive.setHex(0xff2a1a); M.emissiveIntensity = h * 0.9; });
      if (t > 0.25 && !this.sent) {
        this.sent = true;
        for (let i = 0; i < 6; i++) v.pulse(down.userData.curve, { dur: 0.6, delay: i * 0.13, color: 0xff6b6b });
        this.onFire && this.onFire('Doku hasarı → serbest sinir uçları yüksek sıklıkta uyartı üretti → ağrı algısı');
      }
      if (t > 2.1) { t = -1; this.sent = false; }
    },
  };
}

function buildPhoto(v) {
  const g = new THREE.Group(); v.root.add(g);
  const discs = [];
  function photo(x, isRod) {
    const col = isRod ? 0x5b8cff : 0xe63946;
    const key = isRod ? 'f_cubuk' : 'f_koni';
    const body = mat(col, { rough: 0.45 });
    if (isRod) {
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.1, 28, 1, true), mat(col, { opacity: 0.3, side: THREE.DoubleSide }));
      outer.position.set(x, 1.85, 0); g.add(outer); v.addPart(key, outer);
      for (let i = 0; i < 22; i++) {
        const d = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.04, 24), mat(0x9b7bff, { emissive: 0x000000 }));
        d.position.set(x, 0.88 + i * 0.092, 0); g.add(d); v.addPart('f_rodopsin', d); discs.push(d);
      }
    } else {
      const outer = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.5, 28, 1, true), mat(col, { opacity: 0.3, side: THREE.DoubleSide }));
      outer.position.set(x, 1.55, 0); g.add(outer); v.addPart(key, outer);
      for (let i = 0; i < 15; i++) {
        const r = 0.33 * (1 - i / 16);
        const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.04, 24), mat(0xff8a8a, { emissive: 0x000000 }));
        d.position.set(x, 0.86 + i * 0.092, 0); g.add(d); v.addPart(key, d); discs.push(d);
      }
    }
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(isRod ? 0.24 : 0.36, 0.22, 0.85, 24), body); inner.position.set(x, 0.38, 0); g.add(inner); v.addPart(key, inner);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), body); neck.position.set(x, -0.25, 0); g.add(neck); v.addPart(key, neck);
    const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), mat(isRod ? 0x2f4fb8 : 0x9b1c27)); nuc.position.set(x, -0.7, 0); nuc.scale.y = 1.3; g.add(nuc); v.addPart(key, nuc);
    const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 10), body); ax.position.set(x, -1.35, 0); g.add(ax); v.addPart(key, ax);
    const term = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat(0xffb347, { emissive: 0x3a2000 })); term.position.set(x, -1.75, 0); g.add(term); v.addPart('f_noron', term);
    const nerve = tube([[x, -1.8, 0], [x * 0.6, -2.6, 0], [0, -3.2, 0], [0, -3.9, 0]], 0.06, mat(0xf2c14e), 30, 8);
    g.add(nerve); v.addPart('f_noron', nerve);
    return nerve.userData.curve;
  }
  const c1 = photo(-0.95, true), c2 = photo(0.95, false);
  const photons = [];
  for (let i = 0; i < 8; i++) { const p = glow(0xfff1a8, 0.35); p.visible = false; g.add(p); photons.push(p); }
  v.addLabel('f_cubuk', 'Çubuk', anchor(g, [-1.6, 0.4, 0]), [0, 0, 0]);
  v.addLabel('f_rodopsin', 'Rodopsin diskleri', anchor(g, [-1.6, 2.2, 0]), [0, 0, 0]);
  v.addLabel('f_koni', 'Koni', anchor(g, [1.65, 1.5, 0]), [0, 0, 0]);
  v.addLabel('f_noron', 'Sinaptik uç', anchor(g, [0, -1.75, 0]), [0, 0, 0]);
  let t = -1;
  return {
    g,
    go() { if (t >= 0) return; t = 0; },
    update(dt) {
      if (t < 0) return;
      t += dt;
      photons.forEach((p, i) => {
        const x = i < 4 ? -0.95 : 0.95; const lt = t - (i % 4) * 0.12;
        p.visible = lt > 0 && lt < 0.8;
        p.position.set(x + ((i % 4) - 1.5) * 0.08, 4.2 - Math.min(1, lt / 0.8) * 2.4, 0.3);
      });
      const lit = t > 0.7 && t < 2.2 ? Math.sin((t - 0.7) / 1.5 * Math.PI) : 0;
      discs.forEach(d => { d.material.emissive.setHex(0xffe08a); d.material.emissiveIntensity = lit * 0.8; });
      if (t > 0.9 && !this.sent) {
        this.sent = true;
        v.pulse(c1, { dur: 0.9 }); v.pulse(c2, { dur: 0.9, delay: 0.1 });
        this.onFire && this.onFire('Işık dış segmentteki pigmentleri etkiledi → fotoreseptörde sinyal → sinapsla görme sinirine');
      }
      if (t > 2.4) { t = -1; this.sent = false; }
    },
  };
}

export function mountReseptor() {
  const host = $('#rec3d');
  const v = createViewer(host, { cam: [0, 0.6, 13], target: [0, -0.1, 0], parts: REC_PARTS, minD: 4, maxD: 20 });
  tools(host, v);
  const read = $('#recRead');
  const models = { meka: buildPacini(v), kemo: buildChemo(v), termo: buildThermo(v), nosi: buildNoci(v), foto: buildPhoto(v) };
  let cur = 'meka';
  Object.values(models).forEach(m => { m.onFire = (s) => { read.textContent = s; }; });
  v.onSelect = (k) => { const d = REC_PARTS[k]; if (d) read.textContent = `${d.name}: ${d.info}`; };
  v.onFrame((dt, t) => models[cur].update(dt, t));
  const tempWrap = $('#recTempWrap'), btn = $('#recGo');
  function show(k) {
    cur = k;
    Object.entries(models).forEach(([key, m]) => { m.g.visible = key === k; });
    const I = REC_INFO[k];
    $('#recInfo').innerHTML = `<p class="eyebrow">${I.eb}</p><h4>${I.h}</h4><p>${I.p}</p>`;
    btn.hidden = !I.btn; if (I.btn) btn.textContent = I.btn;
    tempWrap.hidden = k !== 'termo';
    read.textContent = k === 'termo' ? '' : 'Uyaran bekleniyor';
    if (k === 'termo') models.termo.setT(+$('#recTemp').value);
    v.reset();
  }
  segValue($('#recSeg'), 'r', show);
  btn.onclick = () => models[cur].go();
  $('#recTemp').oninput = (e) => { $('#recTempOut').textContent = e.target.value + ' °C'; models.termo.setT(+e.target.value); };
  show('meka');

  // Uygulama 6 eşleştirme
  const box = $('#stimMatch');
  if (!box.dataset.ready) {
    box.dataset.ready = 1;
    initMatch(box,
      [['Isı', 'Termoreseptör'], ['Işık', 'Elektromanyetik reseptör'], ['Dokunma', 'Mekanoreseptör'], ['Basınç', 'Mekanoreseptör'], ['Elektrik', 'Elektromanyetik reseptör'], ['Manyetizma', 'Elektromanyetik reseptör'], ['Koku molekülü', 'Kemoreseptör'], ['Tat molekülü', 'Kemoreseptör']],
      ['Mekanoreseptör', 'Kemoreseptör', 'Termoreseptör', 'Elektromanyetik reseptör', 'Ağrı reseptörü'], $('#stimCheck'), $('#stimScore'));
  }
  return () => v.dispose();
}

/* =====================================================================
   1.5.2  NÖRON
   ===================================================================== */
const NEURON_PARTS = {
  dendrit: { name: 'Dendrit', group: 'Nöronun kısımları', info: 'Hücre gövdesinden çıkan çok sayıdaki kısa ve dallanmış uzantılardır. Diğer nöron ve reseptörlerden gelen uyarıları alır, elektrik sinyalleri hâlinde hücre gövdesine iletir.' },
  govde: { name: 'Hücre gövdesi', group: 'Nöronun kısımları', info: 'Çekirdek, organeller ve sitoplazmayı bulunduran kısımdır. Nöronun yaşamsal faaliyetleri burada gerçekleşir. Sitoplazmadaki nörofibriller nörona şekil verir ve madde taşınmasında görev alır.' },
  cekirdek: { name: 'Çekirdek', group: 'Hücre gövdesi', info: 'Hücrenin faaliyetlerini yönetir ve kalıtsal bilgiyi taşır.' },
  mitokondri: { name: 'Mitokondri', group: 'Hücre gövdesi', info: 'Nöronlarda enerji ihtiyacı fazla olduğu için çok sayıda mitokondri bulunur.' },
  akson: { name: 'Akson', group: 'Nöronun kısımları', info: 'Hücre gövdesinden çıkan, dendrite göre daha kalın ve uzun uzantıdır. İmpulsu hücre gövdesinden akson uçlarına doğru iletir. Akson çapı arttıkça iletim hızlanır.' },
  miyelin: { name: 'Miyelin kılıf', group: 'Akson', info: 'Schwann hücrelerinin akson etrafında oluşturduğu lipoprotein örtüdür. Elektriksel yalıtım sağlayarak uyartı iletimini hızlandırır.' },
  schwann: { name: 'Schwann hücresi', group: 'Akson', info: 'Akson etrafına sarılarak miyelin kılıfı oluşturan hücre (şıvan hücresi).' },
  ranvier: { name: 'Ranvier boğumu', group: 'Akson', info: 'Miyelin kılıfın kesintiye uğradığı, yalıtımsız boşluklardır. Miyelinli aksonda uyartı boğumdan boğuma atlayarak hızlı ilerler.' },
  aksonucu: { name: 'Akson ucu', group: 'Nöronun kısımları', info: 'Aksonun sonlandığı ve dallanarak genişlediği bölgedir. Salgıladığı kimyasallarla uyartının diğer nörona ya da hedef hücreye iletilmesini sağlar.' },
  sinaptik: { name: 'Sinaptik uçlar', group: 'Akson ucu', info: 'Akson ucundaki her dal, uyarıyı alıcı hücreye aktaran sinaptik uç ile sonlanır. Dallanmanın çok olması nöronun etki alanını genişletir.' },
};

export function mountNoron() {
  const host = $('#neuron3d');
  const v = createViewer(host, { cam: [4.2, 2.6, 18.5], target: [4.2, 0, 0], parts: NEURON_PARTS, minD: 3, maxD: 26 });
  tools(host, v);
  explorer(v, $('#neuronChips'), $('#neuronInfo'), NEURON_PARTS);
  const R = rng(11);
  const g = new THREE.Group(); v.root.add(g);
  // hücre gövdesi
  const sg = new THREE.IcosahedronGeometry(0.85, 5); const p = sg.attributes.position; const tmp = V();
  for (let i = 0; i < p.count; i++) { tmp.fromBufferAttribute(p, i); const n = 1 + 0.07 * Math.sin(tmp.x * 5) * Math.cos(tmp.y * 4) + 0.05 * Math.sin(tmp.z * 6); tmp.multiplyScalar(n); p.setXYZ(i, tmp.x, tmp.y, tmp.z); }
  sg.computeVertexNormals();
  const soma = new THREE.Mesh(sg, mat(0x9b6cff, { opacity: 0.5, rough: 0.3 })); g.add(soma); v.addPart('govde', soma);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 20), mat(0x4c1d95, { emissive: 0x220055, ei: 0.6 })); g.add(nuc); v.addPart('cekirdek', nuc);
  const nucl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), mat(0xe9d5ff)); nucl.position.set(0.12, 0.08, 0.2); g.add(nucl); v.addPart('cekirdek', nucl);
  const mitoM = mat(0xff7a45);
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.18, 4, 10), mitoM); const a = i * 1.3; m.position.set(Math.cos(a) * 0.58, Math.sin(a) * 0.5, Math.sin(a * 2) * 0.3); m.rotation.set(a, a * 0.5, 0); g.add(m); v.addPart('mitokondri', m); }
  // dendritler
  const dM = mat(0x78a6ff, { rough: 0.45 });
  const tips = [];
  function branch(p0, dir, len, r, d) {
    const p1 = p0.clone().addScaledVector(dir, len);
    const mid = p0.clone().lerp(p1, 0.5).add(V((R() - 0.5) * len * 0.3, (R() - 0.5) * len * 0.3, (R() - 0.5) * len * 0.3));
    const t = tube([p0, mid, p1], r, dM, 10, 6); g.add(t); v.addPart('dendrit', t);
    if (d > 0) { const n = 2 + (R() < 0.3 ? 1 : 0); for (let k = 0; k < n; k++) { const nd = dir.clone().add(V((R() - 0.5) * 1.1, (R() - 0.5) * 1.1, (R() - 0.5) * 1.1)).normalize(); branch(p1, nd, len * 0.7, r * 0.64, d - 1); } }
    else tips.push({ tip: p1, path: [] });
    return p1;
  }
  const dendCurves = [];
  for (let i = 0; i < 6; i++) {
    const th = i / 6 * Math.PI * 2 + 0.3;
    const dir = V(-0.55, Math.cos(th) * 0.85, Math.sin(th) * 0.85).normalize();
    const s = dir.clone().multiplyScalar(0.78);
    const e1 = branch(s, dir, 1.3, 0.11, 3);
    dendCurves.push(new THREE.CatmullRomCurve3([e1, s.clone().lerp(e1, 0.5), s, V(0, 0, 0)]));
  }
  // akson
  const hill = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.32, 0.55, 20), mat(0x9b6cff, { opacity: 0.85 })); hill.rotation.z = -Math.PI / 2; hill.position.x = 0.95; g.add(hill); v.addPart('govde', hill);
  const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 7.9, 16), mat(0xa9c1ff)); ax.rotation.z = Math.PI / 2; ax.position.x = 5.1; g.add(ax); v.addPart('akson', ax);
  const myel = [], nodes = [];
  const myM = mat(0xf4c95d, { rough: 0.35 }), schM = mat(0xc2410c), ranM = mat(0xff5d73, { emissive: 0x400010 });
  let x = 1.45;
  while (x + 0.95 <= 8.85) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.95, 28), myM); m.rotation.z = Math.PI / 2; m.position.x = x + 0.475; g.add(m); v.addPart('miyelin', m); myel.push(m);
    const s = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), schM); s.scale.set(0.2, 0.07, 0.12); s.position.set(x + 0.475, 0.28, 0); g.add(s); v.addPart('schwann', s); myel.push(s);
    x += 0.95;
    if (x + 0.22 < 8.85) { const n = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.03, 8, 24), ranM); n.rotation.y = Math.PI / 2; n.position.x = x + 0.11; g.add(n); v.addPart('ranvier', n); myel.push(n); nodes.push(x + 0.11); }
    x += 0.22;
  }
  // akson ucu
  const tM = mat(0xa9c1ff), bM = mat(0xffb347, { emissive: 0x6b3500, ei: 0.4 });
  const termCurves = []; const bulbs = [];
  const ends = [[10.7, 0.9, 0.2], [10.9, 0.3, -0.5], [11.0, -0.2, 0.4], [10.8, -0.8, -0.2], [10.5, 0.1, 0.9]];
  ends.forEach(e => {
    const t = tube([[9.0, 0, 0], [9.7, e[1] * 0.4, e[2] * 0.4], e], 0.055, tM, 16, 6); g.add(t); v.addPart('aksonucu', t); termCurves.push(t.userData.curve);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), bM); b.position.set(...e); g.add(b); v.addPart('sinaptik', b); bulbs.push(b);
  });
  const a = (k, pos, txt) => v.addLabel(k, txt, anchor(g, pos), [0, 0, 0]);
  a('dendrit', [-1.9, 1.2, 0.4], 'Dendrit'); a('govde', [0.1, 0.95, 0.3], 'Hücre gövdesi'); a('cekirdek', [0, -0.05, 0.45], 'Çekirdek');
  a('akson', [5.3, -0.45, 0], 'Akson'); a('miyelin', [3.0, 0.5, 0], 'Miyelin kılıf'); a('schwann', [6.3, 0.55, 0], 'Schwann hücresi');
  a('ranvier', [nodes[2] || 4, -0.4, 0], 'Ranvier boğumu'); a('aksonucu', [9.6, 0.55, 0], 'Akson ucu'); a('sinaptik', [11.25, -0.45, 0.4], 'Sinaptik uçlar');

  // uyartı
  const spark = glow(0xffe36b, 0.9); spark.visible = false; g.add(spark);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 24), new THREE.MeshBasicMaterial({ color: 0xff3b4e, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.y = Math.PI / 2; ring.visible = false; g.add(ring);
  let run = null, myelinOn = true;
  const read = $('#nRead');
  $('#nMyelin').onchange = (e) => { myelinOn = e.target.checked; myel.forEach(m => m.visible = myelinOn); read.textContent = myelinOn ? 'Miyelinli aksonda uyartı Ranvier boğumlarından atlayarak hızlı ilerler.' : 'Miyelinsiz aksonda uyartı zar boyunca adım adım, daha yavaş ilerler (iç organlara ve düz kaslara giden sinirler).'; };
  $('#nGo').onclick = () => {
    if (run) return;
    run = { t: 0, my: myelinOn, phase: 0 };
    dendCurves.forEach((c, i) => v.pulse(c, { dur: 0.5, size: 0.4, color: 0x9fd4ff, delay: i * 0.03 }));
    read.textContent = 'Dendritler uyarıyı aldı → hücre gövdesi';
  };
  v.onFrame((dt) => {
    bulbs.forEach(b => { b.material.emissiveIntensity = Math.max(0.4, b.material.emissiveIntensity - dt * 1.5); });
    if (!run) return;
    run.t += dt;
    const t = run.t - 0.55;
    if (t < 0) return;
    let xPos, done = false;
    if (run.my) {
      const pts = [1.0, ...nodes, 8.95];
      const idx = Math.floor(t / 0.11);
      if (idx >= pts.length) done = true; else xPos = pts[idx];
    } else {
      const u = t / 2.8;
      if (u >= 1) done = true; else xPos = 1.0 + u * 7.95;
    }
    if (!done) {
      spark.visible = ring.visible = true;
      spark.position.set(xPos, 0, 0); ring.position.set(xPos, 0, 0);
      ring.scale.setScalar(run.my ? 1.6 : 1.1);
    } else if (!run.end) {
      run.end = true; spark.visible = ring.visible = false;
      termCurves.forEach(c => v.pulse(c, { dur: 0.35, size: 0.4 }));
      setTimeout(() => bulbs.forEach(b => { b.material.emissiveIntensity = 2.5; }), 350);
      const sec = (run.t + 0.35).toFixed(1);
      read.textContent = run.my
        ? `Miyelinli akson: uyartı ${nodes.length} Ranvier boğumundan atlayarak ${sec} sn'de akson ucuna ulaştı (simülasyon zamanı).`
        : `Miyelinsiz akson: uyartı tüm zar boyunca ilerleyerek ${sec} sn'de akson ucuna ulaştı. Miyelinliyle karşılaştır.`;
      setTimeout(() => { run = null; }, 400);
    }
  });

  const stops = [thresholdSim(), membraneSim(), freqSim()];
  return () => { v.dispose(); stops.forEach(s => s()); };
}

/* ---------- eşik değer / ya hep ya hiç / merdiven ---------- */
function thresholdSim() {
  const c = $('#thrCanvas'); const { ctx, W, H } = setupCanvas(c);
  let mode = 'tek';
  let hist = [];
  const TH = 3, FIB = [2, 3, 4, 5, 6, 7];
  const resp = (I) => mode === 'tek' ? (I >= TH ? 1 : 0) : FIB.filter(f => I >= f).length / FIB.length;
  const seed = () => { hist = (mode === 'tek' ? [1, 2, 3, 5, 8] : [1, 2, 3, 4, 5, 6, 7, 9]).map(I => ({ I, R: resp(I) })); };
  seed();
  const read = $('#thrRead');
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const base = 170, left = 60, step = Math.min(78, (W - left - 30) / 10);
    ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(left - 10, base); ctx.lineTo(W - 16, base); ctx.stroke();
    ctx.font = C.mono; ctx.fillStyle = C.dim; ctx.textAlign = 'left';
    ctx.fillText('TEPKİ ŞİDDETİ', 12, 24); ctx.fillText('UYARAN ŞİDDETİ', 12, H - 12);
    // eşik çizgisi
    const thY = base + 8 + (mode === 'tek' ? TH : FIB[0]) * 10;
    ctx.setLineDash([5, 5]); ctx.strokeStyle = C.gold; ctx.beginPath(); ctx.moveTo(left - 10, thY); ctx.lineTo(W - 16, thY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.gold; ctx.fillText(mode === 'tek' ? 'eşik değer' : 'en düşük eşik', W - 120, thY + 14);
    hist.forEach((h, i) => {
      const x = left + i * step + 10;
      ctx.fillStyle = C.blue; ctx.fillRect(x - 3, base + 8, 6, h.I * 10);
      if (h.R > 0) {
        const hh = 20 + h.R * 110;
        ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.beginPath();
        ctx.moveTo(x - 14, base); ctx.lineTo(x - 4, base); ctx.lineTo(x, base - hh); ctx.lineTo(x + 4, base); ctx.lineTo(x + 14, base); ctx.stroke();
      } else { ctx.fillStyle = C.dim; ctx.fillText('—', x - 4, base - 8); }
      ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(h.I, x, H - 30); ctx.textAlign = 'left';
    });
  }
  function explain(I) {
    const R = resp(I);
    if (mode === 'tek') read.textContent = I < TH ? `Şiddet ${I} < eşik (${TH}): uyartı oluşmadı.` : `Şiddet ${I} ≥ eşik: uyartı oluştu. Şiddet artsa da tepki aynı (ya hep ya hiç).`;
    else { const n = Math.round(R * FIB.length); read.textContent = n === 0 ? `Şiddet ${I}: hiçbir aksonun eşiğine ulaşmadı.` : n === FIB.length ? `Şiddet ${I}: ${n}/${FIB.length} akson uyarıldı. Tüm aksonlar uyarıldığı için tepki artık değişmez.` : `Şiddet ${I}: ${n}/${FIB.length} akson uyarıldı; tepki kademeli arttı (merdiven etkisi).`; }
  }
  segValue($('#thrMode'), 'm', m => { mode = m; seed(); draw(); explain(+$('#thrI').value); });
  $('#thrI').oninput = (e) => { $('#thrOut').textContent = e.target.value; explain(+e.target.value); };
  $('#thrGo').onclick = () => { const I = +$('#thrI').value; hist.push({ I, R: resp(I) }); if (hist.length > 10) hist.shift(); draw(); explain(I); };
  $('#thrClr').onclick = () => { hist = []; draw(); read.textContent = 'Uyaran şiddetini seç ve Uyar düğmesine bas.'; };
  draw(); explain(+$('#thrI').value);
  return () => {};
}

/* ---------- zar potansiyeli ---------- */
function membraneSim() {
  const c = $('#memCanvas'); const { ctx, W, H } = setupCanvas(c);
  let p = -999, running = false;
  const trace = new Array(260).fill(-70);
  const pills = [...document.querySelectorAll('#memState span')];
  const read = $('#memRead');
  const L = 40, Rr = W - 40;
  const volt = (ph) => ph < 0 ? -70 : ph < 26 ? -70 + 100 * ease(ph / 26) : ph < 70 ? 30 - 112 * ease((ph - 26) / 44) : ph < 120 ? -82 + 12 * ease((ph - 70) / 50) : -70;
  const stateOf = (ph) => ph < 0 || ph >= 120 ? 'pol' : ph < 26 ? 'dep' : 'rep';
  $('#memGo').onclick = () => { p = L - 20; running = true; };
  $('#memP').oninput = (e) => { $('#memPOut').textContent = '%' + e.target.value; };
  let lastState = '';
  const stop = loop((dt) => {
    if (running) { p += dt * 200; if (p > Rr + 140) running = false; }
    const probeX = L + (Rr - L) * (+$('#memP').value / 100);
    const ph = p - probeX;
    trace.push(volt(ph)); trace.shift();
    const st = stateOf(running ? ph : -1);
    if (st !== lastState) {
      lastState = st;
      pills.forEach(s => s.classList.toggle('on', s.dataset.s === st));
      read.textContent = st === 'pol' ? 'Polarizasyon: hücre içi (−), hücre dışı (+). Zar dinlenme potansiyelinde.' : st === 'dep' ? 'Depolarizasyon: uyarılan bölgede hücre içi (+), hücre dışı (−) oldu.' : 'Repolarizasyon: yükler eski hâline dönüyor. Bu sırada o bölgeden ikinci bir uyartı geçemez.';
    }
    // çizim
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const top = 62, bot = 142;
    ctx.fillStyle = 'rgba(122,160,255,.10)'; ctx.fillRect(L, top, Rr - L, bot - top);
    for (let x = L; x <= Rr; x += 4) {
      const q = p - x; const s = running ? stateOf(q) : 'pol';
      ctx.fillStyle = s === 'dep' ? 'rgba(255,59,78,.55)' : s === 'rep' ? 'rgba(255,201,77,.4)' : 'rgba(255,200,205,.25)';
      ctx.fillRect(x, top - 4, 3, 8); ctx.fillRect(x, bot - 4, 3, 8);
    }
    ctx.font = '700 15px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    for (let x = L + 12; x < Rr; x += 26) {
      const q = p - x; const dep = running && q >= 0 && q < 26 + 18;
      const out = dep ? '−' : '+', inn = dep ? '+' : '−';
      ctx.fillStyle = dep ? C.red : C.pink; ctx.fillText(out, x, top - 14); ctx.fillText(out, x, bot + 24);
      ctx.fillStyle = dep ? C.gold : C.blue; ctx.fillText(inn, x, top + 22); ctx.fillText(inn, x, bot - 12);
    }
    ctx.font = C.mono; ctx.fillStyle = C.dim; ctx.textAlign = 'left';
    ctx.fillText('HÜCRE DIŞI', L, 22); ctx.fillText('SİTOPLAZMA', L + 4, (top + bot) / 2 + 4);
    ctx.textAlign = 'right'; ctx.fillText('dendrit tarafı  →  akson ucu', Rr, 22);
    // ölçüm noktası
    ctx.strokeStyle = C.ink; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(probeX, top - 30); ctx.lineTo(probeX, bot + 30); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(probeX - 6, bot + 34); ctx.lineTo(probeX + 6, bot + 34); ctx.lineTo(probeX, bot + 26); ctx.fill();
    // grafik
    const gy0 = 196, gy1 = H - 16, gx0 = 70, gx1 = W - 20;
    const y = (mv) => gy1 - (mv + 90) / 130 * (gy1 - gy0);
    ctx.strokeStyle = C.faint; ctx.lineWidth = 1;
    [-70, 0, 30].forEach(mv => { ctx.beginPath(); ctx.moveTo(gx0, y(mv)); ctx.lineTo(gx1, y(mv)); ctx.stroke(); ctx.fillStyle = C.dim; ctx.textAlign = 'right'; ctx.fillText(mv + ' mV', gx0 - 6, y(mv) + 4); });
    ctx.strokeStyle = C.red; ctx.lineWidth = 2.2; ctx.beginPath();
    trace.forEach((mv, i) => { const xx = gx0 + i / (trace.length - 1) * (gx1 - gx0); i ? ctx.lineTo(xx, y(mv)) : ctx.moveTo(xx, y(mv)); });
    ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = C.dim; ctx.fillText('ölçüm noktasında zar potansiyeli', gx0 + 6, gy0 + 4);
  });
  return stop;
}

/* ---------- sıcaklık → uyartı sıklığı ---------- */
function freqSim() {
  const c = $('#freqCanvas'); const { ctx, W, H } = setupCanvas(c);
  let T = 20, acc = 0; const spikes = [];
  const read = $('#freqRead');
  const upd = () => { const f = 1 + (T - 20) / 30 * 9; $('#freqOut').textContent = T + ' °C'; read.textContent = `${T <= 26 ? 'Ilık' : T >= 40 ? 'Sıcak' : 'Orta sıcak'} cisim · yaklaşık ${f.toFixed(1)} uyartı/sn. ${T >= 40 ? 'Daha sık ve fazla sayıda uyartı → sıcak algısı.' : 'Az sıklıkta uyartı.'}`; };
  $('#freqT').oninput = (e) => { T = +e.target.value; upd(); };
  upd();
  for (let x = 120; x < W; x += 140) spikes.push(x);
  return loop((dt) => {
    const f = 1 + (T - 20) / 30 * 9;
    acc += dt * f; if (acc > 1) { acc -= 1; spikes.push(W - 10); }
    for (let i = spikes.length - 1; i >= 0; i--) { spikes[i] -= dt * 140; if (spikes[i] < 100) spikes.splice(i, 1); }
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    // termometre
    const k = (T - 20) / 30;
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(36, 30, 18, 120);
    ctx.fillStyle = `rgb(${120 + k * 135},${80 - k * 40},${200 - k * 170})`; ctx.fillRect(36, 150 - 20 - k * 100, 18, 20 + k * 100);
    ctx.beginPath(); ctx.arc(45, 160, 16, 0, 7); ctx.fill();
    const base = 130;
    ctx.strokeStyle = C.faint; ctx.beginPath(); ctx.moveTo(100, base); ctx.lineTo(W - 10, base); ctx.stroke();
    ctx.strokeStyle = C.red; ctx.lineWidth = 2;
    spikes.forEach(x => { ctx.beginPath(); ctx.moveTo(x - 6, base); ctx.lineTo(x, base - 80); ctx.lineTo(x + 6, base); ctx.stroke(); });
    ctx.font = C.mono; ctx.fillStyle = C.dim; ctx.textAlign = 'left'; ctx.fillText('duyu nöronunda uyartılar', 110, 30);
  });
}

/* =====================================================================
   1.5.2a  SİNAPS
   ===================================================================== */
const SYN_PARTS = {
  yumru: { name: 'Sinaptik yumru', group: 'Akson ucu', info: 'Aksonların sinaps boşluğunda sonlanan ucuna sinaptik yumru (sinaptik uç) denir. İçinde nörotransmitter dolu kesecikler bulunur.' },
  kesecik: { name: 'Sinaptik kesecik', group: 'Akson ucu', info: 'Nörotransmitter maddeleri taşır. Uyartı gelince zara kaynaşır ve içeriğini sinaps boşluğuna döker.' },
  mitokondri: { name: 'Mitokondri', group: 'Akson ucu', info: 'Nörotransmitter üretimi ve salınımı için gereken enerjiyi (ATP) sağlar.' },
  bosluk: { name: 'Sinaps boşluğu', group: 'Sinaps', info: 'İki hücre arasındaki dar aralık. Elektrik sinyali buradan doğrudan geçemez; kopan kablodan elektrik geçmemesine benzer.' },
  reseptor: { name: 'Reseptörler', group: 'Komşu hücre', info: 'Komşu hücrenin zarındaki reseptörler nörotransmitterlere bağlanır ve uyartıyı komşu hücreye aktarır.' },
  komsu: { name: 'Komşu hücre zarı', group: 'Komşu hücre', info: 'Alıcı hücre bir nöron (dendrit), kas hücresi veya hormon salgılayan bir hücre olabilir.' },
  enzim: { name: 'Enzimler', group: 'Sinaps boşluğu', info: 'Görevini tamamlayan nörotransmitterleri parçalayarak etkisiz hâle getirir; komşu hücrenin sürekli uyarılması engellenir.' },
};

export function mountSinaps() {
  const host = $('#syn3d');
  const v = createViewer(host, { cam: [0, 2.2, 9.5], target: [0, 1.0, 0], parts: SYN_PARTS, minD: 3, maxD: 20 });
  tools(host, v);
  explorer(v, $('#synChips'), $('#synInfo'), SYN_PARTS);
  const g = new THREE.Group(); v.root.add(g);
  const pts = [[0.02, 0.3], [0.95, 0.3], [1.55, 0.55], [1.85, 1.1], [1.8, 1.8], [1.45, 2.45], [0.9, 2.9], [0.5, 3.25], [0.42, 3.9], [0.42, 5.4]].map(q => new THREE.Vector2(q[0], q[1]));
  const term = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), mat(0x86a5ff, { opacity: 0.26, side: THREE.DoubleSide, rough: 0.25 }));
  g.add(term); v.addPart('yumru', term);
  const R = rng(4);
  const ves = [];
  const vesM = mat(0x9ad7ff, { opacity: 0.5, rough: 0.2 });
  const ntM = mat(0xffb02e, { emissive: 0x7a3d00, ei: 0.6 });
  for (let i = 0; i < 16; i++) {
    const y = 0.75 + R() * 1.5; const r = R() * (y < 1.1 ? 0.9 : 1.15); const a = R() * Math.PI * 2;
    const vg = new THREE.Group();
    vg.add(new THREE.Mesh(new THREE.SphereGeometry(0.21, 20, 14), vesM));
    for (let k = 0; k < 5; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), ntM); d.position.set((R() - 0.5) * 0.2, (R() - 0.5) * 0.2, (R() - 0.5) * 0.2); vg.add(d); }
    vg.position.set(Math.cos(a) * r, y, Math.sin(a) * r); vg.userData.home = vg.position.clone();
    g.add(vg); v.addPart('kesecik', vg); ves.push(vg);
  }
  ves.sort((a, b) => a.userData.home.y - b.userData.home.y);
  const mitM = mat(0xff7a45);
  [[-0.85, 2.3, 0.3, 0.6], [0.8, 2.1, -0.4, -0.5]].forEach(m => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.55, 6, 14), mitM); c.position.set(m[0], m[1], m[2]); c.rotation.z = m[3]; g.add(c); v.addPart('mitokondri', c); });
  const post = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.75, 4.2), mat(0xd56aa4, { rough: 0.6 })); post.position.y = -0.66; g.add(post); v.addPart('komsu', post);
  const memb = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.07, 4.2), mat(0xf0a7cf)); memb.position.y = -0.26; g.add(memb); v.addPart('komsu', memb);
  const recs = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + R() * 0.3, r = 0.35 + R() * 1.0;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.24, 14), new THREE.MeshStandardMaterial({ color: 0x2dd4bf, roughness: 0.4 }));
    m.position.set(Math.cos(a) * r, -0.12, Math.sin(a) * r); g.add(m); v.addPart('reseptor', m); recs.push(m);
  }
  const enzM = mat(0x84cc16, { emissive: 0x1f3a00 });
  const enz = [[1.55, 0.02, 0.6], [-1.4, 0.02, -0.7], [0.4, 0.02, 1.5], [-0.6, 0.02, 1.3]].map(q => { const e = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.045, 8, 16, 5.2), enzM); e.position.set(...q); e.rotation.x = Math.PI / 2; g.add(e); v.addPart('enzim', e); return e; });
  const pool = [];
  const ntFree = mat(0xffb02e, { emissive: 0xff8a00, ei: 0.9 });
  for (let i = 0; i < 72; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), ntFree); m.visible = false; g.add(m); pool.push(m); }
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.2), new THREE.MeshBasicMaterial({ color: 0x43d18a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  sheet.rotation.x = -Math.PI / 2; sheet.position.y = -0.21; g.add(sheet);
  const ap = glow(0xffe36b, 1.1); ap.visible = false; g.add(ap);
  const L = (k, pos, txt) => v.addLabel(k, txt, anchor(g, pos), [0, 0, 0]);
  L('yumru', [1.6, 2.7, 0.4], 'Sinaptik yumru'); L('kesecik', [-1.0, 1.4, 0.8], 'Sinaptik kesecik'); L('mitokondri', [-1.1, 2.6, 0.4], 'Mitokondri');
  L('bosluk', [2.3, 0.05, 0.6], 'Sinaps boşluğu'); L('reseptor', [1.2, -0.05, 1.3], 'Reseptör'); L('komsu', [-2.2, -0.7, 2.1], 'Komşu hücre zarı'); L('enzim', [-1.6, 0.05, -0.7], 'Enzim');

  let type = 'kol', clean = 'enzim', run = null;
  segValue($('#synType'), 't', x => { type = x; });
  segValue($('#synClean'), 'c', x => { clean = x; });
  const read = $('#synRead'), mvEl = $('#synMv'), bar = $('#synBar');
  const setMv = (mv) => { mvEl.textContent = `${mv > 0 ? '+' : '−'}${Math.abs(Math.round(mv))} mV`; bar.style.setProperty('--x', ((mv + 90) / 50 * 100).toFixed(0) + '%'); };
  setMv(-70);
  $('#synGo').onclick = () => {
    if (run) return;
    run = { t: 0, released: false, cleaned: false, particles: [] };
    read.textContent = 'Uyartı aksondan sinaptik yumruya iniyor…';
  };
  const fire = ves.slice(0, 6);
  const homeTop = V(0, 1.2, 0);
  v.onFrame((dt, time) => {
    enz.forEach((e, i) => { e.rotation.z += dt * (1 + i * 0.2); });
    if (!run) { ves.forEach((vv, i) => { vv.position.y = vv.userData.home.y + Math.sin(time * 1.2 + i) * 0.03; }); return; }
    run.t += dt; const t = run.t;
    // A: aksiyon potansiyeli
    ap.visible = t < 0.8; ap.position.set(0, 5.3 - Math.min(1, t / 0.8) * 4.3, 0);
    // B: kesecikler zara
    if (t > 0.7 && t < 1.4) { const u = ease((t - 0.7) / 0.6); fire.forEach(vv => { vv.position.lerpVectors(vv.userData.home, V(vv.userData.home.x * 0.7, 0.42, vv.userData.home.z * 0.7), u); }); }
    // C: ekzositoz
    if (t > 1.4 && !run.released) {
      run.released = true; read.textContent = 'Kesecikler zara kaynaştı, nörotransmitterler sinaps boşluğuna döküldü.';
      let pi = 0;
      fire.forEach(vv => {
        vv.visible = false;
        for (let k = 0; k < 11; k++) {
          const m = pool[pi++]; if (!m) break;
          m.visible = true; m.scale.setScalar(1); m.position.set(vv.position.x + (R() - 0.5) * 0.25, 0.28, vv.position.z + (R() - 0.5) * 0.25);
          const toRec = k % 2 === 0;
          const tgt = toRec ? recs[(pi + k) % recs.length].position.clone().add(V(0, 0.15, 0)) : V((R() - 0.5) * 3, 0.05 + R() * 0.15, (R() - 0.5) * 3);
          run.particles.push({ m, from: m.position.clone(), to: tgt, rec: toRec ? recs[(pi + k) % recs.length] : null });
        }
      });
    }
    if (run.released && t < 3.3) {
      const u = ease((t - 1.4) / 0.8);
      run.particles.forEach(p => { p.m.position.lerpVectors(p.from, p.to, u); p.m.position.x += Math.sin(t * 9 + p.from.x * 7) * 0.01; });
    }
    // D: reseptörler ve zar potansiyeli
    if (t > 2.1 && t < 3.4) {
      const k = Math.sin(Math.min(1, (t - 2.1) / 1.3) * Math.PI);
      sheet.material.color.setHex(type === 'kol' ? 0x43d18a : 0x4a7bd8);
      sheet.material.opacity = k * 0.45;
      run.particles.forEach(p => { if (p.rec) p.rec.material.color.setHex(type === 'kol' ? 0x6ef0a8 : 0x7fb0ff); });
      setMv(-70 + (type === 'kol' ? 15 : -12) * k);
      if (!run.said) { run.said = true; read.textContent = type === 'kol' ? 'Nörotransmitterler reseptörlere bağlandı → komşu hücrede depolarizasyon: uyartı iletildi (kolaylaştırıcı sinaps).' : 'Nörotransmitterler reseptörlere bağlandı → komşu hücrede hiperpolarizasyon: uyartı iletimi engellendi (durdurucu sinaps).'; }
    }
    // E: temizleme
    if (t > 3.3 && !run.cleaned) {
      run.cleaned = true;
      recs.forEach(r => r.material.color.setHex(0x2dd4bf));
      read.textContent = clean === 'enzim' ? 'Enzimler nörotransmitterleri parçalıyor; ortam yeni bir uyarıya hazırlanıyor.' : 'Nörotransmitterler nöron tarafından geri alınıyor (tekrar hücre içine alınma).';
      run.particles.forEach(p => { p.from = p.m.position.clone(); p.to = clean === 'enzim' ? p.from.clone().add(V((R() - 0.5) * 0.2, 0, (R() - 0.5) * 0.2)) : homeTop.clone().add(V((R() - 0.5) * 1.2, R() * 0.6, (R() - 0.5) * 1.2)); });
    }
    if (run.cleaned && t < 4.8) {
      const u = ease((t - 3.3) / 1.3);
      run.particles.forEach(p => { p.m.position.lerpVectors(p.from, p.to, u); if (clean === 'enzim') p.m.scale.setScalar(Math.max(0.01, 1 - u)); else if (u > 0.85) p.m.visible = false; });
    }
    // F: kesecikler yeniden
    if (t > 4.8) {
      const u = ease((t - 4.8) / 0.7);
      fire.forEach(vv => { vv.visible = true; vv.position.copy(vv.userData.home); vv.scale.setScalar(Math.max(0.01, u)); });
      run.particles.forEach(p => { p.m.visible = false; });
      if (t > 5.6) { fire.forEach(vv => vv.scale.setScalar(1)); run = null; setMv(-70); read.textContent = 'Sinaps yeni bir uyarıya hazır.'; }
    }
  });
  return () => v.dispose();
}
