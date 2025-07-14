/**
 * Environment Variables Validation Utility
 * Validates all required environment variables for the application
 */

export interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: string;
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: string;
  
  // ToyyibPay
  TOYYIBPAY_SECRET_KEY: string;
  TOYYIBPAY_CATEGORY_CODE: string;
  TOYYIBPAY_BASE_URL: string;
  
  // Optional
  CLERK_WEBHOOK_SECRET?: string;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
}

const requiredEnvVars: (keyof EnvironmentConfig)[] = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  'TOYYIBPAY_SECRET_KEY',
  'TOYYIBPAY_CATEGORY_CODE',
  'TOYYIBPAY_BASE_URL',
];

export function validateEnvironment(): EnvironmentConfig {
  const missingVars: string[] = [];
  const config: Partial<EnvironmentConfig> = {};

  // Check required variables
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      (config as any)[varName] = value;
    }
  }

  // Check optional variables
  if (process.env.CLERK_WEBHOOK_SECRET) {
    config.CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  }
  if (process.env.NEXTAUTH_URL) {
    config.NEXTAUTH_URL = process.env.NEXTAUTH_URL;
  }
  if (process.env.NEXTAUTH_SECRET) {
    config.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please check ENVIRONMENT_SETUP.md for configuration guide');
    console.error('🔗 Vercel: https://vercel.com/docs/concepts/projects/environment-variables');
    
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate specific formats
  if (config.DATABASE_URL && !config.DATABASE_URL.startsWith('postgresql://') && !config.DATABASE_URL.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (config.TOYYIBPAY_BASE_URL && !config.TOYYIBPAY_BASE_URL.startsWith('https://')) {
    throw new Error('TOYYIBPAY_BASE_URL must be a valid HTTPS URL');
  }

  console.log('✅ All environment variables validated successfully');
  return config as EnvironmentConfig;
}

export function getEnvironmentInfo() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    VERCEL: process.env.VERCEL || false,
    VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    VERCEL_URL: process.env.VERCEL_URL || 'localhost:3000',
  };
}

// Export validated config
export const env = validateEnvironment();