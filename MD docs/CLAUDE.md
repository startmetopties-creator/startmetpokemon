# Start Met Pokémon — Project Guide

Dit bestand wordt automatisch ingelezen bij elke sessie. Lees het eerst voordat je aan het werk gaat.

## Wat dit project is

**startmetpokemon.nl** — Nederlandstalig educatief platform over investeren in Pokémon-kaarten. Onafhankelijk, zonder hype. Gehost op Cloudflare Pages. De cursus bestaat uit 6 modules die de lezer in ~70 minuten door de basis loodsen. Sinds mei 2026 ook een `/nieuws/` sectie met **maandelijkse marktupdates** voor Pokemon-investeerders (zie eigen sectie hieronder).

Doelgroep: Nederlandstalige beginners in Pokémon-investeren (verzamelaars die stap willen maken + beleggers die alternatieve assets overwegen).

Eigenaar: Mick (besselinkmick@gmail.com).

## Werkafspraken met Mick

### Hard rules

- **Commits via GitHub upload UI.** Nooit `git commit` of `git push` draaien vanuit de bash sandbox. Maar Mick heeft expliciete toestemming gegeven om via de GitHub upload UI te committen (`github.com/startmetopties-creator/startmetpokemon/upload/main/[folder]`). Workflow: file uploaden via `mcp__Claude_in_Chrome__file_upload` op de file-input ref, commit-bericht invullen via `mcp__Claude_in_Chrome__form_input` op de textbox-ref, klikken via `computer left_click` op de Commit-knop ref. **Nooit** de GitHub web editor (CM6) gebruiken — clipboard-paste werkt niet vanuit Chrome "read"-tier.
- **Nederlands** voor alle content, UI-copy, commit messages, en CLAUDE.md zelf. Chatreacties ook in het Nederlands tenzij Mick naar Engels overschakelt.
- **Geen emoji's** in files, in mail-content, in subject lines, of in chat — tenzij Mick er expliciet om vraagt.
- **Geen em-dashes (—)** in publieke website-content. (In CLAUDE.md zelf wel acceptabel; daar is helder belangrijker dan stijl.)
- **Geen "Mick" in publieke documents** (PDF, website, mail-content). Het project heet "Start Met Pokémon" en spreekt in "we" / "wij". Mick wil neutraal en professioneel, geen persoonlijke branding.
- **Prijzen in news-content alleen met verifieerbare bron.** Web search-samenvattingen verwarren regelmatig Cardmarket SKU-varianten (bv. Pokemon Center ETB vs reguliere ETB). Concrete cijfers moeten uit een Mick-screenshot, een Chrome-extension lookup of een directe productpagina komen. Web search werkt voor release-datums en officiele aankondigingen, niet voor prijzen.

### Stijl in chat

- **Proza boven bullets.** Bullet lists alleen als ze echt de juiste vorm zijn (vergelijking, stappenplan, opsomming van >3 items zonder verband). Voor uitleg: gewoon paragrafen.
- **Korte rapportage na werk.** Klaar met een file? Eén regel: "klaar, hier staat X" of "PDF is geüpload, 99 KB". Geen samenvatting van alle stappen die ik nam — Mick weet wat hij vroeg.
- **Concrete acties, geen abstracties.** "Voeg dit TXT-record toe in Cloudflare DNS: naam `_dmarc`, content `v=DMARC1...`" — niet "stel DMARC in".
- **Geen overdreven veiligheidsclausules.** Mick is technisch onderlegd genoeg om DNS-records, MailerLite-settings, en GitHub-commits zelf te beoordelen. Niet bij elke actie waarschuwen.
- **Vraag bij onduidelijkheid één keer door.** Niet drie clarifying questions stapelen voor je begint. Liever: pak de meest waarschijnlijke interpretatie, doe het, en vraag pas door als het echt vastloopt.

### Hoe Mick werkt

- **Hij werkt visueel.** Stuurt vaak screenshots als feedback ("dit wordt afgesneden onderaan", "ik zie deze fout"). Bij een screenshot: lees 'm goed, refereer specifiek aan wat je ziet, en fix het probleem direct in plaats van te vragen om reproductie.
- **Hij wisselt tussen Cowork-chat en zijn browser/editor.** Vaak heeft hij MailerLite, GitHub, Cloudflare, of de live site al open in Chrome. Vraag of de Chrome-extension verbonden is — dan kan ik direct meekijken via `mcp__Claude_in_Chrome__*` tools (zie sectie hieronder).
- **Commits gaan via GitHub upload UI.** Claude kan zelf committen via de upload-pagina van GitHub in Chrome. Zie Hard rules hierboven voor de exacte workflow. Na een succesvolle commit deployt Cloudflare Pages automatisch (~1 min).
- **Hij pakt detailwerk goed op zelf.** DMARC-records, MailerLite-settings — geef instructies en hij doet het. Maar GitHub-commits en file-uploads pakt Claude nu zelf op via de Chrome-extension.
- **Pragmatisch boven perfect.** Een 8.5/10 spam-score is goed genoeg om te beginnen; een -0.5 voor MailerLite's tracking-pixel is acceptabel; een PDF die "voldoende" is wint van eindeloze polish. Stuur niet eindeloos door op marginale verbeteringen.
- **Lange chats degraderen.** Bij grote nieuwe taken: nieuwe chat openen i.p.v. doorgaan op een bestaande lange. Begin daar met "lees CLAUDE.md".

### Tools — wat werkt en wat niet

- **Bash sandbox kan startmetpokemon.nl NIET fetchen** (allowlist-block, 403). Curl/wget vanuit `mcp__workspace__bash` gaat niet.
- **`mcp__workspace__web_fetch` is óók geblokkeerd** voor startmetpokemon.nl ("Host not on the network allowlist").
- **Live-URL verifiëren = via Chrome extension** (`mcp__Claude_in_Chrome__navigate` + `javascript_tool` voor `fetch()` met `cache: 'no-store'`). Werkt alleen als Mick de extension heeft geactiveerd.
- **Git tools: niets**. Cowork-workspace is geen git-repo. `git status` faalt. Voor "wat staat er op GitHub" → Chrome-extension naar `github.com/startmetopties-creator/startmetpokemon`.
- **`browser_batch` voor de Chrome-extension** is veel sneller dan losse calls — gebruik 'm zodra je >1 stap weet (navigate + find + click + screenshot in één call).
- **Map "Pokemon 101" is gekoppeld** als vaste Cowork-map: `C:\Users\dagob\Documents\Claude\Projects\Pokemon 101`. Claude kan hier direct lezen en schrijven zonder telkens een map te hoeven selecteren. Let op: de repo-files staan verspreid — hoofdsite in `startmetpokemon/`, maar `waarde/` staat op top-niveau (`Pokemon 101/waarde/`) en de MD-docs in `startmetpokemon/MD docs/`.
- **Google Search Console** = URL-prefix property `https://startmetpokemon.nl/` (GEEN domein-property, dus in de URL `resource_id=https://startmetpokemon.nl/`, NIET `sc-domain:`). Staat onder Google-account **startmetopties@gmail.com** (hetzelfde als GitHub), niet onder besselinkmick@gmail.com. In de browser kan het tweede account (besselinkmick) uitgelogd zijn; dat is niet het GSC-account.

