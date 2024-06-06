'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AssessmentResourcesDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AssessmentResourcesDetail.belongsTo(models.Resource, { foreignKey: 'resourceId', as: 'resource' })
      AssessmentResourcesDetail.hasMany(models.AssessmentAnswer, { foreignKey: 'assessmentResourcesDetailId', as: 'assessmentAnswers' })
      // define association here
    }
  }
  AssessmentResourcesDetail.init({
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
    totalMarks: {
      type: DataTypes.INTEGER,
      defaultValue:0,
      allowNull: false,
    },
    numberOfQuestions: {
      type: DataTypes.INTEGER,
      defaultValue:0,
      allowNull: false,
    },
    deadline: {
      type: DataTypes.INTEGER,
      defaultValue:0,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'AssessmentResourcesDetail',
  });
  return AssessmentResourcesDetail;
};