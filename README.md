# Misinfo Dashboard

[![Netlify Status](https://api.netlify.com/api/v1/badges/fdc485eb-e749-4f9d-8b5d-6db9afd8ee8f/deploy-status)](https://app.netlify.com/sites/misinfo-dashboard/deploys)

This project project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) of the [Next.js](https://nextjs.org/) framework. To learn more about Next.js features and API, take a look at [Next.js Documentation](https://nextjs.org/docs).

## Already set up?

Simple. Run two commands in separate terminal tabs:

```
firebase emulators:start --import=./emulator-data
```

and...

```
yarn dev
```

Not set up? Keep reading...

## Getting Started

### 1. Clone repo

First step! Clone this repo into a local directory (ex. `~/username/sites/`) on your machine.

- From the command line in your project root run:

    ```
    git clone https://github.com/engagingnewsproject/misinfo-dashboard.git
    ```
 
### 2. Install Packages

Install/update [`yarn`](https://yarnpkg.com/) package manager on your machine ([installation docs](https://yarnpkg.com/getting-started/install))
  
- Start by enabling [Corepack](https://yarnpkg.com/corepack), if it isn't already; this will add the `yarn` binary to your PATH:

    ```
    corepack enable
    ```

- From the root of the project install dependencies by running:
        
    ```
    yarn install
    ```
  
    > _**Why not `npm install`?** Glad you asked! [Netlify](https://www.netlify.com/), the service that hosts the dashboard, will not allow us to upload updates because `npm install` creates a `package-lock.json` file. Netlify doesn't like `package-lock.json` files._

### 3. Add Firebase configuration

In order to be authenticated with the Firebase Project you must have the `.env` file (which contains the Firebase credentials) at the root of your project. To get the contents of the `.env` file reach out to the project lead (currently [Luke](https://github.com/luukee)).

### 4. Install and run Firebase Emulator

Firebase Emulator is included in the [Firebase Tools](https://www.npmjs.com/package/firebase-tools) package. You can install Firebase Tools by running:

```
curl -sL firebase.tools | bash
```

Next, to run the app on the emulator and import the testing db data, in a _new_ terminal tab run: 

```
firebase emulators:start --import=./emulator-data
``` 

> _If you get `command not found` you might have to be added as a user for the Firebase project. Contact the lead developer to do this for you. Or contact mediaengagement@austin.utexas.edu_

The Firebase Emulator should boot up and provide you an emulator link (look for `View Emulator UI at` in your command line output). 

Open that link to view the Emulator UI:

![emulator-ui](https://media.github.austin.utexas.edu/user/3619/files/1012c2ee-b9b2-4529-8914-2e0455af9bda)


### 5. Add yourself as a user via the "Emulator Authentication" tab. 

#### Two options:

1. Option one: Manually add yourself

   From the Firebase Emulator UI select the "Emulator Authentication" tab and click "Add user". Only required fields are: `name`, `email` and `password`. Change your role? see _Available user roles_ below.

2. Option two: Sign up.

   You can also signup like a normal user at the Login/Signup page. Once you have signed up:

    - Open the link printed out in your Emulator terminal window. 
      - **_all you need to do is open the link._ Once you've opened the link close the tab and...
    - Return to your initial Signup tab and login with the credentials you signed up with. Change your role? see _Available user roles_ below.

#### Available user roles:

- *General User:*
    
    No additional configuration required.
    
- *Agency User:*

    In the "Custom Claims" input enter `{"agency":true}` & save.

- *Admin User:*

    In the "Custom Claims" input enter `{"admin":true}` & save.
    
### 6. Start dev server

To boot up the development server run:

```
yarn dev
# or
npm run dev
```

> _If you open `http://localhost:3000` and you see the "unhandled error" `FirebaseError: Failed to get document because the client is offline.` this means you have not started the Firebase Emulator. Return to step #4 to Install and run the Firebase Emulator._

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. If you have the emulator running you will see a banner `Running in emulator mode. Do not use with production credentials.` at the bottom of your screen as well as Console log messages letting you know that the emulator is running:

![emulator-running](https://media.github.austin.utexas.edu/user/3619/files/fa9f1c63-1f3a-4dd2-b0d3-2ca3ab6b86f0)

> NOTE: You will have 2 terminal tabs running while developing:
- > 1 terminal tab for `yarn dev` (or `npm run dev`), 
- > 1 terminal tab for `firebase emulators:start --import=./emulator-data`. 

> NOTE: You will also have 2 browser tabs open while developing:
- > 1 browser tab for `localhost:3000` (actual misinfo dashboard), 
- > 1 browser tab for "Firebase Emulator Suite" 

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
