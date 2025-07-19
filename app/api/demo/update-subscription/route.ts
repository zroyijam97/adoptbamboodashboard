import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adoptions, bambooPlants, growthTracking } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('Updating demo subscription for ID 19...');
    
    // Calculate date one month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    console.log('Setting adoption date to:', oneMonthAgo.toISOString());
    
    // Update adoption date to one month ago
    await db
      .update(adoptions)
      .set({
        adoptionDate: oneMonthAgo
      })
      .where(eq(adoptions.id, 19));
    
    console.log('Adoption date updated successfully');
    
    // Get the bamboo plant associated with this adoption
    const adoptionResult = await db
      .select({
        bambooPlantId: adoptions.bambooPlantId
      })
      .from(adoptions)
      .where(eq(adoptions.id, 19))
      .limit(1);
    
    if (adoptionResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Adoption not found' },
        { status: 404 }
      );
    }
    
    const bambooPlantId = adoptionResult[0].bambooPlantId;
    
    if (bambooPlantId) {
      console.log('Updating bamboo plant ID:', bambooPlantId);
      
      // Update bamboo plant with planting date one month ago
      await db
        .update(bambooPlants)
        .set({
          plantedDate: oneMonthAgo,
          currentHeight: '45.5', // Realistic height after 30 days
          co2Absorbed: '2.8', // Realistic CO2 absorption
          status: 'growing'
        })
        .where(eq(bambooPlants.id, bambooPlantId));
      
      console.log('Bamboo plant updated successfully');
      
      // Clear existing growth records for this plant
      await db
        .delete(growthTracking)
        .where(eq(growthTracking.bambooPlantId, bambooPlantId));
      
      console.log('Cleared existing growth records');
      
      // Create realistic growth records for the past month
      const growthRecords = [
        {
          day: 0,
          height: '15.0',
          diameter: '1.2',
          notes: 'Initial planting - healthy seedling'
        },
        {
          day: 7,
          height: '22.5',
          diameter: '1.5',
          notes: 'First week growth - strong root development'
        },
        {
          day: 14,
          height: '31.2',
          diameter: '1.8',
          notes: 'Two weeks - rapid vertical growth phase'
        },
        {
          day: 21,
          height: '38.7',
          diameter: '2.1',
          notes: 'Three weeks - new shoots emerging'
        },
        {
          day: 30,
          height: '45.5',
          diameter: '2.4',
          notes: 'One month milestone - excellent growth rate'
        }
      ];
      
      for (const record of growthRecords) {
        const recordDate = new Date(oneMonthAgo);
        recordDate.setDate(recordDate.getDate() + record.day);
        
        await db
          .insert(growthTracking)
          .values({
            bambooPlantId: bambooPlantId,
            height: record.height,
            diameter: record.diameter,
            notes: record.notes,
            recordedDate: recordDate,
            recordedBy: 'Growth Monitoring System'
          });
      }
      
      console.log('Created realistic growth records');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Demo subscription updated successfully!',
      data: {
        adoptionId: 19,
        adoptionDate: oneMonthAgo,
        bambooPlantId,
        growthRecordsCreated: 5,
        currentHeight: '45.5 cm',
        co2Absorbed: '2.8 kg',
        viewUrl: 'http://localhost:3000/subscription/19'
      }
    });
    
  } catch (error) {
    console.error('Error updating demo subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update demo subscription' },
      { status: 500 }
    );
  }
}