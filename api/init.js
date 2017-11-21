'use strict';

let apiController = require('./apiController');

function initApi(app) {
  app.post('/api/echoAtTime', apiController.echoAtTime);
}

module.exports = initApi;