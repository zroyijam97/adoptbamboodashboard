import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { adoptions, bambooPlants, users, packages, locations } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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

    // Get user's adoptions with plant, package, and location details
    const userAdoptions = await db
      .select({
        adoption: adoptions,
        plant: bambooPlants,
        package: packages,
        location: locations,
      })
      .from(adoptions)
      .leftJoin(bambooPlants, eq(adoptions.bambooPlantId, bambooPlants.id))
      .leftJoin(packages, eq(adoptions.packageId, packages.id))
      .leftJoin(locations, eq(adoptions.locationId, locations.id))
      .where(
        and(
          eq(adoptions.userId, userId),
          eq(adoptions.isActive, true)
        )
      )
      .orderBy(desc(adoptions.adoptionDate));

    // Calculate user statistics
    const totalAdoptions = userAdoptions.length;
    const totalSpent = userAdoptions.reduce((sum, item) => {
      return sum + parseFloat(item.adoption.adoptionPrice || '0');
    }, 0);

    // Get recent adoption activity (last 5)
    const recentAdoptions = userAdoptions.slice(0, 5);

    // Format adoptions with package details
    const formattedAdoptions = userAdoptions.map(item => ({
      adoption: {
        ...item.adoption,
        // Include package details from stored data or joined table
        packageDetails: {
          id: item.adoption.packageId,
          name: item.adoption.packageName || item.package?.name,
          price: item.adoption.packagePrice || item.package?.price,
          period: item.adoption.packagePeriod || item.package?.period,
          features: item.adoption.packageFeatures ? 
            JSON.parse(item.adoption.packageFeatures) : 
            (item.package?.features ? JSON.parse(item.package.features) : []),
        },
        locationDetails: {
          id: item.adoption.locationId,
          name: item.adoption.locationName || item.location?.name,
          address: item.location?.address,
          coordinates: item.location?.coordinates,
          image: item.location?.image,
        }
      },
      plant: item.plant,
      package: item.package,
      location: item.location,
    }));

    // Calculate package analytics
    const packageAnalytics = userAdoptions.reduce((acc, item) => {
      const packageName = item.adoption.packageName || item.package?.name || 'Unknown Package';
      if (!acc[packageName]) {
        acc[packageName] = {
          count: 0,
          totalSpent: 0,
          period: item.adoption.packagePeriod || item.package?.period,
        };
      }
      acc[packageName].count += 1;
      acc[packageName].totalSpent += parseFloat(item.adoption.adoptionPrice || '0');
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          totalAdoptions,
          totalSpent,
          memberSince: userAdoptions[userAdoptions.length - 1]?.adoption.adoptionDate || new Date(),
        },
        adoptions: formattedAdoptions,
        recentActivity: recentAdoptions,
        statistics: {
          activeAdoptions: totalAdoptions,
          totalInvestment: totalSpent,
          averagePerPlant: totalAdoptions > 0 ? totalSpent / totalAdoptions : 0,
        },
        packageAnalytics,
      },
    });

  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}