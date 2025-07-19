/**
 * Centralized Validation Utility
 * Provides consistent validation schemas and functions across the application
 */

import { ApiError, ApiErrorType } from './api-response';

// Base validation interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

// Common validation schemas
export const ValidationSchemas = {
  // User validation
  user: {
    email: (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    phone: (phone: string): boolean => {
      // Malaysian phone number format
      const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
      return phoneRegex.test(phone.replace(/\s/g, ''));
    },
    name: (name: string): boolean => {
      return name.trim().length >= 2 && name.trim().length <= 100;
    }
  },

  // Package validation
  package: {
    name: (name: string): boolean => {
      return name.trim().length >= 3 && name.trim().length <= 100;
    },
    price: (price: string | number): boolean => {
      const numPrice = typeof price === 'string' ? parseFloat(price) : price;
      return !isNaN(numPrice) && numPrice > 0 && numPrice <= 10000;
    },
    period: (period: string): boolean => {
      const validPeriods = ['monthly', 'quarterly', 'annual'];
      return validPeriods.includes(period.toLowerCase());
    }
  },

  // Location validation
  location: {
    name: (name: string): boolean => {
      return name.trim().length >= 3 && name.trim().length <= 200;
    },
    coordinates: (lat: string, lng: string): boolean => {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      return !isNaN(latitude) && !isNaN(longitude) &&
             latitude >= -90 && latitude <= 90 &&
             longitude >= -180 && longitude <= 180;
    },
    capacity: (capacity: number): boolean => {
      return Number.isInteger(capacity) && capacity > 0 && capacity <= 100000;
    }
  },

  // Payment validation
  payment: {
    amount: (amount: string | number): boolean => {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return !isNaN(numAmount) && numAmount > 0 && numAmount <= 50000;
    },
    referenceNo: (refNo: string): boolean => {
      return /^[A-Z0-9]{10,20}$/.test(refNo);
    }
  }
};

// Validation helper class
export class Validator {
  private errors: string[] = [];

  // Reset errors
  reset(): void {
    this.errors = [];
  }

  // Add error
  addError(message: string): void {
    this.errors.push(message);
  }

  // Check if field is required
  required(value: any, fieldName: string): this {
    if (value === undefined || value === null || 
        (typeof value === 'string' && value.trim() === '')) {
      this.addError(`${fieldName} is required`);
    }
    return this;
  }

  // Validate email
  email(email: string, fieldName: string = 'Email'): this {
    if (email && !ValidationSchemas.user.email(email)) {
      this.addError(`${fieldName} must be a valid email address`);
    }
    return this;
  }

  // Validate phone
  phone(phone: string, fieldName: string = 'Phone'): this {
    if (phone && !ValidationSchemas.user.phone(phone)) {
      this.addError(`${fieldName} must be a valid Malaysian phone number`);
    }
    return this;
  }

  // Validate string length
  stringLength(value: string, min: number, max: number, fieldName: string): this {
    if (value) {
      const length = value.trim().length;
      if (length < min || length > max) {
        this.addError(`${fieldName} must be between ${min} and ${max} characters`);
      }
    }
    return this;
  }

  // Validate number range
  numberRange(value: number, min: number, max: number, fieldName: string): this {
    if (value !== undefined && value !== null) {
      if (isNaN(value) || value < min || value > max) {
        this.addError(`${fieldName} must be between ${min} and ${max}`);
      }
    }
    return this;
  }

  // Validate enum values
  enum(value: string, validValues: string[], fieldName: string): this {
    if (value && !validValues.includes(value)) {
      this.addError(`${fieldName} must be one of: ${validValues.join(', ')}`);
    }
    return this;
  }

  // Custom validation
  custom(condition: boolean, message: string): this {
    if (!condition) {
      this.addError(message);
    }
    return this;
  }

  // Get validation result
  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors]
    };
  }

  // Throw validation error if invalid
  throwIfInvalid(): void {
    if (this.errors.length > 0) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Validation failed',
        400,
        { errors: this.errors }
      );
    }
  }
}

// Specific validation functions
export const validateUserData = (data: any): ValidationResult => {
  const validator = new Validator();
  
  validator
    .required(data.email, 'Email')
    .email(data.email)
    .required(data.firstName, 'First Name')
    .stringLength(data.firstName, 2, 50, 'First Name')
    .required(data.lastName, 'Last Name')
    .stringLength(data.lastName, 2, 50, 'Last Name');

  if (data.phone) {
    validator.phone(data.phone);
  }

  return validator.getResult();
};

export const validatePackageData = (data: any): ValidationResult => {
  const validator = new Validator();
  
  validator
    .required(data.name, 'Package Name')
    .stringLength(data.name, 3, 100, 'Package Name')
    .required(data.price, 'Price')
    .custom(ValidationSchemas.package.price(data.price), 'Price must be a valid amount')
    .required(data.period, 'Period')
    .enum(data.period, ['monthly', 'quarterly', 'annual'], 'Period')
    .stringLength(data.description || '', 0, 500, 'Description');

  return validator.getResult();
};

export const validateLocationData = (data: any): ValidationResult => {
  const validator = new Validator();
  
  validator
    .required(data.name, 'Location Name')
    .stringLength(data.name, 3, 200, 'Location Name')
    .stringLength(data.address || '', 0, 300, 'Address')
    .stringLength(data.description || '', 0, 500, 'Description');

  if (data.latitude && data.longitude) {
    validator.custom(
      ValidationSchemas.location.coordinates(data.latitude, data.longitude),
      'Invalid coordinates'
    );
  }

  if (data.capacity) {
    validator.custom(
      ValidationSchemas.location.capacity(parseInt(data.capacity)),
      'Capacity must be a valid number'
    );
  }

  return validator.getResult();
};

export const validatePaymentData = (data: any): ValidationResult => {
  const validator = new Validator();
  
  validator
    .required(data.amount, 'Amount')
    .custom(ValidationSchemas.payment.amount(data.amount), 'Invalid payment amount')
    .required(data.customerName, 'Customer Name')
    .stringLength(data.customerName, 2, 100, 'Customer Name')
    .required(data.customerEmail, 'Customer Email')
    .email(data.customerEmail, 'Customer Email')
    .required(data.description, 'Description')
    .stringLength(data.description, 5, 200, 'Description');

  if (data.customerPhone) {
    validator.phone(data.customerPhone, 'Customer Phone');
  }

  return validator.getResult();
};

// Utility function to validate and throw
export const validateAndThrow = (data: any, validationFn: (data: any) => ValidationResult): void => {
  const result = validationFn(data);
  if (!result.isValid) {
    throw new ApiError(
      ApiErrorType.VALIDATION_ERROR,
      'Validation failed',
      400,
      { errors: result.errors }
    );
  }
};

// Export default validator instance
export const validator = new Validator();