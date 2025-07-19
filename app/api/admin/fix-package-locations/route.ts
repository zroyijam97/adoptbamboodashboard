import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages, locations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    console.log('Starting to fix package locations...');
    
    // Get all packages
    const allPackages = await db.select().from(packages);
    console.log(`Found ${allPackages.length} packages`);
    
    // Get all locations
    const allLocations = await db.select().from(locations).where(eq(locations.isActive, true));
    console.log(`Found ${allLocations.length} active locations`);
    
    if (allLocations.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active locations found'
      });
    }
    
    const results = [];
    
    // Update packages without plantingLocationId
    for (let i = 0; i < allPackages.length; i++) {
      const pkg = allPackages[i];
      
      if (!pkg.plantingLocationId) {
        // Assign location in round-robin fashion
        const locationIndex = i % allLocations.length;
        const assignedLocation = allLocations[locationIndex];
        
        const updatedPackage = await db.update(packages)
          .set({
            plantingLocationId: assignedLocation.id,
            updatedAt: new Date()
          })
          .where(eq(packages.id, pkg.id))
          .returning();
          
        results.push({
          packageId: pkg.id,
          packageName: pkg.name,
          assignedLocationId: assignedLocation.id,
          assignedLocationName: assignedLocation.name
        });
        
        console.log(`Updated package ${pkg.name} with location ${assignedLocation.name}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${results.length} packages with planting locations`,
      results
    });
    
  } catch (error) {
    console.error('Error fixing package locations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix package locations'
    }, { status: 500 });
  }
}