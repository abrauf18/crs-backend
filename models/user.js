"use strict";
const { Model } = require("sequelize");
const ROLES = require("./roles");

const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.VideoTracking, {
        foreignKey: "studentId",
        as: "videoTrackings",
      });
      User.hasOne(models.Classroom, {
        foreignKey: "teacherId",
      });
      User.hasMany(models.Ticket, {
        foreignKey: "submitted_by",
      });
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
        type: DataTypes.ENUM(
          ROLES.STUDENT,
          ROLES.TEACHER,
          ROLES.SCHOOL,
          ROLES.ADMIN
        ),
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        defaultValue:
          "https://crs-data-storage-bucket.s3.ap-southeast-2.amazonaws.com/ProfilePictures/defaultImage.JPG",
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );

  User.beforeUpdate(async (user, options) => {
    if (user.changed("password")) {
      try {
        console.log("Password is being updated");
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.setDataValue("password", hashedPassword);
      } catch (error) {
        console.error("Error updating password:", error);
      }
    }
  });

  User.beforeCreate(async (user, options) => {
    try {
      console.log("New user is being created");
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.setDataValue("password", hashedPassword);
    } catch (error) {
      console.error("Error creating user:", error);
    }
  });

  // function to compare encrypted password
  User.prototype.comparePassword = async function (userPassword) {
    try {
      if (!this.password) {
        return { error: true, message: "Password not set" };
      }
      const result = await bcrypt.compare(userPassword, this.password);
      return { error: false, result };
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return { error: true, message: "Error comparing passwords" };
    }
  };

  return User;
};
