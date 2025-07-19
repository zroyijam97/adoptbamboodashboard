'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CurrencyFormatter } from '@/lib/formatters';

export default function AdoptPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [adoptionType, setAdoptionType] = useState('individual');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    numberOfPoles: 1,
    purpose: '',
    organizationName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      router.push('/sign-up');
      return;
    }

    // Convert form data to URLSearchParams
    const queryParams = new URLSearchParams();
    queryParams.append('type', adoptionType);
    // Convert number to string for URLSearchParams
    queryParams.append('numberOfPoles', formData.numberOfPoles.toString());
    // Add other form fields
    if (formData.fullName) queryParams.append('fullName', formData.fullName);
    if (formData.email) queryParams.append('email', formData.email);
    if (formData.phone) queryParams.append('phone', formData.phone);
    if (formData.companyName) queryParams.append('companyName', formData.companyName);
    if (formData.organizationName) queryParams.append('organizationName', formData.organizationName);
    if (formData.purpose) queryParams.append('purpose', formData.purpose);
    
    router.push(`/payment?${queryParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-green-800 text-center mb-8">
          Adopt a Bamboo
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Adoption Type Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Choose Adoption Type</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                className={`p-4 rounded-xl border-2 transition-all ${
                  adoptionType === 'individual'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setAdoptionType('individual')}
              >
                <div className="text-2xl mb-2">🧍‍♂️</div>
                <div className="font-semibold">Individual</div>
                <div className="text-sm text-gray-600">Personal contribution</div>
              </button>

              <button
                className={`p-4 rounded-xl border-2 transition-all ${
                  adoptionType === 'corporate'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setAdoptionType('corporate')}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-semibold">Corporate</div>
                <div className="text-sm text-gray-600">For organizations</div>
              </button>

              <button
                className={`p-4 rounded-xl border-2 transition-all ${
                  adoptionType === 'bulk'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setAdoptionType('bulk')}
              >
                <div className="text-2xl mb-2">📦</div>
                <div className="font-semibold">Bulk Adoption</div>
                <div className="text-sm text-gray-600">Schools, NGOs, Events</div>
              </button>
            </div>
          </div>

          {/* Adoption Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Individual Form */}
            {adoptionType === 'individual' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Bamboo Poles ({CurrencyFormatter.format(1)} per pole)
                  </label>
                  <input
                    type="number"
                    name="numberOfPoles"
                    min="1"
                    required
                    value={formData.numberOfPoles}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Corporate Form */}
            {adoptionType === 'corporate' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Poles (Minimum 1,000 recommended)
                  </label>
                  <input
                    type="number"
                    name="numberOfPoles"
                    min="1000"
                    required
                    value={formData.numberOfPoles}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Bulk Adoption Form */}
            {adoptionType === 'bulk' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    required
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Poles (Minimum 500)
                  </label>
                  <input
                    type="number"
                    name="numberOfPoles"
                    min="500"
                    required
                    value={formData.numberOfPoles}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose
                  </label>
                  <select
                    name="purpose"
                    required
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a purpose</option>
                    <option value="csr">CSR Program</option>
                    <option value="school">School Program</option>
                    <option value="reforestation">Reforestation</option>
                    <option value="gift">Gift Initiative</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition-colors ${
                adoptionType === 'individual'
                  ? 'bg-green-600 hover:bg-green-700'
                  : adoptionType === 'corporate'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isSignedIn ? 'Proceed to Payment' : 'Sign Up to Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}