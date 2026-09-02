#!/usr/bin/env node
/* Kopierer config/firebase-config.js ud i alle tre app-mapper.
   Kør efter enhver ændring:  npm run config                          */

import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rod  = join(dirname(fileURLToPath(import.meta.url)), '..');
const kilde = join(rod, 'config', 'firebase-config.js');
const apps  = ['ejerkonsol', 'kontor', 'chauffoer', 'leverandoer'];

if (!existsSync(kilde)) {
  console.error('Kan ikke finde config/firebase-config.js');
  process.exit(1);
}

const indhold = readFileSync(kilde, 'utf8');
if (indhold.includes('DIN_API_KEY')) {
  console.warn('Advarsel: config/firebase-config.js indeholder stadig pladsholdere.');
}

for (const app of apps) {
  const maal = join(rod, 'apps', app, 'firebase-config.js');
  copyFileSync(kilde, maal);
  console.log('skrevet  apps/' + app + '/firebase-config.js');
}
console.log('Færdig — alle tre apps bruger nu den samme opsætning.');
