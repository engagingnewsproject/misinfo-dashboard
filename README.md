# Misinfo Dashboard

[![Netlify Status](https://api.netlify.com/api/v1/badges/fdc485eb-e749-4f9d-8b5d-6db9afd8ee8f/deploy-status)](https://app.netlify.com/sites/misinfo-dashboard/deploys)

This project is based off of the Next.js framework to learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

In order to be authenticated with the Firebase Project you must have a `.env` file with the Firebase credentials. Reach out to the project lead (currently [Luke](https://github.com/luukee)).

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
- Admin role: `{"admin":true}`
- Agency role: `{"agency":true}`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. If you have the emulator running you will see a banner `Running in emulator mode. Do not use with production credentials.` at the bottom of your screen as well as Console log messages letting you know that the emulator is running:

![emulator-running](https://media.github.austin.utexas.edu/user/3619/files/fa9f1c63-1f3a-4dd2-b0d3-2ca3ab6b86f0)

> You will have a lot of windows/tabs open while developing: Terminal: 1 tab for `npm run dev`, 1 tab for `firebase emulators:start --import=./emulator-data`. Browser: 1 tab for `localhost:3000`, 1 tab for `Emulator UI`

#### Emulator Notes

[Firebase Emulator Docs](https://firebase.google.com/docs/emulator-suite/connect_and_prototype?database=Firestore)

#### Emulator UI
- Database: find the imported database under the Emulator UI / Firestore tab.
- Users: view, add, edit & delete users under the Authentication tab.
- Files & Uploads: Storage tab in the Emulator UI.

#### Users

Your user UID that you created will not be associated with any reports or agencies so you can either add reports via the Misinfo Dashboard in your localhost:3000 window or go into the Emulator UI and manually change the `userID` to your own for some reports. Same idea with assigning your user to an agency: go into the Emulator UI and add your email to an agency's `agencyUsers` field.

#### Emulator log files

Emulator creates log files (`firebase-debug.log` & `ui-debug.log`) when you boot up the emulator. No need to push those with git. 

Deploy Firebase functions:

```bash
firebase deploy --only functions
```

#### Firebase Creds

With proper permissions access Firebase Console or Firebase Cloud Console.

- Firebase project name: Misinfo
- Firebase project ID: misinfo-5d004
- Firebase project #: 2581605663

#### Firebase Storage

- Firebase storage name: misinfo-5d004.appspot.com

#### Firebase Links

[Firebase CLI Tools](https://firebase.google.com/docs/firestore/security/get-started#use_the_firebase_cli) || [Firebase Console](https://console.firebase.google.com/) || [Firebase Cloud Console](https://console.cloud.google.com/welcome?project=misinfo-5d004)

# Push to Netlify live site

To sync with the [Engaging News Project's misinfo-dashboard-prod](https://github.com/engagingnewsproject/misinfo-dashboard-prod/settings) repo once the caet-saga repo's `main` branch is approved and working.

1.  Push main to the prod repo

    `git push prod main`

2.  Verify your push is working without errors on the [Netlify Dashboard](https://app.netlify.com/sites/misinfo-dashboard/overview)

_If you do not have the `prod` remote repo set up run:_

```
git remote add prod https://github.com/engagingnewsproject/misinfo-dashboard-prod.git
```

#### Links

[Syncing a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork#syncing-a-fork-branch-from-the-command-line) || [Netlify dashboard](https://app.netlify.com/sites/misinfo-dashboard/overview) || [ENP Prod Repo](https://github.com/engagingnewsproject/misinfo-dashboard-prod) || [Misinfo Dashboard Documentation](http://localhost:5000/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/)

<!-- TODO: fix netlify deployment issue with yarn file -->
## Usefull Tools

[Chrome React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) || [VS Code React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets) || [VS Code Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

# Docs

#### [Edit Misinfo Dashboard Documentation GitBook](https://app.gitbook.com/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/)
