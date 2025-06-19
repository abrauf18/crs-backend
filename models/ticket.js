'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Ticket.belongsTo(models.User, {
        foreignKey: "submitted_by",
      });
    }
  }
  Ticket.init({
    complaint_type: DataTypes.STRING,
    message: DataTypes.STRING,
    status: DataTypes.STRING,
    submitted_by: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Ticket',
  });
  return Ticket;
};