# Flerkunde-platform — opsætning

Fire apps på ét fælles Firebase-projekt. Hver kunde har sit eget dataområde, og
reglerne i `database.rules.json` gør det umuligt for én kunde at læse en andens data.

| Mappe | Hvem bruger den |
|---|---|
| `apps/ejerkonsol` | Jørn og Dennis — opret og styr kunder |
| `apps/kontor` | Kundens kontor |
| `apps/chauffoer` | Kundens chauffører |
| `apps/leverandoer` | Værksteder og underleverandører |

---

## Sådan ligger data

```
/platform/ejere/<uid>          Jer to. Giver adgang til alt.
/platform/config               Adresser på apps, bruges af "Åbn"-knappen.

/kunder/<kunde-id>             Firmanavn, CVR, status, moduler, grænser.

/users/<uid>                   navn, email, role, kundeId  ← én bruger, én kunde.

/k/<kunde-id>/trucks           Kundens lastbiler
/k/<kunde-id>/opgaver          Opgaver og indberetninger
/k/<kunde-id>/udgifter         Udgifter
/k/<kunde-id>/service          Serviceplan
/k/<kunde-id>/chauffoerer      Chaufførkartotek
/k/<kunde-id>/vaerksteder      Værksteder
/k/<kunde-id>/serviceTyper     Servicetyper
/k/<kunde-id>/settings         Logo og beregnerværdier
/k/<kunde-id>/mailConfig       EmailJS-opsætning
/k/<kunde-id>/brugere/<uid>    Kundens egen brugerliste
```

I Storage: `k/<kunde-id>/bilag/…` og `k/<kunde-id>/indberetninger/…`

Alle datastier i apperne bygges nu som `KP + 'trucks'`, hvor `KP` sættes til
`k/<kunde-id>/` når brugeren er logget ind. Er `KP` tom, henter appen ingenting.

---

## Trin for trin

### 1. Opret ét fælles Firebase-projekt
Region `europe-west1`. Slå til: **Authentication → Email/adgangskode**,
**Realtime Database**, **Storage**.

### 2. Indsæt jeres config
Samme `firebaseConfig` i alle tre HTML-filer — den står øverst i `<script type="module">`
med `DIN_API_KEY` og `DIT-PROJEKT` som pladsholdere.

### 3. Læg reglerne ind
Læg `firebase.json`, `database.rules.json` og `storage.rules` i samme mappe og kør:
```bash
firebase deploy --only database,storage
```
eller kopiér `database.rules.json` og `storage.rules` ind i Firebase Console.

### 4. Deploy den ene Cloud Function
Omdøb `functions-saetKundeClaim.js` til `functions/index.js`, kør `npm install
firebase-admin firebase-functions` i mappen, og deploy:
```bash
firebase deploy --only functions
```
`functions-saetKundeClaim.js` skriver kundens ID ind i login-tokenet.
**Storage-regler kan ikke læse databasen**, så uden den funktion kan ingen
uploade billeder eller bilag. Alt andet virker uden.

### 5. Opret jer selv som ejere
Ejerkonsollen kræver, at I allerede står i `/platform/ejere/`, så den allerførste
ejer skal oprettes i hånden:

1. Authentication → Add user → jeres email og adgangskode. Kopiér brugerens UID.
2. Realtime Database → opret:
   ```
   /platform/ejere/<UID>   { "navn": "Jørn", "email": "…" }
   /users/<UID>            { "navn": "Jørn", "email": "…", "role": "owner" }
   ```

Dennis kan bagefter oprettes direkte i ejerkonsollen under fanen **Ejere**.

### 6. Deploy de tre apps til Netlify
Tre sites. Ejerkonsollen bør ligge på sin egen adresse — gerne bag
Netlify Identity eller adgangskodebeskyttelse som ekstra lag.

Læg adresserne på kontorapp og chaufførapp ind under **Opsætning** i ejerkonsollen,
så "Åbn"-knappen sender jer det rigtige sted hen.

---

## Sådan sætter I en ny kunde op

1. **Opret kunde** i ejerkonsollen. Kunde-ID'et låses ved oprettelsen — det indgår
   i stien til data og kan ikke ændres bagefter.
2. Åbn kunden og **opret første bruger** med rollen Administrator.
3. Send login til kunden. Derfra opretter de selv resten under fanen **Brugere**.
4. Kunden er tom fra start: ingen lastbiler, chauffører, værksteder eller servicetyper.

Roller:

| Rolle | Kan |
|---|---|
| `admin` | Alt hos kunden, inkl. oprette og fjerne brugere |
| `user` | Kontorappen, men ikke brugerstyring |
| `chauffeur` | Kun indberetningsappen |
| `leverandoer` | Kun leverandørportalen — sine egne opgaver, og kun status |

---

## Sådan logger I ind hos en kunde

Log ind i kontorappen med jeres eget ejer-login. I får en kundeliste i stedet for
appen, og når I vælger en kunde, ligger der et ambrefarvet bånd øverst med kundens
navn og en **Skift kunde**-knap. Fra ejerkonsollen kan I også gå direkte via
`?kunde=<kunde-id>` i adressen.

Båndet er der med vilje: det skal være svært at glemme, at man sidder i en kundes
egne data.

---

## Hvad reglerne beskytter mod

- En bruger kan kun læse og skrive under sit eget `kundeId`. Alt andet afvises af serveren, ikke af appen.
- En spærret kunde kan ikke læse eller skrive noget som helst. Data bliver bevaret.
- Chauffører kan oprette indberetninger, men kan ikke røre udgifter, service, værksteder eller brugere.
- Leverandører kan kun læse lastbiler, opgaver og værksteder. De kan opdatere en opgave, men kun hvis de selv står som udfører — og de kan hverken oprette, slette eller flytte den til et andet værksted.
- Kun `admin` hos kunden — eller I to — kan ændre brugerlisten.
- `/users/<uid>` kan kun ændres af jer eller af kundens egen administrator, og kun for brugere med samme `kundeId`.

Test det, inden første kunde går i luften: opret to prøvekunder, log ind som bruger
hos den ene, og prøv at hente `/k/<den-andens-id>/trucks` i konsollen.
Det skal fejle med `permission_denied`.

---

## To ting der bevidst ikke er automatiseret

**Login-konti slettes ikke.** Når I fjerner en bruger eller en kunde, ryger
databasedelen, men selve kontoen bliver stående i Authentication. Ryd op der,
hvis de ikke skal kunne logge ind igen.

**Mailopsætning er pr. kunde.** EmailJS-nøglerne lå før hårdkodet i chaufførappen.
Nu læses de fra `/k/<kunde-id>/mailConfig` med felterne `publicKey`, `serviceId`,
`templateId` og `modtager`. Alle fire felter udfylder kunden selv under
**Opsætning → Mail** i kontorappen. Indtil de er udfyldt, gemmes indberetninger
stadig korrekt — kun mailen bliver ikke sendt.
