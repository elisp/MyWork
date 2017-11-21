'use strict';

const winston = require('winston');
const joi = require('joi');
const defaultLogMaxFileSize = 1024 * 1024 * 5; // 5MB
const logVarsSchema = joi.object({
  REQUEST_LOGGER_FILENAME: joi.string().default('access.log'),
  REQUEST_LOGGER_FOLDER: joi.string().default('logs/requests')
}).unknown()
  .required();

try {
  const logVars = joi.attempt(process.env, logVarsSchema);

  const config = {
    filename: logVars.REQUEST_LOGGER_FILENAME,
    folder: logVars.REQUEST_LOGGER_FOLDER
  };

  module.exports = config;
}
catch (err) {
  winston.error(err);
  process.exit(1);
}
