# SEO- en Trafficplan — startmetpokemon.nl

Werkdocument, aangemaakt 2 juli 2026. Upload dit bestand in een nieuwe Claude-sessie samen met CLAUDE.md. CLAUDE.md bevat de werkafspraken, valkuilen en technische setup; dit document bevat de SEO-strategie, de content-backlog en de traffic-plannen. Bij conflict wint CLAUDE.md op werkafspraken en verificatieregels.

Statusvelden in dit document ([ ] / [x] en de Status-kolommen) worden bijgewerkt tijdens sessies, zodat dit document de actuele stand blijft weergeven.

---

## 1. Doel en KPI's

Hoofddoel: van vrijwel nul organisch verkeer naar een zichtbaar, groeiend platform, met de nieuwsbrief als kern-asset. De site is het net, de lijst is de vangst.

### KPI's per kwartaal (referentie: juli 2026 = start)

| Moment | Organische sessies/mnd | Nieuwsbrief-subscribers | Geindexeerde pagina's | Verwijzende domeinen |
|---|---|---|---|---|
| Start (jul 2026) | ~0 | laag | ~15 | ~0 |
| Q1 (okt 2026) | 300-1.000 | +100 | 35+ | 5+ |
| Q2 (jan 2027) | 1.000-3.000 | +300 | 55+ | 15+ |
| Q3 (apr 2027) | 3.000-8.000 | +600 | 70+ | 25+ |
| Q4 (jul 2027) | 5.000-15.000 | 1.000+ | 80+ | 40+ |

Dit zijn richtwaarden, geen garanties. De cijfers links van het bereik zijn het "oke"-scenario, rechts het goede scenario.

### Beslismoment (afgesproken met Mick)

Na 6-9 maanden consistent uitvoeren: als organisch verkeer onder de 1.000 sessies/maand blijft EN de lijst niet groeit, dan verbreden (heel TCG of verzamelen als asset-klasse) of stoppen. Dit is een bewust kill-criterium, geen falen.

### Meetsetup (week 1, hoogste prioriteit)

- [x] Google Search Console koppelen, sitemap.xml indienen (bleek al gedaan; gecontroleerd 2 jul 2026)
- [x] Indexeringsstatus controleren in GSC (gedaan 2 jul 2026, opnieuw 4 jul 2026, zie bevindingen hieronder)
- [x] Sitemap opnieuw indienen na canonical-fix (4 jul 2026: `/sitemap.xml` herindiend; Google leest hem opnieuw) + indexering aangevraagd voor de 3 nieuwe pagina's (`/waarde/`, A1, A3) via URL-inspectie
- [x] Bing Webmaster Tools: geimporteerd vanuit GSC (4 jul 2026). Property + sitemap overgenomen; sitemap "Processing", data binnen ~48u. Onder account startmetopties@gmail.com.
- [ ] GA4-events: `newsletter_signup` is geconfigureerd maar nog nooit gemeten (geen signups in data); na canonical-fix testen met een echte inschrijving. Toevoegen: outbound affiliate-klik
- [ ] Maandritueel vastleggen: eerste werkdag van de maand GSC + GA4 bekijken (kan samen met de marktupdate-sessie)

### Bevindingen GSC/GA4-check (2 juli 2026)

**Kritiek, eerst fixen voor er nieuwe content komt:**

- [x] **Canonical/redirect-mismatch site-breed.** OPGELOST (fix 3 juli, geverifieerd op de live site 4 juli). Alle canonicals staan extensieloos en matchen de definitieve URL, `.html`-varianten redirecten door naar extensieloos, sitemap bevat 18 URLs allemaal zonder `.html`, en geen `.html` meer in interne links of JSON-LD. Resteert alleen nog de GSC-actie: sitemap opnieuw indienen + URL-inspectie/indexering aanvragen voor de kernpagina's (zie meetsetup). *Oorspronkelijke bevinding (2 juli): Cloudflare Pages stuurde elke `.html`-URL met een redirect door naar de extensieloze variant, terwijl alle canonicals, sitemap-entries en interne links naar `.html` wezen; gevolg in GSC was "Fout met omleiding" en slechts 6 geindexeerde pagina's.*
- [x] `/sitemap.xlm` (typefout-inzending, status "Kan niet ophalen") verwijderd uit GSC > Sitemaps (4 jul 2026).

**Ter info, geen actie nodig:**

