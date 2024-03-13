const dotenv = require("dotenv");
const express = require("express");
const cookieParser = require("cookie-parser")
const authRouter = require("./routes/auth.routes");
const userRouter = require("./routes/user.routes");
const schoolRouter = require("./routes/school.routes");
const cors = require('cors');
const db = require("./models");
dotenv.config();

db.sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to the database from sequelize");
  })
  .catch((error) => {
    console.error("Error connecting to the database from sequelize:", error);
  });

const app = express();

app.use(cors({origin: 'http://localhost:3000', credentials: true}));

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/school", schoolRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const port = process.env.PORT || 3000;

db.sequelize
  .sync()
  .then(() => {
    console.log("Succesfully initialized DB");
  })
  .catch((err) => {
    console.log(err);
    console.log("Error while connecting to the database from DB.sequelize");
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
