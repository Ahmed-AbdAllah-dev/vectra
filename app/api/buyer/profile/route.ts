import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import  prisma  from '@/lib/prisma';

// Complete parseAddress function for GET /api/buyer/profile
const parseAddress = (addressString: string | null, buyerName: string, buyerPhone: string = '') => {
  if (!addressString) return [];
  
  // Try to parse as JSON first (more reliable)
  try {
    const addressData = JSON.parse(addressString);
    return [{
      id: 1,
      type: 'Home',
      isDefault: true,
      fullName: buyerName,
      street: addressData.street || '',
      city: addressData.city || '',
      state: addressData.state || '',
      zipCode: addressData.zipCode || '',
      country: addressData.country || 'USA',
      phone: buyerPhone
    }];
  } catch {
    // If not JSON, parse as comma-separated string format: "street, city, state zipcode, country"
    const parts = addressString.split(',').map(part => part.trim());
    
    let parsedAddress = {
      id: 1,
      type: 'Home',
      isDefault: true,
      fullName: buyerName,
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      phone: buyerPhone
    };

    if (parts.length >= 1) {
      parsedAddress.street = parts[0];
    }
    
    if (parts.length >= 2) {
      parsedAddress.city = parts[1];
    }
    
    // Parse "state zipcode" part (usually parts[2])
    if (parts.length >= 3) {
      const stateZipPart = parts[2].trim();
      
      // Enhanced pattern matching for state and zip code
      // Handles formats like: "NY 10001", "New York 10001", "CA", "California"
      const stateZipMatch = stateZipPart.match(/^([A-Za-z\s]+?)\s*(\d{5}(?:-\d{4})?)?$/);
      
      if (stateZipMatch) {
        const statePart = stateZipMatch[1].trim();
        const zipPart = stateZipMatch[2] || '';
        
        parsedAddress.state = statePart;
        parsedAddress.zipCode = zipPart;
      } else {
        // If no pattern match, check if it's just a zip code
        const isZipOnly = /^\d{5}(-\d{4})?$/.test(stateZipPart);
        if (isZipOnly) {
          parsedAddress.zipCode = stateZipPart;
        } else {
          // Otherwise, assume it's a state without zip code
          parsedAddress.state = stateZipPart;
        }
      }
    }
    
    // Country is the last part
    if (parts.length >= 4) {
      parsedAddress.country = parts[3];
    }

    // If we have a state+zip in one field but they're separated, try to split them
    if (parsedAddress.state && !parsedAddress.zipCode) {
      const stateZipSplit = parsedAddress.state.split(/\s+/);
      if (stateZipSplit.length >= 2) {
        const lastPart = stateZipSplit[stateZipSplit.length - 1];
        if (/^\d{5}(-\d{4})?$/.test(lastPart)) {
          parsedAddress.zipCode = lastPart;
          parsedAddress.state = stateZipSplit.slice(0, -1).join(' ').trim();
        }
      }
    }

    return [parsedAddress];
  }
};
// GET /api/buyer/profile - Fetch buyer data
// GET /api/buyer/profile - Fetch buyer data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyer = await prisma.buyer.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        profileImage: true,
        createdAt: true,
        orders: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: {
                      where: { isPrimary: true },
                      take: 1
                    }
                  }
                }
              }
            }
          }
        },
        reviews: {
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse address using the complete function
    const addresses = parseAddress(buyer.address, buyer.name, buyer.phone || '');

    const profileData = {
      id: buyer.id,
      name: buyer.name,
      email: buyer.email,
      phone: buyer.phone || '',
      avatar: buyer.profileImage ||`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(buyer.name)}`,
      memberSince: buyer.createdAt.toISOString().split('T')[0],
      addresses: addresses,
      recentOrders: buyer.orders.map((order, index) => ({
        id: order.id,
        date: order.createdAt.toISOString().split('T')[0],
        status: order.status,
        total: order.total,
        items: order.quantity,
        image: order.variant?.product.images[0]?.url || `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop&${index}`
      })),
      stats: {
        totalOrders: buyer.orders.length,
        totalReviews: buyer.reviews.length,
        totalSpent: buyer.orders.reduce((sum, order) => sum + order.total, 0)
      }
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/buyer/profile - Update profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const updatedBuyer = await prisma.buyer.update({
      where: { email: session.user.email },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      buyer: updatedBuyer
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}