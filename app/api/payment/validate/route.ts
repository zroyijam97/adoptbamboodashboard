import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { packages, locations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * API endpoint untuk validasi data sebelum pembayaran
 * Memastikan packageType dan locationId adalah valid dan wujud dalam database
 */
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
    const {
      packageType,
      locationId,
      customerName,
      customerEmail,
      amount
    } = body;

    console.log('Payment validation request:', {
      packageType,
      locationId,
      customerName,
      customerEmail,
      amount,
      userId
    });

    // Validasi field wajib
    const errors = [];
    
    if (!packageType) {
      errors.push('Package type is required');
    }
    
    if (!locationId) {
      errors.push('Location ID is required');
    }
    
    if (!customerName || customerName.trim().length === 0) {
      errors.push('Customer name is required');
    }
    
    if (!customerEmail || !customerEmail.includes('@')) {
      errors.push('Valid customer email is required');
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errors.push('Valid amount is required');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          errors,
          message: 'Validation failed' 
        },
        { status: 400 }
      );
    }

    // Validasi package wujud dalam database
    let packageRecord = null;
    if (packageType) {
      // Cuba cari berdasarkan period dahulu
      let packageQuery = await db
        .select()
        .from(packages)
        .where(eq(packages.period, packageType))
        .limit(1);
      
      // Jika tidak jumpa berdasarkan period, cuba berdasarkan ID
      if (packageQuery.length === 0 && !isNaN(parseInt(packageType))) {
        packageQuery = await db
          .select()
          .from(packages)
          .where(eq(packages.id, parseInt(packageType)))
          .limit(1);
      }
      
      if (packageQuery.length === 0) {
        errors.push(`Package '${packageType}' not found`);
      } else {
        packageRecord = packageQuery[0];
      }
    }

    // Validasi location wujud dalam database
    let locationRecord = null;
    if (locationId) {
      // Cuba cari berdasarkan nama dahulu
      let locationQuery = await db
        .select()
        .from(locations)
        .where(eq(locations.name, locationId))
        .limit(1);
      
      // Jika tidak jumpa berdasarkan nama, cuba berdasarkan ID
      if (locationQuery.length === 0 && !isNaN(parseInt(locationId))) {
        locationQuery = await db
          .select()
          .from(locations)
          .where(eq(locations.id, parseInt(locationId)))
          .limit(1);
      }
      
      if (locationQuery.length === 0) {
        errors.push(`Location '${locationId}' not found`);
      } else {
        locationRecord = locationQuery[0];
        
        // Periksa kapasiti lokasi
        if (locationRecord.capacity && locationRecord.currentCount !== null && locationRecord.currentCount >= locationRecord.capacity) {
          errors.push(`Location '${locationRecord.name}' is at full capacity`);
        }
        
        // Periksa status aktif lokasi
        if (!locationRecord.isActive) {
          errors.push(`Location '${locationRecord.name}' is not active`);
        }
      }
    }

    // Periksa status aktif package
    if (packageRecord && !packageRecord.isActive) {
      errors.push(`Package '${packageRecord.name}' is not active`);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          errors,
          message: 'Validation failed' 
        },
        { status: 400 }
      );
    }

    // Kembalikan data yang telah divalidasi
    return NextResponse.json({
      success: true,
      message: 'Validation successful',
      validatedData: {
          package: packageRecord ? {
            id: packageRecord.id,
            name: packageRecord.name,
            price: packageRecord.price,
            period: packageRecord.period,
            features: packageRecord.features
          } : null,
          location: locationRecord ? {
            id: locationRecord.id,
            name: locationRecord.name,
            capacity: locationRecord.capacity,
            currentCount: locationRecord.currentCount,
            availability: locationRecord.availability
          } : null,
        customer: {
          name: customerName.trim(),
          email: customerEmail.toLowerCase().trim()
        },
        amount: parseFloat(amount)
      }
    });

  } catch (error) {
    console.error('Payment validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during validation' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint untuk mendapatkan senarai packages dan locations yang aktif
 */
export async function GET(request: NextRequest) {
  try {
    // Dapatkan semua packages yang aktif
    const activePackages = await db
      .select()
      .from(packages)
      .where(eq(packages.isActive, true))
      .orderBy(packages.sortOrder);

    // Dapatkan semua locations yang aktif
    const activeLocations = await db
      .select()
      .from(locations)
      .where(eq(locations.isActive, true))
      .orderBy(locations.name);

    return NextResponse.json({
      success: true,
      packages: activePackages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        period: pkg.period,
        features: pkg.features
      })),
      locations: activeLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        capacity: loc.capacity,
        currentCount: loc.currentCount,
        availability: loc.availability,
        features: loc.features
      }))
    });

  } catch (error) {
    console.error('Error fetching validation data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch validation data' 
      },
      { status: 500 }
    );
  }
}