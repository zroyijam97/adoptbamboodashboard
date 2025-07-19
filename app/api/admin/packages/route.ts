import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder, withErrorHandling } from '@/lib/api-response';
import { validatePackageData, validateAndThrow } from '@/lib/validation';
import { CurrencyFormatter } from '@/lib/formatters';
import { PACKAGE_PERIODS } from '@/lib/constants';

// GET - Fetch all packages
export const GET = withErrorHandling(async () => {
  try {
    logger.info('Fetching all packages');
    
    const allPackages = await db.select().from(packages).orderBy(packages.sortOrder);
    
    // Format prices for consistent display
    const formattedPackages = allPackages.map(pkg => ({
      ...pkg,
      formattedPrice: CurrencyFormatter.format(pkg.price),
      features: pkg.features ? JSON.parse(pkg.features) : []
    }));
    
    logger.info(`Successfully fetched ${allPackages.length} packages`);
    return ApiResponseBuilder.success(formattedPackages, 'Packages fetched successfully');
  } catch (error) {
    logger.error('Error fetching packages:', error);
    return ApiResponseBuilder.databaseError('fetchPackages', error);
  }
}, 'fetchPackages');

// POST - Create new package
export const POST = withErrorHandling(async (request: Request) => {
  try {
    const body = await request.json();
    
    logger.info('Creating new package', { packageName: body.name });
    
    // Validate input data
    validateAndThrow(body, validatePackageData);
    
    // Additional validation for period
    if (!PACKAGE_PERIODS.includes(body.period)) {
      return ApiResponseBuilder.validationError(
        `Period must be one of: ${PACKAGE_PERIODS.join(', ')}`
      );
    }
    
    const { name, description, price, period, features, isActive, sortOrder, plantingLocationId } = body;
    
    const packageData = {
      name: name.trim(),
      description: description?.trim() || '',
      price: CurrencyFormatter.formatForApi(price),
      period,
      features: JSON.stringify(features || []),
      isActive: isActive ?? true,
      sortOrder: sortOrder || 0,
      plantingLocationId: plantingLocationId ? parseInt(plantingLocationId) : null,
    };
    
    const newPackage = await db.insert(packages).values(packageData).returning();
    
    const formattedPackage = {
      ...newPackage[0],
      formattedPrice: CurrencyFormatter.format(newPackage[0].price),
      features: JSON.parse(newPackage[0].features || '[]')
    };
    
    logger.info('Package created successfully', { packageId: newPackage[0].id });
    return ApiResponseBuilder.success(formattedPackage, 'Package created successfully', 201);
  } catch (error) {
    logger.error('Error creating package:', error);
    return ApiResponseBuilder.databaseError('createPackage', error);
  }
}, 'createPackage');

// PUT - Update package
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, price, period, features, isActive, sortOrder, plantingLocationId } = body;

    const updatedPackage = await db.update(packages)
      .set({
        name: name?.trim(),
        description: description?.trim(),
        price: price ? CurrencyFormatter.formatForApi(price) : undefined,
        period,
        features: features ? JSON.stringify(features) : undefined,
        isActive,
        sortOrder,
        plantingLocationId: plantingLocationId ? parseInt(plantingLocationId) : null,
      })
      .where(eq(packages.id, parseInt(id)))
      .returning();

    if (updatedPackage.length === 0) {
      return ApiResponseBuilder.notFound('Package');
    }

    const formattedPackage = {
      ...updatedPackage[0],
      formattedPrice: CurrencyFormatter.format(updatedPackage[0].price),
      features: JSON.parse(updatedPackage[0].features || '[]')
    };

    return ApiResponseBuilder.success(formattedPackage, 'Package updated successfully');
  } catch (error) {
    logger.error('Error updating package:', error);
    return ApiResponseBuilder.internalError('Failed to update package');
  }
}

// DELETE - Delete package
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponseBuilder.validationError('Package ID is required');
    }

    const deletedPackage = await db.delete(packages)
      .where(eq(packages.id, parseInt(id)))
      .returning();

    if (deletedPackage.length === 0) {
      return ApiResponseBuilder.notFound('Package');
    }

    return ApiResponseBuilder.success(null, 'Package deleted successfully');
  } catch (error) {
    logger.error('Error deleting package:', error);
    return ApiResponseBuilder.internalError('Failed to delete package');
  }
}