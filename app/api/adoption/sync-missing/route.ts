import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adoptions, payments } from '@/lib/schema';
import { eq, and, notInArray, isNotNull } from 'drizzle-orm';

/**
 * API endpoint untuk sync missing adoptions
 * Mencari semua payment yang berjaya tetapi tidak mempunyai adoption record
 * dan membuat adoption record untuk mereka
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting sync missing adoptions process...');

    // Dapatkan semua payment yang berjaya
    const successfulPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'success'));

    console.log(`Found ${successfulPayments.length} successful payments`);

    if (successfulPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No successful payments found',
        processed: 0,
        created: 0,
        errors: []
      });
    }

    // Dapatkan semua adoption records yang wujud
    const existingAdoptions = await db
      .select({ paymentReferenceNo: adoptions.paymentReferenceNo })
      .from(adoptions)
      .where(
        isNotNull(adoptions.paymentReferenceNo)
      );

    const existingRefs = new Set(
      existingAdoptions
        .map(a => a.paymentReferenceNo)
        .filter(ref => ref !== null)
    );

    console.log(`Found ${existingRefs.size} existing adoption records`);

    // Cari payment yang tidak mempunyai adoption record
    const missingAdoptions = successfulPayments.filter(
      payment => !existingRefs.has(payment.referenceNo)
    );

    console.log(`Found ${missingAdoptions.length} payments missing adoption records`);

    if (missingAdoptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All successful payments have adoption records',
        processed: successfulPayments.length,
        created: 0,
        errors: []
      });
    }

    // Proses setiap missing adoption
    const results = {
      processed: 0,
      created: 0,
      errors: [] as Array<{ referenceNo: string; error: string }>
    };

    for (const payment of missingAdoptions) {
      try {
        results.processed++;
        console.log(`Processing missing adoption for payment: ${payment.referenceNo}`);

        // Panggil auto-create API untuk setiap payment
        const adoptionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/adoption/auto-create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentReferenceNo: payment.referenceNo
          })
        });

        const adoptionResult = await adoptionResponse.json();
        
        if (adoptionResult.success) {
          results.created++;
          console.log(`Successfully created adoption for payment: ${payment.referenceNo}`);
        } else {
          results.errors.push({
            referenceNo: payment.referenceNo,
            error: adoptionResult.error || 'Unknown error'
          });
          console.error(`Failed to create adoption for payment ${payment.referenceNo}:`, adoptionResult.error);
        }
        
      } catch (error) {
        results.errors.push({
          referenceNo: payment.referenceNo,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Error processing payment ${payment.referenceNo}:`, error);
      }

      // Tambah delay kecil untuk mengelakkan overload
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Sync missing adoptions completed:', results);

    return NextResponse.json({
      success: true,
      message: `Sync completed. Created ${results.created} adoption records out of ${results.processed} missing.`,
      ...results
    });

  } catch (error) {
    console.error('Sync missing adoptions error:', error);
    return NextResponse.json(
      { error: 'Failed to sync missing adoptions' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint untuk memeriksa berapa banyak missing adoptions
 */
export async function GET(request: NextRequest) {
  try {
    // Dapatkan semua payment yang berjaya
    const successfulPayments = await db
      .select({ referenceNo: payments.referenceNo })
      .from(payments)
      .where(eq(payments.status, 'success'));

    // Dapatkan semua adoption records yang wujud
    const existingAdoptions = await db
      .select({ paymentReferenceNo: adoptions.paymentReferenceNo })
      .from(adoptions)
      .where(
        isNotNull(adoptions.paymentReferenceNo)
      );

    const existingRefs = new Set(
      existingAdoptions
        .map(a => a.paymentReferenceNo)
        .filter(ref => ref !== null)
    );

    const missingCount = successfulPayments.filter(
      payment => !existingRefs.has(payment.referenceNo)
    ).length;

    return NextResponse.json({
      success: true,
      totalSuccessfulPayments: successfulPayments.length,
      totalExistingAdoptions: existingRefs.size,
      missingAdoptions: missingCount,
      needsSync: missingCount > 0
    });

  } catch (error) {
    console.error('Check missing adoptions error:', error);
    return NextResponse.json(
      { error: 'Failed to check missing adoptions' },
      { status: 500 }
    );
  }
}