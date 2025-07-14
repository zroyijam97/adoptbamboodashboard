import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { adoptions, bambooPlants, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user record from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userRecord[0].id;

    const body = await request.json();
    const { plantId, adoptionPrice } = body;

    if (!plantId || !adoptionPrice) {
      return NextResponse.json(
        { success: false, error: 'Plant ID and adoption price are required' },
        { status: 400 }
      );
    }

    // Check if plant exists and is available
    const plant = await db
      .select()
      .from(bambooPlants)
      .where(eq(bambooPlants.id, plantId))
      .limit(1);

    if (plant.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      );
    }

    // Check if plant is already adopted
    const existingAdoption = await db
      .select()
      .from(adoptions)
      .where(
        and(
          eq(adoptions.bambooPlantId, plantId),
          eq(adoptions.isActive, true)
        )
      )
      .limit(1);

    if (existingAdoption.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Plant is already adopted' },
        { status: 400 }
      );
    }

    // Create adoption record
    const newAdoption = await db
      .insert(adoptions)
      .values({
        userId,
        bambooPlantId: plantId,
        adoptionDate: new Date(),
        adoptionPrice: adoptionPrice.toString(),
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        adoption: newAdoption[0],
        plant: plant[0],
      },
    });

  } catch (error) {
    console.error('Error creating adoption:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}