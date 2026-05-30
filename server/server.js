const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const { Player, Game, Move } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Вспомогательная функция для подсчета очков на доске
function calculateTotalScore(board, symbol, boardSize) {
  const directions = [
    [0, 1],   // горизонталь
    [1, 0],   // вертикаль
    [1, 1],   // диагональ в направление вниз-вправо
    [1, -1]   // диагональ в направление вниз-влево
  ];

  let totalScore = 0;
  
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] !== symbol) continue;
      
      for (const [dr, dc] of directions) {
        // Считаем только линии, которые начинаются с текущей клетки, чтобы избежать двойного подсчета
        let r = row - dr, c = col - dc;
        const hasBefore = r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === symbol;
        if (hasBefore) continue;
        
        // Считаем длину линии в данном направлении
        let count = 1;
        r = row + dr;
        c = col + dc;
        while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === symbol) {
          count++;
          r += dr;
          c += dc;
        }
        
        // Каждая комбинация из 3 и более в ряд дает 1 очко, 4 в ряд - 2 очка, 5 в ряд - 3 очка и так далее
        if (count >= 3) {
          totalScore += count - 2;
        }
      }
    }
  }
  
  return totalScore;
}

// Проверяем, есть ли доступные ходы
function hasAvailableMoves(board, obstacles, boardSize) {
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const isObstacle = obstacles.some(obs => obs[0] === row && obs[1] === col);
      if (!isObstacle && !board[row][col]) {
        return true;
      }
    }
  }
  return false;
}

// Проверяем коннект к базе данных
sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err));

// Синхронизация моделей с базой данных и создание тестовых пользователей
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Models synced');
    // Создаем тестовых пользователей с хешированными паролями
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

// Базовый эндпоинт
app.get('/', (req, res) => {
  res.send('Tic Tac Toe Server is running');
});

// Пользовательские эндпоинты
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

// Игровые эндпоинты
app.post('/games', async (req, res) => {
  try {
    const { player1Id, boardSize = 7, obstacleCount = 3 } = req.body;
    
    // Генерируем случайные позиции для препятствий, исключая края доски
    const obstacles = [];
    const positions = [];
    for (let i = 1; i < boardSize - 1; i++) {  // Skip edges (0 and boardSize-1)
      for (let j = 1; j < boardSize - 1; j++) {
        positions.push([i, j]);
      }
    }
    
    // Расставляем препятствия в случайные позиции
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    for (let i = 0; i < obstacleCount && i < positions.length; i++) {
      obstacles.push(positions[i]);
    }

    const game = await Game.create({
      player1Id,
      boardSize,
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
    
    const boardSize = game.boardSize || 7;
    const playerNumber = game.currentPlayer === 1 ? 1 : 2;
    
    // Проверка на очередность хода
    const expectedPlayer = game.currentPlayer === 1 ? game.player1Id : game.player2Id;
    if (playerId !== expectedPlayer) {
      return res.status(400).json({ error: 'Not your turn' });
    }
    
    // Проверка на препядствие
    const isObstacle = game.obstacles.some(obs => obs[0] === row && obs[1] === column);
    if (isObstacle) {
      return res.status(400).json({ error: 'Cannot place on obstacle' });
    }
    
    // Провнрка, что клетка не занята
    const existingMove = await Move.findOne({ where: { gameId: id, row, column } });
    if (existingMove) {
      return res.status(400).json({ error: 'Cell already taken' });
    }
    
    // Проверка первого хода: если это первый ход и игрок X, то он должен поставить в угол
    const symbol = playerNumber === 1 ? 'X' : 'O';
    const isFirstMove = game.firstMove;
    
    if (isFirstMove && symbol === 'X') {
      const isCorner = (row === 0 && column === 0) || 
                       (row === 0 && column === boardSize - 1) || 
                       (row === boardSize - 1 && column === 0) || 
                       (row === boardSize - 1 && column === boardSize - 1);
      if (!isCorner) {
        return res.status(400).json({ error: 'First move must be in a corner' });
      }
    }
    
    // Строим текущее состояние доски на основе всех ходов в игре
    const allMoves = await Move.findAll({ where: { gameId: id } });
    const board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
    allMoves.forEach(move => {
      board[move.row][move.column] = move.symbol;
    });

    // Ход игрока
    const move = await Move.create({ gameId: id, playerId, row, column, symbol });
    
    // Строим доску с учетом нового хода
    board[row][column] = symbol;

    // Считаем очки для обоих игроков
    const player1Score = calculateTotalScore(board, 'X', boardSize);
    const player2Score = calculateTotalScore(board, 'O', boardSize);

    // Проверяем не закончилась ли игра
    const gameOver = !hasAvailableMoves(board, game.obstacles, boardSize);

    // Обновляем очки
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

    // Обновляем статус игры и возвращаем обновленную информацию о игре вместе с ходом
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