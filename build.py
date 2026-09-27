#!/usr/bin/env python3
"""
ArchiZellige : assemble le site en UN SEUL fichier HTML autonome.

    pip install pillow
    python3 build.py            ->  dist/index.html

Le fichier produit contient le HTML, le CSS, le JavaScript et toutes les images
(encodées en base64). Il suffit de le déposer tel quel chez n'importe quel
hébergeur statique. Seules les polices viennent de Google Fonts.
"""
import base64
import json
import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
ASSETS = ROOT / "assets"
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "index.html"


def avg_hex(im):
    """Couleur moyenne d'une image (utilisée pour les pastilles et les teintes)."""
    raw = im.convert("RGB").resize((24, 24)).tobytes()
    n = len(raw) // 3
    return "#%02X%02X%02X" % tuple(int(round(sum(raw[i::3]) / n)) for i in range(3))


# 1) images : chaque fichier assets/<clé>.webp devient window.__IMG[<clé>]
IMG, META = {}, {}
for p in sorted(ASSETS.glob("*.webp")):
    key = p.stem
    IMG[key] = "data:image/webp;base64," + base64.b64encode(p.read_bytes()).decode()
    with Image.open(p) as im:
        META[key] = {"w": im.width, "h": im.height, "avg": avg_hex(im)}

# 2) feuilles de style + scripts + gabarit HTML
css = "".join((SRC / n).read_text(encoding="utf-8") for n in ("css1.css", "css2.css", "css3.css", "css4.css"))
css = css.replace("__SWTERRA__", IMG["pt-terra-4"])          # texture terre cuite de l'atelier
js = "".join((SRC / n).read_text(encoding="utf-8") + "\n" for n in ("js1.js", "js2.js", "js3.js", "js4.js"))
body = (SRC / "body.html").read_text(encoding="utf-8")
for name in ("navy", "sky", "orange", "gold"):                 # logo du préchargeur (en dur pour un 1er affichage immédiat)
    body = body.replace("{{LOGO_%s}}" % name.upper(), IMG["logo-" + name])

head = """<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>ArchiZellige | Zellige marocain artisanal, fabriqué à la main à Fès</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="La Maison AZ – ArchiZellige : zellige marocain traditionnel fabriqué à la main à Fès. Couleurs, formes, mosaïques, fontaines et projets sur mesure. Catalogue, échantillons et devis.">
<meta name="theme-color" content="#0C1B36">
<meta property="og:title" content="ArchiZellige | Zellige marocain artisanal">
<meta property="og:description" content="Zellige marocain traditionnel fabriqué à la main à Fès : couleurs, formes, mosaïques, projets sur mesure.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Jost:wght@400;500;600&family=Mrs+Saint+Delafield&display=swap" rel="stylesheet">
<script>document.documentElement.classList.add('js')</script>
<style>
%s
</style>
</head>
<body>
""" % css

data = "<script>window.__IMG=%s;window.__META=%s;</script>\n" % (
    json.dumps(IMG, separators=(",", ":")),
    json.dumps(META, separators=(",", ":")),
)
html = head + body + data + "<script>\n" + js + "</script>\n</body>\n</html>\n"

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")
print("OK ->", OUT, "(%.2f Mo)" % (len(html.encode("utf-8")) / 1024 / 1024))
