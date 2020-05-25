const config = require('config');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const { MessageService } = require('./service/messageService');

const app = new Koa();

app.use(bodyParser());
app.use(async (ctx) => {
  const {
    method,
    request: { path },
  } = ctx;
  if (method === 'POST' && path === '/echoAtTime') {
    console.log('handle!!');
    const { time, message } = ctx.request.body;
    await messageService.postMessage({ time, message });

    ctx.status = 201;
    ctx.body = { sucess: true };
  }
});

const messageService = new MessageService();

messageService.initPolling();
messageService.initBlockingPoll();
console.log('Started to poll queue');

app.listen(config.port);
console.log(`Listening at: ${config.port}`);
