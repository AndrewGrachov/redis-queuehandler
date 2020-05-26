const redis = require('redis');
const config = require('config');
const Promise = require('bluebird');
const { v4: uuidv4 } = require('uuid');

const { sleep } = require('../utils/common');

const LOCK_NAME = 'lock:msg';

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

class Redis {
  constructor ({ queueName, delayedSetName }) {
    this.queueName = queueName;
    this.delayedSetName = delayedSetName;
    this.client = redis.createClient(config.redis);
    this.client.on('error', this.handleError);
  }

  handleError (err) {
    console.log('Redis error!: ', err);
  }

  // actually, client should not handle this logic. todo: move to message service
  async postDelayedMessage ({ message, time }) {
    const delay = time - Date.now();
    const item = JSON.stringify({
      identifier: uuidv4(),
      message
    });
    if (delay > 0) {
      await this.client.zaddAsync([this.delayedSetName, time, item]);
    } else {
      await this.client.rpushAsync(this.queueName, item);
    }
  }

  async lock (identifier) {
    const end = Date.now() + config.acquireTimeoutMS;
    while (Date.now() < end) {
      const result = await this.client.setnxAsync([LOCK_NAME, identifier]);
      if (result) {
        await this.client.pexpireatAsync([
          LOCK_NAME,
          Date.now() + config.expireMS
        ]);
        return true;
      } else {
        // double check
        const isTTLSet = (await this.client.ttlAsync(LOCK_NAME)) > 0;
        if (!isTTLSet) {
          await this.client.pexpireatAsync([
            LOCK_NAME,
            Date.now() + config.expireMS
          ]);
        }
      }
      await sleep(0.001);
    }
    return false;
  }

  async releaseLock (identifier) {
    await this.client.watchAsync(LOCK_NAME);
    const lockValue = await this.client.getAsync(LOCK_NAME);
    if (lockValue === identifier) {
      await this.client.delAsync(LOCK_NAME);
    }
    await this.client.unwatchAsync();
  }

  // todo parametrize set
  async getMessage () {
    const args = [
      this.delayedSetName,
      '-inf',
      '+inf',
      'WITHSCORES',
      'LIMIT',
      0,
      1
    ];
    const items = await this.client.zrangebyscoreAsync(args);
    return items;
  }

  async blpop (timeout = 0) {
    return this.client.blpopAsync([this.queueName, timeout]);
  }

  async removeMessage (msg) {
    const args = [this.delayedSetName, msg];
    const result = await this.client.zremAsync(args);
    return result === 1;
  }

  async purge (setName) {
    const args = [setName, '-inf', '+inf'];
    return this.client.zremrangebyscoreAsync(args);
  }
}

module.exports = { Redis };
