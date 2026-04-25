# Nieuwsbrief & Lead Magnet — Setup

Korte gids om de signup-formulieren live te krijgen.
Code, copy en PDF zijn klaar — er moet alleen nog een MailerLite-account
gekoppeld worden.

---

## Wat er al klaar staat

| Onderdeel | Bestand | Status |
|---|---|---|
| PDF (10 pagina's) | `downloads/Start-Met-Pokemon-30-dagen-plan.pdf` | klaar |
| Prominente signup | `index.html`, `module-6-je-eerste-investering.html` | klaar |
| Inline signup | `module-1-...html` t/m `module-5-...html` | klaar |
| Bedankt-pagina | `bedankt-nieuwsbrief.html` | klaar |
| Privacyverklaring | `privacyverklaring.html` | bijgewerkt met MailerLite & nieuwsbrief-data |

---

## Stap 1 — Maak een MailerLite-account

1. Ga naar <https://www.mailerlite.com> en maak een gratis account aan
   (tot 1.000 abonnees + 12.000 mails/maand gratis).
2. Verifieer je verzend-domein. Het simpelst:
   - Bij Cloudflare DNS van `startmetpokemon.nl`: voeg de DKIM/SPF
     TXT-records toe die MailerLite je geeft (Settings → Domains).
   - Verifieer in MailerLite dat de records aankomen.
3. Stel een afzender in (bijv. `hoi@startmetpokemon.nl` of
   `nieuwsbrief@startmetpokemon.nl`).

---

## Stap 2 — Maak een Embedded Form

1. MailerLite → **Sites & forms** → **Forms** → **Create new form**.
2. Type: **Embedded form**.
3. Naam: `Lead magnet — 30 dagen plan`.
4. Subscriber group: maak nieuwe groep `Lead magnet — 30 dagen plan`
   (handig voor segmentatie later).
5. Skip de visual builder; we gebruiken alleen het embed-snippet.
6. Bij **Form settings → Thank-you page**, kies **Custom URL** en vul in:
   ```
   https://startmetpokemon.nl/bedankt-nieuwsbrief.html
   ```
   (Dit is alleen voor bezoekers met JavaScript uit; standaard vangt
   onze JS de submit op met een inline succes-state.)
7. Sla op en publish.

---

## Stap 3 — Pak `ACCOUNT_ID` en `FORM_ID` uit het embed-snippet

In het embed-snippet zie je een form-action zoals:

```html
<form action="https://assets.mailerlite.com/jsonp/12345678/forms/87654321/subscribe" ...>
```

- **ACCOUNT_ID** = `12345678` (eerste nummer)
- **FORM_ID** = `87654321` (tweede nummer)

---

## Stap 4 — Vul de IDs in alle pagina's in

In de project-folder, doe een **find-and-replace** (alle .html files):

| Vervang | Door |
|---|---|
| `ACCOUNT_ID` | jouw account-id |
| `FORM_ID` | jouw form-id |

Vanaf de command line in de project-folder:

```bash
# Op macOS / Linux:
sed -i '' 's/ACCOUNT_ID/12345678/g; s/FORM_ID/87654321/g' *.html

# Op Windows (PowerShell):
Get-ChildItem *.html | ForEach-Object {
  (Get-Content $_) -replace 'ACCOUNT_ID','12345678' -replace 'FORM_ID','87654321' | Set-Content $_
}
```

> Doe deze stap pas vlak voor de live-deploy. Op die manier kan je de
> placeholders nog gebruiken voor lokaal testen zonder per ongeluk
> echte inschrijvingen op te slaan.

---

## Stap 5 — Maak de welkomst-automation in MailerLite

1. MailerLite → **Automations** → **Create new automation**.
2. Naam: `Welkom — 30-dagen plan PDF`.
3. **Trigger**: *When subscriber joins a group* → selecteer
   `Lead magnet — 30 dagen plan`.
4. **Step 1**: Email
   - **Subject**: `Hier is je 30-dagen plan (PDF)`
   - **From name**: Start Met Pokémon
   - **Inhoud**: kort, persoonlijk, geen marketing-overkill.
     Voeg een **directe link** toe naar:
     ```
     https://startmetpokemon.nl/downloads/Start-Met-Pokemon-30-dagen-plan.pdf
     ```
   - Optioneel: voeg de PDF ook als bijlage toe (max 10 MB op MailerLite —
     onze PDF is ±75 KB, dus prima).
5. **Step 2** (optioneel, na 5 dagen): Email — kort vragen of het plan
   helder was, en doorverwijzen naar Module 1.
6. Activeer de automation.

---

## Stap 6 — Test end-to-end

1. Open `index.html` op de live site.
2. Vul een test-emailadres in en submit.
3. Verwacht:
   - Je ziet de groene succes-state in plaats van het formulier.
   - Binnen ±1 minuut komt de welkomst-mail met PDF-link binnen.
4. Check ook op:
   - **Module 6** (prominente versie, na de afgerond-banner)
   - **Module 1 t/m 5** (inline versie, vóór de "terugbladeren"-blokken)

---

## Tips voor conversie (later)

- **A/B-test de eyebrow**: `Gratis download · 10 pagina's` vs.
  `Gratis · printbare PDF`.
- **Kijk in MailerLite welke pagina** de hoogste conversie heeft.
  De prominente versie op de homepage zal naar verwachting de
  meeste signups leveren; module-6 vangt mensen die de hele cursus af hebben.
- **GA4 event**: bij elke succesvolle submit fired de JS een
  `newsletter_signup`-event (alleen als de bezoeker analytics heeft
  geaccepteerd). Maak in GA4 een conversie-doel aan voor dit event.

---

## Wat er nog beter kan (optioneel)

- **Confirmed opt-in (double opt-in) inschakelen** in MailerLite voor
  extra AVG-zekerheid. Standaard staat 'ie uit; aan-zetten betekent
  iets minder signups, maar een schonere lijst.
- **CTA in de welkomst-mail** naar Module 1, met UTM-tag zodat je in
  GA4 kunt zien hoeveel mensen via de mail terugkomen.
- **Footer-signup** toevoegen op alle overige pagina's (over, contact,
  disclaimer) — kan met dezelfde inline component.
