import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';

export async function GET() {
  try {
    // Test database connection by querying users table
    const result = await db.select().from(users).limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}