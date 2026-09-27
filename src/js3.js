/* =========================================================
   ArchiZellige — scripts (3/4) : couleurs, réalisations, applications, atelier
   ========================================================= */
(function () {
'use strict';
var A = window.AZ, $ = A.$, $$ = A.$$, clamp = A.clamp, lerp = A.lerp, ease = A.ease, smooth = A.smooth, RM = A.RM, FINE = A.FINE,
    IMG = A.IMG, META = A.META, el = A.el, esc = A.esc, ico = A.ico, raf = A.raf, FAM = A.FAM, SW = A.SW, SWBY = A.SWBY;

/* =========================================================
   COULEURS
   ========================================================= */
function initColors() {
  var sec = $('#couleurs'), famBox = $('#fam'), grid = $('#swg'), info = $('#colInfo');
  var curFam = 'all', token = 0;

  function chip(id, name, color, count) {
    var b = el('button', 'chip'); b.type = 'button'; b.dataset.fam = id; b.setAttribute('aria-pressed', id === 'all');
    b.innerHTML = (color ? '<span class="chip__dot" style="--c:' + color + '"></span>' : '') + esc(name) + ' <span class="lnum" style="opacity:.6">' + count + '</span>';
    b.addEventListener('click', function () { setFam(id); });
    return b;
  }
  famBox.appendChild(chip('all', 'Toutes', null, SW.length));
  A.FAM_ORDER.forEach(function (f) { famBox.appendChild(chip(f, FAM[f].name, FAM[f].color, FAM[f].items.length)); });

  SW.forEach(function (s) {
    var b = el('button', 'sw'); b.type = 'button'; b.dataset.id = s.id; b.dataset.fam = s.fam; b.dataset.sel = 'col:' + s.id;
    b.setAttribute('aria-label', s.label + ', voir le détail');
    b.innerHTML = '<span class="sw__in" style="--c:' + s.avg + '"><img alt="" decoding="async" data-img="sw-' + s.id + '"></span><span class="sw__tag">' + esc(s.label) + '</span><span class="sw__ok">' + ico('i-check') + '</span>';
    b.addEventListener('click', function () { openViewer(s.id, b); });
    A.tilt(b, { vars: $('.sw__in', b), max: 10 });
    grid.appendChild(b);
  });
  A.hydrate(grid);

  function setFam(id) {
    curFam = id; var t = ++token;
    $$('.chip', famBox).forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.fam === id); });
    var show = [], hide = [];
    $$('.sw', grid).forEach(function (s) { ((id === 'all' || s.dataset.fam === id) ? show : hide).push(s); });
    hide.forEach(function (s) { if (!s.hidden) s.classList.add('is-out'); });
    setTimeout(function () {
      if (t !== token) return;
      hide.forEach(function (s) { s.hidden = true; });
      show.forEach(function (s) { if (s.hidden) { s.hidden = false; s.classList.add('is-out'); } });
      raf(function () { raf(function () { show.forEach(function (s) { s.classList.remove('is-out'); }); }); });
    }, RM ? 0 : 240);
    if (id === 'all') { sec.style.removeProperty('--tint'); info.textContent = SW.length + ' nuances, du blanc de chaux aux noirs profonds et aux métallisés.'; }
    else { sec.style.setProperty('--tint', 'color-mix(in srgb, ' + FAM[id].color + ' 17%, var(--bg))'); var n = FAM[id].items.length; info.textContent = FAM[id].name + '\u00a0: ' + n + (n > 1 ? ' nuances.' : ' nuance.'); }
  }
  info.textContent = SW.length + ' nuances, du blanc de chaux aux noirs profonds et aux métallisés.';

  /* visionneuse */
  var vw = $('#viewer'), tile = $('#vwTile'), nameEl = $('#vwName'), descEl = $('#vwDesc'), selBtn = $('#vwSel'), list = [], idx = 0;
  function show(swap) {
    var s = list[idx];
    tile.style.backgroundImage = 'url("' + IMG['sw-' + s.id] + '")';
    tile.style.backgroundColor = s.avg;
    nameEl.textContent = s.label;
    var f = FAM[s.fam];
    descEl.textContent = (f.labels ? 'Famille ' + f.name + '.' : 'Famille ' + f.name + ', nuance ' + s.n + ' sur ' + s.total + '.') + ' Les reflets et la teinte varient légèrement d’un carreau à l’autre, c’est la signature du zellige.';
    selBtn.dataset.sel = 'col:' + s.id;
    if (window.__renderSel) window.__renderSel();
    if (swap && !RM) { tile.classList.remove('is-swap'); void tile.offsetWidth; tile.classList.add('is-swap'); }
  }
  function openViewer(id, opener) {
    list = SW.filter(function (s) { return curFam === 'all' || s.fam === curFam; });
    idx = Math.max(0, list.findIndex(function (s) { return s.id === id; }));
    show(false); A.Modal.open(vw, opener);
  }
  function step(d) { idx = (idx + d + list.length) % list.length; show(true); }
  $('#vwPrev').addEventListener('click', function () { step(-1); });
  $('#vwNext').addEventListener('click', function () { step(1); });
  $('#vwClose').addEventListener('click', function () { A.Modal.close(); });
  vw.addEventListener('click', function (e) { if (e.target === vw) A.Modal.close(); });
  vw.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  selBtn.addEventListener('click', function () {
    var s = list[idx];
    var added = A.Sel.toggle({ k: 'col:' + s.id, kind: 'Couleur', label: s.label, img: 'sw-' + s.id });
    A.toast(added ? s.label + ' ajouté à votre sélection' : s.label + ' retiré de votre sélection');
  });
  $('#vwInfo').addEventListener('click', function () {
    var s = list[idx]; A.Modal.close();
    A.Contact.prefill({ reqs: ['Informations sur les couleurs'], msg: 'Je souhaite des informations sur la couleur : ' + s.label + '.', focus: true });
  });
  $('#vwCmp').addEventListener('click', function () {
    var s = list[idx]; A.Modal.close();
    if (A.Composer) A.Composer.setColor(s.id);
    A.goTo('#sur-mesure');
  });
  var stage = $('.vw__stage', vw);
  function tiltMove(e) {
    var r = stage.getBoundingClientRect(), px = clamp((e.clientX - r.left) / r.width, 0, 1), py = clamp((e.clientY - r.top) / r.height, 0, 1);
    tile.classList.add('is-tilt');
    tile.style.setProperty('--tx', ((.5 - py) * 26).toFixed(2)); tile.style.setProperty('--ty', ((px - .5) * 30).toFixed(2));
    tile.style.setProperty('--gx', (px * 100).toFixed(0) + '%'); tile.style.setProperty('--gy', (py * 100).toFixed(0) + '%');
  }
  function tiltEnd() { tile.classList.remove('is-tilt'); tile.style.setProperty('--tx', 0); tile.style.setProperty('--ty', 0); }
  stage.addEventListener('pointermove', function (e) { if (FINE || e.buttons || e.pressure > 0) tiltMove(e); });
  stage.addEventListener('pointerleave', tiltEnd); stage.addEventListener('pointerup', tiltEnd); stage.addEventListener('pointercancel', tiltEnd);
}

