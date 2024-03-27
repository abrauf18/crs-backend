const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
    level: 'info', // Set the log level
    format: winston.format.json(), // Use JSON format for logs
    transports: [
        new winston.transports.Console(), // Log to the console
        new winston.transports.File({ filename: 'Logs/combined.log' }) // Log to a file
    ]
});

module.exports = logger;

// usage
// const logger = require("../Logs/logger.js");
// logger.info("message");
// logger.warn("message");
// logger.error("message");
