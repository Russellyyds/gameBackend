# Assessment 4 (ReactJS)

[Please see course website for full spec](https://cgi.cse.unsw.edu.au/~cs6080/NOW/assessments/assignments/ass4)

This assignment is due Friday the 25th of April, 8pm.

**Please run `./util/setup.sh` in your terminal before you begin. This will set up some checks in relation to the "Git Commit Requirements".**

It's important to note that you should **NOT** use any pre-built web app templates or any AI web app creators for this assignment.

Dependencies files such as `package.json` and `package-lock.json` are excluded from git requirement and should be updated accordingly to include the latest dependencies of your work, make sure to install dependencies correctly in `frontend` directory.

## 2. The Front-end (Work to do)

You are to build a frontend for a provided backend. This frontend shall be build with React.js. It shall be a single page application that does not require a refresh for state updates. (Failure to make your app a fully single page app will result in significant mark penalties)

Features need to be implemented (described below) in order for your React.js app to meet the requirements of the task, and to operate with the backend described in 3.2.

The requirements describe a series of **screens**. Screens can be popups/modals, or entire pages. The use of that language is so that you can choose how you want it to be displayed. A screen is essentially a certain state of your web-based application.

Anything marked 🙉🙉🙉 only needs to completed by pair-attempts and not individual-attempts.

### 2.1. Feature 1. Admin Auth (10%)

#### 2.1.1. Login Screen
 * A unique route must exist for this screen e.g. `/login`
 * User must be able to enter their `email` and `password`.
 * If the form submission fails, a reasonable error message is shown
 * A button must exist to allow submission of form
 * The form must be able to be submitted on enter key in any of the fields

#### 2.1.2. Register Screen
 * A unique route must exist for this screen e.g. `/register`
 * User must be able to enter their `email` and `password` and `name`
 * A confirm `password` field should exist where user re-enters their password.
 * If the two passwords don't match, the user should receive an error popup before submission.
 * If the form submission fails, a reasonable error message is shown
 * A button must exist to allow submission of form
 * The form must be able to be submitted on enter key in any of the fields

#### 2.1.3. Logout Button
 * A logout button must exist for all authenticated users on any screen user interacts with.
 * This logout button, when clicked, logs user out and returns to the login screen, user then needs to login again to access the app.

### 2.2. Feature 2. Admin Creating & Editing a Game (12%)

#### 2.2.1. Dashboard
 * A unique route must exist for this screen e.g. `/dashboard`
 * A dashboard of all games is displayed, where each game shows the **title**, **number of questions** it contains, a **thumbnail**, and a **total duration** to complete (sum of each individual question's duration)
 * Each game listed should have a clickable UI component relating to it that takes user to the screen to edit that particular game. E.G. `/game/{game_id}`
 * A button exists on this screen which brings up a UI component that allows user to create a new game, provide a name for the game. After a new game is created, it **must** be added to the dashboard immediately without a refresh.
 * 🙉🙉🙉 (For pairs only) A button exists on this screen that brings up a UI component to allow user to delete a particular game.

#### 2.2.2. Edit BigBrain Game
 * A unique route must exist for this screen that is parameterised on the game ID. E.G. `/game/{game_id}`
 * This screen allows users to select the question they want to edit
 * This screen allows users to DELETE a particular question and ADD a new question, all actions must be done without a refresh.
 * 🙉🙉🙉 (For pairs only) This screen should also allow the editing of game meta data such as name and thumbnail

#### 2.2.3. Edit BigBrain Game Question
 * A unique route must exist for this screen that is parameterised both on the Game ID and the question ID. E.G. `/game/{game_id}/question/{question_id}`
 * Editable items on this page include:
   * The question type (multiple choice, single choice, judgement)
     * Single choice questions have multiple answers the player can guess, **ONLY** one is correct
     * Multiple choice questions have multiple answers the player can guess, **MULTIPLE** are correct and they must select **ALL** correct ones
     * Judgement questions have a **SINGLE** answer the player can guess, the answer is either correct or incorrect
   * The question itself (as a `string`)
   * Time limit that users have to answer the question (as a `number`)
   * Points for how much the question is worth (as a `number`)
   * The ability to optionally attach a URL to a youtube video, or upload a photo, to enhance the question being asked.
   * Anywhere between **2** and **6** answers, each contains the answer as a `string`

### 2.3. Feature 3. Admin Start, Stop, Results of game session (12%)

#### 2.3.1. Starting a game session
 * On the dashboard page, users should be able to start a new game session via clicking a `start game` button.
 * When the game session is started, a popup is displayed that shows the session ID of the game as a `string`
 * This session ID should be able to be **copied** to clipboard by some kind of "Copy Link" UI component. When this item is clicked, a direct URL is copied to the clipboard. When going to this URL, the users should be given play screen (described in `2.4`) with the session code already pre-populated.
 * After user started a game session, the UI should change appropriately to reflect that a game session is active for a particular game.
 * Note: Only **one** session of a game can be active at one time.

#### 2.3.2. Stopping a game session
 * On the dashboard page, the ability to stop a started game session. Stopping a game session sends all active players to the results screen. A stopped session cannot be restarted.
 * When the game session is stopped, a popup appears that prompts the admin "Would you like to view the results?" If they clicked yes, they are taken to the screen described in `2.3.3`

#### 2.3.3. Advancing & getting the results of a game
 * A unique route must exist for this screen that is parameterised on the session ID. E.G. `/session/{session_id}`
 * If the game session hasn't finished, it should allow the admin to advance to the next question or stop the session. You can advance either in the middle of a question's duration counting down or once the question has time up.
 * Once the game session has finished, it should display the following:
   * A table of up to top **5** users and their **score**
   * A bar/line chart showing a breakdown of what percentage of people (Y axis) got certain questions (X axis) correct
   * A chart showing the average response/answer time for each question
   * Any other interesting information you see fit (Bonus mark can be granted for this based on your implementation)

### 2.4. Feature 4. Player able to join and play game session (12%)

#### 2.4.1. Play Join
 * A unique route must exist for this screen
 * A user is able to enter a session by either:
   * Navigating to a pre-determined URL they know about, then entering a session ID that an admin provides; or
   * Just following a URL the admin provides that includes the session ID in it
 * After players are there, they need to enter their own name to attempt to join the session. If successful, they're taken to `2.4.2`.

#### 2.4.2. Play Game
 * If the game session has not yet started (i.e. have not advanced to the first question) a screen can exist that just says "Please wait".
 * Once advanced onto at least the first question, users are now on a screen that gives the current question being asked. This consists of:
   * The question text
   * A video or image depending on whether it exists.
   * A countdown with how many seconds remain until you can't answer anymore.
   * A selection of single, multiple or judgement answers, that are clickable.
 * The answer shall be sent to the server immediately after each user interaction. If further selections are modified, more requests are sent
 * When the timer hits 0, the answer/results of that particular question are displayed
 * The answer screen remains visible until the admin advances the game question onto the next question.
 * Note: Once the game session begins (onto the first question or more) **NO** other players can join.
 
### 2.5. Feature 5. Results (6%)

#### 2.5.1. Game Session Results
 * After the final question is answered, a screen is displayed to players showing the key results:
   * The player's performance in each question, including how many points they scored, and how many seconds they took to answer each of them.

#### 2.5.2. 🙉🙉🙉 (For pairs only) Past game session results
 * Allow admins to access a page whereby they can see a list of previous sessions for a game, and then view results for those previous sessions as well.
 
### 2.5. Extra Features (6%)

#### 2.5.1. Lobby room
 * If a game session is active, but has yet to move into position 0 (i.e. is still in position -1), then a player lives in a state of limbo. Implement a "lobby" screen that is pleasant and entertaining for users while they await for the game to begin.

#### 2.5.2. 🙉🙉🙉 (For pairs only) Game Upload
 * For `2.2.1`, when a new game is created, the user can optionally upload a `.csv` or `.json` (you choose) file containing the full data for a game. The data structure is validated on frontend before being passed to the backend normally.
 * If you implement this feature, you **MUST** attach an example `.csv` or `.json` into your assignment 4 repo in the project folder. This file must have name `2.5.json`  or `2.5.csv`. This is so we can actually test that it works while marking otherwise you won't be awarded mark for this section.

#### 2.5.4. 🙉🙉🙉 (For pairs only) Points system
 * Devise a more advanced points system whereby a player's score is the product of the time taken to complete a question (i.e. speed) and the number of points a question is worth.
 * This points system should be explained (in writing) on the results screen for both admins and players.

### 2.6. Linting

- Linting must be run from inside the `frontend` folder by running `npm run lint`. You have to make sure linting doesn't produce **any** error and warning to gain the mark for linting section.

### 2.6. Testing

As part of this assignment you are required to write some tests for your components (component testing), and for your application as a whole (ui testing).

For **component testing**, you must:

- Write tests for different components (3 if solo, 🙉🙉🙉 6 if working in a pair)
- For each of the components, they must not have more than 50% similarity (e.g. you can't test a "Card" component and a "BigCard" component, that are virtually the same)
- Ensure your tests have excellent **coverage** (look at all different use cases and edge cases)
- Ensure your tests have excellent **clarity** (well commented and code isn't overly complex)
- Ensure your tests are **designed** well (logical ordering of tests, avoid any tests that aren't necessary or don't add any meaningful value)

Vitest has been setup in your `frontend` folder, there is one example test file located at _`frontend/src/__test__`_, feel free to use it or use `cypress` for component testing.

For **ui testing**, you must:

- Write a test for the "happy path" of an admin that is described as:
  1.  Registers successfully
  2.  Creates a new presentation successfully
  3.  Updates the thumbnail and name of the presentation successfully
  4.  Add some slides in a slideshow deck successfully
  5.  Switch between slides successfully
  6.  Delete a presentation successfully
  7.  Logs out of the application successfully
  8.  Logs back into the application successfully
- (🙉🙉🙉 For pairs only) also required to write a test for another path through the program, describing the steps and the rationale behind this choice in `TESTING.md`, this path **must** contain different features than the ones described in the previous path.

#### Advice for Component Testing

- Find a simple primitive component you've written, and if you don't have one, write one. This could include a common button you use, or a popup, or a box, or an input. Often examples of these are just MUI or other library components you might have wrapped slightly and includes some props you've passed in
- Simply write some unit tests that check that for a given prop input, the component behaves in a certain way (e.g. action or visual display), etc etc
- E.G. Creating a `MyButton` that wraps a MUI `Button`.
- E.G. A simple example is the list of answers for a question. It takes in the answers list we've defined and renders a bunch of MUI ListItems, Checkboxes, TextFields and IconButtons
- Your app is going to be a set of pages, and those pages are made up of primitive components. But if you don't have layers of components between that it means your code is not well modularised. Another example could be if we said to you - no component should be longer than 50 lines of code. You'd probably go refactor to group common sets of primitives together into a new component.

#### Advice for UI Testing

- If you use cypress, consider adding `cy.wait(1000)` if necessary to add slight pauses in your tests if you find that the page is rendering slower than cypress is trying to test.
- If you use Playwright, consider adding `await page.waitForTimeout(1000)` if necessary to add slight pauses in your tests if you find that the page is rendering slower than playwright is trying to test.
- If you're having issues using Cypress on WSL2, try following [this guide](https://shouv.medium.com/how-to-run-cypress-on-wsl2-989b83795fb6).

#### Other advice / help

- The tutor will run an empty (reset) backend when running `npm run test` whilst marking.

#### Running tests

Tests must be run from inside the `frontend` folder by running `npm run test`. Then you might need to press `a` to run all tests.

You are welcomed to modify the `npm run test` command by updating the `test` script inside `frontend/package.json`. For example, if you would like to run standard react testing alongside cypress UI tests you can use `react-scripts test —watchAll=false && npm run cypress open` and if you've used cypress for both component and UI test, then you can replace that line with `cypress open`.

### 2.7. Other notes

- The port you can use to `fetch` data from the backend is defined in `frontend/backend.config.json`
- [This article may be useful to some students](https://stackoverflow.com/questions/66284286/react-jest-mock-usenavigate)
- For users of typescript, [follow this guide](https://nw-syd-gitlab.cseunsw.tech/COMP6080/24T3/react-typescript)
- For images, you can just pass in base64 encoded images
- For certain requests you may want to "poll" the backend, i.e. have the friend end repeatedly make an API call every 1 second to check for updates.
- Make sure you navigated to the correct directory when installing dependencies.
