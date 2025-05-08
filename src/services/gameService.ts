import { database } from '../firebase';
import { ref, set, onValue, get, child, push, update } from 'firebase/database';

// Game state interface
export interface GameState {
  squares: Array<string | null>;
  xIsNext: boolean;
  gameOver: boolean;
  winner: string | null;
  players: {
    x: string | null;
    o: string | null;
    xDisplayName: string | null;
    oDisplayName: string | null;
  };
  stats: {
    xWins: number;
    oWins: number;
    draws: number;
  };
}

// Initial game state
const initialGameState: GameState = {
  squares: Array(9).fill(null),
  xIsNext: true,
  gameOver: false,
  winner: null,
  players: {
    x: null,
    o: null,
    xDisplayName: null,
    oDisplayName: null,
  },
  stats: {
    xWins: 0,
    oWins: 0,
    draws: 0,
  },
};

// Generate a unique player ID
export const generatePlayerId = (): string => {
  // Generate a random string
  const randomStr = Math.random().toString(36).substring(2, 15);
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  // Combine them for a more unique ID
  return `${randomStr}-${timestamp}`;
};

// Create a new game session
export const createGame = async (playerId: string, displayName?: string): Promise<string> => {
  try {
    if (!playerId) {
      throw new Error("Player ID is required");
    }

    console.log(`Creating new game for player: ${playerId}`);

    // Generate a unique game ID
    const gamesRef = ref(database, 'games');
    const newGameRef = push(gamesRef);

    if (!newGameRef.key) {
      throw new Error("Failed to generate game ID");
    }

    const gameId = newGameRef.key;
    console.log(`Generated new game ID: ${gameId}`);

    // Set initial game state with explicit properties to ensure they're all properly initialized
    // Use empty strings instead of null for Firebase compatibility in the squares array
    const gameState = {
      squares: Array(9).fill(""),
      xIsNext: true,
      gameOver: false,
      winner: null,
      players: {
        x: playerId, // Creator is player X
        o: null,
        xDisplayName: displayName || "Player X", // Use provided display name or default
        oDisplayName: null,
      },
      stats: {
        xWins: 0,
        oWins: 0,
        draws: 0,
      },
    };

    // Save to Firebase
    console.log(`Saving game state to Firebase at path: games/${gameId}`);
    const specificGameRef = ref(database, `games/${gameId}`);
    try {
      await set(specificGameRef, gameState);
      console.log(`Successfully created game with ID: ${gameId}`);
    } catch (setError) {
      console.error(`Firebase error creating game: ${setError}`);
      console.error(`Failed game state object:`, JSON.stringify(gameState));
      throw setError;
    }

    return gameId;
  } catch (error) {
    console.error("Firebase error creating game:", error);
    throw error; // Re-throw to allow caller to handle it
  }
};