/* =========================================================
   RÉALISATIONS : galerie filtrable + lightbox
   ========================================================= */
function initGallery() {
  var fil = $('#gfil'), gal = $('#gal'), GAL = A.GAL, token = 0, cur = 'all';
  A.GCATS.forEach(function (c) {
    var b = el('button', 'chip', esc(c.name)); b.type = 'button'; b.dataset.cat = c.id; b.setAttribute('aria-pressed', c.id === 'all');
    b.addEventListener('click', function () { setCat(c.id); }); fil.appendChild(b);
  });
  GAL.forEach(function (g, i) {
    var m = META['ph-' + g.k] || { w: 3, h: 4 };
    var b = el('button', 'gi'); b.type = 'button'; b.dataset.cat = g.cat; b.dataset.i = i; b.style.aspectRatio = m.w + ' / ' + m.h;
    b.setAttribute('aria-label', g.t + ', agrandir');
    b.innerHTML = '<img alt="' + esc(g.t) + '" decoding="async" data-img="ph-' + g.k + '"><span class="gi__cap">' + esc(g.t) + '</span>';
    b.addEventListener('click', function () { openLB(i, b); });
    gal.appendChild(b);
  });
  A.hydrate(gal);

  function visibleList() { return $$('.gi', gal).filter(function (b) { return !b.hidden; }).map(function (b) { return +b.dataset.i; }); }
  function setCat(id) {
    cur = id; var t = ++token;
    $$('.chip', fil).forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.cat === id); });
    var show = [], hide = [];
    $$('.gi', gal).forEach(function (b) { ((id === 'all' || b.dataset.cat === id) ? show : hide).push(b); });
    hide.forEach(function (b) { b.classList.add('is-out'); });
    setTimeout(function () {
      if (t !== token) return;
      hide.forEach(function (b) { b.hidden = true; });
      show.forEach(function (b) { if (b.hidden) { b.hidden = false; b.classList.add('is-out'); } });
      raf(function () { raf(function () { show.forEach(function (b) { b.classList.remove('is-out'); }); }); });
    }, RM ? 0 : 280);
  }

  /* lightbox */
  var lb = $('#lb'), img = $('#lbImg'), tt = $('#lbT'), cc = $('#lbC'), selBtn = $('#lbSel'), seq = [], pos = 0;
  function showLB(dir) {
    var g = GAL[seq[pos]], key = 'ph-' + g.k;
    function put() {
      img.src = IMG[key]; img.alt = g.t; tt.textContent = g.t;
      var cat = A.GCATS.filter(function (c) { return c.id === g.cat; })[0];
      cc.textContent = (cat ? cat.name + ' · ' : '') + (pos + 1) + ' / ' + seq.length;
      selBtn.dataset.sel = 'photo:' + g.k; if (window.__renderSel) window.__renderSel();
      img.classList.remove('is-swap');
    }
    if (dir && !RM) { img.style.setProperty('--dir', (dir > 0 ? -30 : 30) + 'px'); img.classList.add('is-swap'); setTimeout(put, 220); } else put();
  }
  function openLB(i, opener) { seq = visibleList(); pos = Math.max(0, seq.indexOf(i)); showLB(0); A.Modal.open(lb, opener); }
  function lbStep(d) { pos = (pos + d + seq.length) % seq.length; showLB(d); }
  $('#lbPrev').addEventListener('click', function () { lbStep(-1); });
  $('#lbNext').addEventListener('click', function () { lbStep(1); });
  $('#lbClose').addEventListener('click', function () { A.Modal.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__fig')) A.Modal.close(); });
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') lbStep(1); if (e.key === 'ArrowLeft') lbStep(-1); });
  var sx = 0, sy = 0;
  lb.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
  lb.addEventListener('pointerup', function (e) { var dx = e.clientX - sx, dy = e.clientY - sy; if (e.pointerType !== 'mouse' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) lbStep(dx < 0 ? 1 : -1); });
  selBtn.addEventListener('click', function () {
    var g = GAL[seq[pos]];
    var added = A.Sel.toggle({ k: 'photo:' + g.k, kind: 'Projet', label: g.t, img: 'ph-' + g.k });
    A.toast(added ? 'Photo ajoutée à votre sélection' : 'Photo retirée de votre sélection');
  });
  $('#lbAsk').addEventListener('click', function () {
    var g = GAL[seq[pos]]; A.Modal.close();
    A.Contact.prefill({ reqs: ['Devis'], msg: 'Je souhaite un projet similaire à : ' + g.t + '.', focus: true });
  });

  /* grille Instagram */
  var ig = $('#igGrid');
  ['c-marine', 'f-bleue', 'p-arbre', 'h-hammam', 'c-aubergine', 'f-interieur'].forEach(function (k) {
    var a = el('a'); a.href = A.IG_URL; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', 'Voir cette photo sur Instagram');
    var im = el('img'); im.alt = ''; im.decoding = 'async'; im.dataset.img = 'ph-' + k; a.appendChild(im); ig.appendChild(a);
  });
  A.hydrate(ig);
}

/* =========================================================
   APPLICATIONS : mur de tuiles réversibles
   ========================================================= */
function initApps() {
  var fw = $('#fw'); if (!fw) return;
  A.APPS.forEach(function (a, i) {
    var col = A.APP_COL[i % 4];
    var b = el('button', 'fl'); b.type = 'button'; b.style.setProperty('--i', i);
    b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', a.n + ' : voir un exemple');
    b.innerHTML = '<span class="fl__in"><span class="fl__f" style="--fc:' + col[0] + ';--ft:' + col[1] + '"><svg class="fl__pat" viewBox="0 0 100 100" aria-hidden="true">' + A.starSVG(a.pat) + '</svg><b>' + esc(a.n) + '</b></span>' +
      '<span class="fl__b" data-bg="' + a.img + '"><b>' + esc(a.n) + '</b><span>' + esc(a.d) + '</span></span></span>';
    b.addEventListener('click', function () { var on = b.classList.toggle('is-flip'); b.setAttribute('aria-pressed', on); });
    fw.appendChild(b);
  });
  A.hydrate(fw);
  if ('IntersectionObserver' in window) {
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { fw.classList.add('is-in'); o.disconnect(); } }, { threshold: .15 });
    o.observe(fw);
  } else fw.classList.add('is-in');
  $$('.bt__pat').forEach(function (s) { s.innerHTML = A.starSVG(+s.dataset.pat || 8); });
  $$('.bt').forEach(function (b) { A.tilt(b, { max: 5 }); });
}

