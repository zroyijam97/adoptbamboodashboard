import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up default packages...');

    // Check if packages already exist
    const existingPackages = await db
      .select()
      .from(packages);

    if (existingPackages.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Packages already exist',
        packages: existingPackages
      });
    }

    // Create default packages
    const defaultPackages = [
      {
        name: 'Quarterly Package',
        description: 'Adopt bamboo for 3 months',
        price: '35.00',
        period: 'quarterly',
        features: JSON.stringify(['3 months adoption', 'Growth tracking', 'Certificate']),
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Annual Package',
        description: 'Adopt bamboo for 1 year',
        price: '120.00',
        period: 'annual',
        features: JSON.stringify(['12 months adoption', 'Growth tracking', 'Certificate', 'Priority support']),
        isActive: true,
        sortOrder: 2
      }
    ];

    const createdPackages = [];
    for (const pkg of defaultPackages) {
      const result = await db
        .insert(packages)
        .values(pkg)
        .returning();
      
      createdPackages.push(result[0]);
      console.log(`Created package: ${pkg.name} (${pkg.period})`);
    }

    return NextResponse.json({
      success: true,
      message: 'Default packages created successfully',
      packages: createdPackages
    });

  } catch (error) {
    console.error('Setup packages error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}