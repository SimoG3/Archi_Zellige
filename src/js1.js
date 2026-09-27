/* =========================================================
   ArchiZellige — scripts (1/4) : noyau, données, sélection, en-tête
   ========================================================= */
(function () {
'use strict';

/* ---------- constantes à vérifier ---------- */
var WA_NUMBER = '212661316229'; // WhatsApp / téléphone : +212 661-316229
var MAIL = 'maison.az2026@gmail.com';
var IG_URL = 'https://www.instagram.com/maison.zellige/';

/* ---------- utilitaires ---------- */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var ease = function (t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
var smooth = function (a, b, t) { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var FINE = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
var IMG = window.__IMG || {};
var META = window.__META || {};
function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function raf(fn) { return requestAnimationFrame(fn); }
function safe(name, fn) { try { fn(); } catch (e) { console.error('[init ' + name + ']', e); } }
function ico(id, cls) { return '<svg class="ico ' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }

/* ---------- données ---------- */
var FAM = {
  blanc:  { name: 'Blancs',     sing: 'Blanc',      items: ['blanc-1', 'blanc-2'] },
  jaune:  { name: 'Jaunes',     sing: 'Jaune',      items: ['jaune-1', 'jaune-2', 'jaune-3'] },
  terra:  { name: 'Terracotta', sing: 'Terracotta', items: ['terra-1', 'terra-2', 'terra-3', 'terra-4'] },
  rouge:  { name: 'Rouges',     sing: 'Rouge',      items: ['rouge-1', 'rouge-2', 'rouge-3', 'rouge-4', 'rouge-5'] },
  rose:   { name: 'Roses',      sing: 'Rose',       items: ['rose-1', 'rose-2', 'rose-3', 'rose-4'] },
  violet: { name: 'Violets',    sing: 'Violet',     items: ['violet-1', 'violet-2', 'violet-3', 'violet-4'] },
  bleu:   { name: 'Bleus',      sing: 'Bleu',       items: ['bleu-1', 'bleu-2', 'bleu-3', 'bleu-4'] },
  vert:   { name: 'Verts',      sing: 'Vert',       items: ['vert-1', 'vert-2', 'vert-3', 'vert-4'] },
  marron: { name: 'Marrons',    sing: 'Marron',     items: ['marron-1', 'marron-2', 'marron-3'] },
  noir:   { name: 'Noirs',      sing: 'Noir',       items: ['noir-1', 'noir-2', 'noir-3', 'noir-4', 'noir-5'] },
  metal:  { name: 'Métallisés', sing: 'Métallisé',  items: ['metal-or', 'metal-argent', 'metal-cuivre'], labels: ['Or', 'Argent', 'Cuivre'] }
};
var FAM_ORDER = ['blanc', 'jaune', 'terra', 'rouge', 'rose', 'violet', 'bleu', 'vert', 'marron', 'noir', 'metal'];
var SW = []; // liste à plat des 41 nuances
var SWBY = {};
FAM_ORDER.forEach(function (fid) {
  var f = FAM[fid], r = 0, g = 0, b = 0;
  f.items.forEach(function (id, i) {
    var avg = (META['pt-' + id] || { avg: '#888888' }).avg;
    var s = { id: id, fam: fid, n: i + 1, total: f.items.length, avg: avg, label: f.labels ? f.labels[i] : f.sing + ' ' + String(i + 1).padStart(2, '0') };
    SW.push(s); SWBY[id] = s;
    r += parseInt(avg.slice(1, 3), 16); g += parseInt(avg.slice(3, 5), 16); b += parseInt(avg.slice(5, 7), 16);
  });
  var n = f.items.length;
  f.color = 'rgb(' + Math.round(r / n) + ',' + Math.round(g / n) + ',' + Math.round(b / n) + ')';
});

var COLL = [
  { id: 'uni', name: 'Carreaux unis', desc: 'Le zellige classique, émaillé à la main\u00a0: 41 couleurs réparties en 11 familles, du blanc de chaux au noir profond.', vars: ['collage-uni'], alts: ['Collage de carreaux unis de couleurs variées'], cta: 'couleurs' },
  { id: 'rect', name: 'Rectangulaire 5x15', desc: 'Un format allongé qui structure le mur : en pose droite ou décalée, en crédence ou en revêtement complet.', vars: ['form-rect-1', 'form-rect-2'], alts: ['Zellige rectangulaire 5x15, rose pâle', 'Zellige rectangulaire 5x15, vert d’eau'], contain: true },
  { id: 'hex', name: 'Hexagonal S', desc: 'La forme alvéole, pour des murs et des sols graphiques qui accrochent la lumière.', vars: ['form-hex-1', 'form-hex-2'], alts: ['Zellige hexagonal S, aubergine', 'Zellige hexagonal S, rose'], contain: true },
  { id: 'tri', name: 'Triangle équilatéral', desc: 'Des facettes qui jouent avec la lumière : un effet de relief sans quitter le mur plat.', vars: ['form-tri-1', 'form-tri-2'], alts: ['Zellige triangle équilatéral, vert émeraude', 'Zellige triangle équilatéral, turquoise'], contain: true },
  { id: 'fish', name: 'Fish', desc: 'Le motif en écailles, tout en courbes, pour des surfaces douces et vivantes.', vars: ['form-fish-1', 'form-fish-2'], alts: ['Zellige forme Fish, vert', 'Zellige forme Fish, bordeaux'], contain: true },
  { id: 'diamond', name: 'Diamond S', desc: 'Le losange : sobre en tons clairs, précieux associé aux métallisés or et argent.', vars: ['form-diamond-1', 'form-diamond-2'], alts: ['Zellige forme Diamond S, rose poudré', 'Zellige forme Diamond S, or et gris clair'], contain: true },
  { id: 'arab', name: 'Arabesc Complex', desc: 'Compositions de mosaïque aux étoiles et aux entrelacs, fidèles à la tradition du zellige.', vars: ['arab-1', 'arab-2', 'arab-3', 'arab-4'], alts: ['Arabesc Complex, tons sable et crème', 'Arabesc Complex, mauve et bordeaux', 'Arabesc Complex, pêche et crème', 'Arabesc Complex, vert d’eau et ocre'] },
  { id: 'borders', name: 'Frises (Borders)', desc: 'Frises et bordures pour encadrer, souligner et finir un mur ou une fontaine.', vars: ['border-1', 'border-2', 'border-3', 'border-4'], alts: ['Frise crème et sable en losanges', 'Frise de rosaces blanches', 'Frise de losanges noirs et blancs', 'Frise verte et blanche à motif crénelé'], stack: true }
];

var GAL = [
  { k: 'f-bleue',      cat: 'fontaines', t: 'Fontaine en mosaïque turquoise, verte et jaune' },
  { k: 'p-arbre',      cat: 'murs',      t: 'Panneau décoratif au motif végétal' },
  { k: 'c-marine',     cat: 'cuisines',  t: 'Crédence arabesque bleu nuit' },
  { k: 'f-interieur',  cat: 'fontaines', t: 'Grande fontaine murale intérieure' },
  { k: 'm-nuancier',   cat: 'matieres',  t: 'Nuancier\u00a0: blancs, noirs, vert et rectangles' },
  { k: 'h-hammam',     cat: 'cuisines',  t: 'Hammam en zellige beige et frises noires' },
  { k: 'p-salon',      cat: 'murs',      t: 'Mur mosaïque complet dans un salon' },
  { k: 'c-aubergine',  cat: 'cuisines',  t: 'Crédence aubergine aux reflets cuivrés' },
  { k: 'f-lion',       cat: 'fontaines', t: 'Fontaine en zellige clair, tête de lion' },
  { k: 'm-triangles',  cat: 'murs',      t: 'Mur de triangles émaillés verts' },
  { k: 'c-bordeaux',   cat: 'cuisines',  t: 'Crédence bordeaux, cuisine' },
  { k: 'm-vert',       cat: 'matieres',  t: 'Carreaux verts émaillés' },
  { k: 'm-bordeaux-or',cat: 'matieres',  t: 'Nuancier bordeaux et rosé, inserts dorés' },
  { k: 'm-pose',       cat: 'matieres',  t: 'Pose de carreaux bordeaux' }
];
var GCATS = [
  { id: 'all', name: 'Tout' }, { id: 'fontaines', name: 'Fontaines' }, { id: 'murs', name: 'Murs et panneaux' },
  { id: 'cuisines', name: 'Cuisines et hammam' }, { id: 'matieres', name: 'Matières et pose' }
];

var APPS = [
  { n: 'Cuisines',              d: 'Crédences, îlots, murs.',                 img: 'ph-c-marine',    pat: 8 },
  { n: 'Salles de bains',       d: 'Murs, douches, vasques.',                 img: 'ph-m-triangles', pat: 12 },
  { n: 'Hammams',               d: 'Murs, banquettes, sols, voûtes.',         img: 'ph-h-hammam',    pat: 8 },
  { n: 'Riads',                 d: 'Patios, fontaines, panneaux.',            img: 'ph-f-interieur', pat: 10 },
  { n: 'Hôtels',                d: 'Halls, suites, espaces communs.',         img: 'ph-f-bleue',     pat: 12 },
  { n: 'Restaurants',           d: 'Comptoirs, murs, entrées.',               img: 'ph-p-arbre',     pat: 8 },
  { n: 'Villas',                d: 'Fontaines, terrasses, piscines.',         img: 'ph-f-lion',      pat: 10 },
  { n: 'Projets architecturaux',d: 'Façades, patios, ouvrages sur mesure.',   img: 'ph-p-salon',     pat: 12 },
  { n: 'Décoration intérieure', d: 'Niches, cheminées, tables, détails.',     img: 'ph-c-aubergine', pat: 8 }
];
var APP_COL = [['#DCE9F5', '#0C1B36'], ['#94B0D3', '#0C1B36'], ['#3F6FA0', '#F6F2EA'], ['#CFA04A', '#0C1B36']];

/* ---------- motifs d'étoiles (SVG procédural) ---------- */
function starPts(n, R, r, rot) {
  var pts = [];
  for (var k = 0; k < n * 2; k++) {
    var a = rot + k * Math.PI / n, rr = k % 2 ? r : R;
    pts.push((50 + rr * Math.cos(a)).toFixed(1) + ',' + (50 + rr * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
}
function starSVG(n) {
  var ratio = n === 8 ? 0.7654 : n === 10 ? 0.8 : 0.84, top = -Math.PI / 2, s = '';
  s += '<rect x="7" y="7" width="86" height="86"/>';
  s += '<polygon points="' + starPts(n, 43, 43 * ratio, top) + '"/>';
  s += '<polygon points="' + starPts(n, 31, 31 * ratio, top + Math.PI / n) + '"/>';
  s += '<circle cx="50" cy="50" r="9.5"/>';
  for (var k = 0; k < n; k++) {
    var a = top + k * 2 * Math.PI / n;
    s += '<line x1="' + (50 + 9.5 * Math.cos(a)).toFixed(1) + '" y1="' + (50 + 9.5 * Math.sin(a)).toFixed(1) + '" x2="' + (50 + 31 * Math.cos(a)).toFixed(1) + '" y2="' + (50 + 31 * Math.sin(a)).toFixed(1) + '"/>';
  }
  return s;
}

/* ---------- hydratation des images (base64 → src, à l'approche) ---------- */
var io = null;
if ('IntersectionObserver' in window) {
  io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { apply(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '700px 700px' });
}
function apply(n) {
  if (n.dataset.img) { if (IMG[n.dataset.img]) n.src = IMG[n.dataset.img]; }
  else if (n.dataset.bg) { if (IMG[n.dataset.bg]) n.style.backgroundImage = 'url("' + IMG[n.dataset.bg] + '")'; }
  else if (n.dataset.poster) { if (IMG[n.dataset.poster]) n.poster = IMG[n.dataset.poster]; }
}
function hydrate(root) {
  $$('[data-img],[data-bg],[data-poster]', root || document).forEach(function (n) {
    if (n.__h) return; n.__h = 1;
    if (io) io.observe(n); else apply(n);
  });
}
function imgNow(n, key) { n.dataset.img = key; n.__h = 1; if (IMG[key]) n.src = IMG[key]; }

/* ---------- inclinaison au pointeur ---------- */
function tilt(node, opt) {
  if (!FINE || RM) return;
  opt = opt || {};
  var max = opt.max == null ? 8 : opt.max, vars = opt.vars || node, px = .5, py = .5, pending = 0;
  function paint() {
    pending = 0;
    vars.style.setProperty('--tx', ((.5 - py) * 2 * max).toFixed(2));
    vars.style.setProperty('--ty', ((px - .5) * 2 * max).toFixed(2));
    vars.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
    vars.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    vars.style.setProperty('--go', 1);
  }
  node.addEventListener('pointerenter', function () { node.classList.add('is-tilt'); });
  node.addEventListener('pointermove', function (e) {
    var r = node.getBoundingClientRect();
    px = clamp((e.clientX - r.left) / r.width, 0, 1); py = clamp((e.clientY - r.top) / r.height, 0, 1);
    if (!pending) pending = raf(paint);
  });
  node.addEventListener('pointerleave', function () {
    node.classList.remove('is-tilt');
    vars.style.setProperty('--tx', 0); vars.style.setProperty('--ty', 0); vars.style.setProperty('--go', 0);
  });
}

/* ---------- modales : ouverture, focus, échappement ---------- */
var Modal = {
  cur: null, opener: null,
  open: function (m, opener) {
    if (Modal.cur && Modal.cur !== m) Modal.close(true);
    Modal.cur = m; Modal.opener = opener || document.activeElement;
    m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    var f = $('[data-autofocus]', m) || $('button,a[href]', m); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
  },
  close: function (keepFocus) {
    var m = Modal.cur; if (!m) return;
    m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    Modal.cur = null;
    if (!keepFocus && Modal.opener && Modal.opener.focus) { try { Modal.opener.focus({ preventScroll: true }); } catch (e) {} }
  }
};
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    if (Modal.cur) Modal.close();
    else if (Drawer.isOpen()) Drawer.close();
    else if (Menu.isOpen()) Menu.close();
  }
  if (e.key === 'Tab' && Modal.cur) {
    var f = $$('button:not([disabled]),a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', Modal.cur).filter(function (n) { return n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- sélection d'échantillons ---------- */
var Sel = {
  items: [], subs: [],
  load: function () { try { var v = JSON.parse(localStorage.getItem('az-sel-v1') || '[]'); if (Array.isArray(v)) Sel.items = v.filter(function (i) { return i && i.k && i.label; }).slice(0, 40); } catch (e) {} },
  save: function () { try { localStorage.setItem('az-sel-v1', JSON.stringify(Sel.items)); } catch (e) {} },
  has: function (k) { return Sel.items.some(function (i) { return i.k === k; }); },
  toggle: function (item) {
    var i = Sel.items.findIndex(function (x) { return x.k === item.k; });
    if (i >= 0) Sel.items.splice(i, 1); else Sel.items.push(item);
    Sel.changed(); return i < 0;
  },
  add: function (item) { if (!Sel.has(item.k)) { Sel.items.push(item); Sel.changed(); } },
  remove: function (k) { Sel.items = Sel.items.filter(function (i) { return i.k !== k; }); Sel.changed(); },
  clear: function () { Sel.items = []; Sel.changed(); },
  on: function (fn) { Sel.subs.push(fn); },
  changed: function () { Sel.save(); Sel.subs.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
};
function toast(msg) {
  var t = $('#toast'); if (!t || (Drawer.isOpen && Drawer.isOpen())) return;
  t.textContent = msg; t.classList.add('is-on'); clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('is-on'); }, 2400);
}

/* tiroir */
var Drawer = {
  el: null, scrim: null,
  isOpen: function () { return Drawer.el && Drawer.el.classList.contains('is-open'); },
  open: function () {
    if (Menu.isOpen()) Menu.close();
    var tt = $('#toast'); if (tt) tt.classList.remove('is-on');
    Drawer.el.classList.add('is-open'); Drawer.el.setAttribute('aria-hidden', 'false'); Drawer.scrim.classList.add('is-on');
    document.documentElement.style.overflow = 'hidden'; Drawer.opener = document.activeElement;
    setTimeout(function () { var b = $('[data-autofocus]', Drawer.el); if (b) b.focus({ preventScroll: true }); }, 80);
  },
  close: function () {
    Drawer.el.classList.remove('is-open'); Drawer.el.setAttribute('aria-hidden', 'true'); Drawer.scrim.classList.remove('is-on');
    document.documentElement.style.overflow = '';
    if (Drawer.opener && Drawer.opener.focus) { try { Drawer.opener.focus({ preventScroll: true }); } catch (e) {} }
  }
};

function initSelection() {
  Sel.load();
  Drawer.el = $('#drw'); Drawer.scrim = $('#scrim');
  var list = $('#drwList'), btn = $('#selBtn'), n = $('#selN'), ftClear = $('#drwClear'), ftAsk = $('#drwAsk');
  function render() {
    var c = Sel.items.length;
    btn.hidden = c === 0; n.textContent = c;
    var fs = $('#fabSel'); if (fs) { fs.hidden = c === 0; $('#fabN').textContent = c; }
    list.innerHTML = '';
    if (!c) { list.appendChild(el('p', 'drw__empty', 'Votre sélection est vide. Touchez « Ajouter à ma sélection » sur une couleur, une forme ou un projet pour préparer votre demande d’échantillons.')); }
    Sel.items.forEach(function (it) {
      var row = el('div', 'drw__item');
      var th = el('i'); if (it.img && IMG[it.img]) th.style.backgroundImage = 'url("' + IMG[it.img] + '")'; else if (it.thumb) th.style.backgroundImage = 'url("' + it.thumb + '")'; else th.style.background = it.color || '#888';
      var tx = el('div', '', '<b>' + esc(it.label) + '</b><small>' + esc(it.kind || '') + '</small>');
      var rm = el('button', 'iconbtn', ico('i-close')); rm.type = 'button'; rm.setAttribute('aria-label', 'Retirer ' + it.label);
      rm.addEventListener('click', function () { Sel.remove(it.k); });
      row.append(th, tx, rm); list.appendChild(row);
    });
    ftAsk.disabled = c === 0; ftClear.hidden = c === 0;
    $$('[data-sel]').forEach(function (b) {
      var on = Sel.has(b.dataset.sel);
      if (b.classList.contains('sw')) b.classList.toggle('is-sel', on);
      if (b.dataset.selLabel != null) { b.innerHTML = (on ? ico('i-check') + ' Dans ma sélection' : ico('i-plus') + ' Ajouter à ma sélection'); b.setAttribute('aria-pressed', on); }
    });
  }
  Sel.on(render); render();
  btn.addEventListener('click', Drawer.open);
  var fs2 = $('#fabSel'); if (fs2) fs2.addEventListener('click', Drawer.open);
  $('#drwClose').addEventListener('click', Drawer.close);
  Drawer.scrim.addEventListener('click', function () { Drawer.close(); Modal.cur && Modal.close(); });
  ftClear.addEventListener('click', function () { Sel.clear(); });
  ftAsk.addEventListener('click', function () { Drawer.close(); window.AZ.Contact.prefill({ reqs: ['Échantillons'], focus: true }); });
  window.__renderSel = render;
}

/* ---------- en-tête, menu, défilement ---------- */
var Menu = {
  el: null, btn: null,
  isOpen: function () { return Menu.el && Menu.el.classList.contains('is-open'); },
  open: function () {
    Menu.el.classList.add('is-open'); Menu.el.setAttribute('aria-hidden', 'false'); document.body.classList.add('menu-open');
    Menu.btn.setAttribute('aria-expanded', 'true'); Menu.btn.setAttribute('aria-label', 'Fermer le menu'); Menu.btn.innerHTML = ico('i-close');
    document.documentElement.style.overflow = 'hidden'; $('#hd').classList.remove('is-hidden');
  },
  close: function () {
    Menu.el.classList.remove('is-open'); Menu.el.setAttribute('aria-hidden', 'true'); document.body.classList.remove('menu-open');
    Menu.btn.setAttribute('aria-expanded', 'false'); Menu.btn.setAttribute('aria-label', 'Ouvrir le menu'); Menu.btn.innerHTML = ico('i-menu');
    document.documentElement.style.overflow = '';
  }
};
function initHeader() {
  var hd = $('#hd'), prog = $('#prog'), lastY = window.scrollY, tick = 0;
  Menu.el = $('#menu'); Menu.btn = $('#burger');
  Menu.btn.addEventListener('click', function () { Menu.isOpen() ? Menu.close() : Menu.open(); });
  $$('#menu a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { Menu.close(); }); });
  function onScroll() {
    tick = 0;
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    hd.classList.toggle('is-stuck', y > 24);
    if (!Menu.isOpen()) {
      if (y > lastY + 8 && y > 520) hd.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 520) hd.classList.remove('is-hidden');
    }
    lastY = y;
    prog.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
  }
  window.addEventListener('scroll', function () { if (!tick) tick = raf(onScroll); }, { passive: true });
  onScroll();
  // lien courant dans la navigation
  var links = {}; $$('.hd__nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if (io) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var a = links[e.target.id]; if (a) a.classList.toggle('is-cur', e.isIntersecting); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }
}

/* défilement doux vers une ancre, même dans l'iframe d'hébergement */
function goTo(sel) {
  var t = typeof sel === 'string' ? $(sel) : sel; if (!t) return;
  var y = t.getBoundingClientRect().top + window.scrollY - 64;
  window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
}
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
  var id = a.getAttribute('href'); if (id.length < 2) return;
  var t = $(id); if (!t) return;
  e.preventDefault(); if (Menu.isOpen()) Menu.close(); goTo(t);
});

window.AZ = { $: $, $$: $$, clamp: clamp, lerp: lerp, ease: ease, smooth: smooth, RM: RM, FINE: FINE, IMG: IMG, META: META, el: el, esc: esc, mulberry32: mulberry32, raf: raf, safe: safe, ico: ico,
  FAM: FAM, FAM_ORDER: FAM_ORDER, SW: SW, SWBY: SWBY, COLL: COLL, GAL: GAL, GCATS: GCATS, APPS: APPS, APP_COL: APP_COL,
  starSVG: starSVG, hydrate: hydrate, imgNow: imgNow, tilt: tilt, Modal: Modal, Sel: Sel, Drawer: Drawer, Menu: Menu, toast: toast, goTo: goTo,
  WA_NUMBER: WA_NUMBER, MAIL: MAIL, IG_URL: IG_URL,
  initSelection: initSelection, initHeader: initHeader };
})();