- "Alternatieve pagina met correcte canonieke tag" (3x, o.a. /contact) en "Pagina met omleiding" (/index.html): normaal gedrag, lost zichzelf op na de canonical-fix.
- GA4 werkt: 8 sessies afgelopen 7 dagen, events komen binnen (page_view, scroll, session_start, click). Waarschuwing in GA4-home betreft alleen ontbrekende benchmarkdata, onschuldig.
- Sitemap laatst gelezen 19 april; na de fix en herindiening leest Google hem opnieuw.

---

## 2. Zoekwoord- en contentstrategie

### Uitgangspunten

1. De modules zijn het conversiepunt, niet de landingspagina. Evergreen hulppagina's vangen het zoekverkeer en leiden door naar cursus en nieuwsbrief.
2. Zoekvolumes zijn nog niet gevalideerd met tooldata. Prioriteiten hieronder zijn gebaseerd op concurrentie-analyse en logica. Na 3 maanden GSC-data worden prioriteiten herijkt op basis van echte impressies.
3. Elke pagina beantwoordt de hoofdvraag in de eerste alinea in 40-55 woorden (featured snippet en AI-citatie). Daarna de diepgang.
4. Alle prijsclaims volgens de verificatieregels in CLAUDE.md (geen prijzen uit web search-samenvattingen).
5. Tempo: 2 artikelen per week. Consistentie boven alles.

### URL-structuur (nieuw, vastleggen voor het eerste artikel)

Mapjes per pijler, naar analogie van /nieuws/:

```
/waarde/     -> waarde bepalen en verkopen
/grading/    -> alles over grading
/sets/       -> setgidsen en productuitleg
/kopen/      -> veilig kopen, kalender, bescherming
/nieuws/     -> bestaand
```

Elke map krijgt een hubpagina (index.html) met CollectionPage-schema die naar alle onderliggende artikelen linkt, zoals /nieuws/ nu werkt. Hubs komen in de hoofdnav zodra ze 3+ artikelen bevatten.

### Content-backlog

Prioriteit: P1 = eerst doen (hoog verwacht volume of strategisch), P2 = daarna, P3 = als de rest staat. Status: leeg = niet gestart, WIP, LIVE.

#### Pijler A: Waarde en verkopen (/waarde/)

| # | Artikel (werk-URL) | Zoekintentie / termen | Prio | Status |
|---|---|---|---|---|
| A1 | wat-zijn-mijn-pokemon-kaarten-waard.html | "pokemon kaarten waarde", stappenplan met Cardmarket-uitleg | P1 | LIVE |
| A2 | oude-pokemon-kaarten-waarde.html | "oude pokemon kaarten waarde", zolderdozen 1999-2003, WotC-era | P1 | GESCHREVEN (4 jul, wacht op commit) |
| A3 | pokemon-kaarten-verkopen.html | "pokemon kaarten verkopen", alle kanalen vergeleken: Cardmarket, Marktplaats, Catawiki, eBay, opkopers. Affiliate-kansen (Catawiki, eBay) | P1 | LIVE |
| A4 | duurste-pokemon-kaarten.html | "duurste pokemon kaart", listicle, linkbait, jaarlijks updaten | P1 | GESCHREVEN (4 jul, wacht op commit; Illustrator-record feb 2026 verwerkt) |
| A5 | eerste-editie-herkennen.html | "pokemon kaart eerste editie", 1st edition stempel, shadowless | P1 | GESCHREVEN (4 jul, wacht op commit) |
| A6 | zeldzaamheid-symbolen.html | "pokemon kaart zeldzaamheid", rarity-symbolen uitgelegd per era | P2 | |
| A7 | cardmarket-verkopen-gids.html | how-to: account, prijszetting, verzending, betaling | P2 | |
| A8 | marktplaats-verkopen-tips.html | veilig verkopen op Marktplaats, scam-preventie | P2 | |
| A9 | catawiki-gids.html | hoe werkt Catawiki voor kaarten, kosten, wanneer wel/niet | P2 | |
| A10 | opkopers-eerlijk-bekeken.html | wat bieden opkopers echt vs zelf verkopen (eerlijk, onafhankelijk stuk, onderscheidend) | P2 | |
| A11 | japans-vs-engels-waarde.html | waardeverschillen, waarom Japans soms goedkoper | P3 | |
| A12 | verzameling-taxeren-erfenis.html | complete verzameling taxeren (erfenis/zolder), longtail maar hoge intentie | P3 | |

#### Pijler B: Grading (/grading/)

