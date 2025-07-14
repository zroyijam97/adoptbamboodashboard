import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

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