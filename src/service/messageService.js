const redis = require('../db/redis');

class MessageService {
  constructor(handler) {
    this.handler = handler;
    this.initPolling();
  }
  initPolling() {}
  postMessage({ time, message }) {}
}

function defaultHandler(msg) {
  console.log(msg);
}

module.exports = function (handler = defaultHandler) {
  return new MessageService(handler);
};
