/**
 * @fileoverview Firebase Cloud Functions - Backend API and Triggers
 * 
 * This file contains all Firebase Cloud Functions for the Misinfo Dashboard application.
 * It includes HTTP callable functions for user management, Firestore triggers for
 * automated actions, and integration with external services like Slack for notifications.
 * 
 * @module functions/index
 * @requires dotenv
 * @requires firebase-functions
 * @requires firebase-admin
 * @requires firebase-functions/params
 * @requires firebase-functions/logger
 * @requires firebase-admin/app
 * @requires axios
 */

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

/**
 * Posts a formatted message to Slack with user information and help request details.
 * 
 * This function creates a structured Slack message with user details, help request
 * information, and any attached images. It uses Slack's block kit format for
 * better message presentation.
 * 
 * @param {string} userID - The user's unique identifier
 * @param {string} userName - The user's display name
 * @param {string} userEmail - The user's email address
 * @param {string} userRole - The user's role in the system
 * @param {string} subject - The help request subject
 * @param {string} messageText - The help request message content
 * @param {string} imageUrl - URL of any attached image
 * @param {string} slackHook - The Slack webhook URL
 * @returns {Promise<void>} Resolves when message is posted successfully
 * @throws {Error} When Slack API call fails
 * @example
 * await postToSlack('user123', 'John Doe', 'john@example.com', 'admin', 'Bug Report', 'Found an issue', 'https://example.com/image.jpg', 'https://hooks.slack.com/...');
 */
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
    throw error;
  }
};

/**
 * Firestore trigger that sends Slack notifications when new help requests are created.
 * 
 * This function is automatically triggered whenever a new document is created
 * in the 'helpRequests' collection. It fetches user information from the
 * 'mobileUsers' collection and sends a formatted notification to Slack.
 * 
 * @type {Function}
 * @param {Object} snap - Firestore document snapshot
 * @param {Object} snap.data - The help request data
 * @param {string} snap.data.userID - The user's ID
 * @param {string} snap.data.subject - Help request subject
 * @param {string} snap.data.message - Help request message
 * @param {Array} snap.data.images - Array of image URLs
 * @returns {Promise<void>} Resolves when notification is sent
 * @example
 * // Triggered automatically when a new help request is created
 */
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

/**
 * HTTP callable function to reset a user's role to basic user privileges.
 * 
 * This function removes all custom claims from a user, effectively resetting
 * them to basic user privileges. It's typically used by administrators
 * to revoke elevated permissions.
 * 
 * @param {Object} data - Function parameters
 * @param {string} data.email - The email address of the user to modify
 * @param {Object} context - Firebase function context
 * @returns {Promise<Object>} Success message or error
 * @throws {Error} When user lookup or claim update fails
 * @example
 * const result = await addUserRole({ email: 'user@example.com' });
 */
exports.addUserRole = functions.https.onCall((data, context) => {
  // get user and add custom claim to user
  return admin.auth().getUserByEmail(data.email).then((user) => {
    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid, {});

    // callback for frontend if success
  }).then(() => {
    return {
      message: `Success! ${data.email} has been reset to user privileges.`,
    };

    // callback if there is an error
  }).catch((err) => {
    return err;
  });
});

/**
 * HTTP callable function to grant admin privileges to a user.
 * 
 * This function adds the 'admin' custom claim to a user, granting them
 * administrative privileges throughout the application. Only existing
 * admins should be able to call this function.
 * 
 * @param {Object} data - Function parameters
 * @param {string} data.email - The email address of the user to promote
 * @param {Object} context - Firebase function context
 * @returns {Promise<Object>} Success message or error
 * @throws {Error} When user lookup or claim update fails
 * @example
 * const result = await addAdminRole({ email: 'admin@example.com' });
 */
exports.addAdminRole = functions.https.onCall((data, context) => {
  // get user and add custom claim to user
  return admin.auth().getUserByEmail(data.email).then((user) => {
    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid, {admin: true});

    // callback for frontend if success
  }).then(() => {
    return {
      message: `Success! ${data.email} has been made an admin`,
    };

    // callback if there is an error
  }).catch((err) => {
    return err;
  });
});

/**
 * HTTP callable function to grant agency privileges to a user.
 * 
 * This function adds the 'agency' custom claim to a user, granting them
 * agency-level privileges for managing reports and content within their
 * assigned agency scope.
 * 
 * @param {Object} data - Function parameters
 * @param {string} data.email - The email address of the user to promote
 * @param {Object} context - Firebase function context
 * @returns {Promise<Object>} Success message or error
 * @throws {Error} When user lookup or claim update fails
 * @example
 * const result = await addAgencyRole({ email: 'agency@example.com' });
 */
exports.addAgencyRole = functions.https.onCall(
    (data, context) => {
      // Validate email input before attempting to update auth
      const email = typeof data?.email === "string" ? data.email.trim() : "";
      if (!email) {
        log("addAgencyRole skipped: email not provided");
        return {
          message: "No email provided. Skipping agency role assignment.",
        };
      }

      // get user and add custom claim to user
      return admin.auth().getUserByEmail(email).then((user) => {
        // Once user object is retrieved, updates custom claim
        return admin.auth().setCustomUserClaims(user.uid, {agency: true});

        // callback for frontend if success
      }).then(() => {
        return {
          message: `Success! ${email} has been made an agency admin`,
        };

        // callback if there is an error
      }).catch((err) => {
        return err;
      });
    });

/**
 * HTTP callable function to view a user's current role claims.
 * 
 * This function verifies an ID token and returns the user's current
 * custom claims, showing whether they have admin or agency privileges.
 * 
 * @param {Object} data - Function parameters
 * @param {string} data.id - The ID token to verify
 * @param {Object} context - Firebase function context
 * @returns {Promise<Object>} User's role claims
 * @throws {Error} When token verification fails
 * @example
 * const claims = await viewRole({ id: 'user-id-token' });
 */
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
