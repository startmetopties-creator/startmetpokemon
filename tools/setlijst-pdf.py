"""Maakt een afvinklijst (PDF) per set uit sets/data/<id>.json.

Gebruik: python setlijst.py <datamap> <uitmap> slug=id[+id2] ...
Voorbeeld: python setlijst.py sets/data downloads/setlijsten 30th-celebration=me55+me55c pitch-black=me5
"""
import json, sys, asyncio, html, collections, datetime
from playwright.async_api import async_playwright

datadir, outdir = sys.argv[1], sys.argv[2]
jobs = [a.split("=") for a in sys.argv[3:]]

NL_MAAND = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus",
            "september", "oktober", "november", "december"]
vandaag = datetime.date.today()
datum = f"{vandaag.day} {NL_MAAND[vandaag.month-1]} {vandaag.year}"

BOLT = ('<svg viewBox="0 0 64 64" width="26" height="26"><rect width="64" height="64" rx="14" fill="#0A0E17"/>'
        '<path d="M38 6 L20 34 L30 34 L24 58 L46 28 L34 28 L40 6 Z" fill="#FACC15"/></svg>')

def sortkey(c):
    n = c["n"]
    digits = "".join(ch for ch in n if ch.isdigit())
    return (0 if n.isdigit() else 1, int(digits) if digits else 0, n)

def release_nl(iso):
    if not iso: return ""
    y, m, d = iso.split("-")
    return f"{int(d)} {NL_MAAND[int(m)-1]} {y}"

def tabel(cards):
    rows = []
    for c in sorted(cards, key=sortkey):
        r = c.get("r") or "-"
        rows.append(f'<div class="row"><span class="box"></span><span class="nr">{html.escape(c["n"])}</span>'
                    f'<span class="naam">{html.escape(c["name"])}</span><span class="rar">{html.escape(r)}</span></div>')
    return rows

def blok(d):
    cards = d["cards"]
    rows = tabel(cards)
    cols = "".join(rows)
    tel = collections.Counter((c.get("r") or "-") for c in cards)
    telling = " · ".join(f"{k} {v}" for k, v in sorted(tel.items(), key=lambda kv: -kv[1]))
    pt = d.get("printedTotal"); tot = d.get("total") or len(cards)
    sub = f'{tot} kaarten' + (f', waarvan {tot-pt} secret rares boven de {pt}' if pt and tot and tot > pt else '')
    return f'''<section><div class="sethead"><h2>{html.escape(d["name"])}</h2>
<div class="meta">{sub}{" · release " + release_nl(d.get("releaseDate")) if d.get("releaseDate") else ""}{" · code " + d["ptcgoCode"] if d.get("ptcgoCode") else ""}</div></div>
<p class="tel"><b>Per zeldzaamheid:</b> {html.escape(telling)}</p>
<div class="cols">{cols}</div></section>'''

CSS = """
@page { size: A4; margin: 10mm 0 11mm 0; }
@page :first { margin-top: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, 'DejaVu Sans', sans-serif; color: #111827; font-size: 7.6pt; }
.top { background: #0A0E17; color: #E8ECF3; padding: 13mm 14mm 9mm; display: flex; justify-content: space-between; align-items: flex-end; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 9pt; letter-spacing: .02em; }
.label { color: #FACC15; font-size: 7.5pt; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
h1 { font-family: 'Inter Display', Inter, sans-serif; font-size: 24pt; margin: 0; font-weight: 700; letter-spacing: -.01em; }
.intro { color: #94A3B8; font-size: 8.5pt; margin-top: 4px; max-width: 120mm; }
.ik { text-align: right; color: #C5CCD8; font-size: 8pt; line-height: 1.9; }
.ik span { display: inline-block; width: 38mm; border-bottom: 1px solid #475569; }
main { padding: 7mm 14mm 0; }
section { margin-bottom: 6mm; }
.sethead { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0A0E17; padding-bottom: 2mm; margin-bottom: 2mm; break-after: avoid; }
h2 { font-family: 'Inter Display', Inter, sans-serif; font-size: 12pt; margin: 0; }
.meta { color: #6B7280; font-size: 7.5pt; }
.cols { columns: 2; column-gap: 8mm; column-fill: auto; }
.row { display: flex; align-items: center; gap: 2mm; padding: 0.82mm 1mm; border-bottom: 1px solid #E5E7EB; break-inside: avoid; }
.row .box { flex: none; width: 3.2mm; height: 3.2mm; border: 1px solid #374151; border-radius: 0.6mm; }
.row .nr { flex: none; width: 8mm; color: #374151; font-variant-numeric: tabular-nums; }
.row .naam { flex: 1; font-weight: 500; }
.row .rar { flex: none; width: 27mm; color: #6B7280; font-size: 6.6pt; }
table { width: 50%; border-collapse: collapse; }
thead { display: table-header-group; }
th { text-align: left; font-size: 6.2pt; letter-spacing: .08em; text-transform: uppercase; color: #6B7280; font-weight: 600; padding: 1.2mm 1mm; border-bottom: 1px solid #9CA3AF; }
td { padding: 0.95mm 1mm; border-bottom: 1px solid #E5E7EB; vertical-align: middle; }
tr { break-inside: avoid; }
td.box { width: 5mm; }
td.box span { display: block; width: 3.2mm; height: 3.2mm; border: 1px solid #374151; border-radius: 0.6mm; }
td.nr { width: 9mm; color: #374151; font-variant-numeric: tabular-nums; }
td.naam { font-weight: 500; }
td.rar { color: #6B7280; font-size: 6.6pt; width: 27mm; }
.tel { color: #4B5563; font-size: 6.8pt; margin: 0 0 2mm; }
"""

FOOTER = ('<div style="font-family:Inter,sans-serif;font-size:6.5pt;color:#9CA3AF;width:100%;padding:0 14mm;display:flex;justify-content:space-between">'
          '<span>startmetpokemon.nl · kaartdata: Pokémon TCG API · gemaakt op {datum}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for slug, ids in jobs:
            sets = [json.load(open(f"{datadir}/{i}.json", encoding="utf-8")) for i in ids.split("+")]
            naam = sets[0]["name"]
            n = sum(len(s["cards"]) for s in sets)
            body = "".join(blok(s) for s in sets)
            page = f'''<!doctype html><html lang="nl"><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="top"><div><div class="brand">{BOLT} Start Met Pokémon</div><div style="height:5mm"></div>
<div class="label">Afvinklijst</div><h1>{html.escape(naam)}</h1>
<div class="intro">Alle {n} kaarten op nummer. Vink af wat je hebt, dan zie je in een oogopslag wat er nog ontbreekt.</div></div>
<div class="ik">Naam <span></span><br>Begonnen op <span></span></div></div>
<main>{body}</main></body></html>'''
            pg = await b.new_page()
            await pg.set_content(page, wait_until="load")
            await pg.pdf(path=f"{outdir}/{slug}.pdf", format="A4", print_background=True,
                         display_header_footer=True, header_template="<span></span>",
                         footer_template=FOOTER.format(datum=datum), prefer_css_page_size=True)
            await pg.close()
            print(slug, n)
        await b.close()

asyncio.run(main())
