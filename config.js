'use strict';

const joi = require('joi');

const envVarsSchema = joi.object({
  NODE_ENV: joi.string()
    .allow(['development', 'production', 'test'])
    .default('production'),
  PORT: joi.number().integer().min(0).max(65535).default(3000)
})
  .unknown().required();

const envVars = joi.attempt(process.env, envVarsSchema);

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT
};

module.exports = config;
