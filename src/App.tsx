import React, {useState, useEffect} from 'react';
import './App.css';
import Board from './components/Board';
import styles from './Game.module.css';
import mobileStyles from './Mobile.module.css';
import {
    createGame,
    joinGame,
    makeMove,
    resetGame,
    onGameStateChanged,
    generatePlayerId,
    GameState
} from './services/gameService';

// Function to determine if a player has won
const calculateWinner = (squares: Array<string | null>): string | null => {
    // All possible winning combinations (rows, columns, diagonals)
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

    // Check each winning combination
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        // If all three squares in a line have the same value (and not null), we have a winner
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }

    // No winner found
    return null;
};

// Function to find a winning move for a player
const findWinningMove = (squares: Array<string | null>, player: string): number => {
    // Get all available moves (empty squares)
    const availableMoves = squares
        .map((square, index) => square === null ? index : -1)
        .filter(index => index !== -1);

    // Check each available move to see if it would result in a win
    for (const move of availableMoves) {
        // Create a copy of the board with the move applied
        const boardCopy = [...squares];
        boardCopy[move] = player;

        // Check if this move would result in a win
        if (calculateWinner(boardCopy) === player) {
            return move;
        }
    }

    // No winning move found
    return -1;
};

// Function to determine the computer's move
const getComputerMove = (squares: Array<string | null>): number => {
    // Get all available moves (empty squares)
    const availableMoves = squares
        .map((square, index) => square === null ? index : -1)
        .filter(index => index !== -1);

    // If no available moves, return -1
    if (availableMoves.length === 0) {
        return -1;
    }

    // Check if computer can win in the next move
    const winningMove = findWinningMove(squares, 'O');
    if (winningMove !== -1) {
        return winningMove;
    }

    // Block human player from winning in the next move
    const blockingMove = findWinningMove(squares, 'X');
    if (blockingMove !== -1) {
        return blockingMove;
    }

    // Take center if available (strategic advantage)
    if (squares[4] === null) {
        return 4;
    }

    // Take corners if available (strategic advantage)
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => squares[corner] === null);
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take sides if available
    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(side => squares[side] === null);
    if (availableSides.length > 0) {
        return availableSides[Math.floor(Math.random() * availableSides.length)];
    }

    // Fallback to random move (should never reach here with the above strategy)
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
};

