import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch all locations
export async function GET() {
  try {
    const allLocations = await db.select().from(locations).orderBy(locations.name);
    
    return NextResponse.json({
      success: true,
      data: allLocations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch locations'
    }, { status: 500 });
  }
}

// POST - Create new location
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, address, latitude, longitude, description, capacity, currentCount,
      soilType, areaCondition, features, image, coordinates, availability, isActive 
    } = body;

    const newLocation = await db.insert(locations).values({
      name,
      address,
      latitude: latitude ? latitude.toString() : null,
      longitude: longitude ? longitude.toString() : null,
      description,
      capacity: capacity ? parseInt(capacity) : null,
      currentCount: currentCount ? parseInt(currentCount) : 0,
      soilType,
      areaCondition,
      features: JSON.stringify(features || []),
      image,
      coordinates,
      availability,
      isActive: isActive ?? true,
    }).returning();

    return NextResponse.json({
      success: true,
      data: newLocation[0]
    });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create location' },
      { status: 500 }
    );
  }
}

// PUT - Update location
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      name, 
      address, 
      latitude, 
      longitude, 
      description, 
      capacity, 
      currentCount,
      soilType,
      areaCondition,
      features,
      image,
      coordinates,
      availability,
      isActive 
    } = body;

    const updatedLocation = await db.update(locations)
      .set({
        name,
        address,
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null,
        description,
        capacity: capacity ? parseInt(capacity) : null,
        currentCount: currentCount ? parseInt(currentCount) : 0,
        soilType,
        areaCondition,
        features: JSON.stringify(features || []),
        image,
        coordinates,
        availability,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(locations.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedLocation[0]
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

// DELETE - Delete location
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Location ID is required'
      }, { status: 400 });
    }

    await db.delete(locations).where(eq(locations.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete location'
    }, { status: 500 });
  }
}