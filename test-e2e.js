const fetch = require('node-fetch');
const os = require('os');
const { port } = require('config');
const { generate } = require('./test/helpers/payload');
const { sleep } = require('./src/utils/common');
const { Redis } = require('./src/db/redis');

(async function () {
  const redis = new Redis({});
  // purge queue and set
  await redis.purge(config.delayedSetName);
  await redis.clean(config.queueName);

  const payload = generate(20);
  for (item of payload) {
    console.log('item:', item);
    await fetch(`http://${os.hostname()}:${port}/echoAtTime`, {
      method: 'POST',
      body: JSON.stringify(item),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await sleep(20 * 1000);
  process.exit();
})();
