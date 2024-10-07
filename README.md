# Misinfo Dashboard

[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/firebase-a08021?style=for-the-badge&logo=firebase&logoColor=ffcd34)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Netlify](https://img.shields.io/badge/netlify-%23000000.svg?style=for-the-badge&logo=netlify&logoColor=#00C7B7)](https://app.netlify.com/sites/misinfo-dashboard/deploys)

[Getting Started](https://github.com/engagingnewsproject/misinfo-dashboard/?tab=readme-ov-file#getting-started) | [Firebase Emulator](https://github.com/engagingnewsproject/misinfo-dashboard/?tab=readme-ov-file#4-install-and-run-firebase-emulator) | [Firebase](https://github.com/engagingnewsproject/misinfo-dashboard/?tab=readme-ov-file#firebase-functions) | [Push to Netlify](https://github.com/engagingnewsproject/misinfo-dashboard/?tab=readme-ov-file#project-lead-push-to-netlify-live-site)

This project project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) of the [Next.js](https://nextjs.org/) framework. To learn more about Next.js features and API, take a look at [Next.js Documentation](https://nextjs.org/docs).

**See [Technical Documentation](https://github.com/engagingnewsproject/misinfo-dashboard/blob/main/technicalDocumentation.md)** for Project Structure, Firebase, Components and Git Usage docs.


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

#### Node Version

At this time of writing (April 26, 2024) the latest working update is at Node v20.12.2. Ensure this is the version by running `node -v`. If you are not on that Node version check out this article to set the correct Node version: [Easily switch between multiple Node versions without using nvm](https://dev.to/andreasbergstrom/easily-switch-between-multiple-node-versions-without-using-nvm-52k9).

#### Yarn
Install/update [`yarn`](https://yarnpkg.com/) package manager on your machine ([installation docs](https://yarnpkg.com/getting-started/install))

- Enable [Corepack](https://yarnpkg.com/corepack), if it isn't already; this will add the `yarn` binary to your PATH:

    ```
    corepack enable
    ```

- Set the yarn version by running:

```
yarn set version 1.22.1
```

- From the root of the project install dependencies by running:

    ```
    yarn install
    ```

    > _**Why not `npm install`?** Glad you asked! [Netlify](https://www.netlify.com/), the service that hosts the dashboard, will not allow us to upload updates because `npm install` creates a `package-lock.json` file. Netlify doesn't like `package-lock.json` files._

### 3. Add Firebase configuration

In order to be authenticated with the Firebase Project you must have the `.env` file (which contains the Firebase credentials) at the root of your project. To get the contents of the `.env` file reach out to the project lead (currently [Luke](https://github.com/luukee)).

### 4. Install Firebase Emulator

Install Firebase Tools by running:

```
curl -sL firebase.tools | bash
```

- [Install, configure and integrate Local Emulator Suite](https://firebase.google.com/docs/emulator-suite/install_and_configure)

### 5. Start dev server

To boot up the development server and Firebase Emulator run:

```
yarn dev
```

This command will boot up the [Firebase Emulator UI](https://firebase.google.com/docs/emulator-suite) and the NextJS server. Look over your terminal output and click the Emulator links (Emulator UI) and localhost link.

#### Emulator Users

The emulator has 3 user accounts already set up. You can log in with any of them. Each login has different permissions so the layout will change based on who you are logged in with.

**User:**
- email: user@user.com
- pass: devPassword

**Agency user:**
- email: agency@user.com
- pass: devPassword

**Admin user:**
- email: admin@user.com
- pass: devPassword

You can also sign up with totally different info (email, name, city, state ect.). When you sign up a authorization link will print out in your terminal. You will need to click that link to verify. After you click the link you can close the window that open's (its only for verification) and return to your localhost window to log in.

## Emulator Tips:

> _If you get `command not found` you might have to be added as a user for the Firebase project. Contact the lead developer to do this for you. Or contact mediaengagement@austin.utexas.edu_

The Firebase Emulator should boot up and provide you an emulator link (look for `View Emulator UI at` in your command line output).

Open that link to view the Emulator UI:

![emulator-ui](https://media.github.austin.utexas.edu/user/3619/files/1012c2ee-b9b2-4529-8914-2e0455af9bda)

**See Emulator Tips** for more info.

### Add yourself as a user via the "Emulator Authentication" tab.

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


#### Emulator UI
- Database: find the imported database under the Emulator UI / Firestore tab.
- Users: view, add, edit & delete users under the Authentication tab.
- Files & Uploads: Storage tab in the Emulator UI.

#### Users

Your user UID that you created will not be associated with any reports or agencies so you can either add reports via the Misinfo Dashboard in your localhost:3000 window or go into the Emulator UI and manually change the `userID` to your own for some reports. Same idea with assigning your user to an agency: go into the Emulator UI and add your email to an agency's `agencyUsers` field.

#### Emulator log files

Emulator creates log files (`firebase-debug.log` & `ui-debug.log`) when you boot up the emulator. No need to push those with git.

#### Export your local emulator data

The Firebase emulator allows you to export data from your running emulator instance. If you want to stash a baseline set of data, auth profiles you have set up in your running emulator instance.

`firebase emulators:export ./emulator-data`

This command will export the running emulator instance's auth profiles, firestore data and storage files to the `/emulator-data` folder. **Recommended** to not commit the `/emulator-data` changed files as to not alter the baseline Emulator data.

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

## Deploy to Netlify

#### Deploy to dev
Link: https://dev-misinfo-dashboard.netlify.app/

To push all changes to the dev site on Netlify using the [Engaging News Project's misinfo-dashboard](https://github.com/engagingnewsproject/misinfo-dashboard) repo's `dev` branch.

_The `dev` branch is the branch that contains the dev live site code._

1.  Checkout the `dev` branch

    `git checkout dev`

2.  Merge changes from `main` to `dev`

    `git marge main`

3. Push the merge into `dev`

    `git push origin dev`

4.  Open the [Netlify UI for the dev site](https://app.netlify.com/sites/dev-misinfo-dashboard/deploys) and monitor the progress. Make sure the top bar has `dev-misinfo-dashboard` active. On the left sidebar navigate to the "Deploys" link. Your latest push will be listed at the top.

#### Deploy to prod
Link: https://misinfo-dashboard.netlify.app/

To push all changes to the live site on Netlify using the [Engaging News Project's misinfo-dashboard](https://github.com/engagingnewsproject/misinfo-dashboard) repo's `dev` branch.

_The `prod` branch is the branch that contains the live site code._

1.  Checkout the `main` branch

    `git checkout main`

2.  Merge changes from `dev` into `main`

    `git marge dev`

3. Push the merge into `main`

    `git push origin main`

4.  Checkout the `prod` branch

    `git checkout prod`

5. Merge `main` into `prod`

    `git merge main`

6. Push the merge into `prod`

    `git push origin prod`

7.  Open the [Netlify UI for the prod site](https://app.netlify.com/sites/misinfo-dashboard/deploys) and monitor the progress. Make sure the top bar has `misinfo-dashboard` active. On the left sidebar navigate to the "Deploys" link. Your latest push will be listed at the top.

#### Deploy issues

If you get the below error you will need to install [Git Large File Storage](https://git-lfs.com/).

```
remote: error: File firestore-debug.log is 102.65 MB; this exceeds GitHub's file size limit of 100.00 MB
```

To install:

`git lfs install` - make sure git large file storage is installed

`git lfs track "firestore-debug.log"` - to track the large file

`git lfs migrate import --include="firestore-debug.log" --everything` - convert the file types to LFS

`git lfs ls-files` - to list files

`git lfs checkout` -  files can be repopulated with their full expected contents [lfs docs](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-migrate.adoc?utm_source=gitlfs_site&utm_medium=doc_man_migrate_link&utm_campaign=gitlfs#examples)

Project Lead Links: [Firebase CLI Tools](https://firebase.google.com/docs/firestore/security/get-started#use_the_firebase_cli) || [Firebase Console](https://console.firebase.google.com/) || [Firebase Cloud Console](https://console.cloud.google.com/welcome?project=misinfo-5d004) || [Syncing a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork#syncing-a-fork-branch-from-the-command-line) || [Netlify dashboard](https://app.netlify.com/sites/misinfo-dashboard/overview) || [ENP Prod Repo](https://github.com/engagingnewsproject/misinfo-dashboard-prod)

## Links

#### [Netlify Dashboard](https://app.netlify.com/sites/misinfo-dashboard/overview)

#### [React Dev Docs](https://react.dev/)

#### [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)

#### [Material Tailwind](https://www.material-tailwind.com/docs/react/accordion)
  - (all components in the left sidebar)

#### [TailwindCSS Docs](https://tailwindcss.com/docs/installation)

#### [Deprecated: Misinfo Dashboard Documentation GitBook](https://app.gitbook.com/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/)

#### [Markdown Badges](https://github.com/Ileriayo/markdown-badges)

# Docs

## Integration of AuthContext and Firebase Functions

The `AuthContext.jsx` file in your React application interacts with the Firebase functions defined in `functions/index.js` through HTTPS callable functions. This setup allows your front-end application to communicate with the backend Firebase environment in a structured and secure manner.

### How It Works:

1. **Firebase Functions (`functions/index.js`)**:
   This file defines various cloud functions that you deploy to Firebase. These functions can perform operations such as user authentication management (e.g., adding roles, fetching user data), interacting with Firebase Firestore, and other tasks that require server-side execution.

2. **React Context (`context/AuthContext.jsx`)**:
   This file creates a React context that holds the user's authentication state and provides various authentication-related functions across your React application. It utilizes the functions defined in `functions/index.js` through HTTPS callable methods, such as `addAdminRole`, `addAgencyRole`, and `fetchUserRecord`.

    - **HTTPS Callable Functions**: These are Firebase functions that are exposed via an HTTPS endpoint. In your React app, you use `httpsCallable` from Firebase to invoke these functions. This method sends a POST request to the corresponding function's URL and gets the response.

### Example Flow:

- **Add Role**: When you want to add a role to a user, your React component calls `addAdminRole` or `addAgencyRole` through the context. This context function then calls the respective HTTPS callable function, which in turn invokes the cloud function in Firebase. The cloud function performs the necessary operations (like setting custom claims) and returns the result.

- **Fetch User Record**: When you need to fetch details about a user, your component accesses `fetchUserRecord` from the context. This function uses `getUserRecord` (defined as an HTTPS callable function) to retrieve user details from Firebase Authentication.

### Connecting the Dots:

- **AuthContext Integration**: In your React components, you use the context to perform operations that involve authentication or user management. For instance, upon user login, you might call `login` from the context, which handles the sign-in process using Firebase Authentication.

- **Security and Accessibility**: By managing these operations through cloud functions and context, you ensure that sensitive operations are securely handled on the server side, minimizing exposure to the client side, and you maintain a clean separation of concerns.
