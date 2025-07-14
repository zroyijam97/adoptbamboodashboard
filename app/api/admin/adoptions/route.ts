import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adoptions, users, adminUsers } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

// Helper function to check if user is admin
async function isAdmin(email: string) {
  const admin = await db.select().from(adminUsers)
    .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true)))
    .limit(1);
  return admin.length > 0;
}

// GET - Fetch all adoptions with detailed information
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

    // Get all adoptions with user details
    const allAdoptions = await db.select({
      adoption: adoptions,
      user: users
    })
    .from(adoptions)
    .leftJoin(users, eq(adoptions.userId, users.id))
    .orderBy(desc(adoptions.adoptionDate));

    return NextResponse.json({
      success: true,
      data: allAdoptions
    });

  } catch (error) {
    console.error('Error fetching adoptions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update adoption information
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
    const { adoptionId, isActive, adoptionPrice, packageName, locationName } = body;

    if (!adoptionId) {
      return NextResponse.json({ error: 'Adoption ID is required' }, { status: 400 });
    }

    // Update adoption
    const updatedAdoption = await db
      .update(adoptions)
      .set({
        isActive,
        adoptionPrice,
        packageName,
        locationName
      })
      .where(eq(adoptions.id, adoptionId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedAdoption[0]
    });

  } catch (error) {
    console.error('Error updating adoption:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}