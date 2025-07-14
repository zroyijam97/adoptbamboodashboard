import { NextRequest, NextResponse } from 'next/server';
import { paymentManager } from '@/lib/payment';
import { db } from '@/lib/db';
import { adoptions, users, packages, locations, payments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Get callback data from ToyyibPay
    const formData = await request.formData();
    const billCode = formData.get('billcode') as string;
    const status = formData.get('status_id') as string;
    const amount = formData.get('amount') as string;
    const transactionId = formData.get('transaction_id') as string;
    const referenceNo = formData.get('order_id') as string;

    console.log('Payment callback received:', {
      billCode,
      status,
      amount,
      transactionId,
      referenceNo,
    });

    if (!billCode) {
      return NextResponse.json(
        { error: 'Missing bill code' },
        { status: 400 }
      );
    }

    // Get payment status from ToyyibPay
    const paymentStatus = await paymentManager.getPaymentStatus('toyyibpay', billCode);

    console.log('Payment status from ToyyibPay:', paymentStatus);

    // Update payment record
    try {
      await db
        .update(payments)
        .set({
          status: paymentStatus.status === 'success' ? 'success' : 'failed',
          billCode,
          transactionId,
          paidAmount: amount,
          paidDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.referenceNo, referenceNo));

      console.log('Payment record updated for reference:', referenceNo);
    } catch (updateError) {
      console.error('Error updating payment record:', updateError);
    }

    // If payment is successful, create adoption record
    if (paymentStatus.status === 'success' && status === '1') {
      try {
        // Get payment record with package and location info
        const paymentRecord = await db
          .select()
          .from(payments)
          .where(eq(payments.referenceNo, referenceNo))
          .limit(1);

        if (paymentRecord.length > 0) {
          const payment = paymentRecord[0];
          
          // Get user by Clerk ID
          const userRecord = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, payment.userId))
            .limit(1);

          if (userRecord.length > 0) {
            const user = userRecord[0];
            
            // Get package info
            let packageInfo = null;
            if (payment.packageType) {
              const packageRecord = await db
                .select()
                .from(packages)
                .where(eq(packages.id, parseInt(payment.packageType)))
                .limit(1);
              
              if (packageRecord.length > 0) {
                packageInfo = packageRecord[0];
              }
            }

            // Get location info
            let locationInfo = null;
            if (payment.locationId) {
              const locationRecord = await db
                .select()
                .from(locations)
                .where(eq(locations.id, parseInt(payment.locationId)))
                .limit(1);
              
              if (locationRecord.length > 0) {
                locationInfo = locationRecord[0];
              }
            }

            // Create adoption record with package information
            const adoptionData = {
              userId: user.id,
              bambooPlantId: 1, // Default plant ID - you might want to create a new plant or use a different approach
              adoptionDate: new Date(),
              adoptionPrice: amount,
              isActive: true,
              packageId: packageInfo?.id || null,
              packageName: packageInfo?.name || null,
              packagePrice: packageInfo?.price || null,
              packagePeriod: packageInfo?.period || null,
              packageFeatures: packageInfo?.features || null,
              locationId: locationInfo?.id || null,
              locationName: locationInfo?.name || payment.locationName || null,
            };

            const newAdoption = await db
              .insert(adoptions)
              .values(adoptionData)
              .returning();

            console.log('Adoption record created:', newAdoption[0]);
          }
        }
      } catch (adoptionError) {
        console.error('Error creating adoption record:', adoptionError);
        // Don't fail the callback if adoption creation fails
      }
    }

    console.log('Payment callback processed successfully');

    // Respond to ToyyibPay
    return NextResponse.json({ 
      success: true,
      message: 'Callback processed successfully' 
    });

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const billCode = searchParams.get('billcode');

  if (!billCode) {
    return NextResponse.json(
      { error: 'Missing bill code' },
      { status: 400 }
    );
  }

  try {
    const paymentStatus = await paymentManager.getPaymentStatus('toyyibpay', billCode);
    return NextResponse.json(paymentStatus);
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}