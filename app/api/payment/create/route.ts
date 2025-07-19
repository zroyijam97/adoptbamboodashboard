import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { paymentManager, generateReferenceNo, formatCurrency, type PaymentRequest } from '@/lib/payment';
import { db } from '@/lib/db';
import { payments, packages, locations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Payment creation request body:', body);

    const {
      amount,
      description,
      customerName,
      customerEmail,
      customerPhone,
      gateway = 'toyyibpay',
      subscriptionType,
      plantingLocation,
      plantingLocationName,
    } = body;

    // Debug logging
    console.log('Payment request validation:', {
      amount,
      description,
      customerName,
      customerEmail,
      customerPhone,
      gateway,
      subscriptionType,
      plantingLocation,
      plantingLocationName,
      userId
    });

    // Validate required fields including package and location
    if (!amount || !description || !customerName || !customerEmail) {
      console.error('Missing required fields:', { amount, description, customerName, customerEmail });
      return NextResponse.json(
        { error: 'Missing required fields: amount, description, customerName, customerEmail' },
        { status: 400 }
      );
    }

    // Validate package type is required
    if (!subscriptionType) {
      console.error('Missing package type:', { subscriptionType });
      return NextResponse.json(
        { error: 'Package type is required' },
        { status: 400 }
      );
    }

    // Validate location is required
    if (!plantingLocation) {
      console.error('Missing planting location:', { plantingLocation });
      return NextResponse.json(
        { error: 'Planting location is required' },
        { status: 400 }
      );
    }

    // Validate amount format (amount is in cents)
    let parsedAmount = typeof amount === 'string' ? parseInt(amount) : amount;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error('Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Validate phone number
    const defaultPhone = '60123456789';
    const phone = customerPhone || defaultPhone;
    if (!/^\d+$/.test(phone)) {
      console.error('Invalid phone number:', phone);
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate package and location data directly
    try {
      // Validate package exists
      if (subscriptionType) {
        let packageQuery = await db
          .select()
          .from(packages)
          .where(eq(packages.period, subscriptionType))
          .limit(1);
        
        if (packageQuery.length === 0 && !isNaN(parseInt(subscriptionType))) {
          packageQuery = await db
            .select()
            .from(packages)
            .where(eq(packages.id, parseInt(subscriptionType)))
            .limit(1);
        }
        
        if (packageQuery.length === 0) {
          console.error('Package not found:', subscriptionType);
          return NextResponse.json(
            { error: `Package '${subscriptionType}' not found` },
            { status: 400 }
          );
        }
        
        const packageRecord = packageQuery[0];
        if (!packageRecord.isActive) {
          console.error('Package not active:', subscriptionType);
          return NextResponse.json(
            { error: `Package '${packageRecord.name}' is not active` },
            { status: 400 }
          );
        }
      }

      // Validate location exists
      if (plantingLocation) {
        let locationQuery = await db
          .select()
          .from(locations)
          .where(eq(locations.name, plantingLocation))
          .limit(1);
        
        if (locationQuery.length === 0 && !isNaN(parseInt(plantingLocation))) {
          locationQuery = await db
            .select()
            .from(locations)
            .where(eq(locations.id, parseInt(plantingLocation)))
            .limit(1);
        }
        
        if (locationQuery.length === 0) {
          console.error('Location not found:', plantingLocation);
          return NextResponse.json(
            { error: `Location '${plantingLocation}' not found` },
            { status: 400 }
          );
        }
        
        const locationRecord = locationQuery[0];
        if (!locationRecord.isActive) {
          console.error('Location not active:', plantingLocation);
          return NextResponse.json(
            { error: `Location '${locationRecord.name}' is not active` },
            { status: 400 }
          );
        }
        
        // Check location capacity
        if (locationRecord.capacity && locationRecord.currentCount !== null && locationRecord.currentCount >= locationRecord.capacity) {
          console.error('Location at capacity:', plantingLocation);
          return NextResponse.json(
            { error: `Location '${locationRecord.name}' is at full capacity` },
            { status: 400 }
          );
        }
      }

      console.log('Validation successful for package:', subscriptionType, 'and location:', plantingLocation);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        { error: 'Failed to validate payment data' },
        { status: 500 }
      );
    }

    // Generate reference number
    const referenceNo = generateReferenceNo('BAMBOO');
    console.log('Generated reference number:', referenceNo);

    // Store payment record with package and location info
    try {
      const paymentRecord = await db
        .insert(payments)
        .values({
          referenceNo,
          userId,
          amount: parsedAmount.toString(),
          description,
          customerName,
          customerEmail,
          customerPhone: phone,
          packageType: subscriptionType || null,
          locationId: plantingLocation || null,
          locationName: plantingLocationName || null,
          status: 'pending',
          gateway,
          createdAt: new Date(),
        })
        .returning();

      console.log('Payment record created:', paymentRecord[0]);
    } catch (dbError) {
      console.error('Error creating payment record:', dbError);
      // Continue with payment creation even if DB insert fails
    }

    // Prepare payment data
    const paymentData: PaymentRequest = {
      amount: parsedAmount,
      description,
      customerName,
      customerEmail,
      customerPhone: phone,
      referenceNo,
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?ref=${referenceNo}`,
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
    };

    console.log('Creating payment with data:', {
      gateway,
      paymentData,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    });

    // Create payment
    try {
      const paymentResponse = await paymentManager.createPayment(gateway, paymentData);
      console.log('Payment creation response:', paymentResponse);

      if (paymentResponse.status === 'failed') {
        console.error('Payment creation failed:', {
          message: paymentResponse.message,
          gateway,
          paymentData: {
            ...paymentData,
            amount: formatCurrency(paymentData.amount),
          },
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
          toyyibpayConfig: {
            secretKeyPresent: !!process.env.TOYYIBPAY_SECRET_KEY,
            categoryCodePresent: !!process.env.TOYYIBPAY_CATEGORY_CODE,
            baseUrl: process.env.TOYYIBPAY_BASE_URL,
          }
        });
        return NextResponse.json(
          { error: paymentResponse.message || 'Payment creation failed' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        paymentId: paymentResponse.paymentId,
        paymentUrl: paymentResponse.paymentUrl,
        referenceNo,
        amount: paymentData.amount,
      });
    } catch (error) {
      console.error('Payment creation error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}