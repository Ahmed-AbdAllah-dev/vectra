import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new();
    
    // Product sheet
    const productSheet = XLSX.utils.json_to_sheet([data.product]);
    XLSX.utils.book_append_sheet(workbook, productSheet, 'Product');
    
    // Variants sheet
    const variantsSheet = XLSX.utils.json_to_sheet(data.variants);
    XLSX.utils.book_append_sheet(workbook, variantsSheet, 'Variants');
    
    // Metrics sheet
    const metricsSheet = XLSX.utils.json_to_sheet([data.metrics]);
    XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');
    
    // Reviews sheet
    const reviewsSheet = XLSX.utils.json_to_sheet(data.reviews);
    XLSX.utils.book_append_sheet(workbook, reviewsSheet, 'Reviews');
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Return file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="product_export.xlsx"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}