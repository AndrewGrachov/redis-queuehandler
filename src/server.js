const config = require('config');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const messageService = require('./service/messageService')();

const app = new Koa();

app.use(bodyParser());
app.use(async (ctx) => {
  const {
    method,
    request: { path },
  } = ctx;
  if (method === 'POST' && path === '/echoAtTime') {
    const { time, message } = ctx.body;
    await messageService.postMessage({ time, message });

    ctx.status = 201;
    ctx.body = { sucess: true };
  }
});

app.listen(config.port);
console.log(`Listening at: ${config.port}`);
