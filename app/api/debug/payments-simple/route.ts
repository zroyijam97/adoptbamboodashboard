import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get all successful payments
    const successfulPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'success'));

    return NextResponse.json({
      success: true,
      count: successfulPayments.length,
      payments: successfulPayments.map(p => ({
        referenceNo: p.referenceNo,
        status: p.status,
        packageType: p.packageType,
        locationId: p.locationId,
        locationName: p.locationName,
        customerName: p.customerName,
        customerEmail: p.customerEmail,
        amount: p.amount,
        createdAt: p.createdAt,
        paidDate: p.paidDate
      }))
    });

  } catch (error) {
    console.error('Debug payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}