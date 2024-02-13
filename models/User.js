const ROLES = require("./Roles/index");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
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
  });

  // User.sync({ force: true });
  return User;
};
