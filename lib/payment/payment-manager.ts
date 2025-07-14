import { ToyyibPayService } from './toyyibpay';

export interface PaymentGateway {
  name: string;
  createPayment(data: PaymentRequest): Promise<PaymentResponse>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  getPaymentUrl(paymentId: string): string;
}

export interface PaymentRequest {
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  referenceNo: string;
  returnUrl: string;
  callbackUrl: string;
}

export interface PaymentResponse {
  paymentId: string;
  paymentUrl: string;
  status: 'pending' | 'success' | 'failed';
  message?: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  paidAmount?: number;
  transactionId?: string;
  paidDate?: string;
  referenceNo: string;
}

export class PaymentManager {
  private gateways: Map<string, PaymentGateway> = new Map();

  addGateway(name: string, gateway: PaymentGateway) {
    this.gateways.set(name, gateway);
  }

  getGateway(name: string): PaymentGateway | undefined {
    return this.gateways.get(name);
  }

  getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys());
  }

  async createPayment(gatewayName: string, data: PaymentRequest): Promise<PaymentResponse> {
    const gateway = this.getGateway(gatewayName);
    if (!gateway) {
      throw new Error(`Payment gateway '${gatewayName}' not found`);
    }

    return await gateway.createPayment(data);
  }

  async getPaymentStatus(gatewayName: string, paymentId: string): Promise<PaymentStatus> {
    const gateway = this.getGateway(gatewayName);
    if (!gateway) {
      throw new Error(`Payment gateway '${gatewayName}' not found`);
    }

    return await gateway.getPaymentStatus(paymentId);
  }
}

// ToyyibPay Gateway Implementation
export class ToyyibPayGateway implements PaymentGateway {
  name = 'toyyibpay';
  private service: ToyyibPayService;

  constructor(service: ToyyibPayService) {
    this.service = service;
  }

  async createPayment(data: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('Creating ToyyibPay bill with data:', {
        ...data,
        amount: data.amount / 100, // Convert cents to ringgit for logging
      });
      
      const truncatedBillName = (data.description || 'Payment').substring(0, 30);
      console.log('Bill name processing:', {
        original: data.description,
        originalLength: data.description?.length,
        truncated: truncatedBillName,
        truncatedLength: truncatedBillName.length
      });
      
      const billData = {
        billName: truncatedBillName, // ToyyibPay limit: 30 characters
        billDescription: data.description,
        billPriceSetting: 1,
        billPayorInfo: 1,
        billAmount: data.amount, // Amount in cents as expected by ToyyibPay
        billReturnUrl: data.returnUrl,
        billCallbackUrl: data.callbackUrl,
        billExternalReferenceNo: data.referenceNo,
        billTo: data.customerName || 'Customer', // Ensure billTo is not empty
        billEmail: data.customerEmail || 'customer@example.com', // Ensure billEmail is not empty
        billPhone: data.customerPhone && data.customerPhone.trim() ? data.customerPhone : '60123456789', // Ensure billPhone is not empty
        billSplitPayment: 0,
        billSplitPaymentArgs: '',
        billPaymentChannel: 0, // FPX only for better success rate
        billContentEmail: `Terima kasih kerana menggunakan perkhidmatan kami. Rujukan: ${data.referenceNo}`,
        billChargeToCustomer: 1,
        billDisplayMerchant: 1,
        billExpiryDays: 3, // Set bill to expire after 3 days
        billExpiryDate: '', // Let billExpiryDays take precedence
        billAdditionalField: '',
        billPaymentInfo: '',
        billASPCode: ''
      };

      console.log('ToyyibPay bill data:', billData);

      const result = await this.service.createBill(billData);
      console.log('ToyyibPay bill creation result:', result);

      return {
        paymentId: result.billCode,
        paymentUrl: result.billpaymentUrl,
        status: 'pending',
      };
    } catch (error) {
      console.error('ToyyibPay payment creation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          ...data,
          amount: data.amount / 100, // Convert cents to ringgit for logging
        },
      });
      return {
        paymentId: '',
        paymentUrl: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const status = await this.service.getBillStatus(paymentId);

      let paymentStatus: PaymentStatus['status'] = 'pending';
      if (status.billpaymentStatus === '1') {
        paymentStatus = 'success';
      } else if (status.billpaymentStatus === '3') {
        paymentStatus = 'failed';
      }

      return {
        paymentId: status.billCode,
        status: paymentStatus,
        amount: parseFloat(status.billpaymentAmount || '0'),
        paidAmount: parseFloat(status.billpaymentAmount || '0'),
        transactionId: status.billpaymentInvoiceNo,
        paidDate: status.billpaymentDate,
        referenceNo: status.billExternalReferenceNo,
      };
    } catch (error) {
      console.error('Failed to get payment status:', error);
      throw error;
    }
  }

  getPaymentUrl(paymentId: string): string {
    return this.service.getPaymentUrl(paymentId);
  }
}

// Export default payment manager instance
export const paymentManager = new PaymentManager();