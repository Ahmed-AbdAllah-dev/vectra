import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new();
    
    // Overview sheet
    const overviewSheet = XLSX.utils.json_to_sheet([data.overview]);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
    
    // Monthly Revenue sheet
    const monthlyRevenueSheet = XLSX.utils.json_to_sheet(data.charts.monthlyRevenue || []);
    XLSX.utils.book_append_sheet(workbook, monthlyRevenueSheet, 'Monthly Revenue');
    
    // Category Distribution sheet
    const categorySheet = XLSX.utils.json_to_sheet(data.charts.categoryDistribution || []);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categories');
    
    // Status Distribution sheet
    const statusSheet = XLSX.utils.json_to_sheet(data.charts.statusDistribution || []);
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'Order Status');
    
    // Top Products sheet
    const topProductsSheet = XLSX.utils.json_to_sheet(data.topProducts || []);
    XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Top Products');
    
    // Time Range sheet
    const timeRangeSheet = XLSX.utils.json_to_sheet([data.timeRange]);
    XLSX.utils.book_append_sheet(workbook, timeRangeSheet, 'Time Range');
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false
    } as XLSX.WritingOptions);
    
    // Return file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="analytics_export.xlsx"',
      },
    });
  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics export' },
      { status: 500 }
    );
  }
}