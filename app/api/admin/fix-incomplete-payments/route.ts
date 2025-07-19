import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, adoptions, users, packages, locations, growthTracking, environmentalData } from '@/lib/schema';
import { eq, and, notExists } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting fix for incomplete payments...');

    // Get successful payments without adoptions
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

    console.log(`Found ${successfulPaymentsWithoutAdoptions.length} payments without adoptions`);

    // Get default package and location for missing data
    const defaultPackage = await db
      .select()
      .from(packages)
      .limit(1);

    const defaultLocation = await db
      .select()
      .from(locations)
      .limit(1);

    if (defaultPackage.length === 0 || defaultLocation.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No default package or location found' },
        { status: 400 }
      );
    }

    const packageData = defaultPackage[0];
    const locationData = defaultLocation[0];

    let createdCount = 0;
    let updatedPaymentCount = 0;

    for (const payment of successfulPaymentsWithoutAdoptions) {
      console.log(`Processing payment: ${payment.referenceNo}`);

      // Update payment with missing package type and location ID if needed
      let needsUpdate = false;
      const updateData: any = {};

      if (!payment.packageType) {
        updateData.packageType = packageData.id.toString();
        needsUpdate = true;
      }

      if (!payment.locationId) {
        updateData.locationId = locationData.id.toString();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await db
          .update(payments)
          .set(updateData)
          .where(eq(payments.id, payment.id));
        
        updatedPaymentCount++;
        console.log(`Updated payment ${payment.referenceNo} with missing data`);
      }

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
            firstName: payment.customerName || 'User',
            email: payment.customerEmail || 'user@example.com',
            createdAt: new Date(),
          })
          .returning();
        userRecord = newUsers[0];
      }

      // Create adoption record with default or updated data
      const finalPackageId = payment.packageType || packageData.id.toString();
      const finalLocationId = payment.locationId || locationData.id.toString();

      const adoptionResults = await db
        .insert(adoptions)
        .values({
          userId: userRecord.id,
          packageId: parseInt(finalPackageId),
          locationId: parseInt(finalLocationId),
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
        .where(eq(locations.id, parseInt(finalLocationId)));

      // Note: Growth tracking and environmental data will be created separately
      // as they require bamboo_plants records which are managed differently

      createdCount++;
      console.log(`Successfully processed payment ${payment.referenceNo}`);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdCount} adoptions from incomplete payments`,
      totalPaymentsProcessed: successfulPaymentsWithoutAdoptions.length,
      totalAdoptionsCreated: createdCount,
      totalPaymentsUpdated: updatedPaymentCount,
      defaultPackageUsed: packageData.name,
      defaultLocationUsed: locationData.name
    });

  } catch (error) {
    console.error('Error fixing incomplete payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix incomplete payments' },
      { status: 500 }
    );
  }
}