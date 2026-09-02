#!/usr/bin/env node
/* Hurtigt sundhedstjek inden du pusher.
   Kør:  npm test                                                     */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rod = join(dirname(fileURLToPath(import.meta.url)), '..');
const apps = ['ejerkonsol', 'kontor', 'chauffoer', 'leverandoer'];
let fejl = 0;
const fejlet = (t) => { console.error('FEJL  ' + t); fejl++; };
const ok     = (t) => console.log('ok    ' + t);

// 1. Alle apps har en config-fil, og den er synkron med kilden
const kilde = readFileSync(join(rod, 'config', 'firebase-config.js'), 'utf8');
for (const app of apps) {
  const sti = join(rod, 'apps', app, 'firebase-config.js');
  if (!existsSync(sti)) { fejlet(app + ': firebase-config.js mangler — kør npm run config'); continue; }
  if (readFileSync(sti, 'utf8') !== kilde) fejlet(app + ': config er ude af trit — kør npm run config');
  else ok(app + ': config er opdateret');
}

// 2. Ingen app må have en datasti uden kundepræfiks
for (const app of ['kontor', 'chauffoer', 'leverandoer']) {
  const html = readFileSync(join(rod, 'apps', app, 'index.html'), 'utf8');
  const bare = [...html.matchAll(/ref\(db,'(?!users|kunder|platform)[^']*'/g)].map(m => m[0]);
  if (bare.length) fejlet(app + ': datastier uden kundepræfiks: ' + bare.join(', '));
  else ok(app + ': alle datastier er bundet til en kunde');
}

// 3. Ingen rester fra den gamle kunde
for (const app of apps) {
  const html = readFileSync(join(rod, 'apps', app, 'index.html'), 'utf8');
  const spor = ['hizkia', 'flaadestyring-4b161', 'Lpomr8S7'].filter(s => html.includes(s));
  if (spor.length) fejlet(app + ': gammel kundedata tilbage: ' + spor.join(', '));
  else ok(app + ': ingen kundedata i filen');
}

// 4. Ingen rester af den gamle blå palet
for (const app of apps) {
  const html = readFileSync(join(rod, 'apps', app, 'index.html'), 'utf8');
  const gamle = ['#3b82f6', '#0f172a', '#1e293b'].filter(s => html.includes(s));
  if (gamle.length) fejlet(app + ': gammel farve tilbage: ' + gamle.join(', '));
  else ok(app + ': VEYRO-paletten er gennemført');
}

// 5. Reglerne er gyldig JSON
try { JSON.parse(readFileSync(join(rod, 'database.rules.json'), 'utf8')); ok('database.rules.json er gyldig'); }
catch (e) { fejlet('database.rules.json: ' + e.message); }

console.log(fejl ? '\n' + fejl + ' problem(er) fundet.' : '\nAlt ser rigtigt ud.');
process.exit(fejl ? 1 : 0);
