// Yönlendirme, ortak 2D yardımcılar, giriş bölümü, sıralama oyunları, test
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- 2D tuval yardımcıları (diğer modüller de kullanır) ---------- */
export function setupCanvas(c) {
  const W = +c.getAttribute('width'), H = +c.getAttribute('height');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (!c.dataset.w) { c.dataset.w = W; c.dataset.h = H; }
  const w = +c.dataset.w, h = +c.dataset.h;
  c.width = w * dpr; c.height = h * dpr;
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W: w, H: h };
}
export function loop(fn) {
  let id = 0, last = performance.now(), on = true;
  const f = (now) => { if (!on) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; fn(dt, now / 1000); id = requestAnimationFrame(f); };
  id = requestAnimationFrame(f);
  return () => { on = false; cancelAnimationFrame(id); };
}
export function segValue(el, attr, cb) {
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    cb(b.dataset[attr], b);
  }));
}
export const C = {
  bg: '#170609', ink: '#f7e7e8', dim: 'rgba(247,231,232,.55)', faint: 'rgba(247,231,232,.15)',
  red: '#ff3b4e', pink: '#ff8fa0', gold: '#ffc94d', blue: '#6aa8ff', green: '#43d18a', violet: '#b48cff',
  mono: '600 12px "JetBrains Mono", ui-monospace, monospace', sans: '600 13px "Figtree", system-ui, sans-serif',
};
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
export function bars(el, rows) {
  el.innerHTML = rows.map(r => `<div class="bar"><span>${r.name}</span><i><b style="background:${r.color}"></b></i><span>0</span></div>`).join('');
  return (vals) => {
    el.querySelectorAll('.bar').forEach((b, i) => {
      const v = Math.max(0, Math.min(1, vals[i]));
      b.querySelector('b').style.width = (v * 100).toFixed(0) + '%';
      b.lastElementChild.textContent = Math.round(v * 100);
    });
  };
}

/* ---------- sıralama oyunları ---------- */
const ORDERS = {
  goz: ['Işık', 'Kornea', 'Göz bebeği', 'Göz merceği', 'Camsı sıvı', 'Sarı benek (retina)', 'Optik sinir', 'Talamus', 'Beyin kabuğu'],
  kulak: ['Ses dalgası', 'Kulak kepçesi', 'Kulak yolu', 'Kulak zarı', 'Çekiç–örs–üzengi', 'Oval pencere', 'Vestibüler kanal', 'Timpanik kanal', 'Kohlear kanal (temel zar)', 'Corti organı', 'İşitme siniri', 'Talamus', 'Beyin kabuğu'],
  burun: ['Koku molekülleri', 'Burun boşluğu', 'Sarı bölge (mukus)', 'Koku reseptörleri', 'Koku soğancığı', 'Koku merkezi (beyin kabuğu)'],
  dil: ['Tat molekülleri', 'Dil', 'Papilla', 'Tat tomurcuğu', 'Kemoreseptör', 'Talamus', 'Beyin kabuğu'],
};
function shuffle(a, seed = 3) { const r = [...a]; let s = seed; for (let i = r.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }
function initOrder(box) {
  const items = ORDERS[box.dataset.order];
  box.innerHTML = `<div class="order-slots"></div><div class="order-pool"></div><div class="row-btns"><button type="button" class="btn ghost">Karıştır ve baştan</button><p class="order-msg" aria-live="polite"></p></div>`;
  const slots = box.querySelector('.order-slots'), pool = box.querySelector('.order-pool'), msg = box.querySelector('.order-msg');
  let n = 0, seed = 3;
  function build() {
    n = 0; msg.textContent = '';
    slots.innerHTML = items.map((_, i) => `${i ? '<span class="arr">→</span>' : ''}<span class="slot">${i + 1}</span>`).join('');
    pool.innerHTML = '';
    shuffle(items, seed++).forEach(t => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = t;
      b.onclick = () => {
        if (t === items[n]) {
          const s = slots.querySelectorAll('.slot')[n]; s.textContent = t; s.classList.add('fill');
          b.disabled = true; n++;
          if (n === items.length) msg.textContent = 'Tebrikler, sıra doğru!';
        } else { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); msg.textContent = ''; }
      };
      pool.appendChild(b);
    });
  }
  box.querySelector('.btn').onclick = build;
  build();
}

