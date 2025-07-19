import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adoptions, users, payments, packages, locations, growthTracking, environmentalData } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting fix for missing adoptions...');

    // Find successful payments that don't have corresponding adoptions
    const successfulPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'success'));

    console.log(`Found ${successfulPayments.length} successful payments`);

    const results = [];

    for (const payment of successfulPayments) {
      try {
        // Check if adoption already exists
        const existingAdoption = await db
          .select()
          .from(adoptions)
          .where(eq(adoptions.paymentReferenceNo, payment.referenceNo))
          .limit(1);

        if (existingAdoption.length > 0) {
          console.log(`Adoption already exists for payment: ${payment.referenceNo}`);
          continue;
        }

        // Check if payment has required data
        if (!payment.packageType || !payment.locationId) {
          console.log(`Payment ${payment.referenceNo} missing packageType or locationId:`, {
            packageType: payment.packageType,
            locationId: payment.locationId
          });
          results.push({
            referenceNo: payment.referenceNo,
            status: 'skipped',
            reason: 'Missing packageType or locationId'
          });
          continue;
        }
        
        // Handle packageType as either ID or period name
        let packageId;
        if (typeof payment.packageType === 'string') {
          // First try to parse as package ID
          const parsedId = parseInt(payment.packageType);
          if (!isNaN(parsedId)) {
            // It's a numeric ID
            packageId = parsedId;
          } else {
            // It's a period name, find package by period
            const packageRecord = await db
              .select()
              .from(packages)
              .where(eq(packages.period, payment.packageType))
              .limit(1);
            
            if (packageRecord.length === 0) {
              console.log(`Payment ${payment.referenceNo} has unknown packageType: ${payment.packageType}`);
              results.push({
                referenceNo: payment.referenceNo,
                status: 'skipped',
                reason: 'Unknown packageType'
              });
              continue;
            }
            packageId = packageRecord[0].id;
          }
        } else {
          packageId = parseInt(payment.packageType);
          if (isNaN(packageId)) {
            console.log(`Payment ${payment.referenceNo} has invalid packageType: ${payment.packageType}`);
            results.push({
              referenceNo: payment.referenceNo,
              status: 'skipped',
              reason: 'Invalid packageType'
            });
            continue;
          }
        }

        const locationId = parseInt(payment.locationId);
        if (isNaN(locationId)) {
          console.log(`Payment ${payment.referenceNo} has invalid locationId: ${payment.locationId}`);
          results.push({
            referenceNo: payment.referenceNo,
            status: 'skipped',
            reason: 'Invalid locationId'
          });
          continue;
        }

        console.log(`Processing missing adoption for payment: ${payment.referenceNo}`);

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
          console.log(`Created new user record for: ${payment.customerEmail}`);
        }

        // Get package and location info
        const packageResults = await db
          .select()
          .from(packages)
          .where(eq(packages.id, packageId))
          .limit(1);

        const locationResults = await db
          .select()
          .from(locations)
          .where(eq(locations.id, locationId))
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
              adoptionDate: payment.paidDate || payment.createdAt,
              isActive: true,
            })
            .returning();

          const adoption = adoptionResults[0];
          console.log(`Created adoption: ${adoption.id} for payment: ${payment.referenceNo}`);

          // Update location current count
          await db
            .update(locations)
            .set({ 
              currentCount: (locationData.currentCount || 0) + 1,
              updatedAt: new Date()
            })
            .where(eq(locations.id, locationData.id));

          results.push({
            referenceNo: payment.referenceNo,
            status: 'created',
            adoptionId: adoption.id,
            userId: userRecord.id,
            packageId: packageData.id,
            locationId: locationData.id
          });
        } else {
          console.log(`Package or location not found for payment: ${payment.referenceNo}`);
          results.push({
            referenceNo: payment.referenceNo,
            status: 'error',
            reason: 'Package or location not found'
          });
        }
      } catch (error) {
        console.error(`Error processing payment ${payment.referenceNo}:`, error);
        results.push({
          referenceNo: payment.referenceNo,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Fix completed',
      totalProcessed: successfulPayments.length,
      results
    });

  } catch (error) {
    console.error('Fix missing adoptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}