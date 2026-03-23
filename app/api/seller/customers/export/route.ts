// app/api/seller/customers/export/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';
import  prisma  from '@/lib/prisma';


export async function POST(request: NextRequest) {
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

    // Get all buyers who have ordered from this seller
    const buyers = await prisma.buyer.findMany({
      where: {
        orders: {
          some: {
            sellerId: seller.id,
          },
        },
      },
      include: {
        user: true,
        ShippingAddress: true,
        orders: {
          where: {
            sellerId: seller.id,
          },
          select: {
            total: true,
            quantity: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        reviews: {
          select: {
            star: true,
          },
        },
      },
    });

    // Transform data for export
    const customers = buyers.map(buyer => {
      const totalOrders = buyer.orders.length;
      const totalSpent = buyer.orders.reduce((sum: number, o: any) => sum + o.total, 0);
      const averageRating = buyer.reviews.length > 0 
        ? buyer.reviews.reduce((sum: number, r: any) => sum + r.star, 0) / buyer.reviews.length 
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
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone || '',
        address: address,
        totalOrders,
        totalSpent,
        firstOrder: firstOrder.toISOString(),
        lastOrder: lastOrder.toISOString(),
        averageRating,
      };
    });

    // Calculate statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeCustomers = customers.filter(customer => 
      new Date(customer.lastOrder) >= thirtyDaysAgo
    ).length;

    const totalRevenue = customers.reduce((sum: number, customer: any) => sum + customer.totalSpent, 0);
    const totalOrdersCount = customers.reduce((sum: number, customer: any) => sum + customer.totalOrders, 0);
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    const stats = {
      totalCustomers: customers.length,
      activeCustomers,
      totalRevenue,
      averageOrderValue,
    };

    // Prepare export data
    const exportData = {
      customers: customers.map(customer => ({
        'Customer Name': customer.name,
        'Email': customer.email,
        'Phone': customer.phone,
        'Address': customer.address,
        'Total Orders': customer.totalOrders,
        'Total Spent': `$${customer.totalSpent.toFixed(2)}`,
        'Average Rating': customer.averageRating.toFixed(1),
        'First Order': new Date(customer.firstOrder).toLocaleDateString(),
        'Last Order': new Date(customer.lastOrder).toLocaleDateString(),
        'Customer Since': new Date(customer.firstOrder).toLocaleDateString(),
      })),
      summary: [
        {
          'Metric': 'Total Customers',
          'Value': stats.totalCustomers,
        },
        {
          'Metric': 'Active Customers (30 days)',
          'Value': stats.activeCustomers,
        },
        {
          'Metric': 'Total Revenue',
          'Value': `$${stats.totalRevenue.toFixed(2)}`,
        },
        {
          'Metric': 'Average Order Value',
          'Value': `$${stats.averageOrderValue.toFixed(2)}`,
        },
      ],
      exportDate: new Date().toISOString(),
    };

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Customers sheet
    const customersSheet = XLSX.utils.json_to_sheet(exportData.customers);
    XLSX.utils.book_append_sheet(workbook, customersSheet, 'Customers');
    
    // Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(exportData.summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Export info sheet
    const infoSheet = XLSX.utils.json_to_sheet([{
      'Exported By': seller.name,
      'Export Date': new Date().toLocaleDateString(),
      'Total Records': customers.length,
    }]);
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'Export Info');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
    });

    // Return file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="customers_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error exporting customers:', error);
    return NextResponse.json(
      { error: 'Failed to generate customers export' },
      { status: 500 }
    );
  }
}