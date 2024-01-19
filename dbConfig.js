// sequelize-config.js

const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize({
  database: "crs",
  username: "postgres",
  password: "saad123",
  dialect: "postgres",
});

module.exports = sequelize;
