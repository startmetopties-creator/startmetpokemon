"""
Releasedag Delta Reign: zet de kaartgalerij op sets/delta-reign.html.

Wat je nodig hebt: het ruwe antwoord van de Pokemon TCG API, opgeslagen als
JSON-bestand. Ophalen via Chrome (de API is vanuit de sandbox niet bereikbaar):
  https://api.pokemontcg.io/v2/cards?q=set.id:me6&pageSize=250
Controleer eerst het set-id via
  https://api.pokemontcg.io/v2/sets?q=series:%22Mega%20Evolution%22&orderBy=releaseDate
(op 31 oktober 2026 stond Delta Reign er nog niet in; verwacht id: me6).

Draaien vanuit de projectmap:
  python tools/delta-reign-releasedag.py _werkdocumenten/me6-raw.json --dry-run
  python tools/delta-reign-releasedag.py _werkdocumenten/me6-raw.json

Wat het doet:
  1. sets/data/<id>.json schrijven in het formaat van de andere sets
  2. op sets/delta-reign.html de tabellen in #kaartlijst vervangen door de
     galerij met filterknoppen (zelfde opbouw als pitch-black.html)
  3. de galerij-JavaScript toevoegen (fetch('/sets/data/<id>.json'))
  4. in sets/data/sets.json totals, status, logo en symbool bijwerken
Daarna: node tools/prerender-sets.mjs en node tools/verify-prerender.mjs.
Opnieuw draaien kan niet op een pagina die al een galerij heeft (het script stopt dan).
"""
import json, re, sys, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / 'sets' / 'delta-reign.html'
SETS_JSON = ROOT / 'sets' / 'data' / 'sets.json'
SET_NAME = 'Delta Reign'
MAANDEN = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']

def fail(msg):
    print('STOP:', msg); sys.exit(1)

def num_key(c):
    m = re.match(r'\d+', c['n'])
    return (int(m.group()) if m else 10**6, c['n'])

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry-run' in sys.argv
    if not args: fail('geef het pad naar het ruwe API-bestand mee')
    raw = json.loads(Path(args[0]).read_text(encoding='utf-8'))
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
    today = datetime.date.today()
    datum = f"{today.day} {MAANDEN[today.month-1]} {today.year}"
    data = {
        'id': sid, 'name': SET_NAME, 'series': st['series'],
        'releaseDate': st['releaseDate'].replace('/', '-'),
        'printedTotal': st['printedTotal'], 'total': st['total'],
        'ptcgoCode': st.get('ptcgoCode'),
        'imageSmall': small_tpl, 'imageLarge': large_tpl,
        'source': f'Pokemon TCG API (api.pokemontcg.io/v2), opgehaald {datum}',
        'cards': cards,
    }

    rar = {}
    for c in cards: rar[c['r']] = rar.get(c['r'], 0) + 1
    n_ir = rar.get('Illustration Rare', 0)
    n_ur = rar.get('Ultra Rare', 0)
    n_top = rar.get('Special Illustration Rare', 0) + rar.get('Mega Hyper Rare', 0)
    print(f'{sid}: {len(cards)} kaarten (printedTotal {st["printedTotal"]}, total {st["total"]})')
    for k, v in sorted(rar.items(), key=lambda x: -x[1]): print(f'  {v:4} {k}')
    if len(cards) != 141: print('LET OP: niet 141 kaarten, controleer de teksten op de pagina (kort antwoord, FAQ, afvinklijst).')
    if n_top == 0: print('LET OP: geen SIR of Mega Hyper Rare gevonden; de API heeft de zeldzaamheden misschien nog niet.')
    top = [c for c in cards if c['r'] in ('Special Illustration Rare', 'Mega Hyper Rare')]
    for c in top: print(f"  top: {c['n']} {c['name']} ({c['r']})")

    html = PAGE.read_text(encoding='utf-8')
    if 'id="cardGallery"' in html: fail('pagina heeft al een galerij')
    a = html.find('<h2 class="article-h2" id="kaartlijst">')
    bron = html.find('Bron: de Engelse kaartlijst', a)
    b = html.find('</p>', bron) + len('</p>')
    if a < 0 or bron < 0: fail('kaartlijst-blok niet gevonden op de pagina')

    section = f'''<h2 class="article-h2" id="kaartlijst">Volledige kaartlijst ({len(cards)} kaarten)</h2>

    <div class="prose">
      <p>Hieronder staat de complete kaartlijst van Delta Reign, van nummer 1 tot en met {cards[-1]['n']}. Filter op zeldzaamheid om snel de secret rares te vinden. Klik op een kaart om de grote versie te openen. Liever afvinken op papier? <a href="#afvinklijst">Download de afvinklijst (PDF)</a>.</p>
    </div>

    <section class="cardlist-wrap" aria-label="Volledige kaartlijst van Delta Reign">
      <div class="chip-row" role="group" aria-label="Filter op zeldzaamheid">
        <button type="button" class="chip active" data-filter="all">Alle kaarten ({len(cards)})</button>
        <button type="button" class="chip" data-filter="Illustration Rare">Illustration Rares ({n_ir})</button>
        <button type="button" class="chip" data-filter="Ultra Rare">Ultra Rares ({n_ur})</button>
        <button type="button" class="chip" data-filter="top">SIR &amp; Mega Hyper Rare ({n_top})</button>
      </div>
      <div class="card-gallery" id="cardGallery"></div>
      <noscript><p class="gallery-note">De kaartgalerij heeft JavaScript nodig. De volledige lijst staat ook op Bulbapedia (Delta Reign (TCG)).</p></noscript>
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
          var isTop = c.r === 'Special Illustration Rare' || c.r === 'Mega Hyper Rare';
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

    sj = json.loads(SETS_JSON.read_text(encoding='utf-8'))
    hit = None
    for s in sj['series']:
        for x in s.get('sets', []):
            if x.get('page') == '/sets/delta-reign': hit = x
    if not hit: fail('Delta Reign niet gevonden in sets.json')
    hit.update({'printedTotal': st['printedTotal'], 'total': st['total'], 'status': 'uit',
                'logo': st.get('images', {}).get('logo'), 'symbol': st.get('images', {}).get('symbol')})

    if dry:
        print('dry-run: niets geschreven'); return
    (ROOT / 'sets' / 'data' / f'{sid}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    PAGE.write_text(html, encoding='utf-8')
    SETS_JSON.write_text(json.dumps(sj, ensure_ascii=False, indent=1), encoding='utf-8')
    print('Geschreven: sets/data/%s.json, sets/delta-reign.html, sets/data/sets.json' % sid)
    print('Nu: node tools/prerender-sets.mjs  en  node tools/verify-prerender.mjs')
    print('Daarna met de hand: kort antwoord en secties op "uit" zetten, chase cards met Cardmarket-prijzen, dateModified.')

if __name__ == '__main__':
    main()
