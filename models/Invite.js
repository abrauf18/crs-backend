const { DataTypes } = require("sequelize");
const sequelize = require("../dbConfig");
const User = require("./User");

const Invite = sequelize.define("Invite", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    // unique: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
Invite.belongsTo(User, { foreignKey: "createdBy" });

// Invite.sync({ force: true });

module.exports = Invite;
