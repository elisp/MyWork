'use strict';

const joi = require('joi');
const logger = require('../../logger');

const envVarsSchema = joi.object({
  REDIS_HOST: joi.string().required(),
  JOB_SERVICE_NAME: joi.string().required(),
  REDIT_PORT: joi.number().integer().min(0).max(65535).default(6379),
  LOG_EMPTY_QUEUE: joi.bool().default(false),
  SCHEDULING_INTERVAL: joi.number().integer().min(0).max(60).required()
}).unknown()
  .required();

try {
  const envVars = joi.attempt(process.env, envVarsSchema);

  const config = {
    redis_host: envVars.REDIS_HOST,
    redis_port: envVars.REDIS_PORT,
    log_empty_queue: envVars.LOG_EMPTY_QUEUE,
    scheduling_interval: envVars.SCHEDULING_INTERVAL,
    service_name: envVars.JOB_SERVICE_NAME
  };

  module.exports = config;
}
catch (err) {
  logger.error(err);
  process.exit(1);
}
