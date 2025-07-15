import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Extract filename from the path
    // URL format: /api/images/filename.jpeg
    const filename = pathname.replace('/api/images/', '');
    
    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }

    console.log('🖼️ Image request:', {
      pathname,
      filename,
      url: request.url
    });

    // Security: Only allow image files
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      console.error('❌ Invalid file extension:', fileExtension);
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Try multiple possible paths for the image
    const possiblePaths = [
      // Standard Next.js public directory
      join(process.cwd(), 'public', 'images', filename),
      // Alternative paths that might exist in production
      join(process.cwd(), '..', 'public', 'images', filename),
      join('/home/jawilson/fullstack-app/public/images', filename),
      join('/var/www/html/images', filename)
    ];
    
    console.log('📁 Checking possible file paths:');
    possiblePaths.forEach((path, index) => {
      console.log(`   ${index + 1}. ${path} - ${existsSync(path) ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    // Find the first existing path
    let imagePath = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        imagePath = path;
        console.log(`✅ Found image at: ${imagePath}`);
        break;
      }
    }

    // Check if file exists
    if (!imagePath) {
      console.warn('⚠️ Image not found in any expected location:', filename);
      
      // Return fallback image
      const fallbackPaths = [
        join(process.cwd(), 'public', 'images', 'PhotoID.jpeg'),
        join(process.cwd(), '..', 'public', 'images', 'PhotoID.jpeg'),
        join('/home/jawilson/fullstack-app/public/images', 'PhotoID.jpeg'),
        join('/var/www/html/images', 'PhotoID.jpeg')
      ];
      
      let fallbackPath = null;
      for (const path of fallbackPaths) {
        if (existsSync(path)) {
          fallbackPath = path;
          break;
        }
      }
      
      if (fallbackPath) {
        console.log('🔄 Serving fallback image:', fallbackPath);
        const fallbackBuffer = await readFile(fallbackPath);
        return new NextResponse(fallbackBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=3600',
            'X-Image-Status': 'fallback',
            'X-Original-Request': filename
          }
        });
      } else {
        console.error('❌ No fallback image found');
        return NextResponse.json({ error: 'Image not found and no fallback available' }, { status: 404 });
      }
    }

    // Read and serve the image
    const imageBuffer = await readFile(imagePath);
    
    // Determine content type based on file extension
    const contentType = fileExtension === '.png' ? 'image/png' :
                       fileExtension === '.gif' ? 'image/gif' :
                       fileExtension === '.webp' ? 'image/webp' :
                       'image/jpeg';

    console.log('✅ Serving image:', {
      filename,
      path: imagePath,
      size: imageBuffer.length,
      contentType
    });

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=14400', // 4 hours
        'X-Image-Status': 'served',
        'X-Image-Path': imagePath
      }
    });

  } catch (error) {
    console.error('❌ Error serving image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 