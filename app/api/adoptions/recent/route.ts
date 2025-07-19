import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adoptions } from '@/lib/schema';
import { desc } from 'drizzle-orm';

/**
 * GET endpoint to fetch recent adoptions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;

    // Fetch recent adoptions
    const recentAdoptions = await db
      .select({
        id: adoptions.id,
        paymentReferenceNo: adoptions.paymentReferenceNo,
        adoptionDate: adoptions.adoptionDate,
        isActive: adoptions.isActive,
        status: adoptions.isActive // Map isActive to status for compatibility
      })
      .from(adoptions)
      .orderBy(desc(adoptions.adoptionDate))
      .limit(Math.min(limit, 50)); // Cap at 50 for performance

    // Transform the data to match expected format
    const transformedAdoptions = recentAdoptions.map(adoption => ({
      id: adoption.id,
      paymentReferenceNo: adoption.paymentReferenceNo,
      adoptionDate: adoption.adoptionDate,
      status: adoption.isActive ? 'active' : 'inactive'
    }));

    return NextResponse.json({
      success: true,
      adoptions: transformedAdoptions
    });
  } catch (error) {
    console.error('Error fetching recent adoptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent adoptions' },
      { status: 500 }
    );
  }
}