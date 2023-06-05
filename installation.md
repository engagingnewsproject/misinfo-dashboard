# Installation

Misinfo Dashboard is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

### Getting Started

Clone the [caet-saga / misinfo-dashboard](https://github.austin.utexas.edu/caet-saga/misinfo-dashboard) development GitHub repo to a directory on your local computer.

```
git clone https://github.austin.utexas.edu/caet-saga/misinfo-dashboard.git
```

#### Install Dependencies

```
npm install
```

#### Run the Development Server <a href="#run-the-development-server" id="run-the-development-server"></a>

1. Run `npm run dev` to start the development server.
2. Visit `http://localhost:3000` to view your application.

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

### Useful Development Tools

* [**Chrome React Developer Tools**](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
  * Chrome extension that adds React debugging tools to the Chrome Developer Tools.
* [**VS Code ES7+ React/Redux/React-Native snippets**](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)
  * JavaScript and React/Redux snippets in ES7+ with Babel plugin features for VS Code
* [**VS Code Tailwind CSS IntelliSense**](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
  * Tailwind CSS IntelliSense enhances the Tailwind development experience by providing Visual Studio Code users with advanced features such as autocomplete, syntax highlighting, and linting.

### Firebase CLI Tools

[Guide on how to push rules using the CLI](https://firebase.google.com/docs/firestore/security/get-started#use\_the\_firebase\_cli)

### Modals

* [React URL Modal](https://github.com/remoteoss/react-url-modal)

### Sync with the caet-saga repo

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
