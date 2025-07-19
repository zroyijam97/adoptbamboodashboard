'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CurrencyFormatter } from '@/lib/formatters';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const referenceNo = searchParams.get('ref');
  const billCode = searchParams.get('billcode');
  const status = searchParams.get('status_id');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // First, notify the system that user has reached the success page
      if ((referenceNo || billCode) && status) {
        try {
          console.log('Notifying system of success page visit:', { referenceNo, billCode, status });
          const visitResponse = await fetch('/api/payment/success-visit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              referenceNo,
              billCode,
              status
            })
          });
          
          const visitResult = await visitResponse.json();
          console.log('Success page visit result:', visitResult);
          
          if (visitResult.success && visitResult.payment) {
            setPaymentDetails(visitResult.payment);
            setPaymentStatus(visitResult.payment.status === 'success' ? 'success' : 'failed');
            return; // Exit early if we got the result from success visit API
          }
        } catch (error) {
          console.error('Error notifying success page visit:', error);
          // Continue with normal flow if success visit API fails
        }
      }

      // Fallback to original payment status checking
      if (billCode) {
        try {
          const response = await fetch(`/api/payment/status?paymentId=${billCode}&gateway=toyyibpay`);
          const result = await response.json();

          if (result.success) {
            setPaymentDetails(result.payment);
            setPaymentStatus(result.payment.status === 'success' ? 'success' : 'failed');
          } else {
            setPaymentStatus('failed');
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          setPaymentStatus('failed');
        }
      } else if (status === '1') {
        // Direct success from URL parameter
        setPaymentStatus('success');
      } else {
        setPaymentStatus('failed');
      }
    };

    checkPaymentStatus();
  }, [billCode, status, referenceNo]);

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Menyemak Status Pembayaran</h2>
          <p className="text-gray-600">Sila tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        {paymentStatus === 'success' ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-green-800 mb-4">
              🎉 Pembayaran Berjaya!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Terima kasih! Langganan anda telah diaktifkan.
            </p>

            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-800 mb-4">Butiran Pembayaran</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombor Rujukan:</span>
                    <span className="font-medium">{paymentDetails.referenceNo || referenceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah Dibayar:</span>
                    <span className="font-medium">{CurrencyFormatter.format((paymentDetails.paidAmount || paymentDetails.amount) / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tarikh Pembayaran:</span>
                    <span className="font-medium">
                      {paymentDetails.paidDate ? new Date(paymentDetails.paidDate).toLocaleDateString('ms-MY') : 'Hari ini'}
                    </span>
                  </div>
                  {paymentDetails.userId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID Pengguna:</span>
                      <span className="font-medium text-xs">{paymentDetails.userId}</span>
                    </div>
                  )}
                  {paymentDetails.packageType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jenis Pakej:</span>
                      <span className="font-medium">{paymentDetails.packageType}</span>
                    </div>
                  )}
                  {(paymentDetails.locationName || paymentDetails.locationId) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lokasi:</span>
                      <span className="font-medium">{paymentDetails.locationName || paymentDetails.locationId}</span>
                    </div>
                  )}
                  {paymentDetails.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID Transaksi:</span>
                      <span className="font-medium">{paymentDetails.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-blue-800 mb-3">Langkah Seterusnya</h3>
              <ul className="text-sm text-blue-700 space-y-2 text-left">
                <li>✅ Email pengesahan akan dihantar dalam masa 5 minit</li>
                <li>✅ Akses dashboard untuk melihat status langganan</li>
                <li>✅ Laporan pertama akan dihantar dalam masa 7 hari</li>
                <li>✅ Mulakan perjalanan kelestarian anda!</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
              >
                Ke Dashboard
              </Link>
              <Link
                href="/package"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors text-center"
              >
                Lihat Pakej Lain
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Failed Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-red-800 mb-4">
              Pembayaran Tidak Berjaya
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Maaf, pembayaran anda tidak dapat diproses. Sila cuba lagi.
            </p>

            {/* Error Details */}
            <div className="bg-red-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-red-800 mb-3">Kemungkinan Punca</h3>
              <ul className="text-sm text-red-700 space-y-2 text-left">
                <li>• Baki tidak mencukupi dalam akaun</li>
                <li>• Maklumat kad tidak sah</li>
                <li>• Pembayaran dibatalkan</li>
                <li>• Masalah sambungan internet</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/payment"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
              >
                Cuba Lagi
              </Link>
              <Link
                href="/package"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors text-center"
              >
                Kembali ke Pakej
              </Link>
            </div>

            {/* Support */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Perlukan bantuan? Hubungi kami di</p>
              <p className="font-medium">support@bambooinnovasia.com</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Memuatkan...</h2>
        <p className="text-gray-600">Sila tunggu sebentar...</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}