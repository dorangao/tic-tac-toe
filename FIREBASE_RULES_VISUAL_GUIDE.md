# Firebase Security Rules - Visual Guide

## Introduction

This guide provides detailed visual instructions for updating your Firebase security rules to fix the "Permission Denied" error when creating online games in the Tic Tac Toe application.

## Step-by-Step Instructions

### 1. Go to the Firebase Console

Visit [https://console.firebase.google.com/](https://console.firebase.google.com/) and sign in with your Google account.

### 2. Select Your Project

Select the project "sunny-lore-421222" from the project list.

![Select Project](https://i.imgur.com/example1.png)
(Note: This is a placeholder image reference)

### 3. Navigate to Realtime Database

In the left sidebar menu, click on "Realtime Database".

![Navigate to Database](https://i.imgur.com/example2.png)
(Note: This is a placeholder image reference)

### 4. Go to Rules Tab

At the top of the Realtime Database page, click on the "Rules" tab.

![Rules Tab](https://i.imgur.com/example3.png)
(Note: This is a placeholder image reference)

### 5. Update the Rules

Replace the current rules with the following:

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

![Update Rules](https://i.imgur.com/example4.png)
(Note: This is a placeholder image reference)

### 6. Publish the Rules

Click the "Publish" button to save and apply the new rules.

![Publish Rules](https://i.imgur.com/example5.png)
(Note: This is a placeholder image reference)

## Verifying the Rules

After publishing the rules, you can verify they've been applied correctly:

1. Wait about 1 minute for the rules to propagate
2. Return to the Tic Tac Toe application
3. Try creating an online game again
4. If successful, you should no longer see the "Permission Denied" error

## Security Considerations

The rules provided above are very permissive and allow anyone to read from and write to your database. This is suitable for development and testing purposes, but not for production applications.

For a more secure setup in production, consider implementing authentication and using more restrictive rules as described in the FIREBASE_PERMISSION_FIX.md document.