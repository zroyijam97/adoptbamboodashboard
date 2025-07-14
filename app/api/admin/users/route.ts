import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, adoptions, adminUsers } from '@/lib/schema';
import { eq, count, sum, sql, and } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

// Helper function to check if user is admin
async function isAdmin(email: string) {
  const admin = await db.select().from(adminUsers)
    .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true)))
    .limit(1);
  return admin.length > 0;
}

// GET - Fetch all users with their adoption statistics
export async function GET(request: NextRequest) {
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

    // Get all users with their adoption statistics
    const allUsers = await db.select({
      user: users,
      totalAdoptions: count(adoptions.id),
      totalSpent: sql<string>`COALESCE(SUM(CAST(${adoptions.adoptionPrice} AS DECIMAL)), 0)`,
      activeAdoptions: sql<number>`COUNT(CASE WHEN ${adoptions.isActive} = true THEN 1 END)`
    })
    .from(users)
    .leftJoin(adoptions, eq(users.id, adoptions.userId))
    .groupBy(users.id)
    .orderBy(users.createdAt);

    return NextResponse.json({
      success: true,
      data: allUsers
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update user information
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { userId, firstName, lastName, email } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set({
        firstName,
        lastName,
        email,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedUser[0]
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}