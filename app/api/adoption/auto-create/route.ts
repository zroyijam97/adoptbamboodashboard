import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adoptions, users, packages, locations, payments } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * API endpoint untuk auto-create adoption record selepas payment success
 * Dipanggil oleh payment callback atau polling system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentReferenceNo } = body;

    if (!paymentReferenceNo) {
      return NextResponse.json(
        { error: 'Payment reference number is required' },
        { status: 400 }
      );
    }

    console.log('Auto-creating adoption for payment:', paymentReferenceNo);

    // Periksa jika adoption sudah wujud
    const existingAdoption = await db
      .select()
      .from(adoptions)
      .where(eq(adoptions.paymentReferenceNo, paymentReferenceNo))
      .limit(1);

    if (existingAdoption.length > 0) {
      console.log('Adoption already exists for payment:', paymentReferenceNo);
      return NextResponse.json({
        success: true,
        message: 'Adoption already exists',
        adoptionId: existingAdoption[0].id
      });
    }

    // Dapatkan payment record
    const paymentRecord = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.referenceNo, paymentReferenceNo),
          eq(payments.status, 'success')
        )
      )
      .limit(1);

    if (paymentRecord.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found or not successful' },
        { status: 404 }
      );
    }

    const payment = paymentRecord[0];
    console.log('Payment found:', {
      referenceNo: payment.referenceNo,
      userId: payment.userId,
      packageType: payment.packageType,
      locationId: payment.locationId,
      amount: payment.amount
    });

    // Validasi data payment
    if (!payment.packageType || !payment.locationId) {
      return NextResponse.json(
        { 
          error: 'Payment missing required data',
          details: {
            packageType: payment.packageType,
            locationId: payment.locationId
          }
        },
        { status: 400 }
      );
    }

    // Dapatkan atau buat user record
    let userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, payment.userId))
      .limit(1);

    let user;
    if (userRecord.length > 0) {
      user = userRecord[0];
    } else {
      // Buat user baru jika tidak wujud
      const newUserData = {
        clerkId: payment.userId,
        email: payment.customerEmail,
        firstName: payment.customerName?.split(' ')[0] || null,
        lastName: payment.customerName?.split(' ').slice(1).join(' ') || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const newUserResult = await db
        .insert(users)
        .values([newUserData])
        .returning();
      
      user = newUserResult[0];
      console.log('New user created:', user.id);
    }

    // Dapatkan package info
    let packageInfo = null;
    if (payment.packageType) {
      // Cuba cari berdasarkan period dahulu
      let packageQuery = await db
        .select()
        .from(packages)
        .where(eq(packages.period, payment.packageType))
        .limit(1);
      
      // Jika tidak jumpa berdasarkan period, cuba berdasarkan ID
      if (packageQuery.length === 0 && !isNaN(parseInt(payment.packageType))) {
        packageQuery = await db
          .select()
          .from(packages)
          .where(eq(packages.id, parseInt(payment.packageType)))
          .limit(1);
      }
      
      if (packageQuery.length > 0) {
        packageInfo = packageQuery[0];
      }
    }

    // Dapatkan location info
    let locationInfo = null;
    if (payment.locationId) {
      // Cuba cari berdasarkan nama dahulu
      let locationQuery = await db
        .select()
        .from(locations)
        .where(eq(locations.name, payment.locationId))
        .limit(1);
      
      // Jika tidak jumpa berdasarkan nama, cuba berdasarkan ID
      if (locationQuery.length === 0 && !isNaN(parseInt(payment.locationId))) {
        locationQuery = await db
          .select()
          .from(locations)
          .where(eq(locations.id, parseInt(payment.locationId)))
          .limit(1);
      }
      
      if (locationQuery.length > 0) {
        locationInfo = locationQuery[0];
      }
    }

    // Buat adoption record dengan data yang lengkap
    const adoptionData = {
      userId: user.id,
      packageId: packageInfo?.id || null,
      locationId: locationInfo?.id || null,
      paymentReferenceNo: payment.referenceNo,
      adoptionPrice: payment.amount,
      adoptionDate: payment.paidDate || payment.createdAt || new Date(),
      isActive: true,
      // Simpan package details untuk historical data
      packageName: packageInfo?.name || null,
      packagePrice: packageInfo?.price || null,
      packagePeriod: packageInfo?.period || null,
      packageFeatures: packageInfo?.features || null,
      // Simpan location details untuk historical data
      locationName: locationInfo?.name || payment.locationName || null,
      certificateIssued: false,
      createdAt: new Date(),
    };

    console.log('Creating adoption with data:', {
      userId: user.id,
      packageId: packageInfo?.id,
      locationId: locationInfo?.id,
      paymentReferenceNo: payment.referenceNo
    });

    const newAdoption = await db
      .insert(adoptions)
      .values([adoptionData])
      .returning();

    console.log('Adoption created successfully:', newAdoption[0].id);

    // Update location current count
    if (locationInfo?.id) {
      await db
        .update(locations)
        .set({
          currentCount: (locationInfo.currentCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(locations.id, locationInfo.id));
      
      console.log('Location count updated for:', locationInfo.name);
    }

    return NextResponse.json({
      success: true,
      message: 'Adoption created successfully',
      adoption: {
        id: newAdoption[0].id,
        userId: newAdoption[0].userId,
        packageName: newAdoption[0].packageName,
        locationName: newAdoption[0].locationName,
        adoptionPrice: newAdoption[0].adoptionPrice,
        adoptionDate: newAdoption[0].adoptionDate
      }
    });

  } catch (error) {
    console.error('Auto-create adoption error:', error);
    return NextResponse.json(
      { error: 'Failed to create adoption record' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint untuk memeriksa status adoption untuk payment tertentu
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentReferenceNo = searchParams.get('ref');

    if (!paymentReferenceNo) {
      return NextResponse.json(
        { error: 'Payment reference number is required' },
        { status: 400 }
      );
    }

    // Periksa jika adoption wujud
    const adoption = await db
      .select()
      .from(adoptions)
      .where(eq(adoptions.paymentReferenceNo, paymentReferenceNo))
      .limit(1);

    // Dapatkan payment info
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.referenceNo, paymentReferenceNo))
      .limit(1);

    return NextResponse.json({
      success: true,
      paymentExists: payment.length > 0,
      paymentStatus: payment.length > 0 ? payment[0].status : null,
      adoptionExists: adoption.length > 0,
      adoptionId: adoption.length > 0 ? adoption[0].id : null,
      needsCreation: payment.length > 0 && payment[0].status === 'success' && adoption.length === 0
    });

  } catch (error) {
    console.error('Check adoption status error:', error);
    return NextResponse.json(
      { error: 'Failed to check adoption status' },
      { status: 500 }
    );
  }
}