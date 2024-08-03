require('dotenv').config()
const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

const axios = require('axios'); // used for sending slack messages from help requests form

// Slack <-> Firebase connection URL
// To reset the Slack webhook url run:
// `firebase functions:config:set slack.webhook_url="https://hooks.slack.com/services/SLACK_WEBHOOK_URL"`
const SLACK_WEBHOOK_URL = functions.config().slack.webhook_url;

// Function to post a message to Slack
const postToSlack = async (message) => {
  try {
    const payload = {
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: message
              }
            },
            {
              type: "section",
              block_id: "section567",
              text: {
                type: "mrkdwn",
                text: "<https://example.com|Overlook Hotel> \n :star: \n Doors had too many axe holes, guest in room 237 was far too rowdy, whole place felt stuck in the 1920s."
              },
              accessory: {
                type: "image",
                image_url: imageUrl,
                alt_text: "Haunted hotel image"
              }
            },
            {
              type: "section",
              block_id: "section789",
              fields: [
                {
                  type: "mrkdwn",
                  text: "*Average Rating*\n1.0"
                }
              ]
            }
          ]
        };

    await axios.post(SLACK_WEBHOOK_URL, payload);
  } catch (error) {
    console.error('Error posting message to Slack:', error.message);
    if (error.response) {
      console.log(error.response.data); // Log more detailed info about the error response
    }
  }
};

exports.notifySlackOnNewHelpRequest = functions.firestore
    .document('helpRequests/{requestId}')
    .onCreate((snap) => { // might need 'context' parameter later
      const newRequest = snap.data();
      const userID = newRequest.userID || 'an unknown user';  // Default to 'an unknown user' if userID is undefined
      const subject = newRequest.subject || 'No Subject'; // Default to 'No Subject' if subject is undefined
      const messageText = `New help request from user ${userID} with subject "${subject}": ${newRequest.message}`;

      // Handle images
      let imagesText = '';
      if (newRequest.images && newRequest.images.length > 0) {
        imagesText = newRequest.images.map((url, index) => `\nImage ${index + 1}: ${url}`).join('');
      }

      const fullMessage = messageText + imagesText;
      return postToSlack(fullMessage);
    });

exports.addUserRole = functions.https.onCall((data,context) => {
  // get user and add custom claim to user
  return admin.auth().getUserByEmail(data.email).then(user => {

    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid,{})

    // callback for frontend if success
  }).then(() => {
    return {
      message: "Success! ${data.email} has been reset to user privileges."
    }

    // callback if there is an error
  }).catch(err => {
    return err
  })

})

// Adds admin privilege to user based on the email provided
exports.addAdminRole = functions.https.onCall((data,context) => {
  // get user and add custom claim to user
  return admin.auth().getUserByEmail(data.email).then(user => {

    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid,{ admin: true })

    // callback for frontend if success
  }).then(() => {
    return {
      message: "Success! ${data.email} has been made an admin"
    }

    // callback if there is an error
  }).catch(err => {
    return err
  })

})

// Adds agency privilege to user based on email provided
exports.addAgencyRole = functions.https.onCall(
  (data,context) => {
  // get user and add custom claim to user


  return admin.auth().getUserByEmail(data.email).then((user) => {

    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid,{ agency: true })

    // callback for frontend if success
  }).then((result) => {
    console.log(result.data.message); // Display the message in the console
    // return {
    //   message: "Success! ${data.email} has been made an agency admin"
    // }

    // callback if there is an error
  }).catch(err => {
    return err
  })

})

exports.viewRole = functions.https.onCall((data,context) => {
  // get user and add custom claim to user


  return admin
    .auth()
    .verifyIdToken(data.id)
    .then((decodedToken) => {

      const claims = decodedToken.customClaims
      console.log(claims)
      if (claims['admin']) {
        return { admin: true }
      } else if (claims['agency']) {
        return { agency: true }
      } else {
        return {
          admin: false,
          agency: false
        }
      }
    })
    .catch((error) => {
      console.log(error.code,error.message)
    })
})

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
      uid: userRecord.uid
      // Add other fields as needed
    };

    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);

    // If user does not exist
    if (error.code === 'auth/user-not-found') {
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
    console.log('User Record:',userRecord);
    return userRecord

  } catch (error) {
    console.error('Error fetching user data:', error);

    // If user does not exist
    if (error.code === 'auth/user-not-found') {
      return {};
    }

    // Throw the error for other cases
    throw error;
  }
})

// get another user data by uid
exports.deleteUser = functions.https.onCall(async (data, context) => {
	try {
		// Check if the request is authorized (if needed)
		// if (!context.auth) {
		//   return { error: 'Unauthorized' };
		// }

		// Get the UID from the request data
		const uid = data.uid

		if (!uid) {
			console.log("User data not found")
			return { success: false, message: "User data not found" }
		} else {
			// Perform user deletion operation
			await admin.auth().deleteUser(uid)

			console.log("User deleted successfully on server side")
		}

		return { success: true, message: "User deleted successfully", userRecord }
	} catch (error) {
		console.error("Error deleting user:", error)
		return { success: false, message: "Error deleting user", error }
	}
})
