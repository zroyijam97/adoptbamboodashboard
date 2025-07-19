import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, adoptions } from '@/lib/schema';
import { eq, and, notExists } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get successful payments without adoptions
    const successfulPaymentsWithoutAdoptions = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'success'),
          notExists(
            db.select().from(adoptions).where(
              eq(adoptions.paymentReferenceNo, payments.referenceNo)
            )
          )
        )
      )
      .orderBy(payments.createdAt);

    console.log(`Found ${successfulPaymentsWithoutAdoptions.length} payments without adoptions`);

    // Analyze the missing data
    const analysis = successfulPaymentsWithoutAdoptions.map(payment => {
      return {
        referenceNo: payment.referenceNo,
        userId: payment.userId,
        customerName: payment.customerName,
        customerEmail: payment.customerEmail,
        amount: payment.amount,
        packageType: payment.packageType,
        locationId: payment.locationId,
        billCode: payment.billCode,
        status: payment.status,
        createdAt: payment.createdAt,
        missingData: {
          packageType: !payment.packageType,
          locationId: !payment.locationId,
          customerName: !payment.customerName,
          customerEmail: !payment.customerEmail
        }
      };
    });

    return NextResponse.json({
      success: true,
      count: successfulPaymentsWithoutAdoptions.length,
      payments: analysis,
      summary: {
        totalWithoutAdoptions: successfulPaymentsWithoutAdoptions.length,
        missingPackageType: analysis.filter(p => p.missingData.packageType).length,
        missingLocationId: analysis.filter(p => p.missingData.locationId).length,
        missingCustomerName: analysis.filter(p => p.missingData.customerName).length,
        missingCustomerEmail: analysis.filter(p => p.missingData.customerEmail).length
      }
    });

  } catch (error) {
    console.error('Error analyzing missing payment data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze missing payment data' },
      { status: 500 }
    );
  }
}