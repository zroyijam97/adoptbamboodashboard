import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adoptions, bambooPlants, users, packages, locations } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get all adoptions with related data
    const allAdoptions = await db
      .select({
        adoption: adoptions,
        plant: bambooPlants,
        package: packages,
        location: locations,
        user: users
      })
      .from(adoptions)
      .leftJoin(bambooPlants, eq(adoptions.bambooPlantId, bambooPlants.id))
      .leftJoin(packages, eq(adoptions.packageId, packages.id))
      .leftJoin(locations, eq(adoptions.locationId, locations.id))
      .leftJoin(users, eq(adoptions.userId, users.id))
      .orderBy(desc(adoptions.adoptionDate))
      .limit(10);

    console.log('Debug adoptions - found:', allAdoptions.length);
    
    const debugData = allAdoptions.map(item => ({
      adoptionId: item.adoption.id,
      userId: item.adoption.userId,
      userEmail: item.user?.email,
      bambooPlantId: item.adoption.bambooPlantId,
      plantCode: item.plant?.plantCode || 'NO_PLANT',
      plantStatus: item.plant?.status || 'NO_PLANT',
      packageId: item.adoption.packageId,
      packageName: item.adoption.packageName || item.package?.name || 'NO_PACKAGE',
      locationId: item.adoption.locationId,
      locationName: item.adoption.locationName || item.location?.name || 'NO_LOCATION',
      adoptionDate: item.adoption.adoptionDate,
      isActive: item.adoption.isActive,
      paymentReference: item.adoption.paymentReferenceNo
    }));

    return NextResponse.json({
      success: true,
      count: allAdoptions.length,
      adoptions: debugData
    });

  } catch (error) {
    console.error('Debug adoptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}