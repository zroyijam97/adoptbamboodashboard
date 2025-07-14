'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { formatCurrency } from '@/lib/payment';

interface PaymentFormProps {
  packageData?: {
    id: string;
    name: string;
    price: number;
    period: string;
  };
  locationData?: {
    id: string;
    name: string;
    description: string;
    coordinates: string;
    image: string;
  } | null;
}

export default function PaymentForm({ packageData, locationData }: PaymentFormProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    customerEmail: user?.emailAddresses[0]?.emailAddress || '',
    customerPhone: user?.phoneNumbers[0]?.phoneNumber || '60123456789', // Default phone number
    amount: packageData?.price || 0,
    description: packageData?.name || '',
    subscriptionType: packageData?.id || '',
    plantingLocation: locationData?.id || '',
    plantingLocationName: locationData?.name || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || (name === 'customerPhone' ? '60123456789' : ''), // Default phone if cleared
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format phone number: remove any non-digit characters and ensure it starts with '60'
      let formattedPhone = formData.customerPhone.replace(/\D/g, '');
      // Remove leading '0' if present after '60'
      if (formattedPhone.startsWith('60') && formattedPhone[2] === '0') {
        formattedPhone = '60' + formattedPhone.slice(3);
      }
      // Add '60' prefix if not present
      const phoneNumber = formattedPhone.startsWith('60') ? formattedPhone : `60${formattedPhone}`;

      // Ensure amount is a number (in case it got converted to string somewhere)
      const numericAmount = typeof formData.amount === 'number' 
        ? formData.amount 
        : parseFloat(String(formData.amount).replace(/[^\d.]/g, ''));

      const paymentData = {
        ...formData,
        amount: Math.round(numericAmount), // Amount should already be in cents, just ensure it's an integer
        customerPhone: phoneNumber,
        gateway: 'toyyibpay',
      };

      console.log('Sending payment data:', paymentData);

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      console.log('Payment API response status:', response.status);
      const result = await response.json();
      console.log('Payment API response:', result);

      if (result.success) {
        // Redirect to payment gateway
        window.location.href = result.paymentUrl;
      } else {
        console.error('Payment failed:', result);
        alert('Ralat: ' + (result.error || 'Pembayaran gagal dibuat'));
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ralat: Gagal memproses pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Maklumat Pembayaran
        </h2>
        {packageData && (
          <div className="bg-green-50 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              {packageData.name}
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(packageData.price)}
              <span className="text-lg font-normal text-gray-600">
                {packageData.period}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Debug Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-yellow-800 mb-2">Debug Information</h4>
        <pre className="text-xs text-yellow-700 overflow-auto">
          {JSON.stringify({
            packageData,
            locationData,
            formData,
            userInfo: {
              fullName: user?.fullName,
              email: user?.emailAddresses[0]?.emailAddress,
              phone: user?.phoneNumbers[0]?.phoneNumber
            }
          }, null, 2)}
        </pre>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Penuh *
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Masukkan nama penuh"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Alamat Email *
            </label>
            <input
              type="email"
              id="customerEmail"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="contoh@email.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
            Nombor Telefon
          </label>
          <input
            type="tel"
            id="customerPhone"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="01X-XXX XXXX"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Keterangan
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Keterangan tambahan (pilihan)"
          />
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-gray-700">Jumlah Bayaran:</span>
            <span className="font-bold text-green-600 text-2xl">
              {formatCurrency(formData.amount)}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">Maklumat Pembayaran</h4>
              <p className="text-sm text-blue-700">
                Anda akan diarahkan ke laman ToyyibPay untuk menyelesaikan pembayaran dengan selamat. 
                Pembayaran boleh dibuat melalui FPX, kad kredit, atau e-wallet.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors text-lg"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Memproses...</span>
            </div>
          ) : (
            'Teruskan ke Pembayaran'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Pembayaran diproses dengan selamat melalui ToyyibPay</p>
        <p>Sokongan pelanggan: support@bambooinnovasia.com</p>
      </div>
    </div>
  );
}