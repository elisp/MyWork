'use strict';

const winston = require('winston');
const config = require('./config');
const environmentConfig = require('../config');
require('winston-daily-rotate-file');

winston.emitErrs = true;

const logger = new winston.Logger({
  transports: [
    new (winston.transports.DailyRotateFile)({
      level: 'info',
      filename: config.filename,
      handleExceptions: true,
      json: true,
      maxsize: config.maxFileSize,
      maxFiles: 5,
      colorize: false,
      datePattern: 'yyyy-MM-dd.',
      prepend: true
    }),
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      timestamp: true,
      prettyPrint: true,
      colorize: true
    })
  ],
  exitOnError: false
});

module.exports = logger;
module.exports.stream = {
  write: function (message, encoding) {
    logger.info(message);
  }
};
