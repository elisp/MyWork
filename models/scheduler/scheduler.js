'use strict';

const bluebird = require('bluebird');
const moment = require('moment');
const redis = require('redis');
const logger = require('../../logger');
const config = require('./config');
const client = redis.createClient({ host: config.redis_host, port: config.redis_port });
bluebird.promisifyAll(redis);

const REDIS_QUEUE = 'jobs:queue';
const TEMP_QUEUE = `jobs:temp:queue:${config.service_name}`;
const REDIST_COUNTER = "jobs:count";

async function reset() {
  await client.del(REDIS_QUEUE);
  await client.del(TEMP_QUEUE);
  await client.del(REDIST_COUNTER);
}

function addScheduledJob(time, message) {
  time = moment.utc(time);
  return new Promise((resolve, reject) => {
    try {
      client.incr(REDIST_COUNTER, (err, id) => {
        let data = {
          message: message,
          id: id,
          time
        };
        let redis_data = JSON.stringify(data);
        client.zadd(REDIS_QUEUE, time.valueOf(), redis_data);
        logger.verbose(`[${process.pid}] addScheduledJob ${time}, ${message}`);
        resolve(data);
      });
    }
    catch (err) {
      reject(err);
    }
  });
}

function executePendingJobs(time) {
  return new Promise((resolve, reject) => {
    time = time || moment.utc().valueOf();
    return client.zrangebyscoreAsync(REDIS_QUEUE, 0, time)
      .then((jobList) => {
        let multi = client.multi();
        let result = [];
        if (jobList && jobList.length) {
          jobList.forEach(jopbData => {
            multi.sadd(TEMP_QUEUE, jopbData);
            multi.zrem(REDIS_QUEUE, jopbData);
          });
        } else {
          if (config.log_empty_queue) {
            logger.verbose(`[${process.pid}] no jobs`);
          }
        }
        multi.smembers(TEMP_QUEUE)
          .exec((error, executionResult) => {
            if (error) {
              logger.error(error);
              reject(error);
            } else {
              if (executionResult.length) {
                // since the last command in the multi was to get all the members of the temp queue
                let actualJobs = executionResult.pop();
                // if the operation succeeded,
                // we need to have the last item of the result to point to the lit of items in temp queue
                if (actualJobs && Array.isArray(actualJobs)) {
                  // let's return the actual jobs that were moved to the temp queue
                  result = actualJobs.map((jobData) => {
                    return deserializeJobFromData(jobData);
                  });
                }
                resolve(result);
              }
              resolve([]);
            }
          });
      });
  });
}

async function executeTempQueueJobs() {
  let result = [];
  let job_desc;
  do {
    let jobs = await client.spopAsync(TEMP_QUEUE, 100);
    if (jobs && jobs.length) {
      jobs.forEach(async job_desc => {
        let job = deserializeJobFromData(job_desc);
        result.push(job);
        await performJob(job);
      });
    }
  } while (job_desc);
  return result;
}

function performJob(job) {
  return new Promise((resolve, reject) => {
    logger.verbose(`[${process.pid}] performing job[${job.id}]: ${job.message}`);
    resolve(job);
  });
}

function deserializeJobFromData(serializedJobData) {
  let job = JSON.parse(serializedJobData);
  job.time = new Date(job.time);
  return job;
}

function getTempQueue() {
  return client.smembersAsync(TEMP_QUEUE)
    .then((members) => {
      return members.map((member) => {
        return deserializeJobFromData(member);
      });
    });
}

function getPendingQueue() {
  return client.zrangeAsync(REDIS_QUEUE, 0, -1)
    .then((range) => {
      let result = [];
      const jobList = range;
      if (jobList && jobList.length) {
        jobList.forEach(jobData => {
          let job = deserializeJobFromData(jobData);
          result.push(job);
        });
      }
      return result;
    });
}

async function start() {
  logger.debug(`[${process.pid}] Starting scheduler, interval ${config.scheduling_interval}`);

  // make sure that there are no "old" jobs in the queue
  // this might happen if the scheduler was crashed before
  // processing the temp queue.
  await executeTempQueueJobs();

  return setInterval(async () => {
    await executePendingJobs();
    await executeTempQueueJobs();
  }, config.scheduling_interval * 1000);
}

module.exports = {
  addScheduledJob,
  start: function () { this.executionId = start(); },
  stop: function () { clearInterval(this.executionId); },
  executePendingJobs,
  executeTempQueueJobs,
  getPendingQueue,
  getTempQueue,
  reset
};
