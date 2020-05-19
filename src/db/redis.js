const redis = require('redis');
const config = require('config');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');

const client = redis.createClient(config.redis);
const zaddAsync = promisify(client.zadd).bind(client);
const zrangeAsync = promisify(client.zrange).bind(client);
const zremZsync = promisify(client.zrem).bind(client);
const rpushAsync = promisify(client.rpush).bind(client);

const { queueName, delayedSetName } = config;

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
    console.log('delay: ', delay);
    if (delay > 0) {
      await zaddAsync(delayedSetName, time, item);
    } else {
      await rpushAsync(queueName, item);
    }
  }
  lock(name) {}

  async getMessage() {
    const args = [delayedSetName, 0, 0, 'WITHSCORES'];
    const items = await zrangeAsync(args);
    return items[0];
  }

  async removeMessage(msg) {
    const args = [delayedSetName, msg];
    return zremZsync(args);
  }
}

module.exports = new Redis();
