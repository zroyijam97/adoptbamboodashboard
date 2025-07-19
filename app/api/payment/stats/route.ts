import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, adoptions } from '@/lib/schema';
import { eq, count, sql } from 'drizzle-orm';

/**
 * GET endpoint to fetch payment statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get payment statistics
    const paymentStats = await db
      .select({
        status: payments.status,
        count: count()
      })
      .from(payments)
      .groupBy(payments.status);

    // Get total adoptions count
    const adoptionCount = await db
      .select({ count: count() })
      .from(adoptions);

    // Calculate statistics
    let totalPayments = 0;
    let successfulPayments = 0;
    let pendingPayments = 0;
    let failedPayments = 0;

    paymentStats.forEach(stat => {
      totalPayments += stat.count;
      switch (stat.status) {
        case 'success':
          successfulPayments = stat.count;
          break;
        case 'pending':
          pendingPayments = stat.count;
          break;
        case 'failed':
          failedPayments = stat.count;
          break;
      }
    });

    const adoptionsCreated = adoptionCount[0]?.count || 0;
    
    // For success page detections, we'll count successful payments as proxy
    // In a real implementation, you might want to track this separately
    const successPageDetections = successfulPayments;

    return NextResponse.json({
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      adoptionsCreated,
      successPageDetections
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment statistics' },
      { status: 500 }
    );
  }
}