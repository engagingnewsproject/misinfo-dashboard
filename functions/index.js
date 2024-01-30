const functions = require('firebase-functions')
const admin = require('firebase-admin')
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
  console.log(data)
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
exports.addAgencyRole = functions.https.onCall((data,context) => {
  // get user and add custom claim to user


  return admin.auth().getUserByEmail(data.email).then((user) => {

    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid,{ agency: true })

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
// exports.getUserByEmail = functions.https.onCall(async (data,context) => {
//   try {
//     // Check if the request is authorized (if needed)
//     // if (!context.auth) {
//     //   return { error: 'Unauthorized' };
//     // }
//     const email = data.email; // Extract email from data object
//     const userRecord = await admin.auth().getUserByEmail(email);
//     console.log('User Record:', userRecord);
//     const customToken = await admin.auth().createCustomToken(userRecord.uid)
//       .then((response) => {
//         // Extract relevant user data
//         console.log(`Successfully fetched user data: ${userRecord}`);
//         const userData = {
//           displayName: response.displayName,
//           email: response.email,
//           uid: response.uid,
//           idToken: customToken // Include the generated ID token in the response
//           // Add other fields as needed
//         }
//         return userData
//       })
//     return userRecord
//   } catch (error) {
//     console.error('Error fetching user data:',error)

//     // If user does not exist
//     if (error.code === 'auth/user-not-found') {
//       return {}
//     }

//     // Throw the error for other cases
//     throw error
//   }
// })

// new
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
    // const customToken = await admin.auth().createCustomToken(userRecord.uid);
    // // Generate ID token for the user
    // console.log(`Successfully fetched user data: ${ userRecord }`);
    // console.log(`custom cliams--> ${userRecord.customClaims['admin']}`);
    // const userData = {
    //   displayName: userRecord.displayName,
    //   email: userRecord.email,
    //   uid: userRecord.uid,
    //   idToken: customToken // Include the generated custom token in the response
    //   // Add other fields as needed
    // };
    // return userData;
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

exports.changeUserRole = functions.https.onCall(async (data, context) => {
    // Check if the request is coming from an authenticated user with admin privileges
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can change user roles.');
    }
  console.log(data)
    const { uid, newRole } = data;

    try {
        let customClaims = {};

        // Set custom claims based on the new role
        if (newRole === 'admin') {
            customClaims = { admin: true, agency: false };
        } else if (newRole === 'agency') {
            customClaims = { admin: false, agency: true };
        } else {
            // For roles other than admin or agency, set both claims to false
            customClaims = { admin: false, agency: false };
        }

        // Set custom claims to update the user's role
        await admin.auth().setCustomUserClaims(uid, customClaims);

        return { success: true };
    } catch (error) {
        console.error('Error changing user role:', error);
        throw new functions.https.HttpsError('internal', 'Failed to change user role.');
    }
});