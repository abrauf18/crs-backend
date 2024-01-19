const User = require("./User");

module.exports = (sequelize, DataTypes) => {
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

  School.associate = (models) => {
    School.belongsTo(models.User, {
      foreignKey: "createdBy",
      onDelete: "CASCADE",
    });
  };
  return School;
};
// School.sync({ force: true });
