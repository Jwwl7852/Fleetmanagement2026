# Fleetcontrol — flerkunde-platform

Fire statiske apps på ét fælles Firebase-projekt. Hver kunde har sit eget dataområde,
og reglerne på serveren gør det umuligt for én kunde at læse en andens data.

| Mappe | App | Hvem bruger den |
|---|---|---|
| `apps/ejerkonsol` | Ejerkonsol | Jørn og Dennis — opret og styr kunder |
| `apps/kontor` | FleetManagement | Kundens kontor |
| `apps/chauffoer` | Indberetning | Kundens chauffører |
| `apps/leverandoer` | Leverandørportal | Værksteder og underleverandører |

Ingen byggeproces, ingen framework. Fire HTML-filer der kan åbnes direkte i en browser.

Designet følger VEYRO v3.0: mørk navigation `#061824`, teal `#0e6e7a` på handlinger,
lys arbejdsflade `#f6f7f9`. Farverne står i `:root` øverst i hver app, så de kan
rettes ét sted pr. app.

---

## Kom i gang i VS Code

```bash
git clone https://github.com/<jer>/fleetcontrol-platform.git
cd fleetcontrol-platform
code .
```

VS Code foreslår selv de udvidelser projektet bruger — sig ja. De vigtigste er
**Firebase** (farvelægger reglerne), **Netlify** og **Live Server**.

Tryk `Ctrl+Shift+B` for at se de opgaver der er sat op: synk config, kør tjek,
deploy regler, start lokalt.

### Første gang

1. Åbn `config/firebase-config.js` og indsæt jeres rigtige Firebase-nøgler.
2. Kør:
   ```bash
   npm run config
   ```
   Det kopierer opsætningen ud i alle tre apps. **Ret aldrig i
   `apps/*/firebase-config.js` direkte** — de bliver overskrevet.
3. Kør `npm test`. Den fanger de klassiske fejl: config ude af trit, datastier
   uden kundepræfiks, rester af gammel kundedata, ugyldige regler.

### Kør lokalt

```bash
npm start                 # ejerkonsol       → localhost:5000
npm run start:kontor      # kontorapp        → localhost:5001
npm run start:chauffoer   # chaufførapp      → localhost:5002
npm run start:leverandoer # leverandørportal → localhost:5003
```

Firebase Auth kræver, at domænet er godkendt. Tilføj `localhost` under
**Authentication → Settings → Authorized domains**, ellers kan du ikke logge ind lokalt.

---

## GitHub

```bash
git init
git add .
git commit -m "Flerkunde-platform: ejerkonsol, kontorapp og chaufførapp"
git branch -M main
git remote add origin https://github.com/<jer>/fleetcontrol-platform.git
git push -u origin main
```

I VS Code kan det hele klares i Source Control-panelet (`Ctrl+Shift+G`) —
publicér repoet direkte derfra, hvis I har GitHub-udvidelsen.

To workflows kører automatisk:

- `.github/workflows/tjek.yml` — kører `npm test` på hvert push og pull request.
- `.github/workflows/firebase-regler.yml` — deployer regler og functions, når de
  ændres på `main`. Kræver to ting i repoets **Settings**:
  - Secret `FIREBASE_SERVICE_ACCOUNT` — indholdet af en servicekonto-nøgle fra
    Firebase Console → Project settings → Service accounts → Generate new private key.
  - Variable `FIREBASE_PROJECT_ID` — jeres projekt-id.

Vil I hellere deploye i hånden, så slet den workflow og brug `npm run deploy:rules`.

---

## Firebase

Ét fælles projekt i regionen `europe-west1`. Slå til: **Authentication →
Email/adgangskode**, **Realtime Database** og **Storage**.

```bash
npm install -g firebase-tools
firebase login
```

Ret `.firebaserc` så `DIT-PROJEKT` bliver jeres rigtige projekt-id. Derefter:

```bash
npm run deploy:rules      # database.rules.json + storage.rules
npm run deploy:functions   # functions/index.js
```

`functions/` skal deployes. Storage-regler kan ikke slå op i databasen, så kundens
ID kommer med i selve login-tokenet via `saetKundeClaim`. Uden den kan ingen uploade
billeder eller bilag — alt andet virker.

### Opret jer selv som ejere

Ejerkonsollen kræver, at I allerede står i `/platform/ejere/`, så den allerførste
ejer laves i hånden:

1. Authentication → Add user → jeres email og adgangskode. Kopiér UID'et.
2. Realtime Database → opret:
   ```
   /platform/ejere/<UID>   { "navn": "Jørn", "email": "…" }
   /users/<UID>            { "navn": "Jørn", "email": "…", "role": "owner" }
   ```

