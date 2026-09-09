#!/usr/bin/env python3
"""
Zet elke <lastmod> in sitemap.xml gelijk aan de datum van de laatste git-commit
die het bijbehorende bestand raakte.

Waarom: Google gebruikt lastmod als hercrawl-signaal, maar negeert het zodra het
aantoonbaar onbetrouwbaar is. Op 27 augustus 2026 liepen 155 van de 168 entries
achter, sommige maanden. Na elke commit lopen de gewijzigde pagina's opnieuw
achter, dus dit hoort bij het afsluiten van een werksessie.

Draaien vanuit de repo-root, NA het committen:

    python tools/sync-sitemap-lastmod.py             # proefdraai
    python tools/sync-sitemap-lastmod.py --schrijf   # voert door

Zet lastmod nooit vooruit: alleen entries die achterlopen worden bijgewerkt.
Leest de hele git-historie in een keer uit, dus draait in een seconde.
"""
import re, io, os, sys, subprocess

SCHRIJF = '--schrijf' in sys.argv
BASE = 'https://startmetpokemon.nl'


def laatste_commitdatums():
    """{pad: 'JJJJ-MM-DD'} voor elk bestand, uit een enkele git-aanroep."""
    uit = subprocess.run(
        ['git', 'log', '--name-only', '--format=%x00%ad', '--date=short'],
        capture_output=True, text=True).stdout
    datums, huidige = {}, None
    for regel in uit.split('\n'):
        if regel.startswith('\x00'):
            huidige = regel[1:].strip()
            continue
        pad = regel.strip()
        if pad and huidige and pad not in datums:
            datums[pad] = huidige
    return datums


def bestand_voor(loc):
    pad = loc.replace(BASE, '').strip('/')
    if pad == '':
        return 'index.html'
    if os.path.exists(os.path.join(pad, 'index.html')):
        return pad + '/index.html'
    return pad + '.html'


def main():
    if not os.path.exists('sitemap.xml'):
        print('sitemap.xml niet gevonden. Draai dit vanuit de repo-root.')
        return 1

    datums = laatste_commitdatums()
    s = io.open('sitemap.xml', encoding='utf-8').read()

    gewijzigd, ontbreekt, ongewijzigd, ongetrackt = [], [], 0, []

    def vervang(m):
        nonlocal ongewijzigd
        loc, tussen, lastmod = m.group(1), m.group(2), m.group(3)
        pad = bestand_voor(loc)
        if not os.path.exists(pad):
            ontbreekt.append(loc)
            return m.group(0)
        git = datums.get(pad)
        if not git:
            ongetrackt.append(pad)
            return m.group(0)
        if git > lastmod:
            gewijzigd.append((loc, lastmod, git))
            return '<loc>%s</loc>%s<lastmod>%s</lastmod>' % (loc, tussen, git)
        ongewijzigd += 1
        return m.group(0)

    nieuw = re.sub(r'<loc>(.*?)</loc>(\s*)<lastmod>(.*?)</lastmod>', vervang, s)

    print('entries bekeken: %d | bij te werken: %d | al goed: %d'
          % (len(gewijzigd) + ongewijzigd + len(ontbreekt) + len(ongetrackt),
             len(gewijzigd), ongewijzigd))
    for loc, oud, new in gewijzigd:
        print('  %-55s %s -> %s' % (loc.replace(BASE, ''), oud, new))
    if ontbreekt:
        print('\nLET OP, staat in de sitemap maar niet op schijf:')
        for loc in ontbreekt:
            print('  ' + loc)
    if ongetrackt:
        print('\nLET OP, nog nooit gecommit (dus geen datum bekend):')
        for pad in ongetrackt:
            print('  ' + pad)

    if SCHRIJF:
        io.open('sitemap.xml', 'w', encoding='utf-8').write(nieuw)
        print('\nsitemap.xml geschreven.')
    elif gewijzigd:
        print('\n(proefdraai; gebruik --schrijf om door te voeren)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
