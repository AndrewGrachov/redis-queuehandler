const fetch = require('node-fetch');
const os = require('os');
const { port, delayedSetName } = require('config');
const { generate } = require('./test/helpers/payload');
const { Redis } = require('./src/db/redis');

(async function () {
  const redis = new Redis({});
  // purge queue and set
  await redis.purge(delayedSetName);

  const payload = generate(50);
  for (const item of payload) {
    console.log('item:', item);
    await fetch(`http://${os.hostname()}:${port}/echoAtTime`, {
      method: 'POST',
      body: JSON.stringify(item),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  process.exit();
})();
