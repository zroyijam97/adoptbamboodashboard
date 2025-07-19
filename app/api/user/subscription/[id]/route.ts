import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { adoptions, bambooPlants, packages, locations, users, growthTracking } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateGrowthTimeline, calculateBambooGrowth } from '@/lib/growth-algorithm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const adoptionId = parseInt(resolvedParams.id);
    if (isNaN(adoptionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid adoption ID' },
        { status: 400 }
      );
    }

    // First, find the user in our database using clerkId
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const dbUser = userResult[0];

    // Get adoption details with package and location info
    const adoptionResult = await db
      .select({
        adoption: {
          id: adoptions.id,
          adoptionDate: adoptions.adoptionDate,
          adoptionPrice: adoptions.adoptionPrice,
          isActive: adoptions.isActive,
          bambooPlantId: adoptions.bambooPlantId,
          packageId: adoptions.packageId,
          locationId: adoptions.locationId,
          subscriptionImage: adoptions.subscriptionImage,
        },
        package: {
          id: packages.id,
          name: packages.name,
          price: packages.price,
          period: packages.period,
          features: packages.features,
        },
        location: {
          id: locations.id,
          name: locations.name,
          address: locations.address,
          coordinates: locations.coordinates,
          image: locations.image,
        }
      })
      .from(adoptions)
      .leftJoin(packages, eq(adoptions.packageId, packages.id))
      .leftJoin(locations, eq(adoptions.locationId, locations.id))
      .where(and(
        eq(adoptions.id, adoptionId),
        eq(adoptions.userId, dbUser.id)
      ))
      .limit(1);

    if (adoptionResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const result = adoptionResult[0];
    
    // Get plant details if bambooPlantId exists
    let plant = null;
    let growthRecords: {
      id: number;
      height: string;
      diameter?: string | null;
      notes?: string | null;
      photoUrl?: string | null;
      recordedDate: Date | null;
      recordedBy?: string | null;
    }[] = [];
    if (result.adoption.bambooPlantId) {
      const plantResult = await db
        .select()
        .from(bambooPlants)
        .where(eq(bambooPlants.id, result.adoption.bambooPlantId))
        .limit(1);
      
      if (plantResult.length > 0) {
        const plantData = plantResult[0];
        
        // Calculate days since planting
        let daysSincePlanting = 0;
        if (plantData.plantedDate) {
          const plantingDate = new Date(plantData.plantedDate);
          const today = new Date();
          const timeDiff = today.getTime() - plantingDate.getTime();
          daysSincePlanting = Math.floor(timeDiff / (1000 * 3600 * 24));
        }
        
        plant = {
          id: plantData.id,
          plantCode: plantData.plantCode,
          species: plantData.species,
          location: plantData.location,
          currentHeight: plantData.currentHeight,
          status: plantData.status,
          co2Absorbed: plantData.co2Absorbed,
          daysSincePlanting,
          plantingDate: plantData.plantedDate,
        };

        // Get existing growth tracking records
        const growthResult = await db
          .select()
          .from(growthTracking)
          .where(eq(growthTracking.bambooPlantId, result.adoption.bambooPlantId))
          .orderBy(desc(growthTracking.recordedDate))
          .limit(10);

        // Auto-generate growth records if none exist and plant has been planted
        if (growthResult.length === 0 && daysSincePlanting > 0) {
          try {
            console.log(`Auto-generating growth records for plant ${plantData.plantCode}, days: ${daysSincePlanting}`);
            
            // Generate growth timeline
            const growthTimeline = generateGrowthTimeline(daysSincePlanting);
            
            // Insert growth records
            for (const record of growthTimeline) {
              const recordDate = new Date(plantData.plantedDate!);
              recordDate.setDate(recordDate.getDate() + record.daysSincePlanting);
              
              await db
                .insert(growthTracking)
                .values({
                  bambooPlantId: result.adoption.bambooPlantId,
                  height: record.height.toString(),
                  diameter: record.diameter.toString(),
                  notes: record.notes,
                  recordedDate: recordDate,
                  recordedBy: 'System (Auto-generated)'
                });
            }

            // Update plant with current growth data
            const currentGrowth = calculateBambooGrowth(daysSincePlanting);
            await db
              .update(bambooPlants)
              .set({
                currentHeight: currentGrowth.height.toString(),
                co2Absorbed: currentGrowth.co2Absorbed.toString(),
                status: currentGrowth.growthStage === 'full-grown' ? 'mature' : 'growing',
                updatedAt: new Date()
              })
              .where(eq(bambooPlants.id, result.adoption.bambooPlantId));

            // Fetch the newly created records
            const newGrowthResult = await db
              .select()
              .from(growthTracking)
              .where(eq(growthTracking.bambooPlantId, result.adoption.bambooPlantId))
              .orderBy(desc(growthTracking.recordedDate))
              .limit(10);

            growthRecords = newGrowthResult.map(record => ({
              id: record.id,
              height: record.height,
              diameter: record.diameter,
              notes: record.notes,
              photoUrl: record.photoUrl,
              recordedDate: record.recordedDate,
              recordedBy: record.recordedBy,
            }));

            // Update plant data with new values
            plant.currentHeight = currentGrowth.height.toString();
            plant.co2Absorbed = currentGrowth.co2Absorbed.toString();
            plant.status = currentGrowth.growthStage === 'full-grown' ? 'mature' : 'growing';
            
          } catch (error) {
            console.error('Error auto-generating growth records:', error);
            // Continue with empty records if auto-generation fails
            growthRecords = [];
          }
        } else {
          // Use existing records
          growthRecords = growthResult.map(record => ({
            id: record.id,
            height: record.height,
            diameter: record.diameter,
            notes: record.notes,
            photoUrl: record.photoUrl,
            recordedDate: record.recordedDate,
            recordedBy: record.recordedBy,
          }));
        }
      }
    }

    const subscriptionData = {
      adoption: {
        id: result.adoption.id,
        adoptionDate: result.adoption.adoptionDate,
        adoptionPrice: result.adoption.adoptionPrice,
        isActive: result.adoption.isActive,
        subscriptionImage: result.adoption.subscriptionImage,
        packageDetails: {
          id: result.package?.id || '',
          name: result.package?.name || '',
          price: result.package?.price || '',
          period: result.package?.period || '',
          features: result.package?.features ? 
            (typeof result.package.features === 'string' ? 
              (() => {
                try {
                  const parsed = JSON.parse(result.package.features);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })()
              : (Array.isArray(result.package.features) ? result.package.features : [])
            ) : [],
        },
        locationDetails: {
          id: result.location?.id || '',
          name: result.location?.name || '',
          address: result.location?.address,
          coordinates: result.location?.coordinates,
          image: result.location?.image,
        },
      },
      plant,
      growthRecords,
    };

    return NextResponse.json({
      success: true,
      data: subscriptionData,
      message: 'Subscription details retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}