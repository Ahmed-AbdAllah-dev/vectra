// app/api/seller/settings/profile-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put, del } from '@vercel/blob';
import  prisma  from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Helper function to delete a file from Vercel Blob
async function deleteFileFromBlob(imageUrl: string | null) {
  if (!imageUrl || !imageUrl.includes('public.blob.vercel-storage.com')) return;

  try {
    await del(imageUrl);
    console.log(`Deleted blob: ${imageUrl}`);
  } catch (error) {
    console.error('Failed to delete blob file:', error);
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

    // Unique filename
    const filename = `seller-profile-${uuidv4()}-${file.name.replace(/\s+/g, '-')}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    console.log('Seller profile image uploaded to Vercel Blob:', blob.url);
    const imageUrl = blob.url;

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

    // 3. Delete old file if it was on Vercel Blob
    if (currentSeller.profileImage) {
      await deleteFileFromBlob(currentSeller.profileImage);
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

    // 3. Delete from Vercel Blob
    if (currentSeller.profileImage) {
      await deleteFileFromBlob(currentSeller.profileImage);
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