// app/api/seller/orders/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { verifySeller } from '../../middleware';
import { subDays, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

// Helper function to safely serialize BigInt
function safeSerialize(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ));
}

export async function GET(request: NextRequest) {
  try {
    // Verify seller
    const auth = await verifySeller(request);
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { sellerId } = auth;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      case 'year':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subMonths(now, 1);
    }

    // Get basic order statistics
    const totalOrders = await prisma.order.count({
      where: {
        sellerId: sellerId,
        createdAt: { gte: startDate },
      },
    });

    const totalRevenue = await prisma.order.aggregate({
      where: {
        sellerId: sellerId,
        status: 'DELIVERED',
        createdAt: { gte: startDate },
      },
      _sum: { total: true },
    });

    const pendingOrders = await prisma.order.count({
      where: {
        sellerId: sellerId,
        status: 'PENDING',
        createdAt: { gte: startDate },
      },
    });

    const processingOrders = await prisma.order.count({
      where: {
        sellerId: sellerId,
        status: 'PROCESSING',
        createdAt: { gte: startDate },
      },
    });

    // Get daily revenue data for chart
    const dailyData = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*)::integer as order_count,
        COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0)::float as revenue
      FROM "Order"
      WHERE "sellerId" = ${sellerId}
        AND "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `;

    // Get top selling products
    const topProducts = await prisma.order.groupBy({
      by: ['productId'],
      where: {
        sellerId: sellerId,
        status: 'DELIVERED',
        createdAt: { gte: startDate },
      },
      _sum: {
        total: true,
        quantity: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: limit,
    });

    // Get product details for top products
    const productDetails = await Promise.all(
      topProducts.map(async (product: { productId: any; _sum: { total: any; quantity: any; }; _count: any; }) => {
        const productInfo = await prisma.product.findUnique({
          where: { id: product.productId! },
          select: {
            id: true,
            name: true,
            images: {
              take: 1,
              select: { url: true },
            },
          },
        });

        return {
          id: product.productId,
          name: productInfo?.name || 'Unknown Product',
          image: productInfo?.images[0]?.url,
          revenue: Number(product._sum.total || 0),
          orders: Number(product._count),
          quantity: Number(product._sum.quantity || 0),
        };
      })
    );

    // Get status distribution
    const statusDistribution = await prisma.order.groupBy({
      by: ['status'],
      where: {
        sellerId: sellerId,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Convert _count to number
    const statusDistributionWithNumbers = statusDistribution.map((status: { status: any; _count: any; }) => ({
      status: status.status,
      _count: Number(status._count)
    }));

    // Get monthly revenue for the last 12 months
    const monthlyRevenue = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0)::float as revenue,
        COUNT(*)::integer as order_count
      FROM "Order"
      WHERE "sellerId" = ${sellerId}
        AND "createdAt" >= ${subMonths(now, 12)}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY TO_CHAR("createdAt", 'YYYY-MM') ASC
    `;

    // Get category distribution
    const categoryDistribution = await prisma.$queryRaw`
      SELECT 
        p.category,
        COUNT(o.id)::integer as order_count,
        COALESCE(SUM(CASE WHEN o.status = 'DELIVERED' THEN o.total ELSE 0 END), 0)::float as revenue
      FROM "Order" o
      JOIN "Product" p ON o."productId" = p.id
      WHERE o."sellerId" = ${sellerId}
        AND o."createdAt" >= ${startDate}
      GROUP BY p.category
      ORDER BY revenue DESC
      LIMIT 10
    `;

    const responseData = {
      overview: {
        totalOrders: Number(totalOrders),
        totalRevenue: Number(totalRevenue._sum.total || 0),
        pendingOrders: Number(pendingOrders),
        processingOrders: Number(processingOrders),
        averageOrderValue: totalOrders > 0 ? Number(totalRevenue._sum.total || 0) / Number(totalOrders) : 0,
        conversionRate: 0, // This would need user/session data
      },
      charts: {
        dailyData: Array.isArray(dailyData) ? dailyData : [],
        monthlyRevenue: Array.isArray(monthlyRevenue) ? monthlyRevenue : [],
        categoryDistribution: Array.isArray(categoryDistribution) ? categoryDistribution : [],
        statusDistribution: statusDistributionWithNumbers,
      },
      topProducts: productDetails,
      timeRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
        range,
      },
    };

    // Use the safeSerialize function
    return NextResponse.json(safeSerialize(responseData));
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}