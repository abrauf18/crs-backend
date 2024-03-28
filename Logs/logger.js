const winston = require('winston');
const morgan = require('morgan');

// Create a logger instance
const logger = winston.createLogger({
    level: 'info', // Set the log level
    format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), // Log to the console
        new winston.transports.File({ filename: 'Logs/combined.log' }) // Log to a file
    ]
});

// Create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function(message, encoding) {
      // Use the 'info' log level so the output will be picked up by both transports (file and console)
      logger.info(message);
    },
  };
  
  // Setup the morgan middleware
  const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
      stream: logger.stream,
      skip: function (req, res) {
        return req.method === 'OPTIONS';
      }
    }
  );
  
  module.exports = { logger, morganMiddleware };

// usage
// const logger = require("../Logs/logger.js");
// logger.info("message");
// logger.warn("message");
// logger.error("message");
