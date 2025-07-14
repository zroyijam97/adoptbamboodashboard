'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import PaymentForm from './components/PaymentForm';

function PaymentPageContent() {
  const { isSignedIn } = useUser();
  const searchParams = useSearchParams();
  
  // Get package data from URL parameters
  const packageId = searchParams.get('package');
  const packageName = searchParams.get('name');
  const packagePrice = searchParams.get('price');
  const packagePeriod = searchParams.get('period');
  const selectedLocation = searchParams.get('location');

  // Location data mapping
  const locations = {
    'kuala-lumpur': {
      id: 'kuala-lumpur',
      name: 'Hutan Simpan Bukit Lagong, Kuala Lumpur',
      description: 'Kawasan hutan simpan seluas 7,200 hektar dengan ekosistem yang kaya',
      coordinates: '3.2839°N, 101.6142°E',
      image: '🌳'
    },
    'pahang': {
      id: 'pahang',
      name: 'Ladang Bambu Berkelanjutan, Bentong Pahang',
      description: 'Ladang bambu komersial dengan program konservasi aktif',
      coordinates: '3.5227°N, 101.9085°E',
      image: '🎋'
    },
    'johor': {
      id: 'johor',
      name: 'Taman Eko Bambu, Kluang Johor',
      description: 'Taman eko-pelancongan dengan fokus pendidikan alam sekitar',
      coordinates: '2.0301°N, 103.3185°E',
      image: '🌿'
    }
  };

  // Package data mapping (prices in cents)
  const packages = {
    monthly: { id: 'monthly', name: 'Langganan Bulanan', price: 1200, period: '/bulan' },
    quarterly: { id: 'quarterly', name: 'Langganan Suku Tahun', price: 3500, period: '/3 bulan' },
    annual: { id: 'annual', name: 'Langganan Tahunan Premium', price: 12000, period: '/tahun' },
  };

  // For testing purposes, use dummy data if no package is selected
  const dummyPackage = {
    id: 'test',
    name: 'Test Package - Langganan Suku Tahun',
    price: 3500, // RM 35.00 in cents
    period: '/3 bulan'
  };

  const selectedPackage = packageId && packages[packageId as keyof typeof packages] 
    ? packages[packageId as keyof typeof packages]
    : packageName && packagePrice 
    ? {
        id: packageId || 'custom',
        name: packageName,
        price: Math.round(parseFloat(packagePrice?.replace(/[^0-9.]/g, '') || '0') * 100), // Convert to cents
        period: packagePeriod || '',
      }
    : dummyPackage; // Use dummy data for testing

  const locationData = selectedLocation && locations[selectedLocation as keyof typeof locations]
    ? locations[selectedLocation as keyof typeof locations]
    : null;

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Akses Ditolak</h2>
          <p className="text-gray-600 mb-6">
            Anda perlu log masuk untuk mengakses halaman pembayaran.
          </p>
          <a
            href="/sign-in"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors inline-block"
          >
            Log Masuk
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            🌿 Pembayaran Langganan
          </h1>
          <p className="text-lg text-gray-600">
            Lengkapkan maklumat di bawah untuk meneruskan pembayaran
          </p>
        </div>

        {/* Location Information */}
        {locationData && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              📍 Lokasi Penanaman Dipilih
            </h2>
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{locationData.image}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {locationData.name}
                  </h3>
                  <p className="text-gray-600 mb-3">{locationData.description}</p>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      📍 {locationData.coordinates}
                    </span>
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      Lokasi Disahkan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <PaymentForm packageData={selectedPackage} locationData={locationData} />

        {/* Security Notice */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Keselamatan Pembayaran
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">SSL Encryption</h4>
              <p className="text-sm text-gray-600">
                Semua data dilindungi dengan enkripsi SSL 256-bit
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">ToyyibPay Certified</h4>
              <p className="text-sm text-gray-600">
                Gateway pembayaran yang disahkan dan dipercayai
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Data Protection</h4>
              <p className="text-sm text-gray-600">
                Maklumat peribadi tidak disimpan di pelayan kami
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuatkan halaman pembayaran...</p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentPageContent />
    </Suspense>
  );
}