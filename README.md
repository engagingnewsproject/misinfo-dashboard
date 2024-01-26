### [Misinfo Dashboard Documentation](https://center-for-media-engagement.gitbook.io/misinfo-dashboard/)

#### [Edit Misinfo Dashboard Documentation GitBook](https://app.gitbook.com/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/)

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

> If you have not installed firebase tools to run the emulator run `npm install -g firebase-tools`.

Next, to run the app on the emulator and import the db testing data, in a new terminal window run 

```bash
firebase emulators:start --import=./emulator-data
``` 

emulator should start and provide you an emulator link `View Emulator UI at`. Open that link and add yourself as a user under the Authentication tab. You only need to provide a name, email and password when adding a user. 

Emulator UI:
![emulator-ui](https://media.github.austin.utexas.edu/user/3619/files/1012c2ee-b9b2-4529-8914-2e0455af9bda)

You can also assign a role (reccommended) in the Custom Claims input:
- Admin role: `{"role":"admin"}`
- Agency role: `{"role":"agency"}`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. If you have the emulator running you will see a banner `Running in emulator mode. Do not use with production credentials.` at the bottom of your screen as well as Console log messages letting you know that the emulator is running:

![emulator-running](https://media.github.austin.utexas.edu/user/3619/files/fa9f1c63-1f3a-4dd2-b0d3-2ca3ab6b86f0)

# Emulator Notes

[Firebase Emulator Docs](https://firebase.google.com/docs/emulator-suite/connect_and_prototype?database=Firestore)

### Emulator UI
- Database: find the imported database under the Emulator UI / Firestore tab.
- Users: view, add, edit & delete users under the Authentication tab.
- Files & Uploads: Storage tab in the Emulator UI.

### Users

Your user UID that you created will not be associated with any reports or agencies so you can either add reports via the Misinfo Dashboard in your localhost:3000 window or go into the Emulator UI and manually change the `userID` to your own for some reports. Same idea with assigning your user to an agency: go into the Emulator UI and add your email to an agency's `agencyUsers` field.

### Emulator log files

Emulator creates log files (`firebase-debug.log` & `ui-debug.log`) when you boot up the emulator. No need to push those with git. 



## Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Usefull Tools

- [Chrome React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [VS Code ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)
- [VS Code Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## Firebase

With proper permissions access [Firebase Console](https://console.firebase.google.com/) or [Firebase Cloud Console](https://console.cloud.google.com/welcome?project=misinfo-5d004).

- Firebase project name: Misinfo
- Firebase project ID: misinfo-5d004
- Firebase project #: 2581605663

### Firebase Storage

- Firebase storage name: misinfo-5d004.appspot.com
### Firebase CLI Tools

[Guide on how to push rules using the CLI](https://firebase.google.com/docs/firestore/security/get-started#use_the_firebase_cli)

## Modals

* [React URL Modal](https://github.com/remoteoss/react-url-modal)

#### Sync with the caet-saga repo

* [Syncing a fork branch from the command line](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork#syncing-a-fork-branch-from-the-command-line)
* [Netlify dashboard for CME Misinfo Dashboard](https://app.netlify.com/sites/misinfo-dashboard/overview)
* [Live CME Misinfo Dashboard](https://misinfo-dashboard.netlify.app/dashboard)

1.  Fetch the branches and their respective commits from the upstream repository

    `git fetch upstream`
2.  Check out your fork's local default branch

    `git checkout main`
3.  Merge the changes from the upstream default branch

    `git merge upstream/main`
4.  Push your changes

    `git push origin main`

## [Misinfo Dashboard Documentation](http://localhost:5000/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/)

# TESTING Firebase Dev Project

- Project name: misinfo-dashboard-dev
- Project ID: misinfo-dashboard-dev

## Deploy Firebase Functions

`firebase deploy -P dev  --only functions:misinfo-dashboard-dev`

<!-- TODO: fix netlify deployment issue with yarn file -->
