const axios = require("axios");
const {Storage} = require("@google-cloud/storage");
const storage = admin.storage().bucket(); // Ensure you've set up your Firebase Storage bucket

exports.importReports = functions.https.onCall(async (data, context) => {
  try {
    const {reports} = data;
    console.log("Received reports: ", reports);

    const batchPromises = [];

    for (const [index, report] of reports.entries()) {
      console.log(`Processing report ${index}: `, report);

      const newDocRef = admin.firestore().collection("reports").doc();

      // Check if there are images to upload
      if (report.images && report.images.length > 0) {
        const imageUploadPromises = report.images.map(async (imageUrl, imgIndex) => {
          try {
            // Download the image from the URL
            const response = await axios({
              url: imageUrl,
              method: "GET",
              responseType: "arraybuffer", // Get binary data
            });

            const imageBuffer = response.data;

            // Create a reference in Firebase Storage for this image
            const imagePath = `reports/${newDocRef.id}/image_${imgIndex}.jpg`; // or use appropriate extension
            const file = storage.file(imagePath);

            // Upload the image to Firebase Storage
            await file.save(imageBuffer, {
              metadata: {
                contentType: response.headers["content-type"],
              },
            });

            console.log(`Uploaded image ${imgIndex} for report ${index}`);

            // Get the Firebase Storage URL
            const [firebaseUrl] = await file.getSignedUrl({
              action: "read",
              expires: "03-01-2500", // Adjust the expiration date accordingly
            });

            return firebaseUrl; // Return the uploaded image's URL
          } catch (error) {
            console.error(`Error uploading image ${imgIndex} for report ${index}: `, error);
            throw new functions.https.HttpsError("internal", "Image upload failed");
          }
        });

        // Wait for all image uploads to finish and store their Firebase URLs
        const uploadedImages = await Promise.all(imageUploadPromises);
        report.images = uploadedImages; // Replace original URLs with Firebase URLs
      }

      // Add report to batch for Firestore
      const batch = admin.firestore().batch();
      batch.set(newDocRef, report);

      // Add batch commit to promises
      batchPromises.push(batch.commit().catch((error) => {
        console.error("Batch commit error: ", error);
        throw new functions.https.HttpsError("internal", "Batch commit failed");
      }));
    }

    // Wait for all batch commits
    await Promise.all(batchPromises);
    console.log("All reports and images uploaded successfully");
    return {success: true, message: "Reports imported successfully"};
  } catch (error) {
    console.error("Error importing reports: ", error);
    throw new functions.https.HttpsError("internal", "Failed to import reports");
  }
});
