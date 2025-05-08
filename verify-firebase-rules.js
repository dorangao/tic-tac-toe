/**
 * Firebase Rules Verification Script
 * 
 * This script verifies that the Firebase Realtime Database security rules
 * are correctly configured to allow creating and joining games.
 * 
 * Prerequisites:
 * 1. Install required packages:
 *    npm install firebase dotenv
 * 
 * 2. Run this script:
 *    node verify-firebase-rules.js
 */

// Load environment variables from .env file
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, set, remove } = require('firebase/database');

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Test data
const testGameData = {
  squares: Array(9).fill(null),
  xIsNext: true,
  gameOver: false,
  winner: null,
  players: {
    x: "test-player-id",
    o: null,
  },
  stats: {
    xWins: 0,
    oWins: 0,
    draws: 0,
  }
};

async function verifyRules() {
  console.log('Starting Firebase rules verification...');
  console.log('This script will attempt to write to and delete from your Firebase database');
  console.log('to verify that the security rules are correctly configured.\n');

  try {
    // Step 1: Try to create a test game
    console.log('Step 1: Testing game creation...');
    const testGameRef = push(ref(database, 'games'));

    if (!testGameRef.key) {
      throw new Error("Failed to generate game ID");
    }

    const gameId = testGameRef.key;
    console.log(`Generated test game ID: ${gameId}`);

    // Step 2: Try to write data to the test game
    console.log('Step 2: Testing write permissions...');
    await set(ref(database, `games/${gameId}`), testGameData);
    console.log('✅ Successfully wrote data to the database!');

    // Step 3: Try to update the test game
    console.log('Step 3: Testing update permissions...');
    await set(ref(database, `games/${gameId}/players/o`), "test-player-2");
    console.log('✅ Successfully updated data in the database!');

    // Step 4: Clean up by removing the test game
    console.log('Step 4: Cleaning up test data...');
    await remove(ref(database, `games/${gameId}`));
    console.log('✅ Successfully removed test data from the database!');

    console.log('\n🎉 All tests passed! Your Firebase security rules are correctly configured.');
    console.log('You should now be able to create and join online games without permission errors.');

  } catch (error) {
    console.error('\n❌ Verification failed!');
    console.error('Error details:', error);
    console.error('\nYour Firebase security rules may not be correctly configured.');
    console.error('Please follow the instructions in FIREBASE_RULES_VISUAL_GUIDE.md to update your rules.');
  }
}

verifyRules();
