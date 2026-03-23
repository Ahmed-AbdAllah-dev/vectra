

// app/api/seller/middleware.ts
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import  prisma  from '@/lib/prisma';

export async function verifySeller(request: NextRequest) {
  try {
    // Get token from request
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return {
        error: 'Unauthorized - No token found',
        status: 401
      };
    }

    if (!token.role || token.role !== 'seller') {
      return {
        error: 'Unauthorized - Seller access required',
        status: 403
      };
    }

    // Verify seller exists in database
    const seller = await prisma.seller.findUnique({
      where: { userId: parseInt(token.id) }
    });

    if (!seller) {
      return {
        error: 'Seller profile not found',
        status: 404
      };
    }

    return { 
      seller, 
      userId: parseInt(token.id), 
      sellerId: seller.id 
    };
  } catch (error) {
    console.error('Seller verification error:', error);
    return {
      error: 'Authentication failed',
      status: 500
    };
  }
}
