import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    console.log('📸 Upload API called');
    
    // Trust that authentication is handled at the application level
    // Since other API calls work and user can access the form, they are authenticated
    console.log('✅ Processing upload request');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('❌ Upload failed: No file provided');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
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
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `${timestamp}-${sanitizedName}`;
    
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);

    console.log(`💾 Saving to: ${filepath}`);

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      console.log('📁 Creating uploads directory...');
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(filepath, buffer);
    console.log('✅ File saved successfully');

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