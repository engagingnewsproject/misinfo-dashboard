

/*
 START removePhoneFieldFromAllDocs
 This function should be removed from firebase so it is not somehow run.
 To run removePhoneFieldFromAllDocs from terminal:
 curl - X POST https://us-central1-misinfo-5d004.cloudfunctions.net/removePhoneFieldFromAllDocs
 */
const admin = require("firebase-admin");
const functions = require("firebase-functions");

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

exports.removePhoneFieldFromAllDocs = functions.https
    .onRequest(async (req, res) => {
      try {
        console.log("Started removing phone fields...");
        const snapshot = await db.collection("mobileUsers").get();

        let batch = db.batch();
        let count = 0;

        snapshot.docs.forEach((doc) => {
          const docRef = db.collection("mobileUsers").doc(doc.id);
          const data = doc.data();

          if (data.phone !== undefined) {
            batch.update(docRef, {phone: FieldValue.delete()});
            console.log(`Preparing document for update: ${doc.id}`);
            count++;
          } else {
            console.log(`Skipped document (no phone field): ${doc.id}`);
          }

          // Commit every 100 operations
          if (count % 100 === 0) {
            batch.commit().catch((error) => {
              console.error("Batch commit failed:", error);
            });
            batch = db.batch();
          }
        });

        // Commit any remaining operations
        if (count % 100 !== 0) {
          await batch.commit();
        }

        console.log("Phone fields removed successfully.");
        res.status(200).send("Phone fields removed successfully.");
      } catch (error) {
        console.error("Error removing phone fields:", error);
        res.status(500).send("Error removing phone fields.");
      }
    });


