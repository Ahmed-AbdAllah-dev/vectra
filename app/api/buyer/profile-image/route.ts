import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import  prisma  from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    console.log('Starting image upload...');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert string ID to number
    const userId = parseInt(session.user.id as string, 10);
    if (isNaN(userId)) {
      console.error('Invalid user ID format:', session.user.id);
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const formData = await req.formData();
    console.log('FormData received');
    
    const file = formData.get('image') as File | null;
    if (!file) {
      console.log('No file in form data');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.log('File too large:', file.size);
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    console.log('Upload directory:', uploadDir);
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('Directory created/verified');
    } catch (dirError) {
      console.error('Error creating directory:', dirError);
      throw dirError;
    }
    
    // Save file
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    console.log('File saved:', filepath);

    // Public URL
    const imageUrl = `/uploads/${filename}`;

    // Get the current buyer to find old image for deletion
    const currentBuyer = await prisma.buyer.findUnique({
      where: { userId: userId },
      select: { profileImage: true }
    });

    // Delete old image if it exists
    if (currentBuyer?.profileImage) {
      try {
        const oldFilename = currentBuyer.profileImage.replace('/uploads/', '');
        const oldFilepath = path.join(process.cwd(), 'public/uploads', oldFilename);
        await unlink(oldFilepath);
        console.log('Old image deleted:', oldFilename);
      } catch (deleteError) {
        // Ignore if file doesn't exist
        console.log('Old image not found or could not be deleted');
      }
    }

    // Update buyer record
    console.log('Updating buyer for user ID:', userId);
    const buyer = await prisma.buyer.update({
      where: { userId: userId },
      data: { profileImage: imageUrl },
    });
    console.log('Buyer updated:', buyer.id);

    return NextResponse.json({ url: imageUrl, success: true });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert string ID to number
    const userId = parseInt(session.user.id as string, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get current buyer to find the image path
    const buyer = await prisma.buyer.findUnique({
      where: { userId: userId },
      select: { profileImage: true },
    });

    if (buyer?.profileImage) {
      // Delete the file
      const filename = buyer.profileImage.replace('/uploads/', '');
      const filepath = path.join(process.cwd(), 'public/uploads', filename);
      try {
        await unlink(filepath);
        console.log('Image deleted:', filename);
      } catch (err) {
        // Ignore if file doesn't exist
        console.log('File not found or could not be deleted');
      }
    }

    // Update DB to remove reference
    await prisma.buyer.update({
      where: { userId: userId },
      data: { profileImage: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove error:', error);
    return NextResponse.json({ 
      error: 'Remove failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}