// app/api/seller/orders/pending-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { verifySeller } from '../../middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifySeller(request);
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { sellerId } = auth;

    // Count orders that are still pending (or whichever status you consider "new")
    const count = await prisma.order.count({
      where: {
        sellerId: sellerId,
        status: 'PENDING', // You can change this to specific logic if needed
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch count' },
      { status: 500 }
    );
  }
}