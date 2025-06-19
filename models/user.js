"use strict";
const { Model } = require("sequelize");
const ROLES = require("./roles");
const bcrypt = require("bcrypt");
// @ts-ignore
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
      User.hasMany(models.VideoTracking, {
        foreignKey: "studentId",
        as: "videoTrackings",
      });
      User.hasMany(models.Classroom, {
        foreignKey: "teacherId",
      });
      User.hasMany(models.Ticket, {
        foreignKey: "submitted_by",
      });
      User.hasMany(models.AssessmentAnswer, { foreignKey: 'userId' })
      User.hasMany(models.VideoQuestionAnswer, { foreignKey: 'userId' })
      User.hasOne(models.ClassroomStudent, { foreignKey: 'studentId' })
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
      school_id: {
        type: DataTypes.UUID,
        allowNull: true,
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

  // @ts-ignore
  User.beforeUpdate(async (user, options) => {
    // @ts-ignore
    if (user.changed("password")) {
      try {
        // @ts-ignore
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.setDataValue("password", hashedPassword);
      } catch (error) {
        throw new Error("Error updating password");
      }
    }
  });

  // @ts-ignore
  User.beforeCreate(async (user, options) => {
    try {
      // @ts-ignore
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.setDataValue("password", hashedPassword);
    } catch (error) {
      throw new Error("Error creating user");
    }
  });

  // function to compare encrypted password
  User.prototype.comparePassword = async function (userPassword) {
    try {
      // @ts-ignore
      if (!this.password) {
        return { error: true, message: "Password not set" };
      }
      // @ts-ignore
      const result = await bcrypt.compare(userPassword, this.password);
      return { error: false, result };
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return { error: true, message: "Error comparing passwords" };
    }
  };

  return User;
};
