/* =========================================================
   ArchiZellige — scripts (4/4) : compositeur sur mesure, contact, démarrage
   ========================================================= */
(function () {
'use strict';
var A = window.AZ, $ = A.$, $$ = A.$$, clamp = A.clamp, RM = A.RM, FINE = A.FINE, IMG = A.IMG, el = A.el, esc = A.esc, ico = A.ico, raf = A.raf, SW = A.SW, SWBY = A.SWBY, Sel = A.Sel;

/* =========================================================
   COMPOSITEUR : forme + couleurs + motif → aperçu 3D (canvas)
   ========================================================= */
function initComposer() {
  var cv = $('#cmpCanvas'); if (!cv) return;
  var ctx = cv.getContext('2d'), LW = 640, LH = 480, dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = LW * dpr; cv.height = LH * dpr;
  var S = { shape: 'hex', pattern: 'damier', pose: 'droite', c1: 'bleu-3', c2: 'blanc-1', slot: 1, seed: 11 };
  var SHAPES = [
    { id: 'carre',   label: 'Carré',           pose: true,  svg: '<rect x="4" y="4" width="16" height="16" rx="1"/>' },
    { id: 'rect',    label: 'Rectangle 5x15',  pose: true,  svg: '<rect x="1.5" y="8" width="21" height="8" rx="1"/>' },
    { id: 'hex',     label: 'Hexagone',        pose: false, svg: '<polygon points="12,2 20.7,7 20.7,17 12,22 3.3,17 3.3,7"/>' },
    { id: 'tri',     label: 'Triangle',        pose: false, svg: '<polygon points="12,3 22,20.5 2,20.5"/>' },
    { id: 'fish',    label: 'Écaille',         pose: false, svg: '<path d="M3 21v-9a9 9 0 0 1 18 0v9z"/>' },
    { id: 'diamond', label: 'Losange',         pose: false, svg: '<polygon points="12,1.5 19,12 12,22.5 5,12"/>' }
  ];
  var PATTERNS = [{ id: 'uni', label: 'Uni' }, { id: 'damier', label: 'Damier' }, { id: 'rayures', label: 'Rayures' }, { id: 'degrade', label: 'Dégradé' }];
  var POSES = [{ id: 'droite', label: 'Pose droite' }, { id: 'decalee', label: 'Pose décalée' }];
  var FORME = { carre: 'Carreaux carrés', rect: 'Rectangles 5x15', hex: 'Hexagones', tri: 'Triangles', fish: 'Écailles', diamond: 'Losanges' };

  var shapeBox = $('#cmpShapes'), patBox = $('#cmpPats'), poseBox = $('#cmpPoses'), pal = $('#cmpPal'), capEl = $('#cmpCap'), poseGrp = $('#cmpPoseGrp');
  var slot1 = $('#slot1'), slot2 = $('#slot2');

  function chipRow(box, list, key, svg) {
    list.forEach(function (o) {
      var b = el('button', 'chip'); b.type = 'button'; b.dataset.v = o.id; b.setAttribute('aria-pressed', S[key] === o.id);
      b.innerHTML = (svg ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + o.svg + '</svg>' : '') + esc(o.label);
      b.addEventListener('click', function () { S[key] = o.id; sync(); draw(); });
      box.appendChild(b);
    });
  }
  chipRow(shapeBox, SHAPES, 'shape', true); chipRow(patBox, PATTERNS, 'pattern', false); chipRow(poseBox, POSES, 'pose', false);

  SW.forEach(function (s) {
    var b = el('button'); b.type = 'button'; b.dataset.id = s.id; b.setAttribute('aria-label', s.label); b.title = s.label;
    b.style.backgroundColor = s.avg; b.style.backgroundImage = 'url("' + IMG['pt-' + s.id] + '")';
    b.addEventListener('click', function () { S['c' + S.slot] = s.id; sync(); draw(); });
    pal.appendChild(b);
  });
  slot1.addEventListener('click', function () { S.slot = 1; sync(); });
  slot2.addEventListener('click', function () { if (S.pattern === 'uni') { S.pattern = 'damier'; } S.slot = 2; sync(); draw(); });

  function sentence() {
    var n1 = SWBY[S.c1].label, n2 = SWBY[S.c2].label, sh = SHAPES.filter(function (x) { return x.id === S.shape; })[0];
    var s = FORME[S.shape] + ' en ' + n1 + (S.pattern === 'uni' ? '' : ' et ' + n2);
    s += { uni: '', damier: ', en damier', rayures: ', en rayures', degrade: ', en dégradé' }[S.pattern];
    if (sh.pose) s += S.pose === 'decalee' ? ', pose décalée' : ', pose droite';
    return s + '.';
  }
  function sync() {
    var sh = SHAPES.filter(function (x) { return x.id === S.shape; })[0];
    $$('.chip', shapeBox).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S.shape); });
    $$('.chip', patBox).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S.pattern); });
    $$('.chip', poseBox).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S.pose); });
    poseGrp.hidden = !sh.pose;
    [[slot1, S.c1, 1], [slot2, S.c2, 2]].forEach(function (a) {
      var s = SWBY[a[1]], sw = $('.slot__sw', a[0]);
      sw.style.backgroundColor = s.avg; sw.style.backgroundImage = 'url("' + IMG['pt-' + s.id] + '")';
      $('.slot__n', a[0]).textContent = s.label;
      a[0].setAttribute('aria-pressed', S.slot === a[2]);
    });
    slot2.classList.toggle('is-off', S.pattern === 'uni');
    $$('button', pal).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.id === S['c' + S.slot]); });
    capEl.textContent = sentence();
    var k = cmpKey(); $$('[data-sel-cmp]').forEach(function (b) { b.dataset.sel = k; });
    if (window.__renderSel) window.__renderSel();
  }
  function cmpKey() { return 'cmp:' + [S.shape, S.pattern, S.pose, S.c1, S.pattern === 'uni' ? '' : S.c2].join('-'); }

  /* ---- géométrie des poses ---- */
  function polyBB(p) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; p.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }
  function mk(poly, i, j, inr) {
    var cx = 0, cy = 0; poly.forEach(function (q) { cx += q[0]; cy += q[1]; }); cx /= poly.length; cy /= poly.length;
    var k = 1 - 1.5 / inr;
    var p = poly.map(function (q) { return [cx + (q[0] - cx) * k, cy + (q[1] - cy) * k]; });
    return { poly: p, cx: cx, cy: cy, i: i, j: j, bb: polyBB(p) };
  }
  function layout() {
    var T = [], shape = S.shape, pose = S.pose, i, j;
    if (shape === 'carre') {
      var s = 66, cols = Math.ceil(LW / s) + 3, rows = Math.ceil(LH / s) + 2, ox = (LW - (cols - 3) * s) / 2 - s * 1.5, oy = (LH - (rows - 2) * s) / 2 - s;
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) { var x = ox + i * s + (pose === 'decalee' && (j & 1) ? s / 2 : 0), y = oy + j * s; T.push(mk([[x, y], [x + s, y], [x + s, y + s], [x, y + s]], i, j, s / 2)); }
    } else if (shape === 'rect') {
      var L = 99, H = 33, cols2 = Math.ceil(LW / L) + 3, rows2 = Math.ceil(LH / H) + 2, ox2 = (LW - (cols2 - 3) * L) / 2 - L * 1.5, oy2 = (LH - (rows2 - 2) * H) / 2 - H;
      for (j = 0; j < rows2; j++) for (i = 0; i < cols2; i++) { var x2 = ox2 + i * L + (pose === 'decalee' && (j & 1) ? L / 2 : 0), y2 = oy2 + j * H; T.push(mk([[x2, y2], [x2 + L, y2], [x2 + L, y2 + H], [x2, y2 + H]], i, j, H / 2)); }
    } else if (shape === 'hex') {
      var R = 43, w = Math.sqrt(3) * R, rh = 1.5 * R, cols3 = Math.ceil(LW / w) + 3, rows3 = Math.ceil(LH / rh) + 3, ox3 = (LW - (cols3 - 3) * w) / 2 - w * 1.5, oy3 = (LH - (rows3 - 3) * rh) / 2 - rh * 1.5;
      for (j = 0; j < rows3; j++) for (i = 0; i < cols3; i++) {
        var hx = ox3 + i * w + (j & 1 ? w / 2 : 0), hy = oy3 + j * rh, pts = [];
        for (var k = 0; k < 6; k++) { var a = Math.PI / 180 * (60 * k - 90); pts.push([hx + R * Math.cos(a), hy + R * Math.sin(a)]); }
        T.push(mk(pts, i, j, R * .866));
      }
    } else if (shape === 'tri') {
      var a4 = 86, h4 = a4 * .8660254, rows4 = Math.ceil(LH / h4) + 2, cols4 = Math.ceil(LW / a4) + 3, ox4 = -a4 * 1.5, oy4 = (LH - (rows4 - 2) * h4) / 2 - h4;
      for (j = 0; j < rows4; j++) { var y0 = oy4 + j * h4, y1 = y0 + h4, off = j & 1 ? a4 / 2 : 0;
        for (var m = 0; m < cols4; m++) { var xx = ox4 + off + m * a4;
          T.push(mk([[xx, y1], [xx + a4, y1], [xx + a4 / 2, y0]], m * 2, j, a4 * .2887));
          T.push(mk([[xx + a4 / 2, y0], [xx + a4 * 1.5, y0], [xx + a4, y1]], m * 2 + 1, j, a4 * .2887));
        } }
    } else if (shape === 'diamond') {
      var dw = 66, dh = 106, cols5 = Math.ceil(LW / dw) + 3, rows5 = Math.ceil(LH / (dh / 2)) + 4, ox5 = (LW - (cols5 - 3) * dw) / 2 - dw * 1.5, oy5 = -dh;
      for (j = 0; j < rows5; j++) for (i = 0; i < cols5; i++) {
        var dx = ox5 + i * dw + (j & 1 ? dw / 2 : 0), dy = oy5 + j * dh / 2;
        T.push(mk([[dx, dy - dh / 2], [dx + dw / 2, dy], [dx, dy + dh / 2], [dx - dw / 2, dy]], i, j, 27));
      }
    } else if (shape === 'fish') {
      var r = 39, rows6 = Math.ceil(LH / r) + 3, cols6 = Math.ceil(LW / (2 * r)) + 3, ox6 = (LW - (cols6 - 3) * 2 * r) / 2 - r * 3, oy6 = (LH - (rows6 - 3) * r) / 2 - r * 1.5;
      for (j = 0; j < rows6; j++) for (i = 0; i < cols6; i++) {
        var fx = ox6 + i * 2 * r + (j & 1 ? r : 0), fy = oy6 + j * r;
        T.push({ disc: true, r: r, cx: fx, cy: fy, i: i, j: j, bb: { x: fx - r, y: fy - r, w: 2 * r, h: 2 * r } });
      }
    }
    return T.filter(function (t) { return t.bb.x < LW + 4 && t.bb.y < LH + 4 && t.bb.x + t.bb.w > -4 && t.bb.y + t.bb.h > -4; });
  }
  function polyPath(pts) { var p = new Path2D(); pts.forEach(function (q, n) { n ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]); }); p.closePath(); return p; }

  var cache = {};
  function loadPatch(id) {
    if (!cache[id]) cache[id] = new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = IMG['pt-' + id]; });
    return cache[id];
  }
  function patch(img, bb, r, alpha) {
    var ar = bb.w / bb.h, sw, sh;
    if (ar >= 1) { sw = 90 + r[0] * 70; sh = sw / ar; } else { sh = 90 + r[0] * 70; sw = sh * ar; }
    sw = Math.min(sw, 160); sh = Math.min(sh, 160);
    var sx = r[1] * (160 - sw), sy = r[2] * (160 - sh);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(bb.x + bb.w / 2, bb.y + bb.h / 2); ctx.scale(r[3] < .5 ? -1 : 1, r[0] < .5 ? -1 : 1);
    ctx.drawImage(img, sx, sy, sw, sh, -bb.w / 2, -bb.h / 2, bb.w, bb.h); ctx.restore();
  }
  var drawV = 0;
  function draw() {
    var v = ++drawV;
    Promise.all([loadPatch(S.c1), loadPatch(S.c2)]).then(function (imgs) {
      if (v !== drawV || !imgs[0] || !imgs[1]) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#C9C0B0'; ctx.fillRect(0, 0, LW, LH);
      var rnd = A.mulberry32(S.seed * 7919 + 13), tiles = layout();
      tiles.forEach(function (t) {
        var r1 = [rnd(), rnd(), rnd(), rnd()], r2 = [rnd(), rnd(), rnd(), rnd()], tone = rnd(), tone2 = rnd(), jit = rnd();
        var m = 0;
        if (S.pattern === 'damier') m = ((t.i + t.j) & 1) ? 1 : 0;
        else if (S.pattern === 'rayures') m = (t.j & 1) ? 1 : 0;
        else if (S.pattern === 'degrade') m = clamp(1 - t.cy / LH + (jit - .5) * .3, 0, 1);
        ctx.save();
        if (t.disc) { ctx.beginPath(); ctx.arc(t.cx, t.cy, t.r, 0, Math.PI * 2); ctx.clip(); } else ctx.clip(polyPath(t.poly));
        patch(imgs[0], t.bb, r1, 1);
        if (m > .001) patch(imgs[1], t.bb, r2, m);
        ctx.fillStyle = tone < .5 ? 'rgba(255,255,255,' + (.03 + tone2 * .11).toFixed(3) + ')' : 'rgba(0,0,0,' + (.03 + tone2 * .12).toFixed(3) + ')';
        ctx.fillRect(t.bb.x, t.bb.y, t.bb.w, t.bb.h);
        var g = ctx.createLinearGradient(t.bb.x, t.bb.y, t.bb.x + t.bb.w, t.bb.y + t.bb.h);
        g.addColorStop(0, 'rgba(255,255,255,.3)'); g.addColorStop(.42, 'rgba(255,255,255,.03)'); g.addColorStop(1, 'rgba(0,0,0,.26)');
        ctx.fillStyle = g; ctx.fillRect(t.bb.x, t.bb.y, t.bb.w, t.bb.h);
        ctx.restore();
        if (t.disc) { ctx.beginPath(); ctx.arc(t.cx, t.cy, t.r - .5, 0, Math.PI * 2); ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(52,40,30,.55)'; ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(t.cx, t.cy, t.r - 2.2, Math.PI * 1.05, Math.PI * 1.9); ctx.stroke(); }
        else { var pp = polyPath(t.poly); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.24)'; ctx.stroke(pp); }
      });
      var vg = ctx.createRadialGradient(LW * .32, LH * .2, 20, LW * .5, LH * .5, LW * .78);
      vg.addColorStop(0, 'rgba(255,255,255,.1)'); vg.addColorStop(1, 'rgba(0,0,0,.2)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, LW, LH);
    });
  }

  /* ---- 3D : inclinaison au pointeur / au doigt ---- */
  var wall = $('#cmpWall'), stage = $('#cmpStage'), idle = !RM, t0 = performance.now(), user = false, sway = 0;
  function tiltTo(px, py) {
    wall.style.setProperty('--cy', (-13 + (px - .5) * 22).toFixed(2)); wall.style.setProperty('--cx', (7 - (py - .5) * 16).toFixed(2));
    wall.style.setProperty('--sx', (px * 100).toFixed(0) + '%'); wall.style.setProperty('--sy', (py * 100).toFixed(0) + '%');
  }
  function onMove(e) { var r = stage.getBoundingClientRect(); user = true; wall.classList.add('is-drag'); tiltTo(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1)); }
  function onEnd() { user = false; wall.classList.remove('is-drag'); tiltTo(.5, .5); }
  stage.addEventListener('pointermove', function (e) { if (FINE || e.buttons || e.pressure > 0) onMove(e); });
  ['pointerleave', 'pointerup', 'pointercancel'].forEach(function (n) { stage.addEventListener(n, onEnd); });
  if (idle && 'IntersectionObserver' in window) {
    var vis = false; new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) raf(swayLoop); }, { threshold: .1 }).observe(stage);
    var swayLoop = function (now) { if (!vis) return; if (!user) { var t = (now - t0) / 1000; tiltTo(.5 + Math.sin(t * .7) * .16, .5 + Math.cos(t * .55) * .12); wall.classList.add('is-drag'); } raf(swayLoop); };
  }

  /* ---- actions ---- */
  function thumb() { try { var c = document.createElement('canvas'); c.width = 160; c.height = 120; c.getContext('2d').drawImage(cv, 0, 0, 160, 120); return c.toDataURL('image/jpeg', .7); } catch (e) { return null; } }
  function ensureInSel() { var k = cmpKey(); if (!Sel.has(k)) Sel.add({ k: k, kind: 'Composition', label: 'Composition\u00a0: ' + sentence(), thumb: thumb() }); return k; }
  $('#cmpAdd').addEventListener('click', function () {
    var k = cmpKey();
    if (Sel.has(k)) { Sel.remove(k); A.toast('Composition retirée de votre sélection'); }
    else { ensureInSel(); A.toast('Composition ajoutée à votre sélection'); }
  });
  $('#cmpAsk').addEventListener('click', function () {
    ensureInSel();
    A.Contact.prefill({ reqs: ['Devis', 'Projet sur mesure'], msg: 'Composition souhaitée : ' + sentence(), focus: true });
  });
  $('#cmpShuffle').addEventListener('click', function () { S.seed++; draw(); });

  sync(); draw(); tiltTo(.5, .5);
  A.Composer = {
    setColor: function (id) { if (SWBY[id]) { S['c' + S.slot] = id; sync(); draw(); } },
    state: S
  };
}

