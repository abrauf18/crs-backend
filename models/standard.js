'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Standard extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Standard.hasMany(models.DailyUpload, { foreignKey: 'standardId', as: 'dailyUploads' });
      Standard.hasMany(models.ClassroomCourses, {
        foreignKey: 'standardId',
        as: 'classroomCourses',
      });
      Standard.hasMany(models.AssessmentAnswer, { foreignKey: 'standardId' });
      Standard.hasMany(models.VideoTracking, { foreignKey: 'standardId' });
    }
  }
  Standard.init({
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
    description: {
      type: DataTypes.STRING,
      defaultValue:'',
      allowNull: false,
    },
    courseLength: {
      type: DataTypes.STRING,
      defaultValue:'1 week',
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Standard',
  });
  return Standard;
};