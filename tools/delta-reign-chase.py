"""
Delta Reign, deel 3: het chase-cards-blok met Cardmarket-prijzen.

Draaien als er een of twee dagen na de release echte prijzen zijn:
  1. vul _werkdocumenten/delta-reign-chase.json (peildatum + prijs per kaart)
  2. python tools/delta-reign-chase.py --dry-run
  3. python tools/delta-reign-chase.py

Vereist dat sets/data/<id>.json van Delta Reign bestaat (delta-reign-releasedag.py):
naam, zeldzaamheid en illustrator komen daaruit, zodat er niets geraden wordt.
Vervangt de sectie "Chase cards: wat we uit Japan weten" door tabel, beelden en tekst
(zelfde opbouw als pitch-black.html), werkt de FAQ over chase cards bij en zet titel
en description in het patroon "chase cards en prijzen" dat bij Pitch Black werkt.
Opnieuw draaien met nieuwe prijzen kan: het blok wordt dan opnieuw opgebouwd.
"""
import json, re, sys, html as H
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / 'sets' / 'delta-reign.html'
CFG = ROOT / '_werkdocumenten' / 'delta-reign-chase.json'
MAANDEN = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']
KORT = {'Special Illustration Rare': 'SIR', 'Mega Hyper Rare': 'Mega Hyper Rare', 'Ultra Rare': 'Ultra Rare',
        'Illustration Rare': 'Illustration Rare', 'Double Rare': 'Double Rare'}
NIEUWE_TITEL = 'Delta Reign chase cards en prijzen: Mega Rayquaza ex en alle 141 kaarten'
START = '<!-- chase:start -->'
EIND = '<!-- chase:eind -->'

def fail(m): print('STOP:', m); sys.exit(1)

