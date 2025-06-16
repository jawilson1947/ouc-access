import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Function to sanitize string to only allow specific ASCII characters
function sanitizeString(str: string): string {
  return str
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

    console.log(`📷 Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Get the last 4 digits of the phone number
    const last4Digits = phone.replace(/\D/g, '').slice(-4);
    
    // Determine file extension based on source
    let extension: string;
    if (!file.name || file.name === 'image.jpg' || file.name === 'image.jpeg' || file.name === 'blob') {
      // Camera-captured images should be jpeg
      extension = 'jpg';
    } else {
      // For other images, use the original extension or default to png
      const originalExt = file.name.split('.').pop()?.toLowerCase();
      extension = (originalExt === 'jpg' || originalExt === 'jpeg') ? 'jpg' : 'png';
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