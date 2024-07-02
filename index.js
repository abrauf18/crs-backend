const dotenv = require("dotenv");
const express = require("express");
require('./cronJobs/dailyProgress-Job');
// require('./cronJobs/enrollments-Job'); 
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth-routes");
const userRouter = require("./routes/user-routes");
const schoolRouter = require("./routes/school-routes");
const resourceRouter = require("./routes/resource-routes");
const videoRouter = require("./routes/video-routes");
const questionRouter = require("./routes/question-routes");
const standardRouter = require("./routes/standard-routes");
const classroomRouter = require("./routes/classroom-routes");
const dashboardRouter = require("./routes/dashboard-routes");
const videoQuestionAnswerRouter = require("./routes/videoQuestionAnswer-routes");
const studentRouter = require("./routes/student-routes");
const assessmentAnswerRouter = require("./routes/assessmentAnswer-routes");
const { logger, morganMiddleware } = require('./Logs/logger');
const cors = require('cors');

const bodyParser = require("body-parser");

dotenv.config();


const app = express();

// Use morgan middleware for logging
app.use(morganMiddleware);

app.use(cors({
  origin: '*',
  credentials: true
}));


// Parse requests of content-type - application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/school", schoolRouter);
app.use("/resource", resourceRouter);
app.use("/video", videoRouter);
app.use("/question", questionRouter);
app.use("/standard", standardRouter);
app.use("/classroom", classroomRouter);
app.use("/dashboard", dashboardRouter);
app.use("/videoQuestionAnswer", videoQuestionAnswerRouter);
app.use("/student", studentRouter);
app.use("/assessmentAnswer", assessmentAnswerRouter);

const port = process.env.PORT || 3000;


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  // logger.info(`Server is running on port ${port}`);
});
