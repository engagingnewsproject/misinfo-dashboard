require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Path to the service account key file
const serviceAccount = require(
    "../misinfo-5d004-firebase-adminsdk-2ubvq-135d27238a.json",
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "misinfo-5d004.appspot.com",
});
const storage = admin.storage().bucket();
const axios = require("axios");
const {Timestamp} = require("firebase-admin/firestore");

// used for sending slack messages from help requests form
// Slack <-> Firebase connection URL
// To reset the Slack webhook url run:
// `firebase functions:config:set slack.webhook_url="https://hooks.slack.com/services/SLACK_WEBHOOK_URL"`
const SLACK_WEBHOOK_URL = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;
// const SLACK_WEBHOOK_URL = functions.config().slack.webhook_url;

// Function to post a message to Slack
const postToSlack = async (
    userID,
    userName,
    userEmail,
    userRole,
    subject,
    messageText,
    imageUrl,
) => {
  try {
    const payload = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${userName}* - ${subject}`,
          },
        },
        {
          type: "section",
          block_id: "section567",
          text: {
            type: "mrkdwn",
            text: messageText,
          },
          accessory: {
            type: "image",
            image_url: imageUrl,
            alt_text: "User uploaded image",
          },
        },
        {
          type: "section",
          block_id: "section789",
          fields: [
            {
              type: "mrkdwn",
              text: `
                *User ID*\n${userID}
                \n*User Email*\n${userEmail}
                \n*User Role*\n${userRole}
              `,
            },
          ],
        },
        {
          type: "image",
          title: {
            type: "plain_text",
            text: "User uploaded image",
          },
          block_id: "image4",
          image_url: imageUrl,
          alt_text: "File uploaded by user.",
        },
      ],
    };
    await axios.post(SLACK_WEBHOOK_URL, payload);
  } catch (error) {
    console.error("Error posting message to Slack:", error.message);
  }
};

exports.notifySlackOnNewHelpRequest = functions.firestore
    .document("helpRequests/{requestId}")
    .onCreate(async (snap) => {
      const newRequest = snap.data();
      const userID = newRequest.userID || "unknown user";
      let userName = "Unknown";
      let userEmail = "No email provided";
      let userRole = "No role specified";

      if (userID !== "unknown user") {
        const userRef = admin.firestore().collection("mobileUsers").doc(userID);
        const doc = await userRef.get();
        if (doc.exists) {
          const userData = doc.data();
          userName = userData.name || userName;
          userEmail = userData.email || userEmail;
          userRole = userData.userRole || userRole;
        } else {
          console.log("User not found");
          return; // Optionally exit if no user info is available
        }
      }

      const subject = newRequest.subject || "No Subject";
      const messageText = newRequest.message || "No message provided";
      const imageUrl =
      newRequest.images && newRequest.images.length > 0 ?
        newRequest.images[0] :
          "https://example.com/default-image.jpg";

      return postToSlack(
          userID,
          userName,
          userEmail,
          userRole,
          subject,
          messageText,
          imageUrl,
      );
    });


exports.addUserRole = functions.https.onCall((data, context) => {
  // get user and add custom claim to user
  return admin.auth().getUserByEmail(data.email).then((user) => {
    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid, {});

    // callback for frontend if success
  }).then(() => {
    return {
      message: "Success! ${data.email} has been reset to user privileges.",
    };

    // callback if there is an error
  }).catch((err) => {
    return err;
  });
});

// Adds admin privilege to user based on the email provided
exports.addAdminRole = functions.https.onCall((data, context) => {
  // get user and add custom claim to user
  return admin.auth().getUserByEmail(data.email).then((user) => {
    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid, {admin: true});

    // callback for frontend if success
  }).then(() => {
    return {
      message: "Success! ${data.email} has been made an admin",
    };

    // callback if there is an error
  }).catch((err) => {
    return err;
  });
});

// Adds agency privilege to user based on email provided
exports.addAgencyRole = functions.https.onCall(
    (data, context) => {
      // get user and add custom claim to user


      return admin.auth().getUserByEmail(data.email).then((user) => {
        // Once user object is retrieved, updates custom claim
        return admin.auth().setCustomUserClaims(user.uid, {agency: true});

        // callback for frontend if success
      }).then((result) => {
        console.log(result.data.message); // Display the message in the console
        // return {
        //   message: "Success! ${data.email} has been made an agency admin"
        // }

        // callback if there is an error
      }).catch((err) => {
        return err;
      });
    });

exports.viewRole = functions.https.onCall((data, context) => {
  // get user and add custom claim to user


  return admin
      .auth()
      .verifyIdToken(data.id)
      .then((decodedToken) => {
        const claims = decodedToken.customClaims;
        console.log(claims);
        if (claims["admin"]) {
          return {admin: true};
        } else if (claims["agency"]) {
          return {agency: true};
        } else {
          return {
            admin: false,
            agency: false,
          };
        }
      })
      .catch((error) => {
        console.log(error.code, error.message);
      });
});

// get another user data by uid
exports.getUser = functions.https.onCall(async (data, context) => {
  try {
    // Check if the request is authorized (if needed)
    // if (!context.auth) {
    //   return { error: 'Unauthorized' };
    // }

    // Get the UID from the request data
    const uid = data.uid;

    // Retrieve the user record using the UID
    const userRecord = await admin.auth().getUser(uid);

    // Extract relevant user data
    const userData = {
      displayName: userRecord.displayName,
      email: userRecord.email,
      uid: userRecord.uid,
      // Add other fields as needed
    };

    return userData;
  } catch (error) {
    console.error("Error fetching user data:", error);

    // If user does not exist
    if (error.code === "auth/user-not-found") {
      return {};
    }

    // Throw the error for other cases
    throw error;
  }
});


exports.getUserByEmail = functions.https.onCall(async (data, context) => {
  try {
    // Check if the request is authorized (if needed)
    // if (!context.auth) {
    //   return { error: 'Unauthorized' };
    // }
    const email = data.email; // Extract email from data object
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log("User Record:", userRecord);
    return userRecord;
  } catch (error) {
    console.error("Error fetching user data:", error);

    // If user does not exist
    if (error.code === "auth/user-not-found") {
      return {};
    }

    // Throw the error for other cases
    throw error;
  }
});

// get another user data by uid
exports.deleteUser = functions.https.onCall(async (data, context) => {
  try {
    const uid = data.uid;
    const userRecord = [];

    if (!uid) {
      console.log("User data not found");
      return {success: false, message: "User data not found"};
    } else {
      // Perform user deletion operation
      await admin.auth().deleteUser(uid);

      console.log("User deleted successfully on server side");
    }

    return {success: true, message: "User deleted successfully", userRecord};
  } catch (error) {
    console.error("Error deleting user:", error);
    return {success: false, message: "Error deleting user", error};
  }
});

exports.disableUser = functions.https.onCall((data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The user must be authenticated to disable their account.",
    );
  }

  const {uid} = data;
  const callerUid = context.auth.uid;

  // Check if the request is to disable their own account
  if (uid !== callerUid) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Users can only disable their own accounts.",
    );
  }

  return admin.auth().updateUser(uid, {
    disabled: true, // Set the disabled property to true
  })
      .then(() => {
        return {message: `Success! User ${uid} has been disabled.`};
      })
      .catch((error) => {
        console.error("Error disabling user:", error);
        throw new functions.https.HttpsError(
            "internal",
            `Error disabling user: ${error.message}`,
        );
      });
});

exports.getUserRecord = functions.https.onCall(async (data, context) => {
  try {
    const userRecord = await admin.auth().getUser(data.uid);
    // Check the output in Firebase logs
    console.log("User Record:", userRecord);
    return userRecord;
  } catch (error) {
    console.error("Failed to fetch user record:", error);
    throw new functions.https.HttpsError(
        "not-found",
        "User record not found",
        error.message,
    );
  }
});

exports.authGetUserList = functions.https.onCall(async (data, context) => {
  // Ensure that the user is authenticated and optionally check
  // if they have the required role / admin privileges
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Request not authenticated.",
    );
  }
  const maxResults = 1000; // You can adjust this value up to a maximum of 1000

  try {
    const listUsersResult = await admin.auth().listUsers(maxResults);
    const users = listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      // displayName: userRecord.displayName,
      // phoneNumber: userRecord.phoneNumber,
      // photoURL: userRecord.photoURL,
      // emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
    }));
    return {users};
  } catch (error) {
    console.error("Failed to fetch user list: ", error);
    throw new functions.https.HttpsError(
        "unknown",
        "Failed to fetch user list.",
        error,
    );
  }
});

const BATCH_SIZE_LIMIT = 500;


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

      // Process and upload images if any exist
      if (reports[i].images && reports[i].images.length > 0) {
        const imageUploadPromises = reports[i]
            .images
            .split(", ")
            .map(async (
                imageUrl,
                imgIndex,
            ) => {
              try {
                // Fetch the image from the external URL
                const response = await axios({
                  url: imageUrl,
                  method: "GET",
                  responseType: "arraybuffer", // Get the image as binary data
                });

                const imageBuffer = response.data;

                // Create a unique file path in Firebase Storage
                const imagePath = `
                reports/${i}/image_${imgIndex}.jpg
                `; // Adjust the file extension if needed
                const file = storage.file(imagePath);

                // Upload the image to Firebase Storage
                await file.save(imageBuffer, {
                  metadata: {
                    contentType: response.headers["content-type"],
                  },
                });

                console.log(`Uploaded image ${imgIndex} for report ${i}`);

                // Get the Firebase Storage public URL
                const [firebaseUrl] = await file.getSignedUrl({
                  action: "read",
                  expires: "03-01-2500", // Adjust the expiration date if needed
                });

                return firebaseUrl; // Return the Firebase Storage URL
              } catch (error) {
                console.error(
                    `Error uploading image ${imgIndex} for report ${i}: `,
                    error,
                );
                throw new functions.https.HttpsError(
                    "internal",
                    "Image upload failed",
                );
              }
            });

        // Wait for all image uploads to finish
        const uploadedImages = await Promise.all(imageUploadPromises);
        reports[i].images = uploadedImages;
      }

      // Add the report to the batch
      const newDocRef = admin.firestore().collection("reports").doc();
      batch.set(newDocRef, reports[i]);
      batchCounter++;

      // Commit the batch after every BATCH_SIZE_LIMIT writes
      if (batchCounter === BATCH_SIZE_LIMIT) {
        batchPromises.push(batch.commit());
        batch = admin.firestore().batch();
        batchCounter = 0;
      }
    }

    // Commit the last batch if there are remaining writes
    if (batchCounter > 0) {
      batchPromises.push(batch.commit());
    }

    // Wait for all batch commits to complete
    await Promise.all(batchPromises);
    console.log("All batch commits and image uploads successful");
    return {
      success: true,
      message: "Reports and images imported successfully",
    };
  } catch (error) {
    console.error("Error importing reports: ", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to import reports and images",
    );
  }
});
