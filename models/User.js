"use strict";
const { Model } = require("sequelize");
const ROLES = require("./Roles")
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
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
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM(ROLES.STUDENT, ROLES.TEACHER, ROLES.SCHOOL, ROLES.ADMIN),
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        defaultValue:'https://crs-data-storage-bucket.s3.ap-southeast-2.amazonaws.com/ProfilePictures/defaultImage.JPG',
        allowNull: false,
      }
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
