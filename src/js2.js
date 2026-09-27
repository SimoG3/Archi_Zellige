/* =========================================================
   ArchiZellige — scripts (2/4) : héros 3D, groupes 3D, coverflow
   ========================================================= */
(function () {
'use strict';
var A = window.AZ, $ = A.$, $$ = A.$$, clamp = A.clamp, lerp = A.lerp, RM = A.RM, FINE = A.FINE, IMG = A.IMG, el = A.el, ico = A.ico, raf = A.raf;

/* ---------- géométrie de l'arche (identique au clipPath #clipArch) ---------- */
var HW = [[0, 0], [.088, .161], [.178, .319], [.279, .440], [.40, .488], [.521, .4565], [.62, .425], [1, .425]];
function hw(v) {
  if (v <= 0) return 0; if (v >= 1) return .425;
  for (var i = 1; i < HW.length; i++) if (v <= HW[i][0]) { var a = HW[i - 1], b = HW[i], t = (v - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; }
  return .425;
}
function inside(x, y, box) { var u = (x - box.l) / box.w, v = (y - box.t) / box.h; return v >= 0 && v <= 1 && Math.abs(u - .5) <= hw(v); }

/* =========================================================
   HÉROS : mur de zellige + niche
   ========================================================= */
function initHero() {
  var hero = $('#top'), stage = $('#heroStage'), scene = $('#heroScene'), wall = $('#wall'), niche = $('#niche'),
      light = $('#wallLight'), copy = $('.hero__copy'), hint = $('#heroHint');
  var PK = ['bleu-3', 'bleu-1', 'bleu-2', 'blanc-1', 'blanc-2', 'jaune-1', 'jaune-3'];
  var css = PK.map(function (k) {
    return '.pt-' + k + '{background-image:radial-gradient(120% 100% at var(--hx,25%) var(--hy,15%),rgba(255,255,255,var(--ha,.26)),rgba(255,255,255,0) 60%),linear-gradient(160deg,rgba(255,255,255,.1),rgba(0,0,0,.18)),url("' + IMG['pt-' + k] + '");background-size:auto,auto,cover;background-position:0 0,0 0,var(--bx,50%) var(--by,50%)}';
  }).join('');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // niche : couches (anneaux) + photos
  niche.innerHTML = '<div class="niche__drop"><i></i></div><div class="niche__ring niche__ring--1"></div><div class="niche__ring niche__ring--2"></div><div class="niche__ring niche__ring--3"></div><div class="niche__ring niche__ring--4"></div><div class="niche__hole"><div class="niche__slides"></div><div class="niche__shade"></div></div>';
  var slidesBox = $('.niche__slides', niche);
  var SL = ['ph-f-bleue', 'ph-f-interieur', 'ph-f-lion', 'ph-p-arbre'];
  slidesBox.style.cssText = 'position:absolute;inset:0';
  var slides = SL.map(function (k, i) { var d = el('div', 'niche__photo' + (i === 0 ? ' is-on' : '')); d.style.backgroundImage = 'url("' + IMG[k] + '")'; slidesBox.appendChild(d); return d; });
  var si = 0, slideTimer = 0;
  function nextSlide() { slides[si].classList.remove('is-on'); si = (si + 1) % slides.length; slides[si].classList.add('is-on'); }
  function startSlides() { stopSlides(); if (!RM) slideTimer = setInterval(function () { if (!document.hidden) nextSlide(); }, 5200); }
  function stopSlides() { clearInterval(slideTimer); }

  var tiles = [], TS = 60, W = 0, H = 0, lastW = 0, lastH = 0, mobile = false, base = { rx: 7, ry: -15 };
  var built = false, done = false;

  function build() {
    W = stage.clientWidth; H = stage.clientHeight; mobile = W < 900;
    var cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    var copyBottom = cr.bottom - hr.top;
    TS = mobile ? Math.round(clamp(W / 6.7, 46, 62)) : Math.round(clamp(Math.min(H / 11, W / 18), 50, 84));
    var nwT = 5, nhT = 7, cx, cy;
    if (mobile) {
      cx = W / 2; var top = copyBottom + 22;
      cy = top + (nhT * TS) / 2;
      var need = Math.ceil(top + nhT * TS + TS * 1.3);
      hero.style.minHeight = Math.max(need, Math.round(window.innerHeight * .96)) + 'px';
      H = stage.clientHeight;
      base = { rx: 9, ry: -8 };
      stage.parentNode.style.setProperty('--vy', Math.round(copyBottom) + 'px');
    } else {
      cx = W * (W < 1200 ? .745 : .735); cy = H * .5 + 6;
      hero.style.minHeight = '';
      base = { rx: 7, ry: -16 };
    }
    var box = { l: cx - nwT * TS / 2, t: cy - nhT * TS / 2, w: nwT * TS, h: nhT * TS };
    niche.style.cssText = 'left:' + box.l + 'px;top:' + box.t + 'px;width:' + box.w + 'px;height:' + box.h + 'px;--b1:' + (TS * .13).toFixed(1) + 'px;--b2:' + (TS * .26).toFixed(1) + 'px;--b3:' + (TS * .38).toFixed(1) + 'px;--b4:' + (TS * .5).toFixed(1) + 'px';
    scene.style.transformOrigin = cx + 'px ' + cy + 'px';
    scene.style.setProperty('--rx', base.rx); scene.style.setProperty('--ry', base.ry);
    stage.style.perspectiveOrigin = (cx / W * 100).toFixed(1) + '% ' + (cy / H * 100).toFixed(1) + '%';
    wall.style.setProperty('--tw', (TS - 3) + 'px');
    light.style.cssText = 'left:0;top:0;width:' + W + 'px;height:' + H + 'px';

    wall.innerHTML = ''; tiles = []; done = false; wall.className = 'wall';
    var rnd = A.mulberry32(20260920);
    var RING = ['', 'bleu-1', 'blanc-1', 'bleu-3', 'jaune-1', 'blanc-1'];
    var minX = mobile ? -TS : W * .46, maxX = W + TS, minY = mobile ? copyBottom - TS * 1.2 : -TS, maxY = H + TS;
    var i0 = Math.ceil((cx - maxX) / TS) - 1, i1 = Math.ceil((maxX - cx) / TS) + 1, j0 = Math.floor((minY - cy) / TS) - 1, j1 = Math.ceil((maxY - cy) / TS) + 1;
    var frag = document.createDocumentFragment();
    for (var j = j0; j <= j1; j++) for (var i = -Math.ceil((cx - minX) / TS) - 1; i <= i1; i++) {
      var x = cx + i * TS, y = cy + j * TS;
      if (x < minX || x > maxX || y < minY || y > maxY) continue;
      // tuile entièrement masquée par la niche : inutile
      var hidden = true, k, kk;
      for (k = -1; k <= 1 && hidden; k++) for (kk = -1; kk <= 1; kk++) { if (!inside(x + k * TS * .5, y + kk * TS * .5, box)) { hidden = false; break; } }
      if (hidden) continue;
      // distance à l'arche (en tuiles)
      var u = (x - box.l) / box.w, v = (y - box.t) / box.h, vv = clamp(v, 0, 1);
      var dxo = Math.max(0, Math.abs(x - (box.l + box.w / 2)) - hw(vv) * box.w);
      var dyo = v < 0 ? (box.t - y) : (v > 1 ? (y - (box.t + box.h)) : 0);
      var dist = Math.hypot(dxo, dyo) / TS;
      var ring = Math.max(1, Math.ceil(dist - .25));
      var key;
      if (ring < RING.length) key = RING[ring];
      else { var r = rnd(); key = r < .06 ? 'bleu-1' : r < .1 ? 'jaune-1' : r < .12 ? 'jaune-3' : r < .62 ? 'blanc-1' : 'blanc-2'; }
      if (!mobile && x < W * .58 && (key === 'bleu-3' || key === 'jaune-3' || key === 'bleu-2')) key = 'blanc-1';
      var t = el('i', 'wt pt-' + key);
      t.style.left = (x - TS / 2 + 1.5).toFixed(1) + 'px'; t.style.top = (y - TS / 2 + 1.5).toFixed(1) + 'px';
      t.style.setProperty('--hx', (10 + rnd() * 60).toFixed(0) + '%'); t.style.setProperty('--hy', (rnd() * 50).toFixed(0) + '%');
      t.style.setProperty('--ha', (.12 + rnd() * .3).toFixed(2));
      t.style.setProperty('--bx', (rnd() * 100).toFixed(0) + '%'); t.style.setProperty('--by', (rnd() * 100).toFixed(0) + '%');
      t.style.setProperty('--d', (dist * .11 + rnd() * .24).toFixed(2) + 's');
      frag.appendChild(t);
      tiles.push({ el: t, x: x, y: y, l: 0, sx: x, sy: y });
    }
    wall.appendChild(frag);
    built = true;
    if (document.documentElement.classList.contains('is-ready')) play();
  }

  function measureTiles() {
    var sr = stage.getBoundingClientRect();
    tiles.forEach(function (t) { var r = t.el.getBoundingClientRect(); t.sx = r.left + r.width / 2 - sr.left; t.sy = r.top + r.height / 2 - sr.top; });
  }
  var played = false;
  function play() {
    if (!built || played) return; played = true;
    wall.classList.add('wall--in'); niche.classList.add('is-in');
    setTimeout(function () { wall.classList.add('wall--done'); done = true; measureTiles(); }, RM ? 30 : 3000);
    startSlides();
  }

  /* interaction : inclinaison de la scène + relief des tuiles */
  var lastIdle = 0, anyLift = false, mouse = { x: -999, y: -999, on: false }, want = { rx: 0, ry: 0 }, cur = { rx: 0, ry: 0 }, running = false, user = false, visible = true, t0 = performance.now();
  function setLight(px, py) { light.style.setProperty('--lx', px + 'px'); light.style.setProperty('--ly', py + 'px'); }
  function loop(now) {
    if (!visible) { running = false; return; }
    if (!user && !RM) {
      if (now - lastIdle < 30 && !anyLift) { raf(loop); return; }
      lastIdle = now; want.rx = Math.sin((now - t0) / 3800) * .3; want.ry = Math.cos((now - t0) / 4600) * .38;
    }
    cur.rx = lerp(cur.rx, want.rx, .07); cur.ry = lerp(cur.ry, want.ry, .07);
    scene.style.setProperty('--rx', (base.rx - cur.rx * 6).toFixed(3));
    scene.style.setProperty('--ry', (base.ry + cur.ry * 9).toFixed(3));
    if (done && (mouse.on || anyLift)) {
      var lifted = 0;
      for (var n = 0; n < tiles.length; n++) {
        var t = tiles[n], l = 0;
        if (mouse.on) { var d = Math.hypot(mouse.x - t.sx, mouse.y - t.sy); l = clamp(1 - d / (TS * 2.3), 0, 1); l = l * l * (3 - 2 * l); }
        if (Math.abs(l - t.l) > .015) { t.l = l; t.el.style.setProperty('--l', l.toFixed(3)); }
        if (t.l) lifted++;
      }
      anyLift = lifted > 0;
    }
    raf(loop);
  }
  function kick() { if (!running && visible) { running = true; raf(loop); } }
  function move(e) {
    var r = stage.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; user = true;
    want.ry = clamp((mouse.x / r.width - .5) * 2, -1, 1); want.rx = clamp((mouse.y / r.height - .5) * 2, -1, 1);
    setLight(mouse.x, mouse.y); hero.classList.add('is-lit');
    if (hint) hint.classList.add('is-gone');
    kick();
  }
  function leave() { mouse.on = false; user = false; hero.classList.remove('is-lit'); }
  if (FINE) { hero.addEventListener('pointermove', move); hero.addEventListener('pointerleave', leave); }
  else {
    stage.addEventListener('pointerdown', move); stage.addEventListener('pointermove', function (e) { if (e.pressure > 0 || e.buttons) move(e); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { stage.addEventListener(n, leave); });
  }
  if (hint) hint.textContent = FINE ? 'Bougez la souris : le mur s’incline' : 'Glissez le doigt sur le mur pour l’incliner';

  /* défilement : parallaxe douce */
  var pt = 0;
  function onScroll() { pt = 0; var y = window.scrollY, h = hero.offsetHeight; if (y < h * 1.1) scene.style.setProperty('--sy', (-y * .07).toFixed(1) + 'px'); }
  window.addEventListener('scroll', function () { if (!pt) pt = raf(onScroll); }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { kick(); startSlides(); } else stopSlides(); }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });

  /* reconstruction si la largeur change */
  var rt = 0;
  function rebuild() {
    var was = played; played = false; build(); lastW = stage.clientWidth; lastH = stage.clientHeight;
    if (was) { played = true; wall.classList.add('wall--in', 'wall--done'); niche.classList.add('is-in'); done = true; setTimeout(measureTiles, 60); }
  }
  function onResize() {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var w = stage.clientWidth, h = stage.clientHeight, m = w < 900;
      if (Math.abs(w - lastW) < 6 && (m || Math.abs(h - lastH) < 6)) return;
      rebuild();
    }, 180);
  }
  window.addEventListener('resize', onResize);
  if ('ResizeObserver' in window) {
    var lastCH = copy.offsetHeight;
    new ResizeObserver(function () {
      var ch = copy.offsetHeight;
      if (Math.abs(ch - lastCH) > 3) { lastCH = ch; if (stage.clientWidth < 900) { clearTimeout(rt); rt = setTimeout(rebuild, 120); } }
    }).observe(copy);
  }

  build(); lastW = stage.clientWidth; lastH = stage.clientHeight;
  kick();
  window.__heroPlay = play;
  // relance après chargement des polices (la hauteur du texte change)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { rebuild(); });
}

