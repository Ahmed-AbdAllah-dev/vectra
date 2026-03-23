import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import  prisma  from '@/lib/prisma';



// Helper function to parse address string into components
function parseAddressString(addressString: string, buyerName: string, buyerPhone: string) {
  // Format: "street, city, state zipcode, country"
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
    phone: buyerPhone || ''
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
    // Try to match pattern: "state zipcode" where zipcode is digits
    const stateZipMatch = stateZipPart.match(/^(.+?)\s+(\d+)$/);
    
    if (stateZipMatch) {
      parsedAddress.state = stateZipMatch[1].trim();
      parsedAddress.zipCode = stateZipMatch[2];
    } else {
      // If no zipcode found, put everything in state
      parsedAddress.state = stateZipPart;
    }
  }
  
  // Country is the last part
  if (parts.length >= 4) {
    parsedAddress.country = parts[3];
  }

  return parsedAddress;
}

// POST /api/buyer/address - Add/edit address
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { street, city, state, zipCode, country } = body;
    const addressData = {
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim()
    };
    // Validate required fields
    if (!street?.trim()) {
      return NextResponse.json(
        { error: 'Street address is required' },
        { status: 400 }
      );
    }

    if (!city?.trim()) {
      return NextResponse.json(
        { error: 'City is required' },
        { status: 400 }
      );
    }

    // Create address string in consistent format: "street, city, state zipcode, country"
    const addressParts = [
      street.trim(),
      city.trim(),
      `${state.trim()} ${zipCode.trim()}`.trim(),
      country.trim()
    ];
    
    const addressString = addressParts.join(', ');

    const updatedBuyer = await prisma.buyer.update({
      where: { email: session.user.email },
      data: {
        address: JSON.stringify(addressData)
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true
      }
    });

    // Return formatted address for frontend
    const formattedAddress = {
      id: 1,
      type: 'Home',
      isDefault: true,
      fullName: updatedBuyer.name,
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim(),
      phone: updatedBuyer.phone || ''
    };

    return NextResponse.json({
      message: 'Address saved successfully',
      address: formattedAddress
    });
  } catch (error) {
    console.error('Address save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/buyer/address - Get current address
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyer = await prisma.buyer.findUnique({
      where: { email: session.user.email },
      select: {
        address: true,
        phone: true,
        name: true
      }
    });

    if (!buyer || !buyer.address) {
      return NextResponse.json({ address: null });
    }

    // Parse the address string using helper function
    const formattedAddress = parseAddressString(
      buyer.address,
      buyer.name,
      buyer.phone || ''
    );

    return NextResponse.json({ address: formattedAddress });
  } catch (error) {
    console.error('Address fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}