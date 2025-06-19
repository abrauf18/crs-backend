'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VideoQuestionAnswer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      VideoQuestionAnswer.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      VideoQuestionAnswer.belongsTo(models.Question, { foreignKey: 'questionId', as: 'question' });
      // define association here
    }
  }
  VideoQuestionAnswer.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    questionId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    answer: {
      type: DataTypes.STRING,
      defaultValue:'',
      allowNull: false,
    },
    obtainedMarks: {
      type: DataTypes.INTEGER,
      defaultValue: -1,
      allowNull: false,
    },
    standardId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    classroomId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'VideoQuestionAnswer',
  });
  return VideoQuestionAnswer;
};