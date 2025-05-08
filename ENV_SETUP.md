# Environment Variables Setup

This project uses environment variables to store sensitive Firebase configuration. This approach enhances security by keeping API keys and other credentials out of version control.

## Setting Up Environment Variables

1. Create a `.env` file in the root directory of the project
2. Copy the contents of `.env.example` into your `.env` file
3. Replace the placeholder values with your actual Firebase configuration

Example:
```
REACT_APP_FIREBASE_API_KEY=your-actual-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Important Notes

- The `.env` file is excluded from version control in `.gitignore` to prevent accidentally committing sensitive information
- For Create React App projects, environment variables must be prefixed with `REACT_APP_` to be accessible in the client-side code
- If you're deploying this application, you'll need to set these environment variables in your hosting environment

## For Node.js Scripts

The project includes Node.js scripts that also use these environment variables:

- `verify-firebase-rules.js`: Verifies that Firebase security rules are correctly configured
- `update-firebase-rules.js`: Updates Firebase security rules programmatically

These scripts use the `dotenv` package to load environment variables from the `.env` file. Make sure to install the required dependencies:

```
npm install dotenv
```

## Getting Firebase Configuration

If you need to get your Firebase configuration:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) next to "Project Overview" to access project settings
4. Scroll down to the "Your apps" section
5. Select your web app or create a new one
6. Your Firebase configuration will be displayed in the "Firebase SDK snippet" section