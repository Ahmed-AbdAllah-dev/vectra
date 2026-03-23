
// app/api/seller/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { verifySeller } from '../../middleware';

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

    // Get products count and stock
    const products = await prisma.product.findMany({
      where: { sellerId: sellerId },
      include: {
        variants: true,
      },
    });

    let totalStock = 0;
    let outOfStockVariants = 0;
    let lowStockVariants = 0; // Less than 10 items

    products.forEach((product: any) => {
      product.variants.forEach((variant: any) => {
        totalStock += variant.currentStock;
        if (variant.currentStock === 0) {
          outOfStockVariants++;
        } else if (variant.currentStock < 10) {
          lowStockVariants++;
        }
      });
    });

    // Get orders and revenue
    const orders = await prisma.order.findMany({
      where: {
        sellerId: sellerId,
        status: 'DELIVERED',
      },
      include: {
        variant: true,
      },
    });

    // Calculate metrics
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;

    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = orders.filter(
      (order: any) => new Date(order.createdAt) >= thirtyDaysAgo
    );
    const recentRevenue = recentOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

    // Monthly revenue for chart
    const monthlyRevenue: Record<string, number> = {};
    orders.forEach((order: any) => {
      const month = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (order.total || 0);
    });

    // Get top selling products
    const productSales: Record<number, { revenue: number; quantity: number; product: any }> = {};
    
    orders.forEach((order: any) => {
      if (order.productId) {
        if (!productSales[order.productId]) {
          productSales[order.productId] = {
            revenue: 0,
            quantity: 0,
            product: products.find((p: any) => p.id === order.productId),
          };
        }
        productSales[order.productId].revenue += order.total || 0;
        productSales[order.productId].quantity += order.quantity;
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get reviews and rating
    const reviews = await prisma.review.findMany({
      where: {
        product: {
          sellerId: sellerId,
        },
      },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, review: any) => sum + review.star, 0) / reviews.length
      : 0;

    // Get pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        sellerId: sellerId,
        status: {
          not: 'DELIVERED',
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalProducts: products.length,
        totalVariants: products.reduce((sum: number, p: any) => sum + p.variants.length, 0),
        totalStock,
        outOfStockVariants,
        lowStockVariants,
      },
      sales: {
        totalRevenue,
        totalOrders,
        recentRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        pendingOrders,
      },
      performance: {
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews: reviews.length,
        fulfillmentRate: totalOrders > 0 
          ? ((orders.filter((o: any) => o.status === 'DELIVERED').length / totalOrders) * 100).toFixed(1)
          : 0,
      },
      charts: {
        monthlyRevenue: Object.entries(monthlyRevenue)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12), // Last 12 months
      },
      topProducts: topProducts.map((item: any) => ({
        id: item.product?.id,
        name: item.product?.name || 'Unknown Product',
        revenue: item.revenue,
        quantity: item.quantity,
        image: item.product?.images?.[0]?.url,
      })),
      recentActivity: {
        lastOrder: orders[0] ? {
          id: orders[0].id,
          total: orders[0].total,
          date: orders[0].createdAt,
          status: orders[0].status,
        } : null,
        pendingOrdersCount: pendingOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
