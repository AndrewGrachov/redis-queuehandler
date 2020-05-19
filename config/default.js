module.exports = {
  port: 5000,
  redis: {
    host: '0.0.0.0',
    port: '6379',
  },
  pollingIntervalMS: 0.5,
  queueName: 'message_queue',
  delayedSetName: 'delayed_set',
  acquireTimeoutMS: 10,
  expireMS: 6,
};
