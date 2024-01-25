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
exports.getUser = functions.https.onCall((data,context) => {
  try {
    // Check if the request is authorized (if needed)
    // if (!context.auth) {
    //   return { error: 'Unauthorized' };
    // }
    const userRecord = admin.auth().getUserByEmail(data)
      .then((response) => {
        // Extract relevant user data
        const userData = {
          displayName: response.displayName,
          email: response.email,
          uid: response.uid
          // Add other fields as needed
        }
        return userData
      })
    return userRecord
  } catch (error) {
    console.error('Error fetching user data:',error)

    // If user does not exist
    if (error.code === 'auth/user-not-found') {
      return {}
    }

    // Throw the error for other cases
    throw error
  }
})