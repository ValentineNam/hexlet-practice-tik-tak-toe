import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const Game = ({ user: initialUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');
  const [user] = useState(initialUser || (() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  })());

  const fetchGame = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/games/${id}`);
      setGame(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch game');
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchGame();
    const interval = setInterval(fetchGame, 3000);
    return () => clearInterval(interval);
  }, [id, user, navigate]);

  const handleCellClick = async (row, col) => {
    if (!game || game.status !== 'active') return;
    const playerNumber = game.player1Id === user.id ? 1 : 2;
    if (game.currentPlayer !== playerNumber) {
      setError('Not your turn');
      return;
    }
    const isObstacle = game.obstacles.some(obs => obs[0] === row && obs[1] === col);
    if (isObstacle) {
      setError('Cannot place on obstacle');
      return;
    }
    const existingMove = game.Moves?.find(move => move.row === row && move.column === col);
    if (existingMove) {
      setError('Cell already taken');
      return;
    }
    try {
      const response = await axios.post(`http://localhost:3001/games/${id}/moves`, {
        playerId: user.id,
        row,
        column: col
      });
      setError('');
      setGame(response.data.game);
    } catch (err) {
      setError(err.response.data.error || 'Failed to make move');
    }
  };

  if (!game) {
    return <div className="loading">Loading game...</div>;
  }

  const boardSize = game.boardSize || 7;
  const moves = game.Moves || [];
  const player1Name = game.player1?.username || 'Waiting for player...';
  const player2Name = game.player2 ? game.player2.username : 'Waiting for player...';
  const userIsPlayer1 = game.player1Id === user.id;
  const userIsPlayer2 = game.player2Id === user.id;
  const isUserTurn = (game.currentPlayer === 1 && userIsPlayer1) || (game.currentPlayer === 2 && userIsPlayer2);
  const isFirstMove = game.firstMove && moves.length === 0;

  // Build board state from moves
  const board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
  moves.forEach(move => {
    board[move.row][move.column] = move.symbol;
  });

  // Get corners dynamically based on board size
  const CORNERS = [
    [0, 0], 
    [0, boardSize - 1], 
    [boardSize - 1, 0], 
    [boardSize - 1, boardSize - 1]
  ];

  // Flatten the board into a single array for rendering
  const cells = [];
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const isObstacle = game.obstacles.some(obs => obs[0] === row && obs[1] === col);
      const symbol = board[row][col];
      
      // Highlight corners only on first move for X player
      const isCorner = CORNERS.some(([r, c]) => r === row && c === col);
      const highlightCorner = isFirstMove && isUserTurn && userIsPlayer1 && isCorner && !isObstacle;
      const isUserCell = !isObstacle && !symbol && isUserTurn && game.status === 'active' && !highlightCorner;
      
      cells.push(
        <div
          key={`${row}-${col}`}
          className={`board-cell ${isObstacle ? 'obstacle' : ''} ${isUserCell || highlightCorner ? 'clickable' : ''} ${highlightCorner ? 'corner-highlight' : ''}`}
          onClick={isUserCell || highlightCorner ? () => handleCellClick(row, col) : undefined}
        >
          {isObstacle ? '⛔' : symbol}
        </div>
      );
    }
  }

  return (
    <div className="game-container">
      <h1>Tic Tac Toe {boardSize}x{boardSize}</h1>
      {error && <div className="error">{error}</div>}
      <div className="game-info">
        <div><strong>Player 1 (X):</strong> {player1Name} <span className="score">(Score: {game.player1Score || 0})</span></div>
        <div><strong>Player 2 (O):</strong> {player2Name} <span className="score">(Score: {game.player2Score || 0})</span></div>
        <div><strong>Status:</strong> {game.status.charAt(0).toUpperCase() + game.status.slice(1)}</div>
        <div><strong>Obstacles:</strong> {game.obstacleCount}</div>
        {game.status === 'finished' && (
          <div><strong>Winner:</strong> {game.winnerId === user.id ? 'You won!' : game.winnerId ? 'Other player won' : 'Draw'}</div>
        )}
        <div><strong>Current Turn:</strong> {isUserTurn ? 'Your turn' : game.currentPlayer === 1 ? player1Name : player2Name}</div>
      </div>
      <div 
        className="board-grid" 
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 70px)`
        }}
      >
        {cells}
      </div>
      <div className="game-controls">
        <button onClick={() => navigate('/')}>Return to Lobby</button>
      </div>
    </div>
  );
};

export default Game;