## Designsysteem — dark editorial

Geïnspireerd op Stratechery, Linear en Apple. Redactioneel, premium, rustig. Niet een typische "cursus-site".

### Kleuren (CSS custom properties)

```css
--bg: #0A0E17;              /* hoofdachtergrond */
--bg-elevated: #0F1422;     /* iets lichter, voor panels */
--surface: #131A2A;         /* kaarten, insets */
--surface-2: #1A2236;       /* hover states, diepere layer */
--text: #E8ECF3;            /* hoofdtekst */
--text-soft: #C5CCD8;       /* bodykopij */
--text-muted: #94A3B8;      /* secundair */
--text-faint: #64748B;      /* labels, kicker-tekst */
--hairline: rgba(255,255,255,0.08);       /* borders */
--hairline-soft: rgba(255,255,255,0.04);  /* subtielere borders */
--accent: #FACC15;          /* gold — CTAs, nummers, highlights */
--accent-soft: rgba(250,204,21,0.4);
--accent-dim: rgba(250,204,21,0.12);
--warm: #EF4444;            /* alleen voor gradients met accent */
--measure: 640px;           /* ideale leesbreedte voor proza */
```

### Typografie

- **DM Serif Display** (Google Fonts, ital 0 + 1) — headings, ghost numbers, redactionele titels, pullquotes. Variable `--serif`.
- **Figtree** (wght 400/500/600/700) — body, UI, labels, nav. Variable `--sans`.
- **Letter-spacing**: negatief op grote serif (`-0.02em` tot `-0.05em`), positief en uppercase op kleine labels (`0.28em`–`0.32em`).
- **Line-height**: body 1.75, koppen 1.05–1.25.

### Layout-conventies

- Proza max-width = `var(--measure)` (640px). Breder wordt onleesbaar.
- Hero's hebben een **ghost number** rechtsboven (DM Serif Display, 12–14rem, `rgba(255,255,255,0.04)`).
- **Drop cap** op de lede via `.lede::first-letter` (DM Serif, ~4.5rem, accent-kleur, float left).
- **Hairline borders** in plaats van volle borders of harde schaduwen — dit is een rode draad.
- **Section-intro** met groot serif-nummer (01, 02…) + uppercase label + kicker-regel, in 2-koloms grid (80px nummer + 1fr content).

### Kerncomponenten (in elke module terugkerend)

| Component | Gebruik | Kern-CSS |
|---|---|---|
| `.hero` + `.hero-ghost` | Module-opening | Ghost number rechtsboven, grote serif h1, deck (ondertitel) |
| `.section-intro` | Koppen binnen een module | 80px nummer + label + titel |
| `.lede` | Eerste paragraaf van een sectie | Drop cap + iets grotere leading |
| `.prose` | Generieke leestekst | `var(--measure)`, `line-height: 1.75` |
| `.pullquote` | Hero-quote midden in proza | Groot serif, italic, accent-kleur |
| `.fit-list` | Genummerde lijst (Module 1 "Is dit voor jou?") | Zie valkuilen hieronder |
| `.inset` | Genest info-block met background | `var(--surface)`, hairline border, 48–56px padding |
| `.closing` + `.closing-card` | Navigatie onderaan pagina (prev/next) | Light hairline grid — zie hieronder |
| `.afgerond` | Finale-banner (alleen Module 6) | Big accent block met CTA |
| `.article-h2` | Inline h2 in news-articles (lichter dan section-intro) | Serif, max-width `var(--measure)`, margin `3.5rem auto 1.4rem` |
| `.sources` | Bronnenblok onderaan news-article | Top hairline border, lijst met externe links |
| `.signup-inline` | Subtiele signup-form midden in proza (gebruikt op news + module 1-5) | Hairline border, accent-soft left-border, max 720px |

### Closing cards — de lichte versie (na iteratie)

Eerdere versie had gradient kaarten met ghost numbers en arrow buttons. Mick vond dat "too much" — te zwaar onderaan een pagina. **Huidige standaard:**

```css
.closing {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
}
.closing-card {
  padding: 28px 32px;
  border-right: 1px solid var(--hairline);
  transition: background .35s ease;
}
.closing-card:last-child { border-right: none; }
.closing-card:hover { background: var(--surface); }
.closing-card .ghost-num,
.closing-card .arrow-btn { display: none; }  /* bewust weggelaten */
```

Label (uppercase, 0.64rem, letter-spacing 0.3em) + title (serif, 1.35rem). `.next` heeft accent-kleur label, rechts uitgelijnd. Op mobile: 1 kolom, cards onder elkaar met bottom-border i.p.v. right-border.

## Valkuilen (hard geleerd)

### CSS Grid + inline child elements = grid items

Als je `display: grid` op een `<li>` zet, wordt elk directe kind een grid item — óók inline elementen zoals `<strong>` of `<em>`. Dat betekent dat een `<strong>` midden in een zin ineens naar een eigen grid cell gaat en de layout breekt.

**Fout patroon:**
```css
.fit-list li {
  display: grid;
  grid-template-columns: 56px 1fr;
}
```
Met HTML `<li>01 Je hebt <strong>interesse in alternatieve beleggingen</strong></li>` → de `<strong>` belandt in kolom 1 (56px breed) op rij 2. Ziet er raar uit.

**Goede patroon:** `position: relative` op de `<li>` + absoluut gepositioneerde `::before` voor het nummer + `padding-left` op de li voor ruimte.

### ReportLab subscript/superscript