def main():
    dry = '--dry-run' in sys.argv
    cfg = json.loads(CFG.read_text(encoding='utf-8'))
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', cfg.get('peildatum', '')): fail('peildatum ontbreekt (JJJJ-MM-DD)')
    j, m, d = map(int, cfg['peildatum'].split('-'))
    peil = f'{d} {MAANDEN[m-1]} {j}'
    data = None
    for f in (ROOT / 'sets' / 'data').glob('*.json'):
        try: x = json.loads(f.read_text(encoding='utf-8'))
        except Exception: continue
        if isinstance(x, dict) and x.get('name') == 'Delta Reign' and x.get('cards'): data = x; break
    if not data: fail('sets/data/<id>.json van Delta Reign bestaat nog niet; eerst delta-reign-releasedag.py')
    sid = data['id']; per_nr = {c['n']: c for c in data['cards']}

    rijen = []
    for k in cfg['kaarten']:
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
        <img src="https://images.scrydex.com/pokemon/{sid}-{c["n"]}/small" alt="{naam(c)} {H.escape(c["r"])}, kaart {c["n"]} uit Delta Reign" loading="lazy" width="245" height="342">
        <figcaption>{naam(c)} {H.escape(label(c))} ({c["n"]}){", " + H.escape(c["a"]) if c.get("a") else ""}</figcaption>
      </figure>''' for c in rijen[:3])
    rest = rijen[1:4]
    rest_txt = ', '.join(f'{naam(c)} ({c["n"]}, circa {c["prijs"]} euro)' for c in rest[:-1]) + f' en {naam(rest[-1])} ({rest[-1]["n"]}, circa {rest[-1]["prijs"]} euro)'
    sir = [c for c in data['cards'] if c['r'] == 'Special Illustration Rare']
    blok = f'''{START}
    <h3 class="article-h3" id="chase-cards">De chase cards</h3>

    <div class="prose">
      <p>De duurste kaart van Delta Reign is de <strong>{naam(t)} {H.escape(t["r"])} ({t["n"]})</strong>, met een prijstrend van circa {t["prijs"]} euro op Cardmarket. Daarna volgen {rest_txt}. Prijzen van een nieuwe set bewegen in de eerste weken sterk; dit is de stand van {peil}.</p>
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
      <p>De set telt {len(sir)} Special Illustration Rares. In de Japanse tegenhanger Storm Emeralda waren de zeldzaamste versies van Mega Rayquaza ex ook al de duurste kaarten. Wat een kaart nu waard is, zie je het best aan de prijstrend op Cardmarket; hoe je die leest, staat in <a href="/waarde/wat-zijn-mijn-pokemon-kaarten-waard">wat zijn mijn Pokémon-kaarten waard</a>.</p>
    </div>
{EIND}'''

    s = PAGE.read_text(encoding='utf-8')
    if START in s:
        a = s.index(START); b = s.index(EIND) + len(EIND)
    else:
        a = s.find('<h3 class="article-h3" id="chase-cards">')
        b = s.find('<h2 class="article-h2" id="prerelease">')
        if a < 0 or b < 0: fail('chase-sectie of prerelease-kop niet gevonden')
        blok += '\n\n    '
    s = s[:a] + blok + s[b:]

    faq = f'De duurste kaart is de {t["name"]} {t["r"]} ({t["n"]}), met een prijstrend van circa {t["prijs"]} euro op Cardmarket op {peil}. Daarna volgen ' + \
          ', '.join(f'{c["name"]} ({c["n"]})' for c in rest[:2]) + '. Alle prijzen staan in de tabel op deze pagina.'
    n_faq = 0
    for pat in (r'("name": "Wat (?:worden|zijn) de chase cards van Delta Reign\?",\s*"acceptedAnswer": \{\s*"@type": "Answer",\s*"text": ")[^"]*(")',
                r'(Wat (?:worden|zijn) de chase cards van Delta Reign\?</button>\s*<div class="faq-answer">\s*<div class="faq-answer-inner">)[^<]*(</div>)'):
        esc = faq.replace('"', '\\"') if pat.startswith('("name"') else H.escape(faq, quote=False)
        s, k = re.subn(pat, lambda mm: mm.group(1) + esc + mm.group(2), s, count=1); n_faq += k
    if n_faq != 2: fail(f'FAQ chase cards {n_faq} van 2 keer gevonden')
    s = s.replace('Wat worden de chase cards van Delta Reign?', 'Wat zijn de chase cards van Delta Reign?')
    s = s.replace('<a href="#chase-cards">Chase cards: wat we uit Japan weten</a>', '<a href="#chase-cards">De chase cards</a>')

    oud = re.search(r'<title>(.*?)</title>', s).group(1)
    s = s.replace(oud, NIEUWE_TITEL) if oud != NIEUWE_TITEL else s
    desc = f'Delta Reign chase cards met prijzen: de {t["name"]} {label(t)} ({t["n"]}) is met circa {t["prijs"]} euro de duurste. Plus alle SIR\'s en de kaartlijst van 141 kaarten.'
    if len(desc) > 165: print(f'LET OP: description is {len(desc)} tekens')
    s, k = re.subn(r'(<meta name="description" content=")[^"]*(">)', lambda mm: mm.group(1) + H.escape(desc) + mm.group(2), s, count=1)
    if k != 1: fail('meta description niet gevonden')

    print(f'{sid}: {len(rijen)} kaarten, duurste {t["name"]} ({t["n"]}) {t["prijs"]} euro, peildatum {peil}')
    print(f'titel: {NIEUWE_TITEL} ({len(NIEUWE_TITEL)} tekens)')
    print(f'description ({len(desc)}): {desc}')
    if dry: print('[dry-run] niets geschreven'); return
    PAGE.write_text(s, encoding='utf-8')
    print('Geschreven: sets/delta-reign.html. Check de drie kaartbeelden (Scrydex geeft bij een onbekende kaart een standaardplaatje van 45.551 bytes).')

if __name__ == '__main__':
    main()
