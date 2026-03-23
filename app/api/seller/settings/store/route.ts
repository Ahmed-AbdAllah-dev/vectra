// app/api/seller/settings/store/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import  prisma  from '@/lib/prisma';


// Updated StoreSettings interface
interface StoreSettings {
  storeName: string;      // Maps to seller.name
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
 
  // Removed: currency, timezone, dateFormat
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

    // Get seller based on user email
    const seller = await prisma.seller.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,          // Used as store name
        email: true,
        phone: true,
        address: true,
        
        // Removed: currency, timezone, dateFormat
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Format the response to match frontend structure
    const storeSettings: StoreSettings = {
      storeName: seller.name,              // Use name as store name
      storeEmail: seller.email,
      storePhone: seller.phone || '',
      storeAddress: seller.address || '',
      
      // Removed: currency, timezone, dateFormat
    };

    return NextResponse.json(storeSettings);
  } catch (error) {
    console.error('Error fetching store settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store settings' },
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

    const body = await request.json() as StoreSettings;
    
    // Validate required fields
    if (!body.storeName || !body.storeEmail) {
      return NextResponse.json(
        { error: 'Store name and email are required' },
        { status: 400 }
      );
    }

    // Update seller store settings
    const updatedSeller = await prisma.seller.update({
      where: { email: session.user.email },
      data: {
        name: body.storeName,          // Store name goes into name field
        email: body.storeEmail,
        phone: body.storePhone || null,
        address: body.storeAddress || null,
        
        // Removed: currency, timezone, dateFormat
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        
        // Removed: currency, timezone, dateFormat
      },
    });

    // Format the response
    const storeSettings: StoreSettings = {
      storeName: updatedSeller.name,
      storeEmail: updatedSeller.email,
      storePhone: updatedSeller.phone || '',
      storeAddress: updatedSeller.address || '',
    
      // Removed: currency, timezone, dateFormat
    };

    return NextResponse.json({
      message: 'Store settings updated successfully',
      settings: storeSettings,
    });
  } catch (error) {
    console.error('Error updating store settings:', error);
    
    // Handle specific error cases
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update store settings' },
      { status: 500 }
    );
  }
}