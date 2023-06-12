# Installation

Misinfo Dashboard is a Next.js project bootstrapped with create-next-app.

## Getting Started

Clone the [caet-saga/misinfo-dashboard](https://github.austin.utexas.edu/caet-saga/misinfo-dashboard) development GitHub repo to a directory on your local computer.
```
git clone https://github.austin.utexas.edu/caet-saga/misinfo-dashboard.git
```

### Install Dependencies

```
npm install
```

### Run the Development Server

1. Start the development server.

npm

```
npm run dev
```

yarn

```
yarn dev
```

Visit http://localhost:3000 to view your application.

## Useful Development Tools

[Chrome React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)

- Chrome extension that adds React debugging tools to the Chrome Developer Tools.

[VS Code ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

- JavaScript and React/Redux snippets in ES7+ with Babel plugin features for VS Code

[VS Code Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

- Tailwind CSS IntelliSense enhances the Tailwind development experience by providing Visual Studio Code users with advanced features such as autocomplete, syntax highlighting, and linting.

# Project Structure

This section provides an overview of the file and folder structure of the Misin project. It covers top-level files and folders, configuration files, and routing conventions.

| Files                                                             |                               |
| ----------------------------------------------------------------- |:-----------------------------:|
| [`.eslintrc.json`](https://eslint.org/docs/latest/use/configure/) | Configuration file for ESLint |
| [`.firebaserc`](https://firebase.google.com/docs/cli/targets#set_up_deploy_targets_for_your_firebase_resources) | Firebase settings for deploy targets|
| [`.gitignore`](https://git-scm.com/docs/gitignore) | Git files and folders to ignore |
| [`firebase.json`](https://firebase.google.com/docs/cli#the_firebasejson_file) | Firebase project configuration |
| [`firestore.indexes.json`](https://firebase.google.com/docs/reference/firestore/indexes) | Firebase custom indexes |
| [`firestore.rules`](https://firebase.google.com/docs/firestore/security/get-started) | Firebase security rules |
| [`next.config.js`](https://nextjs.org/docs/app/api-reference/next-config-js) | Configuration file for Next.js |
| [`package.json`](https://docs.npmjs.com/cli/v9/configuring-npm/package-json) | Project npm dependencies and scripts |
| [`postcss.config.json`](https://nextjs.org/docs/pages/building-your-application/configuring/post-css#customizing-plugins) | PostCSS configuration |
| [`tailwind.config.js`](https://tailwindcss.com/docs/configuration) | Tailwindcss configuration |
| [`yarn.lock`](https://classic.yarnpkg.com/lang/en/docs/yarn-lock/) | Project `yarn` dependencies and scripts |

## Top-level folders

| Files                                                             |                               |
| ----------------------------------------------------------------- |:-----------------------------:|
| [`/components`](https://github.austin.utexas.edu/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/~/changes/29/technical-documentation/components) | Next.js components folder |
| [`/config/firebase.js`](https://firebase.google.com/docs/web/setup) | Firebase configuration folder |
| [`/context/AuthContext.jsx`](https://firebase.google.com/docs/auth) | Firebase authentication configuration folder. |
| [`/pages`](https://github.austin.utexas.edu/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/~/changes/29/technical-documentation/pages) | Pages Router |
| [`/public`](https://nextjs.org/docs/getting-started/installation#create-the-public-folder) | Static assets to be served |
| `/styles` | Tailwindcss global styles folder |

# Firebase

## Database

Data is stored on the Firebase Firestore Database. 

- Database configuration is [initialized](https://firebase.google.com/docs/firestore/quickstart#initialize) in config/firebase.js.
- Database authentication (signup, login, logout ext.) is setup in context/AuthContext.jsx.

## Authorization

Firebase authentication on pages and components.

| Files: |     |
| ------ | --- |
| `config/firebase.js` | Auth entry point |
| `context/AuthContext.jsx` | defines user authorization |

# Dashboard

pages/index.jsx - dashboard entry point, importing main dashboard (pages/dashboard.jsx)

| Files |     |
| ----- | --- |
| `components/Home.jsx` |  imports dashboard elements: |
| `components/Headbar.jsx` |  top title bar + search |
| `components/TagGraph.jsx` |  tagging system. |
| `components/ReportsSection.jsx` |  list of reports. |
| `components/Profile.jsx` |  user profile view |
| `components/Settings.jsx` |  tagging system settings |
| `components/Navbar.jsx` |  side navbar component  |

[Graphs](https://github.austin.utexas.edu/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/~/changes/29/technical-documentation/overview/dashboard#graphs) - view report trending topics
components/ReportsSection.jsx - [reports list](https://github.austin.utexas.edu/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/~/changes/29/technical-documentation/overview/dashboard#report-list).

## User Profile

Signup, login, logout & reset password.
 
| Files |     |
| ----- | --- |
| `pages/_app.js` | handles login functionality: |
| `components/ProtectedRoute.jsx` | login validation |
| `context/AuthContext.jsx` | authorization validation |
| `styles/globals.css` | global styles |

## Navigation

Includes Home view, Tagging System, New Report, Profile, Help & Login/Logout.

| Files |     |
| ----- | --- |
| `pages/dashboard.jsx` | renders side navbar |
| `components/Navbar.jsx` | imports navbar elements |
| `components/modals/ConfirmModal.jsx` | confirmation modal for logout |
| `components/modals/NewReportModal.jsx` | add new report modal |
| `components/modals/HelpModal.jsx` | dashboard help modal |