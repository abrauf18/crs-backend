const express = require("express");
const dotenv = require("dotenv");
const authRouter = require("./routes/auth.route");

// Load environment variables from .env file
dotenv.config();

// Creating an Express application
const app = express();

// Set up JSON body parsing middleware
app.use(express.json());
app.use("/auth", authRouter);

// Define a route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const port = process.env.PORT || 3000; // Use the environment port if available, or default to 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
