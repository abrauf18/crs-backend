'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ClassroomStudent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.ClassroomStudent.belongsTo(models.Classroom, {
        foreignKey: 'classroomId',
        as: 'classroom',
      });
      models.ClassroomStudent.belongsTo(models.User, {
        foreignKey: 'studentId',
        as: 'student',
      })
      ClassroomStudent.hasMany(models.DailyProgress, { foreignKey: 'classroomStudentId' });
      // define association here
    }
  }
  ClassroomStudent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    classroomId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    studentId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'ClassroomStudent',
  });
  return ClassroomStudent;
};