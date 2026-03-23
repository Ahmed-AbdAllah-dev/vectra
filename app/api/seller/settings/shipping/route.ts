// app/api/seller/settings/shipping/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import  prisma  from '@/lib/prisma';


// Define shipping settings type
interface ShippingSettings {
  enabled: boolean;
  freeShippingThreshold: number;
  domesticRate: number;
  internationalRate: number;
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

    // Get seller shipping settings
    const seller = await prisma.seller.findUnique({
      where: { email: session.user.email },
      select: {
        shippingSettings: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Parse shipping settings or return defaults
    const defaultShipping: ShippingSettings = {
      enabled: true,
      freeShippingThreshold: 50,
      domesticRate: 5.99,
      internationalRate: 19.99,
    };

    const shippingSettings = seller.shippingSettings 
      ? JSON.parse(seller.shippingSettings) as ShippingSettings
      : defaultShipping;

    return NextResponse.json(shippingSettings);
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping settings' },
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

    const body = await request.json() as ShippingSettings;
    
    // Validate shipping settings
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid enabled value' },
        { status: 400 }
      );
    }

    if (typeof body.freeShippingThreshold !== 'number' || body.freeShippingThreshold < 0) {
      return NextResponse.json(
        { error: 'Invalid free shipping threshold' },
        { status: 400 }
      );
    }

    if (typeof body.domesticRate !== 'number' || body.domesticRate < 0) {
      return NextResponse.json(
        { error: 'Invalid domestic rate' },
        { status: 400 }
      );
    }

    if (typeof body.internationalRate !== 'number' || body.internationalRate < 0) {
      return NextResponse.json(
        { error: 'Invalid international rate' },
        { status: 400 }
      );
    }

    // Update seller shipping settings
    await prisma.seller.update({
      where: { email: session.user.email },
      data: {
        shippingSettings: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      message: 'Shipping settings updated successfully',
      settings: body,
    });
  } catch (error) {
    console.error('Error updating shipping settings:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping settings' },
      { status: 500 }
    );
  }
}