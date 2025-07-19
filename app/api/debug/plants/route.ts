import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bambooPlants, adoptions } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get all bamboo plants
    const allPlants = await db
      .select()
      .from(bambooPlants)
      .orderBy(desc(bambooPlants.id))
      .limit(20);

    console.log('Debug plants - found:', allPlants.length);
    
    // Get all adoptions with their bambooPlantId
    const allAdoptions = await db
      .select({
        id: adoptions.id,
        bambooPlantId: adoptions.bambooPlantId,
        userId: adoptions.userId,
        isActive: adoptions.isActive
      })
      .from(adoptions)
      .orderBy(desc(adoptions.id))
      .limit(10);

    console.log('Debug adoptions bambooPlantIds:', allAdoptions.map(a => a.bambooPlantId));
    console.log('Debug plants ids:', allPlants.map(p => p.id));

    return NextResponse.json({
      success: true,
      plantsCount: allPlants.length,
      adoptionsCount: allAdoptions.length,
      plants: allPlants,
      adoptions: allAdoptions,
      analysis: {
        plantIds: allPlants.map(p => p.id),
        adoptionPlantIds: allAdoptions.map(a => a.bambooPlantId),
        missingPlants: allAdoptions.filter(a => 
          a.bambooPlantId && !allPlants.find(p => p.id === a.bambooPlantId)
        )
      }
    });

  } catch (error) {
    console.error('Debug plants error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}