Als je ooit PDF's genereert: nooit unicode ₀₁₂ of ⁰¹² gebruiken in ReportLab — rendert als zwarte blokjes. Gebruik `<sub>` en `<super>` tags in Paragraph objects.

### Datering van schema.org

Houd `dateModified` in de JSON-LD en `lastmod` in `sitemap.xml` bij elkaar synchroon. Google pakt lastmod serieus en kan pagina's opnieuw indexeren.

### CSS cascade: `display: none` moet vóór de media query staan

Bij een hamburger-menu (of elk element dat op desktop `display: none` heeft en op mobiel zichtbaar moet worden): zet de `display: none` regel altijd **vóór** het `@media`-blok dat het overschrijft. Als `display: none` ná de media query staat, wint het altijd op basis van cascade-volgorde — ook op mobiel. Resultaat: hamburger nooit zichtbaar.

```css
/* GOED: display:none eerst, media query overschrijft daarna */
.nav-hamburger { display: none; ... }

@media (max-width: 900px) {
  .nav-hamburger { display: flex; } /* wint, want later in dezelfde specificiteit */
}

/* FOUT: display:none na de media query */
@media (max-width: 900px) {
  .nav-hamburger { display: flex; }
}
.nav-hamburger { display: none; } /* overschrijft altijd, ook op mobiel */
```

### CSS-injectie via string replace: controleer exacte inspringing van `</style>`

Python-scripts die CSS injecteren via `html.replace('  </style>', ...)` falen stilletjes als de `</style>` tag een andere inspringing heeft dan verwacht (bijv. geen spaties in index.html vs. 2 spaties in module-files). Controleer altijd eerst met `grep -n "</style>"` wat de exacte string is.

### Bestand afgeknot na Python-script: controleer altijd `</body></html>`

Na grote Python-bewerkingen op HTML-files: verifieer dat `</body>` en `</html>` nog aanwezig zijn. Vervanging van `</body>` die mislukt (bijv. omdat de tag al weg was) laat het bestand afgeknot achter. Check: `python3 -c "open('file.html').read()" | grep -c "</body>"`.

### Sed werkt niet betrouwbaar op HTML met speciale tekens

Bulk-vervangingen in HTML via `sed` falen zodra de te vervangen string HTML-entiteiten, aanhalingstekens of schuine strepen bevat. Gebruik altijd Python met `str.replace()` of `re.sub()` voor HTML-bewerkingen.

### Cardmarket SKU-verwarring via web search

Web search-samenvattingen rommelen regelmatig SKU-varianten door elkaar. Voor Prismatic Evolutions bestaat bv. een gewone ETB én een Pokemon Center ETB met andere inhoud en heel andere prijzen (~€152 30d avg vs ~€475 30d avg). Een samenvatting kan deze cijfers vermengen of aan het verkeerde product hangen. **Hard geleerd in mei 2026**: nooit een prijs uit een web search-samenvatting overnemen voor news-content. Vraag Mick om een screenshot, of gebruik de Chrome-extension om de exacte productpagina te lezen.

### Pokemon set release vs. aanvullend product

Een Pokemon-set heeft één hoofd-release-datum, maar daarna verschijnen vaak nog losse aanvullende producten (Booster Bundles, Premium Collections, Mega ex Boxes). Web search-samenvattingen presenteren soms een "release datum" die naar zo'n aanvullend product verwijst, niet naar de hoofdrelease. Voorbeeld: Mega Evolution Ascended Heroes **hoofdset** = 30 januari 2026, **Booster Bundle** van diezelfde set = 24 april 2026. **Hard geleerd**: bij elke datum dubbelchecken of het de hoofdrelease is of een aanvullend product. Bulbapedia en het officiele Pokemon TCG product calendar zijn betrouwbaarder dan secundaire bronnen.

### Nooit set-namen of release-datums fabriceren

Bij het schrijven van news-content is het cruciaal dat alle set-namen, release-datums en kaart-reveals **verifieerbaar zijn**. Verifieer elke set en datum bij de bronnen hieronder voordat je iets opschrijft.

**Correctie (4 juli 2026): Pitch Black is WEL echt.** De mei-juni sessie markeerde "Mega Evolution Pitch Black" (17 juli 2026, Mega Darkrai ex / Zeraora ex / Chandelure ex) als volledig verzonnen met "zero resultaten." Dat was een verkeerde inschatting, waarschijnlijk een mislukte zoekopdracht. Pitch Black heeft een eigen Bulbapedia-pagina, is in april 2026 officieel onthuld (PokeBeach, PokeGuardian) en is de vijfde hoofdset van de Mega Evolution-serie, gebaseerd op de Japanse Abyss Eye. **Les blijft staan: nooit fabriceren.** Maar de tegenles is minstens zo belangrijk: een "zero resultaten"-conclusie kan ook een zoekfout zijn. Zoek gericht op Bulbapedia (pagina `[Setnaam] (TCG)`) en check de Japanse tegenhanger voor je iets als verzonnen afschrijft.

**Vaste verificatieroute voor TCG-nieuws:**
- **PokeGuardian** (pokeguardian.com) — snelste voor Engels-talige TCG-nieuws en set-aankondigingen
- **Bulbapedia** — gezaghebbend voor bevestigde sets, kaartlijsten en release-datums
- **officiele Pokemon TCG-kanalen** (pokemon.com/en/pokemon-tcg) — definitief voor aankondigingen
- Als iets op géén van deze drie te vinden is, bestaat het niet.

### Afbeeldingen in news-articles

Bulbagarden Archives (`archives.bulbagarden.net`) is de beste bron voor kaartscans en productafbeeldingen. Licentie: CC BY-NC-SA 2.5. Mick heeft bevestigd dat het copyright-risico voor educatieve fan-sites acceptabel is (The Pokémon Company handhaaft niet actief tegen educatieve fan-content).

Direct media-URL ophalen: navigeer naar `archives.bulbagarden.net/wiki/File:[bestandsnaam]`, dan via `mcp__Claude_in_Chrome__find` met query "Full resolution image link href" de directe URL ophalen (formaat: `https://archives.bulbagarden.net/media/upload/[hash]/[bestandsnaam]`).

CSS voor figuren in articles (al aanwezig in news-articles):
- `.article-figure` — enkel staand kaartje met caption
- `.figure-row` — meerdere kaarten naast elkaar (flex, wraps op mobile)
- Altijd `loading="lazy"` op de `<img>`, altijd een `<figcaption>` met "Bron: Bulbagarden Archives (CC BY-NC-SA 2.5)"

