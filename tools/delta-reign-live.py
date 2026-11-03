"""
Releasedag Delta Reign, deel 2: alle teksten op de site van "komt uit" naar "is uit".

Los van tools/delta-reign-releasedag.py (de galerij). Dit script raakt de
kaartlijst-sectie niet, dus de volgorde maakt niet uit en het kan ook al op
6 november draaien als de API nog niet zover is.

Draaien vanuit de projectmap:
  python tools/delta-reign-live.py --dry-run            # laat zien wat er verandert
  python tools/delta-reign-live.py                      # voert het uit (datum = vandaag)
  python tools/delta-reign-live.py --datum 2026-11-06   # met een vaste datum

Elke oude tekst moet precies zo vaak voorkomen als verwacht. Klopt er ergens
iets niet (pagina tussendoor aangepast), dan stopt het script zonder iets te
schrijven. Daarna: python tools/sync-sitemap-lastmod.py --schrijf.
Chase cards en prijzen: tools/delta-reign-chase.py, een of twee dagen later.
"""
import re, sys, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAANDEN = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']

# (bestand, oud, nieuw, aantal keer)
R = []
def r(f, old, new, n=1): R.append((f, old, new, n))

# ---------- sets/delta-reign.html ----------
f = 'sets/delta-reign.html'
r(f, 'Delta Reign kaartlijst: alle 141 kaarten, release 6 november 2026',
     'Delta Reign kaartlijst: alle 141 kaarten en de chase cards', 4)
r(f, 'content="Alle 141 kaarten van Delta Reign op nummer, met de 38 secret rares en een gratis afvinklijst (PDF). Release 6 november 2026, rond Mega Rayquaza ex. Plus prereleases en producten."',
     'content="Alle 141 kaarten van Delta Reign met afbeeldingen, de 38 secret rares en een gratis afvinklijst (PDF). Uit sinds 6 november 2026, rond Mega Rayquaza ex. Plus producten en prijzen."')
r(f, 'wanneer komt delta reign uit,', 'delta reign kaartlijst, delta reign chase cards, wanneer komt delta reign uit,')
r(f, 'De zesde hoofdset van de Mega Evolution-serie komt op 6 november 2026 uit, met Mega Rayquaza ex. Alles wat al bevestigd is.',
     'De zesde hoofdset van de Mega Evolution-serie, uit sinds 6 november 2026, met Mega Rayquaza ex. Alle kaarten, producten en prijzen.')
r(f, 'Releasedatum, prereleases, kaarten en producten van Delta Reign (6 november 2026).',
     'Alle kaarten, chase cards en producten van Delta Reign (uit sinds 6 november 2026).')
r(f, '"description": "Delta Reign komt op 6 november 2026 uit: de zesde set van de Mega Evolution-serie, rond Mega Rayquaza ex. Releasedatum, prereleases, wat er in de set zit en welke producten er komen."',
     '"description": "Delta Reign is uit sinds 6 november 2026: de zesde set van de Mega Evolution-serie, rond Mega Rayquaza ex. Alle kaarten, de chase cards, de producten en wat ze in Nederland kosten."')
r(f, 'Delta Reign komt wereldwijd uit op 6 november 2026. De prereleases in Play! Pokémon-winkels lopen van 24 oktober tot en met 1 november. Daar kun je de set al spelen met de Build & Battle Box.',
     'Delta Reign is op 6 november 2026 wereldwijd uitgekomen en ligt nu in de winkel. Daarvoor liepen van 24 oktober tot en met 1 november de prereleases in Play! Pokémon-winkels, met de Build & Battle Box.', 2)
r(f, '<h1>Delta Reign: releasedatum, kaarten en producten</h1>', '<h1>Delta Reign: kaartlijst, chase cards en producten</h1>')
r(f, 'De zesde hoofdset van de Mega Evolution-serie komt op 6 november 2026 uit, met Mega Rayquaza ex als blikvanger. Wat er al officieel bekend is, wat nog niet, en wanneer je hem kunt spelen en kopen.',
     'De zesde hoofdset van de Mega Evolution-serie ligt sinds 6 november 2026 in de winkel, met Mega Rayquaza ex als blikvanger. Alle kaarten, de chase cards, de producten en wat je ervoor betaalt.')
