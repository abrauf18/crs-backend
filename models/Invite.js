'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class invite extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  invite.init({
    id: DataTypes.UUID,
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    createdBy: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'invite',
  });
  return invite;
};