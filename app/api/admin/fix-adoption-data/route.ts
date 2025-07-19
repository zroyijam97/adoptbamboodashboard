import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adoptions, packages, locations } from '@/lib/schema';
import { eq, isNull, or } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting fix for adoption data...');

    // Find adoptions with missing package or location data
    const adoptionsWithMissingData = await db
      .select({
        adoption: adoptions,
        package: packages,
        location: locations,
      })
      .from(adoptions)
      .leftJoin(packages, eq(adoptions.packageId, packages.id))
      .leftJoin(locations, eq(adoptions.locationId, locations.id))
      .where(
        or(
          isNull(adoptions.packageName),
          isNull(adoptions.packagePrice),
          isNull(adoptions.packagePeriod),
          isNull(adoptions.packageFeatures),
          isNull(adoptions.locationName)
        )
      );

    console.log(`Found ${adoptionsWithMissingData.length} adoptions with missing data`);

    let fixedCount = 0;

    for (const item of adoptionsWithMissingData) {
      const adoption = item.adoption;
      const packageData = item.package;
      const locationData = item.location;

      if (packageData && locationData) {
        // Update adoption with complete package and location data
        await db
          .update(adoptions)
          .set({
            packageName: packageData.name,
            packagePrice: packageData.price,
            packagePeriod: packageData.period,
            packageFeatures: packageData.features,
            locationName: locationData.name
          })
          .where(eq(adoptions.id, adoption.id));

        console.log(`Fixed adoption ${adoption.id}: ${packageData.name} at ${locationData.name}`);
        fixedCount++;
      } else {
        console.log(`Skipped adoption ${adoption.id}: missing package or location data`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} adoptions with missing data`,
      totalFound: adoptionsWithMissingData.length,
      totalFixed: fixedCount
    });

  } catch (error) {
    console.error('Error fixing adoption data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix adoption data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get adoptions with missing data for inspection
    const adoptionsWithMissingData = await db
      .select({
        adoption: adoptions,
        package: packages,
        location: locations,
      })
      .from(adoptions)
      .leftJoin(packages, eq(adoptions.packageId, packages.id))
      .leftJoin(locations, eq(adoptions.locationId, locations.id))
      .where(
        or(
          isNull(adoptions.packageName),
          isNull(adoptions.packagePrice),
          isNull(adoptions.packagePeriod),
          isNull(adoptions.packageFeatures),
          isNull(adoptions.locationName)
        )
      );

    return NextResponse.json({
      success: true,
      data: adoptionsWithMissingData,
      count: adoptionsWithMissingData.length
    });

  } catch (error) {
    console.error('Error getting adoption data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get adoption data' },
      { status: 500 }
    );
  }
}