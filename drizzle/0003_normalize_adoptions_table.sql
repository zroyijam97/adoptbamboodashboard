-- Migration to normalize adoptions table and improve data consistency
-- Remove redundant fields and strengthen foreign key relationships

-- First, ensure all existing adoptions have proper foreign key references
-- Update packageId based on packageName where possible
UPDATE adoptions 
SET package_id = packages.id 
FROM packages 
WHERE adoptions.package_name = packages.name 
AND adoptions.package_id IS NULL;

-- Update packageId based on packagePeriod where packageName didn't match
UPDATE adoptions 
SET package_id = packages.id 
FROM packages 
WHERE adoptions.package_period = packages.period 
AND adoptions.package_id IS NULL;

-- Update locationId based on locationName where possible
UPDATE adoptions 
SET location_id = locations.id 
FROM locations 
WHERE adoptions.location_name = locations.name 
AND adoptions.location_id IS NULL;

-- Add NOT NULL constraints to critical foreign keys after data cleanup
-- Note: We'll keep these as nullable for now to handle edge cases
-- ALTER TABLE adoptions ALTER COLUMN package_id SET NOT NULL;
-- ALTER TABLE adoptions ALTER COLUMN location_id SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_adoptions_user_id ON adoptions(user_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_package_id ON adoptions(package_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_location_id ON adoptions(location_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_payment_ref ON adoptions(payment_reference_no);
CREATE INDEX IF NOT EXISTS idx_adoptions_active ON adoptions(is_active);

-- Add indexes to payments table for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_package_type ON payments(package_type);
CREATE INDEX IF NOT EXISTS idx_payments_location_id ON payments(location_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Add indexes to users table
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add indexes to packages table
CREATE INDEX IF NOT EXISTS idx_packages_period ON packages(period);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);

-- Add indexes to locations table
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);

-- Add constraint to ensure payment reference is unique when not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_adoptions_payment_ref_unique 
ON adoptions(payment_reference_no) 
WHERE payment_reference_no IS NOT NULL;

-- Add constraint to ensure one active adoption per payment reference
CREATE UNIQUE INDEX IF NOT EXISTS idx_adoptions_active_payment_ref 
ON adoptions(payment_reference_no) 
WHERE payment_reference_no IS NOT NULL AND is_active = true;

-- Add check constraint to ensure adoption price is positive
ALTER TABLE adoptions 
ADD CONSTRAINT check_adoption_price_positive 
CHECK (adoption_price::numeric > 0);

-- Add check constraint to ensure payment amount is positive
ALTER TABLE payments 
ADD CONSTRAINT check_payment_amount_positive 
CHECK (amount::numeric > 0);

-- Add check constraint for valid payment status
ALTER TABLE payments 
ADD CONSTRAINT check_payment_status_valid 
CHECK (status IN ('pending', 'success', 'failed', 'cancelled'));

-- Add check constraint for valid package period
ALTER TABLE packages 
ADD CONSTRAINT check_package_period_valid 
CHECK (period IN ('monthly', 'quarterly', 'yearly'));

-- Add comments for documentation
COMMENT ON TABLE adoptions IS 'Normalized adoption records with proper foreign key relationships';
COMMENT ON COLUMN adoptions.package_id IS 'Foreign key to packages table - primary reference';
COMMENT ON COLUMN adoptions.location_id IS 'Foreign key to locations table - primary reference';
COMMENT ON COLUMN adoptions.package_name IS 'Historical package name for data integrity';
COMMENT ON COLUMN adoptions.location_name IS 'Historical location name for data integrity';
COMMENT ON COLUMN adoptions.payment_reference_no IS 'Unique reference to payment record';

COMMENT ON TABLE payments IS 'Enhanced payment records with validation constraints';
COMMENT ON COLUMN payments.package_type IS 'Package identifier (ID or period) for adoption creation';
COMMENT ON COLUMN payments.location_id IS 'Location identifier (ID or name) for adoption creation';

COMMENT ON INDEX idx_adoptions_active_payment_ref IS 'Ensures only one active adoption per payment';
COMMENT ON INDEX idx_adoptions_payment_ref_unique IS 'Ensures payment reference uniqueness';