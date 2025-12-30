import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface ImageServeRequest {
  filename: string;
}

// Helper to get image directory
function getImagesDir(): string {
  // Use environment variable if set, otherwise default to project public/images
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR;
  }
  return join(process.cwd(), 'public', 'images');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename parameter is required' }, { status: 400 });
    }

    // Security: Only allow image files
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const imagesDir = getImagesDir();
    const imagePath = join(imagesDir, filename);

    // Check if file exists
    if (!existsSync(imagePath)) {
      console.warn('⚠️ Image not found:', imagePath);

      // Fallback path
      const fallbackPath = join(imagesDir, 'PhotoID.jpeg');

      if (existsSync(fallbackPath)) {
        console.log('🔄 Serving fallback image:', fallbackPath);
        const fallbackBuffer = await readFile(fallbackPath);
        return new NextResponse(new Uint8Array(fallbackBuffer), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=3600',
            'X-Image-Status': 'fallback',
            'X-Original-Request': filename
          }
        });
      } else {
        return NextResponse.json({ error: 'Image not found and no fallback available' }, { status: 404 });
      }
    }

    // Read and serve the image
    const imageBuffer = await readFile(imagePath);

    // Determine content type
    const contentType = fileExtension === '.png' ? 'image/png' :
      fileExtension === '.gif' ? 'image/gif' :
        fileExtension === '.webp' ? 'image/webp' :
          'image/jpeg';

    return new NextResponse(new Uint8Array(imageBuffer), {
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

export async function POST(request: Request) {
  try {
    const { filename }: ImageServeRequest = await request.json();

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const imagesDir = getImagesDir();
    const imagePath = join(imagesDir, filename);

    if (!existsSync(imagePath)) {
      return NextResponse.json({
        exists: false,
        accessible: false,
        message: 'Image not found',
        checkedPath: imagePath
      });
    }

    return NextResponse.json({
      exists: true,
      accessible: true,
      message: 'Image is available',
      path: imagePath
    });

  } catch (error) {
    console.error('❌ Error checking image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 