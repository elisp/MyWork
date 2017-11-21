'use strict';

const logger = require('./logger');
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const scheduler = require('./models/scheduler');

scheduler.start();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

logger.debug("Overriding 'Express' logger");
require('./requests-logger').init(app);

require('./api').init(app);

const port = config.port;

const apiRouter = express.Router();

app.use((err, req, res, next) => {
  if (err) {
    logger.error(`[${process.pid}] Unhandled Exception`, err);
    res.status(500).send('Something went wrong!');
  }
  else
    next();
});

// log unhandled execpetions
process.on('uncaughtException', (err) => {
  logger.error(`[${process.pid}] Unhandled Exception`, err);
});
process.on('uncaughtRejection', (err, promise) => {
  logger.error(`[${process.pid}] Unhandled Rejection`, err);
});

app.get('/alive', (req, res, next) => {
  res.sendStatus(200);
});

app.listen(port, function (err) {
  if (err) {
    throw err;
  }
  logger.info(`[${process.pid}] API listening on port ${port}`);
});
