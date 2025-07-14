import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { paymentManager } from '@/lib/payment';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const gateway = searchParams.get('gateway') || 'toyyibpay';

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Missing payment ID' },
        { status: 400 }
      );
    }

    // Get payment status
    const paymentStatus = await paymentManager.getPaymentStatus(gateway, paymentId);

    return NextResponse.json({
      success: true,
      payment: paymentStatus,
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}