/**
 * Formatting Utilities
 * Centralized formatting functions for consistent data display
 */

import { CURRENCY, DATE_FORMATS } from './constants';

// Currency formatting
export class CurrencyFormatter {
  /**
   * Format price to Malaysian Ringgit with proper symbol
   * @param price - Price value (string or number)
   * @param showSymbol - Whether to show currency symbol (default: true)
   * @returns Formatted price string
   */
  static format(price: string | number, showSymbol: boolean = true): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) {
      return showSymbol ? `${CURRENCY.SYMBOL}0.00` : '0.00';
    }

    const formatted = numPrice.toFixed(2);
    return showSymbol ? `${CURRENCY.SYMBOL}${formatted}` : formatted;
  }

  /**
   * Parse price string to number
   * @param priceString - Price string (e.g., "RM35.00" or "35.00")
   * @returns Parsed number or 0 if invalid
   */
  static parse(priceString: string): number {
    if (!priceString) return 0;
    
    // Remove currency symbol and spaces
    const cleanPrice = priceString.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleanPrice);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Format price for API (always returns string without symbol)
   * @param price - Price value
   * @returns Formatted price string for API
   */
  static formatForApi(price: string | number): string {
    return this.format(price, false);
  }

  /**
   * Calculate total from array of prices
   * @param prices - Array of price values
   * @returns Total sum
   */
  static calculateTotal(prices: (string | number)[]): number {
    return prices.reduce((total: number, price) => {
      const numPrice = typeof price === 'string' ? this.parse(price) : price;
      return total + (isNaN(numPrice) ? 0 : numPrice);
    }, 0);
  }

  /**
   * Calculate average from array of prices
   * @param prices - Array of price values
   * @returns Average value
   */
  static calculateAverage(prices: (string | number)[]): number {
    if (prices.length === 0) return 0;
    const total = this.calculateTotal(prices);
    return total / prices.length;
  }
}

// Date formatting
export class DateFormatter {
  /**
   * Format date for display (DD/MM/YYYY)
   * @param date - Date object, string, or timestamp
   * @returns Formatted date string
   */
  static formatDisplay(date: Date | string | number): string {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch {
      return 'Invalid Date';
    }
  }

  /**
   * Format date with time for display (DD/MM/YYYY HH:mm)
   * @param date - Date object, string, or timestamp
   * @returns Formatted date and time string
   */
  static formatDisplayWithTime(date: Date | string | number): string {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return 'Invalid Date';
    }
  }

  /**
   * Format date for API (YYYY-MM-DD)
   * @param date - Date object, string, or timestamp
   * @returns Formatted date string for API
   */
  static formatForApi(date: Date | string | number): string {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return '';
      
      return dateObj.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  /**
   * Format relative time (e.g., "2 days ago", "in 3 hours")
   * @param date - Date object, string, or timestamp
   * @returns Relative time string
   */
  static formatRelative(date: Date | string | number): string {
    try {
      const dateObj = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffDays > 0) {
        return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
      } else if (diffDays < 0) {
        const futureDays = Math.abs(diffDays);
        return futureDays === 1 ? 'in 1 day' : `in ${futureDays} days`;
      } else if (diffHours > 0) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      } else if (diffHours < 0) {
        const futureHours = Math.abs(diffHours);
        return futureHours === 1 ? 'in 1 hour' : `in ${futureHours} hours`;
      } else if (diffMinutes > 0) {
        return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
      } else if (diffMinutes < 0) {
        const futureMinutes = Math.abs(diffMinutes);
        return futureMinutes === 1 ? 'in 1 minute' : `in ${futureMinutes} minutes`;
      } else {
        return 'just now';
      }
    } catch {
      return 'Invalid Date';
    }
  }

  /**
   * Get month name from date
   * @param date - Date object, string, or timestamp
   * @param short - Whether to return short month name (default: false)
   * @returns Month name
   */
  static getMonthName(date: Date | string | number, short: boolean = false): string {
    try {
      const dateObj = new Date(date);
      const options: Intl.DateTimeFormatOptions = { 
        month: short ? 'short' : 'long' 
      };
      return dateObj.toLocaleDateString('en-US', options);
    } catch {
      return 'Invalid';
    }
  }
}

