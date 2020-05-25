const { v4: uuidv4 } = require('uuid');

function generate(count) {
  const delay = 1 * 400 + Math.floor(Math.random() * 100);
  console.log('delay', delay);
  const startPoint = Date.now() + delay;
  const payload = [];
  for (let i = 0; i < count; i++) {
    payload.push({
      message: `random_message_${i}`,
      time: startPoint + i * 1,
    });
  }
  return payload;
}

module.exports = {
  generate,
};
