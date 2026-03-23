// app/api/seller/settings/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import  prisma  from '@/lib/prisma';


// Define notification settings type
interface NotificationSettings {
  newOrder: boolean;
  orderUpdates: boolean;
  lowStock: boolean;
  newReview: boolean;
  newsletter: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get seller notification preferences
    const seller = await prisma.seller.findUnique({
      where: { email: session.user.email },
      select: {
        notificationPreferences: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Parse notification preferences or return defaults
    const defaultNotifications: NotificationSettings = {
      newOrder: true,
      orderUpdates: true,
      lowStock: true,
      newReview: true,
      newsletter: false,
    };

    const notificationSettings = seller.notificationPreferences 
      ? JSON.parse(seller.notificationPreferences) as NotificationSettings
      : defaultNotifications;

    return NextResponse.json(notificationSettings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as NotificationSettings;
    
    // Validate the notification settings structure
    const validKeys: (keyof NotificationSettings)[] = [
      'newOrder', 'orderUpdates', 'lowStock', 'newReview', 'newsletter'
    ];
    
    for (const key of validKeys) {
      if (typeof body[key] !== 'boolean') {
        return NextResponse.json(
          { error: `Invalid value for ${key}` },
          { status: 400 }
        );
      }
    }

    // Update seller notification preferences
    await prisma.seller.update({
      where: { email: session.user.email },
      data: {
        notificationPreferences: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      settings: body,
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}