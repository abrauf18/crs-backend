'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AssessmentAnswer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AssessmentAnswer.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
      AssessmentAnswer.belongsTo(models.AssessmentResourcesDetail, { foreignKey: 'assessmentResourcesDetailId', as: 'assessmentResourcesDetail' })
      AssessmentAnswer.belongsTo(models.Standard, { foreignKey: 'standardId' })
      // define association here
    }
  }
  AssessmentAnswer.init({
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
    standardId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    assessmentResourcesDetailId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    questionNumber: {
      type: DataTypes.INTEGER,
      defaultValue:0,
      allowNull: false,
    },
    obtainedMarks: {
      type: DataTypes.INTEGER,
      defaultValue:-1,
      allowNull: false,
    },
    answerURL: {
      type: DataTypes.STRING,
      defaultValue:'',
      allowNull: false,
    },
    classroomId: {
      type: DataTypes.UUID,
      defaultValue: '',
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'AssessmentAnswer',
  });
  return AssessmentAnswer;
};