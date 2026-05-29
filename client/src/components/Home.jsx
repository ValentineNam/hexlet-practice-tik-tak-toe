import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = ({ user }) => {
  const [games, setGames] = useState([]);
  const [boardSize, setBoardSize] = useState(7);
  const [obstacleCount, setObstacleCount] = useState(3);
  const [opponentType, setOpponentType] = useState('player');
  const [difficulty, setDifficulty] = useState('medium');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const maxObstacles = Math.max(0, boardSize - 2);

  const fetchGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/games');
      setGames(response.data);
    } catch (err) {
      setError('Failed to fetch games');
    }
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/games', {
        player1Id: user.id,
        boardSize,
        obstacleCount,
        opponentType,
        difficulty
      });
      setSuccess('Game created! Redirecting...');
      setTimeout(() => {
        navigate(`/games/${response.data.id}`);
      }, 1500);
    } catch (err) {
      setError(err.response.data.error || 'Failed to create game');
    }
  };

  const handleJoinGame = async (gameId) => {
    try {
      const response = await axios.post(`http://localhost:3001/games/${gameId}/join`, {
        player2Id: user.id
      });
      navigate(`/games/${response.data.id}`);
    } catch (err) {
      setError(err.response.data.error || 'Failed to join game');
    }
  };

  return (
    <div className="home-container">
      <h1>Tic Tac Toe</h1>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <h2>Available Games</h2>
      {games.length === 0 ? (
        <p>No games available. Create one!</p>
      ) : (
        <ul className="games-list">
          {games.map(game => (
            <li key={game.id}>
              <strong>Game by:</strong> {game.player1.username} 
              <br />
              <strong>Size:</strong> {game.boardSize}x{game.boardSize}
              <br />
              <strong>Obstacles:</strong> {game.obstacleCount}
              <br />
              <button onClick={() => handleJoinGame(game.id)}>
                Join Game
              </button>
            </li>
          ))}
        </ul>
      )}
      <h2>Create New Game</h2>
      <form onSubmit={handleCreateGame} className="create-game-form">
        <div className="create-game-columns">
          <div className="create-game-left">
            <div className="form-field">
              <label>Board Size (5-7):</label>
              <select value={boardSize} onChange={(e) => {
                const newSize = parseInt(e.target.value);
                setBoardSize(newSize);
                setObstacleCount(Math.min(obstacleCount, Math.max(0, newSize - 2)));
              }}>
                <option value="5">5x5</option>
                <option value="6">6x6</option>
                <option value="7">7x7</option>
              </select>
            </div>
            <div className="form-field">
              <label>Number of Obstacles (0-{maxObstacles}):</label>
              <input
                type="number"
                value={obstacleCount}
                onChange={(e) => setObstacleCount(Math.min(Math.max(parseInt(e.target.value) || 0, 0), maxObstacles))}
                min="0"
                max={maxObstacles}
              />
            </div>
          </div>
          <div className="create-game-right">
            <div className="form-field">
              <label>Opponent:</label>
              <div className="switch-container">
                <span className={`switch-label ${opponentType === 'player' ? 'active' : ''}`}>Player</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={opponentType === 'computer'}
                    onChange={(e) => setOpponentType(e.target.checked ? 'computer' : 'player')}
                  />
                  <span className="slider"></span>
                </label>
                <span className={`switch-label ${opponentType === 'computer' ? 'active' : ''}`}>Computer</span>
              </div>
            </div>
            <div className="form-field">
              <label>Difficulty:</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
        <div className="create-game-submit">
          <button type="submit">Create Game</button>
        </div>
      </form>
    </div>
  );
};

export default Home;