| # | Artikel | Zoekintentie / termen | Prio | Status |
|---|---|---|---|---|
| B1 | psa-grading-kosten-nederland.html | "psa grading kosten", "pokemon kaarten laten graden", NL-dealers en tarieven vergeleken | P1 | GESCHREVEN (4 jul, wacht op commit; incl. PSA Europe Frankfurt) |
| B2 | is-graden-de-moeite-waard.html | rekenvoorbeeld: kaartwaarde vs gradingkosten, beslisboom. Uniek stuk, later interactieve tool | P1 | GESCHREVEN (4 jul, wacht op commit) |
| B3 | psa-vs-cgc-vs-bgs.html | vergelijking graders, wat kiest de NL-markt | P2 | |
| B4 | kaart-klaarmaken-voor-grading.html | centering checken, whitening, verzending | P2 | |
| B5 | psa-10-vs-psa-9.html | prijsverschil uitgelegd met voorbeelden (verifieerbare prijzen) | P2 | |
| B6 | population-report-lezen.html | pop reports uitgelegd, waarom pop belangrijk is | P3 | |
| B7 | grading-fouten-en-scams.html | resealed slabs, nep-slabs herkennen | P3 | |

#### Pijler C: Sets en producten (/sets/)

Vast setgids-template: release-info, inhoud, chase cards, sealed-prijsverloop (geverifieerd), oordeel. Schaalbaar: 1 template, veel pagina's.

