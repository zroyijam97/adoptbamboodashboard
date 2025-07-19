import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adoptions, users, payments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceNo = searchParams.get('ref') || 'BAMBOO1752843051235729';

    // Get specific payment
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.referenceNo, referenceNo))
      .limit(1);

    if (payment.length === 0) {
      return NextResponse.json({
        error: 'Payment not found',
        referenceNo
      });
    }

    const paymentRecord = payment[0];

    // Get user record if exists
    let userRecord = null;
    if (paymentRecord.userId) {
      const users_result = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, paymentRecord.userId))
        .limit(1);
      
      if (users_result.length > 0) {
        userRecord = users_result[0];
      }
    }

    // Get adoption record if exists
    let adoptionRecord = null;
    if (userRecord) {
      const adoption_result = await db
        .select()
        .from(adoptions)
        .where(eq(adoptions.paymentReferenceNo, referenceNo))
        .limit(1);
      
      if (adoption_result.length > 0) {
        adoptionRecord = adoption_result[0];
      }
    }

    return NextResponse.json({
      debug: {
        referenceNo,
        payment: paymentRecord,
        userRecord,
        adoptionRecord,
        analysis: {
          paymentStatus: paymentRecord.status,
          hasUser: !!userRecord,
          hasAdoption: !!adoptionRecord,
          shouldHaveAdoption: paymentRecord.status === 'success' && paymentRecord.packageType && paymentRecord.locationId,
          missingAdoption: paymentRecord.status === 'success' && paymentRecord.packageType && paymentRecord.locationId && !adoptionRecord
        }
      }
    });

  } catch (error) {
    console.error('Debug payment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}