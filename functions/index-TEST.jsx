const admin = require("firebase-admin");
const functions = require("firebase-functions");
const axios = require("axios");
const storage = admin.storage().bucket();
const {Timestamp} = require("firebase-admin/firestore");
const BATCH_SIZE_LIMIT = 100; // Reduce batch size to 100 for testing

exports.importReports = functions.https.onCall(async (data, context) => {
  try {
    const {reports} = data;
    console.log("Received reports: ", reports);

    let batch = admin.firestore().batch();
    let batchCounter = 0;
    const batchPromises = [];

    for (let i = 0; i < reports.length; i++) {
      console.log(`Processing report ${i}: `, reports[i]);

      // Parse the createdDate from the report
      if (reports[i].createdDate) {
        const date = new Date(reports[i].createdDate);
        if (!isNaN(date.getTime())) {
          reports[i].createdDate = Timestamp.fromDate(date);
        } else {
          console.error(
              `Invalid date format for report ${i}: `,
              reports[i].createdDate,
          );
          throw new functions.https.HttpsError(
              "invalid-argument",
              "Invalid date format.",
          );
        }
      }

      const newDocRef = admin.firestore().collection("reports").doc();
      batch.set(newDocRef, reports[i]);
      batchCounter++;

      // Commit the batch after every BATCH_SIZE_LIMIT writes
      if (batchCounter === BATCH_SIZE_LIMIT) {
        console.log(`Committing batch of ${batchCounter} reports`);
        batchPromises.push(
            batch.commit().catch((error) => {
              console.error("Batch commit error: ", error);
              throw new functions.https.HttpsError(
                  "internal",
                  "Batch commit failed.",
              );
            }),
        );
        batch = admin.firestore().batch(); // Start a new batch
        batchCounter = 0;
      }
    }

    // Commit the last batch if there are remaining writes
    if (batchCounter > 0) {
      console.log(`Committing final batch of ${batchCounter} reports`);
      batchPromises.push(
          batch.commit().catch((error) => {
            console.error("Final batch commit error: ", error);
            throw new functions.https.HttpsError(
                "internal",
                "Final batch commit failed.",
            );
          }),
      );
    }

    // Wait for all batch commits to complete
    await Promise.all(batchPromises);
    console.log("All batch commits successful");
    return {
      success: true,
      message: "Reports imported successfully",
    };
  } catch (error) {
    console.error("Error importing reports: ", error);
    throw new functions.https.HttpsError("internal", "Failed to import reports");
  }
});
