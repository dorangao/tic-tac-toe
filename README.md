# Tic Tac Toe Game

This is a React-based Tic Tac Toe game with online multiplayer functionality using Firebase.

## Environment Variables

This project uses environment variables to store Firebase configuration. Before running the project, you need to set up your environment variables:

1. Copy `.env.example` to a new file called `.env`
2. Fill in your Firebase configuration values

For detailed instructions, see [Environment Variables Setup](./ENV_SETUP.md).

## Firebase Permission Denied Fix

If you're encountering the following error when trying to create an online game:

```
Error creating game: Error: PERMISSION_DENIED: Permission denied
```

This is due to Firebase security rules preventing write operations to the database. We've provided multiple ways to fix this issue:

### Option 1: Update Rules Manually (Recommended for Beginners)

Follow the detailed visual guide in [FIREBASE_RULES_VISUAL_GUIDE.md](./FIREBASE_RULES_VISUAL_GUIDE.md) which provides step-by-step instructions with visual references.

### Option 2: Update Rules Programmatically

For developers who prefer a programmatic approach:

1. Install required packages:
   ```
   npm install firebase-admin firebase-tools
   ```

2. Log in to Firebase:
   ```
   npx firebase login
   ```

3. Run the update script:
   ```
   node update-firebase-rules.js
   ```

4. Follow the prompts to complete the setup.

### Option 3: Quick Manual Update

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (sunny-lore-421222)
3. In the left sidebar, click on "Realtime Database"
4. Click on the "Rules" tab
5. Replace the current rules with the following:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "games": {
      ".read": true,
      ".write": true,
      "$gameId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

6. Click "Publish" to save the changes

### Verify Your Rules

After updating the rules, you can verify they're working correctly by running:

```
node verify-firebase-rules.js
```

This script will test creating, updating, and deleting a game to ensure your permissions are set correctly.

> **Note**: These rules allow anyone to read and write to your database. For a production application, you should implement more restrictive security rules. These permissive rules are suitable for development and testing purposes only.

## Player ID Generation Fix

If you're trying to test the multiplayer functionality on the same device using multiple browser tabs or different browsers, and encountering issues where you can't join your own games, this is likely due to the player ID generation logic.

By default, the application has been updated to generate unique player IDs for each browser tab/window, allowing you to:
- Play the game from multiple tabs or browsers on the same host
- Test the multiplayer functionality without needing multiple devices
- Have a better development and testing experience

For detailed information about this fix, see [Player ID Generation Fix](./PLAYER_ID_FIX.md).

## More Secure Rules (For Production)

For a more secure setup, consider using rules like these once you implement authentication:

```json
{
  "rules": {
    "games": {
      ".read": true,
      ".write": "auth != null",
      "$gameId": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

This would require users to be authenticated before they can create or modify games.

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
