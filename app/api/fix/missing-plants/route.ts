import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bambooPlants, adoptions, locations } from '@/lib/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting missing plants fix...');
    
    // Find adoptions with null bambooPlantId
    const adoptionsWithMissingPlants = await db
      .select()
      .from(adoptions)
      .where(and(
        eq(adoptions.isActive, true),
        isNull(adoptions.bambooPlantId)
      ));

    console.log('Found adoptions with missing plants:', adoptionsWithMissingPlants.length);

    if (adoptionsWithMissingPlants.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No missing plants found',
        fixed: 0
      });
    }

    // Get all locations for reference
    const allLocations = await db.select().from(locations);
    const locationMap = new Map(allLocations.map(loc => [loc.id, loc]));

    let fixedCount = 0;
    const results = [];

    for (const adoption of adoptionsWithMissingPlants) {
      
      try {
        // Get location info
        const location = locationMap.get(adoption.locationId || 1) || allLocations[0];
        
        // Generate unique plant code
        const plantCode = `BAMBOO-${adoption.id}-${Date.now()}`;
        
        // Create new bamboo plant
        const [newPlant] = await db.insert(bambooPlants).values({
          plantCode: plantCode,
          location: location?.name || 'Penang, Malaysia',
          plantedDate: adoption.adoptionDate || new Date(),
          currentHeight: '0.50', // Default starting height
          species: 'Bambusa vulgaris',
          status: 'growing',
          co2Absorbed: '0.00'
        }).returning();

        // Update adoption with new plant ID
        await db.update(adoptions)
          .set({ bambooPlantId: newPlant.id })
          .where(eq(adoptions.id, adoption.id));

        fixedCount++;
        results.push({
          adoptionId: adoption.id,
          newPlantId: newPlant.id,
          plantCode: plantCode,
          location: location?.name
        });

        console.log(`Fixed adoption ${adoption.id} with new plant ${newPlant.id}`);
        
      } catch (error) {
        console.error(`Error fixing adoption ${adoption.id}:`, error);
        results.push({
          adoptionId: adoption.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} missing plants`,
      fixed: fixedCount,
      total: adoptionsWithMissingPlants.length,
      results: results
    });

  } catch (error) {
    console.error('Fix missing plants error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Just check for missing plants without fixing
    const adoptionsWithMissingPlants = await db
      .select()
      .from(adoptions)
      .where(and(
        eq(adoptions.isActive, true),
        isNull(adoptions.bambooPlantId)
      ));

    return NextResponse.json({
      success: true,
      missingPlantsCount: adoptionsWithMissingPlants.length,
      adoptionsWithMissingPlants: adoptionsWithMissingPlants
    });

  } catch (error) {
    console.error('Check missing plants error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}