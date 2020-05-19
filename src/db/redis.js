const redis = require('redis');
const config = require('config');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');

const { sleep } = require('../utils/common');

const client = redis.createClient(config.redis);
const zaddAsync = promisify(client.zadd).bind(client);
const zrangeAsync = promisify(client.zrange).bind(client);
const zremZsync = promisify(client.zrem).bind(client);
const rpushAsync = promisify(client.rpush).bind(client);
const setnxAsync = promisify(client.setnx).bind(client);
const pexpireAsync = promisify(client.pexpire).bind(client);
const ttlAsync = promisify(client.ttl).bind(client);

const { queueName, delayedSetName } = config;

const LOCK_NAME = 'lock:msg';

class Redis {
  constructor() {
    client.on('error', this.handleError);
  }
  handleError = (err) => {
    console.log('Redis error!: ', err);
  };
  async postDelayedMessage({ message, time }) {
    const delay = time - Date.now();
    const item = JSON.stringify({
      identifier: uuidv4(),
      message,
    });
    if (delay > 0) {
      await zaddAsync(delayedSetName, time, item);
    } else {
      await rpushAsync(queueName, item);
    }
  }
  async lock(identifier) {
    const end = Date.now() + config.acquireTimeoutMS;
    while (Date.now() < end) {
      const result = await setnxAsync([LOCK_NAME, identifier]);
      if (result) {
        await pexpireAsync([LOCK_NAME, config.expireMS]);
        return true;
      } else {
        // double check
        const isTTLSet = (await ttlAsync(LOCK_NAME)) > 0;
        if (!isTTLSet) {
          await pexpireAsync([LOCK_NAME, config.expireMS]);
        }
      }
      await sleep(0.001);
    }
    return false;
  }

  async releaseLock() {}

  async getMessage() {
    const args = [delayedSetName, 0, 0, 'WITHSCORES'];
    const items = await zrangeAsync(args);
    return items;
  }

  async removeMessage(msg) {
    const args = [delayedSetName, msg];
    const result = await zremZsync(args);
    return result === 1;
  }
}

module.exports = new Redis();
