import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, locations, packages } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting fix for payment locations...');

    // Get all successful payments with missing or invalid locationId
    const successfulPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'success'));

    console.log(`Found ${successfulPayments.length} successful payments`);

    // Get first available location as default
    const defaultLocation = await db
      .select()
      .from(locations)
      .where(eq(locations.isActive, true))
      .limit(1);

    if (defaultLocation.length === 0) {
      return NextResponse.json({
        error: 'No active locations found'
      }, { status: 400 });
    }

    const defaultLoc = defaultLocation[0];
    console.log('Using default location:', defaultLoc.name, 'ID:', defaultLoc.id);

    const results = [];

    for (const payment of successfulPayments) {
      try {
        const locationId = payment.locationId ? parseInt(payment.locationId) : NaN;
        
        // Skip if locationId is valid
        if (!isNaN(locationId) && locationId > 0) {
          console.log(`Payment ${payment.referenceNo} already has valid locationId: ${locationId}`);
          continue;
        }

        console.log(`Fixing payment ${payment.referenceNo} - setting locationId to ${defaultLoc.id}`);

        // Update payment with default location
        await db
          .update(payments)
          .set({
            locationId: defaultLoc.id.toString(),
            locationName: defaultLoc.name,
            updatedAt: new Date()
          })
          .where(eq(payments.referenceNo, payment.referenceNo));

        results.push({
          referenceNo: payment.referenceNo,
          status: 'updated',
          oldLocationId: payment.locationId,
          newLocationId: defaultLoc.id.toString(),
          locationName: defaultLoc.name
        });

      } catch (error) {
        console.error(`Error fixing payment ${payment.referenceNo}:`, error);
        results.push({
          referenceNo: payment.referenceNo,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment locations fix completed',
      defaultLocation: {
        id: defaultLoc.id,
        name: defaultLoc.name
      },
      totalProcessed: successfulPayments.length,
      results
    });

  } catch (error) {
    console.error('Fix payment locations error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}