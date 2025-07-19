import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adoptions, bambooPlants, users } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug - Checking adoption plants data...');

    // Get all adoptions with their bamboo plant data
    const adoptionData = await db
      .select({
        adoption: adoptions,
        plant: bambooPlants,
      })
      .from(adoptions)
      .leftJoin(bambooPlants, eq(adoptions.bambooPlantId, bambooPlants.id))
      .where(eq(adoptions.isActive, true))
      .orderBy(desc(adoptions.adoptionDate));

    console.log('Debug - Total active adoptions:', adoptionData.length);
    
    // Log each adoption with its plant data
    adoptionData.forEach((item, index) => {
      console.log(`Adoption ${index + 1}:`, {
        adoptionId: item.adoption.id,
        bambooPlantId: item.adoption.bambooPlantId,
        plantData: item.plant ? {
          id: item.plant.id,
          plantCode: item.plant.plantCode,
          species: item.plant.species,
          currentHeight: item.plant.currentHeight,
          co2Absorbed: item.plant.co2Absorbed,
          plantedDate: item.plant.plantedDate
        } : null,
        hasPlant: !!item.plant
      });
    });

    // Count adoptions with and without plants
    const withPlants = adoptionData.filter(item => item.plant !== null).length;
    const withoutPlants = adoptionData.filter(item => item.plant === null).length;

    console.log('Debug - Adoptions with plants:', withPlants);
    console.log('Debug - Adoptions without plants:', withoutPlants);

    return NextResponse.json({
      success: true,
      data: {
        totalAdoptions: adoptionData.length,
        withPlants,
        withoutPlants,
        adoptions: adoptionData.map(item => ({
          adoptionId: item.adoption.id,
          bambooPlantId: item.adoption.bambooPlantId,
          hasPlant: !!item.plant,
          plantData: item.plant ? {
            id: item.plant.id,
            plantCode: item.plant.plantCode,
            species: item.plant.species,
            currentHeight: item.plant.currentHeight,
            co2Absorbed: item.plant.co2Absorbed
          } : null
        }))
      }
    });

  } catch (error) {
    console.error('Error in debug adoption plants:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}