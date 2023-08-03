const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();


// Adds admin privilege to user based on the email provided
exports.addAdminRole = functions.https.onCall((data, context)=> {
  // get user and add custom claim to user
  return admin.auth().getUserByEmail(data.email).then(user => {
    
    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid, {admin: true});
  
  // callback for frontend if success
  }).then(()=> {
    return {
      message: "Success! ${data.email} has been made an admin"
    }

  // callback if there is an error
  }).catch(err => {
    return err;
  })

})


// Adds agency privilege to user based on email provided
exports.addAgencyRole = functions.https.onCall((data, context)=> {
  // get user and add custom claim to user


  return admin.auth().getUserByEmail(data.email).then(user => {
    
    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid, {agency: true});
  
  // callback for frontend if success
  }).then(()=> {
    return {
      message: "Success! ${data.email} has been made an admin"
    }

  // callback if there is an error
  }).catch(err => {
    return err;
  })

})


exports.viewRole = functions.https.onCall((data, context)=> {
  // get user and add custom claim to user
  return admin.auth().getUserByEmail(data.email).then(user => {
    
    // Once user object is retrieved, returns  custom claim
    admin.auth().currentUser.getIdTokenResult()
    .then((idTokenResult) => {
      return idTokenResult.claims;
  // callback for frontend if success
    })

  })
  .catch(err => {
    return err;
  })

})
