const { expect } = require('chai');
const config = require('config');
const { Redis } = require('../src/db/redis');

const { MessageService } = require('../src/service/messageService');

const redis = new Redis({});
const { generate } = require('./helpers/payload');
describe('Basic test', function () {
  const handlesStack = [];
  const messageServices = [];

  let payload;
  this.timeout(30 * 1000);
  before(async function () {
    await redis.purge(config.delayedSetName);
  });
  before(async function () {
    const handle = function (msg) {
      console.log('handle msg: ', msg);
      handlesStack.push(msg);
    };

    // put 3 message services to simulate cluster
    for (let i = 0; i < 3; i++) {
      messageServices.push(new MessageService());
    }

    messageServices.forEach((ms) => {
      ms.initPolling();
      ms.initBlockingPoll(handle);
    });
  });

  before(function () {
    payload = generate(1 * 20);
  });

  it('should handle messages in proper order', async () => {
    for (item of payload) {
      messageServices[0].postMessage(item);
    }

    await new Promise(function poll(resolve) {
      setTimeout(() => {
        if (handlesStack.length === payload.length) {
          return resolve();
        }
        poll(resolve);
      }, 100);
    });

    const isEveryItemInOrder = handlesStack.every((item, index) => {
      console.log('item', JSON.parse(item));
      return JSON.parse(item).message === payload[index].message;
    });

    expect(isEveryItemInOrder).to.equal(true);
  });
});
