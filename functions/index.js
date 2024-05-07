const functions = require('firebase-functions')
const admin = require('firebase-admin')
const sgMail = require('@sendgrid/mail')

admin.initializeApp()

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

// // Initialize SendGrid API with your SendGrid API key from environment variables
sgMail.setApiKey(functions.config().sendgrid.api_key);

// Firestore trigger to send email when a new document is added to helpRequests collection
exports.sendHelpRequestEmail = functions.firestore.document('helpRequests/{requestId}')
    .onCreate((snap, context) => {
        // Get the data of the newly added document
        const requestData = snap.data();

        // Get the user's email from the data (adjust according to your data structure)
        const userEmail = requestData.email;
        
        // Define recipients
        const recipients = ['luke@lukecarlhartman.com', 'mediaengagement@austin.utexas.edu']; // Add more recipients as needed

        // Send the email
        return sendEmail(userEmail, recipients, requestData);
    });
    
// Function to send email
function sendEmail(email, recipients, requestData) {
  // Check if email exists
  if (!email) {
      console.log("Email not provided");
      return;
  }

  // Set up image data
  let imageHTML = '';
  if (requestData.images && requestData.images.length > 0) {
      imageHTML = '<p><strong>Images:</strong></p>';
      requestData.images.forEach((imageUrl, index) => {
          imageHTML += `<p><img src="${imageUrl}" alt="Image ${index + 1}" style="max-width: 100%; height: auto;"></p>`;
      });
  }
  // Set up message data
    const msg = {
        to: recipients,
        from: 'luke@lukecarlhartman.com',
        subject: 'New Help Request Submitted',
        html: `
            <p>Hello Misinfo Administrator,</p>
            <p>A new help request has been submitted with the following details:</p>
            <ul>
                <li><strong>User ID:</strong> ${requestData.userID}</li>
                <li><strong>Created Date:</strong> ${requestData.createdDate.toDate().toLocaleString()}</li>
                <li><strong>Subject:</strong> ${requestData.subject}</li>
                <li><strong>Message:</strong> ${requestData.message}</li>
                <!-- Add other fields as needed -->
            </ul>
            ${imageHTML}
            <p>Thank you.</p>
        `
    };

  // Send email using SendGrid
  return sgMail.send(msg)
      .then(() => {
          console.log("Email sent successfully");
      })
      .catch(error => {
          console.error("Error sending email:", error.toString());
      });
}