| # | Artikel | Opmerking | Prio | Status |
|---|---|---|---|---|
| C1 | 30th-celebration.html | HUB voor het jubileum. Voor half augustus 2026 live i.v.m. release 16 september. Doorlopend bijwerken | P1 | |
| C2 | prismatic-evolutions.html | bekende set met veel zoekvraag, prijzen al deels in eigen marktupdates gedocumenteerd | P1 | GESCHREVEN (4 jul, wacht op commit; prijzen live van Cardmarket-productpagina's gelezen) |
| C3 | etb-vs-booster-box-vs-bundle.html | welk sealed product past bij welk doel; verwijst naar module 3 | P1 | GESCHREVEN (4 jul, wacht op commit) |
| C4 | pokemon-151.html | evergreen populaire set | P2 | |
| C5 | evolving-skies.html | moderne klassieker, hoge zoekvraag | P2 | |
| C6 | mega-evolution-serie.html | lopende serie, release-datums al geverifieerd voor nieuws | P2 | |
| C7 | crown-zenith.html | special set | P3 | |
| C8 | surging-sparks.html | setgids | P3 | |
| C9 | vintage-sets-overzicht.html | WotC-era overzicht (Base, Jungle, Fossil, ...) | P3 | |
| C10 | japanse-sets-kopen.html | waar en waarom Japans sealed | P3 | |

Daarna uitbreiden: elke nieuwe set krijgt standaard een gids bij aankondiging (synergie met nieuws-workflow).

#### Pijler D: Veilig kopen (/kopen/)

| # | Artikel | Zoekintentie / termen | Prio | Status |
|---|---|---|---|---|
| D1 | release-kalender.html | "pokemon releases 2026". DOORLOPEND bijgewerkt. Belangrijkste linkbait-pagina van de site. Verificatie via PokeGuardian/Bulbapedia gebeurt toch al maandelijks | P1 | LIVE (4 jul, incl. /kopen/ hub) |
| D2 | nep-pokemon-kaarten-herkennen.html | "nep pokemon kaarten", hoog volume, evergreen, foto-voorbeelden (Bulbagarden-licentieregels volgen) | P1 | LIVE (4 jul; nog zonder foto's) |
| D3 | waar-pokemon-kaarten-kopen.html | eerlijke vergelijking NL-verkooppunten; onafhankelijkheid is het onderscheidend vermogen | P1 | GESCHREVEN (4 jul, wacht op commit) |
| D4 | adviesprijzen-msrp-gids.html | wat is een normale prijs per producttype; uniek NL-datapunt, tabel doorlopend bijwerken | P2 | |
| D5 | kaarten-bewaren-en-beschermen.html | sleeves, toploaders, binders, vocht/licht. Enige plek waar bol-affiliate (accessoires 4%) zinvol is | P2 | |
| D6 | resealed-boxen-herkennen.html | loose packs, gewicht, seals | P2 | |
| D7 | pre-order-wel-of-niet.html | pre-orderstrategie, koppelt aan marktupdates | P3 | |
| D8 | pokemon-center-europa.html | bestellen bij Pokemon Center EU, restocks, waarom PC-producten anders geprijsd zijn (SKU-valkuil uit CLAUDE.md verwerken) | P3 | |

#### Pijler E: Investeren-verdieping (koppelt aan modules)

| # | Artikel | Opmerking | Prio | Status |
|---|---|---|---|---|
| E1 | risicos-van-pokemon-investeren.html | het eerlijke stuk dat niemand anders schrijft; E-E-A-T-anker, linkbait voor beleggingsmedia | P1 | GESCHREVEN (4 jul, wacht op commit; nieuwe pijler /investeren/ met hub) |
| E2 | sealed-vs-singles.html | rendementsverschillen, verwijst naar modules 3 en 4 | P2 | |
| E3 | reprint-risico.html | wat reprints doen met prijzen, cases | P2 | |
| E4 | portfolio-bijhouden.html | Collectr en alternatieven, hoe je rendement meet | P2 | |
| E5 | pokemon-vs-andere-tcg.html | One Piece, Lorcana, MTG als vergelijking | P3 | |
| E6 | exit-strategie.html | wanneer en hoe verkopen, koppelt aan pijler A | P3 | |
| E7 | verzameling-en-belasting.html | box 3 basics, uitdrukkelijk met disclaimer, geen advies | P3 | |

#### Nieuws (bestaand ritme, uitbreiden met events)

- Maandelijkse marktupdate: bestaand ritme aanhouden (eerste werkdag van de maand).
- Event-stukken toevoegen bij: grote aankondigingen, release-week 30th Celebration (16 september 2026), opvallende prijsschokken, grote reprints. Event-stukken ranken snel omdat concurrentie traag is.
- Watchlist formaliseren (open punt in CLAUDE.md): 5-10 vaste SKU's die elke maand terugkomen. Na 12 maanden is die tijdreeks zelf een linkbait-asset ("een jaar sealed-prijzen in Nederland").

### Artikel-productieproces (per Claude-sessie)

1. Mick kiest 1-2 artikelen uit de backlog en stuurt eventueel screenshots (prijzen) mee.
2. Claude schrijft volgens het evergreen-template (sectie 4), tone-of-voice uit CLAUDE.md (nieuws-toon, niet module-toon: licht, conversationeel, geen jargon).
3. Verificatie: release-datums en setfeiten via PokeGuardian/Bulbapedia; prijzen alleen uit screenshots of Chrome-extension.
4. Lengte-richtlijn: hulppagina's 800-1.500 woorden, setgidsen 600-1.000, listicles mogen langer. Antwoord op de hoofdvraag altijd in de eerste alinea.
5. Interne links: minimaal 3 per artikel (hub, gerelateerd artikel, relevante module). Signup-inline form altijd aanwezig.
6. Sitemap-entry + hub-update in dezelfde commit. Status in dit document bijwerken naar LIVE.

---

## 3. Autoriteit en linkbuilding

Nieuwe domeinen ranken traag zonder verwijzende domeinen. Doel: 5+ in Q1, 40+ na een jaar. Alles hieronder is wit; geen gekochte links, geen linkfarms.

### Linkbait-assets (pagina's die links verdienen)

1. **Release-kalender (D1)**: fora, Discords en blogs linken naar actuele kalenders. Belangrijkste asset.
2. **Maandelijkse marktupdate**: uniek NL-datapunt. Elke editie kort pitchen (zie outreach hieronder).
3. **Statistiekenpagina** (bouwen in Q2): veilingrecords, grootste stijgers/dalers van het jaar, PSA-populatiecijfers. Journalisten citeren cijferpagina's.
4. **Risico-artikel (E1)**: beleggingsmedia linken graag naar kritische stukken als tegenwicht.
5. **Watchlist-tijdreeks** (na 12 maanden data).

### Outreach-doelen (concreet)

| Doelwit | Aanpak | Wanneer |
|---|---|---|
| De Jonge Belegger, BeleggerUitlegger en vergelijkbare NL-beleggingsblogs | Gastartikel aanbieden of hun bestaande (oppervlakkige) Pokemon-stukken aanvullen met bronvermelding | Q1 |
| Financiele media met verzamel-rubrieken (RTL Z-achtig, BNR, regionale kranten bij jubileum-hype) | Marktupdate als persbericht-mailtje bij 30th anniversary; "Nederlands platform volgt Pokemon-markt maandelijks" | Aug-sep 2026 (jubileum = nieuwshaak) |
| TCG-verenigingen, speltwinkel-linkpagina's, startpagina-achtigen | Vriendelijk verzoek tot vermelding als educatieve bron | Doorlopend |
| Podcasts/YouTube over beleggen of verzamelen (NL) | Aanbieden als gast over "Pokemon als alternatieve asset" (kan anoniem/onder platformnaam lastig zijn; afweging persoonlijke zichtbaarheid ligt bij Mick) | Q2 |
| Wikipedia/Bulbapedia externe links | Alleen waar echt passend, niet forceren | Later |

Outreach-mails: kort, concreet, geen massamail. Claude schrijft per doelwit een maatwerk-mailtje (via de writing-style van Mick als die beschikbaar is).

### Communities (traffic + links + content-ideeen)

Regel: eerst maandenlang oprecht nuttig zijn, dan pas af en toe linken. Accounts die alleen linken worden geband en beschadigen het merk.

- Reddit: r/PokemonNL, r/pokemontcg (NL-vragen), r/pkmntcgcollections
- Discord: grote NL TCG-servers (inventariseren in Q1)
- Fora: FOK!, Tweakers (verzamel-topics), Marktplaats-community
- Facebook-groepen: NL Pokemon verzamelaars-groepen (groot en actief, vaak vergeten kanaal)

---

## 4. Website-aanpassingen (setup-verbeteringen)

### Direct (voor het eerste evergreen-artikel)

- [x] **Gedeeld stylesheet voor evergreen**: `/assets/evergreen.css` (677 regels, 15KB). Gebouwd en live sinds 3 juli 2026.
- [x] **Evergreen artikel-template**: hero, ghost number, eyebrow, lede, answer-block, TOC, article-h2's, data-inset, article-table, sources, signup-inline, FAQ accordion + FAQPage-schema, closing cards. Gebouwd en gebruikt door A1 en A3.
- [x] **Hubpagina-template**: CollectionPage-schema, hub-cards. Live op `/waarde/`.
- [x] **URL-conventie vastgelegd**: mapjes per pijler, extensieloze URLs.
- [ ] **Author-entiteit**: consistente `author` in Article-schema (redactienaam "Redactie Start Met Pokemon" met eigen beschrijving op de over-pagina; anoniem blijft mogelijk, entiteit-consistentie is wat telt).

### Kort daarna (Q1)

- [ ] Hoofdnav uitbreiden met hubs zodra ze 3+ artikelen hebben (denk aan hamburger-menu breekpunt 900px en de CSS-cascade-valkuil uit CLAUDE.md)
- [~] Footer uitbreiden met pijler-links (4 jul: gedaan op de 6 module-footers, Nieuws/Waarde/Kopen. Nog te doen: homepage-footer en evergreen-footers gelijktrekken)
- [ ] Zichtbare breadcrumbs op artikelen (JSON-LD bestaat al, visueel maken)
- [ ] Inhoudsopgave-blok bij artikelen langer dan ~1.200 woorden (anchors, helpt sitelinks)
- [ ] "Gerelateerde artikelen"-blok (3 handmatige links) onder elk artikel
- [ ] OG-image-template per pijler (nu 1 generieke og-image.png)
- [ ] 404-pagina: links naar hubs + signup-form
- [ ] RSS-feed voor /nieuws/ (distributie + sommige aggregators = gratis verkeer)

### Later (Q2+)

- [ ] Interactieve grading-rekentool ("loont graden bij deze kaartwaarde?") als uitbreiding van B2; tools ranken en worden gedeeld
- [ ] Statistiekenpagina (zie linkbuilding)
- [ ] llms.txt overwegen en controleren dat robots.txt AI-crawlers niet blokkeert (AI-zoekmachines zijn een groeiend verkeerskanaal; heldere antwoordblokken zijn hiervoor de belangrijkste factor)
- [ ] Search Console-data als vast onderdeel van de maandsessie: welke queries krijgen impressies zonder kliks (= titel/meta verbeteren), welke pagina's hangen op positie 8-20 (= uitbreiden en interne links geven)

---

## 5. Nieuwsbrief als groeimotor

De lijst is het eigenlijke product. Elke traffic-actie eindigt bij het signup-form.

- [ ] **Content upgrades per pijler** (Q1-Q2): naast het 30-dagen plan een tweede leadmagnet, bijvoorbeeld "Grading-checklist" (1 A4, PDF-pipeline bestaat al) op grading-artikelen en "Verkoop-checklist" op waarde-artikelen. Pijler-specifieke magnets converteren beter dan generieke.
- [ ] **Welkomstserie uitbreiden** (MailerLite): na de 30-dagen-plan-mail 2-3 vervolgmails (beste artikelen, uitnodiging community). Verhoogt betrokkenheid en opent het sponsorpad later.
- [ ] **Vast nieuwsbrief-ritme**: maandelijkse mail bij elke marktupdate (bestaat de facto al via de automation; formaliseren als vaste verzending naar de hele lijst).
- [ ] **Doorsturen stimuleren**: onderaan elke mail 1 regel "doorgestuurd gekregen? schrijf je hier in". Simpel en gratis.
- Later: referral-mechanisme pas overwegen bij 1.000+ subscribers (MailerLite heeft hier geen sterke native oplossing voor; niet nu bouwen).

---

## 6. PokeVesting: de community

Het idee: een Nederlandstalige community voor Pokemon-investeerders, gekoppeld aan de site en de nieuwsbrief. Strategisch klopt het: een community maakt van lezers leden, levert een doorlopende stroom echte vragen (= content-ideeen met gegarandeerde zoekintentie), en is later de basis voor premium.

### Naam en merk

"PokeVesting" kan als community-naam onder de paraplu van Start Met Pokemon ("PokeVesting, de community van Start Met Pokemon"). Aandachtspunten: geen apart commercieel merk ervan maken zolang het IP-profiel laag moet blijven (zie eerdere afspraak: educatief profiel, niet handelen onder Pokemon-namen), en de naam niet registreren als merk of los domein met winkel-ambities. Als community-naam binnen Discord: prima. Alternatief als het neutraler moet: "De Watchlist" of "Start Met Pokemon Community".

### Platformkeuze

| Optie | Kosten | Voordeel | Nadeel |
|---|---|---|---|
| **Discord (advies fase 1)** | Gratis | Doelgroep zit er al, drempel laag, rijke bots/integraties (RSS-feed van /nieuws/ automatisch in een kanaal) | Vluchtig, geen SEO-waarde, notificatie-moeheid |
| Skool / Circle | ~$99/mnd | Betaald-tier ingebouwd, rustiger, cursus-integratie | Kosten voor er leden zijn, drempel hoger, NL-doelgroep minder gewend |
| Eigen forum (Discourse) | Hosting + beheer | UGC is indexeerbaar (SEO-waarde) | Veel beheer, spam, dood forum is zichtbaar dood |

Advies: start met Discord zodra de nieuwsbrief ~300-500 subscribers heeft. Een lege community is schadelijker dan geen community; de lijst is de vijver waaruit je de eerste leden vist. Migratie naar Skool/Circle pas overwegen als er een premium-tier komt (fase 3 van het monetization-plan).

### Kanaalstructuur (Discord, startversie klein houden)

```
INFO
  #welkom-en-regels      (regels, verificatie-drempel tegen spam)
  #introducties
  #nieuws-feed           (automatisch: RSS van /nieuws/ + release-alerts)
MARKT
  #marktpraat            (algemeen)
  #watchlist             (de maandelijkse watchlist, discussie per SKU)
  #grading-hulp          (foto posten, community + redactie kijken mee)
COMMUNITY
  #pulls-en-aanwinsten
  #vraag-het-de-redactie (vragen die maandelijks in de nieuwsbrief/artikelen beantwoord worden)
```

Bewust NIET bij de start: een verkoop/ruil-kanaal. Handel tussen leden = scam-risico en moderatielast; pas toevoegen bij een gevestigde community met vertrouwde leden, met strakke regels (eigen risico, geen namaak, bewijs van verzending).

### Regels (kern)

1. Geen financieel advies; iedereen beslist zelf (consistent met de site-disclaimer).
2. Geen scalping-promotie of pump-gedrag rond specifieke kaarten.
3. Geen namaak, geen resealed, geen twijfelgevallen.
4. Respectvol; beginners zijn welkom (dat is de doelgroep van de site).

### Groeiloop (waarom de community SEO versterkt)

Nieuwsbrief brengt leden -> leden stellen echte vragen -> vragen worden artikelen (met gegarandeerde zoekintentie) -> artikelen brengen zoekverkeer -> zoekverkeer wordt nieuwsbrief. Elke vraag in #vraag-het-de-redactie is een gratis content-briefing. Vragen die 2x gesteld worden gaan direct de backlog in (sectie 2).

### Rituelen (community's leven op ritme)

- Maandelijkse watchlist-drop, gelijktijdig met de marktupdate (site + mail + Discord op dezelfde dag = het maandelijkse "event").
- Release-day threads bij elke grote set (eerste pulls, prijzen, ervaringen).
- Kwartaal-thread "hoe staat je portfolio ervoor" (koppelt aan artikel E4).

### Launch-plan

- [ ] Fase 0 (nu): niets bouwen; eerst lijst laten groeien naar ~300-500
- [ ] Fase 1 (soft launch): server opzetten, 15-25 "founding members" persoonlijk uitnodigen uit de nieuwsbrief (meest betrokken lezers: opens/clicks in MailerLite), 2 weken warmdraaien
- [ ] Fase 2 (open): aankondigen in nieuwsbrief + vaste vermelding op site (nav/footer + blok onder artikelen)
- [ ] Fase 3 (later): premium overwegen zodra er 500+ actieve leden zijn, conform het monetization-rapport

### Eerlijke risico-inschatting

Moderatie kost structureel tijd (reken op 2-4 uur/week extra zodra het loopt). Een community die stilvalt oogt slechter dan geen community. Daarom: pas starten bij voldoende lijst, klein beginnen, en de rituelen zijn belangrijker dan het aantal kanalen.

---

## 7. Overige traffic-kanalen (naast SEO)

Beoordeeld op moeite vs verwachte opbrengst voor deze site:

| Kanaal | Oordeel | Actie |
|---|---|---|
| **AI-zoekmachines (ChatGPT, Perplexity, Google AI)** | Groeiend; NL-bronnen over deze niche zijn schaars, dus citatiekans is hoog | Antwoordblokken bovenaan artikelen (zit in template), Bing-indexatie (voedt ChatGPT), heldere bronvermelding |
| **Google Discover** | Kan nieuws-verkeer geven zonder zoekopdracht | Sterke og-images per artikel, entiteit-consistentie; komt vanzelf mee met de andere verbeteringen |
| **Reddit/fora/Facebook-groepen** | Direct verkeer + merkbekendheid | Zie sectie 3, communities |
| **YouTube / TikTok** | Grootste kanaal in de niche, maar hoge productielast en vraagt zichtbaarheid die botst met anonieme opzet | Niet nu. Heroverwegen in 2027; eventueel faceless shorts (marktupdate in 60 sec) als experiment |
| **Pinterest** | Werkt voor sommige verzamel-niches, NL-bereik beperkt | Overslaan |
| **Podcast-gastoptredens** | Goed voor autoriteit en links | Q2, zie outreach |
| **Betaald verkeer (ads)** | Economisch onzinnig zonder eigen betaald product | Overslaan tot fase 3 |

---

## 8. Twaalfmaandenkalender

| Maand | Focus |
|---|---|
| **Jul 2026** | Meetsetup (sectie 1). Template + evergreen.css bouwen. Eerste 4 artikelen: A1, A3, B1, D1 (release-kalender) |
| **Aug 2026** | C1 (30th Celebration-hub) VOOR half augustus. 6-8 artikelen (rest P1). Marktupdate juli. Eerste outreach jubileum-persbericht |
| **Sep 2026** | Release-week 30th Celebration: event-coverage + hub bijwerken. Marktupdate aug. P1 afronden, P2 starten |
| **Okt 2026** | Eerste GSC-review (3 mnd data): prioriteiten herijken. Hubs in nav. Tempo 2/week vasthouden |
| **Nov 2026** | P2-artikelen. Tweede leadmagnet (grading-checklist). Outreach beleggingsblogs |
| **Dec 2026** | Cadeau-seizoen: D3/D4/D5 promoten (kopen-pijler piekt). Jaaroverzicht-artikel (linkbait): "de Pokemon-markt in 2026" |
| **Jan 2027** | Q2-evaluatie tegen KPI-tabel. Statistiekenpagina bouwen. Bij 1.000+ sessies: Mediavine Journey aanvragen |
| **Feb 2027** | Community soft launch (als lijst 300-500+). P2 afronden |
| **Mrt 2027** | Community open. Grading-rekentool bouwen. Podcast-outreach |
| **Apr 2027** | Q3-evaluatie. Eerste betaald product ontwikkelen (conform monetization-rapport) |
| **Mei 2027** | Productlancering via lijst. P3-artikelen |
| **Jun 2027** | Jaarevaluatie tegen beslismoment (sectie 1): doorgaan, verbreden of stoppen. Watchlist-tijdreeks publiceren (12 mnd data) |

---

## 9. Hoe dit document te gebruiken in Claude-sessies

1. Nieuwe sessie: upload CLAUDE.md + dit bestand. Zeg welk onderdeel je wilt oppakken ("schrijf A3" of "bouw het evergreen-template").
2. Claude werkt de statusvelden bij (backlog-status, checkboxes) en levert het bijgewerkte document terug aan het einde van sessies waarin iets is afgerond.
3. Maandsessie (combineren met de marktupdate-sessie): Mick stuurt GSC/GA4-screenshots, Claude analyseert, herijkt prioriteiten in de backlog en noteert de cijfers in de KPI-tabel.
4. Bij elk nieuw artikel gelden de verificatie- en tone-of-voice-regels uit CLAUDE.md onverkort.
5. Dit document mag groeien: nieuwe artikel-ideeen (bijvoorbeeld uit #vraag-het-de-redactie) worden onderaan de betreffende pijler-tabel toegevoegd met een prioriteit.

## Logboek

| Datum | Wijziging |
|---|---|
| 2026-07-02 | Document aangemaakt |
| 2026-07-02 | GSC/GA4-check uitgevoerd via Chrome; bevindingen toegevoegd aan sectie 1. Belangrijkste actie: site-brede canonical-fix (.html -> extensieloos) |
| 2026-07-03 | Canonical-fix site-breed doorgevoerd. Evergreen template + CSS gebouwd. A1 en A3 geschreven en gepubliceerd. Hub /waarde/ live. Sitemap bijgewerkt. Sectie 4 checkboxes bijgewerkt. |
| 2026-07-04 | Canonical-fix geverifieerd op live site (alles extensieloos, 18 sitemap-URLs, geen .html in links/JSON-LD): compleet en correct. Favicon-inconsistentie gefixt op 4 pagina's (waarde-hub, A1, A3, marktupdate mei-juni) + evergreen-template: `/favicon.png` (404) vervangen door bestaande 32x32 + 192x192 varianten. Gecommit en live geverifieerd. |
| 2026-07-04 | D1 gebouwd en live: nieuwe pijler `/kopen/` met hub + release-kalender 2026 (geverifieerd bij Bulbapedia/PokeBeach/PokeGuardian). Sitemap bijgewerkt (20 URLs). Indexering aangevraagd voor `/kopen/release-kalender` en `/kopen/`. Belangrijk: CLAUDE.md-valkuil over "Pitch Black = verzonnen" gecorrigeerd; die set is wel echt (5e Mega Evolution-hoofdset, 17 jul 2026). |
| 2026-07-04 | D2 gebouwd en live: `/kopen/nep-pokemon-kaarten-herkennen` (praktische zelf-tests, PSA cert-check erbij; bronnen JustInBasil + TCGplayer). Hub 2 kaarten, sitemap 21 URLs, indexering aangevraagd. Technische winst: module-truncatie-bug in alle 6 modules gefixt (afgekapte signup-handler hersteld) en module-footers voorzien van pijler-links (Nieuws/Waarde/Kopen). |
| 2026-07-04 | GSC-sessie: `/sitemap.xlm` typo verwijderd, `/sitemap.xml` opnieuw ingediend (herlezen na canonical-fix), indexering aangevraagd voor `/waarde/`, A1 en A3. Indexeringsrapport (data t/m 30-06, dus van vóór de fix): 6 geindexeerd, 5 niet (3x alternatieve canonical, 1x fout met omleiding, 1x pagina met omleiding — allemaal canonical/redirect-gerelateerd, lossen op na hercrawl). GSC-property = URL-prefix `https://startmetpokemon.nl/` (GEEN domein-property, dus NIET `sc-domain:`), onder account startmetopties@gmail.com. |
| 2026-07-04 | P1-CONTENTBLITZ (avondsessie): alle 9 resterende P1-artikelen geschreven. A2, A4, A5 (waarde), B1+B2 met nieuwe pijler `/grading/` incl. hub, C2+C3 met nieuwe pijler `/sets/` incl. hub, D3 (kopen), E1 met nieuwe pijler `/investeren/` incl. hub. Hub-cards toegevoegd aan /waarde/ (3) en /kopen/ (1). Sitemap: 20 -> 32 URLs. Alles gevalideerd (JSON-LD, canonicals extensieloos, interne links, geen em-dashes, files compleet). Verificatie-highlights: Pikachu Illustrator-record $16,49M (feb 2026, Guinness/CNN) in A4; PSA Europe Frankfurt-opening zomer 2026 (PSA-announcement) in B1; C2-prijzen live van Cardmarket-productpagina's gelezen via Chrome-extension (ETB 30d avg EUR 168,87; Booster Bundle EUR 80,68). NOG TE DOEN: commit naar GitHub (12 nieuwe files + sitemap.xml + waarde/index + kopen/index + dit plan), daarna indexering aanvragen in GSC voor de 12 nieuwe URLs. Ook open: hoofdnav uitbreiden met hubs (waarde heeft nu 5, kopen 3 artikelen: drempel gehaald) — apart oppakken i.v.m. hamburger/CSS-valkuil. |
