import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch all packages
export async function GET() {
  try {
    const allPackages = await db.select().from(packages).orderBy(packages.sortOrder);
    
    return NextResponse.json({
      success: true,
      data: allPackages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch packages'
    }, { status: 500 });
  }
}

// POST - Create new package
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, period, features, isActive, sortOrder } = body;

    const newPackage = await db.insert(packages).values({
      name,
      description,
      price: price.toString(),
      period,
      features: JSON.stringify(features),
      isActive: isActive ?? true,
      sortOrder: sortOrder || 0,
    }).returning();

    return NextResponse.json({
      success: true,
      data: newPackage[0]
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create package' },
      { status: 500 }
    );
  }
}

// PUT - Update package
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, price, period, features, isActive, sortOrder } = body;

    const updatedPackage = await db.update(packages)
      .set({
        name,
        description,
        price: price.toString(),
        period,
        features: JSON.stringify(features),
        isActive,
        sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(packages.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedPackage[0]
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

// DELETE - Delete package
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Package ID is required'
      }, { status: 400 });
    }

    await db.delete(packages).where(eq(packages.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete package'
    }, { status: 500 });
  }
}