### Em-dashes na replace_all

Replace_all met emdash → middot strip soms de spatie weg. Patroon ` — ` (space-emdash-space) wordt ` ·` (space-middot-no-space) als old/new strings van de Edit-tool ongelijk gespatieerd zijn. **Always**: na zo'n bulk vervang, grep voor het nieuwe karakter en check op ontbrekende spaties.

## SEO-structuur

Elke module-pagina heeft:

1. **Meta tags**: `description`, `keywords`, `author`, `robots=index,follow,max-image-preview:large`.
2. **Open Graph & Twitter cards** met `og:image`, `og:type=article`.
3. **Canonical link** naar `https://startmetpokemon.nl/module-N-slug.html`.
4. **JSON-LD `LearningResource`** met `keywords`, `about` (entities met `sameAs` naar Wikipedia), `teaches` (array van leerdoelen), `audience`, `isPartOf` verwijzing naar `#course`.
5. **JSON-LD `BreadcrumbList`** met 3 items: home → cursus → module.
6. **Interne links** tussen modules (prev/next via closing cards) én naar de homepage via de nav.

Homepage heeft een `Course` schema die naar alle 6 modules linkt via `hasPart`. Organisatie-schema staat los (`#organization`).

News-articles in `/nieuws/` hebben een afwijkende JSON-LD structuur: **`Article`** schema (niet LearningResource), met `datePublished`, `dateModified`, `headline`, `description`, `keywords`, `author` en `publisher`. BreadcrumbList voor news: home → nieuws → article. Het overzicht (`/nieuws/`) heeft een **`CollectionPage`** schema met `isPartOf` verwijzing naar de site.

**Evergreen SEO-artikelen** (in pillar-folders zoals `/waarde/`) gebruiken een eigen structuur:
1. **Gedeeld stylesheet**: `<link rel="stylesheet" href="/assets/evergreen.css">` (geen inline styles).
2. **Extensieloze URLs**: canonical is bijv. `https://startmetpokemon.nl/waarde/pokemon-kaarten-verkopen` (geen `.html`).
3. **JSON-LD**: `Article` + `BreadcrumbList` + `FAQPage` (3 schemas per artikel). BreadcrumbList: home → pillar-hub → artikel.
4. **Answer-block**: kort antwoord (40-55 woorden) direct onder de H1 voor featured snippets (`<div class="answer-block">`).
5. **TOC**: inhoudsopgave met anchor-links naar H2-secties.
6. **FAQ accordion**: 3 vragen onderaan met expand/collapse, gekoppeld aan FAQPage schema.
7. **Hub-pagina**: elke pillar heeft een `index.html` met `CollectionPage` schema en hub-cards naar artikelen.
8. **Interne links**: naar andere artikelen in dezelfde pillar, naar de hub, en naar relevante modules.

Sitemap en robots.txt staan in de root. Robots staat op `Allow: /` met alleen `/_werkdocumenten/` disallowed.

## File layout

```
startmetpokemon/
├── index.html                              # homepage, bevat Course schema + signup-form
├── over.html
├── contact.html
├── bedankt.html                            # bedank-pagina contactformulier
├── bedankt-nieuwsbrief.html                # bedank-pagina nieuwsbrief (single opt-in copy)
├── disclaimer.html
├── privacyverklaring.html
├── module-1-waarom-pokemon-investeren.html
├── module-2-grading-en-conditie.html
├── module-3-sets-en-sealed-product.html
├── module-4-singles-strategie.html
├── module-5-marktplaatsen-en-tools.html
├── module-6-je-eerste-investering.html
├── faq.html                                # FAQ-pagina, 15 vragen accordion, FAQPage JSON-LD
├── 404.html
├── assets/
│   └── evergreen.css                       # gedeeld stylesheet voor alle evergreen SEO-artikelen
├── waarde/                                 # content-pillar: waarde bepalen & verkopen
│   ├── index.html                          # hub-pagina, CollectionPage schema
│   ├── wat-zijn-mijn-pokemon-kaarten-waard.html  # A1: waardebepaling stappenplan
│   └── pokemon-kaarten-verkopen.html       # A3: verkoopkanalen vergelijking
├── nieuws/                                 # maandelijkse marktupdates (sinds mei 2026)
│   ├── index.html                          # nieuws-overzichtspagina, CollectionPage schema
│   ├── marktupdate-april-2026.html         # editie 1 (gepubliceerd 1 mei 2026)
│   └── marktupdate-mei-juni-2026.html      # editie 2 (gecombineerd, gepubliceerd 30 juni 2026)
├── downloads/
│   └── Start-Met-Pokemon-30-dagen-plan.pdf # lead-magnet PDF (12 pagina's, ~99 KB)
├── watchlist.json                          # maandelijkse watchlist-prijzen voor homepage-ticker (alleen geverifieerd bijwerken)
├── sitemap.xml
├── robots.txt
├── cookie-consent.js                       # GA4 loader + consent
├── wrangler.jsonc                          # Cloudflare Pages config
├── NIEUWSBRIEF-SETUP.md                    # MailerLite setup notities
├── favicon*.{svg,png,ico}
├── apple-touch-icon.png
├── og-image.png
└── CLAUDE.md                               # dit bestand
```

Styling voor modules en news staat per file inline in `<style>` blocks (self-contained voor deploy-eenvoud). **Evergreen SEO-artikelen** (in pillar-folders zoals `/waarde/`) gebruiken een gedeeld stylesheet: `/assets/evergreen.css` (677 regels, 15KB). Dit bevat alle design tokens, nav, hero, prose, lede, answer-block, article-h2/h3, data-inset, article-table, disclaimer, sources, signup-inline, FAQ accordion, TOC, figures, closing cards, footer, hub-grid, en responsive breakpoints op 640px.

De PDF generator (`build_pdf.py`, ReportLab) staat **buiten de repo**, in Mick's Cowork-workspace bij Claude — niet in de site-repo zelf. Output kopiëren naar `downloads/` voordat hij commit.

## Hosting & deploy

