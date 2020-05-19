const config = require('config');
const redis = require('../db/redis');

function defaultHandler(msg) {
  console.log(msg);
}

class MessageService {
  initPolling(handler = defaultHandler) {
    this.shouldPoll = true;
    this.poll(handler);
  }

  poll(handler) {
    setTimeout(async () => {
      // TODO: error handling
      const message = await redis.getMessage();
      if (message) {
        handler(message);
        // try catch finally remove message in any case
        await redis.removeMessage(message);
      }

      // do work
      if (this.shouldPoll) {
        this.poll(handler);
      }
    }, config.pollingIntervalMS);
  }

  async stopPolling() {
    this.poll = false;
  }
  async postMessage({ time, message }) {
    await redis.postDelayedMessage({ message, time });
  }
}

module.exports = new MessageService();
