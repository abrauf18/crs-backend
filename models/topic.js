'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Topic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Topic.hasMany(models.TopicDailyUpload, { foreignKey: 'topicId'});
      Topic.belongsTo(models.Standard, { foreignKey: 'standardId' });
    }
  }
  Topic.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      defaultValue:'',
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      defaultValue:'',
      allowNull: false,
    },
    standardId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Topic',
  });
  return Topic;
};