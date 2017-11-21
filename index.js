'use strict';

const os = require('os');
const cluster = require('cluster');
const logger = require('./logger');
const config = require('./config');

if (cluster.isMaster) {
  const cpus = os.cpus().length;

  // In order to simulate multiple services behind load balancer,
  // I'm using the built-in node cluster class
  // And creating a child process per CPU
  logger.info(`[${process.pid}] Forking for ${cpus} CPUs`);
  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }

  // In case a sub-process crashed, it send a 'exit' message
  // Once we get this message, I'd like to create another
  // child process instead.
  cluster.on('exit', (worker, code, signal) => {
    // this check is for not creating a new process when
    // the exit was initiated by us (using the kill command)
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      logger.log(`API service ${worker.id} crashed. ` +
                'Starting a new service...');
      cluster.fork();
    }
  });

  // Once we'd like to restart all child processes, we send a message to the master
  // This message will use the custom SIGUSR2 message
  // I'm iterating through the child processes
  process.on('SIGUSR2', () => {
    const services = Object.values(cluster.workers);
    const restartService = (serviceIndex) => {
      const service = services[serviceIndex];
      if (!service) return;

      // Registering to the "exit" hook that will be fired once the process is down
      service.on('exit', () => {
        if (!service.exitedAfterDisconnect) return;
        logger.info(`Exited process ${service.process.pid}`);

        // Then I'm forking new one instead
        cluster.fork().on('listening', () => {
          // And restarting the next child process
          restartService(serviceIndex + 1);
        });
      });

      service.disconnect();
    };

    restartService(0);
  });

} else {
  require('./server');
}
