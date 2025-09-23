#!/usr/bin/env node

/**
 * @fileoverview Firebase Emulator User Seeding Script
 * 
 * This script creates multiple test users in the Firebase Authentication emulator
 * and corresponding documents in the Firestore emulator for the mobileUsers collection.
 * 
 * Usage: npm run seed-users
 * Requirements: Firebase emulator must be running
 * 
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 */

const admin = require('firebase-admin');
const path = require('path');
const moment = require('moment');

// Initialize Firebase Admin with your service account
const serviceAccountPath = path.join(__dirname, '..', 'misinfo-5d004-firebase-adminsdk-2ubvq-135d27238a.json');
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Configure Firebase Admin to use emulators
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const db = admin.firestore();

// Log emulator configuration
console.log('🔧 Configuring Firebase Admin for emulators...');
console.log('   Auth emulator: localhost:9099');
console.log('   Firestore emulator: localhost:8080');

// Sample users data - you can modify this array as needed
const users = [
  {
    email: 'testuser1@example.com',
    password: 'password123',
    displayName: 'Alice Johnson',
    role: 'User',
    state: 'Texas',
    city: 'Austin',
    contact: '+1-555-0101'
  },
  {
    email: 'testuser2@example.com',
    password: 'password123',
    displayName: 'Bob Smith',
    role: 'User',
    state: 'Texas',
    city: 'Houston',
    contact: '+1-555-0102'
  },
  {
    email: 'testuser3@example.com',
    password: 'password123',
    displayName: 'Carol Davis',
    role: 'User',
    state: 'California',
    city: 'Los Angeles',
    contact: '+1-555-0103'
  },
  {
    email: 'testuser4@example.com',
    password: 'password123',
    displayName: 'David Wilson',
    role: 'User',
    state: 'New York',
    city: 'New York City',
    contact: '+1-555-0104'
  },
  {
    email: 'testuser5@example.com',
    password: 'password123',
    displayName: 'Eva Martinez',
    role: 'User',
    state: 'Florida',
    city: 'Miami',
    contact: '+1-555-0105'
  },
  {
    email: 'testuser6@example.com',
    password: 'password123',
    displayName: 'Frank Anderson',
    role: 'User',
    state: 'Illinois',
    city: 'Chicago',
    contact: '+1-555-0106'
  },
  {
    email: 'testuser7@example.com',
    password: 'password123',
    displayName: 'Grace Taylor',
    role: 'User',
    state: 'Washington',
    city: 'Seattle',
    contact: '+1-555-0107'
  },
  {
    email: 'testuser8@example.com',
    password: 'password123',
    displayName: 'Henry Brown',
    role: 'User',
    state: 'Colorado',
    city: 'Denver',
    contact: '+1-555-0108'
  },
  {
    email: 'testuser9@example.com',
    password: 'password123',
    displayName: 'Ivy Chen',
    role: 'User',
    state: 'Nevada',
    city: 'Las Vegas',
    contact: '+1-555-0109'
  },
  {
    email: 'testuser10@example.com',
    password: 'password123',
    displayName: 'Jack Thompson',
    role: 'User',
    state: 'Arizona',
    city: 'Phoenix',
    contact: '+1-555-0110'
  },
  {
    email: 'admin1@example.com',
    password: 'password123',
    displayName: 'Admin User',
    role: 'Admin',
    state: 'Texas',
    city: 'Austin',
    contact: '+1-555-0201'
  },
  {
    email: 'moderator1@example.com',
    password: 'password123',
    displayName: 'Moderator User',
    role: 'Moderator',
    state: 'California',
    city: 'San Francisco',
    contact: '+1-555-0202'
  },
  {
    email: 'agency1@example.com',
    password: 'password123',
    displayName: 'Agency Representative',
    role: 'Agency',
    state: 'New York',
    city: 'Albany',
    contact: '+1-555-0301'
  }
];

/**
 * Creates a user in Firebase Authentication
 * @param {Object} userData - User data object
 * @returns {Promise<Object>} Created user record
 */
async function createAuthUser(userData) {
  try {
    const userRecord = await admin.auth().createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: true // Skip email verification for test users
    });
    
    console.log(`✅ Created Auth user: ${userData.email} (UID: ${userRecord.uid})`);
    return userRecord;
  } catch (error) {
    console.error(`❌ Failed to create Auth user ${userData.email}:`, error.message);
    throw error;
  }
}

/**
 * Creates a mobileUsers document in Firestore
 * @param {string} uid - User's UID from Auth
 * @param {Object} userData - User data object
 * @returns {Promise<void>}
 */
async function createFirestoreUser(uid, userData) {
  try {
    const userDoc = {
      name: userData.displayName,
      email: userData.email,
      joiningDate: moment().utc().unix(),
      state: userData.state,
      city: userData.city,
      isBanned: false,
      userRole: userData.role,
      contact: userData.contact
    };

    await db.collection('mobileUsers').doc(uid).set(userDoc);
    console.log(`✅ Created Firestore document for: ${userData.email}`);
  } catch (error) {
    console.error(`❌ Failed to create Firestore document for ${userData.email}:`, error.message);
    throw error;
  }
}

/**
 * Main function to seed users
 */
async function seedUsers() {
  console.log('🌱 Starting user seeding process...');
  console.log(`📊 Total users to create: ${users.length}`);
  console.log('');
  
  // Test Firebase connection first
  try {
    console.log('🔍 Testing Firebase connection...');
    const testUser = await admin.auth().listUsers(1);
    console.log('✅ Firebase Auth connection successful');
  } catch (error) {
    console.error('❌ Firebase Auth connection failed:', error.message);
    console.error('💡 Make sure Firebase emulator is running on port 9099');
    throw error;
  }
  
  // Test Firestore connection
  try {
    console.log('🔍 Testing Firestore connection...');
    const testDoc = await db.collection('test').doc('connection-test').get();
    console.log('✅ Firestore connection successful');
  } catch (error) {
    console.error('❌ Firestore connection failed:', error.message);
    console.error('💡 Make sure Firebase emulator is running on port 8080');
    throw error;
  }
  
  console.log('');

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    console.log(`[${i + 1}/${users.length}] Processing: ${userData.email}`);
    
    try {
      // Create user in Firebase Auth
      const userRecord = await createAuthUser(userData);
      
      // Create corresponding Firestore document
      await createFirestoreUser(userRecord.uid, userData);
      
      results.success++;
      console.log(`✅ Successfully created: ${userData.email}`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: userData.email,
        error: error.message
      });
      console.log(`❌ Failed to create: ${userData.email}`);
    }
    
    console.log(''); // Add spacing between users
  }

  // Print summary
  console.log('📋 SEEDING SUMMARY');
  console.log('==================');
  console.log(`✅ Successful: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 Errors:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.email}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 User seeding completed!');
  
  // Exit process with proper status
  if (results.failed > 0) {
    console.log(`⚠️  Warning: ${results.failed} users failed to create`);
    process.exit(1);
  } else {
    console.log('✅ All users created successfully!');
    process.exit(0);
  }
}

// Handle script execution
if (require.main === module) {
  seedUsers().catch((error) => {
    console.error('💥 Fatal error during seeding:', error);
    process.exit(1);
  });
}

module.exports = { seedUsers, users };
