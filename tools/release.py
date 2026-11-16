"""
Releasepijplijn voor een nieuwe set. Een script voor elke set, in drie stappen.

Alles wat per set verschilt staat in _werkdocumenten/releases/<slug>.json
(zie _werkdocumenten/releases/README.md en het voorbeeld delta-reign.json).
<slug> is de bestandsnaam van de setpagina zonder .html, bijvoorbeeld flowing-fists.

  python tools/release.py live <slug> [--dry-run] [--datum JJJJ-MM-DD]
      Zet alle teksten op de site van "komt uit" naar "is uit". De lijst met
      vervangingen staat in de config onder "live". Elke oude tekst moet precies
      zo vaak voorkomen als verwacht, anders wordt er niets geschreven.

  python tools/release.py galerij <slug> <ruw-api-bestand.json> [--dry-run]
      Schrijft sets/data/<id>.json, zet de kaartgalerij op de setpagina en
      werkt sets/data/sets.json bij. Het ruwe bestand is het antwoord van
      https://api.pokemontcg.io/v2/cards?q=set.id:<id>&pageSize=250 (via Chrome).

  python tools/release.py chase <slug> [--dry-run]
      Bouwt het chase-cards-blok met Cardmarket-prijzen uit de config ("chase").
      Opnieuw draaien met nieuwe prijzen kan.

  python tools/release.py check <slug>
      Schrijft niets. Zoekt op de hele site naar zinnen die de set nog als
      toekomstig beschrijven ("komt uit", "verschijnt", "volgende set").

Na galerij: node tools/prerender-sets.mjs en node tools/verify-prerender.mjs.
Na live of chase: python tools/sync-sitemap-lastmod.py --schrijf.
Draai altijd eerst met --dry-run.
"""
import json, re, sys, datetime, html as H
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG_DIR = ROOT / '_werkdocumenten' / 'releases'
SETS_JSON = ROOT / 'sets' / 'data' / 'sets.json'
MAANDEN = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']
KORT = {'Special Illustration Rare': 'SIR', 'Mega Hyper Rare': 'Mega Hyper Rare', 'Ultra Rare': 'Ultra Rare',
        'Illustration Rare': 'Illustration Rare', 'Double Rare': 'Double Rare'}
START = '<!-- chase:start -->'
EIND = '<!-- chase:eind -->'


def fail(msg):
    print('STOP:', msg); sys.exit(1)

def lees(p): return p.read_bytes().decode('utf-8')      # geen omzetting van regeleindes
def schrijf(p, s): p.write_bytes(s.encode('utf-8'))
def lang_datum(d): return f'{d.day} {MAANDEN[d.month - 1]} {d.year}'

def laad_cfg(slug):
    p = CFG_DIR / f'{slug}.json'
    if not p.exists(): fail(f'config ontbreekt: _werkdocumenten/releases/{slug}.json (kopieer delta-reign.json als voorbeeld)')
    cfg = json.loads(lees(p))
    if not cfg.get('naam'): fail('"naam" ontbreekt in de config')
    cfg['slug'] = slug
    cfg['pagina'] = ROOT / 'sets' / f'{slug}.html'
    if not cfg['pagina'].exists(): fail(f'setpagina sets/{slug}.html bestaat niet')
    cfg.setdefault('top_zeldzaamheden', ['Special Illustration Rare', 'Mega Hyper Rare'])
    cfg.setdefault('top_label', 'SIR & Mega Hyper Rare')
    return cfg

def num_key(c):
    m = re.match(r'\d+', c['n'])
    return (int(m.group()) if m else 10**6, c['n'])


