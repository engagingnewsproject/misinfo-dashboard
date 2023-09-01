const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const path = require("path");

// library for resizing images
const sharp = require("sharp");
// [END import]

// [START generateThumbnail]
/**
 * When an image is uploaded in the Storage bucket,
 * generate a thumbnail automatically using sharp.
 */
// [START generateThumbnailTrigger]
exports.firstGenGenerateThumbnail = functions.storage.object().onFinalize(async (object) => {
// [END generateThumbnailTrigger]
  // [START eventAttributes]
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const contentType = object.contentType; // File content type.
  // [END eventAttributes]

  // [START stopConditions]
  // Exit if this is triggered on a file that is not an image.
  if (!contentType.startsWith('image/')) {
    return functions.logger.log('This is not an image.');
  }

  // Get the file name.
  const fileName = path.basename(filePath);
  // Exit if the image is already a thumbnail.
  if (fileName.startsWith('thumb_')) {
    return functions.logger.log('Already a Thumbnail.');
  }
  // [END stopConditions]

  // [START thumbnailGeneration]
  // Download file from bucket.
  const bucket = admin.storage().bucket(fileBucket);
  const metadata = {
    contentType: contentType,
  };
  const downloadResponse = await bucket.file(filePath).download();
  const imageBuffer = downloadResponse[0];
  functions.logger.log("Image downloaded!");

  // Generate a thumbnail using sharp.
  const thumbnailBuffer = await sharp(imageBuffer).resize({
    width: 200,
    height: 200,
    withoutEnlargement: true,
  }).toBuffer();
  functions.logger.log("Thumbnail created");

  // Upload the thumbnail with a 'thumb_' prefix.
  const thumbFileName = `thumb_${fileName}`;
  const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
  await bucket.file(thumbFilePath).save(thumbnailBuffer, {
    metadata: metadata,
  });
  return functions.logger.log("Thumbnail uploaded!");
  // [END thumbnailGeneration]
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
