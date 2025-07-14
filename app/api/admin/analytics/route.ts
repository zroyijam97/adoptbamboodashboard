import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, adoptions, bambooPlants, adminUsers } from '@/lib/schema';
import { eq, count, sum, gte, lte, and, sql } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

// Helper function to check if user is admin
async function isAdmin(email: string) {
  const admin = await db.select().from(adminUsers)
    .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true)))
    .limit(1);
  return admin.length > 0;
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user || !user.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0].emailAddress;
    const adminCheck = await isAdmin(userEmail);
    
    if (!adminCheck) {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    // Get current date ranges
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Total subscribers
    const totalSubscribers = await db.select({ count: count() }).from(users);

    // Total active adoptions
    const totalAdoptions = await db.select({ count: count() })
      .from(adoptions)
      .where(eq(adoptions.isActive, true));

    // Total subscription revenue
    const totalRevenue = await db.select({ 
      total: sql<string>`COALESCE(SUM(CAST(${adoptions.adoptionPrice} AS DECIMAL)), 0)`
    }).from(adoptions).where(eq(adoptions.isActive, true));

    // Daily adoptions
    const dailyAdoptions = await db.select({ 
      count: count(),
      revenue: sql<string>`COALESCE(SUM(CAST(${adoptions.adoptionPrice} AS DECIMAL)), 0)`
    })
    .from(adoptions)
    .where(and(
      gte(adoptions.adoptionDate, startOfDay),
      eq(adoptions.isActive, true)
    ));

    // Monthly adoptions
    const monthlyAdoptions = await db.select({ 
      count: count(),
      revenue: sql<string>`COALESCE(SUM(CAST(${adoptions.adoptionPrice} AS DECIMAL)), 0)`
    })
    .from(adoptions)
    .where(and(
      gte(adoptions.adoptionDate, startOfMonth),
      eq(adoptions.isActive, true)
    ));

    // Yearly adoptions
    const yearlyAdoptions = await db.select({ 
      count: count(),
      revenue: sql<string>`COALESCE(SUM(CAST(${adoptions.adoptionPrice} AS DECIMAL)), 0)`
    })
    .from(adoptions)
    .where(and(
      gte(adoptions.adoptionDate, startOfYear),
      eq(adoptions.isActive, true)
    ));

    // Total bamboo plants
    const totalBambooPlants = await db.select({ count: count() }).from(bambooPlants);

    // Recent adoptions with user details
    const recentAdoptions = await db.select({
      adoption: adoptions,
      user: users,
      plant: bambooPlants
    })
    .from(adoptions)
    .leftJoin(users, eq(adoptions.userId, users.id))
    .leftJoin(bambooPlants, eq(adoptions.bambooPlantId, bambooPlants.id))
    .where(eq(adoptions.isActive, true))
    .orderBy(adoptions.adoptionDate)
    .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSubscribers: totalSubscribers[0]?.count || 0,
          totalAdoptions: totalAdoptions[0]?.count || 0,
          totalRevenue: parseFloat(totalRevenue[0]?.total || '0'),
          totalBambooPlants: totalBambooPlants[0]?.count || 0,
        },
        daily: {
          adoptions: dailyAdoptions[0]?.count || 0,
          revenue: parseFloat(dailyAdoptions[0]?.revenue || '0'),
        },
        monthly: {
          adoptions: monthlyAdoptions[0]?.count || 0,
          revenue: parseFloat(monthlyAdoptions[0]?.revenue || '0'),
        },
        yearly: {
          adoptions: yearlyAdoptions[0]?.count || 0,
          revenue: parseFloat(yearlyAdoptions[0]?.revenue || '0'),
        },
        recentAdoptions: recentAdoptions,
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}