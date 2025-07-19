import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching all packages...');

    const allPackages = await db
      .select()
      .from(packages);

    console.log(`Found ${allPackages.length} packages:`);
    allPackages.forEach(pkg => {
      console.log(`- ID: ${pkg.id}, Name: ${pkg.name}, Period: ${pkg.period}, Price: ${pkg.price}`);
    });

    return NextResponse.json({
      success: true,
      packages: allPackages
    });

  } catch (error) {
    console.error('Debug packages error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}