// Join an existing game
export const joinGame = async (gameId: string, playerId: string, displayName?: string): Promise<boolean> => {
  try {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    if (!playerId) {
      throw new Error("Player ID is required");
    }

    // Validate game ID format (basic validation)
    if (!/^[-a-zA-Z0-9_]+$/.test(gameId)) {
      console.error(`Invalid game ID format: ${gameId}`);
      return false; // Invalid game ID format
    }

    console.log(`Attempting to join game with ID: ${gameId} for player: ${playerId}`);

    // Get current game state
    const gamesRef = ref(database);
    const gameRef = child(gamesRef, `games/${gameId}`);

    console.log(`Fetching game data from path: games/${gameId}`);
    const gameSnapshot = await get(gameRef);

    if (!gameSnapshot.exists()) {
      console.error(`Game with ID ${gameId} does not exist`);
      return false; // Game doesn't exist
    }

    console.log(`Game found. Processing game data...`);
    const gameState = gameSnapshot.val() as GameState;
    console.log(`Game state:`, JSON.stringify(gameState, null, 2));

    // Check if game state is valid
    if (!gameState || !gameState.players) {
      console.error(`Invalid game state for game ID: ${gameId}`);
      return false; // Invalid game state
    }

    // Check if player can join
    if (gameState.players.x === playerId) {
      console.log(`Player ${playerId} is already in the game as X`);
      // If player X is trying to join, they can't also be player O
      if (gameState.players.o === null) {
        console.log(`Player ${playerId} created this game and cannot join as player O`);
        return false; // Player created this game and cannot join as player O
      }
      return true; // Player is already in the game as X
    }

    if (gameState.players.o === playerId) {
      console.log(`Player ${playerId} is already in the game as O`);
      return true; // Player is already in the game as O
    }

    console.log(`Current players in game: X=${gameState.players.x}, O=${gameState.players.o}`);

    if (gameState.players.o === null || gameState.players.o === undefined) {
      console.log(`Player ${playerId} is joining as player O`);
      // Join as player O
      // Prepare updates object with player O and display name
      const updates: any = {
        'players/o': playerId,
        'players/oDisplayName': displayName || "Player O", // Use provided display name or default
      };

      // Check if squares property is missing, not an array, or doesn't have 9 elements
      if (!gameState.squares || !Array.isArray(gameState.squares) || gameState.squares.length !== 9) {
        console.log(`Game state is missing squares property, it's not an array, or it doesn't have 9 elements: ${JSON.stringify(gameState.squares)}. Initializing it properly.`);

        // Create a new array with 9 empty strings (for Firebase compatibility)
        const newSquares = Array(9).fill("");

        // If we have a malformed array with some values, try to preserve them in the new array
        if (Array.isArray(gameState.squares)) {
          for (let i = 0; i < Math.min(gameState.squares.length, 9); i++) {
            if (gameState.squares[i] === 'X' || gameState.squares[i] === 'O') {
              newSquares[i] = gameState.squares[i];
            }
          }
        }

        updates.squares = newSquares;
        console.log(`Initialized squares array: ${JSON.stringify(newSquares)}`);
      }

      // Check if other required properties are missing and add them if needed
      if (gameState.xIsNext === undefined) {
        console.log(`Game state is missing xIsNext property, initializing it to true`);
        updates.xIsNext = true;
      }

      if (gameState.gameOver === undefined) {
        console.log(`Game state is missing gameOver property, initializing it to false`);
        updates.gameOver = false;
      }

      if (gameState.winner === undefined) {
        console.log(`Game state is missing winner property, initializing it to null`);
        updates.winner = null;
      }

      if (!gameState.stats) {
        console.log(`Game state is missing stats property, initializing it`);
        updates.stats = {
          xWins: 0,
          oWins: 0,
          draws: 0
        };
      }

      try {
        await update(ref(database, `games/${gameId}`), updates);
        console.log(`Successfully joined game as player O and updated missing properties if any`);
        return true;
      } catch (updateError) {
        console.error(`Firebase error joining game: ${updateError}`);
        console.error(`Failed update object:`, JSON.stringify(updates));
        throw updateError;
      }
    } else {
      console.log(`Game is full. Cannot join. Player O slot is taken by: ${gameState.players.o}`);
      return false; // Game is full
    }
  } catch (error) {
    console.error("Firebase error joining game:", error);
    throw error; // Re-throw to allow caller to handle it
  }
};

