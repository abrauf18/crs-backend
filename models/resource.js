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
      Resource.hasOne(models.Video, {foreignKey: 'resourceId', as: 'video'});
      Resource.hasOne(models.AssessmentResourcesDetail, {foreignKey: 'resourceId', as: 'AssessmentResourcesDetail'});
      Resource.hasOne(models.DailyUpload, {foreignKey: 'resourceId', as: 'DailyUpload'});
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
          RESOURCE_TYPES.WORKSHEET, 
          RESOURCE_TYPES.QUIZ,
          RESOURCE_TYPES.ASSIGNMENT,
          RESOURCE_TYPES.LAB,
          RESOURCE_TYPES.STATION,
          RESOURCE_TYPES.ACTIVITY,
          RESOURCE_TYPES.GUIDED_NOTE,
          RESOURCE_TYPES.FORMATIVE_ASSESSMENT,
          RESOURCE_TYPES.SUMMARIZE_ASSESSMENT,
          RESOURCE_TYPES.DATA_TRACKER,
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