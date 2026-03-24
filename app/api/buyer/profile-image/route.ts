import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put, del } from '@vercel/blob';
import  prisma  from '@/lib/prisma';

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

    // Upload to Vercel Blob
    const filename = `profile-${userId}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const blob = await put(filename, file, {
      access: 'public',
    });

    console.log('Profile image uploaded to Vercel Blob:', blob.url);
    const imageUrl = blob.url;

    // Get the current buyer to find old image for deletion
    const currentBuyer = await prisma.buyer.findUnique({
      where: { userId: userId },
      select: { profileImage: true }
    });

    // Delete old image if it exists on Vercel Blob
    if (currentBuyer?.profileImage && currentBuyer.profileImage.includes('public.blob.vercel-storage.com')) {
      try {
        await del(currentBuyer.profileImage);
        console.log('Old Vercel Blob image deleted:', currentBuyer.profileImage);
      } catch (deleteError) {
        console.error('Failed to delete old blob:', deleteError);
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

    if (buyer?.profileImage && buyer.profileImage.includes('public.blob.vercel-storage.com')) {
      // Delete from Vercel Blob
      try {
        await del(buyer.profileImage);
        console.log('Image deleted from Vercel Blob:', buyer.profileImage);
      } catch (err) {
        console.error('Failed to delete blob:', err);
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