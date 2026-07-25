#!/usr/bin/env python3
"""
Zet de <lastmod> in sitemap.xml gelijk aan de "dateModified" uit de JSON-LD
van de bijbehorende pagina.

Waarom: Google vergelijkt beide signalen. Als de sitemap 24 juli zegt en de
pagina zelf 19 juli, gaat Google lastmod negeren voor de hele site. De pagina
is de bron van waarheid, de sitemap volgt.

Gebruik vanuit de projectmap:  python tools/sync-sitemap.py
Alleen controleren, niets wijzigen:  python tools/sync-sitemap.py --check
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITEMAP = os.path.join(ROOT, "sitemap.xml")
BASE = "https://startmetpokemon.nl"


def url_to_file(loc):
    """Zet een sitemap-URL om naar het bestandspad dat hem serveert."""
    path = loc.replace(BASE, "").lstrip("/")
    if path == "":
        return "index.html"
    if path.endswith("/"):
        return path + "index.html"
    if not os.path.splitext(path)[1]:
        return path + ".html"
    return path


def page_date(rel_path):
    """Haal dateModified uit de JSON-LD; val terug op datePublished."""
    full = os.path.join(ROOT, rel_path)
    if not os.path.isfile(full):
        return None
    with open(full, encoding="utf-8", errors="replace") as fh:
        html = fh.read()
    for key in ("dateModified", "datePublished"):
        found = re.findall(r'"%s"\s*:\s*"(\d{4}-\d{2}-\d{2})' % key, html)
        if found:
            return max(found)
    return None


def main():
    check_only = "--check" in sys.argv

    with open(SITEMAP, encoding="utf-8") as fh:
        xml = fh.read()

    changed, missing, skipped = [], [], []

    def replace_block(match):
        block = match.group(0)
        loc = re.search(r"<loc>(.*?)</loc>", block).group(1)
        rel = url_to_file(loc)
        date = page_date(rel)
        if date is None:
            missing.append((loc, rel))
            return block
        current = re.search(r"<lastmod>(.*?)</lastmod>", block)
        if current and current.group(1) == date:
            skipped.append(loc)
            return block
        changed.append((loc, current.group(1) if current else "-", date))
        if current:
            return block.replace(current.group(0), "<lastmod>%s</lastmod>" % date)
        return block.replace(
            "</loc>", "</loc>\n    <lastmod>%s</lastmod>" % date
        )

    new_xml = re.sub(r"<url>.*?</url>", replace_block, xml, flags=re.S)

    for loc, rel in missing:
        print("GEEN DATUM  %s  (%s)" % (loc, rel))
    for loc, old, new in changed:
        print("BIJWERKEN   %s  %s -> %s" % (loc, old, new))

    print(
        "\n%d ongewijzigd, %d bij te werken, %d zonder datum"
        % (len(skipped), len(changed), len(missing))
    )

    if check_only:
        print("(--check: sitemap.xml niet aangepast)")
        return 1 if changed or missing else 0

    if changed:
        with open(SITEMAP, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(new_xml)
        print("sitemap.xml bijgewerkt.")
    else:
        print("Niets te doen.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
