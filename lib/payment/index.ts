import { createToyyibPayService, ToyyibPayService } from './toyyibpay';
import { PaymentManager, ToyyibPayGateway } from './payment-manager';

// Initialize payment services
const toyyibPayService = createToyyibPayService();
const toyyibPayGateway = new ToyyibPayGateway(toyyibPayService);

// Create and configure payment manager
const paymentManager = new PaymentManager();
paymentManager.addGateway('toyyibpay', toyyibPayGateway);

// Export configured instances
export { paymentManager, toyyibPayService };

// Export types
export type {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentGateway,
} from './payment-manager';

export type {
  ToyyibPayConfig,
  CreateBillRequest,
  CreateBillResponse,
  BillStatus,
} from './toyyibpay';

// Utility functions
export const formatCurrency = (amount: number): string => {
  // Convert cents to ringgit for display
  const ringgitAmount = amount / 100;
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(ringgitAmount);
};

export const generateReferenceNo = (prefix: string = 'REF'): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Payment status helpers
export const isPaymentSuccessful = (status: string): boolean => {
  return status === 'success';
};

export const isPaymentPending = (status: string): boolean => {
  return status === 'pending';
};

export const isPaymentFailed = (status: string): boolean => {
  return status === 'failed' || status === 'cancelled';
};