import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { adoptions, users, payments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user record from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({
        error: 'User not found in database',
        clerkUserId,
        userRecord: null
      });
    }

    const dbUserId = userRecord[0].id;

    // Get all payments for this user
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, clerkUserId));

    // Get all adoptions for this user
    const userAdoptions = await db
      .select()
      .from(adoptions)
      .where(eq(adoptions.userId, dbUserId));

    // Get successful payments
    const successfulPayments = userPayments.filter(p => p.status === 'success');

    return NextResponse.json({
      debug: {
        clerkUserId,
        dbUserId,
        userRecord: userRecord[0],
        totalPayments: userPayments.length,
        successfulPayments: successfulPayments.length,
        totalAdoptions: userAdoptions.length,
        payments: userPayments.map(p => ({
          referenceNo: p.referenceNo,
          status: p.status,
          amount: p.amount,
          packageType: p.packageType,
          locationId: p.locationId,
          createdAt: p.createdAt
        })),
        adoptions: userAdoptions.map(a => ({
          id: a.id,
          userId: a.userId,
          packageId: a.packageId,
          locationId: a.locationId,
          paymentReferenceNo: a.paymentReferenceNo,
          isActive: a.isActive,
          adoptionDate: a.adoptionDate
        })),
        successfulPaymentsDetails: successfulPayments.map(p => ({
          referenceNo: p.referenceNo,
          packageType: p.packageType,
          locationId: p.locationId,
          hasAdoption: userAdoptions.some(a => a.paymentReferenceNo === p.referenceNo)
        }))
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}