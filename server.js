const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
// For staging server, bind to all interfaces (0.0.0.0) not localhost
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
//const port = parseInt(process.env.PORT || '3000', 10);
const port = 5000;
console.log(`Starting server in ${dev ? 'development' : 'production'} mode`);
console.log(`Binding to ${hostname}:${port}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Function to serve static files
function serveStaticFile(req, res, filePath) {
  console.log('🔍 Attempting to serve file:', {
    requestedUrl: req.url,
    filePath: filePath,
    exists: fs.existsSync(filePath)
  });

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('❌ Error reading file:', {
        filePath: filePath,
        error: err.message,
        code: err.code
      });
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    console.log('✅ Successfully serving file:', {
      filePath: filePath,
      size: data.length,
      contentType: contentType
    });

    // Get file stats for cache-busting
    fs.stat(filePath, (statErr, stats) => {
      if (statErr) {
        console.warn('⚠️ Could not get file stats for cache-busting:', statErr.message);
      }

      // Create cache-busting headers
      const lastModified = stats ? stats.mtime.toUTCString() : new Date().toUTCString();
      const etag = stats ? `"${stats.size}-${stats.mtime.getTime()}"` : `"${data.length}-${Date.now()}"`;

      // Set cache headers with shorter duration and cache-busting
      const headers = {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour instead of 1 year
        'Last-Modified': lastModified,
        'ETag': etag,
        'Vary': 'Accept-Encoding'
      };

      // Check if client has a cached version
      const ifNoneMatch = req.headers['if-none-match'];
      const ifModifiedSince = req.headers['if-modified-since'];

      if (ifNoneMatch === etag) {
        // Client has the same version
        res.writeHead(304, { 'ETag': etag });
        res.end();
        return;
      }

      if (ifModifiedSince) {
        const clientDate = new Date(ifModifiedSince);
        const serverDate = new Date(lastModified);
        if (clientDate >= serverDate) {
          // Client has a newer or same version
          res.writeHead(304, { 'ETag': etag });
          res.end();
          return;
        }
      }

      // Send the file with cache headers
      res.writeHead(200, headers);
      res.end(data);
    });
  });
}

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

        // Handle static image files
        if (req.url && req.url.startsWith('/images/')) {
          const imagePath = path.join(__dirname, 'public', req.url);
          console.log('🖼️ Image request:', {
            url: req.url,
            fullPath: imagePath,
            exists: fs.existsSync(imagePath)
          });
          
          // List files in images directory for debugging
          const imagesDir = path.join(__dirname, 'public', 'images');
          if (fs.existsSync(imagesDir)) {
            const files = fs.readdirSync(imagesDir);
            console.log('📁 Files in images directory:', files);
          } else {
            console.log('❌ Images directory does not exist:', imagesDir);
          }
          
          serveStaticFile(req, res, imagePath);
          return;
        }

        // Handle uploads directory
        if (req.url && req.url.startsWith('/uploads/')) {
          const uploadPath = path.join(__dirname, 'public', req.url);
          console.log('📤 Upload request:', req.url, 'from:', uploadPath);
          serveStaticFile(req, res, uploadPath);
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
