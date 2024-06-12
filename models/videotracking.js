'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VideoTracking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      VideoTracking.belongsTo(models.Video, { foreignKey: 'videoId', as: 'video' });
      VideoTracking.belongsTo(models.User, { foreignKey: 'studentId', as: 'student' });
      VideoTracking.belongsTo(models.Standard, { foreignKey: 'standardId' });
      // define association here
    }
  }
  VideoTracking.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    videoId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    studentId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    standardId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    saved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    last_seen_time: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '00:00:00',
    },
    watchedCompletely: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'VideoTracking',
  });
  return VideoTracking;
};