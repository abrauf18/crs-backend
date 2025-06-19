'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ClassroomCourses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.ClassroomCourses.belongsTo(models.Classroom, {
        foreignKey: 'classroomId',
        as: 'classroom',
      });
      models.ClassroomCourses.belongsTo(models.Standard, {
        foreignKey: 'standardId',
        as: 'standard',
      });
      // define association here
    }
  }
  ClassroomCourses.init({
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
    standardId: {
      type: DataTypes.UUID,
      defaultValue:'',
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'ClassroomCourses',
  });
  return ClassroomCourses;
};