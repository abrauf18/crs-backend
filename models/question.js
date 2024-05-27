'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Question.belongsTo(models.Video, { foreignKey: 'videoId', as: 'video' });
      Question.hasMany(models.VideoQuestionAnswer, { foreignKey: 'questionId', as: 'answers' });
      // define association here
    }
  }
  Question.init({
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
    statement: {
      type: DataTypes.STRING,
      defaultValue:'',
      allowNull: false,
    },
    options: {
      type: DataTypes.JSON,
      defaultValue:{},
      allowNull: false,
    },
    correctOption: {
      type: DataTypes.STRING,
      defaultValue:'',
      allowNull: false,
    },
    correctOptionExplanation: {
      type: DataTypes.STRING,
      defaultValue:'',
      allowNull: false,
    },
    totalMarks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    popUpTime: {
      type: DataTypes.TIME,
      defaultValue:'00:00:00',
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};