// app/api/seller/settings/password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import bcrypt from 'bcryptjs';
import  prisma  from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // 1. Find the Seller (to verify old password and get the userId)
    const seller = await prisma.seller.findUnique({
      where: { email: session.user.email },
      select: { id: true, userId: true, password: true },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // 2. Verify the CURRENT password using the Seller's password
    // (We assume they are synced currently since you are logged in)
    const isPasswordValid = await bcrypt.compare(currentPassword, seller.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 403 }
      );
    }

    // 3. Hash the NEW password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update BOTH the User table AND the Seller table
    // This is the critical fix.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: seller.userId },
        data: { password: hashedPassword },
      }),
      prisma.seller.update({
        where: { id: seller.id },
        data: { password: hashedPassword },
      }),
    ]);

    return NextResponse.json({
      message: 'Password updated successfully',
    });

  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}