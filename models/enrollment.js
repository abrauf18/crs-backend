'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.Enrollment.belongsTo(models.Classroom, {
        foreignKey: 'classroomId',
      });
      models.Enrollment.belongsTo(models.Standard, {
        foreignKey: 'standardId',
      });
      models.Enrollment.belongsTo(models.User, {
        foreignKey: 'studentId',
      });
    }
  }
  Enrollment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    classroomId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue:'',
    },
    standardId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue:'',
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue:'',
    },
    result: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue:0,
    },
  }, {
    sequelize,
    modelName: 'Enrollment',
  });
  return Enrollment;
};