const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {getStorage} = require("firebase-admin/storage");
const mkdirp = require("mkdirp").mkdirp
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');
admin.initializeApp();
// [END import]
// File extension for the created JPEG files.
const JPEG_EXTENSION = '.jpg';
// [START generateThumbnail]
/**
 * When an image is uploaded in the Storage bucket,
 * generate a thumbnail automatically using sharp.
 */
// [START generateThumbnailTrigger]
exports.firstGenGenerateThumbnail = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const baseFileName = path.basename(filePath, path.extname(filePath));
  const fileDir = path.dirname(filePath);
  const JPEGFilePath = path.normalize(path.format({dir: fileDir, name: baseFileName, ext: JPEG_EXTENSION}));
  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);
  const tempLocalJPEGFile = path.join(os.tmpdir(), JPEGFilePath);

  // Exit if this is triggered on a file that is not an image.
  if (!object.contentType.startsWith('image/')) {
    functions.logger.log('This is not an image.');
    return null;
  }

  // Exit if the image is already a JPEG.
  if (object.contentType.startsWith('image/jpeg')) {
    functions.logger.log('Already a JPEG.');
    return null;
  }

  const bucket = admin.storage().bucket(object.bucket);
  // Create the temp directory where the storage file will be downloaded.
  await mkdirp(tempLocalDir);
  // Download file from bucket.
  await bucket.file(filePath).download({destination: tempLocalFile});
  functions.logger.log('The file has been downloaded to', tempLocalFile);
  // Convert the image to JPEG using ImageMagick.
  await spawn('convert', [tempLocalFile, tempLocalJPEGFile]);
  functions.logger.log('JPEG image created at', tempLocalJPEGFile);
  // Uploading the JPEG image.
  await bucket.upload(tempLocalJPEGFile, {destination: JPEGFilePath});
  functions.logger.log('JPEG image uploaded to Storage at', JPEGFilePath);
  // Once the image has been converted delete the local files to free up disk space.
  fs.unlinkSync(tempLocalJPEGFile);
  fs.unlinkSync(tempLocalFile);
  return null;
});
// [END generateThumbnail]

exports.addUserRole= functions.https.onCall((data, context)=> {
  // get user and add custom claim to user
  return admin.auth().getUserByEmail(data.email).then(user => {
    
    // Once user object is retrieved, updates custom claim
    return admin.auth().setCustomUserClaims(user.uid, {});
  
  // callback for frontend if success
  }).then(()=> {
    return {
      message: "Success! ${data.email} has been reset to user privileges."
    }

  // callback if there is an error
  }).catch(err => {
    return err;
  })

})

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


  return admin.auth().getUserByEmail(data.email).then((user) => {
    
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


  return admin
    .auth()
    .verifyIdToken(data.id)
    .then((decodedToken) => {
       
      const claims = decodedToken.customClaims;
      console.log(claims);
      if (claims['admin']) {
        return {admin: true};
      } else if (claims['agency']) {
        return {agency: true};
      } else {
        return {admin: false,
               agency: false};
      }
    })
    .catch((error) => {
        console.log(error.code, error.message);
    });
})
