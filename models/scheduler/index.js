
'use strict';

const scheduler = require('./scheduler');

module.exports = {
  addScheduledJob: scheduler.addScheduledJob,
  start: scheduler.start
};