function App() {
    // Player and game identification
    const [playerId, setPlayerId] = useState<string>(() => {
        // Check if we already have a player ID in sessionStorage
        const existingId = sessionStorage.getItem('sessionPlayerId');

        if (existingId) {
            console.log(`Using existing player ID from session storage: ${existingId}`);
            return existingId;
        }

        // Generate a new session-specific ID component if none exists
        const sessionId = generatePlayerId();

        // Store this session ID in sessionStorage (unique per tab)
        sessionStorage.setItem('sessionPlayerId', sessionId);

        // Log the generated ID for debugging
        console.log(`Generated unique player ID for this session: ${sessionId}`);

        // Return the session-specific ID
        return sessionId;
    });

    // Game modes: 'local-computer' or 'online'
    const [gameMode, setGameMode] = useState<'local-computer' | 'online'>('local-computer');

    // Online game state
    const [gameId, setGameId] = useState<string | null>(null);
    const [isCreator, setIsCreator] = useState<boolean>(false);
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [joinGameId, setJoinGameId] = useState<string>('');
    const [inviteLink, setInviteLink] = useState<string>('');
    const [isLinkCopied, setIsLinkCopied] = useState<boolean>(false);
    const [displayName, setDisplayName] = useState<string>('');

    // Local game state (used for local games)
    const [squares, setSquares] = useState<Array<string | null>>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState<boolean>(true);
    const [stats, setStats] = useState({
        xWins: 0,
        oWins: 0,
        draws: 0
    });
    const [gameOver, setGameOver] = useState<boolean>(false);

    // Always true since we only have 'local-computer' and 'online' modes
    const vsComputer = true;

    // Online game state
    const [onlineGameState, setOnlineGameState] = useState<GameState | null>(null);

    // Mobile UI state
    const [isGameIdSheetVisible, setIsGameIdSheetVisible] = useState<boolean>(false);
    const [isWinnerOverlayVisible, setIsWinnerOverlayVisible] = useState<boolean>(false);

    // Check for game over conditions (local games only)
    useEffect(() => {
        // Skip if game is already over or if we're in online mode
        if (gameOver || gameMode === 'online') return;

        const winner = calculateWinner(squares);

        // Check if there's a winner
        if (winner) {
            setGameOver(true);
            if (winner === 'X') {
                setStats(prevStats => ({...prevStats, xWins: prevStats.xWins + 1}));
            } else {
                setStats(prevStats => ({...prevStats, oWins: prevStats.oWins + 1}));
            }
        }
        // Check if it's a draw (all squares filled and no winner)
        else if (!squares.includes(null)) {
            setGameOver(true);
            setStats(prevStats => ({...prevStats, draws: prevStats.draws + 1}));
        }
    }, [squares, gameOver, gameMode]);

    // Computer's turn (local-computer mode only)
    useEffect(() => {
        // Only make a move if it's the computer's turn (O), the game is not over, there's no winner, and we're in local-computer mode
        if (gameMode === 'local-computer' && !xIsNext && !gameOver && !calculateWinner(squares)) {
            // Add a small delay to make the computer's move feel more natural
            const timeoutId = setTimeout(() => {
                const computerMoveIndex = getComputerMove(squares);

                // If a valid move is found, make the move
                if (computerMoveIndex !== -1) {
                    const newSquares = [...squares];
                    newSquares[computerMoveIndex] = 'O';
                    setSquares(newSquares);
                    setXIsNext(true); // Switch back to human player
                }
            }, 500); // 500ms delay

            // Clean up the timeout if the component unmounts or the dependencies change
            return () => clearTimeout(timeoutId);
        }
    }, [xIsNext, squares, gameOver, gameMode]);

    // Listen for online game state changes
    useEffect(() => {
        if (gameMode !== 'online' || !gameId) return;

        // Subscribe to game state changes
        const unsubscribe = onGameStateChanged(gameId, (gameState) => {
            // Check if opponent has joined (player O changed from null to a value)
            if (onlineGameState && !onlineGameState.players.o && gameState.players.o) {
                // Notify that opponent has joined
                const notification = document.createElement('div');
                notification.className = 'game-notification join-notification';
                notification.textContent = 'Opponent has joined the game!';
                document.querySelector('.game-main')?.appendChild(notification);

                // Remove notification after 3 seconds
                setTimeout(() => {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 500);
                }, 3000);
            }

            // Check if opponent has left (player O changed from a value to null)
            if (onlineGameState && onlineGameState.players.o && !gameState.players.o) {
                // Notify that opponent has left
                const notification = document.createElement('div');
                notification.className = 'game-notification leave-notification';
                notification.textContent = 'Opponent has left the game!';
                document.querySelector('.game-main')?.appendChild(notification);

                // Remove notification after 3 seconds
                setTimeout(() => {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 500);
                }, 3000);
            }

            setOnlineGameState(gameState);
        });

        // Clean up subscription when component unmounts or dependencies change
        return () => unsubscribe();
    }, [gameMode, gameId]); // Removed onlineGameState from dependencies to prevent re-subscription cycles

    // Create a new online game
    const createOnlineGame = async () => {
        try {
            console.log(`Creating new online game for player: ${playerId}`);
            console.log(`This tab's unique player ID: ${sessionStorage.getItem('sessionPlayerId')}`);
            console.log(`Using display name: ${displayName || "Player X"}`);
            const newGameId = await createGame(playerId, displayName);

            console.log(`Game created with ID: ${newGameId}`);
            setGameId(newGameId);
            setIsCreator(true);

            // Generate invite link
            const baseUrl = window.location.origin;
            const link = `${baseUrl}?gameId=${newGameId}`;
            setInviteLink(link);
            console.log(`Generated invite link: ${link}`);

            // Switch to online mode
            setGameMode('online');

            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'game-notification join-notification';
            notification.textContent = 'Game created successfully! Share the Game ID to invite a friend.';
            document.querySelector('.game-main')?.appendChild(notification);

            // Remove notification after 3 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 500);
            }, 3000);

        } catch (error) {
            console.error('Error creating game:', error);

            // Provide more detailed error message to help with debugging
            let errorMessage: string;

            if (error instanceof Error) {
                console.error(`Error details: ${error.message}`);
                errorMessage = `Failed to create game: ${error.message}`;

                // Check for specific error types
                if (error.message.includes('permission_denied')) {
                    errorMessage += '\n\nThis may be due to Firebase security rules. Please check the README.md file for instructions on how to fix Firebase permission issues.';
                }
            } else {
                errorMessage = 'Failed to create game. Please try again.';
            }

            alert(errorMessage);
        }
    };

    // Join an existing online game
    const joinOnlineGame = async (id: string) => {
        try {
            // Trim the game ID to remove any accidental whitespace
            const trimmedId = id.trim();

            if (!trimmedId) {
                alert('Please enter a valid Game ID.');
                return;
            }

            console.log(`Attempting to join game with ID: ${trimmedId} as player: ${playerId}`);
            console.log(`This tab's unique player ID: ${sessionStorage.getItem('sessionPlayerId')}`);
            console.log(`Using display name: ${displayName || "Player O"}`);
            const success = await joinGame(trimmedId, playerId, displayName);

            if (success) {
                console.log(`Successfully joined game with ID: ${trimmedId}`);
                setGameId(trimmedId);
                setIsCreator(false);
                setIsJoining(false);
                setGameMode('online');

                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'game-notification join-notification';
                notification.textContent = 'Successfully joined the game!';
                document.querySelector('.game-main')?.appendChild(notification);

                // Remove notification after 3 seconds
                setTimeout(() => {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 500);
                }, 3000);
            } else {
                console.error(`Failed to join game with ID: ${trimmedId}`);

                // Check if the game ID format is valid
                if (!/^[-a-zA-Z0-9_]+$/.test(trimmedId)) {
                    alert('Invalid Game ID format. Game IDs should only contain letters, numbers, hyphens, and underscores.');
                } else {
                    // Show a more detailed error message
                    alert('Failed to join game. The game may not exist or is already full. Please check the Game ID and try again.\n\nIf you created this game, you are already player X and cannot join as player O.');
                }
            }
        } catch (error) {
            console.error('Error joining game:', error);
            // Provide more detailed error message to help with debugging
            let errorMessage: string;

            if (error instanceof Error) {
                console.error(`Error details: ${error.message}`);
                errorMessage = `Failed to join game: ${error.message}`;

                // Check for specific error types
                if (error.message.includes('permission_denied')) {
                    errorMessage += '\n\nThis may be due to Firebase security rules. Please check the README.md file for instructions on how to fix Firebase permission issues.';
                }
            } else {
                errorMessage = 'Failed to join game. Please try again.';
            }

            alert(errorMessage);
        }
    };

    // Check URL for game ID on component mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlGameId = params.get('gameId');

        if (urlGameId) {
            console.log(`Found game ID in URL: ${urlGameId}`);

            // Validate the game ID format
            if (!/^[-a-zA-Z0-9_]+$/.test(urlGameId)) {
                console.error(`Invalid game ID format in URL: ${urlGameId}`);
                alert('Invalid Game ID format in URL. Game IDs should only contain letters, numbers, hyphens, and underscores.');
                return;
            }

            setJoinGameId(urlGameId);

            // Automatically attempt to join the game from URL
            // This provides a better user experience when clicking on invite links
            console.log(`Automatically attempting to join game: ${urlGameId}`);
            joinOnlineGame(urlGameId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [/* Adding joinOnlineGame to dependencies would cause infinite loop, so we disable the eslint rule */]);

    // Copy invite link to clipboard
    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink)
            .then(() => {
                setIsLinkCopied(true);
                setTimeout(() => setIsLinkCopied(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy link:', err);
            });
    };

    // Reset the game
    const handleResetGame = () => {
        if (gameMode === 'online' && gameId) {
            // For online games, use the resetGame function from gameService
            resetGame(gameId, playerId).catch(error => {
                console.error('Error resetting game:', error);
                // Provide more detailed error message to help with debugging
                const errorMessage = error instanceof Error
                    ? `Failed to reset game: ${error.message}`
                    : 'Failed to reset game. Please try again.';
                alert(errorMessage);
            });
        } else {
            // For local games, reset state directly
            setSquares(Array(9).fill(null));
            setXIsNext(true);
            setGameOver(false);
        }
    };

    // Switch to local mode
    const switchToLocalMode = () => {
        setGameMode('local-computer');
        setGameId(null);
        setOnlineGameState(null);
        setInviteLink('');
        setIsCreator(false);
        setSquares(Array(9).fill(null));
        setXIsNext(true);
        setGameOver(false);
    };

    // Handle click on a square
    const handleClick = (index: number) => {
        if (gameMode === 'online' && gameId) {
            // For online games, use the makeMove function from gameService
            makeMove(gameId, playerId, index).catch(error => {
                console.error('Error making move:', error);
                // Provide more detailed error message to help with debugging
                const errorMessage = error instanceof Error
                    ? `Failed to make move: ${error.message}`
                    : 'Failed to make move. Please try again.';
                alert(errorMessage);
            });
        } else {
            // For local games, handle move directly

            // If square is already filled, game is over, or game is won, do nothing
            if (squares[index] || gameOver || calculateWinner(squares)) {
                return;
            }

            // In local-computer mode, only allow clicks when it's the human player's turn (X)
            if (gameMode === 'local-computer' && !xIsNext) {
                return;
            }

            // Create a copy of the squares array
            const newSquares = [...squares];
            // Update the value of the clicked square based on whose turn it is
            newSquares[index] = xIsNext ? 'X' : 'O';
            // Update the squares state
            setSquares(newSquares);
            // Toggle the turn
            setXIsNext(!xIsNext);
        }
    };

    // Determine game status message
    const getStatus = () => {
        const winner = calculateWinner(squares);
        if (winner) {
            return `Winner: ${winner === 'X' ? 'You (X)' : 'Computer (O)'}`;
        } else if (gameOver) {
            return 'Game ended in a draw!';
        } else {
            return xIsNext ? 'Your turn (X)' : 'Computer thinking... (O)';
        }
    };


    // Get status for online games
    const getOnlineStatus = () => {
        if (!onlineGameState) return 'Loading game...';

        const {xIsNext, gameOver, winner, players} = onlineGameState;
        const isPlayerX = players.x === playerId;
        const isPlayerO = players.o === playerId;
        const playerSymbol = isPlayerX ? 'X' : (isPlayerO ? 'O' : 'Observer');

        if (winner) {
            if (winner === playerSymbol) {
                return `Winner: ${isPlayerX ? (displayName || 'You') : (isPlayerO ? (displayName || 'You') : 'You')} (${playerSymbol})`;
            } else {
                const opponentName = winner === 'X' ? (players.xDisplayName || 'Opponent') : (players.oDisplayName || 'Opponent');
                return `Winner: ${opponentName} (${winner})`;
            }
        } else if (gameOver) {
            return 'Game ended in a draw!';
        } else if (!players.o) {
            if (isPlayerX) {
                return `Waiting for opponent to join... You are ${displayName || 'Player X'} (host)`;
            } else {
                return `Waiting for Player O to join... You are observing`;
            }
        } else {
            // Game has both players
            if (isPlayerX) {
                const isYourTurn = xIsNext;
                const yourName = displayName || 'Your';
                const opponentName = players.oDisplayName || 'Opponent';
                if (isYourTurn) {
                    return `${yourName}'s turn (Player X - host)`;
                } else {
                    return `${opponentName}'s turn (Player O - joiner)`;
                }
            } else if (isPlayerO) {
                const isYourTurn = !xIsNext;
                const yourName = displayName || 'Your';
                const opponentName = players.xDisplayName || 'Opponent';
                if (isYourTurn) {
                    return `${yourName}'s turn (Player O - joiner)`;
                } else {
                    return `${opponentName}'s turn (Player X - host)`;
                }
            } else {
                // Observer
                const playerXName = players.xDisplayName || 'Player X';
                const playerOName = players.oDisplayName || 'Player O';
                return `Observing game: ${xIsNext ? playerXName : playerOName}'s turn`;
            }
        }
    };

    // Get additional game information for online games
    const getOnlineGameInfo = (className?: string) => {
        if (!gameId || !onlineGameState) return null;

        const {players} = onlineGameState;
        const isPlayerX = players.x === playerId;
        const isPlayerO = players.o === playerId;

        return (
            <div className={`game-info ${className || ''}`}>
                <div className="game-id-container">
                    <span className="game-id-label">Game ID:</span>
                    <span className="game-id-value">{gameId}</span>
                    <button
                        className="copy-id-button"
                        onClick={() => {
                            navigator.clipboard.writeText(gameId);

                            // Create notification instead of alert
                            const notification = document.createElement('div');
                            notification.className = 'game-notification join-notification';
                            notification.textContent = 'Game ID copied to clipboard!';
                            document.querySelector('.game-main')?.appendChild(notification);

                            // Remove notification after 2 seconds
                            setTimeout(() => {
                                notification.classList.add('fade-out');
                                setTimeout(() => notification.remove(), 500);
                            }, 2000);
                        }}
                    >
                        Copy ID
                    </button>
                </div>

                <div className="player-info">
                    <div className="player-x">
                        <span className="player-label">Player X (Host):</span>
                        <span className="player-value">
              {isPlayerX ? (displayName || 'You') : (players.xDisplayName || (players.x ? 'Opponent' : 'Waiting...'))}
            </span>
                    </div>
                    <div className="player-o">
                        <span className="player-label">Player O (Joiner):</span>
                        <span className="player-value">
              {isPlayerO ? (displayName || 'You') : (players.oDisplayName || (players.o ? 'Opponent' : 'Waiting...'))}
            </span>
                    </div>
                </div>

                {/* Message for player X when waiting for opponent */}
                {!players.o && isCreator && (
                    <div className="waiting-message">
                        {displayName || "You"} created the game! Share the Game ID or invite link with a friend to play
                        together!
                    </div>
                )}

                {/* Message for player O when they've joined */}
                {players.o && isPlayerO && (
                    <div className="joined-message">
                        {displayName || "You"} joined as Player O! Wait for {players.xDisplayName || "Player X"} to make
                        the first move.
                    </div>
                )}

                {/* Message for player X when player O has joined */}
                {players.o && isPlayerX && (
                    <div className="joined-message">
                        {players.oDisplayName || "Player O"} has joined! {displayName || "You"} go first as Player X.
                    </div>
                )}
            </div>
        );
    };

    // Show winner overlay when game is over
    useEffect(() => {
        if ((gameMode === 'online' && onlineGameState?.winner) ||
            (gameMode !== 'online' && calculateWinner(squares))) {
            setIsWinnerOverlayVisible(true);

            // Hide overlay after 3 seconds
            const timeoutId = setTimeout(() => {
                setIsWinnerOverlayVisible(false);
            }, 3000);

            return () => clearTimeout(timeoutId);
        }
    }, [gameMode, onlineGameState?.winner, squares]);

    return (
        <div className="App">
            <header className={`App-header ${mobileStyles.mobileContainer}`}>
                <h1 className={`game-title ${mobileStyles.gameTitle}`}>Tic Tac Toe</h1>

                <div className={`container ${mobileStyles.container}`}>
                    {/* Main area - Game Board */}
                    <div className={`board-wrapper ${mobileStyles.boardWrapper}`}>
                        <div className={`game-main ${mobileStyles.gameMain}`}>
                            {/* Game ID link icon for mobile */}
                            {gameMode === 'online' && gameId && (
                                <div
                                    className={mobileStyles.gameIdLink}
                                    onClick={() => setIsGameIdSheetVisible(true)}
                                >
                                    🔗
                                </div>
                            )}

                            {/* Game ID bottom sheet for mobile */}
                            {gameMode === 'online' && gameId && (
                                <div
                                    className={`${mobileStyles.gameIdSheet} ${isGameIdSheetVisible ? mobileStyles.gameIdSheetVisible : ''}`}>
                                    <div className={mobileStyles.gameIdSheetHeader}>
                                        <div className={mobileStyles.gameIdSheetTitle}>Game ID</div>
                                        <button
                                            className={mobileStyles.gameIdSheetClose}
                                            onClick={() => setIsGameIdSheetVisible(false)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className={mobileStyles.gameIdValue}>{gameId}</div>
                                    <button
                                        className={mobileStyles.copyButton}
                                        onClick={() => {
                                            navigator.clipboard.writeText(gameId);

                                            // Create notification
                                            const notification = document.createElement('div');
                                            notification.className = 'game-notification join-notification';
                                            notification.textContent = 'Game ID copied to clipboard!';
                                            document.querySelector('.game-main')?.appendChild(notification);

                                            // Remove notification after 2 seconds
                                            setTimeout(() => {
                                                notification.classList.add('fade-out');
                                                setTimeout(() => notification.remove(), 500);
                                            }, 2000);

                                            // Hide sheet after copying
                                            setIsGameIdSheetVisible(false);
                                        }}
                                    >
                                        Copy Game ID
                                    </button>
                                </div>
                            )}

                            {/* Join game dialog */}
                            {isJoining && (
                                <div className="join-dialog">
                                    <h3>Join Game</h3>
                                    <input
                                        type="text"
                                        value={joinGameId}
                                        onChange={(e) => setJoinGameId(e.target.value)}
                                        placeholder="Enter Game ID"
                                        className="join-input"
                                    />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Enter your display name"
                                        className="join-input"
                                    />
                                    <div className="join-buttons">
                                        <button
                                            className="join-button"
                                            onClick={() => joinOnlineGame(joinGameId)}
                                        >
                                            Join
                                        </button>
                                        <button
                                            className="cancel-button"
                                            onClick={() => setIsJoining(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Joined message as slim pill for mobile */}
                            {gameMode === 'online' && onlineGameState?.players.o && (
                                <div className={mobileStyles.joinedPill}>
                                    {onlineGameState.players.o === playerId
                                        ? `${displayName || "You"} joined as Player O!`
                                        : `${onlineGameState.players.oDisplayName || "Player O"} has joined!`}
                                </div>
                            )}

                            {/* Game status */}
                            <div className={`status ${mobileStyles.status} ${
                                (gameMode === 'online' && onlineGameState?.winner) ||
                                (gameMode !== 'online' && calculateWinner(squares))
                                    ? 'winner-status' : ''
                            }`}>
                                {gameMode === 'online' ? getOnlineStatus() : getStatus()}
                            </div>

                            {/* Winner overlay for mobile */}
                            <div
                                className={`${mobileStyles.winnerOverlay} ${isWinnerOverlayVisible ? mobileStyles.winnerOverlayVisible : ''}`}>
                                <div className={mobileStyles.winnerMessage}>
                                    {gameOver && (
                                        gameMode === 'online'
                                            ? (onlineGameState?.winner === (onlineGameState?.players.x === playerId ? 'X' : 'O')
                                                ? 'You Win!'
                                                : 'Opponent Wins!')
                                            : (calculateWinner(squares) === 'X'
                                                ? 'You Win!'
                                                : 'Computer Wins!')
                                    )}
                                </div>
                            </div>

                            {/* Game board */}
                            <div className={`
                ${(gameMode === 'online' && onlineGameState?.winner) ||
                            (gameMode !== 'online' && calculateWinner(squares))
                                ? styles.winner : ''}
                ${mobileStyles.board}
                ${mobileStyles.gameBoard}
              `} style={{width: '100%', height: '100%'}}>
                                {gameMode === 'online' && onlineGameState ? (
                                    <Board
                                        squares={onlineGameState.squares}
                                        onClick={handleClick}
                                        mobileStyles={mobileStyles}
                                    />
                                ) : (
                                    <Board
                                        squares={squares}
                                        onClick={handleClick}
                                        mobileStyles={mobileStyles}
                                    />
                                )}
                            </div>

                            {/* Floating action buttons for mobile */}
                            <div className={mobileStyles.fabContainer}>
                                {gameMode === 'online' ? (
                                    <button
                                        className={`${mobileStyles.fab} ${mobileStyles.fabLeft}`}
                                        onClick={switchToLocalMode}
                                        aria-label="Exit to Local Mode"
                                    >
                                        ⏮️
                                    </button>
                                ) : (
                                    <button
                                        className={`${mobileStyles.fab} ${mobileStyles.fabLeft}`}
                                        onClick={() => setIsJoining(true)}
                                        aria-label="Join Online Game"
                                    >
                                        🌐
                                    </button>
                                )}

                                {((gameMode !== 'online' && gameOver) ||
                                    (gameMode === 'online' && onlineGameState?.gameOver)) && (
                                    <button
                                        className={`${mobileStyles.fab} ${mobileStyles.fabRight}`}
                                        onClick={handleResetGame}
                                        aria-label="Play Again"
                                    >
                                        🔄
                                    </button>
                                )}

                                {!gameOver && gameMode !== 'online' && (
                                    <button
                                        className={`${mobileStyles.fab} ${mobileStyles.fabRight}`}
                                        onClick={handleResetGame}
                                        aria-label="New Game"
                                    >
                                        🔄
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Controls and Stats (hidden on mobile) */}
                    <div className="sidebar">
                        {/* Game Controls */}
                        <div className="game-sidebar">
                            {/* Game mode selector */}
                            {gameMode !== 'online' ? (
                                <div className="game-mode-selector">
                                    <div className="mode-label">
                                        Current Mode: Human vs Computer
                                    </div>
                                    <div className="display-name-container">
                                        <label htmlFor="display-name">Your Display Name:</label>
                                        <input
                                            type="text"
                                            id="display-name"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="display-name-input"
                                        />
                                    </div>
                                    <button
                                        className="mode-button"
                                        onClick={createOnlineGame}
                                    >
                                        Create Online Game
                                    </button>
                                    <button
                                        className="mode-button"
                                        onClick={() => setIsJoining(true)}
                                    >
                                        Join Online Game
                                    </button>
                                </div>
                            ) : (
                                <div className="game-mode-selector">
                                    <div className="mode-label">
                                        Online Game Mode
                                    </div>
                                    {isCreator && inviteLink && (
                                        <div className="invite-link-container">
                                            <input
                                                type="text"
                                                value={inviteLink}
                                                readOnly
                                                className="invite-link"
                                            />
                                            <button
                                                className="copy-button"
                                                onClick={copyInviteLink}
                                            >
                                                {isLinkCopied ? 'Copied!' : 'Copy Link'}
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        className="mode-button"
                                        onClick={switchToLocalMode}
                                    >
                                        Exit to Local Mode
                                    </button>
                                </div>
                            )}

                            {/* Game controls */}
                            {((gameMode !== 'online' && gameOver) ||
                                (gameMode === 'online' && onlineGameState?.gameOver)) && (
                                <button className="reset-button" onClick={handleResetGame}>
                                    Play Again
                                </button>
                            )}

                            {!gameOver && gameMode !== 'online' && (
                                <button className="reset-button" onClick={handleResetGame}>
                                    New Game
                                </button>
                            )}
                        </div>

                        {/* Stats board */}
                        <div className="stats-board">
                            <h2>Game Statistics</h2>
                            {gameMode === 'online' && onlineGameState ? (
                                <div className="stats-container">
                                    <div className="stat-item">
                                        <span className="stat-label">Player X Wins:</span>
                                        <span className="stat-value">{onlineGameState.stats.xWins}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Player O Wins:</span>
                                        <span className="stat-value">{onlineGameState.stats.oWins}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Draws:</span>
                                        <span className="stat-value">{onlineGameState.stats.draws}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="stats-container">
                                    <div className="stat-item">
                                        <span className="stat-label">Your Wins:</span>
                                        <span className="stat-value">{stats.xWins}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Computer Wins:</span>
                                        <span className="stat-value">{stats.oWins}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Draws:</span>
                                        <span className="stat-value">{stats.draws}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop version of online game info - bottom of sidebar */}
                        {gameMode === 'online' && (
                            <div className="desktop-online-info">
                                {getOnlineGameInfo()}
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;
