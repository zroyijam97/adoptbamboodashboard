import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { adoptions, users, payments, packages, locations, growthTracking, environmentalData } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Fixing adoptions for user:', clerkUserId);

    // Find successful payments for this user that don't have adoptions
    const successfulPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, clerkUserId),
          eq(payments.status, 'success')
        )
      );

    console.log(`Found ${successfulPayments.length} successful payments for user ${clerkUserId}`);

    if (successfulPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No successful payments found for this user',
        adoptionsCreated: 0
      });
    }

    // Get or create user record
    let userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    let user;
    if (userRecord.length > 0) {
      user = userRecord[0];
    } else {
      // Create user if not exists (shouldn't happen but just in case)
      const newUserData = {
        clerkId: clerkUserId,
        email: 'unknown@example.com', // Will be updated later
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const newUserResult = await db
        .insert(users)
        .values([newUserData])
        .returning();
      
      user = newUserResult[0];
    }

    const results = [];
    let adoptionsCreated = 0;

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
          results.push({
            referenceNo: payment.referenceNo,
            status: 'exists',
            message: 'Adoption already exists'
          });
          continue;
        }

        // Get package info
        let packageInfo = null;
        if (payment.packageType) {
          // Try to find package by period first
          let packageRecord = await db
            .select()
            .from(packages)
            .where(eq(packages.period, payment.packageType))
            .limit(1);
          
          // If not found by period, try to parse as ID
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
          // Try to find location by name first
          let locationRecord = await db
            .select()
            .from(locations)
            .where(eq(locations.name, payment.locationId))
            .limit(1);
          
          // If not found by name, try to parse as ID
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
          bambooPlantId: 1, // Default plant ID
          adoptionDate: new Date(),
          adoptionPrice: payment.amount,
          isActive: true,
          packageId: packageInfo?.id || null,
          packageName: packageInfo?.name || payment.packageType || null,
          packagePrice: packageInfo?.price || null,
          packagePeriod: packageInfo?.period || payment.packageType || null,
          packageFeatures: packageInfo?.features || null,
          locationId: locationInfo?.id || null,
          locationName: locationInfo?.name || payment.locationName || payment.locationId || null,
          certificateIssued: false,
          paymentReferenceNo: payment.referenceNo,
          createdAt: new Date(),
        };

        console.log('Creating adoption with data:', adoptionData);
        
        const newAdoption = await db
          .insert(adoptions)
          .values([adoptionData])
          .returning();

        console.log('Adoption created successfully:', newAdoption[0]);

        // Update location's current count if location exists
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
            notes: 'Initial planting record - created by fix',
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

        adoptionsCreated++;
        results.push({
          referenceNo: payment.referenceNo,
          status: 'created',
          adoptionId: newAdoption[0].id,
          message: 'Adoption created successfully'
        });

      } catch (error) {
        console.error(`Error creating adoption for payment ${payment.referenceNo}:`, error);
        results.push({
          referenceNo: payment.referenceNo,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${adoptionsCreated} missing adoptions for user ${clerkUserId}`,
      adoptionsCreated,
      totalPayments: successfulPayments.length,
      results
    });

  } catch (error) {
    console.error('Error fixing user adoptions:', error);
    return NextResponse.json(
      { error: 'Failed to fix user adoptions' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check successful payments vs adoptions for this user
    const successfulPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, clerkUserId),
          eq(payments.status, 'success')
        )
      );

    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    let userAdoptions: typeof adoptions.$inferSelect[] = [];
    if (userRecord.length > 0) {
      userAdoptions = await db
        .select()
        .from(adoptions)
        .where(eq(adoptions.userId, userRecord[0].id));
    }

    const missingAdoptions: string[] = [];
    for (const payment of successfulPayments) {
      const hasAdoption = userAdoptions.some(
        adoption => adoption.paymentReferenceNo === payment.referenceNo
      );
      if (!hasAdoption) {
        missingAdoptions.push(payment.referenceNo);
      }
    }

    return NextResponse.json({
      success: true,
      clerkUserId,
      databaseUserId: userRecord.length > 0 ? userRecord[0].id : null,
      successfulPayments: successfulPayments.length,
      existingAdoptions: userAdoptions.length,
      missingAdoptions: missingAdoptions.length,
      missingAdoptionRefs: missingAdoptions,
      needsFix: missingAdoptions.length > 0
    });

  } catch (error) {
    console.error('Error checking user adoptions:', error);
    return NextResponse.json(
      { error: 'Failed to check user adoptions' },
      { status: 500 }
    );
  }
}