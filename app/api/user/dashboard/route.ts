import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { adoptions, bambooPlants, users, packages, locations } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  // If email is provided, check subscriptions for that email
  if (email) {
    try {
      // Get user by email
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (userRecord.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            hasSubscription: false,
            message: 'No user found with this email'
          }
        });
      }

      // Check for active adoptions
      const userAdoptions = await db
        .select()
        .from(adoptions)
        .where(
          and(
            eq(adoptions.userId, userRecord[0].id),
            eq(adoptions.isActive, true)
          )
        );

      return NextResponse.json({
        success: true,
        data: {
          hasSubscription: userAdoptions.length > 0,
          adoptionsCount: userAdoptions.length,
          message: userAdoptions.length > 0 
            ? `Found ${userAdoptions.length} active subscription(s)` 
            : 'No active subscriptions found'
        }
      });
    } catch (error) {
      console.error('Error checking subscriptions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to check subscriptions' },
        { status: 500 }
      );
    }
  }

  // Regular dashboard data fetch
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
          eq(adoptions.userId, userId), // Using database user ID from users table
          eq(adoptions.isActive, true)
        )
      )
      .orderBy(desc(adoptions.adoptionDate));

    console.log('User ID (database):', userId);
    console.log('User ID (Clerk):', clerkUserId);
    console.log('Adoptions found:', userAdoptions.length);
    if (userAdoptions.length > 0) {
      console.log('First adoption:', {
        id: userAdoptions[0].adoption.id,
        userId: userAdoptions[0].adoption.userId,
        packageId: userAdoptions[0].adoption.packageId,
        packageName: userAdoptions[0].adoption.packageName,
        locationId: userAdoptions[0].adoption.locationId,
        locationName: userAdoptions[0].adoption.locationName
      });
    }

    console.log('User adoptions found:', userAdoptions.length);
    console.log('First adoption:', userAdoptions[0]?.adoption);

    // Calculate user statistics
    const totalAdoptions = userAdoptions.length;
    const totalSpent = userAdoptions.reduce((sum, item) => {
      // Convert from cents to ringgit (divide by 100)
      return sum + (parseFloat(item.adoption.adoptionPrice || '0') / 100);
    }, 0);

    // Get recent adoption activity (last 5)
    const recentAdoptions = userAdoptions.slice(0, 5);

    // Format adoptions with package details and calculated plant data
    const formattedAdoptions = userAdoptions.map(item => {
      // Parse package features safely
      let packageFeatures = [];
      try {
        if (item.adoption.packageFeatures) {
          packageFeatures = JSON.parse(item.adoption.packageFeatures);
        } else if (item.package?.features) {
          packageFeatures = JSON.parse(item.package.features);
        }
      } catch (error) {
        console.error('Error parsing package features:', error);
      }

      // Calculate plant growth based on subscription date
      // Bamboo is planted 3 days after subscription
      const adoptionDate = item.adoption.adoptionDate ? new Date(item.adoption.adoptionDate) : new Date();
      const subscriptionDate = new Date(adoptionDate);
      const plantingDate = new Date(subscriptionDate);
      plantingDate.setDate(plantingDate.getDate() + 3);
      
      const currentDate = new Date();
      const daysSincePlanting = Math.max(0, Math.floor((currentDate.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate height: bamboo grows approximately 0.3-0.5 meters per month
      // Using 0.4m per month = 0.013m per day
      const calculatedHeight = Math.max(0, daysSincePlanting * 0.013);
      
      // Calculate CO2 absorption: approximately 0.5kg per meter of height per month
      // Daily CO2 absorption = height * 0.5 / 30
      const calculatedCO2 = Math.max(0, calculatedHeight * 0.5 / 30 * daysSincePlanting);
      
      // Generate plant code based on adoption ID and location
      const plantCode = `BAMBOO-${item.adoption.id}-${adoptionDate.getFullYear()}${String(adoptionDate.getMonth() + 1).padStart(2, '0')}${String(adoptionDate.getDate()).padStart(2, '0')}${String(adoptionDate.getHours()).padStart(2, '0')}${String(adoptionDate.getMinutes()).padStart(2, '0')}`;

      return {
        adoption: {
          ...item.adoption,
          packageDetails: {
            id: item.adoption.packageId || item.package?.id,
            name: item.adoption.packageName || item.package?.name || 'Standard Package',
            price: (parseFloat(item.adoption.packagePrice || item.package?.price || '0') / 100).toString(),
            period: item.adoption.packagePeriod || item.package?.period || 'monthly',
            features: packageFeatures,
          },
          locationDetails: {
            id: item.adoption.locationId || item.location?.id,
            name: item.adoption.locationName || item.location?.name || 'Default Location',
            address: item.location?.address || '',
            coordinates: item.location?.coordinates || '',
            image: item.location?.image || '',
          }
        },
        plant: item.plant ? {
          ...item.plant,
          plantCode: plantCode,
          currentHeight: calculatedHeight.toFixed(2),
          co2Absorbed: calculatedCO2.toFixed(2),
          daysSincePlanting: daysSincePlanting,
          plantingDate: plantingDate.toISOString(),
          status: daysSincePlanting > 0 ? 'growing' : 'preparing'
        } : {
          id: 0,
          plantCode: plantCode,
          species: 'Bambusa vulgaris',
          location: item.adoption.locationName || 'Default Location',
          currentHeight: calculatedHeight.toFixed(2),
          co2Absorbed: calculatedCO2.toFixed(2),
          status: daysSincePlanting > 0 ? 'growing' : 'preparing',
          daysSincePlanting: daysSincePlanting,
          plantingDate: plantingDate.toISOString()
        },
      };
    });

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
      acc[packageName].totalSpent += (parseFloat(item.adoption.adoptionPrice || '0') / 100);
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