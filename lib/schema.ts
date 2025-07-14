import { pgTable, serial, text, timestamp, integer, decimal, boolean } from 'drizzle-orm/pg-core';

// Admin users table
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  clerkId: text('clerk_id').unique(),
  role: text('role').default('admin'), // admin, super_admin
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users table (extends Clerk user data)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Bamboo plants table
export const bambooPlants = pgTable('bamboo_plants', {
  id: serial('id').primaryKey(),
  plantCode: text('plant_code').unique().notNull(), // Unique identifier for each plant
  location: text('location').notNull(),
  plantedDate: timestamp('planted_date').notNull(),
  currentHeight: decimal('current_height', { precision: 5, scale: 2 }), // in meters
  species: text('species').default('Bambusa vulgaris'),
  status: text('status').default('growing'), // growing, mature, harvested
  co2Absorbed: decimal('co2_absorbed', { precision: 8, scale: 2 }).default('0'), // in kg
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payments table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  referenceNo: text('reference_no').unique().notNull(),
  userId: text('user_id').notNull(), // Clerk user ID
  amount: text('amount').notNull(), // stored as string to match ToyyibPay format
  description: text('description'),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  packageType: text('package_type'), // package ID or type
  locationId: text('location_id'), // selected location ID
  locationName: text('location_name'), // location name for reference
  status: text('status').default('pending'), // pending, success, failed
  gateway: text('gateway').default('toyyibpay'),
  billCode: text('bill_code'), // ToyyibPay bill code
  transactionId: text('transaction_id'), // payment gateway transaction ID
  paidAmount: text('paid_amount'), // actual amount paid
  paidDate: timestamp('paid_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Adoptions table (relationship between users and bamboo plants)
export const adoptions = pgTable('adoptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  bambooPlantId: integer('bamboo_plant_id').references(() => bambooPlants.id),
  packageId: integer('package_id').references(() => packages.id), // reference to package
  packageName: text('package_name'), // store package name for historical data
  packagePrice: text('package_price'), // store package price as string
  packagePeriod: text('package_period'), // store package period
  packageFeatures: text('package_features'), // JSON string of package features
  locationId: integer('location_id').references(() => locations.id), // reference to location
  locationName: text('location_name'), // store location name for historical data
  adoptionDate: timestamp('adoption_date').defaultNow(),
  adoptionPrice: text('adoption_price'), // changed to text to match payments
  isActive: boolean('is_active').default(true),
  certificateIssued: boolean('certificate_issued').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Growth tracking table
export const growthTracking = pgTable('growth_tracking', {
  id: serial('id').primaryKey(),
  bambooPlantId: integer('bamboo_plant_id').references(() => bambooPlants.id),
  height: decimal('height', { precision: 5, scale: 2 }).notNull(), // in meters
  diameter: decimal('diameter', { precision: 4, scale: 2 }), // in cm
  notes: text('notes'),
  photoUrl: text('photo_url'),
  recordedDate: timestamp('recorded_date').defaultNow(),
  recordedBy: text('recorded_by'), // staff member or system
});

// Environmental data table
export const environmentalData = pgTable('environmental_data', {
  id: serial('id').primaryKey(),
  bambooPlantId: integer('bamboo_plant_id').references(() => bambooPlants.id),
  soilMoisture: decimal('soil_moisture', { precision: 5, scale: 2 }), // percentage
  soilPh: decimal('soil_ph', { precision: 3, scale: 1 }),
  temperature: decimal('temperature', { precision: 4, scale: 1 }), // celsius
  humidity: decimal('humidity', { precision: 5, scale: 2 }), // percentage
  sunlightHours: decimal('sunlight_hours', { precision: 4, scale: 2 }),
  rainfall: decimal('rainfall', { precision: 6, scale: 2 }), // mm
  recordedDate: timestamp('recorded_date').defaultNow(),
});

// Locations table
export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  latitude: text('latitude'), // changed to text to match API
  longitude: text('longitude'), // changed to text to match API
  description: text('description'),
  capacity: integer('capacity'), // maximum number of bamboo plants
  currentCount: integer('current_count').default(0),
  soilType: text('soil_type'), // jenis tanah
  areaCondition: text('area_condition'), // keadaan kawasan
  features: text('features'), // JSON string of kelebihan lokasi
  image: text('image'), // emoji atau URL gambar
  coordinates: text('coordinates'), // formatted coordinates string
  availability: text('availability'), // status ketersediaan
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Packages table
export const packages = pgTable('packages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: text('price').notNull(), // changed to text to match API
  period: text('period').notNull(), // monthly, quarterly, yearly
  features: text('features'), // JSON string of features array
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Certificates table
export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  adoptionId: integer('adoption_id').references(() => adoptions.id),
  certificateNumber: text('certificate_number').unique().notNull(),
  issueDate: timestamp('issue_date').defaultNow(),
  qrCode: text('qr_code'), // QR code data for verification
  nfcData: text('nfc_data'), // NFC tag data
  pdfUrl: text('pdf_url'), // URL to generated PDF certificate
  isValid: boolean('is_valid').default(true),
});