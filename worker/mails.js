// Welkomstmails. Overgenomen uit de MailerLite-automation "Welkom per bron".
// {{AFMELDEN}} wordt per ontvanger vervangen door een persoonlijke afmeldlink.

// Zelfde routering als in MailerLite: eerste match wint.
export function kiesVariant(bron) {
  const b = String(bron || '').toLowerCase();
  if (b.includes('setlijst')) return 'afvinklijst';
  if (b.includes('beurzen')) return 'beurzen';
  if (['/sets/', 'release-kalender', 'cadeau', 'adventskalender'].some((s) => b.includes(s))) return 'releases';
  return 'plan30';
}

export function welkomMail(bron, afmeldLink) {
  const variant = kiesVariant(bron);
  const mail = MAILS[variant];
  return {
    variant,
    subject: mail.subject,
    html: mail.html.split('{{AFMELDEN}}').join(escAttr(afmeldLink)),
  };
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

const A = 'style="color:#8a5a00;"';
const KNOP = 'style="display:inline-block;background:#1f1f1f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:15px;"';
const P = 'style="margin:0 0 16px;"';
const H2 = 'style="margin:26px 0 8px;font-family:Georgia,serif;font-size:20px;font-weight:normal;"';

function licht({ titel, preheader, eyebrow, inhoud }) {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titel}</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ee;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;">
<tr><td style="padding:32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1f1f1f;">
<p style="margin:0 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a7a5c;">${eyebrow}</p>
<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:26px;line-height:1.25;font-weight:normal;">${titel}</h1>
${inhoud}
<p style="margin:0 0 4px;">Groet,</p>
<p style="margin:0 0 24px;">Team Start Met Pokémon</p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#7a7a7a;">Geen beleggingsadvies. Deze mail is informatief bedoeld. Je krijgt hem omdat je je hebt ingeschreven op startmetpokemon.nl. We mailen alleen af en toe. <a href="{{AFMELDEN}}" style="color:#7a7a7a;">Uitschrijven</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const MAILS = {
  afvinklijst: {
    subject: 'Je afvinklijst staat klaar',
    html: licht({
      titel: 'Je afvinklijst staat klaar',
      preheader: 'De download van je lijst, plus een paar tips voor het bijhouden van je set.',
      eyebrow: 'Afvinklijst',
      inhoud: `<p ${P}>Hoi,</p>
<p ${P}>Bedankt voor je aanmelding. Via de knop hieronder kies je je set en download je de afvinklijst. Je kunt hem printen of gewoon op je tablet of telefoon gebruiken.</p>
<p style="margin:0 0 22px;"><a href="https://startmetpokemon.nl/downloads/setlijsten/" ${KNOP}>Naar je afvinklijst</a></p>
<h2 ${H2}>Zo houd je het overzicht</h2>
<p ${P}>Begin met de kaarten die je al hebt en vink ze per nummer af. Sorteer je stapel eerst op nummer, dan gaat het veel sneller. Kaarten met een nummer boven het setnummer (bijvoorbeeld 130/128) zijn de secret rares. Die staan achteraan de lijst.</p>
<p ${P}>Mis je nog een paar kaarten? Vaak is het goedkoper om die los te kopen dan om door te blijven openen. Op de setpagina zie je per kaart hoe zeldzaam hij is, en in onze gids over <a href="https://startmetpokemon.nl/waarde/wat-zijn-mijn-pokemon-kaarten-waard" ${A}>wat je kaarten waard zijn</a> lees je hoe je de prijs opzoekt.</p>
<h2 ${H2}>Wat er nog meer aankomt</h2>
<p ${P}>In de <a href="https://startmetpokemon.nl/kopen/release-kalender" ${A}>release-kalender</a> staat welke set als volgende uitkomt, met een agenda-knop per set. En wil je liever in het echt kopen en ruilen, dan vind je in de <a href="https://startmetpokemon.nl/beurzen/" ${A}>beursagenda</a> de beurzen bij jou in de buurt.</p>
<p ${P}>Lijst niet goed gegaan, of zoek je een lijst van een andere set? Antwoord gewoon op deze mail.</p>
`,
    }),
  },

  beurzen: {
    subject: 'Welkom, zo haal je meer uit een beurs',
    html: licht({
      titel: 'Welkom, zo haal je meer uit een beurs',
      preheader: 'Waar je de beurzen vindt en hoe je je voorbereidt.',
      eyebrow: 'Welkom',
      inhoud: `<p ${P}>Hoi,</p>
<p ${P}>Bedankt voor je aanmelding. Je hebt je ingeschreven via de beursagenda, dus daar gaat deze mail over: waar je de beurzen vindt en hoe je er het meeste uit haalt.</p>
<h2 ${H2}>De agenda</h2>
<p ${P}>Op de beurzenpagina staan de Pokémon-beurzen in Nederland en België, met tijden, adres, entree en een agenda-knop. Je filtert op provincie, en voorbije edities verdwijnen vanzelf. We controleren de beurzen bij de organisator zelf. Wat we niet konden bevestigen, staat erbij als onder voorbehoud.</p>
<p style="margin:0 0 22px;"><a href="https://startmetpokemon.nl/beurzen/" ${KNOP}>Naar de beursagenda</a></p>
<h2 ${H2}>Zo bereid je je voor</h2>
<p ${P}><strong>Weet wat je zoekt en wat het kost.</strong> Zet de kaarten die je wilt hebben op een lijstje, met de prijs die ze online doen. Zo zie je op de beurs meteen of een prijs redelijk is.</p>
<p ${P}><strong>Bundel als je onderhandelt.</strong> Een bod van de helft op een losse kaart werkt zelden. Leg liever vijf kaarten neer en vraag wat ze samen mogen kosten. Tien tot vijftien procent korting op een stapel is heel gewoon.</p>
<p ${P}><strong>Neem contant geld mee.</strong> Niet elke standhouder heeft een pinautomaat, en contant onderhandelt makkelijker.</p>
<p ${P}><strong>Kijk naar de conditie.</strong> Dat is het voordeel van een beurs: je hebt de kaart in handen. Let op de randen, de hoeken en de centrering voordat je betaalt. Wil je kaarten verkopen, lees dan eerst <a href="https://startmetpokemon.nl/waarde/pokemon-kaarten-verkopen" ${A}>Pokémon-kaarten verkopen</a>.</p>
<p ${P}>Staat er een beurs niet in de agenda, of klopt er iets niet? Antwoord gewoon op deze mail.</p>
`,
    }),
  },

  releases: {
    subject: 'Welkom, zo blijf je bij met nieuwe sets',
    html: licht({
      titel: 'Welkom, zo blijf je bij met nieuwe sets',
      preheader: 'Waar je de releases vindt en hoe je rond een release slim koopt.',
      eyebrow: 'Welkom',
      inhoud: `<p ${P}>Hoi,</p>
<p ${P}>Bedankt voor je aanmelding. Je hebt je ingeschreven via een pagina over nieuwe sets, dus daar gaat deze mail over: waar je de releases vindt en waar je rond een release op kunt letten.</p>
<h2 ${H2}>De kalender</h2>
<p ${P}>In de release-kalender staan alle grote Engelstalige sets, met een aftelklok naar de volgende release. Klap een set uit voor de producten en de Japanse tegenhanger, en zet de datum met een klik in je eigen agenda. De statussen werken we bij zodra er iets verandert.</p>
<p style="margin:0 0 22px;"><a href="https://startmetpokemon.nl/kopen/release-kalender" ${KNOP}>Naar de release-kalender</a></p>
<h2 ${H2}>Slim kopen rond een release</h2>
<p ${P}><strong>Sealed is rond de release zelden op zijn goedkoopst.</strong> Bij de meeste sets komt er na de eerste weken volop product en zakt de prijs, of blijft die stabiel. Jubileum- en special sets zijn de uitzondering: die worden eerder schaars.</p>
<p ${P}><strong>Pre-orderen loont vooral als je op releasedag wilt openen.</strong> Reserveer dan bij een betrouwbare winkel. Wie wil bewaren, heeft meestal minder haast.</p>
<p ${P}><strong>Losse kaarten zijn direct na de release op hun duurst.</strong> Zakt de aandacht, dan zakt vaak ook de prijs. Even wachten kan veel schelen.</p>
<p ${P}>Twijfel je wat een normale prijs is? In de <a href="https://startmetpokemon.nl/kopen/adviesprijzen-msrp-gids" ${A}>gids over adviesprijzen</a> staat waar je op let, en in <a href="https://startmetpokemon.nl/kopen/waar-pokemon-kaarten-kopen" ${A}>waar je Pokémon-kaarten koopt</a> welke winkels en webshops er zijn.</p>
<h2 ${H2}>Japans of Engels?</h2>
<p ${P}>Japan brengt dezelfde kaarten meestal een paar maanden eerder uit. Wil je weten wat er in een Engelse set komt, dan geeft de Japanse versie vaak al een goed beeld. In de kalender zet je de Japanse datums erbij met de schakelaar boven de detailsectie.</p>
`,
    }),
  },

  plan30: {
    subject: 'Hier is je 30-dagen Pokémon-plan',
    html: `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>Je 30-dagen plan</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0E17;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#F1F5F9;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;">Je PDF staat klaar. 10 pagina's, geen hype, geen shortcuts.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0E17;">
<tr><td style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background-color:#111827;border:1px solid #1E293B;border-radius:16px;">
    <tr>
      <td style="padding:40px 32px;">
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:#FACC15;margin-bottom:16px;">Inschrijving bevestigd</div>
        <h1 style="font-family:'DM Serif Display',Georgia,serif;font-size:34px;line-height:1.15;margin:0 0 18px 0;color:#F1F5F9;font-weight:400;">Je 30-dagen plan staat klaar.</h1>
        <p style="font-size:16px;line-height:1.65;margin:0 0 18px 0;color:#C5CCD8;">Welkom op Start Met Pokémon. Vanaf hier krijg je de PDF die je in 30 dagen klaarstoomt voor je eerste bewuste aankoop. 10 pagina's, geen hype, geen shortcuts.</p>
        <div style="text-align:center;margin:36px 0;">
          <a href="https://startmetpokemon.nl/downloads/Start-Met-Pokemon-30-dagen-plan.pdf" style="display:inline-block;background-color:#FACC15;color:#0A0E17;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:15px;font-weight:700;">Download de PDF →</a>
        </div>
        <div style="background-color:#0A0E17;border:1px solid #1E293B;border-radius:12px;padding:22px 26px;margin:28px 0;">
          <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:#FACC15;margin-bottom:12px;">Wat te doen</div>
          <ol style="margin:0;padding-left:22px;color:#94A3B8;font-size:15px;line-height:1.65;">
            <li style="margin:6px 0;">Open de PDF en sla 'm op.</li>
            <li style="margin:6px 0;">Lees 'm één keer in zijn geheel door. Dat is dag 0.</li>
            <li style="margin:6px 0;">Print pagina 7 (de aankoop-checklist) en leg 'm naast je laptop.</li>
          </ol>
        </div>
        <p style="font-size:15px;line-height:1.65;margin:24px 0 0 0;color:#C5CCD8;"><strong style="color:#F1F5F9;">Wat je in de PDF vindt:</strong> een week-voor-week plan, de aankoop-checklist, een vergelijking van marktplaatsen die Nederlanders gebruiken, en de rode vlaggen die beginners het vaakst geld kosten.</p>
        <p style="font-size:15px;line-height:1.65;margin:18px 0 0 0;color:#94A3B8;">Vanaf nu krijg je af en toe een marktupdate. Wat beweegt in sealed, grading en singles, en wat dat voor jouw portefeuille betekent. Uitschrijven kan altijd onderaan elke mail.</p>
        <p style="font-size:15px;line-height:1.65;margin:28px 0 0 0;color:#F1F5F9;">Veel succes met stap 1.</p>
        <p style="font-family:'DM Serif Display',Georgia,serif;font-size:18px;line-height:1.4;margin:6px 0 0 0;color:#FACC15;">Start Met Pokémon</p>
        <hr style="border:none;border-top:1px solid #1E293B;margin:32px 0 16px 0;">
        <p style="font-size:12px;line-height:1.5;color:#64748B;margin:0;text-align:center;">
          © 2026 Start Met Pokémon · Geen financieel advies, educatief platform.<br>
          Je krijgt deze mail omdat je je aanmeldde op <a href="https://startmetpokemon.nl" style="color:#94A3B8;text-decoration:underline;">startmetpokemon.nl</a>. <a href="{{AFMELDEN}}" style="color:#94A3B8;text-decoration:underline;">Uitschrijven</a>.
        </p>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`,
  },
};