// Make a move in the game
export const makeMove = async (gameId: string, playerId: string, index: number): Promise<boolean> => {
  try {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    if (!playerId) {
      throw new Error("Player ID is required");
    }

    if (index < 0 || index > 8) {
      throw new Error("Invalid move index");
    }

    // Validate game ID format
    if (!/^[-a-zA-Z0-9_]+$/.test(gameId)) {
      console.error(`Invalid game ID format: ${gameId}`);
      return false; // Invalid game ID format
    }

    console.log(`Player ${playerId} attempting to make move at index ${index} in game ${gameId}`);

    // Get current game state
    const gamesRef = ref(database);
    const gameRef = child(gamesRef, `games/${gameId}`);

    console.log(`Fetching game data from path: games/${gameId}`);
    const gameSnapshot = await get(gameRef);

    if (!gameSnapshot.exists()) {
      console.error(`Game with ID ${gameId} does not exist`);
      return false; // Game doesn't exist
    }

    console.log(`Game found. Processing game data...`);
    const gameState = gameSnapshot.val() as GameState;

    // Check if game state is valid
    if (!gameState) {
      console.error(`Invalid game state for game ID: ${gameId}`);
      return false; // Invalid game state
    }

    // Initialize missing properties if needed
    if (!gameState.players) {
      console.warn(`Game state for game ${gameId} is missing players property, initializing it`);
      gameState.players = { x: null, o: null, xDisplayName: null, oDisplayName: null };
    }

    if (!gameState.squares || !Array.isArray(gameState.squares) || gameState.squares.length !== 9) {
      console.warn(`Game state for game ${gameId} is missing squares property, it's not an array, or it doesn't have 9 elements: ${JSON.stringify(gameState.squares)}. Initializing it properly.`);

      // Save a copy of the original array if it exists
      const originalSquares = Array.isArray(gameState.squares) ? [...gameState.squares] : [];

      // Reinitialize with 9 null elements
      gameState.squares = Array(9).fill(null);

      // If we had a malformed array with some values, try to preserve them in the new array
      if (originalSquares.length > 0) {
        for (let i = 0; i < Math.min(originalSquares.length, 9); i++) {
          if (originalSquares[i] === 'X' || originalSquares[i] === 'O') {
            gameState.squares[i] = originalSquares[i];
          }
        }
      }

      console.log(`Reinitialized squares array in makeMove: ${JSON.stringify(gameState.squares)}`);
    } else {
      // Convert empty strings to null for consistency in the application
      // Firebase stores empty values as empty strings, but our app uses null
      gameState.squares = gameState.squares.map(square => square === "" ? null : square);
    }

    if (gameState.xIsNext === undefined) {
      console.warn(`Game state for game ${gameId} is missing xIsNext property, initializing it to true`);
      gameState.xIsNext = true;
    }

    if (gameState.gameOver === undefined) {
      console.warn(`Game state for game ${gameId} is missing gameOver property, initializing it to false`);
      gameState.gameOver = false;
    }

    if (gameState.winner === undefined) {
      console.warn(`Game state for game ${gameId} is missing winner property, initializing it to null`);
      gameState.winner = null;
    }

    if (!gameState.stats) {
      console.warn(`Game state for game ${gameId} is missing stats property, initializing it`);
      gameState.stats = {
        xWins: 0,
        oWins: 0,
        draws: 0
      };
    }

    // Check if it's a valid move
    if (gameState.gameOver) {
      console.log(`Game is already over. Move rejected.`);
      return false; // Game is over
    }

    // Log the current state of the squares array for debugging
    console.log(`Current squares array:`, JSON.stringify(gameState.squares));
    console.log(`Attempting to make move at index ${index}`);
    console.log(`Value at index ${index}:`, gameState.squares[index]);

    // Ensure the squares array is properly initialized
    if (!Array.isArray(gameState.squares)) {
      console.warn(`Squares array is not properly initialized. Initializing it now.`);
      gameState.squares = Array(9).fill(null);
    }

    // Check if the square is already occupied
    // Only consider a square occupied if it has a non-null value (X or O)
    if (gameState.squares[index] === 'X' || gameState.squares[index] === 'O') {
      console.log(`Square ${index} is already occupied with ${gameState.squares[index]}. Move rejected.`);
      return false; // Square already occupied
    }

    const isPlayerX = gameState.players.x === playerId;
    const isPlayerO = gameState.players.o === playerId;

    if (gameState.xIsNext && !isPlayerX) {
      console.log(`It's X's turn but player ${playerId} is not X. Move rejected.`);
      return false; // Not player's turn
    }

    if (!gameState.xIsNext && !isPlayerO) {
      console.log(`It's O's turn but player ${playerId} is not O. Move rejected.`);
      return false; // Not player's turn
    }

    // Make the move
    console.log(`Making move: ${gameState.xIsNext ? 'X' : 'O'} at index ${index}`);

    // Ensure squares is a properly initialized array before spreading
    let newSquares;
    if (!Array.isArray(gameState.squares) || gameState.squares.length !== 9) {
      console.warn(`Squares array is malformed: ${JSON.stringify(gameState.squares)}. Reinitializing with 9 elements.`);
      newSquares = Array(9).fill(null);
    } else {
      newSquares = [...gameState.squares];
    }

    newSquares[index] = gameState.xIsNext ? 'X' : 'O';
    console.log(`Updated squares array: ${JSON.stringify(newSquares)}`);

    // Check for winner
    const winner = calculateWinner(newSquares);
    const isDraw = !winner && !newSquares.includes(null);

    // Update game state
    // Ensure all values in the squares array are either 'X', 'O', or empty string (not null or undefined)
    // Firebase can have issues with null values in arrays
    const firebaseSafeSquares = newSquares.map(square => square === null ? "" : square);

    const updates: any = {
      squares: firebaseSafeSquares,
      xIsNext: !gameState.xIsNext,
    };

    if (winner || isDraw) {
      updates.gameOver = true;
      updates.winner = winner;

      // Update stats
      if (winner === 'X') {
        console.log(`Player X wins!`);
        updates['stats/xWins'] = gameState.stats.xWins + 1;
      } else if (winner === 'O') {
        console.log(`Player O wins!`);
        updates['stats/oWins'] = gameState.stats.oWins + 1;
      } else if (isDraw) {
        console.log(`Game ended in a draw!`);
        updates['stats/draws'] = gameState.stats.draws + 1;
      }
    }

    // Save to Firebase
    console.log(`Updating game state in Firebase...`);
    try {
      await update(ref(database, `games/${gameId}`), updates);
      console.log(`Move successfully made and game state updated.`);
    } catch (updateError) {
      console.error(`Firebase error making move: ${updateError}`);
      console.error(`Failed update object:`, JSON.stringify(updates));
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error("Firebase error making move:", error);
    throw error; // Re-throw to allow caller to handle it
  }
};

// Reset the game
export const resetGame = async (gameId: string, playerId: string): Promise<boolean> => {
  try {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    if (!playerId) {
      throw new Error("Player ID is required");
    }

    // Validate game ID format
    if (!/^[-a-zA-Z0-9_]+$/.test(gameId)) {
      console.error(`Invalid game ID format: ${gameId}`);
      return false; // Invalid game ID format
    }

    console.log(`Player ${playerId} attempting to reset game ${gameId}`);

    // Get current game state
    const gamesRef = ref(database);
    const gameRef = child(gamesRef, `games/${gameId}`);

    console.log(`Fetching game data from path: games/${gameId}`);
    const gameSnapshot = await get(gameRef);

    if (!gameSnapshot.exists()) {
      console.error(`Game with ID ${gameId} does not exist`);
      return false; // Game doesn't exist
    }

    console.log(`Game found. Processing game data...`);
    const gameState = gameSnapshot.val() as GameState;

    // Check if game state is valid
    if (!gameState) {
      console.error(`Invalid game state for game ID: ${gameId}`);
      return false; // Invalid game state
    }

    // Initialize missing properties if needed
    if (!gameState.players) {
      console.warn(`Game state for game ${gameId} is missing players property, initializing it`);
      gameState.players = { x: null, o: null, xDisplayName: null, oDisplayName: null };
    }

    // Ensure the squares array is properly initialized
    if (!gameState.squares || !Array.isArray(gameState.squares) || gameState.squares.length !== 9) {
      console.warn(`Game state for game ${gameId} is missing squares property, it's not an array, or it doesn't have 9 elements: ${JSON.stringify(gameState.squares)}. Initializing it properly.`);

      // Save a copy of the original array if it exists
      const originalSquares = Array.isArray(gameState.squares) ? [...gameState.squares] : [];

      // Reinitialize with 9 null elements
      gameState.squares = Array(9).fill(null);

      // If we had a malformed array with some values, try to preserve them in the new array
      if (originalSquares.length > 0) {
        for (let i = 0; i < Math.min(originalSquares.length, 9); i++) {
          if (originalSquares[i] === 'X' || originalSquares[i] === 'O') {
            gameState.squares[i] = originalSquares[i];
          }
        }
      }

      console.log(`Reinitialized squares array in resetGame: ${JSON.stringify(gameState.squares)}`);
    } else {
      // Convert empty strings to null for consistency in the application
      // Firebase stores empty values as empty strings, but our app uses null
      gameState.squares = gameState.squares.map(square => square === "" ? null : square);
    }

    // Check if player is in the game
    const isPlayerX = gameState.players.x === playerId;
    const isPlayerO = gameState.players.o === playerId;

    if (!isPlayerX && !isPlayerO) {
      console.error(`Player ${playerId} is not in game ${gameId}`);
      return false; // Player is not in the game
    }

    console.log(`Player ${playerId} is authorized to reset the game.`);

    // Reset game state
    // Use empty strings instead of null for Firebase compatibility
    const updates = {
      squares: Array(9).fill(""),
      xIsNext: true,
      gameOver: false,
      winner: null,
    };

    // Save to Firebase
    console.log(`Resetting game state in Firebase...`);
    try {
      await update(ref(database, `games/${gameId}`), updates);
      console.log(`Game successfully reset.`);
    } catch (updateError) {
      console.error(`Firebase error resetting game: ${updateError}`);
      console.error(`Failed update object:`, JSON.stringify(updates));
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error("Firebase error resetting game:", error);
    throw error; // Re-throw to allow caller to handle it
  }
};

// Listen for game state changes
export const onGameStateChanged = (gameId: string, callback: (gameState: GameState) => void): (() => void) => {
  try {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    // Validate game ID format
    if (!/^[-a-zA-Z0-9_]+$/.test(gameId)) {
      console.error(`Invalid game ID format: ${gameId}`);
      throw new Error("Invalid game ID format");
    }

    console.log(`Setting up listener for game ${gameId}`);

    // Create reference to the game in Firebase
    const gameRef = ref(database, `games/${gameId}`);

    // Set up the listener
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log(`Received game state update for game ${gameId}`);
        const gameState = snapshot.val() as GameState;

        // Validate game state before passing to callback
        if (!gameState) {
          console.error(`Invalid game state received for game ${gameId}`);
          return;
        }

        // Initialize missing properties if needed
        if (!gameState.players) {
          console.warn(`Game state for game ${gameId} is missing players property, initializing it`);
          gameState.players = { x: null, o: null, xDisplayName: null, oDisplayName: null };
        }

        if (!gameState.squares || !Array.isArray(gameState.squares) || gameState.squares.length !== 9) {
          console.warn(`Game state for game ${gameId} is missing squares property, it's not an array, or it doesn't have 9 elements: ${JSON.stringify(gameState.squares)}. Initializing it properly.`);

          // Save a copy of the original array if it exists
          const originalSquares = Array.isArray(gameState.squares) ? [...gameState.squares] : [];

          // Reinitialize with 9 null elements
          gameState.squares = Array(9).fill(null);

          // If we had a malformed array with some values, try to preserve them in the new array
          if (originalSquares.length > 0) {
            for (let i = 0; i < Math.min(originalSquares.length, 9); i++) {
              if (originalSquares[i] === 'X' || originalSquares[i] === 'O') {
                gameState.squares[i] = originalSquares[i];
              }
            }
          }

          console.log(`Reinitialized squares array: ${JSON.stringify(gameState.squares)}`);
        } else {
          // Convert empty strings to null for consistency in the application
          // Firebase stores empty values as empty strings, but our app uses null
          gameState.squares = gameState.squares.map(square => square === "" ? null : square);
        }

        if (gameState.xIsNext === undefined) {
          console.warn(`Game state for game ${gameId} is missing xIsNext property, initializing it to true`);
          gameState.xIsNext = true;
        }

        if (gameState.gameOver === undefined) {
          console.warn(`Game state for game ${gameId} is missing gameOver property, initializing it to false`);
          gameState.gameOver = false;
        }

        if (gameState.winner === undefined) {
          console.warn(`Game state for game ${gameId} is missing winner property, initializing it to null`);
          gameState.winner = null;
        }

        if (!gameState.stats) {
          console.warn(`Game state for game ${gameId} is missing stats property, initializing it`);
          gameState.stats = {
            xWins: 0,
            oWins: 0,
            draws: 0
          };
        }

        callback(gameState);
      } else {
        console.error(`Game with ID ${gameId} does not exist or was deleted`);
      }
    }, (error) => {
      console.error(`Error listening to game ${gameId}:`, error);
    });

    // Return function to unsubscribe from updates
    return () => {
      console.log(`Unsubscribing from game ${gameId} updates`);
      unsubscribe();
    };
  } catch (error) {
    console.error("Error setting up game listener:", error);
    // Return a no-op function since we can't return null/undefined
    return () => {};
  }
};

// Helper function to calculate winner (copied from App.tsx)
const calculateWinner = (squares: Array<string | null>): string | null => {
  const lines = [
    [0, 1, 2], // top row
    [3, 4, 5], // middle row
    [6, 7, 8], // bottom row
    [0, 3, 6], // left column
    [1, 4, 7], // middle column
    [2, 5, 8], // right column
    [0, 4, 8], // diagonal from top-left
    [2, 4, 6]  // diagonal from top-right
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }

  return null;
};
