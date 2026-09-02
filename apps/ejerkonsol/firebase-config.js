/* Fælles Firebase-opsætning for alle tre apps.
   Ret KUN denne fil — kør derefter:  npm run config

   Nøglerne her er ikke hemmeligheder. Firebase-webnøgler er offentlige af design;
   det er reglerne i database.rules.json og storage.rules der beskytter data. */

window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA74konM2GQkjnLpFNProH9o-6MacjCkr0",
  authDomain:        "fleetmanagement-2026.firebaseapp.com",
  databaseURL:       "https://fleetmanagement-2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "fleetmanagement-2026",
  storageBucket:     "fleetmanagement-2026.firebasestorage.app",
  messagingSenderId: "560202899189",
  appId:             "1:560202899189:web:0aa3a8ea5ec789e663afbc"
};
