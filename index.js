// src/index.js
const express = require("express");
const dotenv = require("dotenv");
const authRouter = require("./routes/auth.route");
const userRouter = require("./routes/user.route");
const sequelize = require("./dbConfig");

dotenv.config();

sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });

const app = express();

app.use(express.json());
app.use("/auth", authRouter);
app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
