// ToyyibPay Payment Gateway Integration
export interface ToyyibPayConfig {
  userSecretKey: string;
  categoryCode: string;
  baseUrl: string;
}

export interface CreateBillRequest {
  billName: string;
  billDescription: string;
  billPriceSetting: number;
  billPayorInfo: number;
  billAmount: number;
  billReturnUrl: string;
  billCallbackUrl: string;
  billExternalReferenceNo: string;
  billTo: string;
  billEmail: string;
  billPhone: string;
  billSplitPayment: number;
  billSplitPaymentArgs: string;
  billPaymentChannel: number;
  billContentEmail: string;
  billChargeToCustomer: number;
  billDisplayMerchant: number;
  billExpiryDays?: number;
  billExpiryDate?: string | null;
  billAdditionalField?: string;
  billPaymentInfo?: string;
  billASPCode?: string;
}

export interface CreateBillResponse {
  billCode: string;
  billpaymentUrl: string;
}

interface ToyyibPayBillResponse {
  BillCode: string;
  BillName: string;
  BillDescription: string;
  BillAmount: number;
  PaymentURL: string;
}

export interface BillStatus {
  billCode: string;
  billpaymentStatus: string;
  billpaymentAmount: string;
  billpaymentInvoiceNo: string;
  billpaymentDate: string;
  billExternalReferenceNo: string;
}

export class ToyyibPayService {
  private config: ToyyibPayConfig;

  constructor(config: ToyyibPayConfig) {
    this.config = config;
  }

