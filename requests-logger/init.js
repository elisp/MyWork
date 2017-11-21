'use strict';

const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const rfs = require('rotating-file-stream');
const config = require('./config');
const logger = require('../logger');

function init(app) {

  // ensure log directory exists
  fs.existsSync(config.folder) || fs.mkdirSync(config.folder);

  // create a rotating write stream
  const accessLogStream = rfs(config.filename, {
    interval: '1d', // rotate daily
    path: config.folder
  });

  // setup the logger
  app.use(morgan('combined', { stream: accessLogStream }));
}

module.exports = init;
