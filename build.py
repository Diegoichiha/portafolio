#!/usr/bin/env python3
"""Genera index.html, proyectos/index.html y sitemap.xml a partir de src/.

Solo usa la librería estándar. NO edites a mano los .html generados:
cambia src/pages, src/partials o src/data/projects.json y vuelve a ejecutar:

    python build.py
"""
import hashlib
import html
import json
import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
SITE = "https://diegotdesigner.com/"
WHATSAPP = "https://wa.link/ydvb9j"
LINKEDIN = "https://www.linkedin.com/in/diegotorres-mktdigital/"

projects = json.loads((SRC / "data" / "projects.json").read_text(encoding="utf-8"))


def esc(s):
    return html.escape(s, quote=True)


def read(path):
    return (SRC / path).read_text(encoding="utf-8")


def fingerprint(*rel):
    h = hashlib.md5()
    for r in rel:
        h.update((ROOT / r).read_bytes())
    return h.hexdigest()[:8]


ARROW = (
    '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" fill="none" '
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
)


def featured_cards(root):
    out = []
    for i, p in enumerate([p for p in projects if p.get("featured")], 1):
        tags = "".join(f"<li>{esc(t)}</li>" for t in p["tags"])
        out.append(
            f'''<article class="pcard" style="--accent:{p["accent"]}">
  <div class="pcard__inner">
    <div class="pcard__info">
      <div class="pcard__top"><span class="pcard__num">{i:02d}</span><span class="badge">{esc(p["kindLabel"])}</span><span class="pcard__year">{p["year"]}</span></div>
      <h3 class="pcard__title">{esc(p["title"])}</h3>
      <p class="pcard__desc">{esc(p["desc"])}</p>
      <ul class="tags">{tags}</ul>
      <a class="btn btn--line" href="{esc(p["url"])}" target="_blank" rel="noopener noreferrer" data-cursor="Abrir">{esc(p["cta"])} {ARROW}</a>
    </div>
    <a class="pcard__media" href="{esc(p["url"])}" target="_blank" rel="noopener noreferrer" data-tilt data-cursor="Ver" tabindex="-1" aria-hidden="true">
      <img src="{root}assets/img/projects/{p["slug"]}.webp" alt="{esc(p["alt"])}" width="1200" height="800" loading="lazy" decoding="async">
      <span class="glare"></span>
    </a>
  </div>
</article>'''
        )
    return "\n".join(out)


def grid_cards(root):
    out = []
    for p in projects:
        out.append(
            f'''<article class="gcard" data-kind="{p["kind"]}">
  <a class="gcard__link" href="{esc(p["url"])}" target="_blank" rel="noopener noreferrer" data-cursor="Ver">
    <div class="gcard__media" data-tilt><img src="{root}assets/img/projects/{p["slug"]}.webp" alt="{esc(p["alt"])}" width="1200" height="800" loading="lazy" decoding="async"><span class="glare"></span></div>
    <div class="gcard__meta">
      <div><h3 class="gcard__title">{esc(p["title"])}</h3><p class="gcard__kind">{esc(p["kindLabel"])} · {p["year"]}</p></div>
      <span class="gcard__go">{ARROW}</span>
    </div>
  </a>
</article>'''
        )
    return "\n".join(out)


JSONLD = """<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ProfessionalService","name":"Diego Torres — Diseñador UX/UI y desarrollador web","url":"%s","image":"%sassets/img/og.jpg","description":"Diseño y desarrollo experiencias digitales que convierten visitantes en clientes: UI/UX, desarrollo web, identidad de marca y publicidad digital.","founder":{"@type":"Person","name":"Diego Torres","jobTitle":"Diseñador UX/UI y desarrollador web","sameAs":["%s"]},"areaServed":"CO","knowsAbout":["UI/UX","Diseño web","WordPress","Shopify","Branding","Google Ads","Meta Ads"]}
</script>""" % (SITE, SITE, LINKEDIN)

PAGES = [
    {
        "template": "pages/home.html",
        "out": "index.html",
        "root": "",
        "path": "",
        "page": "home",
        "title": "Diego Torres | Diseñador UX/UI y desarrollador web",
        "description": "Diseño y desarrollo experiencias digitales que convierten visitantes en clientes. UI/UX, desarrollo web (WordPress, Shopify), identidad de marca y publicidad digital.",
        "jsonld": JSONLD,
        "priority": "1.0",
    },
    {
        "template": "pages/proyectos.html",
        "out": "proyectos/index.html",
        "root": "../",
        "path": "proyectos/",
        "page": "projects",
        "title": "Proyectos | Diego Torres, diseñador UX/UI y desarrollador web",
        "description": "Sitios web, tiendas virtuales y prototipos en Figma diseñados y desarrollados por Diego Torres. Explora el portafolio completo.",
        "jsonld": "",
        "priority": "0.8",
    },
]


def build():
    v = fingerprint("assets/css/style.css", "assets/js/main.js")
    head_t, header_t, footer_t = read("partials/head.html"), read("partials/header.html"), read("partials/footer.html")
    for pg in PAGES:
        root = pg["root"]
        canonical = SITE + pg["path"]
        tokens = {
            "title": esc(pg["title"]),
            "description": esc(pg["description"]),
            "canonical": canonical,
            "og_image": SITE + "assets/img/og.jpg",
            "root": root,
            "v": v,
            "page": pg["page"],
            "jsonld": pg["jsonld"],
            "whatsapp": WHATSAPP,
            "linkedin": LINKEDIN,
            "year": "2026",
            "projects_featured": featured_cards(root) if pg["page"] == "home" else "",
            "projects_grid": grid_cards(root) if pg["page"] == "projects" else "",
            "projects_count": str(len(projects)),
            "arrow": ARROW,
        }
        body = read(pg["template"])
        # Los parciales pueden contener tokens; se resuelven en dos pasadas.
        body = body.replace("{{head}}", head_t).replace("{{header}}", header_t).replace("{{footer}}", footer_t)
        for _ in range(2):
            for k, val in tokens.items():
                body = body.replace("{{" + k + "}}", val)
        dest = ROOT / pg["out"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(body, encoding="utf-8")
        print("ok", pg["out"], f"({len(body) // 1024} KB)")

    urls = "".join(
        f"  <url><loc>{SITE}{pg['path']}</loc><priority>{pg['priority']}</priority></url>\n" for pg in PAGES
    )
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n',
        encoding="utf-8",
    )
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n", encoding="utf-8")
    print("ok sitemap.xml, robots.txt")


if __name__ == "__main__":
    build()
