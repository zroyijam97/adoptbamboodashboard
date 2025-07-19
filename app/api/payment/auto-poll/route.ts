import { NextRequest, NextResponse } from 'next/server';
import { paymentManager } from '@/lib/payment';
import { db } from '@/lib/db';
import { payments, adoptions, users, packages, locations, growthTracking, environmentalData } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// Auto-polling endpoint untuk memproses pembayaran pending secara automatik
export async function POST(request: NextRequest) {
  try {
    console.log('Starting auto-polling for pending payments...');

    // Dapatkan semua pembayaran yang masih pending
    const pendingPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'pending'))
      .limit(50); // Limit untuk mengelakkan overload

    console.log(`Found ${pendingPayments.length} pending payments`);

    const results = [];

    for (const payment of pendingPayments) {
      try {
        console.log(`Processing payment: ${payment.referenceNo}`);

        // Semak status pembayaran dari ToyyibPay
        const paymentStatus = await paymentManager.getPaymentStatus('toyyibpay', payment.billCode!);
        
        console.log(`Payment status for ${payment.referenceNo}:`, paymentStatus);

        // Update payment record dengan status terkini
        await db
          .update(payments)
          .set({
            status: paymentStatus.status === 'success' ? 'success' : 
                    paymentStatus.status === 'pending' ? 'pending' : 'failed',
            transactionId: paymentStatus.transactionId || null,
            paidAmount: (paymentStatus.amount || payment.amount).toString(),
            paidDate: paymentStatus.status === 'success' ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(payments.referenceNo, payment.referenceNo));

        // Jika pembayaran berjaya, proses adoption
        if (paymentStatus.status === 'success') {
          console.log(`Payment successful for ${payment.referenceNo}, processing adoption...`);

          // Semak jika adoption sudah wujud untuk payment reference ini
          const existingAdoption = await db.select()
            .from(adoptions)
            .where(eq(adoptions.paymentReferenceNo, payment.referenceNo))
            .limit(1);

          if (existingAdoption.length > 0) {
            console.log(`Adoption already exists for payment reference: ${payment.referenceNo}`);
            results.push({
              referenceNo: payment.referenceNo,
              status: 'already_processed',
              adoptionId: existingAdoption[0].id
            });
            continue;
          }

          // Dapatkan user info
          let user = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, payment.userId))
            .limit(1);

          if (user.length === 0) {
            // Cipta user baru jika tidak wujud
            const newUser = await db
              .insert(users)
              .values({
                clerkId: payment.userId,
                email: payment.customerEmail,
                firstName: payment.customerName.split(' ')[0] || payment.customerName,
                lastName: payment.customerName.split(' ').slice(1).join(' ') || null,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();
            user = newUser;
          }

          // Dapatkan package info
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

          // Dapatkan location info
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

          // Cipta adoption record
          const adoptionData = {
            userId: user[0].id,
            bambooPlantId: 1, // Default bamboo plant
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
            paymentReferenceNo: payment.referenceNo,
            createdAt: new Date(),
          };

          const newAdoption = await db
            .insert(adoptions)
            .values([adoptionData])
            .returning();

          console.log(`Adoption created successfully for ${payment.referenceNo}:`, newAdoption[0]);

          // Update location current count
          if (locationInfo) {
            await db
              .update(locations)
              .set({
                currentCount: (locationInfo.currentCount || 0) + 1,
                updatedAt: new Date(),
              })
              .where(eq(locations.id, locationInfo.id));
          }

          // Cipta initial growth tracking record
          await db.insert(growthTracking).values({
            bambooPlantId: 1,
            height: '0.1', // Initial height 10cm
            diameter: '0.5', // Initial diameter 0.5cm
            notes: 'Initial planting record - Auto-generated',
            recordedDate: new Date(),
            recordedBy: 'system-auto-poll',
          });

          // Cipta initial environmental data
          await db.insert(environmentalData).values({
            bambooPlantId: 1,
            soilMoisture: '65.0',
            soilPh: '6.5',
            temperature: '28.0',
            humidity: '75.0',
            sunlightHours: '6.5',
            rainfall: '0.0',
            recordedDate: new Date(),
          });

          results.push({
            referenceNo: payment.referenceNo,
            status: 'processed',
            adoptionId: newAdoption[0].id,
            userId: user[0].id
          });
        } else {
          results.push({
            referenceNo: payment.referenceNo,
            status: paymentStatus.status,
            message: 'Payment not yet successful'
          });
        }
      } catch (error) {
        console.error(`Error processing payment ${payment.referenceNo}:`, error);
        results.push({
          referenceNo: payment.referenceNo,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('Auto-polling completed. Results:', results);

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingPayments.length} pending payments`,
      results,
      processedCount: results.filter(r => r.status === 'processed').length,
      alreadyProcessedCount: results.filter(r => r.status === 'already_processed').length,
      errorCount: results.filter(r => r.status === 'error').length
    });

  } catch (error) {
    console.error('Auto-polling error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Auto-polling failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint untuk semak status auto-polling
export async function GET() {
  try {
    // Dapatkan statistik pembayaran
    const pendingCount = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'pending'));

    const successCount = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'success'));

    const adoptionCount = await db
      .select()
      .from(adoptions);

    return NextResponse.json({
      success: true,
      statistics: {
        pendingPayments: pendingCount.length,
        successfulPayments: successCount.length,
        totalAdoptions: adoptionCount.length,
        lastChecked: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting auto-poll statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get statistics'
      },
      { status: 500 }
    );
  }
}