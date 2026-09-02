/**
 * saetKundeClaim
 *
 * Storage-regler kan kun se det der står i brugerens login-token. Denne funktion
 * skriver kundens ID ind i tokenet, hver gang en brugerprofil oprettes eller ændres,
 * så Storage kan holde kundernes billeder og bilag adskilt.
 *
 * Læg filen i functions/index.js (eller importér den derfra) og kør:
 *   firebase deploy --only functions
 *
 * Brugeren skal logge ud og ind igen — eller vente op til en time — før det nye
 * token slår igennem. Første gang du opretter en bruger, så bed dem logge ind på ny.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Kører når /users/<uid> oprettes, ændres eller slettes
exports.saetKundeClaim = functions
  .region('europe-west1')
  .database.ref('/users/{uid}')
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const profil = change.after.exists() ? change.after.val() : null;

    try {
      if (!profil) {
        await admin.auth().setCustomUserClaims(uid, null);
        return null;
      }

      const ejerSnap = await admin.database().ref('/platform/ejere/' + uid).once('value');

      await admin.auth().setCustomUserClaims(uid, {
        kundeId: profil.kundeId || null,
        ejer: ejerSnap.exists(),
      });
    } catch (err) {
      functions.logger.error('saetKundeClaim: kunne ikke sætte claims for uid ' + uid, err);
    }
    return null;
  });

// Kører når nogen tilføjes eller fjernes som platformejer
exports.saetEjerClaim = functions
  .region('europe-west1')
  .database.ref('/platform/ejere/{uid}')
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    try {
      const profilSnap = await admin.database().ref('/users/' + uid).once('value');
      const profil = profilSnap.val() || {};

      await admin.auth().setCustomUserClaims(uid, {
        kundeId: profil.kundeId || null,
        ejer: change.after.exists(),
      });
    } catch (err) {
      functions.logger.error('saetEjerClaim: kunne ikke sætte claims for uid ' + uid, err);
    }
    return null;
  });
