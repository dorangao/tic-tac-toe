import React from 'react';
import styles from '../Game.module.css';

interface SquareProps {
  value: string | null;
  onClick: () => void;
  mobileStyles?: any; // Optional mobile styles
}

// Square component for individual buttons in the grid
const Square: React.FC<SquareProps> = ({ value, onClick, mobileStyles }) => {
  return (
    <button 
      className={`${styles.square} ${mobileStyles?.square || ''}`} 
      onClick={onClick}
      value={value || undefined} // This allows CSS to target [value="X"] and [value="O"]
    >
      {value}
    </button>
  );
};

interface BoardProps {
  squares: Array<string | null>;
  onClick: (index: number) => void;
  mobileStyles?: any; // Optional mobile styles
}

const Board: React.FC<BoardProps> = ({ squares, onClick, mobileStyles }) => {
  // Render a square with its value and click handler
  const renderSquare = (index: number) => {
    return (
      <Square 
        value={squares && squares[index] ? squares[index] : null} 
        onClick={() => onClick(index)} 
        mobileStyles={mobileStyles}
      />
    );
  };

  return (
    <div className={styles.board}>
      <div className={styles.boardRow}>
        {renderSquare(0)}
        {renderSquare(1)}
        {renderSquare(2)}
      </div>
      <div className={styles.boardRow}>
        {renderSquare(3)}
        {renderSquare(4)}
        {renderSquare(5)}
      </div>
      <div className={styles.boardRow}>
        {renderSquare(6)}
        {renderSquare(7)}
        {renderSquare(8)}
      </div>
    </div>
  );
};

export default Board;
