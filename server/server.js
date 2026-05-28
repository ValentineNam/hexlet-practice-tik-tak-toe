const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const { Player, Game, Move } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper function to count all unique 3+ in a row combinations on the board
function calculateTotalScore(board, symbol) {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal right
    [1, -1]   // diagonal left
  ];

  let totalScore = 0;
  
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (board[row][col] !== symbol) continue;
      
      for (const [dr, dc] of directions) {
        // Check only in positive direction to avoid counting same line multiple times
        let r = row - dr, c = col - dc;
        const hasBefore = r >= 0 && r < 7 && c >= 0 && c < 7 && board[r][c] === symbol;
        if (hasBefore) continue; // Already counted as part of another line
        
        // Count the full length of this line
        let count = 1;
        r = row + dr;
        c = col + dc;
        while (r >= 0 && r < 7 && c >= 0 && c < 7 && board[r][c] === symbol) {
          count++;
          r += dr;
          c += dc;
        }
        
        // Each 3+ combination gives points
        if (count >= 3) {
          totalScore += count - 2;
        }
      }
    }
  }
  
  return totalScore;
}

// Check if any moves are available
function hasAvailableMoves(board, obstacles) {
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const isObstacle = obstacles.some(obs => obs[0] === row && obs[1] === col);
      if (!isObstacle && !board[row][col]) {
        return true;
      }
    }
  }
  return false;
}

// Test database connection
sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err));

// Sync models and create default users
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Models synced');
    // Create default users
    const defaultPassword = 'Qazxdr777@';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const users = [
      { username: 'playerOne' },
      { username: 'testerOne' }
    ];
    
    for (const userData of users) {
      const existing = await Player.findOne({ where: { username: userData.username } });
      if (!existing) {
        await Player.create({ ...userData, password: hashedPassword });
        console.log(`Created user: ${userData.username}`);
      }
    }
  })
  .catch(err => console.log('Error: ' + err));

// Basic route
app.get('/', (req, res) => {
  res.send('Tic Tac Toe Server is running');
});

// Player routes
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const player = await Player.create({ username, password: hashedPassword });
    res.status(201).json({ id: player.id, username: player.username });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const player = await Player.findOne({ where: { username } });
    if (!player) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, player.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ id: player.id, username: player.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Game routes
app.post('/games', async (req, res) => {
  try {
    const { player1Id, obstacleCount = 3 } = req.body;
    // Generate obstacles only in inner area (not on edges - rows/cols 1-5)
    const obstacles = [];
    const positions = [];
    for (let i = 1; i < 6; i++) {  // Skip edges (0 and 6)
      for (let j = 1; j < 6; j++) {
        positions.push([i, j]);
      }
    }
    // Shuffle and pick obstacleCount positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    for (let i = 0; i < obstacleCount && i < positions.length; i++) {
      obstacles.push(positions[i]);
    }

    const game = await Game.create({
      player1Id,
      obstacleCount,
      obstacles,
      status: 'waiting'
    });
    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/games', async (req, res) => {
  try {
    const games = await Game.findAll({
      where: { status: 'waiting' },
      include: [{ model: Player, as: 'player1', attributes: ['id', 'username'] }]
    });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/games/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { player2Id } = req.body;
    const game = await Game.findByPk(id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not available' });
    }
    if (game.player1Id === player2Id) {
      return res.status(400).json({ error: 'Cannot join your own game' });
    }
    await game.update({ player2Id, status: 'active' });
    const updatedGame = await Game.findByPk(id, {
      include: [
        { model: Player, as: 'player1', attributes: ['id', 'username'] },
        { model: Player, as: 'player2', attributes: ['id', 'username'] }
      ]
    });
    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findByPk(id, {
      include: [
        { model: Player, as: 'player1', attributes: ['id', 'username'] },
        { model: Player, as: 'player2', attributes: ['id', 'username'] },
        { model: Move, include: [{ model: Player, attributes: ['id', 'username'] }] }
      ]
    });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/games/:id/moves', async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId, row, column } = req.body;
    const game = await Game.findByPk(id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }
    
    const playerNumber = game.currentPlayer === 1 ? 1 : 2;
    
    // Check if it's the player's turn
    const expectedPlayer = game.currentPlayer === 1 ? game.player1Id : game.player2Id;
    if (playerId !== expectedPlayer) {
      return res.status(400).json({ error: 'Not your turn' });
    }
    
    // Check if cell is obstacle
    const isObstacle = game.obstacles.some(obs => obs[0] === row && obs[1] === column);
    if (isObstacle) {
      return res.status(400).json({ error: 'Cannot place on obstacle' });
    }
    
    // Check if cell is already taken
    const existingMove = await Move.findOne({ where: { gameId: id, row, column } });
    if (existingMove) {
      return res.status(400).json({ error: 'Cell already taken' });
    }
    
    // First move (X player) must be in corner
    const symbol = playerNumber === 1 ? 'X' : 'O';
    const isFirstMove = game.firstMove;
    
    if (isFirstMove && symbol === 'X') {
      const isCorner = (row === 0 && column === 0) || 
                       (row === 0 && column === 6) || 
                       (row === 6 && column === 0) || 
                       (row === 6 && column === 6);
      if (!isCorner) {
        return res.status(400).json({ error: 'First move must be in a corner' });
      }
    }
    
    // Get all moves to build board
    const allMoves = await Move.findAll({ where: { gameId: id } });
    const board = Array(7).fill(null).map(() => Array(7).fill(null));
    allMoves.forEach(move => {
      board[move.row][move.column] = move.symbol;
    });

    // Create move
    const move = await Move.create({ gameId: id, playerId, row, column, symbol });
    
    // Build updated board
    board[row][column] = symbol;

    // Calculate TOTAL scores for both players (unique lines only)
    const player1Score = calculateTotalScore(board, 'X');
    const player2Score = calculateTotalScore(board, 'O');

    // Check if game is over (no available moves)
    const gameOver = !hasAvailableMoves(board, game.obstacles);

    // Update game scores and check for game over
    const updateData = { 
      currentPlayer: game.currentPlayer === 1 ? 2 : 1,
      firstMove: false,
      player1Score,
      player2Score
    };

    if (gameOver) {
      updateData.status = 'finished';
      if (player1Score > player2Score) {
        updateData.winnerId = game.player1Id;
      } else if (player2Score > player1Score) {
        updateData.winnerId = game.player2Id;
      }
    }

    await game.update(updateData);

    // Return updated game state
    const updatedGame = await Game.findByPk(id, {
      include: [
        { model: Player, as: 'player1', attributes: ['id', 'username'] },
        { model: Player, as: 'player2', attributes: ['id', 'username'] },
        { model: Move, include: [{ model: Player, attributes: ['id', 'username'] }] }
      ]
    });
    res.status(201).json({ move, game: updatedGame });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});