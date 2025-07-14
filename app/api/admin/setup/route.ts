import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUsers } from '@/lib/schema';

export async function POST() {
  try {
    // Add azrulnizamazmi.usm@gmail.com as admin
    const adminEmail = 'azrulnizamazmi.usm@gmail.com';
    
    const result = await db.insert(adminUsers).values({
      email: adminEmail,
      role: 'super_admin',
      isActive: true,
    }).onConflictDoNothing().returning();
    
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create admin user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}