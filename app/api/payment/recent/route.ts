import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments } from '@/lib/schema';
import { desc } from 'drizzle-orm';

/**
 * GET endpoint to fetch recent payments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;

    // Fetch recent payments
    const recentPayments = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(Math.min(limit, 50)); // Cap at 50 for performance

    return NextResponse.json({
      success: true,
      payments: recentPayments
    });
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent payments' },
      { status: 500 }
    );
  }
}