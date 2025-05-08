# Player ID Generation Fix

## Issue

The application was generating the same player ID ("31l3yuv2fky") across different browser tabs and browsers on the same host. This caused problems when trying to play the game from multiple tabs or browsers, as the system would recognize all instances as the same player.

## Root Cause

The issue was caused by two factors:

1. The player ID was being stored in `localStorage`, which is shared across all tabs and windows of the same browser for the same domain.
2. The player ID generation function (`generatePlayerId`) was not generating sufficiently unique IDs.

When a user opened the game in multiple tabs or windows, they would all retrieve the same player ID from `localStorage`. This meant that if they tried to create a game in one tab and join it in another, they would be recognized as the same player, which isn't allowed by the game logic.

## Solution

The solution involved two key changes:

### 1. Improved Player ID Generation

The `generatePlayerId` function was enhanced to generate more unique IDs by:
- Generating a random string as before
- Adding a timestamp component (converted to base 36 for brevity)
- Combining them with a hyphen

```javascript
export const generatePlayerId = (): string => {
  // Generate a random string
  const randomStr = Math.random().toString(36).substring(2, 15);
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  // Combine them for a more unique ID
  return `${randomStr}-${timestamp}`;
};
```

This ensures that even if the function is called at almost the same time in different tabs, the IDs will still be different due to the random component. And if called at different times, the timestamp will ensure uniqueness.

### 2. Session-Specific Player IDs

Instead of reusing the player ID from `localStorage`, each tab/window now gets a unique session-specific ID:

```javascript
const [playerId, setPlayerId] = useState<string>(() => {
  // Generate a session-specific ID component
  const sessionId = generatePlayerId();
  
  // Store this session ID in sessionStorage (unique per tab)
  sessionStorage.setItem('sessionPlayerId', sessionId);
  
  // Log the generated ID for debugging
  console.log(`Generated unique player ID for this session: ${sessionId}`);
  
  // Return the session-specific ID
  return sessionId;
});
```

Key changes:
- Using `sessionStorage` instead of `localStorage` (sessionStorage is isolated per tab/window)
- Always generating a new ID for each session, rather than reusing a stored one
- Adding logging to help verify that different tabs/windows are getting different IDs

## Verification

To verify that the fix works correctly, you can:

1. Open the game in multiple tabs or browsers
2. Check the browser console in each tab to see the unique player ID that was generated
3. Create a game in one tab and join it from another tab
4. Observe that the system now correctly recognizes them as different players

The console logs will show messages like:
- "Generated unique player ID for this session: [unique-id]"
- "Creating new online game for player: [unique-id]"
- "This tab's unique player ID: [unique-id]"
- "Attempting to join game with ID: [game-id] as player: [different-unique-id]"

## Benefits

This fix enables:
- Playing the game from multiple tabs or browsers on the same host
- Testing the multiplayer functionality without needing multiple devices
- A better development and testing experience