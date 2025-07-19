import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { adoptions, bambooPlants, users, packages, locations } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    console.log('Debug - Clerk User ID:', clerkUserId);
    
    if (!clerkUserId) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        clerkUserId: null
      });
    }

    // Get the user record from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    console.log('Debug - User records found:', userRecord.length);
    if (userRecord.length > 0) {
      console.log('Debug - Database user:', userRecord[0]);
    }

    if (userRecord.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        clerkUserId,
        userRecord: null
      });
    }

    const userId = userRecord[0].id;
    console.log('Debug - Database User ID:', userId);

    // Get user's adoptions with detailed joins
    const userAdoptions = await db
      .select({
        adoption: adoptions,
        plant: bambooPlants,
        package: packages,
        location: locations,
      })
      .from(adoptions)
      .leftJoin(bambooPlants, eq(adoptions.bambooPlantId, bambooPlants.id))
      .leftJoin(packages, eq(adoptions.packageId, packages.id))
      .leftJoin(locations, eq(adoptions.locationId, locations.id))
      .where(
        and(
          eq(adoptions.userId, userId),
          eq(adoptions.isActive, true)
        )
      )
      .orderBy(desc(adoptions.adoptionDate));

    console.log('Debug - Adoptions found:', userAdoptions.length);
    
    const debugData = userAdoptions.map((item, index) => ({
      index,
      adoption: {
        id: item.adoption.id,
        userId: item.adoption.userId,
        bambooPlantId: item.adoption.bambooPlantId,
        packageId: item.adoption.packageId,
        locationId: item.adoption.locationId,
        adoptionDate: item.adoption.adoptionDate,
        isActive: item.adoption.isActive
      },
      plant: item.plant ? {
        id: item.plant.id,
        plantCode: item.plant.plantCode,
        location: item.plant.location,
        currentHeight: item.plant.currentHeight,
        species: item.plant.species,
        status: item.plant.status,
        co2Absorbed: item.plant.co2Absorbed
      } : null,
      package: item.package ? {
        id: item.package.id,
        name: item.package.name,
        price: item.package.price,
        period: item.package.period
      } : null,
      location: item.location ? {
        id: item.location.id,
        name: item.location.name,
        address: item.location.address
      } : null
    }));

    return NextResponse.json({
      success: true,
      debug: {
        clerkUserId,
        databaseUserId: userId,
        userRecord: userRecord[0],
        adoptionsCount: userAdoptions.length,
        adoptions: debugData
      }
    });

  } catch (error) {
    console.error('Debug user dashboard error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}