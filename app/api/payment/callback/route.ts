import { NextRequest, NextResponse } from 'next/server';
import { paymentManager } from '@/lib/payment';
import { db } from '@/lib/db';
import { adoptions, users, packages, locations, payments, growthTracking, environmentalData } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Get callback data from ToyyibPay
    const formData = await request.formData();
    const billCode = formData.get('billcode') as string;
    const status = formData.get('status_id') as string;
    const amount = formData.get('amount') as string;
    const transactionId = formData.get('transaction_id') as string;
    const referenceNo = formData.get('order_id') as string;

    console.log('Payment callback received:', {
      billCode,
      status,
      amount,
      transactionId,
      referenceNo,
    });

    if (!billCode) {
      return NextResponse.json(
        { error: 'Missing bill code' },
        { status: 400 }
      );
    }

    // Get payment status from ToyyibPay
    const paymentStatus = await paymentManager.getPaymentStatus('toyyibpay', billCode);

    console.log('Payment status from ToyyibPay:', paymentStatus);

    // Update payment record
    try {
      await db
        .update(payments)
        .set({
          status: paymentStatus.status === 'success' ? 'success' : 'failed',
          billCode,
          transactionId,
          paidAmount: amount,
          paidDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.referenceNo, referenceNo));

      console.log('Payment record updated for reference:', referenceNo);
    } catch (updateError) {
      console.error('Error updating payment record:', updateError);
    }

    // If payment is successful, create adoption record
    if (paymentStatus.status === 'success' && status === '1') {
      console.log('Payment successful, creating adoption record...');
      try {
        // Get payment record with package and location info
        const paymentRecord = await db
          .select()
          .from(payments)
          .where(eq(payments.referenceNo, referenceNo))
          .limit(1);

        console.log('Payment record query result:', paymentRecord);

        if (paymentRecord.length > 0) {
          const payment = paymentRecord[0];
          console.log('Payment record found:', {
            userId: payment.userId,
            packageType: payment.packageType,
            locationId: payment.locationId,
            amount: payment.amount
          });
          
          // Create adoption record using auto-create API
          console.log('Creating adoption record using auto-create API...');
          
          try {
            const adoptionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/adoption/auto-create`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentReferenceNo: referenceNo
              })
            });

            const adoptionResult = await adoptionResponse.json();
            
            if (!adoptionResult.success) {
              console.error('Failed to create adoption:', adoptionResult.error);
              return NextResponse.json(
                { 
                  error: 'Payment successful but failed to create adoption record',
                  details: adoptionResult.error
                },
                { status: 500 }
              );
            }

            console.log('Adoption created successfully:', adoptionResult.adoption);
            
            return NextResponse.json({ 
              success: true, 
              message: 'Payment and adoption processed successfully',
              adoptionId: adoptionResult.adoption.id,
              adoption: adoptionResult.adoption
            });
            
          } catch (adoptionError) {
            console.error('Auto-create adoption API error:', adoptionError);
            return NextResponse.json(
              { error: 'Payment successful but failed to create adoption record' },
              { status: 500 }
            );
          }
        } else {
          console.log('No payment record found for reference:', referenceNo);
        }
      } catch (adoptionError) {
        console.error('Error creating adoption record:', adoptionError);
        if (adoptionError instanceof Error) {
          console.error('Adoption error stack:', adoptionError.stack);
        }
        // Don't fail the callback if adoption creation fails
      }
    } else {
      console.log('Payment not successful or status not 1:', {
        paymentStatus: paymentStatus.status,
        status: status
      });
    }

    console.log('Payment callback processed successfully');

    // Respond to ToyyibPay
    return NextResponse.json({ 
      success: true,
      message: 'Callback processed successfully' 
    });

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const billCode = searchParams.get('billcode');

  if (!billCode) {
    return NextResponse.json(
      { error: 'Missing bill code' },
      { status: 400 }
    );
  }

  try {
    const paymentStatus = await paymentManager.getPaymentStatus('toyyibpay', billCode);
    return NextResponse.json(paymentStatus);
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}