/* =========================================================
   ATELIER : une tuile 3D qui se façonne, s'émaille, s'assemble au fil du défilement
   ========================================================= */
function initAtelier() {
  var sec = $('#atelier'), xs = $('#xs'), grp = $('#xsGrp'), stepsEl = $('.steps'), lis = $$('.steps li'); if (!xs) return;
  var GL = ['bleu-3', 'vert-1', 'jaune-1', 'rose-1', 'terra-3', 'rouge-4', 'bleu-1', 'blanc-1', 'bleu-2'];
  var POS = [[0, 0], [0, -1], [1, 0], [0, 1], [-1, 0], [-1, -1], [1, -1], [1, 1], [-1, 1]];
  var slabs = POS.map(function (p, n) {
    var s = el('div', 'slab');
    s.style.setProperty('--dx', p[0]); s.style.setProperty('--dy', p[1]);
    var avg = (META['pt-' + GL[n]] || { avg: '#123' }).avg;
    s.innerHTML = '<i class="s s--n"></i><i class="s s--s"></i><i class="s s--w"></i><i class="s s--e"></i><i class="raw"></i><i class="gl" style="--gc:' + avg + ';background-image:linear-gradient(160deg,rgba(255,255,255,.14),rgba(0,0,0,.18)),url(\'' + IMG['pt-' + GL[n]] + '\')"></i>';
    grp.appendChild(s);
    return { el: s, ring: Math.abs(p[0]) + Math.abs(p[1]) };
  });
  function size() {
    var r = xs.getBoundingClientRect(), T = Math.round(clamp(Math.min(r.width, r.height) * .19, 44, 92));
    xs.style.setProperty('--T', T + 'px'); xs.style.setProperty('--th', Math.round(T * .17) + 'px');
  }
  size(); window.addEventListener('resize', size);

  var last = -1, pending = 0, px = 0, py = 0;
  function update() {
    pending = 0;
    var r = stepsEl.getBoundingClientRect(), vh = window.innerHeight;
    var p = clamp((vh * .6 - r.top) / Math.max(1, r.height - vh * .2), 0, 1);
    var a = smooth(0, .3, p), b = smooth(.32, .62, p), c = smooth(.66, .97, p);
    xs.style.setProperty('--gz', (185 * (1 - ease(b))).toFixed(1));
    xs.style.setProperty('--go', clamp(b * 3, 0, 1).toFixed(3));
    xs.style.setProperty('--sp', (b * 1.15).toFixed(3));
    xs.style.setProperty('--gs', (lerp(2.3, 1.02, c) + a * .1).toFixed(3));
    xs.style.setProperty('--rz', (-34 + a * 10 + b * 8 - c * 20).toFixed(2));
    xs.style.setProperty('--rx', (58 - c * 8).toFixed(2));
    slabs.forEach(function (s, n) {
      if (n === 0) return;
      var so = ease(clamp(c * 1.7 - s.ring * .22 - (n % 3) * .04, 0, 1));
      s.el.style.setProperty('--so', so.toFixed(3));
    });
    var idx = clamp(Math.floor(p * 3), 0, 2);
    if (idx !== last) { last = idx; lis.forEach(function (li, n) { li.classList.toggle('is-cur', n === idx); }); }
  }
  slabs.forEach(function (s, n) { if (n) s.el.style.setProperty('--so', 0); });
  window.addEventListener('scroll', function () { if (!pending) pending = raf(update); }, { passive: true });
  window.addEventListener('resize', function () { if (!pending) pending = raf(update); });
  update();
  if (FINE && !RM) {
    xs.addEventListener('pointermove', function (e) {
      var r = xs.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5;
      xs.style.setProperty('--px', (-py * 10).toFixed(2)); xs.style.setProperty('--py', (px * 14).toFixed(2));
    });
    xs.addEventListener('pointerleave', function () { xs.style.setProperty('--px', 0); xs.style.setProperty('--py', 0); });
  }
}

