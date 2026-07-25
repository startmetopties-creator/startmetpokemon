/**
 * Controle: levert de voorgerenderde kaartlijst exact dezelfde HTML op als de
 * JavaScript op de pagina zelf?
 *
 * Werkwijze: laad elke setpagina in een echte DOM (jsdom), laat de eigen
 * scripts draaien met een nagebootste fetch die de lokale JSON teruggeeft, en
 * vergelijk de #cardGallery van vóór en ná het draaien van dat script.
 * Zijn ze identiek, dan verandert er voor bezoekers niets.
 *
 *   npm install jsdom
 *   node tools/verify-prerender.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETS = path.join(ROOT, 'sets');

const files = (await readdir(SETS)).filter((f) => f.endsWith('.html'));
let ok = 0,
  diff = 0,
  skip = 0;
const problems = [];

for (const name of files) {
  const html = await readFile(path.join(SETS, name), 'utf8');
  if (!html.includes('id="cardGallery"')) {
    skip++;
    continue;
  }

  const vc = new VirtualConsole(); // paginafouten niet naar onze uitvoer
  const dom = new JSDOM(html, { runScripts: 'outside-only', virtualConsole: vc });
  const { window } = dom;

  // jsdom zet img.loading en img.decoding niet om naar een attribuut; een
  // echte browser doet dat wel. Voor de vergelijking halen we ze aan beide
  // kanten weg, zodat we niet op een tekortkoming van de testomgeving stuiten.
  const normalise = (s) =>
    s.replace(/ loading="lazy"/g, '').replace(/ decoding="async"/g, '');

  const before = normalise(window.document.getElementById('cardGallery').innerHTML);

  // fetch nabootsen: /sets/data/x.json uit de lokale map
  window.fetch = async (url) => {
    const rel = String(url).replace(/^\//, '');
    const body = await readFile(path.join(ROOT, rel), 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  };

  // alleen het laatste scriptblok bevat de galerij-logica
  const scripts = [...window.document.querySelectorAll('script:not([src])')];
  const code = scripts[scripts.length - 1].textContent;
  try {
    window.eval(code);
  } catch (err) {
    problems.push([name, 'script gaf een fout: ' + err.message]);
    diff++;
    continue;
  }

  await new Promise((r) => setTimeout(r, 60)); // fetch-promise laten afronden
  const after = normalise(window.document.getElementById('cardGallery').innerHTML);

  if (before === after) {
    ok++;
  } else if (before.length === 0) {
    problems.push([name, 'niet voorgerenderd (galerij was leeg)']);
    diff++;
  } else {
    const i = [...before].findIndex((ch, k) => ch !== after[k]);
    problems.push([
      name,
      `wijkt af vanaf teken ${i}\n      vooraf: ${before.slice(Math.max(0, i - 40), i + 60)}\n      script: ${after.slice(Math.max(0, i - 40), i + 60)}`,
    ]);
    diff++;
  }
  window.close();
}

for (const [f, msg] of problems) console.log(`  ${f}: ${msg}`);
console.log(`\nidentiek: ${ok}   afwijkend: ${diff}   zonder galerij: ${skip}`);
process.exit(diff ? 1 : 0);