# ---------------------------------------------------------------- live
def cmd_live(cfg, dry, datum):
    R = cfg.get('live') or fail('geen "live"-lijst in de config')
    iso, lang = datum.isoformat(), lang_datum(datum)
    setpagina = f'sets/{cfg["slug"]}.html'
    files, fouten = {}, []
    for x in R:
        f, old, new, n = x['bestand'], x['oud'], x['nieuw'], x.get('aantal', 1)
        if f not in files:
            if not (ROOT / f).exists(): fouten.append(f'{f}: bestand bestaat niet'); continue
            files[f] = lees(ROOT / f)
        k = files[f].count(old)
        if k != n:
            fouten.append(f'{f}: verwacht {n}x, gevonden {k}x: {old[:80]}'); continue
        files[f] = files[f].replace(old, new)
    if fouten:
        print('STOP, niets geschreven:'); [print('  ' + x) for x in fouten]; sys.exit(1)

    # dateModified (eerste in JSON-LD) en de zichtbare datum op de setpagina
    for f in files:
        files[f], _ = re.subn(r'"dateModified": "\d{4}-\d{2}-\d{2}"', f'"dateModified": "{iso}"', files[f], count=1)
    if setpagina in files:
        files[setpagina], k = re.subn(r'Laatst bijgewerkt: <time datetime="\d{4}-\d{2}-\d{2}">[^<]*</time>',
            f'Laatst bijgewerkt: <time datetime="{iso}">{lang}</time>', files[setpagina], count=1)
        if k != 1: fail('datum op de setpagina niet gevonden')

    for f, s in files.items():
        if dry: print(f'[dry-run] {f}: {sum(1 for x in R if x["bestand"] == f)} wijzigingen')
        else: schrijf(ROOT / f, s); print(f'geschreven: {f}')
    meld_toekomende_tijd(cfg, files)
    if not dry:
        print(f'Klaar ({iso}). Nu: python tools/sync-sitemap-lastmod.py --schrijf, dan committen en indexering aanvragen.')

def meld_toekomende_tijd(cfg, files=None):
    """Zoekt op de hele site naar zinnen die de set nog als toekomstig beschrijven."""
    files = files or {}
    naam = re.escape(cfg['naam'])
    woorden = r'\b(komt|verschijnt|wordt verwacht|volgende set|aankomende|binnenkort)\b'
    pats = [re.compile(r'[^.<>\n]{0,90}' + naam + r'[^.<>\n]{0,70}' + woorden + r'[^.<>\n]{0,60}'),
            re.compile(r'[^.<>\n]{0,60}' + woorden + r'[^.<>\n]{0,70}' + naam + r'[^.<>\n]{0,60}')]
    uit = []
    for p in sorted(ROOT.rglob('*.html')):
        rel = p.relative_to(ROOT).as_posix()
        if rel.startswith(('_werkdocumenten', 'nieuws/', 'node_modules', '.')): continue
        s = files.get(rel) or lees(p)
        gezien = set()
        for pat in pats:
            for m in pat.finditer(s):
                t = re.sub(r'\s+', ' ', m.group(0)).strip()[:170]
                if t[:50] not in gezien: gezien.add(t[:50]); uit.append(f'{rel}: ...{t}...')
    if uit:
        print(f'LET OP, mogelijk nog toekomende tijd over {cfg["naam"]} ({len(uit)}):')
        for x in uit[:30]: print('  ' + x)
    else:
        print(f'Geen toekomende tijd over {cfg["naam"]} gevonden.')


