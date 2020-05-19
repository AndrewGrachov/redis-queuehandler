const config = require('config');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const messageService = require('./service/messageService');

const app = new Koa();

app.use(bodyParser());
app.use(async (ctx) => {
  const {
    method,
    request: { path },
  } = ctx;
  if (method === 'GET' && path === '/echoAtTime') {
    // const { time, message } = ctx.body;
    const { time = Date.now() + 2000, message } = ctx.query;
    await messageService.postMessage({ time, message });

    ctx.status = 201;
    ctx.body = { sucess: true };
  }
});

messageService.initPolling();
console.log('Started to poll queue');

app.listen(config.port);
console.log(`Listening at: ${config.port}`);
