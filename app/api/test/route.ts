import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    // Try to count users (table might not exist yet)
    let userCount = 0
    try {
      userCount = await prisma.user.count()
    } catch {
      // Table doesn't exist yet
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      test: result,
      userCount,
      prismaInitialized: !!prisma
    })
  } catch (error: any) {
    console.error('Database test failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    }, { status: 500 })
  }
}