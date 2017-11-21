'use strict';

const winston = require('winston');
const joi = require('joi');
const defaultLogMaxFileSize = 1024 * 1024 * 5; // 5MB
const logVarsSchema = joi.object({
  LOG_FILENAME: joi.string().default('./log'),
  LOG_MAXSIZE: joi.number().integer().min(1024).default(5242880)
}).unknown()
  .required();

try {
  const logVars = joi.attempt(process.env, logVarsSchema);

  const config = {
    filename: logVars.LOG_FILENAME,
    maxFileSize: logVars.LOG_MAXSIZE
  };

  module.exports = config;
}
catch (err) {
  winston.error(err);
  process.exit(1);
}
