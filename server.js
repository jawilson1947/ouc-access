const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const port = 3000;

console.log(`Starting server in ${dev ? 'development' : 'production'} mode`);
console.log(`Binding to ${hostname}:${port}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;

        // 🖼️ Serve static images manually
        if (pathname.startsWith('/images/')) {
          const imagePath = path.join(__dirname, 'public', pathname);
          if (fs.existsSync(imagePath)) {
            const stream = fs.createReadStream(imagePath);
            const ext = path.extname(imagePath).toLowerCase();
            const contentType = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp'
            }[ext] || 'application/octet-stream';

            res.writeHead(200, { 'Content-Type': contentType });
            return stream.pipe(res);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Image not found');
            return;
          }
        }

        // CORS preflight handling
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          });
          res.end();
          return;
        }

        req.setTimeout(60000);
        res.setTimeout(60000);

        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    })
    .setTimeout(60000)
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
