# Technical Documentation
## Installation

Misinfo Dashboard is a Next.js project bootstrapped with create-next-app.

### Getting Started

Clone the [caet-saga/misinfo-dashboard](https://github.austin.utexas.edu/caet-saga/misinfo-dashboard) development GitHub repo to a directory on your local computer.
```
git clone https://github.austin.utexas.edu/caet-saga/misinfo-dashboard.git
```

#### Install Dependencies

```
npm install
```

#### Run the Development Server

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

### Useful Development Tools

[Chrome React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)

- Chrome extension that adds React debugging tools to the Chrome Developer Tools.

[VS Code ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

- JavaScript and React/Redux snippets in ES7+ with Babel plugin features for VS Code

[VS Code Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

- Tailwind CSS IntelliSense enhances the Tailwind development experience by providing Visual Studio Code users with advanced features such as autocomplete, syntax highlighting, and linting.

## Project Structure

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

### Top-level folders

| Files                                                             |                               |
| ----------------------------------------------------------------- |:-----------------------------:|
| [`/components`](https://github.austin.utexas.edu/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/~/changes/29/technical-documentation/components) | Next.js components folder |
| [`/config/firebase.js`](https://firebase.google.com/docs/web/setup) | Firebase configuration folder |
| [`/context/AuthContext.jsx`](https://firebase.google.com/docs/auth) | Firebase authentication configuration folder. |
| [`/pages`](https://github.austin.utexas.edu/o/tmOnCbkSzYuWj7EVbFqg/s/h5B8zKreIfyiUKOT1awO/~/changes/29/technical-documentation/pages) | Pages Router |
| [`/public`](https://nextjs.org/docs/getting-started/installation#create-the-public-folder) | Static assets to be served |
| `/styles` | Tailwindcss global styles folder |

## Firebase

### Database

Data is stored on the Firebase Firestore Database. 

- Database configuration is [initialized](https://firebase.google.com/docs/firestore/quickstart#initialize) in config/firebase.js.
- Database authentication (signup, login, logout ext.) is setup in context/AuthContext.jsx.

### Authorization

Firebase authentication on pages and components.

| Files: |     |
| ------ | --- |
| `config/firebase.js` | Auth entry point |
| `context/AuthContext.jsx` | defines user authorization |

## Dashboard

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

### User Profile

Signup, login, logout & reset password.
 
| Files |     |
| ----- | --- |
| `pages/_app.js` | handles login functionality: |
| `components/ProtectedRoute.jsx` | login validation |
| `context/AuthContext.jsx` | authorization validation |
| `styles/globals.css` | global styles |

### Navigation

Includes Home view, Tagging System, New Report, Profile, Help & Login/Logout.

| Files |     |
| ----- | --- |
| `pages/dashboard.jsx` | renders side navbar |
| `components/Navbar.jsx` | imports navbar elements |
| `components/modals/ConfirmModal.jsx` | confirmation modal for logout |
| `components/modals/NewReportModal.jsx` | add new report modal |
| `components/modals/HelpModal.jsx` | dashboard help modal |

## Reports
### Report List

`components/ReportsSection.jsx` - the bulk of the report handling

- Filter reports - Filter the reports based on search text or filter dropdown selection
- Read/unread - Set report read status
  - handleReadToggled, handleReadFilterChanged
- [Infinite scroll](https://www.npmjs.com/package/react-infinite-scroll-component) - import InfiniteScroll from "react-infinite-scroll-component"
- Delete report
  - handleReportDelete, handleDelete
	
### New Report

components/modals/NewReportModal.jsx - new report modal component. Set new report key, value pairs:
|  key  | value |
| ----- | ----- |
| `userID` | user email |
| `state` | [country-state-city package](https://www.npmjs.com/package/country-state-city) |
| `title` | report title |
| `link` | user input link |
| `secondLink` | user input second link |
| `images` | user uploaded images |
| `detail` | report description |
| `creationDate` | report created date |
| `isApproved` | ?? |
| `read` | report viewed or toggled by user |
| `topic` | report selected label |
| `hearFrom` | Sources / Media |

## Tagging System

Each report has specific tags applied. Topic Tags, Source Tags and Labels.

| Files |     |
| ----- | --- |
| `components/Settings.jsx` | tagging system entry point| 
| `components/TagSystem.jsx` | import of tagging modals| 
| `components/modals/NewTagModal.jsx` | modal for adding new tags| 
| `components/modals/RenameTagModal.jsx` | modal for renaming existing tags| 
| `components/modals/ConfirmModal.jsx` | modal for confirming tag changes |

## Graphs

Pie chart or line graph for the trending topics.

### Graph Display

Determines graph of trending topics in the format of the selected graph view (either overview graph or comparison graph).

| Files |     |
| ----- | --- |
| components/Toggle.jsx | Allows user to switch between view of overgraph and comparison graph |
| components/TagGraph.jsx | gathers the needed information to display either the overview graph or comparison graph |

### Overview Graph

Pie chart that shows the number of reports for the top three trending topics for yesterday, the past three days, and the past week.

| Files |     |
| ----- | --- |
| components/OverviewGraph.jsx | Displays pie charts that show the number of reports for the top three trending topics within the provided timelines. |

### Comparison Graph

Line chart that plots the number of reports for the selected topic reports within the requested date range. 

| Files |     |
| ----- | --- |
| components/ComparisonGraphSetup.jsx | Modal popups that allow users to select the report topics and date range of which the number of reports should be collected. |
| components/ComparisonGraphPlotted.jsx | Line graph that displays the plotted number of reports for the selected report topics within the selected date range. |
| components/ComparisonGraphMenu.jsx | Menu bar that allows users to change parameters for the line chart and refresh the chart with the new selection. |

# Components

## Share

Redirects to default email client with link to the report

- Simple button that uses JS mailto function to share report through email
- Only shown on the details page of existing reports. Not related to other functions or pages in the system.

Files |
------|
 `pages/dashboard/reports/[reportId].jsx` |
 
 ## New Report
 
Allows users to create new reports through popup modal, not a separate page.

- Requires at least one: description, link, or photo
- Connects to firebase and generates a new report in the database
- Same functionality as the app, just for desktop

Files |
------|
 `components/modals/NewReportModal.jsx` |
 
## Report Tags

## Graph Toggle

Switches between graph views
- Graph views use react charts library.
### Top 3 Trending Topics Overview Graph
Bar graph that displays the number of reports from the previous day for the top 3 trending topics

- Can choose a specific date range as well.

## Report List

Displays list of most recent reports in firebase.

## Modals

Files    |          |
---------|----------
`ConfirmModal.jsx` | Used to display a dialog box with an optional message and two buttons, OK and Cancel. It prevents the user from accessing other parts of the page until the box is closed.
`HelpModal.jsx` | Used to display a dialog box with user documentation.
`NewReportModal.jsx` | 
`NewTagModal.jsx` | 
`RenameTagModal.jsx` |
`ReportModal.jsx` | 
`UpdatePwModal.jsx` |

## Coding best practices

A collection of general tips and rules of thumb when coding and building a project.

#### Think about the performance impact of your code and solutions

For example: 
- will the change increase the weight of our page?
- will the change increase our load time?

#### Simple is better than Clever

Clever can be fun, but always at the risk of complicating things and making life more difficult for your future self and others. Opt for unglamorous, simple code to save yourself a headache down the road. 

If being clever is going to save you a lot of time or be a big performance boost, be sure to put it in a very simple, well-documented standalone function or module with a simple name that clearly explains what it does, why it should be done this way, and how it works.


#### Functions should do one thing

When writing a new function, make sure that it accomplishes one, specific thing. This keeps the code:
- more testable, 
- easier to debug, 
- easier to read / understand,
- easier to maintain

Some rules of thumb. You probably need to break apart your function into several smaller functions if:
- if you have a really long function name
- if your function code is many lines long or has many steps


#### If you can't figure something out, ask for help. But not before trying to solve it yourself first.

This advice isn't in order to stop you from asking questions, but because some of the best learning happens when you think hard about trying to figure it out on your own. Google it. Read an article or two. Chances are you'll learn something, even if it doesn't lead you to the exact thing you needed to know.

##### When asking questions, be sure to be detailed on:
- what you're trying to solve
- why you need to solve it
- what you've already tried

##### Writing a good question does a few things:
- helps you organize your thoughts
- gives you a chance to think about the problem in a different way
- often leads you to the correct answer

I'd estimate 30% of the time I've written a detailed question, I figure out the answer before I finish writing it or right after I ask it :)

#### Make sure your editor doesn't reformat on save, unless we have something like `prettier` implemented

When people have different format on save rules, it makes it really hard to review Pull Requests (PR). For example, if one person uses a two tab vs four spacing autoformat on save, the PR will show everyone of those lines from the file as a change rather than just the work that was completed. So, maybe you made one small change, but now every line in the file is shown as a change. This makes it difficult to identify the real change.

#### Get only the data you need

When writing a query or requesting data, it's best to get just what you need (or will likely need)

#### Keep things organized
- Look at the existing code base and see if it makes sense for code to be in one place or another. If it doesn't have an obvious place, create a new file using the existing standards of the code.

# Git usage

Important things to remember:

- Make sure you are always pulling from `main`.

- Thorough testing after big changes. Deploy in a more piecemeal manner

- Only one person to push to the `prod` branch.

After changes have been pushed to the [Dev Site](https://dev-misinfo-dashboard.netlify.app/) send a link to Kat for review.

## Quick Guide

1. When you take on a task:
2. Go to the applicable [Github repo](https://github.com/engagingnewsproject/misinfo-dashboard) and choose the issue to work on
3. Assign this issue to yourself
4. Create your Git Branch

   a. If this is a critical hotfix that needs to get released immediately:

   ```
   $ git checkout -b hotfix-[hotfix-name] stable      // creates a local branch
   $ git push origin hotfix-[hotfix-name]             // makes the branch remotely available
   ```

   b. If this is a new feature/improvement:

   ```
   $ git checkout -b feature-[feature-name] master    // creates a local branch
   $ git push origin feature-[feature-name]           // makes the branch remotely available
   ```

   c. If this is a non-critical bugfix:

   ```
   $ git checkout -b bug-[bug-name] master           // creates a local branch
   $ git push origin bug-[bug-name]                  // makes the branch remotely available
   ```

5. As work gets to stable stopping points or completion, push it to github:

   ```
   $ git push origin your-branch-name                // pushes branch to github
   ```

6. When your code is ready to be reviewed:

   - Go to your branch on github.com and create a new pull request to be merged into `main`.

   - Drop any implementation notes into the github.com issue and link the pull request to the github.com issue in the issue right sidebar.

7. After your code is reviewed:

   - It will either be merged or comments will be left so you can finish up the issue. Go ahead and repeat from #1 while you wait for the review.

## Branching

**Quick Legend**

<table>
  <tr>
   <td><strong>Instance</strong>
   </td>
   <td><strong>Branch</strong>
   </td>
   <td><strong>Description, Instructions, Notes</strong>
   </td>
  </tr>
  <tr>
   <td>Development
   </td>
   <td>dev
   </td>
   <td>Accepts merges from Working, Features/Issues and Hotfixes.
   </td>
  </tr>
  <tr>
   <td>Working
   </td>
   <td>main
   </td>
   <td>Accepts merges from Features/Issues and Hotfixes
   </td>
  </tr>
  <tr>
   <td>Production
   </td>
   <td>prod
   </td>
   <td>Accepts merges from Working and Hotfixes
   </td>
  </tr>
</table>

## Main Branches

The main repository will always hold two evergreen branches:

- `main`
- `prod`

The main branch should be considered `origin/main` and will be the main branch where the source code of `HEAD`always reflects a state with the latest delivered development changes for the next release. As a developer, you will be branching and merging from `main`.

Consider `origin/prod` to always represent the latest code deployed to production. During day to day development, the `prod` branch will not be interacted with.

When the source code in the `main` branch is stable and has been deployed, all of the changes will be merged into `prod`.

## Supporting Branches

Supporting branches are used to aid parallel development between team members, ease tracking of features, and to assist in quickly fixing live production problems. Unlike the main branches, these branches always have a limited life time, since they will be removed eventually.

The different types of branches we may use are:

- Feature branches
- Bug branches
- Hotfix branches

Each of these branches have a specific purpose and are bound to strict rules as to which branches may be their originating branch and which branches must be their merge targets. Each branch and its usage is explained below.

## Feature Branches

Feature branches are used when developing a new feature or enhancement which has the potential of a development lifespan longer than a single deployment. When starting development, the deployment in which this feature will be released may not be known. No matter when the feature branch will be finished, it will always be merged back into the main branch.

During the lifespan of the feature development, the lead should watch the `main` branch (network tool or branch tool in GitHub) to see if there have been commits since the feature was branched. Any and all changes to `main` should be merged into the feature before merging back to `main`; this can be done at various times during the project or at the end, but time to handle merge conflicts should be accounted for.

- Must branch from: `main`
- Must merge back into: `main`
- Branch naming convention: `feature-[id]`

### Working with a feature branch
---

If the branch does not exist yet (check with the Lead), create the branch locally and then push to GitHub. A feature branch should always be 'publicly' available. That is, development should never exist in just one developer's local branch.

```
$ git checkout -b feature-id master                 // creates a local branch for the new feature
$ git push origin feature-id                        // makes the new feature remotely available
```

Periodically, changes made to `main` (if any) should be merged back into your feature branch.

```
$ git merge main                                  // merges changes from master into feature branch
```

When development on the feature is complete, the lead (or engineer in charge) should merge changes into `main` and then make sure the remote branch is deleted.

```
$ git checkout main                                 // change to the main branch
$ git merge --no-ff feature-id                      // makes sure to create a commit object during merge
$ git push origin main                              // push merge changes
$ git push origin :feature-id                       // deletes the remote branch
```

## Bug Branches

Bug branches differ from feature branches only semantically. Bug branches will be created when there is a bug on the live site that should be fixed and merged into the next deployment. For that reason, a bug branch typically will not last longer than one deployment cycle. Additionally, bug branches are used to explicitly track the difference between bug development and feature development. No matter when the bug branch will be finished, it will always be merged back into `main`.

Although likelihood will be less, during the lifespan of the bug development, the lead should watch the `main` branch (network tool or branch tool in GitHub) to see if there have been commits since the bug was branched. Any and all changes to `main` should be merged into the bug before merging back to `main`; this can be done at various times during the project or at the end, but time to handle merge conflicts should be accounted for.

- Must branch from: `main`
- Must merge back into: `main`
- Branch naming convention: `bug-[id]`

### Working with a bug branch

---

If the branch does not exist yet (check with the Lead), create the branch locally and then push to GitHub. A bug branch should always be 'publicly' available. That is, development should never exist in just one developer's local branch.

```
$ git checkout -b bug-id main                       // creates a local branch for the new bug
$ git push origin bug-id                            // makes the new bug remotely available
```

Periodically, changes made to `main` (if any) should be merged back into your bug branch.

```
$ git merge main                                   // merges changes from main into bug branch
```

When development on the bug is complete, [the Lead] should merge changes into `main` and then make sure the remote branch is deleted.

```
$ git checkout main                                 // change to the main branch
$ git merge --no-ff bug-id                          // makes sure to create a commit object during merge
$ git push origin main                              // push merge changes
$ git push origin :bug-id                           // deletes the remote branch
```

## Hotfix Branches

A hotfix branch comes from the need to act immediately upon an undesired state of a live production version. Additionally, because of the urgency, a hotfix is not required to be be pushed during a scheduled deployment. Due to these requirements, a hotfix branch is always branched from a tagged `main` branch. This is done for two reasons:

- Development on the `main` branch can continue while the hotfix is being addressed.
- A tagged `prod` branch still represents what is in production. At the point in time where a hotfix is needed, there could have been multiple commits to `main` which would then no longer represent production.

- Must branch from: tagged `prod`
- Must merge back into: `main` and `prod`
- Branch naming convention: `hotfix-[id]`

### Working with a hotfix branch

---

If the branch does not exist yet (check with the Lead), create the branch locally and then push to GitHub. A hotfix branch should always be 'publicly' available. That is, development should never exist in just one developer's local branch.

```
$ git checkout -b hotfix-id main                    // creates a local branch for the new hotfix
$ git push origin hotfix-id                         // makes the new hotfix remotely available
```

When development on the hotfix is complete, [the Lead] should merge changes into `prod` and then update the tag.

```
$ git checkout main                                 // change to the main branch
$ git merge --no-ff hotfix-id                       // forces creation of commit object during merge
$ git tag -a <tag>                                  // tags the fix
$ git push origin main --tags                       // push tag changes
```

Merge changes into `main` so not to lose the hotfix and then delete the remote hotfix branch.

```
$ git checkout main                                 // change to the main branch
$ git merge --no-ff hotfix-id                       // forces creation of commit object during merge
$ git push origin main                              // push merge changes
$ git push origin :hotfix-id                        // deletes the remote branch
```