/* =========================================================
   LE GESTE : section vidéo plein cadre (autoplay discret, pause hors écran)
   ========================================================= */
function initVideoSection() {
  var sec = $('#geste'), video = $('#vidBg'), toggle = $('#vidToggle'); if (!sec || !video) return;
  var source = video.querySelector('source'), loaded = false, visible = false, userPaused = false;

  function load() {
    if (loaded || RM) return; loaded = true;
    var src = source.dataset.src; if (!src) return;
    source.src = src; video.load();
  }
  video.addEventListener('loadeddata', function () { toggle.hidden = false; });
  video.addEventListener('error', function () { toggle.hidden = true; }, true);

  function sync() {
    if (RM || !loaded) return;
    if (visible && !userPaused) video.play().catch(function () {}); else video.pause();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) load();
      sync();
    }, { threshold: .25 }).observe(sec);
  } else { load(); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) video.pause(); else sync(); });

  toggle.addEventListener('click', function () {
    userPaused = !video.paused;
    sync();
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? 'Lire la vidéo' : 'Mettre la vidéo en pause');
    toggle.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#' + (userPaused ? 'i-play' : 'i-pause') + '"/></svg>';
  });
}

A.initColors = initColors; A.initGallery = initGallery; A.initApps = initApps; A.initAtelier = initAtelier; A.initVideoSection = initVideoSection;
})();
