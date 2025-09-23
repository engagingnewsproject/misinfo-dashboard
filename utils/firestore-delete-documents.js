const admin = require('firebase-admin')
const readline = require('readline')
const serviceAccount = require('./misinfo-5d004-firebase-adminsdk-2ubvq-135d27238a.json') // Replace with your service account file path

// process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080' // Comment out for production

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function deleteTestDocuments() {
  const collectionRef = db.collection('reports') // Replace with your collection name
  const query = collectionRef
    .where('userID', '==', 'FKSpyOwuX6JoYF1fyv6b')
    .where('label', '==', '')
    .where('secondLink', '==', '')
		.where('topic','==','')

  try {
    const snapshot = await query.get()

    if (snapshot.empty) {
      console.log('No matching documents found.')
      return
    }

    const batch = db.batch()
    snapshot.forEach((doc) => {
      batch.delete(doc.ref)
      console.log(`Scheduled deletion for document: ${doc.id}`)
    })

    await batch.commit()
    console.log('Test deletion of specific documents completed successfully.')
  } catch (error) {
    console.error('Error deleting documents:', error)
  }
}

// Confirmation prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('Are you sure you want to delete these test documents from production? (yes/no) ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    deleteTestDocuments()
      .then(() => console.log('Deletion completed.'))
      .catch((error) => console.error('Error during deletion:', error))
      .finally(() => rl.close())
  } else {
    console.log('Operation canceled.')
    rl.close()
  }
})