# ---------------------------------------------------------------- galerij
def cmd_galerij(cfg, dry, raw_pad):
    SET_NAME, PAGE, slug = cfg['naam'], cfg['pagina'], cfg['slug']
    raw = json.loads(lees(Path(raw_pad)))
    cards_raw = raw['data'] if isinstance(raw, dict) else raw
    if not cards_raw: fail('geen kaarten in het bestand')
    st = cards_raw[0]['set']
    sid = st['id']
    if st['name'] != SET_NAME: fail(f"set heet {st['name']}, niet {SET_NAME}")
    if isinstance(raw, dict) and raw.get('totalCount', len(cards_raw)) > len(cards_raw):
        fail(f"maar {len(cards_raw)} van {raw['totalCount']} kaarten; haal op met pageSize=250")

    # Afbeeldingspatroon afleiden uit de eerste kaart, en voor alle kaarten controleren.
    c0 = cards_raw[0]
    tok = f"{sid}-{c0['number']}"
    if tok not in c0['images']['small']: fail('onbekend afbeeldingspatroon: ' + c0['images']['small'])
    small_tpl = c0['images']['small'].replace(tok, sid + '-{n}')
    large_tpl = c0['images']['large'].replace(tok, sid + '-{n}')
    for c in cards_raw:
        if small_tpl.replace('{n}', c['number']) != c['images']['small']:
            fail('afbeelding wijkt af bij kaart ' + c['number'])

    cards = sorted(({'n': c['number'], 'name': c['name'], 'r': c.get('rarity') or 'Onbekend', 'a': c.get('artist', '')} for c in cards_raw), key=num_key)
    datum = lang_datum(datetime.date.today())
    data = {
        'id': sid, 'name': SET_NAME, 'series': st['series'],
        'releaseDate': st['releaseDate'].replace('/', '-'),
        'printedTotal': st['printedTotal'], 'total': st['total'],
        'ptcgoCode': st.get('ptcgoCode'),
        'imageSmall': small_tpl, 'imageLarge': large_tpl,
        'source': f'Pokemon TCG API (api.pokemontcg.io/v2), opgehaald {datum}',
        'cards': cards,
    }

    TOP = cfg['top_zeldzaamheden']
    rar = {}
    for c in cards: rar[c['r']] = rar.get(c['r'], 0) + 1
    n_ir = rar.get('Illustration Rare', 0)
    n_ur = rar.get('Ultra Rare', 0)
    n_top = sum(rar.get(x, 0) for x in TOP)
    print(f'{sid}: {len(cards)} kaarten (printedTotal {st["printedTotal"]}, total {st["total"]})')
    for k, v in sorted(rar.items(), key=lambda x: -x[1]): print(f'  {v:4} {k}')
    verwacht = cfg.get('verwacht_totaal')
    if verwacht and len(cards) != verwacht:
        print(f'LET OP: niet {verwacht} kaarten, controleer de teksten op de pagina (kort antwoord, FAQ, afvinklijst).')
    bekend = set(KORT) | {'Common', 'Uncommon', 'Rare', 'Onbekend'} | set(TOP)
    nieuw = [k for k in rar if k not in bekend]
    if nieuw: print('LET OP: zeldzaamheid die het script nog niet kent: ' + ', '.join(nieuw) + '. Hoort die bij "top_zeldzaamheden" in de config?')
    if n_top == 0: print('LET OP: geen kaarten in de topcategorie gevonden; de API heeft de zeldzaamheden misschien nog niet.')
    for c in cards:
        if c['r'] in TOP: print(f"  top: {c['n']} {c['name']} ({c['r']})")

    html = lees(PAGE)
    if 'id="cardGallery"' in html: fail('pagina heeft al een galerij')
    a = html.find('<h2 class="article-h2" id="kaartlijst">')
    bron = html.find(cfg.get('kaartlijst_eind_anker', 'Bron: de Engelse kaartlijst'), a)
    b = html.find('</p>', bron) + len('</p>')
    if a < 0 or bron < 0: fail('kaartlijst-blok niet gevonden op de pagina (kop met id="kaartlijst" en de bronregel eronder, zie "kaartlijst_eind_anker")')

    top_cond = ' || '.join("c.r === '%s'" % x for x in TOP)
    section = f'''<h2 class="article-h2" id="kaartlijst">Volledige kaartlijst ({len(cards)} kaarten)</h2>

    <div class="prose">
      <p>Hieronder staat de complete kaartlijst van {SET_NAME}, van nummer 1 tot en met {cards[-1]['n']}. Filter op zeldzaamheid om snel de secret rares te vinden. Klik op een kaart om de grote versie te openen. Liever afvinken op papier? <a href="#afvinklijst">Download de afvinklijst (PDF)</a>.</p>
    </div>

    <section class="cardlist-wrap" aria-label="Volledige kaartlijst van {SET_NAME}">
      <div class="chip-row" role="group" aria-label="Filter op zeldzaamheid">
        <button type="button" class="chip active" data-filter="all">Alle kaarten ({len(cards)})</button>
        <button type="button" class="chip" data-filter="Illustration Rare">Illustration Rares ({n_ir})</button>
        <button type="button" class="chip" data-filter="Ultra Rare">Ultra Rares ({n_ur})</button>
        <button type="button" class="chip" data-filter="top">{H.escape(cfg['top_label'])} ({n_top})</button>
      </div>
      <div class="card-gallery" id="cardGallery"></div>
      <noscript><p class="gallery-note">De kaartgalerij heeft JavaScript nodig. De volledige lijst staat ook op Bulbapedia ({SET_NAME} (TCG)).</p></noscript>
      <p class="gallery-note">Kaartgegevens en afbeeldingen via de Pokemon TCG API, peildatum {datum}. Kaartafbeeldingen zijn eigendom van The Pokémon Company.</p>
    </section>'''
    html = html[:a] + section + html[b:]

    js = f'''
      var gallery = document.getElementById('cardGallery');
      var cardsData = [];

      function renderCards(filter) {{
        gallery.innerHTML = '';
        var frag = document.createDocumentFragment();
        cardsData.forEach(function(c) {{
          var isTop = {top_cond};
          if (filter === 'Illustration Rare' && c.r !== 'Illustration Rare') return;
          if (filter === 'Ultra Rare' && c.r !== 'Ultra Rare') return;
          if (filter === 'top' && !isTop) return;
          var a = document.createElement('a');
          a.className = 'tcg-card';
          a.href = '{large_tpl.split("{n}")[0]}' + c.n + '{large_tpl.split("{n}")[1]}';
          a.target = '_blank';
          a.rel = 'noopener';
          var img = document.createElement('img'); img.width=245; img.height=342;
          img.loading = 'lazy';
          img.decoding = 'async';
          img.src = '{small_tpl.split("{n}")[0]}' + c.n + '{small_tpl.split("{n}")[1]}';
          img.alt = 'Pokemon-kaart ' + c.name + ', nummer ' + c.n + ' uit {SET_NAME}';
          a.appendChild(img);
          var nm = document.createElement('span');
          nm.className = 'tc-name';
          nm.textContent = c.n + ' · ' + c.name;
          a.appendChild(nm);
          var ra = document.createElement('span');
          ra.className = 'tc-rarity';
          ra.textContent = c.r;
          a.appendChild(ra);
          frag.appendChild(a);
        }});
        gallery.appendChild(frag);
      }}

      fetch('/sets/data/{sid}.json')
        .then(function(r) {{ return r.json(); }})
        .then(function(d) {{
          cardsData = d.cards;
          renderCards('all');
        }})
        .catch(function() {{
          gallery.innerHTML = '<p class="gallery-note">De kaartlijst kon niet worden geladen. Probeer de pagina te verversen.</p>';
        }});

      document.querySelectorAll('.chip').forEach(function(chip) {{
        chip.addEventListener('click', function() {{
          document.querySelectorAll('.chip').forEach(function(c) {{ c.classList.remove('active'); }});
          this.classList.add('active');
          renderCards(this.dataset.filter);
        }});
      }});
'''
    f = html.find("document.querySelectorAll('.faq-question')")
    end = html.find('})();', f)
    if f < 0 or end < 0: fail('FAQ-script niet gevonden om de galerij aan toe te voegen')
    html = html[:end] + js.lstrip('\n') + '    ' + html[end:]

    sj = json.loads(lees(SETS_JSON))
    hit = None
    for s in sj['series']:
        for x in s.get('sets', []):
            if x.get('page') == f'/sets/{slug}': hit = x
    if not hit: fail(f'{SET_NAME} niet gevonden in sets.json (page = /sets/{slug})')
    hit.update({'printedTotal': st['printedTotal'], 'total': st['total'], 'status': 'uit',
                'logo': st.get('images', {}).get('logo'), 'symbol': st.get('images', {}).get('symbol')})
    if hit.get('releaseDate') != data['releaseDate']:
        print(f"LET OP: releasedatum in sets.json ({hit.get('releaseDate')}) wijkt af van de API ({data['releaseDate']}). Zoek uit welke klopt.")

    if dry:
        print('dry-run: niets geschreven'); return
    schrijf(ROOT / 'sets' / 'data' / f'{sid}.json', json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    schrijf(PAGE, html)
    schrijf(SETS_JSON, json.dumps(sj, ensure_ascii=False, indent=1))
    print(f'Geschreven: sets/data/{sid}.json, sets/{slug}.html, sets/data/sets.json')
    print('Nu: node tools/prerender-sets.mjs  en  node tools/verify-prerender.mjs')


# ---------------------------------------------------------------- chase
def cmd_chase(cfg, dry):
    SET_NAME, PAGE, slug = cfg['naam'], cfg['pagina'], cfg['slug']
    ch = cfg.get('chase') or fail('geen "chase"-blok in de config')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', ch.get('peildatum', '')): fail('peildatum ontbreekt (JJJJ-MM-DD)')
    j, m, d = map(int, ch['peildatum'].split('-'))
    peil = f'{d} {MAANDEN[m-1]} {j}'
    data = None
    for f in (ROOT / 'sets' / 'data').glob('*.json'):
        try: x = json.loads(lees(f))
        except Exception: continue
        if isinstance(x, dict) and x.get('name') == SET_NAME and x.get('cards'): data = x; break
    if not data: fail(f'sets/data/<id>.json van {SET_NAME} bestaat nog niet; eerst de stap galerij')
    sid = data['id']; per_nr = {c['n']: c for c in data['cards']}

    rijen = []
    for k in ch['kaarten']:
        if k.get('prijs') in (None, ''): fail(f"geen prijs voor kaart {k['n']}")
        c = per_nr.get(k['n'])
        if not c: fail(f"kaart {k['n']} staat niet in {sid}.json")
        rijen.append({**c, 'prijs': int(round(float(k['prijs'])))})
    rijen.sort(key=lambda x: -x['prijs'])
    if len(rijen) < 3: fail('minstens drie kaarten nodig')
    def label(c): return KORT.get(c['r'], c['r'])
    def naam(c): return H.escape(c['name'])

    t = rijen[0]
    tabel = '\n'.join(f'          <tr><td>{naam(c)} <span style="color:var(--text-faint)">{H.escape(label(c))}</span></td><td>{c["n"]}</td><td style="white-space:nowrap">{c["prijs"]} euro</td></tr>' for c in rijen)
    figs = '\n'.join(f'''      <figure>
        <img src="https://images.scrydex.com/pokemon/{sid}-{c["n"]}/small" alt="{naam(c)} {H.escape(c["r"])}, kaart {c["n"]} uit {SET_NAME}" loading="lazy" width="245" height="342">
        <figcaption>{naam(c)} {H.escape(label(c))} ({c["n"]}){", " + H.escape(c["a"]) if c.get("a") else ""}</figcaption>
      </figure>''' for c in rijen[:3])
    rest = rijen[1:4]
    rest_txt = ', '.join(f'{naam(c)} ({c["n"]}, circa {c["prijs"]} euro)' for c in rest[:-1]) + f' en {naam(rest[-1])} ({rest[-1]["n"]}, circa {rest[-1]["prijs"]} euro)'
    sir = [c for c in data['cards'] if c['r'] == 'Special Illustration Rare']
    tussenzin = (ch.get('tussenzin') or '').strip()    # een zin over deze set, bv. over de Japanse tegenhanger
    tussenzin = (tussenzin + ' ') if tussenzin else ''
    blok = f'''{START}
    <h3 class="article-h3" id="chase-cards">De chase cards</h3>

    <div class="prose">
      <p>De duurste kaart van {SET_NAME} is de <strong>{naam(t)} {H.escape(t["r"])} ({t["n"]})</strong>, met een prijstrend van circa {t["prijs"]} euro op Cardmarket. Daarna volgen {rest_txt}. Prijzen van een nieuwe set bewegen in de eerste weken sterk; dit is de stand van {peil}.</p>
    </div>

    <div class="article-table-wrap" id="chase-prijzen-tabel">
      <table class="article-table">
        <thead><tr><th>Kaart</th><th>Nr.</th><th>Prijs</th></tr></thead>
        <tbody>
{tabel}
        </tbody>
      </table>
    </div>
    <p class="table-note" style="max-width:var(--measure);font-size:.8125rem;color:var(--text-faint);margin:-16px 0 28px">Prijstrend op Cardmarket op {peil}, losse kaarten zonder grading, afgerond op hele euro's. SIR = Special Illustration Rare.</p>

    <div class="figure-row">
{figs}
    </div>

    <div class="prose">
      <p>De set telt {len(sir)} Special Illustration Rares. {tussenzin}Wat een kaart nu waard is, zie je het best aan de prijstrend op Cardmarket; hoe je die leest, staat in <a href="/waarde/wat-zijn-mijn-pokemon-kaarten-waard">wat zijn mijn Pokémon-kaarten waard</a>.</p>
    </div>
{EIND}'''

    s = lees(PAGE)
    if START in s:
        a = s.index(START); b = s.index(EIND) + len(EIND)
    else:
        a = s.find('<h3 class="article-h3" id="chase-cards">')
        b = s.find(ch.get('volgende_kop', '<h2 class="article-h2" id="prerelease">'))
        if a < 0 or b < 0: fail('chase-sectie (h3 met id="chase-cards") of de kop erna ("volgende_kop" in de config) niet gevonden')
        blok += '\n\n    '
    s = s[:a] + blok + s[b:]

    faq = f'De duurste kaart is de {t["name"]} {t["r"]} ({t["n"]}), met een prijstrend van circa {t["prijs"]} euro op Cardmarket op {peil}. Daarna volgen ' + \
          ', '.join(f'{c["name"]} ({c["n"]})' for c in rest[:2]) + '. Alle prijzen staan in de tabel op deze pagina.'
    n_faq = 0
    sn = re.escape(SET_NAME)
    for pat in (r'("name": "Wat (?:worden|zijn) de chase cards van ' + sn + r'\?",\s*"acceptedAnswer": \{\s*"@type": "Answer",\s*"text": ")[^"]*(")',
                r'(Wat (?:worden|zijn) de chase cards van ' + sn + r'\?</button>\s*<div class="faq-answer">\s*<div class="faq-answer-inner">)[^<]*(</div>)'):
        esc = faq.replace('"', '\\"') if pat.startswith('("name"') else H.escape(faq, quote=False)
        s, k = re.subn(pat, lambda mm: mm.group(1) + esc + mm.group(2), s, count=1); n_faq += k
    if n_faq != 2: fail(f'FAQ "Wat worden/zijn de chase cards van {SET_NAME}?" {n_faq} van 2 keer gevonden (JSON-LD en zichtbaar)')
    s = s.replace(f'Wat worden de chase cards van {SET_NAME}?', f'Wat zijn de chase cards van {SET_NAME}?')
    oude_toc = ch.get('toc_oud', 'Chase cards: wat we uit Japan weten')
    s = s.replace(f'<a href="#chase-cards">{oude_toc}</a>', '<a href="#chase-cards">De chase cards</a>')

    titel = ch.get('titel') or fail('"titel" ontbreekt in het chase-blok van de config')
    oud = re.search(r'<title>(.*?)</title>', s).group(1)
    s = s.replace(oud, titel) if oud != titel else s
    desc = f'{SET_NAME} chase cards met prijzen: de {t["name"]} {label(t)} ({t["n"]}) is met circa {t["prijs"]} euro de duurste. Plus alle SIR\'s en de kaartlijst van {data["total"]} kaarten.'
    if len(desc) > 165: print(f'LET OP: description is {len(desc)} tekens')
    s, k = re.subn(r'(<meta name="description" content=")[^"]*(">)', lambda mm: mm.group(1) + H.escape(desc) + mm.group(2), s, count=1)
    if k != 1: fail('meta description niet gevonden')

    print(f'{sid}: {len(rijen)} kaarten, duurste {t["name"]} ({t["n"]}) {t["prijs"]} euro, peildatum {peil}')
    print(f'titel: {titel} ({len(titel)} tekens)')
    print(f'description ({len(desc)}): {desc}')
    if dry: print('[dry-run] niets geschreven'); return
    schrijf(PAGE, s)
    print(f'Geschreven: sets/{slug}.html. Check de drie kaartbeelden (Scrydex geeft bij een onbekende kaart een standaardplaatje van 45.551 bytes).')


def main():
    argv = sys.argv[1:]
    dry = '--dry-run' in argv
    datum = datetime.date.today()
    if '--datum' in argv:
        i = argv.index('--datum'); datum = datetime.date.fromisoformat(argv[i + 1]); del argv[i:i + 2]
    a = [x for x in argv if not x.startswith('--')]
    if len(a) < 2 or a[0] not in ('live', 'galerij', 'chase', 'check'):
        print(__doc__); sys.exit(1)
    cfg = laad_cfg(a[1])
    if a[0] == 'live': cmd_live(cfg, dry, datum)
    elif a[0] == 'check': meld_toekomende_tijd(cfg)
    elif a[0] == 'galerij':
        if len(a) < 3: fail('geef het pad naar het ruwe API-bestand mee')
        cmd_galerij(cfg, dry, a[2])
    else: cmd_chase(cfg, dry)

if __name__ == '__main__':
    main()
