'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Video extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Video.belongsTo(models.Resource, { foreignKey: 'resourceId', as: 'resource' });
      Video.hasMany(models.Question, { foreignKey: 'videoId', as: 'questions' });
    }
  }
  Video.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    thumbnailURL: {
      type: DataTypes.STRING,
      defaultValue:'',
      allowNull: false,
    },
    topics: {
      type: DataTypes.JSON,
      defaultValue:{},
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Video',
  });
  return Video;
};