'use strict';
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
      models.Classroom.belongsTo(models.User, {
        foreignKey: 'teacherId',
        as: 'teacher',
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
      allowNull: false,
    },
    // studentIds: {
    //   type: DataTypes.ARRAY(DataTypes.UUID),
    //   defaultValue:[],
    //   allowNull: false,
    // },
  }, {
    sequelize,
    modelName: 'Classroom',
  });
  return Classroom;
};