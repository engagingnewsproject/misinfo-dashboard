const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mkdirp = require("mkdirp").mkdirp;
const spawn = require("child-process-promise").spawn;
const path = require("path");
const os = require("os");
const fs = require("fs");
admin.initializeApp();

// File extension for the created PNG files.
const PNG_EXTENSION = ".png";

exports.firstGenGenerateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const baseFileName = path.basename(filePath, path.extname(filePath));
    const fileDir = path.dirname(filePath);
    const PNGFilePath = path.normalize(
      path.format({ dir: fileDir, name: baseFileName, ext: PNG_EXTENSION })
    );
    const tempLocalFile = path.join(os.tmpdir(),filePath);
    functions.logger.log('1 '+tempLocalFile)
    const tempLocalDir = path.dirname(tempLocalFile);
    functions.logger.log('2 '+tempLocalDir)
    const tempLocalPNGFile = path.join(os.tmpdir(), PNGFilePath);
    functions.logger.log('3 '+tempLocalPNGFile)

    if (!object.contentType.startsWith("image/")) {
      functions.logger.log("4 This is not an image.");
      return null;
    }

    if (object.contentType.startsWith("image/png")) {
      functions.logger.log("5 Already a PNG.");
      return null;
    }

    const bucket = admin.storage().bucket(object.bucket);

    await mkdirp(tempLocalDir);

    await bucket.file(filePath).download({ destination: tempLocalFile });
    functions.logger.log("7 The file has been downloaded to", tempLocalFile);

    // Convert the image to PNG using ImageMagick.
    await spawn("convert", [tempLocalFile, tempLocalPNGFile]);
    functions.logger.log("8 PNG image created at", tempLocalPNGFile);

    // Uploading the PNG image.
    await bucket.upload(tempLocalPNGFile, { destination: PNGFilePath });
    functions.logger.log("9 PNG image uploaded to Storage at", PNGFilePath);
    // Confirm that the temporary files are being created:
    functions.logger.log("6 Temporary files created:", fs.existsSync(tempLocalPNGFile), fs.existsSync(tempLocalFile));
    // Delete the originally uploaded file.
    const originalFile = bucket.file(filePath);
    await originalFile.delete(); // This deletes the original image file.

    // confirm that the tempLocalPNGFile and tempLocalFile paths are correct and that the files exist before deletion.
    functions.logger.log("10 Deleting files:", tempLocalPNGFile, tempLocalFile);

    // Once the image has been converted, delete the local files to free up disk space.
    fs.unlinkSync(tempLocalPNGFile);
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
