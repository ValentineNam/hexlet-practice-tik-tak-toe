'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Player extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Game, { foreignKey: 'player1Id', as: 'player1Games' });
      this.hasMany(models.Game, { foreignKey: 'player2Id', as: 'player2Games' });
      this.hasMany(models.Move, { foreignKey: 'playerId' });
    }
  }
  Player.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Player',
  });
  return Player;
};