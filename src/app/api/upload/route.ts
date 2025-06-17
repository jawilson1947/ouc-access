import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

export async function POST(req: Request) {
  try {
    console.log('📸 Upload API called');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const lastname = formData.get('lastname') as string;
    const firstname = formData.get('firstname') as string;
    const phone = formData.get('phone') as string;
    
    console.log('📸 Upload request details:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      lastname,
      firstname,
      phone
    });

    if (!file) {
      console.error('❌ Upload failed: No file provided');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!lastname || !firstname || !phone) {
      console.error('❌ Upload failed: Missing required fields');
      return NextResponse.json({ error: 'Lastname, firstname, and phone are required' }, { status: 400 });
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

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Get the last 4 digits of the phone number
    const last4Digits = getLastFourDigits(phone);
    
    // Determine file extension based on source
    let extension: string;
    if (isMobileCameraFile(file)) {
      // Camera-captured images should be jpeg
      extension = 'jpg';
      console.log('📸 Detected mobile camera image, using .jpg extension');
    } else {
      // For other images, use the original extension or default to png
      const originalExt = file.name.split('.').pop()?.toLowerCase();
      extension = (originalExt === 'jpg' || originalExt === 'jpeg') ? 'jpg' : 'png';
      console.log('📸 Using original extension:', extension);
    }

    // Sanitize the name components
    const sanitizedLastname = sanitizeString(lastname);
    const sanitizedFirstname = sanitizeString(firstname);
    
    // Create filename: lastname + firstname + last4digits + extension
    const filename = `${sanitizedLastname}${sanitizedFirstname}${last4Digits}.${extension}`;
    
    console.log('📝 Generated filename:', {
      original: { lastname, firstname, phone },
      sanitized: { lastname: sanitizedLastname, firstname: sanitizedFirstname, last4Digits },
      final: filename
    });
    
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);

    console.log(`💾 Saving to: ${filepath}`);

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      console.log('📁 Creating uploads directory...');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (mkdirError: any) {
        console.error('❌ Failed to create uploads directory:', mkdirError);
        return NextResponse.json(
          { error: 'Failed to create uploads directory', details: mkdirError.message },
          { status: 500 }
        );
      }
    }

    try {
      await writeFile(filepath, buffer);
      console.log('✅ File saved successfully');
    } catch (writeError: any) {
      console.error('❌ Failed to write file:', writeError);
      return NextResponse.json(
        { error: 'Failed to save file', details: writeError.message },
        { status: 500 }
      );
    }

    // Return the URL that can be used to access the file
    const url = `/uploads/${filename}`;
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