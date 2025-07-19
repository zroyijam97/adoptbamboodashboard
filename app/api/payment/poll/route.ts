import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { paymentManager } from '@/lib/payment';
import { db } from '@/lib/db';
import { payments, adoptions, users, packages, locations, growthTracking, environmentalData } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Poll payment status and process adoption if payment is successful
 * This is an alternative to webhook callbacks for ToyyibPay sandbox
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { billCode, referenceNo } = body;

    if (!billCode || !referenceNo) {
      return NextResponse.json(
        { error: 'Missing billCode or referenceNo' },
        { status: 400 }
      );
    }

    console.log('Polling payment status for:', { billCode, referenceNo, userId });

    // Get payment status from ToyyibPay
    const paymentStatus = await paymentManager.getPaymentStatus('toyyibpay', billCode);
    console.log('Payment status from ToyyibPay:', paymentStatus);

    // Check if payment record exists and belongs to the user
    const paymentRecord = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.referenceNo, referenceNo),
          eq(payments.userId, userId)
        )
      )
      .limit(1);

    if (paymentRecord.length === 0) {
      return NextResponse.json(
        { error: 'Payment record not found or unauthorized' },
        { status: 404 }
      );
    }

    const payment = paymentRecord[0];

    // Update payment record with latest status
    await db
      .update(payments)
      .set({
        status: paymentStatus.status === 'success' ? 'success' : 
                paymentStatus.status === 'pending' ? 'pending' : 'failed',
        billCode,
        transactionId: paymentStatus.transactionId || null,
        paidAmount: (paymentStatus.amount || payment.amount).toString(),
        paidDate: paymentStatus.status === 'success' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(payments.referenceNo, referenceNo));

    console.log('Payment record updated for reference:', referenceNo);

    // If payment is successful, create adoption record
    if (paymentStatus.status === 'success') {
      console.log('Payment successful, checking if adoption already exists...');
      
      // Check if adoption already exists for this payment reference
      const existingAdoption = await db.select()
        .from(adoptions)
        .where(eq(adoptions.paymentReferenceNo, referenceNo))
        .limit(1);

      if (existingAdoption.length > 0) {
        console.log('Adoption already exists for this payment reference:', referenceNo);
        return NextResponse.json({ 
          success: true, 
          message: 'Payment processed, adoption already exists',
          adoption: existingAdoption[0]
        });
      }

      try {
        // Get user by Clerk ID or create if not exists
        let userRecord = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, payment.userId))
          .limit(1);

        let user;
        if (userRecord.length > 0) {
          user = userRecord[0];
          console.log('User record found:', { id: user.id, clerkId: user.clerkId });
        } else {
          // Create user if not exists
          console.log('User not found, creating new user for Clerk ID:', payment.userId);
          const newUserData = {
            clerkId: payment.userId,
            email: payment.customerEmail,
            firstName: payment.customerName?.split(' ')[0] || null,
            lastName: payment.customerName?.split(' ').slice(1).join(' ') || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          const newUserResult = await db
            .insert(users)
            .values([newUserData])
            .returning();
          
          user = newUserResult[0];
          console.log('New user created:', { id: user.id, clerkId: user.clerkId });
        }

        if (user) {
          // Get package info
          let packageInfo = null;
          if (payment.packageType) {
            let packageRecord = await db
              .select()
              .from(packages)
              .where(eq(packages.period, payment.packageType))
              .limit(1);
            
            if (packageRecord.length === 0 && !isNaN(parseInt(payment.packageType))) {
              packageRecord = await db
                .select()
                .from(packages)
                .where(eq(packages.id, parseInt(payment.packageType)))
                .limit(1);
            }
            
            if (packageRecord.length > 0) {
              packageInfo = packageRecord[0];
            }
          }

          // Get location info
          let locationInfo = null;
          if (payment.locationId) {
            let locationRecord = await db
              .select()
              .from(locations)
              .where(eq(locations.name, payment.locationId))
              .limit(1);
            
            if (locationRecord.length === 0 && !isNaN(parseInt(payment.locationId))) {
              locationRecord = await db
                .select()
                .from(locations)
                .where(eq(locations.id, parseInt(payment.locationId)))
                .limit(1);
            }
            
            if (locationRecord.length > 0) {
              locationInfo = locationRecord[0];
            }
          }

          // Create adoption record
          const adoptionData = {
            userId: user.id,
            bambooPlantId: 1,
            adoptionDate: new Date(),
            adoptionPrice: payment.amount.toString(),
            isActive: true,
            packageId: packageInfo?.id || null,
            packageName: packageInfo?.name || null,
            packagePrice: packageInfo?.price || null,
            packagePeriod: packageInfo?.period || null,
            packageFeatures: packageInfo?.features || null,
            locationId: locationInfo?.id || null,
            locationName: locationInfo?.name || payment.locationName || null,
            certificateIssued: false,
            paymentReferenceNo: referenceNo,
            createdAt: new Date(),
          };

          console.log('Creating adoption with data:', adoptionData);
          
          const newAdoption = await db
            .insert(adoptions)
            .values([adoptionData])
            .returning();

          console.log('Adoption record created successfully:', newAdoption[0]);

          // Update user's dashboard data
          await db
            .update(users)
            .set({ updatedAt: new Date() })
            .where(eq(users.id, user.id));

          // Update location's current count
          if (locationInfo?.id) {
            const currentCount = locationInfo.currentCount || 0;
            await db
              .update(locations)
              .set({
                currentCount: currentCount + 1,
                updatedAt: new Date(),
              })
              .where(eq(locations.id, locationInfo.id));
          }

          // Create initial growth tracking record
          await db
            .insert(growthTracking)
            .values([{
              bambooPlantId: 1,
              height: '0.50',
              diameter: '2.50',
              notes: 'Initial planting record',
              recordedBy: 'system',
              recordedDate: new Date(),
            }]);

          // Create initial environmental data record
          await db
            .insert(environmentalData)
            .values([{
              bambooPlantId: 1,
              soilMoisture: '65.00',
              soilPh: '6.5',
              temperature: '28.0',
              humidity: '75.00',
              sunlightHours: '6.00',
              rainfall: '0.00',
              recordedDate: new Date(),
            }]);

          return NextResponse.json({
            success: true,
            status: 'success',
            message: 'Payment successful, adoption created',
            adoptionId: newAdoption[0].id,
            paymentStatus
          });
        }
      } catch (adoptionError) {
        console.error('Error creating adoption record:', adoptionError);
        return NextResponse.json({
          success: false,
          status: 'error',
          message: 'Payment successful but failed to create adoption',
          error: adoptionError instanceof Error ? adoptionError.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Return current status
    return NextResponse.json({
      success: true,
      status: paymentStatus.status,
      message: `Payment status: ${paymentStatus.status}`,
      paymentStatus
    });

  } catch (error) {
    console.error('Payment polling error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Payment polling failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get current payment status without processing
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const billCode = searchParams.get('billCode');
    const referenceNo = searchParams.get('referenceNo');

    if (!billCode || !referenceNo) {
      return NextResponse.json(
        { error: 'Missing billCode or referenceNo' },
        { status: 400 }
      );
    }

    // Check if payment record exists and belongs to the user
    const paymentRecord = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.referenceNo, referenceNo),
          eq(payments.userId, userId)
        )
      )
      .limit(1);

    if (paymentRecord.length === 0) {
      return NextResponse.json(
        { error: 'Payment record not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get payment status from ToyyibPay
    const paymentStatus = await paymentManager.getPaymentStatus('toyyibpay', billCode);

    return NextResponse.json({
      success: true,
      paymentStatus,
      localStatus: paymentRecord[0].status
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}