/* =========================================================
   Groupes 3D (À propos, Histoire) : inclinaison au pointeur + au défilement
   ========================================================= */
function initTiltGroups() {
  $$('[data-group3d]').forEach(function (box) {
    var g = $('.aa', box); if (!g) return;
    var px = 0, py = 0, sy = 0, pending = 0;
    function paint() {
      pending = 0;
      g.style.setProperty('--ay', (px * 10 + sy * 9).toFixed(2));
      g.style.setProperty('--ax', (-py * 7).toFixed(2));
    }
    function scroll() {
      var r = box.getBoundingClientRect(), vh = window.innerHeight;
      sy = clamp(((r.top + r.height / 2) - vh / 2) / vh, -1, 1) * -1;
      if (!pending) pending = raf(paint);
    }
    if (!RM) window.addEventListener('scroll', scroll, { passive: true });
    if (FINE && !RM) {
      box.addEventListener('pointermove', function (e) { var r = box.getBoundingClientRect(); px = (e.clientX - r.left) / r.width * 2 - 1; py = (e.clientY - r.top) / r.height * 2 - 1; if (!pending) pending = raf(paint); });
      box.addEventListener('pointerleave', function () { px = 0; py = 0; if (!pending) pending = raf(paint); });
    }
    scroll();
  });
}