  /**
   * Get available banks for ToyyibPay
   */
  async getBanks(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/getBank`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching banks:', error);
      throw error;
    }
  }

  /**
   * Create a new bill for payment
   */
  async createBill(billData: Partial<CreateBillRequest>): Promise<CreateBillResponse> {
    try {
      console.log('Creating bill with data:', billData);

      // Validate required fields
      if (!billData.billPhone || billData.billPhone.trim() === '') {
        console.error('billPhone is missing or empty:', billData.billPhone);
        throw new Error('billPhone parameter is required');
      }

      if (!billData.billTo || billData.billTo.trim() === '') {
        console.error('billTo is missing or empty:', billData.billTo);
        throw new Error('billTo parameter is required');
      }

      if (!billData.billEmail || billData.billEmail.trim() === '') {
        console.error('billEmail is missing or empty:', billData.billEmail);
        throw new Error('billEmail parameter is required');
      }

      // Validate phone number format (must be Malaysian format starting with 60)
      const phoneRegex = /^60\d{8,10}$/;
      if (!phoneRegex.test(billData.billPhone)) {
        console.error('Invalid phone number format:', billData.billPhone);
        throw new Error('Phone number must be in Malaysian format (60xxxxxxxxx)');
      }

      // Validate email format
      if (billData.billEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billData.billEmail)) {
        console.error('Invalid email format:', billData.billEmail);
        throw new Error('Invalid email format');
      }

      // Validate amount (must be positive, amount is in cents)
      if (!billData.billAmount || billData.billAmount <= 0) {
        console.error('Invalid amount:', billData.billAmount);
        throw new Error('Amount must be greater than 0');
      }

      // Log all input data for debugging
      console.log('ToyyibPay createBill input validation:', {
        billName: billData.billName,
        billDescription: billData.billDescription,
        billAmount: billData.billAmount, // Amount in cents
        billAmountInRinggit: billData.billAmount / 100, // For logging only
        billPhone: billData.billPhone,
        billEmail: billData.billEmail,
        billTo: billData.billTo,
        secretKeyLength: this.config.userSecretKey?.length,
        categoryCode: this.config.categoryCode,
        baseUrl: this.config.baseUrl
      });

      const params = new URLSearchParams();
      
      // Required fields
      const secretKey = this.config.userSecretKey;
      console.log('Using secret key:', secretKey);
      params.append('userSecretKey', secretKey);

      const categoryCode = this.config.categoryCode;
      console.log('Using category code:', categoryCode);
      params.append('categoryCode', categoryCode);

      // Build required parameters (excluding empty optional ones)
      const requestParams: Record<string, any> = {
        billName: (billData.billName || 'Payment').substring(0, 30), // ToyyibPay limit: 30 characters
        billDescription: (billData.billDescription || 'Payment').substring(0, 100), // Max 100 chars
        billPriceSetting: 1, // Fixed amount
        billPayorInfo: 1, // Require payer information
        billAmount: billData.billAmount || 0, // Amount in cents as integer
        billReturnUrl: billData.billReturnUrl || '',
        billCallbackUrl: billData.billCallbackUrl || '',
        billExternalReferenceNo: billData.billExternalReferenceNo || '',
        billTo: billData.billTo || '',
        billEmail: billData.billEmail || '',
        billPhone: billData.billPhone || '',
        billSplitPayment: 0, // No split payment
        billPaymentChannel: 0, // FPX only for better success rate
        billContentEmail: billData.billContentEmail || 'Thank you for your payment',
        billChargeToCustomer: 1,
        billDisplayMerchant: 1,
        billExpiryDays: billData.billExpiryDays || 3 // Default 3 days expiry
      };

      // Add optional parameters only if they have non-empty values
      if (billData.billExpiryDate && billData.billExpiryDate.trim() !== '') {
        requestParams.billExpiryDate = billData.billExpiryDate;
      }
      if (billData.billAdditionalField && billData.billAdditionalField.trim() !== '') {
        requestParams.billAdditionalField = billData.billAdditionalField;
      }
      if (billData.billPaymentInfo && billData.billPaymentInfo.trim() !== '') {
        requestParams.billPaymentInfo = billData.billPaymentInfo;
      }
      if (billData.billASPCode && billData.billASPCode.trim() !== '') {
        requestParams.billASPCode = billData.billASPCode;
      }

      console.log('Request parameters:', {
        ...requestParams,
        billAmountType: typeof requestParams.billAmount,
        note: 'Amount in cents as per ToyyibPay API documentation - empty optional parameters excluded'
      });

      // Add parameters to URLSearchParams (excluding empty strings)
      Object.entries(requestParams).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const requestUrl = `${this.config.baseUrl}/index.php/api/createBill`;
      console.log('ToyyibPay Request URL:', requestUrl);
      console.log('ToyyibPay Request Body:', params.toString());

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      const responseText = await response.text();
      console.log('ToyyibPay Response Status:', response.status);
      console.log('ToyyibPay Response Headers:', Object.fromEntries(response.headers));
      console.log('ToyyibPay Raw Response:', responseText);

      if (!response.ok) {
        console.error('ToyyibPay API Error:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          body: responseText
        });
        throw new Error(`ToyyibPay API error: ${response.status} - ${responseText}`);
      }

      let result;
      try {
        // Clean the response text of any whitespace and special characters
        const cleanResponse = responseText.replace(/[\t\n\r]/g, '').trim();
        console.log('Cleaned ToyyibPay Response:', cleanResponse);

        // Handle known error responses
        if (cleanResponse === '[FALSE]') {
          throw new Error('Invalid request parameters or authentication failed');
        }

        result = JSON.parse(cleanResponse);
        console.log('ToyyibPay Parsed Response:', result);

        if (Array.isArray(result)) {
          if (result.length === 0) {
            throw new Error('Empty response from ToyyibPay');
          }
          const billData = result[0];
          if (!billData.BillCode) {
            throw new Error('Bill code not found in response');
          }
          return {
            billCode: billData.BillCode,
            billpaymentUrl: billData.PaymentURL || `${this.config.baseUrl}/${billData.BillCode}`
          };
        } else if (result.status === 'error' || result.status === false) {
          throw new Error(result.msg || result.message || 'Failed to create bill');
        } else {
          throw new Error(`Unexpected response format from ToyyibPay: ${JSON.stringify(result)}`);
        }
      } catch (e) {
        console.error('Failed to process ToyyibPay response:', e);
        throw new Error(e instanceof Error ? e.message : 'Failed to process ToyyibPay response');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  /**
   * Get bill status/details
   */
  async getBillStatus(billCode: string): Promise<BillStatus> {
    const formData = new FormData();
    formData.append('billCode', billCode);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/getBillTransactions`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result[0]; // Returns array, get first item
    } catch (error) {
      console.error('Error getting bill status:', error);
      throw error;
    }
  }

  /**
   * Get payment URL for a bill
   */
  getPaymentUrl(billCode: string): string {
    return `${this.config.baseUrl}/${billCode}`;
  }

  /**
   * Verify callback signature (for webhook security)
   */
  verifyCallback(data: any, signature: string): boolean {
    // Implementation depends on ToyyibPay's signature verification method
    // This is a placeholder - check ToyyibPay docs for actual implementation
    return true;
  }
}

// Default configuration
export const createToyyibPayService = () => {
  // Access environment variables
  const userSecretKey = process.env.TOYYIBPAY_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
  const baseUrl = process.env.TOYYIBPAY_BASE_URL || 'https://dev.toyyibpay.com';

  // Debug logging
  console.log('ToyyibPay Environment Variables:', {
    secretKey: userSecretKey ? `${userSecretKey.substring(0, 8)}...` : 'missing',
    categoryCode: categoryCode || 'missing',
    baseUrl,
    envVars: {
      TOYYIBPAY_SECRET_KEY: process.env.TOYYIBPAY_SECRET_KEY ? 'set' : 'missing',
      TOYYIBPAY_CATEGORY_CODE: process.env.TOYYIBPAY_CATEGORY_CODE ? 'set' : 'missing',
      TOYYIBPAY_BASE_URL: process.env.TOYYIBPAY_BASE_URL ? 'set' : 'missing',
      NODE_ENV: process.env.NODE_ENV
    }
  });

  if (!userSecretKey || !categoryCode) {
    console.error('ToyyibPay Configuration Error:', {
      secretKeyPresent: !!userSecretKey,
      categoryCodePresent: !!categoryCode,
      envVars: process.env
    });
    throw new Error('ToyyibPay configuration is incomplete. Please check your environment variables.');
  }

  const config: ToyyibPayConfig = {
    userSecretKey,
    categoryCode,
    baseUrl
  };

  return new ToyyibPayService(config);
};