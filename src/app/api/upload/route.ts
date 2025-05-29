import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);

    // Ensure upload directory exists
    await writeFile(filepath, buffer);

    // Return the URL that can be used to access the file
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error in file upload:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 