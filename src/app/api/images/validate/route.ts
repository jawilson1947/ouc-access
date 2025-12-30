import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';

interface ImageValidationRequest {
  imageUrl: string;
  fallbackUrl?: string;
}

interface ImageValidationResponse {
  exists: boolean;
  accessible: boolean;
  fallbackUsed: boolean;
  finalUrl: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const { imageUrl, fallbackUrl = '/images/PhotoID.jpeg' }: ImageValidationRequest = await request.json();
    
    console.log('🔍 Validating image:', {
      imageUrl,
      fallbackUrl
    });

    // Extract filename from image URL
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      return NextResponse.json({
        exists: false,
        accessible: false,
        fallbackUsed: true,
        finalUrl: fallbackUrl,
        message: 'Invalid image URL format'
      } as ImageValidationResponse);
    }

    // Check if image exists in the filesystem
    const imagePath = join(process.cwd(), 'public', 'images', filename);
    const imageExists = existsSync(imagePath);

    console.log('📁 Image file check:', {
      filename,
      imagePath,
      exists: imageExists
    });

    if (imageExists) {
      // Image exists locally
      return NextResponse.json({
        exists: true,
        accessible: true,
        fallbackUsed: false,
        finalUrl: imageUrl,
        message: 'Image is available'
      } as ImageValidationResponse);
    } else {
      // Image doesn't exist, use fallback
      console.log('⚠️ Image not found, using fallback:', fallbackUrl);
      
      return NextResponse.json({
        exists: false,
        accessible: false,
        fallbackUsed: true,
        finalUrl: fallbackUrl,
        message: 'Image not found, using fallback'
      } as ImageValidationResponse);
    }

  } catch (error) {
    console.error('❌ Image validation error:', error);
    
    return NextResponse.json({
      exists: false,
      accessible: false,
      fallbackUsed: true,
      finalUrl: '/images/PhotoID.jpeg',
      message: 'Image validation failed'
    } as ImageValidationResponse);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const fallbackUrl = searchParams.get('fallback') || '/images/PhotoID.jpeg';

  if (!imageUrl) {
    return NextResponse.json({
      exists: false,
      accessible: false,
      fallbackUsed: true,
      finalUrl: fallbackUrl,
      message: 'No image URL provided'
    } as ImageValidationResponse);
  }

  // Extract filename from image URL
  const filename = imageUrl.split('/').pop();
  if (!filename) {
    return NextResponse.json({
      exists: false,
      accessible: false,
      fallbackUsed: true,
      finalUrl: fallbackUrl,
      message: 'Invalid image URL format'
    } as ImageValidationResponse);
  }

  // Check if image exists in the filesystem
  const imagePath = join(process.cwd(), 'public', 'images', filename);
  const imageExists = existsSync(imagePath);

  console.log('🔍 GET Image validation:', {
    imageUrl,
    filename,
    imagePath,
    exists: imageExists
  });

  if (imageExists) {
    return NextResponse.json({
      exists: true,
      accessible: true,
      fallbackUsed: false,
      finalUrl: imageUrl,
      message: 'Image is available'
    } as ImageValidationResponse);
  } else {
    return NextResponse.json({
      exists: false,
      accessible: false,
      fallbackUsed: true,
      finalUrl: fallbackUrl,
      message: 'Image not found, using fallback'
    } as ImageValidationResponse);
  }
} 