- **GitHub repo**: `startmetopties-creator/startmetpokemon` (let op: niet `besselinkmick`). Default branch: `main`. Account: `startmetopties@gmail.com`.
- **Hosting**: Cloudflare Pages, auto-deploy on push naar `main`. Eerste deploy duurt ~1 minuut.
- **Domein**: `startmetpokemon.nl`, DNS via Cloudflare. Custom domain hangt aan de Pages-app.
- **Werkflow**: Claude wijzigt files in Cowork-workspace + committeert via GitHub upload UI in Chrome → Cloudflare deployt automatisch (~1 min). Cowork-workspace is **geen git-repo**, dus geen `git status` mogelijk vanuit Claude. Verifiëren of een wijziging live is gaat via Chrome (extension): navigate naar `raw.githubusercontent.com/startmetopties-creator/startmetpokemon/main/[pad]` of check `startmetpokemon.nl/...` direct.

## Lead magnet — nieuwsbrief funnel

De volledige funnel: signup-form op site → MailerLite → welkom-mail met PDF-download-link.

### MailerLite-setup

- **Account ID**: `2292529`
- **Form ID**: `185701082791413504` (let op: dit is de **echte ID**, niet de slug `uSib3M` die in MailerLite's URL staat — die slug werkt NIET als form-action.)
- **Form-action URL** (gebruikt in alle 7 HTML-files):
  ```
  https://assets.mailerlite.com/jsonp/2292529/forms/185701082791413504/subscribe
  ```
- **Group**: "Lead magnet — 30 dagen plan" (subscribers landen hier).
- **Automation**: "Welkom — 30-dagen plan PDF" (ID `185701476567352635`). Trigger: completes form. Stap 1: Email "Welkomstmail 30 dagen plan" (ID `185728685241796194`).
- **Sender**: `nieuwsbrief@startmetpokemon.nl`, naam `StartMetPokemon`. Subject: `Hier is je 30-dagen Pokémon-plan` (geen emoji).
- **Email-content type**: Custom HTML (geen drag-and-drop builder). Editen via Email 1 → "Edit content" → Ace code editor.
- **Double opt-in**: **UIT** (single opt-in). Subscribers krijgen de welkom-mail direct.
- **PDF-link in welkom-mail**: `https://startmetpokemon.nl/downloads/Start-Met-Pokemon-30-dagen-plan.pdf`. PDF is een download-link, **geen attachment** (attachments triggeren Gmail-spam).

### Domein-authenticatie

- SPF: pass (MailerLite TXT record toegevoegd)
- DKIM: valid (selector via MailerLite)
- DMARC: toegevoegd in Cloudflare DNS: `TXT _dmarc → v=DMARC1; p=none; rua=mailto:besselinkmick@gmail.com`.

### Spam-deliverability

Test via [mail-tester.com](https://www.mail-tester.com): genereer een uniek `test-xxxx@srv1.mail-tester.com` adres → schrijf via de live signup-form daarmee in (NIET via MailerLite's "Send test", want die vereist verified recipients) → wacht 4–5 min → "Then check your score". Score zonder DMARC: 8.5/10. Met DMARC verwacht ~9.5/10. De -0.5 voor "1 image zonder alt" komt door MailerLite's onzichtbare open-tracking-pixel — niet praktisch op te lossen zonder open-tracking uit te zetten.

### Frontend-integratie (op alle 7 HTML-files)

Custom JS hijackt het MailerLite-form-submit, post via `fetch(..., {mode: 'no-cors'})` naar de form-action URL, en toont meteen de inline success-state (`.signup-success` op index/module-6, `.signup-inline-success` op module 1-5):

```js
fetch(form.action, { method: 'POST', body: fd, mode: 'no-cors' })
  .finally(function() {
    showSuccess(form, email);
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'newsletter_signup', { method: 'mailerlite' });
    }
  });
```

`mode: 'no-cors'` betekent dat we het response niet kunnen lezen (CORS-block) — `.finally` toont altijd de success-state, ongeacht of MailerLite OK of foutmelding teruggeeft. De daadwerkelijke validatie gebeurt server-side bij MailerLite.

`bedankt-nieuwsbrief.html` is de fallback voor JS-disabled gebruikers (form action redirect). Copy gaat uit van single opt-in: "Inschrijving bevestigd / Check je inbox / Het 30-dagen plan is verzonden naar je e-mailadres".

## Nieuws & marktupdates

De `/nieuws/` sectie bevat maandelijkse marktupdates voor Pokemon-investeerders. Doel: SEO-fresh content + lead-gen via signup-form. Eerste editie gepubliceerd op 1 mei 2026 (recap van april).

### Cadens en file naming

- 1 editie per maand, gepubliceerd in de eerste werkdag van de maand
- Behandelt de maand die net is afgesloten (dus 1 juni → "Marktupdate mei 2026")
- URL-pattern: `nieuws/marktupdate-{maand}-{jaar}.html` (bv. `marktupdate-april-2026.html`)
- Sitemap-entry per editie, changefreq=monthly, priority=0.8
- `/nieuws/` zelf in sitemap met changefreq=weekly, priority=0.9

### Content-workflow

Mick stuurt eens per maand via chat:
- 2 a 4 Cardmarket-screenshots van SKUs die er voor hem uitspringen (sealed of singles)
- 1 of 2 Collectr-screenshots (top movers, specifieke kaart, portefeuille-stand)
- Een paar zinnen "dit valt me op"

Claude bouwt het artikel rond die data. **Alle prijsclaims moeten verifieerbaar zijn**: ofwel uit Mick's screenshot, ofwel via de Chrome-extension. Web search-samenvattingen voor prijzen zijn taboe (zie Valkuilen). Voor release-datums, set-aankondigingen en officiele announcements werkt web search wel.

### Article-structuur (lichter dan modules)

- Hero met ghost number, eyebrow ("Marktupdate · {maand} {jaar}"), h1, deck
- Lede paragraaf met drop cap, hooks alle hoofdstories direct
- Kort aside "Over deze editie" met data-bronnen + peildatum
- 3-4 inline `<h2 class="article-h2">` secties (geen genummerde section-intro)
- Sectie "Wat we in {volgende maand} in de gaten houden" als afsluitend blok
- Disclaimer (`aside warn`)
- Sources block (`.sources` class) met links naar bronnen
- Signup-form (`signup-inline` class)
- Closing cards: prev = `/nieuws/` overzicht, next = relevante module
- Lengte: 500-700 woorden

### Tone-of-voice (afwijkend van modules)

Modules zijn formeler en didactischer. News is conversationaler:

- **Lede moet hooks bevatten**, niet "soms gebeurt er weinig en dat is het verhaal" (wekt geen interesse). Hint alle drie de stories in de eerste alinea zodat de lezer weet wat eraan komt.
- **Personal angles werken**: "een fan van Bulbasaur en een fan van Rowlet zijn allebei even fanatiek"
- **Praktisch advies past goed**: "wie geen haast heeft koopt eind {maand} vrijwel altijd beter"
- **Vermijd jargon**: geen "bifurcatie", "store of value", "population dilution", "asking prices", "secundaire markt"
- **Gebruik wel**: "houdt z'n waarde", "blijft sterk", "in de gaten houden", "iets om te checken"
- **Concrete prijzen ALLEEN met inline bron-attributie**: "30-day average van €112 op Cardmarket" met sources block onderaan
- **EUR boven USD**: prijzen in euro's voor Nederlandse lezers, USD alleen als de bron daarin is
- **Niet US-centric**: TCGPlayer/Pokemon Center US zijn voor de meeste lezers irrelevant. Cardmarket, Catawiki, TCGFanz en Marktplaats zijn de relevante platforms.

### Eerder geleerde fout

Eerste mock-up gebruikte een Cardmarket-prijs uit een web search summary die de verkeerde SKU-variant te pakken had: €475 voor Prismatic Evolutions, terwijl de gewone ETB op €152 30d avg ligt. Mick spotte de fout via een eigen screenshot. **Sindsdien**: nooit een prijs uit een web search summary, altijd verifieerbare bron.

### Homepage-integratie

- Nav: "Nieuws"-link tussen Modules en Over (vervangt de oude "Waarom Pokémon?" #waarom anchor)
- Footer: "Nieuws"-link tussen Home en Privacy
- News-pagina's hebben een eenvoudige sticky nav (zoals modules), geen hamburger-menu

## PDF pipeline (build_pdf.py)

De lead-magnet PDF wordt gegenereerd door `build_pdf.py` (ReportLab, ~1361 regels) in Cowork's outputs-folder. Build → preview → review → kopieer naar `startmetpokemon/downloads/`.

### Pagina-geometrie

- A4: `PW=595.27pt`, `PH=841.89pt`
- Margins: `MARGIN_X=22mm` (links/rechts), `MARGIN_T/B=24mm` (boven/onder)
- 12 pagina's: cover (p01) → welkom (p02) → 4 weken (p03–06) → checklist print-out (p09) → platforms / rode vlaggen / closing.

### Design-systeem in PDF

Zelfde editorial dark theme als de site: `#0A0E17` bg, `#FACC15` accent, DM Serif Display + Figtree. Cover heeft het lightning + ster logo (handgetekend in ReportLab paths). Chapter headings centered, eyebrow + serif title.

### PDF-valkuilen

- **ReportLab subscript/superscript**: nooit unicode `₀₁₂` of `⁰¹²` gebruiken — rendert als zwarte blokjes. Gebruik `<sub>` en `<super>` tags in Paragraph.
- **Verticale balans**: per-pagina padding/leading is fragiel. Bij content-aanpassingen op p09 (checklist) gemakkelijk de vuistregel-callout wegvallen onderaan. Hard geleerde compressie-waarden: `pad_bottom 18→9`, `q_lead 14.5→14`, `h_lead 13→12.5`, `tip y_box: score_y-26`.
- **Edit tool truncation**: bij grote rewrites kapt het Edit-tool soms de file-tail af. Altijd verifiëren dat `build()` als laatste regel staat (ná `if __name__ == "__main__":`).
- **Geen "Mick" in de PDF**: bewust geanonimiseerd — Mick wil het document neutraal houden ("we" / "Start Met Pokémon" i.p.v. persoonlijke referenties).

### Output-flow

`python3 build_pdf.py` → `Start-Met-Pokemon-30-dagen-plan.pdf` in `outputs/`. Daarna kopiëren naar `Pokemon 101/startmetpokemon/downloads/`. Mick pusht naar GitHub. Live na ~1 min op `https://startmetpokemon.nl/downloads/Start-Met-Pokemon-30-dagen-plan.pdf`. **Belangrijk**: filename moet exact gelijk blijven — de welkom-mail link is hardcoded.

### Eerder geleerde fout

PDF stond ooit dubbel in repo: `/Start-Met-Pokemon-30-dagen-plan.pdf` (root) én `/downloads/Start-Met-Pokemon-30-dagen-plan.pdf`. Live URL serveerde de oude versie omdat Mick per ongeluk in de root pushte. Fix: PDF hoort **alleen** in `/downloads/` — duplicate in root weghalen voorkomt SEO-verwarring en oude versies.

## Huidige staat (5 juli 2026)

**Af (deze sessie, 5 juli 2026): homepage-herontwerp**
- **Homepage geherpositioneerd**: hero richt zich op het platform (gidsen + cursus + maandelijkse marktupdate), primaire CTA naar #signup. Nieuwe sectie `#gidsen` met 6 pillar-cards (waarde, grading, sets, kopen, investeren, nieuws). De 6-module-lijst is vervangen door een compacte cursus-kaart (`#cursus`, alle 6 module-links behouden voor SEO). Anchor `id="modules"` blijft bestaan (27 pagina's linken naar `/#modules`). Nav: Gidsen/Cursus/Nieuws/Over/FAQ + Nieuwsbrief-knop. Footer uitgebreid met pijler-links. Meta/OG-descriptions bijgewerkt. Homepage-lastmod in sitemap: 2026-07-05.
- **Light mode**: toggle in de nav (zon/maan), `[data-theme="light"]`-tokens, voorkeur in localStorage, anti-flash script in de head. Goud als tekstkleur via `--accent-ink` (#FACC15 dark / #854D0E light) voor contrast; knop-achtergronden blijven #FACC15 met vaste donkere tekst #0A0E17. Alleen homepage; modules/nieuws/evergreen hebben nog geen light mode.
- **Watchlist-ticker**: fictieve prijzen en de onware "Live marktdata"-claim verwijderd. Ticker + hero-kaart tonen geverifieerde data uit **`/watchlist.json`** (repo-root), geladen via JS met statische fallback in de HTML. Gestart met 2 geverifieerde prijzen (Prismatic Evolutions ETB EUR 168,87 en Booster Bundle EUR 80,68; Cardmarket 30d avg, peildatum 4 juli). **Maandritueel: bij elke marktupdate ook watchlist.json bijwerken** (peildatum, peildatum_kort, update_url, prijzen, verandering t.o.v. vorige peiling). Doel: uitbouwen naar 6-8 vaste SKU's.
- **Quick fixes**: "Vier redenen" gecorrigeerd naar drie, emoji-iconen vervangen door inline SVG line-icons in huisstijl.
- **Feedbackronde 2 (5 juli)**: watchlist uitgebreid naar 7 items met door Mick aangeleverde prijzen (Charizard EX EUR 361, Pikachu with Grey Felt Hat EUR 850, Lugia V EUR 471, Moonbreon PSA 10 EUR 3.850, 151 ETB EUR 550 + de 2 Prismatic-prijzen). Ticker-label is "Watchlist" zonder datum; hero-kaart zegt "Maandelijks geverifieerd" i.p.v. Cardmarket-bronclaim (bronnen zijn nu gemengd). Nav-kopje "Cursus" hernoemd naar "Leren" (sectie-kop "De basis in zes stappen", niet cursus-verkoperig). Nieuw: Uitgelicht-sectie (3 echte artikelen), community-sectie met "Join de community"-knop (href tijdelijk #signup, TODO-comment in HTML: vervangen door Discord-invite zodra de server bestaat), float-labels + glow op de hero-kaart, artikel-tellers op de gidsen-kaarten, scroll-reveal-animaties (met prefers-reduced-motion-respect). Gidsen-tellers ("5 gidsen" etc.) meegroeien bij nieuwe artikelen!
- **Feedbackronde 3 (5 juli, CTA-hiërarchie)**: Mick vond drie gestapelde aanbiedingen onderaan (community/leren/nieuwsbrief) te veel. Opgelost: signup-sectie omgevormd tot "Join de community" (nieuwsbrief = de community zolang Discord er niet is; PDF is welkomstcadeau) en omhoog verplaatst naar direct na Uitgelicht. Losse community-kaart en de dubbele cursus-CTA-sectie onderaan verwijderd. Nieuwe paginavolgorde: hero, proof, gidsen, uitgelicht, community(+signup), waarom, leren, footer. Hero-CTA en nav-knop ("Word lid") wijzen naar #community; anchor #signup blijft bestaan binnen die sectie. Quick wins: ::selection in goud, :focus-visible-outline, soepele kleurtransitie bij themawissel, meta theme-color die meewisselt met het thema.
- **Valkuil bevestigd**: de Edit-tool kapte index.html tweemaal af op hetzelfde punt bij grote writes; hersteld via Python-append. Bij grote wijzigingen aan index.html: Python gebruiken en altijd `</body></html>` verifieren.

## Eerdere staat (4 juli 2026)

**Af (deze sessie — 4 juli 2026):**
- **Canonical-fix geverifieerd op live site**: alle canonicals zijn extensieloos en matchen de definitieve URL, `.html`-varianten redirecten door naar extensieloos, sitemap bevat 18 URLs allemaal zonder `.html`, en geen `.html` meer in interne links of JSON-LD. De site-brede fix van 3 juli is dus compleet en correct. Het "Kritiek"-blok in het SEO-plan (sectie 1) over de canonical-mismatch is hiermee achterhaald.
- **Favicon-inconsistentie gefixt**: 4 nieuwere pagina's (`/waarde/` hub, A1, A3, marktupdate mei-juni) verwezen naar `/favicon.png`, dat een 404 gaf. Vervangen door de werkende varianten (`favicon-32x32.png` + `favicon-192x192.png`), gelijk aan de homepage. Ook het evergreen-template (`_template-evergreen.html`, buiten de repo) aangepast zodat nieuwe artikelen het meteen goed hebben. Beide fixes gecommit via GitHub upload UI en live geverifieerd.
- **Search Console opgeschoond en indexering aangevraagd**: `/sitemap.xlm` typo verwijderd, `/sitemap.xml` opnieuw ingediend (herlezen na canonical-fix), en indexering aangevraagd voor de 3 nieuwe pagina's (`/waarde/`, A1, A3). Snapshot indexeringsrapport (data t/m 30-06, dus vóór de fix): 6 geindexeerd, 5 niet — allemaal canonical/redirect-gerelateerd, lossen op na hercrawl. GSC = URL-prefix property onder startmetopties@gmail.com (zie Tools-sectie).

**Af (sinds vorige update — 3 juli 2026):**
- **SEO content-pillar "Waarde" opgezet**: volledige pillar-structuur met hub-pagina (`/waarde/`) en twee artikelen.
- **Evergreen template-infrastructuur gebouwd**: gedeeld stylesheet `/assets/evergreen.css`, herbruikbaar HTML-patroon met Article + BreadcrumbList + FAQPage JSON-LD, answer-block voor featured snippets, TOC, FAQ accordion, disclaimer, sources, signup-inline.
- **A1 artikel gepubliceerd**: "Wat zijn mijn Pokemon-kaarten waard?" (`/waarde/wat-zijn-mijn-pokemon-kaarten-waard`). Stappenplan waardebepaling via Cardmarket, trendprijzen, conditiebeoordeling.
- **A3 artikel gepubliceerd**: "Pokemon-kaarten verkopen: alle kanalen vergeleken" (`/waarde/pokemon-kaarten-verkopen`). Vergelijking Cardmarket (~6-8% all-in), Marktplaats, Catawiki (12.5% seller + 9% buyer), eBay (13-14%), opkopers (30-60% marktwaarde).
- **Hub-pagina live**: `/waarde/` met CollectionPage schema, twee hub-cards, nieuwsbrief-signup.
- **Sitemap bijgewerkt**: 3 nieuwe URLs (waarde/, A1, A3) toegevoegd.
- Alle bovenstaande files gecommit naar GitHub via upload UI.

**Eerder af (cumulatief):**
- 6 modules volledig opgebouwd in editorial style.
- 2 nieuws-edities: april 2026, mei-juni 2026 (gecombineerd). Nieuws-hub actief.
- Lead magnet PDF (12 pagina's) in `/downloads/`.
- MailerLite funnel end-to-end (signup → welkom-mail met PDF-link, single opt-in).
- DMARC/SPF/DKIM groen. GA4 actief met intern IP gefilterd.
- FAQ-pagina (15 vragen, accordion, FAQPage JSON-LD).
- Hamburger-menu op homepage (mobile, breekpunt 900px).

**Open punten:**
- **Search Console indexering**: nieuwe pagina's (waarde/, A1, A3) + sitemap ingediend op 4 juli. Over ~1-2 weken checken of ze daadwerkelijk geindexeerd zijn (en of de 5 canonical/redirect-meldingen zijn opgelost na hercrawl).
- **Volgende SEO-artikelen**: B1 en D1 staan in het plan voor juli 2026 (doel: 4 artikelen totaal).
- **Homepage-nav naar /waarde/**: toevoegen bij 3+ artikelen (plan). Nu 2 artikelen, dus bijna zover.
- **Volgende news-editie**: begin augustus 2026 (recap juli). Mick stuurt Cardmarket-screenshots + observaties.
- **30th Celebration (release 16 september 2026)**: volgende editie kan pre-release prijsontwikkeling volgen.
- **Bing Webmaster Tools**: opgezet 4 juli 2026 via import uit GSC (property + sitemap overgenomen). Onder account startmetopties@gmail.com. Voedt ook ChatGPT-zoekresultaten.
- **Module-files truncation bug**: OPGELOST (4 juli 2026). Alle 6 modules waren middenin de signup-handler afgekapt; script hersteld en `</body></html>` toegevoegd, JS gevalideerd. Meteen pijler-links (Nieuws/Waarde/Kopen) aan de module-footers toegevoegd.
- **Em-dashes in module-bodies**: de 6 module-files bevatten nog 27 tot 61 em-dashes (—) per file in de publieke tekst, in strijd met de stijlregel. Nog niet opgeschoond want het is een grote, risicovolle bulk-vervanging (zie valkuil "Em-dashes na replace_all"). Zorgvuldig apart oppakken: na vervanging grepen op ontbrekende spaties.
- **SEO-impact meting**: na 4-6 weken checken welke queries trekken.

## Tone-of-voice voor content

Als je ooit tekst schrijft/herschrijft voor een module:

- **Nederlandstalig, direct, zonder verkoperig.** Geen "Ontdek het ongelooflijke geheim…".
- **Eerlijk over risico's.** Dit is geen hype-site. Mick benadrukt bewust dat dit geen gegarandeerd rendement oplevert.
- **Concreet.** Noem bedragen, sets, platforms. Geen vage "doe je onderzoek" zonder hoe.
- **Zorgvuldig met beweringen.** Markten bewegen; cijfers graag dateren ("begin 2026 verkocht een PSA 10 Base Set Charizard voor ~$XXX").

Voor news-content (`/nieuws/`) gelden afwijkende regels: lichter, conversationaler, minder didactisch. Zie de aparte sectie "Nieuws & marktupdates" hierboven voor specifieke do's en don'ts.

## Wat te doen bij een nieuwe sessie

1. **Lees dit bestand volledig** — niet alleen de "Wat is dit project" sectie. De werkafspraken, valkuilen en hosting-info zijn essentieel.
2. **Vraag of de huidige state nog klopt** (kort: "is alles in CLAUDE.md nog actueel of moet ik 'm bijwerken?"). Update aan het einde van de sessie als er iets is veranderd.
3. **Vraag wat de taak is** — bij grote taken (nieuwe module, grote refactor, nieuw funnel-onderdeel) suggereer een verse chat i.p.v. doorgaan in een lange bestaande sessie.
4. **Voor design-werk**: volg het systeem hierboven (kleuren, typografie, hairlines, ghost numbers). Wijk er alleen van af als Mick daar expliciet om vraagt.
5. **Voor copy**: volg de tone-of-voice (Nederlands, direct, eerlijk over risico's, geen verkoperij).
6. **Voor verifiëren of iets live staat**: vraag of de Chrome-extension verbonden is. Bash en web_fetch werken niet tegen `startmetpokemon.nl`.
7. **Klaar**: rapporteer kort. Mick committeert zelf — push niets via GitHub-UI namens hem.

### Welke files Claude meestal aanpast

| Soort taak | Files |
|---|---|
| Module-content of design-tweak | `module-N-*.html` (één of meerdere) |
| Homepage | `index.html` |
| Signup/funnel copy | `index.html`, `module-1` t/m `module-6.html` (alle 7), `bedankt-nieuwsbrief.html`, `nieuws/*.html` |
| News-editie schrijven | `nieuws/marktupdate-{maand}-{jaar}.html` (nieuw) + `nieuws/index.html` (article-card update) + `sitemap.xml` (entry toevoegen) |
| Evergreen SEO-artikel | `waarde/{slug}.html` (nieuw, linkt `/assets/evergreen.css`) + `waarde/index.html` (hub-card toevoegen) + `sitemap.xml` (entry toevoegen). JSON-LD: Article + BreadcrumbList + FAQPage. |
| PDF aanpassing | `build_pdf.py` (in Cowork outputs/) → kopieer output naar `startmetpokemon/downloads/` |
| MailerLite-config | direct via Chrome-extension in `dashboard.mailerlite.com` |
| SEO/sitemap | `sitemap.xml` (lastmod), eventueel JSON-LD blocks in module-pagina's |

### Anti-patronen om te vermijden

- **Niet "ik ben klaar" zeggen voordat je geverifieerd hebt** dat de wijziging echt op de juiste plek staat. Mick is geverbrand door PDF-die-in-root-stond-i.p.v.-downloads/. Na een GitHub-commit: check de commit history van het bestand via `github.com/startmetopties-creator/startmetpokemon/commits/main/[pad]`.
- **Niet zelf experimenteel UI-clicken in MailerLite/Cloudflare** zonder reden. Geef Mick een instructie en laat hem het doen, tenzij hij vraagt om mee te kijken via Chrome.
- **Niet doorgaan met dezelfde aanpak als Mick zegt "werkt nog steeds niet"**. Stop, vraag om een screenshot of console-output, en diagnose voordat je opnieuw probeert.
- **Niet "ik kan niet bij dit systeem" als eerste reactie**. Eerst checken: is er een Chrome-tab open? Kan Mick de extension activeren? Is er een ander pad?
- **Geen set-namen of release-datums in news-articles zonder verificatie.** Altijd controleren via PokeGuardian, Bulbapedia, of officiele Pokemon-kanalen. Als het er niet op staat, bestaat het niet — schrijf het dan ook niet op.
- **GitHub web editor (CM6) niet gebruiken.** Clipboard-paste mislukt in Chrome "read"-tier. Altijd de upload-UI (`/upload/main/[folder]`) gebruiken voor file-updates — dit werkt zowel voor **nieuwe files** als voor **bestaande files overschrijven** (upload met dezelfde filename vervangt het bestand).
