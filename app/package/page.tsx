'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function PackagePage() {
  const { isSignedIn } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<{[key: string]: string}>({});

  // Demo lokasi penanaman
  const plantingLocations = [
    {
      id: 'kuala-lumpur',
      name: 'Hutan Simpan Bukit Lagong, Kuala Lumpur',
      description: 'Kawasan hutan simpan seluas 7,200 hektar dengan ekosistem yang kaya',
      coordinates: '3.2839°N, 101.6142°E',
      features: ['Tanah liat berpasir', 'Kelembapan tinggi', 'Naungan separa'],
      image: '🌳',
      availability: 'Tersedia: 2,500 slot'
    },
    {
      id: 'pahang',
      name: 'Ladang Bambu Berkelanjutan, Bentong Pahang',
      description: 'Ladang bambu komersial dengan program konservasi aktif',
      coordinates: '3.5227°N, 101.9085°E',
      features: ['Tanah berdrainase baik', 'Iklim tropika', 'Akses mudah'],
      image: '🎋',
      availability: 'Tersedia: 1,800 slot'
    },
    {
      id: 'johor',
      name: 'Taman Eko Bambu, Kluang Johor',
      description: 'Taman eko-pelancongan dengan fokus pendidikan alam sekitar',
      coordinates: '2.0301°N, 103.3185°E',
      features: ['Tanah organik', 'Program edukasi', 'Lawatan berkala'],
      image: '🌿',
      availability: 'Tersedia: 3,200 slot'
    }
  ];

  const packages = [
    {
      id: 'monthly',
      name: 'Langganan Bulanan',
      price: 'RM12',
      period: '/bulan',
      color: 'green',
      popular: false,
      features: [
        'Akses ke laporan perkembangan buluh setiap bulan (ketinggian, usia, CO₂ diserap)',
        'Gambar buluh terkini setiap bulan',
        'Sijil digital buluh angkat (dengan nombor siri & lokasi unik)',
        'Diskaun 5% untuk pembelian produk bambu BambooInnovasia'
      ]
    },
    {
      id: 'quarterly',
      name: 'Langganan Suku Tahun',
      price: 'RM35',
      period: '/3 bulan',
      color: 'blue',
      popular: true,
      features: [
        'Semua dari pelan bulanan',
        'Video pendek perkembangan buluh setiap 3 bulan',
        'Laporan terperinci impak karbon',
        'Akses kepada webinar khas "Sustainable Living with Bamboo"',
        'Diskaun 10% produk dan cenderamata edisi khas'
      ]
    },
    {
      id: 'annual',
      name: 'Langganan Tahunan Premium',
      price: 'RM120',
      period: '/tahun',
      color: 'purple',
      popular: false,
      features: [
        'Semua dari pelan suku tahun',
        'Welcome kit eksklusif: sijil bercetak, pin bambu, dan cenderamata eco-friendly',
        'Penanaman 2 buluh tambahan atas nama adopter (tanpa caj)',
        'Akses ke peta interaktif lokasi buluh secara real-time',
        'Penyenaraian nama dalam "Wall of Contributors" di laman web rasmi',
        'Baucar RM20 untuk sebarang produk Bambooinnovasia'
      ]
    }
  ];

  const getColorClasses = (color: string, type: 'bg' | 'border' | 'text' | 'button') => {
    const colorMap = {
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700'
      }
    };
    return colorMap[color as keyof typeof colorMap][type];
  };

  const handleLocationSelect = (packageId: string, locationId: string) => {
    setSelectedLocations(prev => ({
      ...prev,
      [packageId]: locationId
    }));
  };

  const handlePackageSelect = (pkg: any) => {
    const selectedLocation = selectedLocations[pkg.id];
    if (!selectedLocation) {
      alert('Sila pilih lokasi penanaman terlebih dahulu');
      return;
    }

    if (isSignedIn) {
      // Redirect to payment page with package and location data
      const paymentUrl = `/payment?package=${pkg.id}&name=${encodeURIComponent(pkg.name)}&price=${pkg.price}&period=${encodeURIComponent(pkg.period)}&location=${selectedLocation}`;
      window.location.href = paymentUrl;
    } else {
      // Redirect to sign up
      window.location.href = '/sign-up';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-green-800 mb-6">
            🌿 Tawaran Langganan
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            untuk Adopter BambooInnovasia
          </p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Pilih pelan langganan yang sesuai untuk menjejaki perkembangan buluh anda dan 
            menyokong misi kelestarian alam sekitar
          </p>
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              🗺️ Lokasi Penanaman Tersedia
            </h2>
            <p className="text-lg text-gray-600">
              Setiap package memerlukan pemilihan lokasi penanaman. Pilih lokasi yang paling sesuai untuk buluh anda.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {plantingLocations.map((location) => (
              <div key={location.id} className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">{location.image}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {location.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{location.description}</p>
                <div className="text-sm text-gray-500 mb-3">{location.coordinates}</div>
                <div className="text-sm font-medium text-green-600">{location.availability}</div>
                <div className="flex flex-wrap gap-1 mt-3 justify-center">
                  {location.features.map((feature, idx) => (
                    <span key={idx} className="text-xs bg-white text-gray-600 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                pkg.popular ? 'border-blue-300 scale-105' : 'border-gray-200'
              } ${selectedPlan === pkg.id ? 'ring-4 ring-blue-200' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Paling Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Package Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {pkg.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className={`text-4xl font-bold ${getColorClasses(pkg.color, 'text')}`}>
                      {pkg.price}
                    </span>
                    <span className="text-gray-500 ml-2">{pkg.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-5 h-5 rounded-full ${getColorClasses(pkg.color, 'bg')} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <svg className={`w-3 h-3 ${getColorClasses(pkg.color, 'text')}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Location Selection */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    📍 Pilih Lokasi Penanaman
                  </h4>
                  <div className="space-y-3">
                    {plantingLocations.map((location) => (
                      <div
                        key={location.id}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          selectedLocations[pkg.id] === location.id
                            ? `${getColorClasses(pkg.color, 'border')} ${getColorClasses(pkg.color, 'bg')}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleLocationSelect(pkg.id, location.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{location.image}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-800 text-sm">
                                {location.name}
                              </h5>
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                selectedLocations[pkg.id] === location.id
                                  ? `${getColorClasses(pkg.color, 'border')} ${getColorClasses(pkg.color, 'bg')}`
                                  : 'border-gray-300'
                              }`}>
                                {selectedLocations[pkg.id] === location.id && (
                                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{location.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{location.coordinates}</span>
                              <span className="text-xs text-green-600 font-medium">{location.availability}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {location.features.map((feature, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePackageSelect(pkg)}
                  className={`w-full py-4 px-6 rounded-xl text-white font-semibold transition-colors ${getColorClasses(pkg.color, 'button')} ${
                    !selectedLocations[pkg.id] ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSignedIn ? 'Pilih Pelan Ini' : 'Daftar & Pilih Pelan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Early Bird Bonus */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-yellow-200 mb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-yellow-800 mb-4">
              🎁 Bonus Untuk Pendaftaran Awal
            </h2>
            <p className="text-lg text-yellow-700 mb-6">
              Bagi 100 pendaftar pertama mana-mana pelan langganan:
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Hadiah Misteri Eco-Pack</h3>
                <p className="text-gray-600">Pakej hadiah eksklusif dengan produk mesra alam</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Founding Adopter Status</h3>
                <p className="text-gray-600">Nama disebut dalam laporan impak tahunan</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
            Soalan Lazim
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Bagaimana saya boleh membatalkan langganan?
              </h3>
              <p className="text-gray-600">
                Anda boleh membatalkan langganan pada bila-bila masa melalui dashboard anda. 
                Tiada bayaran pembatalan dikenakan.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Adakah saya boleh menukar pelan langganan?
              </h3>
              <p className="text-gray-600">
                Ya, anda boleh menaik taraf atau menurunkan pelan anda pada bila-bila masa. 
                Perbezaan bayaran akan diselaraskan secara automatik.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Bila saya akan menerima laporan pertama?
              </h3>
              <p className="text-gray-600">
                Laporan pertama akan dihantar dalam masa 7 hari selepas pendaftaran, 
                kemudian mengikut jadual pelan yang dipilih.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Adakah diskaun boleh digabungkan?
              </h3>
              <p className="text-gray-600">
                Diskaun langganan tidak boleh digabungkan dengan promosi lain, 
                tetapi bonus pendaftaran awal adalah tambahan kepada faedah pelan.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          {!isSignedIn ? (
            <div className="bg-green-600 text-white rounded-2xl p-8">
              <h2 className="text-3xl font-bold mb-4">Sedia untuk Mula?</h2>
              <p className="text-xl mb-6">Daftar akaun anda dan pilih pelan langganan hari ini!</p>
              <Link 
                href="/sign-up"
                className="bg-white text-green-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors inline-block"
              >
                Daftar Sekarang
              </Link>
            </div>
          ) : (
            <div className="bg-blue-600 text-white rounded-2xl p-8">
              <h2 className="text-3xl font-bold mb-4">Pilih Pelan Anda</h2>
              <p className="text-xl mb-6">Anda sudah log masuk. Pilih pelan langganan yang sesuai!</p>
              <Link 
                href="/dashboard"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors inline-block"
              >
                Ke Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}