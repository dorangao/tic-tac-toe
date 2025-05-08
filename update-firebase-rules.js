/**
 * Firebase Rules Update Script
 * 
 * This script updates the Firebase Realtime Database security rules programmatically.
 * 
 * Prerequisites:
 * 1. Install required packages:
 *    npm install firebase-admin firebase-tools dotenv
 * 
 * 2. Log in to Firebase:
 *    npx firebase login
 * 
 * 3. Run this script:
 *    node update-firebase-rules.js
 */

// Load environment variables from .env file
require('dotenv').config();

const admin = require('firebase-admin');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to your service account key file
// You need to download this from Firebase Console > Project Settings > Service Accounts
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'firebase-service-account.json');

// Project ID from environment variables
const PROJECT_ID = process.env.REACT_APP_FIREBASE_PROJECT_ID;

// Rules to apply
const rules = {
  rules: {
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
};

async function updateRules() {
  try {
    console.log('Starting Firebase rules update...');

    // Check if service account file exists
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      console.error('Service account file not found!');
      console.log('\nPlease follow these steps to get your service account key:');
      console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
      console.log('2. Select your project');
      console.log('3. Go to Project Settings > Service Accounts');
      console.log('4. Click "Generate new private key"');
      console.log('5. Save the file as "firebase-service-account.json" in this directory');
      return;
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
      databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com`
    });

    // Write rules to a temporary file
    const tempRulesPath = path.join(__dirname, 'temp-rules.json');
    fs.writeFileSync(tempRulesPath, JSON.stringify(rules, null, 2));

    // Use Firebase CLI to update rules
    console.log('Updating database rules...');
    execSync(`npx firebase database:update / ${tempRulesPath} --project ${PROJECT_ID}`, { stdio: 'inherit' });

    // Clean up
    fs.unlinkSync(tempRulesPath);

    console.log('\nFirebase rules updated successfully!');
    console.log('\nPlease wait about 1 minute for the rules to propagate, then try creating an online game again.');

  } catch (error) {
    console.error('Error updating Firebase rules:', error);
  }
}

updateRules();