/* ---------- eşleştirme ---------- */
export function initMatch(box, rows, options, checkBtn, scoreEl) {
  box.innerHTML = rows.map((r, i) => `<label for="${box.id}-${i}">${r[0]}<select id="${box.id}-${i}"><option value="">Seç…</option>${options.map(o => `<option>${o}</option>`).join('')}</select></label>`).join('');
  checkBtn.onclick = () => {
    let ok = 0;
    rows.forEach((r, i) => {
      const sel = box.querySelector(`#${box.id}-${i}`); const lab = sel.parentElement;
      const good = sel.value === r[1]; ok += good;
      lab.classList.toggle('good', good); lab.classList.toggle('bad', !good);
    });
    scoreEl.textContent = `${ok} / ${rows.length} doğru` + (ok === rows.length ? ' · Harika!' : ' · Kırmızı olanları yeniden dene.');
  };
}

/* ---------- GİRİŞ: algı zinciri animasyonu ---------- */
const FLOW = {
  isik: { col: '#ffd34d', rec: 'Fotoreseptör', org: 'Göz', txt: 'Işık → gözdeki fotoreseptörler (çubuk ve koni) → görme siniri → beyindeki görme merkezi' },
  ses: { col: '#6aa8ff', rec: 'Mekanoreseptör', org: 'Kulak', txt: 'Ses dalgası → iç kulaktaki tüylü duyu hücreleri (mekanoreseptör) → işitme siniri → beyindeki işitme merkezi' },
  sicak: { col: '#ff6b4a', rec: 'Termoreseptör', org: 'Deri', txt: 'Sıcaklık → derideki termoreseptörler → duyu nöronları → omurilik ve beyin' },
  kimya: { col: '#43d18a', rec: 'Kemoreseptör', org: 'Burun', txt: 'Koku molekülü → sarı bölgedeki kemoreseptörler → koku soğancığı → koku merkezi' },
  dokun: { col: '#ff8fa0', rec: 'Mekanoreseptör', org: 'Deri', txt: 'Dokunma → derideki Meissner cisimciği, Merkel diskleri → duyu nöronları → beyin' },
};
function mountGiris() {
  const c = $('#flowCanvas'); const { ctx, W, H } = setupCanvas(c);
  let kind = 'isik', t = 0;
  segValue($('#flowSeg'), 's', k => { kind = k; t = 0; $('#flowText').textContent = FLOW[k].txt; });
  const nodes = [{ x: 70, l: 'Uyaran' }, { x: 250, l: 'Reseptör' }, { x: 450, l: 'Nöron' }, { x: 640, l: 'MSS' }];
  const stop = loop(dt => {
    t += dt;
    const f = FLOW[kind];
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const y = 150;
    // akson yolu
    ctx.strokeStyle = 'rgba(255,143,160,.35)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(250, y); ctx.bezierCurveTo(330, y - 40, 380, y + 40, 450, y); ctx.lineTo(600, y); ctx.stroke();
    // uyaran dalgaları
    for (let i = 0; i < 4; i++) {
      const p = ((t * 0.9 + i / 4) % 1);
      ctx.strokeStyle = f.col; ctx.globalAlpha = 1 - p; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(70, y, 12 + p * 90, -0.5, 0.5); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(70, y, 14, 0, 7); ctx.fill();
    // reseptör hücresi
    ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.ellipse(250, y, 26, 38, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#c4b5fd'; ctx.beginPath(); ctx.arc(250, y + 6, 9, 0, 7); ctx.fill();
    const lit = Math.max(0, Math.sin(t * 3)) * 0.6;
    ctx.fillStyle = `rgba(255,59,78,${lit})`; ctx.beginPath(); ctx.ellipse(250, y, 32, 44, 0, 0, 7); ctx.fill();
    // nöron gövdesi
    ctx.fillStyle = '#5b8cff'; ctx.beginPath(); ctx.arc(450, y, 20, 0, 7); ctx.fill();
    for (let a = 0; a < 6; a++) { ctx.strokeStyle = '#5b8cff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(450, y); ctx.lineTo(450 + Math.cos(a) * 36, y + Math.sin(a) * 36); ctx.stroke(); }
    // beyin
    ctx.fillStyle = '#ff8fa0';
    ctx.beginPath(); ctx.ellipse(650, y, 58, 46, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#b8435a'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(620 + i * 15, y - 8 + (i % 2) * 14, 12, 0.5, 2.6); ctx.stroke(); }
    const lit2 = Math.max(0, Math.sin(t * 3 - 2.6));
    ctx.fillStyle = `rgba(255,214,77,${lit2 * 0.7})`; ctx.beginPath(); ctx.arc(660, y - 10, 18 + lit2 * 6, 0, 7); ctx.fill();
    // impulslar
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.45 + i / 3) % 1);
      const x = 250 + p * 350;
      const yy = x < 450 ? y + Math.sin((x - 250) / 200 * Math.PI * 1) * -20 : y;
      const g = ctx.createRadialGradient(x, yy, 0, x, yy, 14); g.addColorStop(0, '#fff7c2'); g.addColorStop(1, 'rgba(255,201,77,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, yy, 14, 0, 7); ctx.fill();
    }
    ctx.font = C.mono; ctx.textAlign = 'center'; ctx.fillStyle = C.ink;
    nodes.forEach(n => ctx.fillText(n.l.toLocaleUpperCase('tr'), n.x === 640 ? 650 : n.x, 250));
    ctx.fillStyle = f.col; ctx.font = C.sans;
    ctx.fillText(f.org, 70, 272); ctx.fillText(f.rec, 250, 272); ctx.fillText('Uyartı (impuls)', 450, 272); ctx.fillText('Yorumlama', 650, 272);
  });
  // tanılayıcı ağaç
  const T = {
    a: { q: 'a) Duyu organları çevresel uyarıları algılar.', D: 'b', Y: 'c', ok: 'D' },
    b: { q: 'b) Duyu organlarında reseptör bulunmaz.', D: 'd', Y: 'e', ok: 'Y' },
    c: { q: 'c) Burun kimyasal uyarıları algılar.', D: 'f', Y: 'g', ok: 'D' },
    d: { q: 'd) Kulak sadece işitmeden sorumludur.', D: 1, Y: 2 },
    e: { q: 'e) Bazı hayvanlar insanların algılayamadığı uyaranları algılar.', D: 3, Y: 4, ok: 'D' },
    f: { q: 'f) Dil, tat alma tomurcuklarındaki reseptörlerle tatları algılar.', D: 5, Y: 6 },
    g: { q: 'g) Deri sadece dokunma uyaranını algılar.', D: 7, Y: 8 },
  };
  let node = 'a';
  const path = $('#treePath'), q = $('#treeQ');
  const btns = $$('#tree .tree-btns [data-a]');
  function show() { q.textContent = T[node].q; btns.forEach(b => b.disabled = false); }
  btns.forEach(b => b.onclick = () => {
    if (typeof node === 'number') return;
    const a = b.dataset.a; const next = T[node][a];
    const li = document.createElement('li'); li.textContent = `${node}) ${a}`; path.appendChild(li);
    if (typeof next === 'number') {
      node = next;
      const r = document.createElement('li'); r.className = 'res' + (next === 3 ? ' good' : '');
      r.textContent = `${next}. çıkış`; path.appendChild(r);
      q.textContent = next === 3 ? '3. çıkış doğru! a) D, b) Y, e) D.' : `${next}. çıkışa ulaştın. Doğru çıkış 3. Yanlış yaptığın ifadeyi bul ve yeniden dene.`;
      btns.forEach(x => x.disabled = true);
    } else { node = next; show(); }
  });
  $('#treeReset').onclick = () => { node = 'a'; path.innerHTML = ''; show(); };
  return () => stop();
}

/* ---------- TEST ---------- */
const QUIZ = [
  { q: 'Bir nöronda uyartı oluşabilmesi için gereken en düşük uyaran şiddetine ne denir?', o: ['Aksiyon potansiyeli', 'Eşik değer', 'Merdiven etkisi', 'Dinlenme potansiyeli', 'Repolarizasyon'], a: 1, w: 'Eşik değerin altındaki uyaranlar uyartı oluşturmaz; eşik ve üzerindeki uyaranlara nöron aynı şiddette tepki verir (ya hep ya hiç).' },
  { q: 'Sinir kordonunda (demetinde) uyaran şiddeti arttıkça tepki şiddetinin kademeli artmasının nedeni nedir?', o: ['Aksonların hepsinin aynı eşik değere sahip olması', 'Miyelin kılıfın kalınlaşması', 'Farklı aksonların farklı eşik değerlere sahip olması', 'Nörotransmitterin geri alınması', 'Ranvier boğumlarının kapanması'], a: 2, w: 'Merdiven etkisi: uyaran şiddeti arttıkça uyarılan nöron sayısı artar. Belli bir değerden sonra tepki şiddeti değişmez.' },
  { q: 'Miyelin kılıf ile ilgili aşağıdakilerden hangisi doğrudur?', o: ['Dendritleri sarar', 'Uyartı iletimini yavaşlatır', 'Schwann hücreleri tarafından oluşturulur ve elektriksel yalıtım sağlar', 'İç organlara giden sinirlerde her zaman bulunur', 'Ranvier boğumlarında en kalındır'], a: 2, w: 'Schwann hücreleri akson etrafında lipoprotein bir örtü oluşturur; yalıtım uyartı iletimini hızlandırır. Kılıfın kesintiye uğradığı yerler Ranvier boğumudur.' },
  { q: 'Kimyasal sinapsta uyartının sinaps boşluğundan geçmesini sağlayan nedir?', o: ['Elektrik akımının doğrudan geçmesi', 'Nörotransmitter maddeler', 'Miyelin kılıf', 'Rodopsin pigmenti', 'Otolit taşları'], a: 1, w: 'Sinaptik keseciklerdeki nörotransmitterler boşluğa dökülür ve komşu hücrenin zarındaki reseptörlere bağlanır.' },
  { q: 'Görme sürecinde aşağıdaki olaylardan hangisi en son gerçekleşir?', o: ['Işınların göz bebeğinden geçmesi', 'Fotoreseptörlerin uyarılması', 'Göze gelen ışınların korneada kırılması', 'Optik sinirlerin talamusa uğraması', 'Camsı cismi geçen ışınların sarı noktaya ulaşması'], a: 3, w: 'Sıra: kornea → göz bebeği → mercek → camsı sıvı → sarı benek (fotoreseptörler) → optik sinir → talamus → beyin kabuğu.' },
  { q: 'Bol miktarda koni hücresi içerir, görüntünün en net olduğu kısımdır, retinanın merkezinde bulunur. Bu bölüm hangisidir?', o: ['Sarı nokta', 'Kör nokta', 'Pupil', 'Optik kiazma', 'Sklera'], a: 0, w: 'Sarı benek (sarı nokta) optik eksenin retinayı kestiği çukur bölgedir; merkezinde koniler yoğundur.' },
  { q: 'Göz ile ilgili verilen ifadelerden hangisi yanlıştır?', o: ['Damar tabaka gözün ön kısmında renkli bölüm olan irisi oluşturur', 'Damar tabakadaki pigmentler fazla ışığı soğurarak göz içini karanlık tutar', 'Göz bebeğinin arkasında ışınları retinaya düşüren göz merceği bulunur', 'Işığı algılayan reseptörler hem sert tabakada hem ağ tabakada bulunur', 'İris düz kaslarla göz bebeğinin büyüklüğünü değiştirerek ışık miktarını ayarlar'], a: 3, w: 'Fotoreseptörler (çubuk ve koni) yalnızca ağ tabakada (retina) bulunur.' },
  { q: 'Görme olayı sürecinde I. koni ve çubuk reseptörlerin uyarılması, II. korneada kırılan ışınların göz bebeğinden geçmesi, III. impulsların beyin kabuğunda değerlendirilmesi olayları hangi sırayla gerçekleşir?', o: ['I - II - III', 'II - I - III', 'III - I - II', 'II - III - I', 'I - III - II'], a: 1, w: 'Önce ışık göz bebeğinden geçer, sonra retinadaki reseptörler uyarılır, en son beyin kabuğunda yorumlanır.' },
  { q: 'Kulak ile ilgili aşağıdaki ifadelerden hangisi doğrudur?', o: ['Çekiç kemiği dış kulakta bulunur', 'Kulak yolu oval pencere ile bağlantılıdır', 'İşitme ile ilgili reseptörler Corti organında bulunur', 'Yarım daire kanalları orta kulakta bulunur', 'Kulak zarı üzengi kemiği ile bağlantılıdır'], a: 2, w: 'Corti organındaki tüylü duyu hücreleri işitme reseptörleridir. Çekiç orta kulakta, yarım daire kanalları iç kulaktadır; kulak zarına çekiç bağlıdır.' },
  { q: 'İşitme sürecinde aşağıdaki olaylardan hangisi gerçekleşmez?', o: ['Corti organında impuls oluşumu', 'Kulak zarının titreşmesi', 'Otolit taşlarının yer değiştirmesi', 'Kıl hücrelerinin tektoryal zara sürtünmesi', 'Oval penceredeki titreşimlerin vestibüler kanalda sıvı dalgaları oluşturması'], a: 2, w: 'Otolit taşları kesecik ve tulumcukta bulunur, dengeyle (konum değişimi) ilgilidir.' },
  { q: 'İşitme sürecinde I. oval pencerenin titreşmesi, II. vestibüler kanalda sıvı dalgaların oluşması, III. kıl reseptörlerinin tektoryal zara sürtünmesi hangi sırayla gerçekleşir?', o: ['I - II - III', 'II - I - III', 'III - I - II', 'I - III - II', 'II - III - I'], a: 0, w: 'Üzengi oval pencereyi titreştirir → vestibüler kanalda sıvı dalgaları → temel zar titreşir → tüyler çatı (tektoryal) zara sürtünür.' },
  { q: 'Koku duyusu ile ilgili verilen ifadelerden hangisi doğrudur?', o: ['Koku alma yalnız yağda çözünmüş maddelerle gerçekleşir', 'Koku duyusu, mukusta çözünebilen uçucu kimyasalları algılar', 'Koku reseptörleri elektromanyetik reseptörlerdir', 'Koku duyusunun beyne iletiminde motor nöronlar görev alır', 'Koku reseptörleri burnun her yerine yayılmıştır'], a: 1, w: 'Koku reseptörleri kemoreseptördür ve yalnızca burnun üst kısmındaki sarı bölgede bulunur.' },
  { q: 'Koku ve tadın algılanması sürecinde aşağıdaki yapılardan hangisi ortak olarak görev yapmaz?', o: ['Beyin kabuğu', 'Mukus', 'Duyu nöronu', 'Talamus', 'Reseptör'], a: 3, w: 'Koku uyartıları talamusa uğramadan koku merkezine gider; tat uyartıları ise önce talamusa uğrar.' },
  { q: 'Koku duyusu ile ilgili I. Bazı hayvanların kokunun geldiği yönü bulmasına yardımcı olur. II. Aynı kokuya uzun süre maruz kalınması reseptörlerin canlılığını yitirmesine neden olur. III. Grip ve nezlede artan mukus koku kaybına neden olabilir. ifadelerinden hangileri yanlıştır?', o: ['Yalnız I', 'Yalnız II', 'Yalnız III', 'I ve II', 'II ve III'], a: 1, w: 'Uzun süre aynı kokuda reseptörler ölmez; duyu adaptasyonu gerçekleşir. Farklı bir koku yine algılanır.' },
  { q: 'Derinin yapısında aşağıdakilerden hangisi bulunmaz?', o: ['Papilla', 'Kıl kökü reseptörü', 'Korun tabakası', 'Kolajen lif', 'Ruffini cisimciği'], a: 0, w: 'Papillalar dilin üzerindeki, tat tomurcuklarını içeren çıkıntılardır.' },
  { q: 'Deri ile ilgili I. Korun tabakası → ölü hücrelerden oluşup keratin içerir. II. Malpighi tabakası → melanositleri melanin sentezler. III. Dermis → temel bağ dokudan oluşur. eşleştirmelerinden hangileri doğrudur?', o: ['Yalnız I', 'I ve II', 'I ve III', 'II ve III', 'I, II ve III'], a: 4, w: 'Üç eşleştirme de doğrudur.' },
  { q: 'Zeytinyağı tadımında panelistlerin bildirdiği "boğazda yanma" hissini oluşturan reseptör tipi ve bulunduğu yapı hangisidir?', o: ['Kemoreseptör, dilin arka bölgesindeki tat tomurcukları', 'Termoreseptör, yutak mukozasındaki serbest uçlar', 'Nosiseptör, yutak mukozasındaki serbest sinir uçları', 'Mekanoreseptör, yutak duvarındaki basınç uçları', 'Kemoreseptör, burun boşluğundaki koku epiteli'], a: 2, w: 'Yanma hissi ağrı reseptörleri (nosiseptörler) olan serbest sinir uçlarıyla algılanır.' },
  { q: 'Burun klipsi takıldığında yalnızca meyvemsi aroma puanının düşmesi neyi gösterir?', o: ['Aroma algısı dildeki kemoreseptörlerin tek başına ürünüdür', 'Acılık algısı burun boşluğundaki reseptörlere bağlıdır', 'Yanma algısı koku epitelinden başlatılmaktadır', 'Aroma algısı burundaki mekanoreseptörlere bağlıdır', 'Aroma algısı burun epitelindeki kemoreseptörlere de bağlı gelişir'], a: 4, w: 'Klips burundan geçen havayı keser; aroma düşer, acılık ve yanma değişmez. Aroma koku epiteline de bağlıdır.' },
  { q: '38 °C sunumda yalnız yanma puanının artması hangi yorumu destekler?', o: ['Sıcaklık artışı dildeki kemoreseptörleri duyarsızlaştırmıştır', 'Yanmadan sorumlu yapı hem kimyasal hem ısıl uyaranla etkinleşmektedir', 'Sıcaklık artışı koku kemoreseptörlerini baskılamıştır', 'Yanma hissi yalnız termoreseptörlerin sıcak uyaranıyla oluşmaktadır', 'Sıcaklık artışı nosiseptörlerin eşiğini yükseltmiştir'], a: 1, w: 'Aroma ve acılık değişmeden yanmanın artması, aynı serbest sinir uçlarının hem kimyasal hem ısıl uyarana yanıt verdiğini gösterir.' },
];
function mountTest() {
  const ol = $('#quiz');
  if (!ol.dataset.ready) {
    ol.dataset.ready = 1;
    let right = 0, done = 0;
    const score = $('#quizScore');
    const L = 'ABCDE';
    QUIZ.forEach((it, qi) => {
      const li = document.createElement('li');
      li.innerHTML = `<p class="q">${it.q}</p><div class="opts">${it.o.map((o, i) => `<button type="button" data-i="${i}"><b>${L[i]})</b><span>${o}</span></button>`).join('')}</div><p class="why" hidden></p>`;
      li.querySelectorAll('.opts button').forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        li.querySelectorAll('.opts button').forEach(x => { x.disabled = true; if (+x.dataset.i === it.a) x.classList.add('right'); });
        if (i !== it.a) b.classList.add('wrong'); else right++;
        done++;
        const w = li.querySelector('.why'); w.hidden = false; w.textContent = (i === it.a ? 'Doğru. ' : `Doğru cevap ${L[it.a]}. `) + it.w;
        score.textContent = `${right} / ${done} doğru · ${QUIZ.length - done} soru kaldı`;
      });
      ol.appendChild(li);
    });
    score.textContent = `0 / 0 doğru · ${QUIZ.length} soru`;
    initMatch($('#organMatch'),
      [['Burun', 'Sarı bölge'], ['Kulak', 'Corti organı'], ['Dil', 'Tat tomurcukları'], ['Göz', 'Sarı benek'], ['Deri', 'Dermis']],
      ['Corti organı', 'Dermis', 'Tat tomurcukları', 'Sarı benek', 'Sarı bölge'], $('#organCheck'), $('#organScore'));
  }
  return () => {};
}

