// app/api/seller/settings/profile-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import  prisma  from '@/lib/prisma';

// Helper function to delete a file from the public folder
async function deleteFileFromPublic(imageUrl: string | null) {
  if (!imageUrl) return;

  try {
    // Construct the absolute path to the file
    // The URL is stored as /uploads/profiles/filename.jpg
    // We need to prepend process.cwd() and '/public'
    const filePath = path.join(process.cwd(), 'public', imageUrl);

    // Check if file exists before attempting deletion to avoid errors
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`Deleted old file: ${filePath}`);
  } catch (error) {
    // If file doesn't exist (ENOENT), we ignore it so the app doesn't crash
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Failed to delete image file:', error);
    }
  }
}

// GET: Fetch current profile image
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the seller and select ONLY the profileImage
    const seller = await prisma.seller.findUnique({
      where: { email: session.user.email },
      select: {
        profileImage: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    return NextResponse.json({
      profileImage: seller.profileImage,
    });
  } catch (error) {
    console.error('Error fetching profile image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile image' },
      { status: 500 }
    );
  }
}

// POST: Upload new image and delete the old one
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const uniqueId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile-${uniqueId}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    await fs.mkdir(uploadDir, { recursive: true });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Create relative URL for the image
    const imageUrl = `/uploads/profiles/${fileName}`;

    // 1. Fetch Current Seller (to get userId and old image)
    const currentSeller = await prisma.seller.findUnique({
      where: { email: session.user.email },
      select: { id: true, userId: true, profileImage: true },
    });

    if (!currentSeller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // 2. Use a transaction to update BOTH Seller AND User tables
    // This ensures that NextAuth (which reads User table) and your Settings page are in sync.
    await prisma.$transaction([
      prisma.seller.update({
        where: { id: currentSeller.id },
        data: { profileImage: imageUrl },
      }),
      prisma.user.update({
        where: { id: currentSeller.userId },
        data: { image: imageUrl },
      }),
    ]);

    // 3. Delete old file if it existed
    if (currentSeller.profileImage) {
      await deleteFileFromPublic(currentSeller.profileImage);
    }

    return NextResponse.json({
      message: 'Profile image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile image' },
      { status: 500 }
    );
  }
}

// DELETE: Remove image from database and file system
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 1. Fetch Current Seller (to get userId and image path)
    const currentSeller = await prisma.seller.findUnique({
      where: { email: session.user.email },
      select: { id: true, userId: true, profileImage: true },
    });

    if (!currentSeller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // 2. Use a transaction to update BOTH Seller AND User tables
    await prisma.$transaction([
      prisma.seller.update({
        where: { id: currentSeller.id },
        data: { profileImage: null },
      }),
      prisma.user.update({
        where: { id: currentSeller.userId },
        data: { image: null },
      }),
    ]);

    // 3. Delete physical file
    if (currentSeller.profileImage) {
      await deleteFileFromPublic(currentSeller.profileImage);
    }
   
    return NextResponse.json({
      message: 'Profile image removed successfully',
    });
  } catch (error) {
    console.error('Error removing profile image:', error);
    return NextResponse.json(
      { error: 'Failed to remove profile image' },
      { status: 500 }
    );
  }
}