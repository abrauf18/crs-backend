'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class School extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      School.belongsTo(models.User, {
        foreignKey: "createdBy",
        onDelete: "CASCADE",
      });
    }
  }
  School.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    numOfTeachers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    numOfStudents: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    courses: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    numOfClasses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    classesStart: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    classesEnd: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'School',
  });
  return School;
};