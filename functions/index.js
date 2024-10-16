require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {defineSecret} = require("firebase-functions/params");
// All available logging functions
const {log} = require("firebase-functions/logger");
// The Firebase Admin SDK to access Firestore.
const {initializeApp} = require("firebase-admin/app");

initializeApp();

const axios = require("axios");

// Define the Slack Webhook URL secret
const slackWebhook = defineSecret("SLACK_WEBHOOK_URL");

// Function to post a message to Slack
const postToSlack = async (
    userID,
    userName,
    userEmail,
    userRole,
    subject,
    messageText,
    imageUrl,
    slackHook,
) => {
  try {
    const payload = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*UserName*: ${ userName }, 
              *UserRole*: ${ userRole }, 
              *Email*: ${ userEmail } 
              - *Subject*: ${ subject }`,
          },
        },
        {
          type: "section",
          block_id: "section_message",
          text: {
            type: "mrkdwn",
            text: `Message: ${messageText}`,
          },
          accessory: {
            type: "image",
            image_url: imageUrl,
            alt_text: "User uploaded image",
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          block_id: "section_userID",
          text: {
            type: "mrkdwn",
            text: `UserID: ${userID}`,
          },
        },
      ],
    };
    await axios.post(slackHook, payload);
  } catch (error) {
    console.error(
        "Error posting message to Slack:",
        error.response?.data || error.message);
  }
};

exports.notifySlackOnNewHelpRequest = functions.firestore
    .document("helpRequests/{requestId}")
    .onCreate( async (snap) => {
      const newRequest = snap.data();
      const userID = newRequest.userID || "unknown user";
      let userName = "Unknown";
      let userEmail = "No email provided";
      let userRole = "No role specified";

      // Fetch user data if the userID is valid
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

      // Prepare message for Slack
      const subject = newRequest.subject || "No Subject";
      const messageText = newRequest.message || "No message provided";
      const imageUrl =
      newRequest.images && newRequest.images.length > 0 ?
        newRequest.images[0] :
        "https://placehold.co/600x400";

      // Access the secret and use it in the function
      const slackHook = slackWebhook.value(); // Fetch the secret value
      log(slackHook);
      // Post the message to Slack using the Secret Webhook URL
      await postToSlack(
          userID,
          userName,
          userEmail,
          userRole,
          subject,
          messageText,
          imageUrl,
          slackHook,
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
    // Check if the request is authorized (if needed)
    // if (!context.auth) {
    //   return { error: 'Unauthorized' };
    // }

    // Get the UID from the request data
    const uid = data.uid;

    if (!uid) {
      console.log("User data not found");
      return {success: false, message: "User data not found"};
    } else {
      // Perform user deletion operation
      await admin.auth().deleteUser(uid);

      console.log("User deleted successfully on server side");
    }

    return {success: true, message: "User deleted successfully", uid};
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
  // Ensure that the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Request not authenticated.",
    );
  }
  const maxResults = 1000; // maximum of 1000

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
      // providerData: userRecord.providerData,
      // customClaims: userRecord.customClaims,
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
