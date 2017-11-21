'use strict';

const moment = require('moment');
const bluebird = require('bluebird');
const { expect } = require('chai');
const scheduler = require('./scheduler');
const config = require('./config');

describe('Scheduler', () => {
  let time = moment.utc();
  let later = time.add(5);
  let originalInterval = config.scheduling_interval;


  beforeEach(async () => {
    scheduler.reset();
    time = moment.utc();
    later = time.add(5);
    config.scheduling_interval = 0.001;
  });

  afterEach(async () => {
    config.scheduling_interval = originalInterval;
  });

  describe('.addScheduledJob', () => {
    it('should add new scheduled job', async () => {
      await scheduler.addScheduledJob(time.valueOf(), "message");
      let pendingJobs = await scheduler.getPendingQueue();
      expect(pendingJobs.length).to.eql(1);
    });

    it('two similar jobs get different ids', async () => {
      let job1 = await scheduler.addScheduledJob(time.valueOf(), "message");
      let job2 = await scheduler.addScheduledJob(time.valueOf(), "message");
      expect(job1.id).not.to.eql(job2.id);
    });

    it('should allow adding the job details twice', async () => {
      await scheduler.addScheduledJob(time.valueOf(), "message");
      await scheduler.addScheduledJob(time.valueOf(), "message");
      let pendingQueueJobs = await scheduler.getPendingQueue();
      expect(pendingQueueJobs.length).to.eql(2);
    });

    it('should move jobs to temp queue when time comes', async () => {
      await scheduler.addScheduledJob(time.valueOf(), "message");
      await scheduler.addScheduledJob(time.valueOf(), "message");

      let pendingQueueJobs = await scheduler.getPendingQueue();
      expect(pendingQueueJobs.length).to.eql(2);

      let pendingJobs = await scheduler.executePendingJobs(later.valueOf());
      expect(pendingJobs.length).to.eql(2);

      pendingQueueJobs = await scheduler.getPendingQueue();
      expect(pendingQueueJobs.length).to.eql(0);

      let tempJobs = await scheduler.getTempQueue();
      expect(tempJobs.length).to.eql(2);
    });

    it('both queues should be empty after executing all jobs', async () => {
      await scheduler.addScheduledJob(time.valueOf(), "message");
      await scheduler.addScheduledJob(time.valueOf(), "message");

      let pendingJobs = await scheduler.executePendingJobs(later.valueOf());
      expect(pendingJobs.length).to.eql(2);

      let pendingQueueJobs = await scheduler.getPendingQueue();
      expect(pendingQueueJobs.length).to.eql(0);

      let tempQueuJobs = await scheduler.executeTempQueueJobs();
      expect(tempQueuJobs.length).to.eql(2);

      let tempJobs = await scheduler.getTempQueue();
      expect(tempJobs.length).to.eql(0);
    });

    it('queues are empty after scheduler run', (done) => {
      let t = time.add(-1).valueOf();
      let work = [];
      work.push(scheduler.addScheduledJob(t, "message"));
      work.push(scheduler.addScheduledJob(t, "message"));

      bluebird.all(work)
        .then(() => {
          scheduler.getPendingQueue()
            .then((pendingQueueJobs) => {
              expect(pendingQueueJobs.length).to.eql(2);

              scheduler.start();

              setTimeout(async () => {
                scheduler.stop();
                pendingQueueJobs = await scheduler.getPendingQueue();
                expect(pendingQueueJobs.length).to.eql(0);
                let tempJobs = await scheduler.getTempQueue();
                expect(tempJobs.length).to.eql(0);
                done();
              }, 15);
            });
        });
    });
  });
});
