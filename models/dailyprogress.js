'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DailyProgress extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DailyProgress.belongsTo(models.ClassroomStudent, { foreignKey: 'classroomStudentId' });
      // define association here
    }
  }
  DailyProgress.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    classroomStudentId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    obtainedWeightage: {
      type: DataTypes.DECIMAL,
      defaultValue:0,
      allowNull: false,
    },
    totalWeightage: {
      type: DataTypes.INTEGER,
      defaultValue:0,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
  }, {
    sequelize,
    modelName: 'DailyProgress',
  });
  return DailyProgress;
};