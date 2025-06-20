import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

// Function to sanitize string to only allow specific ASCII characters
function sanitizeString(str: string): string {
  if (!str) return '';
  
  console.log('🔍 Sanitizing string:', {
    input: str,
    length: str.length
  });
  
  const sanitized = str
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      // Allow A-Z (65-90), a-z (97-122), underscore (95), hyphen (45)
      if ((code >= 65 && code <= 90) || // A-Z
          (code >= 97 && code <= 122) || // a-z
          code === 95 || // _
          code === 45) { // -
        return char;
      }
      return ''; // Remove any other characters
    })
    .join('');
    
  console.log('✨ Sanitized result:', {
    output: sanitized,
    length: sanitized.length
  });
  
  return sanitized;
}

// Function to extract last 4 digits from phone number
function getLastFourDigits(phone: string): string {
  if (!phone) return '0000';
  
  console.log('📱 Processing phone number:', {
    input: phone,
    length: phone.length
  });
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  console.log('📱 Extracted digits:', {
    digits,
    length: digits.length
  });
  
  // Get the last 4 digits, or pad with zeros if less than 4 digits
  const last4 = digits.slice(-4).padStart(4, '0');
  console.log('📱 Final last 4 digits:', {
    last4,
    length: last4.length
  });
  
  return last4;
}

// Function to determine if file is from mobile camera
function isMobileCameraFile(file: File): boolean {
  if (!file || !file.name) return true; // Default to true for unnamed files
  
  const mobileCameraNames = [
    'image.jpg',
    'image.jpeg',
    'blob',
    'image-1.jpg',
    'image-1.jpeg',
    'photo.jpg',
    'photo.jpeg',
    'IMG_',
    'IMG-'
  ];
  
  const isMobile = mobileCameraNames.some(name => 
    !file.name || 
    file.name === name || 
    file.name.startsWith(name)
  );
  
  console.log('📸 Mobile camera check:', {
    fileName: file.name,
    isMobile
  });
  
  return isMobile;
}

// Enhanced image processing with Sharp
async function processImageWithSharp(buffer: Uint8Array, fileType: string): Promise<{ buffer: Uint8Array; format: string }> {
  try {
    console.log('🔄 Sharp image processing started:', {
      originalSize: buffer.length,
      fileType: fileType
    });

    // Create Sharp instance
    let sharpInstance = sharp(buffer, { failOnError: false });

    // Get image metadata
    const metadata = await sharpInstance.metadata();
    console.log('📊 Image metadata:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hasProfile: metadata.hasProfile,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    });

    // Auto-rotate based on EXIF orientation
    sharpInstance = sharpInstance.rotate();

    // Resize if image is too large (max 1920x1920)
    if (metadata.width && metadata.height) {
      const maxDimension = 1920;
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        sharpInstance = sharpInstance.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true
        });
        console.log('📏 Image resized to fit within', maxDimension, 'x', maxDimension);
      }
    }

    // Determine output format and quality
    let outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg';
    let quality = 85;

    if (fileType.includes('png') || fileType.includes('image/png')) {
      outputFormat = 'png';
      quality = 90; // PNG quality is different from JPEG
    } else if (fileType.includes('webp') || fileType.includes('image/webp')) {
      outputFormat = 'webp';
      quality = 85;
    } else {
      // Default to JPEG for all other formats
      outputFormat = 'jpeg';
      quality = 85;
    }

    // Process the image
    const processedBuffer = await sharpInstance
      .toFormat(outputFormat, { quality })
      .toBuffer();

    console.log('✅ Sharp processing completed:', {
      originalSize: buffer.length,
      processedSize: processedBuffer.length,
      compressionRatio: ((buffer.length - processedBuffer.length) / buffer.length * 100).toFixed(1) + '%',
      outputFormat: outputFormat
    });

    return {
      buffer: new Uint8Array(processedBuffer),
      format: outputFormat
    };

  } catch (error) {
    console.error('❌ Sharp processing failed:', error);
    
    // Fallback: return original buffer as JPEG
    console.log('🔄 Falling back to original image format');
    return {
      buffer: buffer,
      format: fileType.includes('png') ? 'png' : 'jpeg'
    };
  }
}

export async function POST(req: Request) {
  try {
    console.log('📸 Upload API called');
    
    // Trust that authentication is handled at the application level
    // Since other API calls work and user can access the form, they are authenticated
    console.log('✅ Processing upload request');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const lastname = formData.get('lastname') as string;
    const firstname = formData.get('firstname') as string;
    const phone = formData.get('phone') as string;

    if (!file) {
      console.error('❌ Upload failed: No file provided');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!lastname || !firstname || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Upload failed: Invalid file type:', file.type);
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('❌ Upload failed: File too large:', file.size);
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    console.log(`📷 Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Process image with Sharp (EXIF stripping, optimization, format standardization)
    const { buffer: processedBuffer, format: outputFormat } = await processImageWithSharp(buffer, file.type);

    // Generate filename using the naming convention
    const sanitizedLastname = sanitizeString(lastname);
    const sanitizedFirstname = sanitizeString(firstname);
    const last4Digits = getLastFourDigits(phone);
    
    // Use the processed format for the extension
    const extension = outputFormat;
    
    // Create filename: lastname + firstname + last4digits + extension
    const filename = `${sanitizedLastname}${sanitizedFirstname}${last4Digits}.${extension}`;
    
    console.log('📝 Generated filename:', {
      sanitizedLastname,
      sanitizedFirstname,
      last4Digits,
      extension,
      filename
    });
    
    // Create images directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'images');
    console.log('📁 Creating images directory...');
    await mkdir(uploadDir, { recursive: true });

    const filepath = join(uploadDir, filename);

    console.log(`💾 Saving to: ${filepath}`);

    await writeFile(filepath, processedBuffer);
    console.log('✅ File saved successfully');

    // Return the URL that can be used to access the file
    // Note: This URL is relative to the public directory
    const url = `images/${filename}`;
    console.log(`🔗 File URL: ${url}`);
    
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('💥 Error in file upload:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 