Dennis oprettes bagefter direkte i ejerkonsollen under fanen **Ejere**.

Resten af detaljerne — datamodel, roller, hvad reglerne beskytter mod —
står i [`docs/firebase-opsaetning.md`](docs/firebase-opsaetning.md).

---

## Netlify

Fire sites fra det samme repo. For hvert af dem: **Add new site → Import an existing
project → GitHub → fleetcontrol-platform**, og sæt derefter under
**Site configuration → Build & deploy**:

| Site | Base directory | Publish directory | Build command |
|---|---|---|---|
| fleetcontrol-ejerkonsol | `apps/ejerkonsol` | `apps/ejerkonsol` | `node ../../scripts/synk-config.mjs` |
| fleetcontrol-kontor | `apps/kontor` | `apps/kontor` | `node ../../scripts/synk-config.mjs` |
| fleetcontrol-indberetning | `apps/chauffoer` | `apps/chauffoer` | `node ../../scripts/synk-config.mjs` |
| fleetcontrol-leverandoer | `apps/leverandoer` | `apps/leverandoer` | `node ../../scripts/synk-config.mjs` |

Base directory skal sættes i Netlify-panelet — først derefter læser Netlify
`netlify.toml` inde i app-mappen, og den tager sig af sikkerhedsheaders og redirects.

Bagefter:

- Tilføj alle fire Netlify-domæner under **Firebase → Authentication → Authorized domains**.
- Læg adresserne på kontorapp og chaufførapp ind under **Opsætning** i ejerkonsollen,
  så "Åbn kontorapp" lander hos den rigtige kunde.
- Ejerkonsollen bør ligge bag et ekstra lag — Netlify Identity eller
  adgangskodebeskyttelse. Reglerne stopper alligevel uvedkommende, men der er
  ingen grund til at have login-siden liggende frit fremme.

---

## Sådan sætter I en ny kunde op

1. **Opret kunde** i ejerkonsollen. Kunde-ID'et låses ved oprettelsen — det indgår
   i stien til data og kan ikke ændres bagefter.
2. Åbn kunden og **opret første bruger** med rollen Administrator.
3. Send login til kunden. Derfra opretter de selv resten under fanen **Brugere**.

Kunden starter helt tom: ingen lastbiler, chauffører, værksteder eller servicetyper.

### Roller

| Rolle | Ser | Kan |
|---|---|---|
| `admin` | Alt hos kunden | Alt, inkl. brugere og mailopsætning |
| `user` | Alt hos kunden | Kontorarbejde, men ikke brugerstyring |
| `chauffeur` | Lastbiler og opgaver | Oprette indberetninger |
| `leverandoer` | Kun opgaver hvor værkstedet står som udfører | Klarmelde sine egne opgaver |

En leverandør ser hverken udgifter, service, chauffører eller brugerlisten. Det er
sat på hver enkelt node i `database.rules.json`, ikke i appen — så det holder også,
hvis nogen åbner konsollen i browseren.

### Sådan giver I et værksted adgang

1. Opret værkstedet i kontorappen under **Opsætning → Værksteder**.
2. Opret brugeren i ejerkonsollen med rollen Leverandør.
3. Sæt `vaerkstedId` på brugeren i `/users/<uid>` til værkstedets id.

Portalen viser opgaver hvor `udforerId` matcher værkstedet. Ældre opgaver, der kun
har værkstedets navn på sig, matches stadig på navnet — så I mister ikke noget ved
at skifte over, og nye opgaver får `udforerId` med automatisk.

---

## Inden første rigtige kunde

Test isolationen. Opret to prøvekunder, log ind som bruger hos den ene, og prøv i
browserkonsollen at hente den andens data:

```js
await (await fetch(FIREBASE_CONFIG.databaseURL + '/k/<den-andens-id>/trucks.json?auth=' +
  await firebase.auth().currentUser.getIdToken())).json()
```

Svaret skal være `permission_denied`. Er det ikke det, så stop og få reglerne på
plads, før nogen betalende kunde kobles på.

---

## Hvad der bevidst ikke er automatisk

**Login-konti slettes ikke.** Fjerner I en bruger eller en kunde, ryger databasedelen,
men kontoen bliver stående i Authentication. Ryd op der, hvis de ikke skal kunne
logge ind igen.

**Chaufførappen har både lys og mørk tilstand.** Månen i toppen skifter, og valget
huskes på telefonen. Lys er standard, fordi den læser bedst i sollys.

**Claims slår først igennem ved næste login.** Når en bruger lige er oprettet, skal
de logge ud og ind igen, før billedupload virker. Sig det til dem, når I sender login.
