// app/api/seller/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';



export async function GET(request: NextRequest) {
  try {
    // Get the authenticated seller
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the seller
    const seller = await prisma.seller.findUnique({
      where: { email: session.user.email },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Get search and filter parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause for buyers
    const whereClause: any = {
      orders: {
        some: {
          sellerId: seller.id,
        },
      },
    };

    // Add search conditions if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get buyers with pagination and includes
    const [buyers, totalCount] = await Promise.all([
      prisma.buyer.findMany({
        where: whereClause,
        include: {
          user: true,
          ShippingAddress: true,
          orders: {
            where: {
              sellerId: seller.id,
            },
            select: {
              id: true,
              quantity: true,
              total: true,
              subtotal: true,
              createdAt: true,
              status: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          reviews: {
            select: {
              star: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.buyer.count({
        where: whereClause,
      }),
    ]);

    // Transform data for response
    const customers = buyers.map(buyer => {
      const totalOrders = buyer.orders.length;
      const totalSpent = buyer.orders.reduce((sum: number, order: any) => sum + order.total, 0);
      const averageRating = buyer.reviews.length > 0 
        ? buyer.reviews.reduce((sum: number, review: any) => sum + review.star, 0) / buyer.reviews.length 
        : 0;
      
      const firstOrder = buyer.orders.length > 0 
        ? buyer.orders[buyer.orders.length - 1]?.createdAt 
        : buyer.createdAt;
      
      const lastOrder = buyer.orders.length > 0 
        ? buyer.orders[0]?.createdAt 
        : buyer.createdAt;

      // Get address from shipping addresses
      const primaryAddress = buyer.ShippingAddress[0];
      const address = primaryAddress 
        ? `${primaryAddress.street}, ${primaryAddress.city}, ${primaryAddress.state} ${primaryAddress.zipCode}, ${primaryAddress.country}`
        : buyer.address || '';

      return {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone || '',
        address: address,
        totalOrders,
        totalSpent,
        firstOrder,
        lastOrder,
        averageRating,
      };
    });

    // Calculate statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeCustomers = buyers.filter(buyer => {
      const lastOrderDate = buyer.orders[0]?.createdAt;
      return lastOrderDate && new Date(lastOrderDate) >= thirtyDaysAgo;
    }).length;

    const totalRevenue = customers.reduce((sum: number, customer: any) => sum + customer.totalSpent, 0);
    const totalOrdersCount = customers.reduce((sum: number, customer: any) => sum + customer.totalOrders, 0);
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    const stats = {
      totalCustomers: customers.length,
      activeCustomers,
      totalRevenue,
      averageOrderValue,
    };

    return NextResponse.json({
      customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
      stats,
      filters: {
        search,
      },
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}