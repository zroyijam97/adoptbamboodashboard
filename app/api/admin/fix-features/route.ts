import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages, locations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    console.log('Starting fix for invalid features data...');
    
    // Fix packages with invalid features
    const allPackages = await db.select().from(packages);
    let packagesFixed = 0;
    
    for (const pkg of allPackages) {
      if (pkg.features) {
        try {
          // Try to parse existing features
          JSON.parse(pkg.features);
          console.log(`Package ${pkg.id} (${pkg.name}) has valid features`);
        } catch (error) {
          console.log(`Fixing invalid features for package ${pkg.id} (${pkg.name}): ${pkg.features}`);
          
          // Set default features based on package type
          let defaultFeatures = [];
          if (pkg.period === 'quarterly') {
            defaultFeatures = ['3 months adoption', 'Growth tracking', 'Certificate'];
          } else if (pkg.period === 'annual') {
            defaultFeatures = ['12 months adoption', 'Growth tracking', 'Certificate', 'Priority support'];
          } else if (pkg.period === 'monthly') {
            defaultFeatures = ['1 month adoption', 'Growth tracking'];
          } else {
            defaultFeatures = ['Bamboo adoption', 'Growth tracking'];
          }
          
          await db
            .update(packages)
            .set({ features: JSON.stringify(defaultFeatures) })
            .where(eq(packages.id, pkg.id));
          
          packagesFixed++;
          console.log(`Fixed package ${pkg.id} with features: ${JSON.stringify(defaultFeatures)}`);
        }
      } else {
        // Set default features for packages without features
        let defaultFeatures = [];
        if (pkg.period === 'quarterly') {
          defaultFeatures = ['3 months adoption', 'Growth tracking', 'Certificate'];
        } else if (pkg.period === 'annual') {
          defaultFeatures = ['12 months adoption', 'Growth tracking', 'Certificate', 'Priority support'];
        } else if (pkg.period === 'monthly') {
          defaultFeatures = ['1 month adoption', 'Growth tracking'];
        } else {
          defaultFeatures = ['Bamboo adoption', 'Growth tracking'];
        }
        
        await db
          .update(packages)
          .set({ features: JSON.stringify(defaultFeatures) })
          .where(eq(packages.id, pkg.id));
        
        packagesFixed++;
        console.log(`Added features to package ${pkg.id}: ${JSON.stringify(defaultFeatures)}`);
      }
    }
    
    // Fix locations with invalid features
    const allLocations = await db.select().from(locations);
    let locationsFixed = 0;
    
    for (const location of allLocations) {
      if (location.features) {
        try {
          // Try to parse existing features
          JSON.parse(location.features);
          console.log(`Location ${location.id} (${location.name}) has valid features`);
        } catch (error) {
          console.log(`Fixing invalid features for location ${location.id} (${location.name}): ${location.features}`);
          
          // Set default features for locations
          const defaultFeatures = ['Strategic location', 'Good soil condition', 'Optimal climate'];
          
          await db
            .update(locations)
            .set({ features: JSON.stringify(defaultFeatures) })
            .where(eq(locations.id, location.id));
          
          locationsFixed++;
          console.log(`Fixed location ${location.id} with features: ${JSON.stringify(defaultFeatures)}`);
        }
      } else {
        // Set default features for locations without features
        const defaultFeatures = ['Strategic location', 'Good soil condition', 'Optimal climate'];
        
        await db
          .update(locations)
          .set({ features: JSON.stringify(defaultFeatures) })
          .where(eq(locations.id, location.id));
        
        locationsFixed++;
        console.log(`Added features to location ${location.id}: ${JSON.stringify(defaultFeatures)}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Features data fixed successfully',
      packagesFixed,
      locationsFixed,
      totalPackages: allPackages.length,
      totalLocations: allLocations.length
    });
    
  } catch (error) {
    console.error('Fix features error:', error);
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