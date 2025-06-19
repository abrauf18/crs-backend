'use strict';
const { CLASSROOM_STATUS } = require('../utils/enumTypes');
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Classroom extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.Classroom.hasMany(models.ClassroomStudent, {
        foreignKey: 'classroomId',
        as: 'classroomStudents',
      });
      models.Classroom.hasMany(models.ClassroomCourses, {
        foreignKey: 'classroomId',
        as: 'classroomCourses',
      });
      models.Classroom.hasMany(models.Enrollment, {
        foreignKey: 'classroomId',
      });
      Classroom.belongsTo(models.User, {
        foreignKey: 'teacherId',
      });
      // define association here
    }
  }
  Classroom.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name:{
      type: DataTypes.STRING,
      defaultValue:'',
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: true,
    },
    schoolId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        CLASSROOM_STATUS.ACTIVE, 
        CLASSROOM_STATUS.INACTIVE
      ),
      defaultValue: CLASSROOM_STATUS.ACTIVE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Classroom',
  });
  return Classroom;
};