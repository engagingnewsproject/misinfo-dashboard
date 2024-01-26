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

You can also assign a role (reccommended):
- Admin role: `{"role":"admin"}`
- Agency role: `{"role":"agency"}`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

_Next.js original docs:_

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

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