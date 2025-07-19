import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { adoptions, bambooPlants, growthTracking } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { generateGrowthTimeline, calculateBambooGrowth } from '@/lib/growth-algorithm';

/**
 * API endpoint untuk generate growth tracking data automatik
 * Menggunakan algoritma pertumbuhan berdasarkan hari sejak penanaman
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { adoptionId, forceRegenerate = false } = body;

    if (!adoptionId) {
      return NextResponse.json(
        { error: 'Adoption ID is required' },
        { status: 400 }
      );
    }

    // Get adoption details
    const adoption = await db
      .select()
      .from(adoptions)
      .where(eq(adoptions.id, adoptionId))
      .limit(1);

    if (adoption.length === 0) {
      return NextResponse.json(
        { error: 'Adoption not found' },
        { status: 404 }
      );
    }

    const adoptionData = adoption[0];
    
    if (!adoptionData.bambooPlantId) {
      return NextResponse.json(
        { error: 'No bamboo plant associated with this adoption' },
        { status: 400 }
      );
    }

    // Get bamboo plant details
    const plant = await db
      .select()
      .from(bambooPlants)
      .where(eq(bambooPlants.id, adoptionData.bambooPlantId))
      .limit(1);

    if (plant.length === 0) {
      return NextResponse.json(
        { error: 'Bamboo plant not found' },
        { status: 404 }
      );
    }

    const plantData = plant[0];
    
    if (!plantData.plantedDate) {
      return NextResponse.json(
        { error: 'Plant planting date not found' },
        { status: 400 }
      );
    }

    // Calculate days since planting
    const plantingDate = new Date(plantData.plantedDate);
    const today = new Date();
    const timeDiff = today.getTime() - plantingDate.getTime();
    const daysSincePlanting = Math.floor(timeDiff / (1000 * 3600 * 24));

    if (daysSincePlanting < 0) {
      return NextResponse.json(
        { error: 'Invalid planting date (future date)' },
        { status: 400 }
      );
    }

    // Check if growth records already exist
    const existingRecords = await db
      .select()
      .from(growthTracking)
      .where(eq(growthTracking.bambooPlantId, adoptionData.bambooPlantId));

    if (existingRecords.length > 0 && !forceRegenerate) {
      return NextResponse.json({
        message: 'Growth records already exist',
        recordsCount: existingRecords.length,
        suggestion: 'Use forceRegenerate=true to regenerate all records'
      });
    }

    // Delete existing records if force regenerate
    if (forceRegenerate && existingRecords.length > 0) {
      await db
        .delete(growthTracking)
        .where(eq(growthTracking.bambooPlantId, adoptionData.bambooPlantId));
    }

    // Generate growth timeline
    const growthTimeline = generateGrowthTimeline(daysSincePlanting);
    
    // Insert growth records
    const insertedRecords = [];
    
    for (const record of growthTimeline) {
      // Calculate the actual date for this record
      const recordDate = new Date(plantingDate);
      recordDate.setDate(recordDate.getDate() + record.daysSincePlanting);
      
      const insertedRecord = await db
        .insert(growthTracking)
        .values({
          bambooPlantId: adoptionData.bambooPlantId,
          height: record.height.toString(),
          diameter: record.diameter.toString(),
          notes: record.notes,
          recordedDate: recordDate,
          recordedBy: 'System (Auto-generated)'
        })
        .returning();
      
      insertedRecords.push(insertedRecord[0]);
    }

    // Update bamboo plant with current data
    const currentGrowth = calculateBambooGrowth(daysSincePlanting);
    
    await db
      .update(bambooPlants)
      .set({
        currentHeight: currentGrowth.height.toString(),
        co2Absorbed: currentGrowth.co2Absorbed.toString(),
        status: currentGrowth.growthStage === 'full-grown' ? 'mature' : 'growing',
        updatedAt: new Date()
      })
      .where(eq(bambooPlants.id, adoptionData.bambooPlantId));

    return NextResponse.json({
      success: true,
      message: 'Growth tracking data generated successfully',
      data: {
        adoptionId,
        bambooPlantId: adoptionData.bambooPlantId,
        plantCode: plantData.plantCode,
        daysSincePlanting,
        currentGrowth,
        recordsGenerated: insertedRecords.length,
        records: insertedRecords.map(record => ({
          id: record.id,
          height: record.height,
          diameter: record.diameter,
          notes: record.notes,
          recordedDate: record.recordedDate,
          recordedBy: record.recordedBy
        }))
      }
    });

  } catch (error) {
    console.error('Error generating growth tracking data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint untuk preview growth calculation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    if (days < 0 || days > 3650) { // Max 10 years
      return NextResponse.json(
        { error: 'Days must be between 0 and 3650' },
        { status: 400 }
      );
    }

    const growthData = calculateBambooGrowth(days);
    const timeline = generateGrowthTimeline(days);

    return NextResponse.json({
      success: true,
      data: {
        daysSincePlanting: days,
        currentGrowth: growthData,
        timeline: timeline.slice(-10) // Last 10 records
      }
    });

  } catch (error) {
    console.error('Error calculating growth preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}