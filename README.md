# Misinfo Dashboard

[![Netlify Status](https://api.netlify.com/api/v1/badges/fdc485eb-e749-4f9d-8b5d-6db9afd8ee8f/deploy-status)](https://app.netlify.com/sites/misinfo-dashboard/deploys)

This project project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) of the [Next.js](https://nextjs.org/) framework. To learn more about Next.js features and API, take a look at [Next.js Documentation](https://nextjs.org/docs).

## Getting Started

#### 1. Clone

Clone this repo to a local directory and run `yarn install` from the root to install dependencies. 
  > do not use `npm install` because using this install command will create a `package-lock.json` file which Netlify, that serves the live site, does not support.

#### 2. Add `.env` file at project root

In order to be authenticated with the Firebase Project you must have the `.env` file with the Firebase credentials at the root of your project. Reach out to the project lead (currently [Luke](https://github.com/luukee)) to get the `.env` file contents.

#### 3. Run Firebase Emulator

> If you have not installed firebase tools to run the emulator run `npm install -g firebase-tools`.

Next, to run the app on the emulator and import the db testing data, in a new terminal window run 

```bash
firebase emulators:start --import=./emulator-data
``` 

The Firebase Emulator should boot up and provide you an emulator link `View Emulator UI at`. Open that link to view the Emulator UI:

![emulator-ui](https://media.github.austin.utexas.edu/user/3619/files/1012c2ee-b9b2-4529-8914-2e0455af9bda)

#### 4. Add yourself as a user under the Emulator Authentication tab. 

You only need to provide a name, email and password when adding a general user. You can also assign roles to other users you add in the _"Custom Claims"_ input:
- Admin role: `{"admin":true}`
- Agency role: `{"agency":true}`

You can also signup like a normal user at the Login/Signup page. Once you have signed up 

- Open the link printed out in your Emulator terminal window. _all you need to do is open the link_
- Now you can return to your initial Signup tab and login with the credentials you signed up with.

#### 5. Start dev server

To boot up the development server run:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. If you have the emulator running you will see a banner `Running in emulator mode. Do not use with production credentials.` at the bottom of your screen as well as Console log messages letting you know that the emulator is running:

![emulator-running](https://media.github.austin.utexas.edu/user/3619/files/fa9f1c63-1f3a-4dd2-b0d3-2ca3ab6b86f0)

> NOTE: You will have a lot of windows/tabs open while developing:
- > 1 terminal tab for `npm run dev`, 
- > 1 terminal tab for `firebase emulators:start --import=./emulator-data`. 
- > 1 browser tab for `localhost:3000`, 
- > 1 browser tab for `Emulator UI`

Develop away! And good luck :)

## Emulator Notes:

#### Emulator UI
- Database: find the imported database under the Emulator UI / Firestore tab.
- Users: view, add, edit & delete users under the Authentication tab.
- Files & Uploads: Storage tab in the Emulator UI.

#### Users

Your user UID that you created will not be associated with any reports or agencies so you can either add reports via the Misinfo Dashboard in your localhost:3000 window or go into the Emulator UI and manually change the `userID` to your own for some reports. Same idea with assigning your user to an agency: go into the Emulator UI and add your email to an agency's `agencyUsers` field.

#### Emulator log files

Emulator creates log files (`firebase-debug.log` & `ui-debug.log`) when you boot up the emulator. No need to push those with git. 

## Firebase Functions

To deploy Firebase functions:

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

Links: [Chrome React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) || [VS Code React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets) || [VS Code Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## Project Lead Notes

#### Project Lead: Push to Netlify live site

To sync with the [Engaging News Project's misinfo-dashboard-prod](https://github.com/engagingnewsproject/misinfo-dashboard-prod) repo once the caet-saga repo's `main` branch is approved and working.

#### Project Lead: Sync with the caet-saga repo

Fetch upstream branch from caet-saga into the CME misinfo-dashboard-production repo's `dev` branch to validate changes on the misinfo-dev site. Then from CME misinfo-dashboard-production repo create a pull request to merge the `dev` branch into `main`.

1.  Fetch the branches and their respective commits from the upstream repository

    `git fetch upstream`
2.  Check out your fork's local `dev` branch

    `git checkout dev`
3.  Merge the changes from the upstream default(`main`) branch

    `git merge upstream/main`
4.  Push your changes to the CME `dev` branch

    `git push origin dev`
    
    ** If you get a `remote: error: File firestore-debug.log is 102.65 MB; this exceeds GitHub's file size limit of 100.00 MB` run these commands:
    
      `git lfs install` - make sure git large file storage is installed
      
      `git lfs track "firestore-debug.log"` - to track the large file
      
      `git lfs migrate import --include="firestore-debug.log" --everything` - convert the file types to LFS
      
      `git lfs ls-files` - to list files
      
      `git lfs checkout` -  files can be repopulated with their full expected contents [lfs docs](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-migrate.adoc?utm_source=gitlfs_site&utm_medium=doc_man_migrate_link&utm_campaign=gitlfs#examples)
    
5.  If everything looks good on the dev site go to CME's misinfo-dashboard-production repo & create a pull request to merge `dev` into `main`. If all checks pass complete the pull request.

Links: [Syncing fork branch](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork#syncing-a-fork-branch-from-the-command-line) | [Netlify dashboard](https://app.netlify.com/sites/misinfo-dashboard/overview)

Project Lead Links: [Firebase CLI Tools](https://firebase.google.com/docs/firestore/security/get-started#use_the_firebase_cli) || [Firebase Console](https://console.firebase.google.com/) || [Firebase Cloud Console](https://console.cloud.google.com/welcome?project=misinfo-5d004) || [Syncing a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork#syncing-a-fork-branch-from-the-command-line) || [Netlify dashboard](https://app.netlify.com/sites/misinfo-dashboard/overview) || [ENP Prod Repo](https://github.com/engagingnewsproject/misinfo-dashboard-prod)

## Docs

#### [Deprecated: Misinfo Dashboard Documentation GitBook](https://app.gitbook.com/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/)
