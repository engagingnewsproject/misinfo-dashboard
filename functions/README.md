# Cloud Functions

## Set up Node.js and the Firebase CLI

#### DOCS LINK: [Get started: write, test, and deploy your first functions](https://firebase.google.com/docs/functions/get-started?gen=1st)

#### EXAMPLE: [Image processing example](https://github.com/firebase/functions-samples/tree/main/Node-1st-gen/quickstarts/thumbnails)

You'll need the Firebase CLI to deploy functions to the Cloud Functions runtime. For installing Node.js and [npm](https://www.npmjs.org/), [Node Version Manager](https://github.com/creationix/nvm/blob/master/README.md) is recommended.

Once you have Node.js and npm installed, install the Firebase CLI via your preferred method. To install the CLI via npm, use:

```
npm install -g firebase-tools
```

This installs the globally available firebase command. If the command fails, you may need to change npm permissions. To update to the latest version of firebase-tools, rerun the same command.

## Initialize your project:

1. Run `firebase login` to log in via the browser and authenticate the Firebase CLI.

2. Go to your Firebase project directory.

3. Run `firebase init` firestore.

4. Run `firebase init functions`. The CLI prompts you to choose an existing codebase or initialize and name a new one.

5. Select `javascript` for language support:

6. The CLI gives you an option to install dependencies with npm. It is safe to decline if you want to manage dependencies in another way, though if you do decline you'll need to run npm install before emulating or deploying your functions.

## Emulate execution of your functions

The [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite) allows you to build and test apps on your local machine instead of deploying to a Firebase project. Local testing during development is strongly recommended.

### To emulate your functions:

Run `firebase emulators:start` and check the output for the URL of the Emulator Suite UI. It defaults to localhost:4000, but may be hosted on a different port on your machine. Enter that URL in your browser to open the Emulator Suite UI.

## Deploy functions to a production environment
Once your functions are working as desired in the emulator, you can proceed to deploying.

Run this command to deploy your functions:

```
firebase deploy --only functions
```
