/**
 * Application Constants
 * Centralized constants for consistent usage across the application
 */

// Application Configuration
export const APP_CONFIG = {
  NAME: 'Adopt Bamboo System',
  VERSION: '1.0.0',
  DESCRIPTION: 'Bamboo adoption and environmental impact tracking system',
  AUTHOR: 'Adopt Bamboo Team',
  CONTACT_EMAIL: 'support@adoptbamboo.com',
  WEBSITE: 'https://adoptbamboo.com'
} as const;

// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  }
} as const;

// Database Configuration
export const DB_CONFIG = {
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  QUERY_TIMEOUT: 30000, // 30 seconds
  MAX_CONNECTIONS: 10,
  IDLE_TIMEOUT: 30000 // 30 seconds
} as const;

// Package Types and Periods
export const PACKAGE_TYPES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual'
} as const;

export const PACKAGE_PERIODS = Object.values(PACKAGE_TYPES);

// Plant Types
export const PLANT_TYPES = {
  BAMBOO: 'bamboo',
  TREE: 'tree'
} as const;

// Plant Status
export const PLANT_STATUS = {
  PLANTED: 'planted',
  GROWING: 'growing',
  MATURE: 'mature',
  HARVESTED: 'harvested'
} as const;

// Adoption Status
export const ADOPTION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
} as const;

// Currency
export const CURRENCY = {
  CODE: 'MYR',
  SYMBOL: 'RM',
  NAME: 'Malaysian Ringgit'
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
} as const;

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  PATHS: {
    CERTIFICATES: '/uploads/certificates',
    PLANTS: '/uploads/plants',
    LOCATIONS: '/uploads/locations',
    PROFILES: '/uploads/profiles'
  }
} as const;

// Validation Limits
export const VALIDATION_LIMITS = {
  USER: {
    NAME_MIN: 2,
    NAME_MAX: 100,
    EMAIL_MAX: 255,
    PHONE_MIN: 10,
    PHONE_MAX: 15
  },
  PACKAGE: {
    NAME_MIN: 3,
    NAME_MAX: 100,
    DESCRIPTION_MAX: 500,
    PRICE_MIN: 1,
    PRICE_MAX: 10000
  },
  LOCATION: {
    NAME_MIN: 3,
    NAME_MAX: 200,
    ADDRESS_MAX: 300,
    DESCRIPTION_MAX: 500,
    CAPACITY_MIN: 1,
    CAPACITY_MAX: 100000
  },
  PLANT: {
    NAME_MIN: 2,
    NAME_MAX: 100,
    DESCRIPTION_MAX: 500,
    HEIGHT_MIN: 0,
    HEIGHT_MAX: 1000 // cm
  }
} as const;

// Environmental Impact Constants
export const ENVIRONMENTAL_IMPACT = {
  BAMBOO: {
    CO2_ABSORPTION_PER_YEAR: 35, // kg CO2 per bamboo per year
    OXYGEN_PRODUCTION_PER_YEAR: 25, // kg O2 per bamboo per year
    GROWTH_RATE_PER_MONTH: 10, // cm per month
    MATURITY_MONTHS: 36 // months to reach maturity
  },
  TREE: {
    CO2_ABSORPTION_PER_YEAR: 22, // kg CO2 per tree per year
    OXYGEN_PRODUCTION_PER_YEAR: 16, // kg O2 per tree per year
    GROWTH_RATE_PER_MONTH: 5, // cm per month
    MATURITY_MONTHS: 60 // months to reach maturity
  }
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  ADOPTION_CONFIRMED: 'adoption_confirmed',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PLANT_UPDATE: 'plant_update',
  CERTIFICATE_READY: 'certificate_ready',
  SYSTEM_MAINTENANCE: 'system_maintenance'
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  ADOPTION_CONFIRMATION: 'adoption_confirmation',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  CERTIFICATE_READY: 'certificate_ready',
  PASSWORD_RESET: 'password_reset'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  VALIDATION: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  DATABASE_ERROR: 'Database operation failed. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  FILE_UPLOAD_ERROR: 'File upload failed. Please try again.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ADOPTION_CREATED: 'Bamboo adoption successful!',
  PAYMENT_COMPLETED: 'Payment completed successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  EMAIL_SENT: 'Email sent successfully.',
  FILE_UPLOADED: 'File uploaded successfully.',
  DATA_SAVED: 'Data saved successfully.',
  DATA_DELETED: 'Data deleted successfully.'
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 24 * 60 * 60, // 24 hours
    VERY_LONG: 7 * 24 * 60 * 60 // 7 days
  },
  KEYS: {
    USER_PROFILE: 'user_profile',
    PACKAGES: 'packages',
    LOCATIONS: 'locations',
    STATISTICS: 'statistics'
  }
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_MY: /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^[0-9]+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_CACHING: true,
  ENABLE_RATE_LIMITING: true,
  ENABLE_FILE_UPLOAD: true,
  ENABLE_EMAIL_VERIFICATION: true,
  ENABLE_TWO_FACTOR_AUTH: false,
  ENABLE_DARK_MODE: true
} as const;

// Type exports for better TypeScript support
export type PackageType = typeof PACKAGE_TYPES[keyof typeof PACKAGE_TYPES];
export type PlantType = typeof PLANT_TYPES[keyof typeof PLANT_TYPES];
export type PlantStatus = typeof PLANT_STATUS[keyof typeof PLANT_STATUS];
export type AdoptionStatus = typeof ADOPTION_STATUS[keyof typeof ADOPTION_STATUS];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];