r(f, '<strong>Delta Reign komt uit op 6 november 2026.</strong>', '<strong>Delta Reign is uit sinds 6 november 2026.</strong>')
r(f, 'Spelen kan al eerder: de prereleases in Play! Pokémon-winkels lopen van <strong>24 oktober tot en met 1 november</strong>. ', '')
r(f, '6 november 2026<small>prereleases vanaf 24 oktober</small>', '6 november 2026<small>nu in de winkel</small>')
r(f, 'Welke kaarten zijn al bekend?', 'Welke kaarten zitten erin?', 2)
r(f, 'Van 24 oktober tot en met 1 november houden Play! Pokémon-winkels prerelease-toernooien. Daar verkopen ze',
     'Van 24 oktober tot en met 1 november hielden Play! Pokémon-winkels prerelease-toernooien. Daar verkochten ze')
r(f, '6 november, komt ook de Ultra-Premium Collection', '6 november, kwam ook de Ultra-Premium Collection')

# ---------- overige pagina's ----------
r('404.html', 'Alle 141 kaarten, uit op 6 november', 'Alle 141 kaarten, nu uit')

r('index.html', '<span class="pillar-tag">6 november</span>\n        <h3>Delta Reign</h3>\n        <p>De volgende set, met Mega Rayquaza ex. Releasedatum, prereleases, producten en de kaarten die al bekend zijn.</p>',
     '<span class="pillar-tag">Nu uit</span>\n        <h3>Delta Reign</h3>\n        <p>De nieuwste set, met Mega Rayquaza ex. Alle 141 kaarten, de chase cards en wat de producten kosten.</p>')

r('sets/index.html', '<p class="hc-date">Oktober 2026</p>\n        <p class="hc-title">Delta Reign: releasedatum, kaarten en producten</p>\n        <p class="hc-desc">De zesde set van de Mega Evolution-serie komt op 6 november uit, rond Mega Rayquaza ex. Prereleases, bevestigde kaarten en de producten.</p>',
     '<p class="hc-date">November 2026</p>\n        <p class="hc-title">Delta Reign: kaartlijst, chase cards en producten</p>\n        <p class="hc-desc">De zesde set van de Mega Evolution-serie, uit sinds 6 november, rond Mega Rayquaza ex. Alle kaarten, de chase cards en de producten.</p>')
for g in ('sets/index.html', 'sets/pokemon-sets-op-volgorde.html'):
    r(g, '<li><a href="/sets/delta-reign">Delta Reign</a> <span class="si-soon">binnenkort</span></li>', '<li><a href="/sets/delta-reign">Delta Reign</a></li>')

g = 'sets/pokemon-sets-op-volgorde.html'
r(g, 'De nieuwste Engelstalige Pokemon-set is de jubileumset 30th Celebration, verschenen op 16 september 2026. De laatste hoofdset van de lopende Mega Evolution-serie, die in september 2025 startte, is Pitch Black (17 juli 2026). De eerstvolgende set is Delta Reign op 6 november 2026.',
     'De nieuwste Engelstalige Pokemon-set is Delta Reign, verschenen op 6 november 2026. Het is de zesde hoofdset van de lopende Mega Evolution-serie, die in september 2025 startte. Daarvoor verscheen op 16 september de jubileumset 30th Celebration.')
r(g, 'De nieuwste Engelstalige Pokémon-set is de jubileumset <a href="/sets/30th-celebration">30th Celebration</a>, verschenen op 16 september 2026. De laatste hoofdset van de lopende Mega Evolution-serie, die in september 2025 startte, is <a href="/sets/pitch-black">Pitch Black</a> (17 juli 2026). De eerstvolgende set is <a href="/sets/delta-reign">Delta Reign</a> op 6 november 2026.',
     'De nieuwste Engelstalige Pokémon-set is <a href="/sets/delta-reign">Delta Reign</a>, verschenen op 6 november 2026. Het is de zesde hoofdset van de lopende Mega Evolution-serie, die in september 2025 startte. Daarvoor verscheen op 16 september de jubileumset <a href="/sets/30th-celebration">30th Celebration</a>.')
