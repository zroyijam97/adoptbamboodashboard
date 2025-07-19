import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, adoptions, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get all successful payments
    const successfulPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'success'))
      .orderBy(payments.createdAt);

    console.log(`Found ${successfulPayments.length} successful payments`);

    // Check which payments have corresponding adoptions
    const paymentAdoptionStatus = [];

    for (const payment of successfulPayments) {
      // Check if adoption exists for this payment
      const adoption = await db
        .select()
        .from(adoptions)
        .where(eq(adoptions.paymentReferenceNo, payment.referenceNo))
        .limit(1);

      // Get user info
      const user = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, payment.userId))
        .limit(1);

      paymentAdoptionStatus.push({
        payment: {
          id: payment.id,
          referenceNo: payment.referenceNo,
          amount: payment.amount,
          status: payment.status,
          userId: payment.userId,
          customerName: payment.customerName,
          customerEmail: payment.customerEmail,
          packageType: payment.packageType,
          locationId: payment.locationId,
          createdAt: payment.createdAt
        },
        user: user[0] || null,
        adoption: adoption[0] || null,
        hasAdoption: adoption.length > 0
      });
    }

    // Count statistics
    const totalSuccessfulPayments = successfulPayments.length;
    const paymentsWithAdoptions = paymentAdoptionStatus.filter(item => item.hasAdoption).length;
    const paymentsWithoutAdoptions = totalSuccessfulPayments - paymentsWithAdoptions;

    return NextResponse.json({
      success: true,
      statistics: {
        totalSuccessfulPayments,
        paymentsWithAdoptions,
        paymentsWithoutAdoptions
      },
      paymentAdoptionStatus,
      missingAdoptions: paymentAdoptionStatus.filter(item => !item.hasAdoption)
    });

  } catch (error) {
    console.error('Error checking payment-adoption status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check payment-adoption status' },
      { status: 500 }
    );
  }
}