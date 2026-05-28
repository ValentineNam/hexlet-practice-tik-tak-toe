'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Move extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Game, { foreignKey: 'gameId' });
      this.belongsTo(models.Player, { foreignKey: 'playerId' });
    }
  }
  Move.init({
    gameId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Games',
        key: 'id'
      }
    },
    playerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Players',
        key: 'id'
      }
    },
    row: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    column: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    symbol: {
      type: DataTypes.CHAR(1), // 'X' or 'O'
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Move',
  });
  return Move;
};