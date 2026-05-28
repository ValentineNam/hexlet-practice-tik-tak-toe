# Tic-Tac-Toe Extended Game

Extended Tic-Tac-Toe game with 7x7 field and obstacles. Each combination of three in a row gives points.

## Features

- 7x7 game board
- Random obstacles that prevent placing pieces
- Multiplayer real-time gameplay
- Score tracking based on combinations
- User authentication and registration
- Game history and statistics

## Tech Stack

- Backend: Node.js, Express, Sequelize
- Database: SQLite
- Frontend: [To be added]
- Real-time: [To be added]

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
Install dependencies:

bash
npm install
Set up environment variables:

bash
cp .env.example .env
# Edit .env file with your configuration
Start the development server:

bash
npm run dev
Project Structure
hexlet-practice-tik-tak-toe/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js
├── client/                 # To be implemented
├── .env                    # Environment variables
├── .gitignore
├── README.md
└── package.json
API Endpoints
Authentication
POST /register - Register a new player
POST /login - Login a player
Games
POST /games - Create a new game
GET /games - Get active games
POST /games/:id/join - Join a game
GET /games/:id - Get game details
POST /games/:id/moves - Make a move
Game Rules
7x7 grid with random obstacles
Players take turns placing X and O
Each line of 3 or more symbols gives points
First player gets X, second gets O
Game ends when board is full
Winner determined by highest score
Database Schema
[Will be updated with ER diagram and detailed schema]

Development
Running the server
bash
npm run dev
Running tests
bash
npm test
Contributing
[To be added]

License
[To be added]

Notes
This is a work-in-progress implementation. More features will be added as development continues.