const config = require('config');
const { queueName, delayedSetName } = config;
const { Redis } = require('../db/redis');

function defaultHandler (msg) {
  console.log('handle:', msg);
}

class MessageService {
  constructor () {
    this.pollingClient = new Redis({ queueName, delayedSetName });
  }

  initPolling () {
    this.shouldPoll = true;
    this.poll();
  }

  async initBlockingPoll (handler = defaultHandler) {
    this.blockingClient = new Redis({ queueName, delayedSetName });
    this.blockingPoll(handler);
  }

  async blockingPoll (handler) {
    const messages = await this.blockingClient.blpop(0.1);
    if (messages && messages.length) {
      handler(messages[1]);
    }
    this.blockingPoll(handler);
  }

  poll () {
    setTimeout(async () => {
      // TODO: error handling
      const message = await this.pollingClient.getMessage();
      const isDue = message.length && Date.now() - parseInt(message[1]) > 0;
      if (isDue) {
        const item = JSON.parse(message[0]);
        const wasLocked = await this.pollingClient.lock(item.identifier);
        if (wasLocked) {
          /*
            Here could be a situation when message is deleted, but not pushed to queue.
            Should setup some redriving policy (because just changin order could result in message duplicates)
          */
          const wasDeleted = await this.pollingClient.removeMessage(message[0]);
          if (wasDeleted) {
            await this.pollingClient.postDelayedMessage({
              message: item.message,
              time: message[1]
            });
          }
          await this.pollingClient.releaseLock(item.identifier);
        }
      }

      if (this.shouldPoll) {
        this.poll();
      }
    }, config.pollingIntervalMS);
  }

  async stopPolling () {
    this.poll = false;
  }

  async postMessage ({ time, message }) {
    await this.pollingClient.postDelayedMessage({ message, time });
  }
}

module.exports = { MessageService };
