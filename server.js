const next = require('next');
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  require('http').createServer((req, res) => handle(req, res))
    .listen(process.env.PORT || 3000, () => {
      console.log('Server ready on port', process.env.PORT || 3000);
    });
});