/* =========================================================
   COLLECTIONS : coverflow 3D (défilement natif + transformations)
   ========================================================= */
function initCoverflow() {
  var track = $('#cfTrack'); if (!track) return;
  var COLL = A.COLL, items = [], cards = [], centers = [], pitch = 300, active = -1;
  var title = $('#cfTitle'), desc = $('#cfDesc'), actBox = $('#cfAct'), dots = $('#cfDots');

  COLL.forEach(function (c, i) {
    var it = el('article', 'cf__item'); it.setAttribute('role', 'group'); it.setAttribute('aria-roledescription', 'diapositive'); it.setAttribute('aria-label', (i + 1) + ' sur ' + COLL.length + ' : ' + c.name);
    var card = el('div', 'cf__card');
    var box = el('div', 'cf__img' + (c.contain ? ' cf__img--contain' : ''));
    var main = null;
    if (c.stack) {
      var st = el('div', 'cf__stack');
      c.vars.forEach(function (k, n) { var im = el('img'); im.alt = c.alts[n]; im.decoding = 'async'; im.dataset.img = k; st.appendChild(im); });
      box.appendChild(st);
    } else {
      main = el('img'); main.alt = c.alts[0]; main.decoding = 'async'; main.dataset.img = c.vars[0]; box.appendChild(main);
    }
    var cap = el('div', 'cf__cap');
    cap.appendChild(el('span', 'cf__name', A.esc(c.name)));
    if (!c.stack && c.vars.length > 1) {
      var vs = el('span', 'cf__vars'); vs.setAttribute('role', 'group'); vs.setAttribute('aria-label', 'Coloris de ' + c.name);
      c.vars.forEach(function (k, n) {
        var b = el('button', 'cf__var'); b.type = 'button'; b.setAttribute('aria-label', 'Voir : ' + c.alts[n]); b.setAttribute('aria-pressed', n === 0);
        var im = el('img'); im.alt = ''; im.dataset.img = k; b.appendChild(im);
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          $$('.cf__var', vs).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
          main.classList.add('is-swap');
          setTimeout(function () { main.src = IMG[k]; main.dataset.img = k; main.alt = c.alts[n]; main.classList.remove('is-swap'); c.cur = k; if (active === i) refreshInfo(); }, 200);
        });
        vs.appendChild(b);
      });
      cap.appendChild(vs);
    }
    card.append(box, cap); it.appendChild(card); track.appendChild(it);
    items.push(it); cards.push(card);
    it.addEventListener('click', function () { if (active !== i && !dragMoved) scrollToIndex(i); });
    c.cur = c.vars[0];
  });
  A.hydrate(track);
  COLL.forEach(function (c, i) { var d = el('i'); dots.appendChild(d); });

  function refreshInfo() {
    var c = COLL[active];
    title.textContent = c.name; desc.textContent = c.desc;
    var k = 'form:' + c.id, on = A.Sel.has(k);
    actBox.innerHTML = '';
    if (c.cta === 'couleurs') {
      var a = el('a', 'btn btn--primary btn--sm', 'Explorer les 41 couleurs ' + ico('i-arrow-r')); a.href = '#couleurs'; actBox.appendChild(a);
    } else {
      var b = el('button', 'btn btn--primary btn--sm'); b.type = 'button'; b.dataset.sel = k; b.dataset.selLabel = ''; actBox.appendChild(b);
      b.addEventListener('click', function () {
        var cur = c.cur || c.vars[0];
        var added = A.Sel.toggle({ k: k, kind: 'Forme', label: c.name, img: c.stack ? c.vars[0] : cur });
        A.toast(added ? c.name + ' ajouté à votre sélection' : c.name + ' retiré de votre sélection');
      });
      if (window.__renderSel) window.__renderSel();
    }
    var q = el('a', 'btn btn--ghost btn--sm', 'Demander un devis'); q.href = '#contact';
    q.addEventListener('click', function () { A.Contact && A.Contact.prefill({ reqs: ['Devis'], msg: 'Je suis intéressé(e) par : ' + c.name + '.' }); });
    actBox.appendChild(q);
    $$('i', dots).forEach(function (d, n) { d.classList.toggle('is-on', n === active); });
  }

  function measure() {
    centers = items.map(function (it) { return it.offsetLeft + it.offsetWidth / 2; });
    var gap = parseFloat(getComputedStyle(track).columnGap) || 26;
    pitch = (items[0] ? items[0].offsetWidth : 300) + gap;
  }
  var ticking = 0;
  function update() {
    ticking = 0;
    var c = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
    for (var i = 0; i < cards.length; i++) {
      var d = (centers[i] - c) / pitch, ad = Math.abs(d), a = clamp(d, -1.4, 1.4);
      var rot = RM ? 0 : -a * 42, z = RM ? 0 : -Math.min(ad, 2.2) * 120, s = 1 - Math.min(ad, 1.6) * .07, tx = -a * 26;
      cards[i].style.transform = 'perspective(1150px) translate3d(' + tx.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + rot.toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
      cards[i].style.opacity = String(clamp(1 - Math.max(0, ad - 1.2) * .45, .25, 1).toFixed(2));
      cards[i].style.setProperty('--sh', clamp(d, -1, 1).toFixed(3));
      if (ad < bd) { bd = ad; best = i; }
    }
    if (best !== active) { active = best; refreshInfo(); items.forEach(function (it, n) { it.setAttribute('aria-current', n === active ? 'true' : 'false'); }); }
  }
  function scrollToIndex(i) { i = clamp(i, 0, items.length - 1); track.scrollTo({ left: centers[i] - track.clientWidth / 2, behavior: RM ? 'auto' : 'smooth' }); }
  track.addEventListener('scroll', function () { if (!ticking) ticking = raf(update); }, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  $('#cfPrev').addEventListener('click', function () { scrollToIndex(active - 1); });
  $('#cfNext').addEventListener('click', function () { scrollToIndex(active + 1); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollToIndex(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToIndex(active - 1); }
  });

  /* glisser à la souris */
  var dragging = false, sx = 0, sl = 0, dragMoved = false, vel = 0, lastX = 0, lastT = 0;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button,a')) return;
    dragging = true; dragMoved = false; sx = e.clientX; sl = track.scrollLeft; lastX = e.clientX; lastT = performance.now(); vel = 0;
    track.classList.add('is-drag'); track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - sx; if (Math.abs(dx) > 4) dragMoved = true;
    track.scrollLeft = sl - dx;
    var now = performance.now(); vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
  });
  function endDrag(e) {
    if (!dragging) return; dragging = false; track.classList.remove('is-drag');
    try { track.releasePointerCapture(e.pointerId); } catch (x) {}
    var target = track.scrollLeft - vel * 260, c = target + track.clientWidth / 2, bi = 0, bd = 1e9;
    centers.forEach(function (x, i) { var d = Math.abs(x - c); if (d < bd) { bd = d; bi = i; } });
    scrollToIndex(bi); setTimeout(function () { dragMoved = false; }, 60);
  }
  track.addEventListener('pointerup', endDrag); track.addEventListener('pointercancel', endDrag);

  measure(); update();
  // centre sur la 2e carte au démarrage pour montrer la profondeur
  setTimeout(function () { measure(); track.scrollLeft = centers[1] - track.clientWidth / 2 - 1; update(); }, 60);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); update(); });
}

A.initHero = initHero; A.initTiltGroups = initTiltGroups; A.initCoverflow = initCoverflow;
})();
