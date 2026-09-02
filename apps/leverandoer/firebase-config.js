/* Fælles Firebase-opsætning for alle tre apps.
   Ret KUN denne fil — kør derefter:  npm run config

   Nøglerne her er ikke hemmeligheder. Firebase-webnøgler er offentlige af design;
   det er reglerne i database.rules.json og storage.rules der beskytter data. */

window.FIREBASE_CONFIG = {
  apiKey:            "DIN_API_KEY",
  authDomain:        "DIT-PROJEKT.firebaseapp.com",
  databaseURL:       "https://DIT-PROJEKT-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "DIT-PROJEKT",
  storageBucket:     "DIT-PROJEKT.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId:             "1:000000000000:web:0000000000000000000000"
};
