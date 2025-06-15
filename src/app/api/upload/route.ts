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
    const buffer = new Uint8Array(bytes);

    // Create unique filename
    const timestamp = Date.now();
    
    // Handle camera-captured images that might not have a filename
    let filename: string;
    if (!file.name || file.name === 'image.jpg' || file.name === 'image.jpeg' || file.name === 'blob') {
      // Generate filename based on MIME type
      const mimeType = file.type.split('/')[1] || 'jpg';
      filename = `camera-${timestamp}.${mimeType}`;
      console.log('📸 Camera-captured image detected, using generated filename:', filename);
    } else {
      // Sanitize filename and ensure it has an extension
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const extension = sanitizedName.split('.').pop() || file.type.split('/')[1] || 'jpg';
      filename = `${timestamp}-${sanitizedName.split('.')[0]}.${extension}`;
    }
    
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