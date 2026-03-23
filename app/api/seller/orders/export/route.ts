import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new();
    
    // Orders sheet
    const ordersSheet = XLSX.utils.json_to_sheet(data.orders || []);
    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');
    
    // Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet([data.summary]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Filters sheet
    const filtersSheet = XLSX.utils.json_to_sheet([data.filters]);
    XLSX.utils.book_append_sheet(workbook, filtersSheet, 'Filters');
    
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
        'Content-Disposition': 'attachment; filename="orders_export.xlsx"',
      },
    });
  } catch (error) {
    console.error('Orders export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate orders export' },
      { status: 500 }
    );
  }
}