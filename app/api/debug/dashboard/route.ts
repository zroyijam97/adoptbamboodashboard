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
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({
        success: true,
        debug: {
          clerkUserId,
          userFound: false,
          message: 'No user record found in database for this Clerk user'
        }
      });
    }

    const userId = userRecord[0].id;

    // Get all adoptions for this user (including inactive)
    const allAdoptions = await db
      .select()
      .from(adoptions)
      .where(eq(adoptions.userId, userId));

    // Get all payments for this user
    const allPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, clerkUserId));

    // Get successful payments
    const successfulPayments = allPayments.filter(p => p.status === 'success');

    return NextResponse.json({
      success: true,
      debug: {
        clerkUserId,
        databaseUserId: userId,
        userRecord: userRecord[0],
        totalAdoptions: allAdoptions.length,
        activeAdoptions: allAdoptions.filter(a => a.isActive).length,
        inactiveAdoptions: allAdoptions.filter(a => !a.isActive).length,
        adoptions: allAdoptions,
        totalPayments: allPayments.length,
        successfulPayments: successfulPayments.length,
        pendingPayments: allPayments.filter(p => p.status === 'pending').length,
        failedPayments: allPayments.filter(p => p.status === 'failed').length,
        payments: allPayments,
        successfulPaymentsList: successfulPayments
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: 'Debug failed', details: error },
      { status: 500 }
    );
  }
}