r(g, 'De nieuwste set is <a href="/sets/30th-celebration">30th Celebration</a> (16 september 2026), de jubileumset die buiten de serie-indeling valt; de eerstvolgende is Delta Reign op 6 november 2026.',
     'De nieuwste set is <a href="/sets/delta-reign">Delta Reign</a> (6 november 2026), de zesde hoofdset van de Mega Evolution-serie. Daarvoor verscheen de jubileumset <a href="/sets/30th-celebration">30th Celebration</a> (16 september 2026), die buiten de serie-indeling valt.')

g = 'sets/pokemon-series-op-volgorde.html'
r(g, 'waarvan Pitch Black (17 juli 2026) de meest recente is en Delta Reign op 6 november 2026 volgt.',
     'waarvan Delta Reign (6 november 2026) de meest recente is.', 2)
r(g, 'De meest recente hoofdset is <a href="/sets/pitch-black">Pitch Black</a> (17 juli 2026). Daarna verscheen op 16 september de jubileumset <a href="/sets/30th-celebration">30th Celebration</a>, en <a href="/sets/delta-reign">Delta Reign</a> volgt op 6 november 2026.',
     'De meest recente hoofdset is <a href="/sets/delta-reign">Delta Reign</a> (6 november 2026). Daarvoor verschenen <a href="/sets/pitch-black">Pitch Black</a> (17 juli) en de jubileumset <a href="/sets/30th-celebration">30th Celebration</a> (16 september).')

g = 'kopen/release-kalender.html'
r(g, 'content="De volgende Pokemon-set is Delta Reign op 6 november 2026, de nieuwste is 30th Celebration. Alle releases van 2026 met datums, producten en aftelklok."',
     'content="De nieuwste Pokemon-set is Delta Reign, uit sinds 6 november 2026. In Japan volgt Aura Seeker op 27 november. Alle releases van 2026 met datums en producten."')
NIEUWSTE = 'De nieuwste Engelstalige Pokemon-set is Delta Reign, de zesde hoofdset van de Mega Evolution-serie met Mega Rayquaza ex, verschenen op 6 november 2026. Daarvoor kwam op 16 september de all-foil jubileumset 30th Celebration uit. De volgende Engelstalige set is nog niet officieel aangekondigd; volgens PokeBeach wordt dat Flowing Fists op 5 februari 2027.'
r(g, 'De nieuwste Engelstalige Pokemon-set is 30th Celebration, de all-foil jubileumset die op 16 september 2026 wereldwijd tegelijk verscheen. De eerstvolgende set is Delta Reign op 6 november 2026, de zesde hoofdset van de Mega Evolution-serie met Mega Rayquaza ex. Hierboven staat een aftelklok naar die release.', NIEUWSTE, 2)
r(g, 'Storm Emeralda wordt de Engelse Delta Reign', 'Storm Emeralda werd de Engelse Delta Reign', 3)
VOLGENDE = 'Delta Reign is op 6 november 2026 verschenen, samen met de Ultra-Premium Collections van 30th Celebration. In Japan verschijnt Aura Seeker op 27 november 2026. De volgende Engelstalige set is nog niet officieel aangekondigd; volgens PokeBeach wordt dat Flowing Fists op 5 februari 2027.'
r(g, 'De eerstvolgende grote release is Delta Reign op 6 november 2026, de zesde hoofdset van de Mega Evolution-serie met Mega Rayquaza ex. De prereleases lopen van 24 oktober tot en met 1 november. Daarvoor verschijnen op 30 oktober nog de Espeon ex- en Umbreon ex Battle Decks van 30th Celebration, en op 6 november, tegelijk met Delta Reign, de Ultra-Premium Collections van de jubileumset. In Japan verschijnt Aura Seeker op 27 november 2026.', VOLGENDE, 2)
r(g, 'De nieuwste Pokemon-set is <strong>30th Celebration</strong>, verschenen op <strong>16 september 2026</strong>: de eerste set ooit die wereldwijd op dezelfde dag uitkwam. De eerstvolgende is <strong>Delta Reign</strong> op <strong>6 november 2026</strong>, met prereleases van 24 oktober tot en met 1 november. Hieronder staat de volledige kalender met een aftelklok naar de eerstvolgende release.',
     'De nieuwste Pokemon-set is <strong>Delta Reign</strong>, verschenen op <strong>6 november 2026</strong>. Alle aangekondigde Engelstalige releases zijn inmiddels verschenen. Zodra de eerste sets van volgend jaar officieel zijn aangekondigd, staan ze hieronder.')