/* ---------- yönlendirme ---------- */
const MOUNTS = {
  giris: async () => mountGiris(),
  reseptor: async () => (await import('./m-noron.js')).mountReseptor(),
  noron: async () => (await import('./m-noron.js')).mountNoron(),
  sinaps: async () => (await import('./m-noron.js')).mountSinaps(),
  goz: async () => (await import('./m-goz.js')).mountGoz(),
  kulak: async () => (await import('./m-kulak.js')).mountKulak(),
  burun: async () => (await import('./m-kimya.js')).mountBurun(),
  dil: async () => (await import('./m-kimya.js')).mountDil(),
  deri: async () => (await import('./m-deri.js')).mountDeri(),
  test: async () => mountTest(),
};
let current = null, cleanup = null, token = 0;
async function go(id, push = true) {
  if (!MOUNTS[id]) id = 'giris';
  if (id === current) return;
  const my = ++token;
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  current = id;
  $$('.sec').forEach(s => s.hidden = s.dataset.sec !== id);
  $$('.tabs a').forEach(a => { if (a.dataset.go === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const tab = $(`.tabs a[data-go="${id}"]`); tab && tab.scrollIntoView({ block: 'nearest', inline: 'center' });
  if (push) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* önizlemede yok say */ } }
  window.scrollTo({ top: 0 });
  try {
    const c = await MOUNTS[id]();
    if (my !== token) { c && c(); return; }
    cleanup = c;
  } catch (e) { console.error('Bölüm yüklenemedi', id, e); }
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-go]');
  if (!a) return;
  e.preventDefault();
  go(a.dataset.go);
});
window.addEventListener('hashchange', () => go(location.hash.slice(1), false));
$$('.order').forEach(initOrder);
go((location.hash || '#giris').slice(1), false);
