'use strict';
const { RESOURCE_TYPES, RESOURCE_STATUS } = require('../utils/enumTypes');
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Resource extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Resource.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      defaultValue: "",
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      defaultValue: "",
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
          RESOURCE_TYPES.SLIDESHOW, 
          RESOURCE_TYPES.VIDEO, 
          RESOURCE_TYPES.EXIT_TICKET_TEST, 
          RESOURCE_TYPES.WORKSHEET, 
          RESOURCE_TYPES.QUIZ,
          RESOURCE_TYPES.ASSIGNMENT,
        ),
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING,
      defaultValue: "",
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        RESOURCE_STATUS.SHOW,
        RESOURCE_STATUS.HIDE
      ),
      defaultValue:"show",
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Resource',
  });
  return Resource;
};