/* =========================================================
   CONTACT : demande par WhatsApp ou e-mail
   ========================================================= */
function initContact() {
  var form = $('#cform'); if (!form) return;
  var reqBox = $('#reqs'), status = $('#cfb'), selBox = $('#ctSel');
  var REQS = ['Catalogue', 'Échantillons', 'Devis', 'Informations sur les couleurs', 'Projet sur mesure'];
  REQS.forEach(function (r) {
    var b = el('button', 'chip', esc(r)); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); clearErr(); });
    reqBox.appendChild(b);
  });
  function getReqs() { return $$('.chip', reqBox).filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return b.textContent; }); }
  function f(n) { return form.elements[n]; }

  function renderSel() {
    var items = Sel.items; selBox.hidden = !items.length;
    if (!items.length) { selBox.innerHTML = ''; return; }
    selBox.innerHTML = '<span><b>Votre sélection sera jointe à la demande</b> (' + items.length + ')</span><ul>' + items.map(function (it) {
      var bg = it.img && IMG[it.img] ? IMG[it.img] : (it.thumb || '');
      return '<li><i style="background-image:url(\'' + bg + '\')"></i>' + esc(it.label) + '</li>';
    }).join('') + '</ul>';
  }
  Sel.on(renderSel); renderSel();

  function build() {
    var reqs = getReqs(), L = [];
    L.push('Bonjour La Maison AZ,');
    L.push(reqs.length ? 'Je souhaite\u00a0: ' + reqs.join(', ') + '.' : 'Je souhaite en savoir plus sur vos zelliges.');
    if (f('projet').value) L.push('Projet : ' + f('projet').value);
    if (f('ville').value.trim()) L.push('Ville / pays : ' + f('ville').value.trim());
    if (Sel.items.length) { L.push('', 'Ma sélection :'); Sel.items.forEach(function (i) { L.push('- ' + i.label); }); }
    if (f('msg').value.trim()) L.push('', f('msg').value.trim());
    L.push('', f('nom').value.trim() + (f('contact').value.trim() ? ' (' + f('contact').value.trim() + ')' : ''));
    return L.join('\n');
  }
  function clearErr() { $$('.fld', form).forEach(function (n) { n.classList.remove('is-bad'); var e = $('.err', n); if (e) e.remove(); }); status.className = 'cfb'; status.textContent = ''; }
  function bad(name, msg) { var fld = f(name).closest('.fld'); fld.classList.add('is-bad'); fld.appendChild(el('span', 'err', msg)); }
  function validate() {
    clearErr(); var ok = true;
    if (!f('nom').value.trim()) { bad('nom', 'Indiquez votre nom.'); ok = false; }
    if (!getReqs().length && !f('msg').value.trim()) { status.className = 'cfb is-bad'; status.textContent = 'Choisissez au moins une demande, ou écrivez un message.'; ok = false; }
    if (!ok) { var first = $('.is-bad input', form); if (first) first.focus(); }
    return ok;
  }
  function open(url, blank) {
    var a = document.createElement('a'); a.href = url; if (blank) { a.target = '_blank'; a.rel = 'noopener'; }
    a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 400);
  }
  function fallbackNote() { setTimeout(function () { if (!status.classList.contains('is-bad')) status.innerHTML += ' <span>Si rien ne s’ouvre, copiez le message et écrivez-nous.</span>'; }, 1600); }
  $('#sendWa').addEventListener('click', function () {
    if (!validate()) return; var msg = build();
    open('https://wa.me/' + A.WA_NUMBER + '?text=' + encodeURIComponent(msg), true);
    status.className = 'cfb is-ok'; status.textContent = 'Ouverture de WhatsApp avec votre message…'; fallbackNote();
  });
  $('#sendMail').addEventListener('click', function () {
    if (!validate()) return; var msg = build(), reqs = getReqs();
    open('mailto:' + A.MAIL + '?subject=' + encodeURIComponent('Demande ArchiZellige : ' + (reqs.join(', ') || 'contact')) + '&body=' + encodeURIComponent(msg));
    status.className = 'cfb is-ok'; status.textContent = 'Ouverture de votre messagerie…'; fallbackNote();
  });
  $('#copyMsg').addEventListener('click', function () {
    if (!validate()) return; var msg = build();
    function ok() { status.className = 'cfb is-ok'; status.textContent = 'Message copié : collez-le dans WhatsApp, un e-mail ou un SMS.'; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(ok, function () { fb(); });
    else fb();
    function fb() { var t = document.createElement('textarea'); t.value = msg; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) { status.className = 'cfb is-bad'; status.textContent = 'Copie impossible : sélectionnez le texte du message manuellement.'; } t.remove(); }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); $('#sendWa').click(); });
  ['nom', 'msg', 'contact', 'ville', 'projet'].forEach(function (n) { f(n).addEventListener('input', clearErr); });

  A.Contact = {
    prefill: function (o) {
      o = o || {};
      if (o.reqs) $$('.chip', reqBox).forEach(function (b) { if (o.reqs.indexOf(b.textContent) > -1) b.setAttribute('aria-pressed', 'true'); });
      if (o.msg) { var t = f('msg'); if (t.value.indexOf(o.msg) < 0) t.value = (t.value ? t.value + '\n' : '') + o.msg; }
      if (o.projet) f('projet').value = o.projet;
      if (o.focus) { A.goTo('#contact'); setTimeout(function () { try { f('nom').focus({ preventScroll: true }); } catch (e) {} }, 700); }
    }
  };
}

