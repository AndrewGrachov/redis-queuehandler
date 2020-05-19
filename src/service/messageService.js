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
      const isDue = message.length && parseInt(message[1]) <= Date.now();
      if (isDue) {
        const item = JSON.parse(message[0]);
        console.log('PARSED: ', item);
        const wasLocked = await redis.lock(item.identifier);
        console.log('wasLocked: ', wasLocked);
        if (wasLocked) {
          const wasDeleted = await redis.removeMessage(message[0]);
          if (wasDeleted) {
            // pushToQueue
            await redis.postDelayedMessage({
              message: item.message,
              time: message[1],
            });
          }
        }

        // try catch finally remove message in any case
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
