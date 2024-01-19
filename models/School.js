const { DataTypes } = require("sequelize");
const sequelize = require("../dbConfig");
const User = require("./User");

const School = sequelize.define("School", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  numberOfTeachers: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  studentsPopulation: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  courses: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

School.belongsTo(User, { foreignKey: "createdBy" });

// School.sync({ force: true });

module.exports = School;
