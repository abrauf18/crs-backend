// src/index.js
const express = require("express");
const dotenv = require("dotenv");
const authRouter = require("./routes/auth.routes");
const userRouter = require("./routes/user.routes");
const sequelize = require("./config/config.json");
const db = require("./models");
dotenv.config();

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log("Connected to the database");
//   })
//   .catch((error) => {
//     console.error("Error connecting to the database:", error);
//   });

const app = express();

app.use(express.json());
app.use("/auth", authRouter);
app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const port = process.env.PORT || 3000;

// db.sequelize
//   .sync()
//   .then(() => {
//     console.log("Succesfully initialized DB");
//   })
//   .catch((err) => {
//     console.log(err);
//     console.log("Error while connecting to the database");
//   });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
