# Coding Standards & Best Practices

Panduan standardisasi kode untuk Adopt Bamboo System untuk memastikan konsistensi, maintainability, dan kualitas kode yang tinggi.

## 📋 Table of Contents

1. [Code Quality Tools](#code-quality-tools)
2. [Project Structure](#project-structure)
3. [API Development Standards](#api-development-standards)
4. [Data Validation](#data-validation)
5. [Error Handling](#error-handling)
6. [Logging](#logging)
7. [Formatting](#formatting)
8. [TypeScript Guidelines](#typescript-guidelines)
9. [Database Operations](#database-operations)
10. [Testing](#testing)

## 🛠️ Code Quality Tools

### ESLint Configuration
- **File**: `.eslintrc.json`
- **Purpose**: Enforce code quality and consistency
- **Key Rules**:
  - No console.log in production
  - TypeScript strict rules
  - Import ordering
  - Naming conventions

### Prettier Configuration
- **File**: `.prettierrc`
- **Purpose**: Consistent code formatting
- **Settings**:
  - Single quotes
  - 2 spaces indentation
  - 100 character line width
  - Trailing commas

### Usage
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 🏗️ Project Structure

```
├── app/
│   ├── api/                 # API routes
│   ├── dashboard/           # Dashboard pages
│   └── ...
├── lib/
│   ├── api-response.ts      # Standardized API responses
│   ├── constants.ts         # Application constants
│   ├── formatters.ts        # Data formatting utilities
│   ├── logger.ts           # Centralized logging
│   ├── validation.ts       # Data validation
│   ├── db.ts              # Database connection
│   └── schema.ts          # Database schema
├── components/             # Reusable UI components
└── types/                 # TypeScript type definitions
```

## 🔌 API Development Standards

### 1. Use Standardized Response Format

```typescript
import { ApiResponseBuilder, withErrorHandling } from '@/lib/api-response';

// ✅ Good
export const GET = withErrorHandling(async () => {
  const data = await fetchData();
  return ApiResponseBuilder.success(data, 'Data fetched successfully');
});

// ❌ Bad
export async function GET() {
  try {
    const data = await fetchData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### 2. Input Validation

```typescript
import { validateAndThrow, validatePackageData } from '@/lib/validation';

export const POST = withErrorHandling(async (request: Request) => {
  const body = await request.json();
  
  // Validate input
  validateAndThrow(body, validatePackageData);
  
  // Process validated data
  // ...
});
```

### 3. Consistent Logging

```typescript
import { Logger } from '@/lib/logger';

export const POST = withErrorHandling(async (request: Request) => {
  const logger = new Logger('PackagesAPI');
  
  logger.info('Creating new package', { packageName: body.name });
  // ... processing
  logger.info('Package created successfully', { packageId: newPackage.id });
});
```

## ✅ Data Validation

### Using Validation Utilities

```typescript
import { Validator, validateUserData } from '@/lib/validation';

// Method 1: Using predefined validators
const result = validateUserData(userData);
if (!result.isValid) {
  return ApiResponseBuilder.validationError(result.errors.join(', '));
}

// Method 2: Using Validator class
const validator = new Validator();
validator
  .required(data.email, 'Email')
  .email(data.email)
  .stringLength(data.name, 2, 100, 'Name')
  .throwIfInvalid();
```

### Custom Validation

```typescript
const validator = new Validator();
validator.custom(
  data.price > 0 && data.price <= 10000,
  'Price must be between RM1 and RM10,000'
);
```

## 🚨 Error Handling

### API Error Handling

```typescript
import { ApiError, ApiErrorType } from '@/lib/api-response';

// Throw specific errors
throw new ApiError(
  ApiErrorType.NOT_FOUND,
  'Package not found',
  404,
  { packageId }
);

// Use error handling wrappers
export const GET = withDatabaseErrorHandling(async () => {
  // Database operations
});

export const POST = withErrorHandling(async (request: Request) => {
  // General operations
});
```

### Frontend Error Handling

```typescript
try {
  const response = await fetch('/api/packages');
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Operation failed');
  }
  
  return result.data;
} catch (error) {
  logger.error('Failed to fetch packages', error);
  throw error;
}
```

## 📝 Logging

### Logger Usage

```typescript
import { Logger } from '@/lib/logger';

const logger = new Logger('ComponentName');

// Different log levels
logger.debug('Debug information', { data });
logger.info('Operation completed', { userId });
logger.warn('Warning message', { warning });
logger.error('Error occurred', error);

// API-specific logging
logger.apiRequest(request, { userId });
logger.apiResponse(response, { duration: 150 });

// Database logging
logger.dbQuery('SELECT * FROM users', { duration: 50 });

// Payment logging
logger.paymentEvent('payment_success', { amount: 100, orderId: '123' });
```

### Performance Logging

```typescript
import { withPerformanceLogging } from '@/lib/logger';

const processData = withPerformanceLogging(
  async (data) => {
    // Processing logic
    return result;
  },
  'processData'
);
```

## 🎨 Formatting

### Currency Formatting

```typescript
import { CurrencyFormatter } from '@/lib/formatters';

// Format for display
const displayPrice = CurrencyFormatter.format(35.00); // "RM35.00"

// Format for API
const apiPrice = CurrencyFormatter.formatForApi(35.00); // "35.00"

// Parse price string
const numPrice = CurrencyFormatter.parse("RM35.00"); // 35.00

// Calculate totals
const total = CurrencyFormatter.calculateTotal(["35.00", "120.00"]); // 155.00
```

### Date Formatting

```typescript
import { DateFormatter } from '@/lib/formatters';

// Display format
const displayDate = DateFormatter.formatDisplay(new Date()); // "25/12/2024"

// API format
const apiDate = DateFormatter.formatForApi(new Date()); // "2024-12-25"

// Relative time
const relativeTime = DateFormatter.formatRelative(date); // "2 days ago"
```

### String Formatting

```typescript
import { StringFormatter } from '@/lib/formatters';

// Title case
const title = StringFormatter.titleCase("hello world"); // "Hello World"

// Truncate
const short = StringFormatter.truncate("Long text...", 10); // "Long te..."

// Slug
const slug = StringFormatter.toSlug("Hello World!"); // "hello-world"

// Mask sensitive data
const masked = StringFormatter.mask("user@example.com", 2); // "us***********om"
```

## 📘 TypeScript Guidelines

### Type Definitions

```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

// Use type aliases for unions
type UserRole = 'user' | 'admin' | 'super_admin';
type PaymentStatus = 'pending' | 'completed' | 'failed';

// Use enums for constants
enum PackageType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual'
}
```

### Function Types

```typescript
// Explicit return types for public functions
function calculateTotal(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0);
}

// Use generics for reusable functions
function createApiResponse<T>(data: T, message: string): ApiResponse<T> {
  return { success: true, data, message };
}
```

## 🗄️ Database Operations

### Query Patterns

```typescript
import { db } from '@/lib/db';
import { Logger } from '@/lib/logger';

// Use transactions for multiple operations
const result = await db.transaction(async (tx) => {
  const user = await tx.insert(users).values(userData).returning();
  const profile = await tx.insert(profiles).values({
    userId: user[0].id,
    ...profileData
  }).returning();
  
  return { user: user[0], profile: profile[0] };
});

// Log database operations
const logger = new Logger('DatabaseService');
logger.dbQuery('SELECT * FROM packages', { duration: 150 });
```

### Error Handling

```typescript
// Use database error handling wrapper
export const GET = withDatabaseErrorHandling(async () => {
  const packages = await db.select().from(packages);
  return ApiResponseBuilder.success(packages);
});
```

## 🧪 Testing

### Unit Tests

```typescript
// Test utilities
import { CurrencyFormatter } from '@/lib/formatters';

describe('CurrencyFormatter', () => {
  test('should format currency correctly', () => {
    expect(CurrencyFormatter.format(35.00)).toBe('RM35.00');
    expect(CurrencyFormatter.format('120.50')).toBe('RM120.50');
  });
  
  test('should parse currency strings', () => {
    expect(CurrencyFormatter.parse('RM35.00')).toBe(35.00);
    expect(CurrencyFormatter.parse('invalid')).toBe(0);
  });
});
```

### API Tests

```typescript
// Test API endpoints
import { GET } from '@/app/api/packages/route';

describe('/api/packages', () => {
  test('should return packages list', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## 📋 Checklist

Sebelum commit code, pastikan:

- [ ] Code telah di-lint dan diformat
- [ ] Semua validasi input telah diimplementasikan
- [ ] Error handling yang proper telah ditambahkan
- [ ] Logging yang sesuai telah ditambahkan
- [ ] Type definitions yang benar telah digunakan
- [ ] Tests telah ditulis dan passing
- [ ] Documentation telah diupdate jika diperlukan

## 🔧 Scripts

Tambahkan scripts berikut ke `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [Next.js Best Practices](https://nextjs.org/docs/basic-features/eslint)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

**Note**: Panduan ini akan terus diupdate seiring dengan perkembangan project. Pastikan untuk selalu mengikuti standards terbaru.