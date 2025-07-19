import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, adoptions, users, packages, locations, growthTracking, environmentalData } from '@/lib/schema';
import { eq, and, notExists } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting fix for missing adoptions v2...');

    // Find successful payments that don't have corresponding adoptions
    const successfulPaymentsWithoutAdoptions = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'success'),
          notExists(
            db.select().from(adoptions).where(
              eq(adoptions.paymentReferenceNo, payments.referenceNo)
            )
          )
        )
      )
      .orderBy(payments.createdAt);

    console.log(`Found ${successfulPaymentsWithoutAdoptions.length} successful payments without adoptions`);

    let createdCount = 0;

    for (const payment of successfulPaymentsWithoutAdoptions) {
      console.log(`Processing payment: ${payment.referenceNo}`);

      // Get or create user record
      let userRecord;
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, payment.userId))
        .limit(1);

      if (existingUsers.length > 0) {
        userRecord = existingUsers[0];
        console.log(`Found existing user: ${userRecord.id}`);
      } else {
        const newUsers = await db
          .insert(users)
          .values({
            clerkId: payment.userId,
            firstName: payment.customerName || 'User',
            email: payment.customerEmail,
            createdAt: new Date(),
          })
          .returning();
        userRecord = newUsers[0];
        console.log(`Created new user: ${userRecord.id}`);
      }

      // Get package and location info
      if (payment.packageType && payment.locationId) {
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
              adoptionDate: payment.createdAt || new Date(),
              isActive: true,
              packageName: packageData.name,
              packagePrice: packageData.price,
              packagePeriod: packageData.period,
              packageFeatures: packageData.features,
              locationName: locationData.name
            })
            .returning();

          const adoption = adoptionResults[0];
          console.log(`Created adoption: ${adoption.id} for payment: ${payment.referenceNo}`);

          // Update location current count
          await db
            .update(locations)
            .set({ 
              currentCount: (locationData.currentCount || 0) + 1
            })
            .where(eq(locations.id, locationData.id));

          // Create initial growth tracking record
          await db
            .insert(growthTracking)
            .values({
              bambooPlantId: adoption.id,
              height: '0.10',
              diameter: '2.0',
              notes: 'Initial planting - healthy seedling',
              recordedDate: payment.createdAt || new Date(),
            });

          // Create initial environmental data
          await db
            .insert(environmentalData)
            .values({
              bambooPlantId: adoption.id,
              soilMoisture: '65.0',
              soilPh: '6.5',
              temperature: '28.0',
              humidity: '75.0',
              sunlightHours: '6.0',
              rainfall: '0.0',
              recordedDate: payment.createdAt || new Date(),
            });

          createdCount++;
          console.log(`Successfully processed payment ${payment.referenceNo}`);
        } else {
          console.log(`Skipped payment ${payment.referenceNo}: package or location not found`);
        }
      } else {
        console.log(`Skipped payment ${payment.referenceNo}: missing package type or location ID`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdCount} missing adoptions`,
      totalPaymentsWithoutAdoptions: successfulPaymentsWithoutAdoptions.length,
      totalCreated: createdCount
    });

  } catch (error) {
    console.error('Error fixing missing adoptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix missing adoptions' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get successful payments without adoptions for inspection
    const successfulPaymentsWithoutAdoptions = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'success'),
          notExists(
            db.select().from(adoptions).where(
              eq(adoptions.paymentReferenceNo, payments.referenceNo)
            )
          )
        )
      )
      .orderBy(payments.createdAt);

    return NextResponse.json({
      success: true,
      data: successfulPaymentsWithoutAdoptions,
      count: successfulPaymentsWithoutAdoptions.length
    });

  } catch (error) {
    console.error('Error getting missing adoptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get missing adoptions' },
      { status: 500 }
    );
  }
}