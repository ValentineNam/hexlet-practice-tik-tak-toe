'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Player, { as: 'player1', foreignKey: 'player1Id' });
      this.belongsTo(models.Player, { as: 'player2', foreignKey: 'player2Id' });
      this.hasMany(models.Move, { foreignKey: 'gameId' });
    }
  }
  Game.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    status: {
      type: DataTypes.ENUM('waiting', 'active', 'finished'),
      defaultValue: 'waiting'
    },
    boardSize: {
      type: DataTypes.INTEGER,
      defaultValue: 7
    },
    obstacleCount: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    },
    obstacles: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    currentPlayer: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    firstMove: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    player1Id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Players',
        key: 'id'
      }
    },
    player2Id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Players',
        key: 'id'
      }
    },
    winnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Players',
        key: 'id'
      }
    },
    player1Score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    player2Score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Game',
  });
  return Game;
};