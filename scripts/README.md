# Firebase Emulator User Seeding Script

This script creates multiple test users in the Firebase Authentication emulator and corresponding documents in the Firestore emulator.

## Prerequisites

1. **Firebase emulator must be running** - Make sure you've started the Firebase emulator suite
2. **Service account key** - The script uses your existing Firebase service account key
3. **Node.js dependencies** - Ensure `firebase-admin` and `moment` are installed

## Execution Location

**Run the script from the project root directory** (`/Users/lukey/Sites/UT/misinfo-dashboard/`):

```bash
# Make sure you're in the project root
cd /Users/lukey/Sites/UT/misinfo-dashboard

# Then run the seeding script
yarn seed-users
```

## Usage

### Method 1: Using yarn script (Recommended)
```bash
yarn seed-users
```

### Method 2: Direct execution
```bash
node scripts/seed-users.js
```

## What the Script Does

1. **Creates Firebase Auth users** with:
   - Email and password authentication
   - Display names
   - Email verification set to `true` (skips verification step)
   - Unique UIDs

2. **Creates Firestore documents** in the `mobileUsers` collection with:
   - User profile information
   - Role assignments (User, Admin, Moderator, Agency)
   - Location data (state, city)
   - Contact information
   - Joining date timestamp
   - Ban status (set to `false`)

## Test Users Created

The script creates 13 test users with different roles:

### Regular Users (10 users)
- `testuser1@example.com` through `testuser10@example.com`
- Password: `password123`
- Role: `User`
- Various US states and cities

### Admin Users (1 user)
- `admin1@example.com`
- Password: `password123`
- Role: `Admin`

### Moderator Users (1 user)
- `moderator1@example.com`
- Password: `password123`
- Role: `Moderator`

### Agency Users (1 user)
- `agency1@example.com`
- Password: `password123`
- Role: `Agency`

## Customizing Users

To modify the test users, edit the `users` array in `scripts/seed-users.js`:

```javascript
const users = [
  {
    email: 'your-email@example.com',
    password: 'your-password',
    displayName: 'Your Name',
    role: 'User', // or 'Admin', 'Moderator', 'Agency'
    state: 'Your State',
    city: 'Your City',
    contact: '+1-555-0123'
  },
  // Add more users...
];
```

## Output

The script provides detailed console output showing:
- Progress for each user creation
- Success/failure status
- Summary of results
- Any error messages

Example output:
```
🌱 Starting user seeding process...
📊 Total users to create: 13

[1/13] Processing: testuser1@example.com
✅ Created Auth user: testuser1@example.com (UID: abc123...)
✅ Created Firestore document for: testuser1@example.com
✅ Successfully created: testuser1@example.com

📋 SEEDING SUMMARY
==================
✅ Successful: 13
❌ Failed: 0

🎉 User seeding completed!
```

## Troubleshooting

### Common Issues

1. **"Firebase emulator not running"**
   - Start the Firebase emulator: `firebase emulators:start`

2. **"Service account key not found"**
   - Ensure `misinfo-5d004-firebase-adminsdk-2ubvq-135d27238a.json` exists in the project root

3. **"User already exists"**
   - The script will show an error but continue with other users
   - You can delete existing users through the Firebase emulator UI

4. **"Firestore connection failed"**
   - Ensure the Firestore emulator is running on port 8080
   - Check your `firebase.json` emulator configuration

### Verification

After running the script, you can verify the users were created by:

1. **Firebase Emulator UI**: Visit `http://localhost:4000` and check the Authentication and Firestore sections
2. **Your application**: Try logging in with any of the test user credentials
3. **Admin panel**: Check your app's user management interface

## Security Note

⚠️ **Important**: This script is designed for development/testing only. The test users have simple passwords and should never be used in production environments.