r(g, 'De eerstvolgende set is <strong>Delta Reign op 6 november</strong>, de zesde hoofdset van de Mega Evolution-serie met Mega Rayquaza ex als blikvanger. De prereleases bij de winkels lopen van 24 oktober tot en met 1 november. In onze <a href="/sets/delta-reign">Delta Reign-gids</a> staan de bevestigde producten en kaarten.',
     'De nieuwste set is <strong>Delta Reign</strong>, uit sinds 6 november: de zesde hoofdset van de Mega Evolution-serie met Mega Rayquaza ex als blikvanger. In onze <a href="/sets/delta-reign">Delta Reign-gids</a> staan alle 141 kaarten, de chase cards en de producten.')
r(g, '<td class="status-cell" data-date="2026-11-06">Binnenkort</td>', '<td class="status-cell" data-date="2026-11-06">Uit</td>')
r(g, '<time datetime="2026-11-06">6 nov 2026</time><span class="release-badge">Binnenkort</span>', '<time datetime="2026-11-06">6 nov 2026</time><span class="release-badge">Uit</span>')
r(g, 'met vier nieuwe Mega ex-kaarten. Prereleases lopen van 24 oktober tot en met 1 november. Bevestigd zijn onder meer',
     'met vier nieuwe Mega ex-kaarten. Op releasedag verschenen onder meer')
r(g, '<span class="nr-title">Delta Reign: de volgende set, 6 november</span>\n            <span class="nr-note">Releasedatum, prereleases, bevestigde kaarten en producten</span>',
     '<span class="nr-title">Delta Reign: de nieuwste set, alle 141 kaarten</span>\n            <span class="nr-note">Kaartlijst, chase cards en producten</span>')

g = 'kopen/pokemon-kaarten-cadeau.html'
r(g, 'Delta Reign komt op <strong>6 november</strong>, Sinterklaas', 'Delta Reign ligt sinds <strong>6 november</strong> in de winkel, Sinterklaas')
r(g, '<strong>Delta Reign</strong> komt op <strong>6 november</strong> uit, met', '<strong>Delta Reign</strong> ligt sinds <strong>6 november</strong> in de winkel, met')


def main():
    dry = '--dry-run' in sys.argv
    datum = datetime.date.today()
    if '--datum' in sys.argv:
        datum = datetime.date.fromisoformat(sys.argv[sys.argv.index('--datum') + 1])
    iso = datum.isoformat()
    lang = f'{datum.day} {MAANDEN[datum.month - 1]} {datum.year}'

    files, fouten = {}, []
    for f, old, new, n in R:
        if f not in files: files[f] = (ROOT / f).read_text(encoding='utf-8')
        k = files[f].count(old)
        if k != n:
            fouten.append(f'{f}: verwacht {n}x, gevonden {k}x: {old[:80]}')
            continue
        files[f] = files[f].replace(old, new)
    if fouten:
        print('STOP, niets geschreven:'); [print('  ' + x) for x in fouten]; sys.exit(1)

    # dateModified (eerste in JSON-LD) en de zichtbare datum op de setpagina
    for f in files:
        files[f], k = re.subn(r'"dateModified": "\d{4}-\d{2}-\d{2}"', f'"dateModified": "{iso}"', files[f], count=1)
    files['sets/delta-reign.html'], k = re.subn(r'Laatst bijgewerkt: <time datetime="\d{4}-\d{2}-\d{2}">[^<]*</time>',
        f'Laatst bijgewerkt: <time datetime="{iso}">{lang}</time>', files['sets/delta-reign.html'], count=1)
    if k != 1: print('STOP: datum op de setpagina niet gevonden'); sys.exit(1)

    for f, s in files.items():
        if dry:
            print(f'[dry-run] {f}: {sum(1 for x in R if x[0] == f)} wijzigingen')
        else:
            (ROOT / f).write_text(s, encoding='utf-8')
            print(f'geschreven: {f}')
    if not dry:
        print(f'Klaar ({iso}). Nu: python tools/sync-sitemap-lastmod.py --schrijf, dan committen en indexering aanvragen.')

if __name__ == '__main__':
    main()
