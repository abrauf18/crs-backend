'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class otp_code extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  otp_code.init({
    id: DataTypes.UUID,
    userId: DataTypes.UUID,
    otp: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'otp_code',
  });
  return otp_code;
};