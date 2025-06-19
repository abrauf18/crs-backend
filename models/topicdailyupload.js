'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TopicDailyUpload extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TopicDailyUpload.belongsTo(models.Topic, {
        foreignKey: 'topicId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });

      TopicDailyUpload.belongsTo(models.DailyUpload, {
        foreignKey: 'dailyUploadId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }
  TopicDailyUpload.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    topicId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    dailyUploadId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'TopicDailyUpload',
  });
  return TopicDailyUpload;
};