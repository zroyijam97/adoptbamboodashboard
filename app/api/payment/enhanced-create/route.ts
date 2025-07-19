import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Generate reference number function
function generateReferenceNo(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random.toString().padStart(3, '0')}`;
}

/**
 * Enhanced payment creation API dengan validation dan auto-adoption
 * Menggunakan workflow yang diperbaiki untuk memastikan data lengkap
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Enhanced payment creation request:', body);

    const {
      userId,
      amount,
      description,
      customerName,
      customerEmail,
      customerPhone,
      subscriptionType, // packageType
      plantingLocation, // locationId
    } = body;

    // Step 1: Comprehensive validation
    const validationErrors = [];

    if (!userId) validationErrors.push('User ID is required');
    if (!amount) validationErrors.push('Amount is required');
    if (!description) validationErrors.push('Description is required');
    if (!customerName) validationErrors.push('Customer name is required');
    if (!customerEmail) validationErrors.push('Customer email is required');
    if (!subscriptionType) validationErrors.push('Package type is required');
    if (!plantingLocation) validationErrors.push('Planting location is required');

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Step 2: Validate and normalize data using validation API
    console.log('Validating package and location data...');
    
    let validationResult;
    try {
      const validationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify({
          packageType: subscriptionType,
          locationId: plantingLocation,
          customerName,
          customerEmail,
          amount: parseFloat(amount)
        })
      });

      validationResult = await validationResponse.json();
      
      if (!validationResult.success) {
        console.error('Validation failed:', validationResult.errors);
        return NextResponse.json(
          { 
            error: 'Data validation failed', 
            details: validationResult.errors 
          },
          { status: 400 }
        );
      }

      console.log('Validation successful:', validationResult.validatedData);
    } catch (validationError) {
      console.error('Validation API error:', validationError);
      return NextResponse.json(
        { error: 'Failed to validate payment data' },
        { status: 500 }
      );
    }

    // Step 3: Generate reference number
    const referenceNo = generateReferenceNo('BAMBOO');
    console.log('Generated reference number:', referenceNo);

    // Step 4: Create payment record with validated data
    const paymentData = {
      referenceNo,
      userId,
      amount: amount.toString(),
      description,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      packageType: subscriptionType,
      locationId: plantingLocation,
      locationName: validationResult.validatedData.locationName || null,
      status: 'pending',
      gateway: 'toyyibpay',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Creating payment record with enhanced data:', {
      referenceNo,
      userId,
      packageType: subscriptionType,
      locationId: plantingLocation,
      locationName: paymentData.locationName
    });

    let paymentRecord;
    try {
      const newPayment = await db
        .insert(payments)
        .values([paymentData])
        .returning();
      
      paymentRecord = newPayment[0];
      console.log('Payment record created successfully:', paymentRecord.id);
    } catch (dbError) {
      console.error('Database error creating payment:', dbError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Step 5: Create ToyyibPay bill
    console.log('Creating ToyyibPay bill...');
    
    const toyyibPayData = {
      userSecretKey: process.env.TOYYIBPAY_SECRET_KEY || '',
      categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE || '',
      billName: description,
      billDescription: `Bamboo Adoption - ${validationResult.validatedData.packageName || subscriptionType}`,
      billPriceSetting: '1',
      billPayorInfo: '1',
      billAmount: (parseFloat(amount) * 100).toString(),
      billReturnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?ref=${referenceNo}`,
      billCallbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
      billExternalReferenceNo: referenceNo,
      billTo: customerName,
      billEmail: customerEmail,
      billPhone: customerPhone || '',
      billSplitPayment: '0',
      billSplitPaymentArgs: '',
      billPaymentChannel: '0',
      billContentEmail: `Thank you for adopting bamboo! Your reference number is ${referenceNo}`,
      billChargeToCustomer: '1',
      billExpiryDate: '',
      billExpiryDays: '3'
    };

    let toyyibPayResponse;
    try {
      const response = await fetch('https://dev.toyyibpay.com/index.php/api/createBill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(toyyibPayData).toString(),
      });

      toyyibPayResponse = await response.json();
      console.log('ToyyibPay response:', toyyibPayResponse);

      if (toyyibPayResponse[0]?.BillCode) {
        // Update payment record with bill code
        await db
          .update(payments)
          .set({
            billCode: toyyibPayResponse[0].BillCode,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentRecord.id));

        console.log('Payment updated with bill code:', toyyibPayResponse[0].BillCode);
      } else {
        console.error('ToyyibPay bill creation failed:', toyyibPayResponse);
        return NextResponse.json(
          { 
            error: 'Failed to create payment bill',
            details: toyyibPayResponse
          },
          { status: 500 }
        );
      }
    } catch (toyyibPayError) {
      console.error('ToyyibPay API error:', toyyibPayError);
      return NextResponse.json(
        { error: 'Payment gateway error' },
        { status: 500 }
      );
    }

    // Step 6: Return success response with payment URL
    const paymentUrl = `https://dev.toyyibpay.com/${toyyibPayResponse[0].BillCode}`;
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced payment created successfully',
      referenceNo,
      paymentUrl,
      billCode: toyyibPayResponse[0].BillCode,
      validatedData: validationResult.validatedData,
      paymentDetails: {
        amount: paymentData.amount,
        packageType: paymentData.packageType,
        locationName: paymentData.locationName,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail
      }
    });

  } catch (error) {
    console.error('Enhanced payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create enhanced payment' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint untuk memeriksa status enhanced payment workflow
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceNo = searchParams.get('ref');

    if (!referenceNo) {
      return NextResponse.json(
        { error: 'Reference number is required' },
        { status: 400 }
      );
    }

    // Check payment status
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.referenceNo, referenceNo))
      .limit(1);

    if (payment.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if adoption exists
    const adoptionCheck = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/adoption/auto-create?ref=${referenceNo}`);
    const adoptionStatus = await adoptionCheck.json();

    return NextResponse.json({
      success: true,
      payment: {
        referenceNo: payment[0].referenceNo,
        status: payment[0].status,
        amount: payment[0].amount,
        packageType: payment[0].packageType,
        locationName: payment[0].locationName,
        createdAt: payment[0].createdAt,
        paidDate: payment[0].paidDate
      },
      adoption: adoptionStatus,
      workflowComplete: payment[0].status === 'success' && adoptionStatus.adoptionExists
    });

  } catch (error) {
    console.error('Enhanced payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}