// Number formatting
export class NumberFormatter {
  /**
   * Format number with thousand separators
   * @param num - Number to format
   * @param decimals - Number of decimal places (default: 0)
   * @returns Formatted number string
   */
  static format(num: number, decimals: number = 0): string {
    if (isNaN(num)) return '0';
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Format percentage
   * @param value - Value to format as percentage
   * @param total - Total value for percentage calculation
   * @param decimals - Number of decimal places (default: 1)
   * @returns Formatted percentage string
   */
  static formatPercentage(value: number, total: number, decimals: number = 1): string {
    if (total === 0 || isNaN(value) || isNaN(total)) return '0%';
    
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
  }

  /**
   * Format file size in human readable format
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Format duration in human readable format
   * @param seconds - Duration in seconds
   * @returns Formatted duration string
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }
}

// String formatting
export class StringFormatter {
  /**
   * Capitalize first letter of each word
   * @param str - String to capitalize
   * @returns Capitalized string
   */
  static titleCase(str: string): string {
    if (!str) return '';
    
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Convert string to sentence case
   * @param str - String to convert
   * @returns Sentence case string
   */
  static sentenceCase(str: string): string {
    if (!str) return '';
    
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Truncate string with ellipsis
   * @param str - String to truncate
   * @param maxLength - Maximum length
   * @param suffix - Suffix to add (default: '...')
   * @returns Truncated string
   */
  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (!str || str.length <= maxLength) return str;
    
    return str.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Convert string to slug (URL-friendly)
   * @param str - String to convert
   * @returns Slug string
   */
  static toSlug(str: string): string {
    if (!str) return '';
    
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Mask sensitive information (e.g., email, phone)
   * @param str - String to mask
   * @param visibleChars - Number of visible characters at start and end
   * @param maskChar - Character to use for masking (default: '*')
   * @returns Masked string
   */
  static mask(str: string, visibleChars: number = 2, maskChar: string = '*'): string {
    if (!str || str.length <= visibleChars * 2) return str;
    
    const start = str.substring(0, visibleChars);
    const end = str.substring(str.length - visibleChars);
    const middle = maskChar.repeat(str.length - visibleChars * 2);
    
    return start + middle + end;
  }

  /**
   * Extract initials from name
   * @param name - Full name
   * @param maxInitials - Maximum number of initials (default: 2)
   * @returns Initials string
   */
  static getInitials(name: string, maxInitials: number = 2): string {
    if (!name) return '';
    
    const words = name.trim().split(/\s+/);
    const initials = words
      .slice(0, maxInitials)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    return initials;
  }
}

// Phone formatting
export class PhoneFormatter {
  /**
   * Format Malaysian phone number
   * @param phone - Phone number string
   * @returns Formatted phone number
   */
  static formatMalaysian(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (digits.startsWith('601')) {
      // +601X-XXXX-XXXX
      const match = digits.match(/^(601)(\d{1})(\d{4})(\d{4})$/);
      if (match) {
        return `+${match[1]}${match[2]}-${match[3]}-${match[4]}`;
      }
    } else if (digits.startsWith('01')) {
      // 01X-XXXX-XXXX
      const match = digits.match(/^(01)(\d{1})(\d{4})(\d{4})$/);
      if (match) {
        return `${match[1]}${match[2]}-${match[3]}-${match[4]}`;
      }
    }
    
    return phone; // Return original if no format matches
  }

  /**
   * Get international format of Malaysian phone
   * @param phone - Phone number string
   * @returns International format phone number
   */
  static toInternational(phone: string): string {
    if (!phone) return '';
    
    const digits = phone.replace(/\D/g, '');
    
    if (digits.startsWith('01')) {
      return `+6${digits}`;
    } else if (digits.startsWith('601')) {
      return `+${digits}`;
    }
    
    return phone;
  }
}

// Export all formatters as a single object for convenience
export const Formatters = {
  Currency: CurrencyFormatter,
  Date: DateFormatter,
  Number: NumberFormatter,
  String: StringFormatter,
  Phone: PhoneFormatter
};