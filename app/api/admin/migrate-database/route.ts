import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * API endpoint untuk menjalankan database migration
 * Menormalkan data dan menambah constraints untuk data integrity
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting database migration...');

    // Check if migration has already been run
    const migrationCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_adoption_price_positive'
        AND table_name = 'adoptions'
      ) as migration_exists
    `);

    if (migrationCheck.rows[0]?.migration_exists) {
      return NextResponse.json({
        success: true,
        message: 'Migration already completed',
        alreadyMigrated: true
      });
    }

    const migrationSteps = [];

    // Step 1: Update packageId based on packageName
    console.log('Step 1: Updating packageId based on packageName...');
    const packageNameUpdate = await db.execute(sql`
      UPDATE adoptions 
      SET package_id = packages.id 
      FROM packages 
      WHERE adoptions.package_name = packages.name 
      AND adoptions.package_id IS NULL
    `);
    migrationSteps.push(`Updated ${packageNameUpdate.rowCount} adoptions with packageId from packageName`);

    // Step 2: Update packageId based on packagePeriod
    console.log('Step 2: Updating packageId based on packagePeriod...');
    const packagePeriodUpdate = await db.execute(sql`
      UPDATE adoptions 
      SET package_id = packages.id 
      FROM packages 
      WHERE adoptions.package_period = packages.period 
      AND adoptions.package_id IS NULL
    `);
    migrationSteps.push(`Updated ${packagePeriodUpdate.rowCount} adoptions with packageId from packagePeriod`);

    // Step 3: Update locationId based on locationName
    console.log('Step 3: Updating locationId based on locationName...');
    const locationUpdate = await db.execute(sql`
      UPDATE adoptions 
      SET location_id = locations.id 
      FROM locations 
      WHERE adoptions.location_name = locations.name 
      AND adoptions.location_id IS NULL
    `);
    migrationSteps.push(`Updated ${locationUpdate.rowCount} adoptions with locationId from locationName`);

    // Step 4: Create indexes for better performance
    console.log('Step 4: Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_adoptions_user_id ON adoptions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_adoptions_package_id ON adoptions(package_id)',
      'CREATE INDEX IF NOT EXISTS idx_adoptions_location_id ON adoptions(location_id)',
      'CREATE INDEX IF NOT EXISTS idx_adoptions_payment_ref ON adoptions(payment_reference_no)',
      'CREATE INDEX IF NOT EXISTS idx_adoptions_active ON adoptions(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
      'CREATE INDEX IF NOT EXISTS idx_payments_package_type ON payments(package_type)',
      'CREATE INDEX IF NOT EXISTS idx_payments_location_id ON payments(location_id)',
      'CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_packages_period ON packages(period)',
      'CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name)',
      'CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active)'
    ];

    for (const indexSql of indexes) {
      await db.execute(sql.raw(indexSql));
    }
    migrationSteps.push(`Created ${indexes.length} indexes`);

    // Step 5: Create unique constraints
    console.log('Step 5: Creating unique constraints...');
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_adoptions_payment_ref_unique 
      ON adoptions(payment_reference_no) 
      WHERE payment_reference_no IS NOT NULL
    `);
    
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_adoptions_active_payment_ref 
      ON adoptions(payment_reference_no) 
      WHERE payment_reference_no IS NOT NULL AND is_active = true
    `);
    migrationSteps.push('Created unique constraints for payment references');

    // Step 6: Add check constraints
    console.log('Step 6: Adding check constraints...');
    try {
      await db.execute(sql`
        ALTER TABLE adoptions 
        ADD CONSTRAINT check_adoption_price_positive 
        CHECK (adoption_price::numeric > 0)
      `);
      migrationSteps.push('Added adoption price positive constraint');
    } catch (error) {
      console.log('Adoption price constraint already exists or failed:', error);
    }

    try {
      await db.execute(sql`
        ALTER TABLE payments 
        ADD CONSTRAINT check_payment_amount_positive 
        CHECK (amount::numeric > 0)
      `);
      migrationSteps.push('Added payment amount positive constraint');
    } catch (error) {
      console.log('Payment amount constraint already exists or failed:', error);
    }

    try {
      await db.execute(sql`
        ALTER TABLE payments 
        ADD CONSTRAINT check_payment_status_valid 
        CHECK (status IN ('pending', 'success', 'failed', 'cancelled'))
      `);
      migrationSteps.push('Added payment status validation constraint');
    } catch (error) {
      console.log('Payment status constraint already exists or failed:', error);
    }

    try {
      await db.execute(sql`
        ALTER TABLE packages 
        ADD CONSTRAINT check_package_period_valid 
        CHECK (period IN ('monthly', 'quarterly', 'yearly'))
      `);
      migrationSteps.push('Added package period validation constraint');
    } catch (error) {
      console.log('Package period constraint already exists or failed:', error);
    }

    // Step 7: Add table comments
    console.log('Step 7: Adding table comments...');
    await db.execute(sql`
      COMMENT ON TABLE adoptions IS 'Normalized adoption records with proper foreign key relationships'
    `);
    await db.execute(sql`
      COMMENT ON TABLE payments IS 'Enhanced payment records with validation constraints'
    `);
    migrationSteps.push('Added table documentation comments');

    console.log('Database migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      migrationSteps,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database migration error:', error);
    return NextResponse.json(
      { 
        error: 'Database migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint untuk memeriksa status migration
 */
export async function GET(request: NextRequest) {
  try {
    // Check various migration indicators
    const checks = {
      adoptionPriceConstraint: false,
      paymentAmountConstraint: false,
      paymentStatusConstraint: false,
      packagePeriodConstraint: false,
      adoptionIndexes: false,
      paymentIndexes: false
    };

    // Check constraints
    const constraintCheck = await db.execute(sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name IN ('adoptions', 'payments', 'packages')
      AND constraint_type = 'CHECK'
    `);

    const constraints = constraintCheck.rows.map(row => row.constraint_name);
    checks.adoptionPriceConstraint = constraints.includes('check_adoption_price_positive');
    checks.paymentAmountConstraint = constraints.includes('check_payment_amount_positive');
    checks.paymentStatusConstraint = constraints.includes('check_payment_status_valid');
    checks.packagePeriodConstraint = constraints.includes('check_package_period_valid');

    // Check indexes
    const indexCheck = await db.execute(sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('adoptions', 'payments', 'users', 'packages', 'locations')
      AND indexname LIKE 'idx_%'
    `);

    const indexes = indexCheck.rows.map(row => (row as any).indexname as string);
    checks.adoptionIndexes = indexes.some(idx => idx.startsWith('idx_adoptions_'));
    checks.paymentIndexes = indexes.some(idx => idx.startsWith('idx_payments_'));

    const migrationComplete = Object.values(checks).every(check => check === true);

    return NextResponse.json({
      success: true,
      migrationComplete,
      checks,
      totalConstraints: constraints.length,
      totalIndexes: indexes.length,
      constraints,
      indexes
    });

  } catch (error) {
    console.error('Migration status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}