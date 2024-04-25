const dotenv = require("dotenv");
const express = require("express");
const cookieParser = require("cookie-parser")
const authRouter = require("./routes/auth-routes");
const userRouter = require("./routes/user-routes");
const schoolRouter = require("./routes/school-routes");
const resourceRouter = require("./routes/resource-routes");
const videoRouter = require("./routes/video-routes");
const questionRouter = require("./routes/question-routes");
const { logger, morganMiddleware } = require('./Logs/logger');
const cors = require('cors');
const db = require("./models");
dotenv.config();

db.sequelize
  .authenticate()
  .then(() => {
    logger.info("Connected to the database from sequelize");
  })
  .catch((error) => {
    console.error("Error connecting to the database from sequelize:", error);
  });

const app = express();

// Use morgan middleware for logging
app.use(morganMiddleware);

app.use(cors({origin: 'http://localhost:3000', credentials: true}));

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/school", schoolRouter);
app.use("/resource", resourceRouter);
app.use("/video", videoRouter);
app.use("/question", questionRouter);


app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const port = process.env.PORT || 3000;

db.sequelize
  .sync()
  .then(() => {
    logger.info("Succesfully initialized DB");
  })
  .catch((error) => {
    logger.error(error?.message || 'An error occurred, but no error message was provided');
    logger.error("Error while connecting to the database from DB.sequelize");
  });

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
