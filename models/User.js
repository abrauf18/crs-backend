const { DataTypes } = require("sequelize");
const sequelize = require("../dbConfig");

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
    type: DataTypes.ENUM("student", "teacher", "school", "admin"),
    allowNull: false,
  },
});

// User.sync({ force: true });

module.exports = User;
