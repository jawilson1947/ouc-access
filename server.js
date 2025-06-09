const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
// For staging server, bind to all interfaces (0.0.0.0) not localhost
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

console.log(`Starting server in ${dev ? 'development' : 'production'} mode`);
console.log(`Binding to ${hostname}:${port}`);

const app = next({ dev, hostname: 'localhost', port }); // Next.js should use localhost internally
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        
        // Only set minimal CORS headers to avoid conflicts with NextAuth
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          });
          res.end();
          return;
        }

        // Set reasonable timeouts
        req.setTimeout(60000); // 1 minute
        res.setTimeout(60000); // 1 minute

        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    })
    .setTimeout(60000) // 1 minute server timeout
    .listen(port, hostname, (err) => {
      if (err) {
        console.error('Server failed to start:', err);
        process.exit(1);
      }
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to prepare Next.js app:', err);
    process.exit(1);
  }); 