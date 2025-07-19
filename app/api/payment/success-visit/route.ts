import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, adoptions, users, packages, locations, growthTracking, environmentalData } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { paymentManager } from '@/lib/payment';

/**
 * API endpoint to track when user visits the payment success page
 * This serves as an additional indicator that payment was successful
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceNo, billCode, status } = body;

    console.log('Success page visit detected:', {
      referenceNo,
      billCode,
      status,
      timestamp: new Date().toISOString()
    });

    if (!referenceNo && !billCode) {
      return NextResponse.json(
        { error: 'Missing referenceNo or billCode' },
        { status: 400 }
      );
    }

    // Find the payment record
    let payment;
    if (referenceNo) {
      const paymentResults = await db
        .select()
        .from(payments)
        .where(eq(payments.referenceNo, referenceNo))
        .limit(1);
      payment = paymentResults[0];
    } else if (billCode) {
      const paymentResults = await db
        .select()
        .from(payments)
        .where(eq(payments.billCode, billCode))
        .limit(1);
      payment = paymentResults[0];
    }

    if (!payment) {
      console.log('Payment not found for success page visit:', { referenceNo, billCode });
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // If payment is already processed, no need to do anything
    if (payment.status === 'success') {
      console.log('Payment already processed:', payment.referenceNo);
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        payment
      });
    }

    // Check if user reached success page with status=1 (ToyyibPay success indicator)
    if (status === '1' || status === 1) {
      console.log('Success page visit with status=1, processing payment:', payment.referenceNo);
      
      try {
        // Verify payment status with ToyyibPay
        let paymentStatus = 'pending';
        if (payment.billCode) {
          const statusResult = await paymentManager.getPaymentStatus('toyyibpay', payment.billCode);
          paymentStatus = statusResult.status;
          console.log('Payment status from ToyyibPay:', statusResult);
        }

        // If ToyyibPay confirms success OR user reached success page with status=1
        if (paymentStatus === 'success' || status === '1' || status === 1) {
          // Update payment status
          await db
            .update(payments)
            .set({ 
              status: 'success',
              updatedAt: new Date()
            })
            .where(eq(payments.id, payment.id));

          console.log('Payment marked as successful:', payment.referenceNo);

          // Check if adoption already exists to prevent duplicates
          const existingAdoption = await db
            .select()
            .from(adoptions)
            .where(eq(adoptions.paymentReferenceNo, payment.referenceNo))
            .limit(1);

          if (existingAdoption.length > 0) {
            console.log('Adoption already exists for payment:', payment.referenceNo);
            return NextResponse.json({
              success: true,
              message: 'Payment processed and adoption already exists',
              payment: { ...payment, status: 'success' },
              adoption: existingAdoption[0]
            });
          }

          // Process adoption if payment has package and location info
          if (payment.packageType && payment.locationId) {
            console.log('Processing adoption for successful payment:', payment.referenceNo);

            // Get or create user record
            let userRecord;
            const existingUsers = await db
              .select()
              .from(users)
              .where(eq(users.clerkId, payment.userId))
              .limit(1);

            if (existingUsers.length > 0) {
              userRecord = existingUsers[0];
            } else {
              const newUsers = await db
                .insert(users)
                .values({
                  clerkId: payment.userId,
                  firstName: payment.customerName,
                  email: payment.customerEmail,
                  createdAt: new Date(),
                })
                .returning();
              userRecord = newUsers[0];
            }

            // Get package and location info
            const packageResults = await db
              .select()
              .from(packages)
              .where(eq(packages.id, parseInt(payment.packageType)))
              .limit(1);

            const locationResults = await db
              .select()
              .from(locations)
              .where(eq(locations.id, parseInt(payment.locationId)))
              .limit(1);

            if (packageResults.length > 0 && locationResults.length > 0) {
              const packageData = packageResults[0];
              const locationData = locationResults[0];

              // Create adoption record
              const adoptionResults = await db
                .insert(adoptions)
                .values({
                  userId: userRecord.id,
                  packageId: packageData.id,
                  locationId: locationData.id,
                  paymentReferenceNo: payment.referenceNo,
                  adoptionPrice: payment.amount,
                  adoptionDate: new Date(),
                  isActive: true,
                })
                .returning();

              const adoption = adoptionResults[0];
              console.log('Adoption created:', adoption);

              // Update location current count
              await db
                .update(locations)
                .set({ 
                  currentCount: (locationData.currentCount || 0) + 1,
                  updatedAt: new Date()
                })
                .where(eq(locations.id, locationData.id));

              // Create initial growth tracking record
              await db
                .insert(growthTracking)
                .values({
                  bambooPlantId: adoption.id, // Using adoption ID as plant ID for now
                  height: '0.10', // Initial height in meters
                  diameter: '2.0', // Initial diameter in cm
                  notes: 'Initial planting - healthy seedling',
                  recordedDate: new Date(),
                });

              // Create initial environmental data
              await db
                .insert(environmentalData)
                .values({
                  bambooPlantId: adoption.id, // Using adoption ID as plant ID for now
                  soilMoisture: '65.0', // Percentage
                  soilPh: '6.5', // pH level
                  temperature: '28.0', // Celsius
                  humidity: '75.0', // Percentage
                  sunlightHours: '6.0', // Hours per day
                  rainfall: '0.0', // mm
                  recordedDate: new Date(),
                });

              console.log('Adoption processing completed for payment:', payment.referenceNo);

              return NextResponse.json({
                success: true,
                message: 'Payment processed and adoption created successfully',
                payment: { ...payment, status: 'success' },
                adoption
              });
            } else {
              console.log('Package or location not found for adoption processing');
              return NextResponse.json({
                success: true,
                message: 'Payment processed but adoption creation failed - missing package/location data',
                payment: { ...payment, status: 'success' }
              });
            }
          } else {
            console.log('Payment processed but no package/location info for adoption');
            return NextResponse.json({
              success: true,
              message: 'Payment processed successfully',
              payment: { ...payment, status: 'success' }
            });
          }
        } else {
          console.log('Payment status not confirmed as successful:', paymentStatus);
          return NextResponse.json({
            success: false,
            message: 'Payment status not confirmed as successful',
            payment
          });
        }
      } catch (error) {
        console.error('Error processing payment from success page visit:', error);
        return NextResponse.json(
          { error: 'Failed to process payment' },
          { status: 500 }
        );
      }
    } else {
      console.log('Success page visit without success status:', { status, referenceNo, billCode });
      return NextResponse.json({
        success: false,
        message: 'Success page visited but payment not confirmed as successful',
        payment
      });
    }
  } catch (error) {
    console.error('Error in success page visit tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if a payment was processed via success page visit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceNo = searchParams.get('referenceNo');
    const billCode = searchParams.get('billCode');

    if (!referenceNo && !billCode) {
      return NextResponse.json(
        { error: 'Missing referenceNo or billCode parameter' },
        { status: 400 }
      );
    }

    // Find the payment record
    let payment;
    if (referenceNo) {
      const paymentResults = await db
        .select()
        .from(payments)
        .where(eq(payments.referenceNo, referenceNo))
        .limit(1);
      payment = paymentResults[0];
    } else if (billCode) {
      const paymentResults = await db
        .select()
        .from(payments)
        .where(eq(payments.billCode, billCode))
        .limit(1);
      payment = paymentResults[0];
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if adoption exists
    const adoption = await db
      .select()
      .from(adoptions)
      .where(eq(adoptions.paymentReferenceNo, payment.referenceNo))
      .limit(1);

    return NextResponse.json({
      success: true,
      payment,
      adoption: adoption[0] || null,
      processed: payment.status === 'success',
      adoptionCreated: adoption.length > 0
    });
  } catch (error) {
    console.error('Error checking success page visit status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}