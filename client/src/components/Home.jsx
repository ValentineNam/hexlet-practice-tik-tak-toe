import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Home = ({ user }) => {
  const [games, setGames] = useState([]);
  const [obstacleCount, setObstacleCount] = useState(3);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

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
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/games', {
        player1Id: user.id,
        obstacleCount
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
      <form onSubmit={handleCreateGame}>
        <div>
          <label>Number of Obstacles (0-10):</label>
          <input
            type="number"
            value={obstacleCount}
            onChange={(e) => setObstacleCount(Math.min(Math.max(parseInt(e.target.value) || 0, 0), 10))}
            min="0"
            max="10"
          />
        </div>
        <button type="submit">Create Game</button>
      </form>
      <p><Link to="/login">Logout</Link></p>
    </div>
  );
};

export default Home;