/* =========================================================
   DÉMARRAGE
   ========================================================= */
function boot() {
  var t0 = performance.now();
  A.safe('selection', A.initSelection);
  A.safe('header', A.initHeader);
  A.safe('hero', A.initHero);
  A.safe('tilt', A.initTiltGroups);
  A.safe('coverflow', A.initCoverflow);
  A.safe('colors', A.initColors);
  A.safe('gallery', A.initGallery);
  A.safe('apps', A.initApps);
  A.safe('atelier', A.initAtelier);
  A.safe('video-section', A.initVideoSection);
  A.safe('composer', initComposer);
  A.safe('contact', initContact);
  $$('[data-ask]').forEach(function (b) { b.addEventListener('click', function () { A.Contact.prefill({ reqs: [b.dataset.ask], focus: true }); }); });
  $$('[data-wa]').forEach(function (a) { a.href = 'https://wa.me/' + A.WA_NUMBER; });
  $$('[data-tel]').forEach(function (a) { a.href = 'tel:+' + A.WA_NUMBER; });
  A.hydrate(document);
  if (window.__renderSel) window.__renderSel();

  function ready() {
    var wait = Math.max(0, 1100 - (performance.now() - t0));
    setTimeout(function () {
      document.documentElement.classList.add('is-ready');
      var ld = $('#loader'); if (ld) { ld.classList.add('is-out'); setTimeout(function () { ld.remove(); }, 900); }
      if (window.__heroPlay) setTimeout(window.__heroPlay, 260);
    }, wait);
  }
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1800); })]).then(ready, ready);
}
try { boot(); } catch (e) { console.error(e); document.documentElement.classList.add('is-ready'); var l = document.getElementById('loader'); if (l) l.remove(); }
})();
