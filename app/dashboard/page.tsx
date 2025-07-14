'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface UserStats {
  totalAdoptions: number;
  totalSpent: number;
  memberSince: string;
  activeAdoptions: number;
  totalInvestment: number;
  averagePerPlant: number;
}

interface PackageDetails {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
}

interface LocationDetails {
  id: string;
  name: string;
  address?: string;
  coordinates?: string;
  image?: string;
}

interface Adoption {
  adoption: {
    id: number;
    adoptionDate: string;
    adoptionPrice: string;
    isActive: boolean;
    packageDetails: PackageDetails;
    locationDetails: LocationDetails;
  };
  plant: {
    id: number;
    plantCode: string;
    location: string;
    currentHeight: string;
    species: string;
    status: string;
    co2Absorbed: string;
  } | null;
}

interface PackageAnalytics {
  [packageName: string]: {
    count: number;
    totalSpent: number;
    period: string;
  };
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [packageAnalytics, setPackageAnalytics] = useState<PackageAnalytics>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/user/dashboard');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserStats(data.data.statistics);
          setAdoptions(data.data.adoptions);
          setPackageAnalytics(data.data.packageAnalytics || {});
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            Welcome back, {user?.firstName || 'Bamboo Adopter'}! 🌱
          </h1>
          <p className="text-gray-600 text-lg">
            Track your bamboo adoptions and environmental impact
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Adoptions</p>
                <p className="text-3xl font-bold text-green-600">
                  {userStats?.activeAdoptions || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Investment</p>
                <p className="text-3xl font-bold text-blue-600">
                  RM{userStats?.totalInvestment?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg per Plant</p>
                <p className="text-3xl font-bold text-purple-600">
                  RM{userStats?.averagePerPlant?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CO₂ Impact</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {adoptions.reduce((total, adoption) => 
                    total + parseFloat(adoption.plant?.co2Absorbed || '0'), 0
                  ).toFixed(1)}kg
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Package Analytics */}
        {Object.keys(packageAnalytics).length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Package Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(packageAnalytics).map(([packageName, analytics]) => (
                <div key={packageName} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">{packageName}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adoptions:</span>
                      <span className="font-medium">{analytics.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-medium text-green-600">RM{analytics.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Period:</span>
                      <span className="font-medium">{analytics.period}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Adopt New Bamboo</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>View Reports</span>
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>Download Certificate</span>
            </button>
          </div>
        </div>

        {/* My Bamboo Plants */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">My Bamboo Plants</h2>
          
          {adoptions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No bamboo plants yet</h3>
              <p className="text-gray-500 mb-6">Start your environmental journey by adopting your first bamboo plant!</p>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors">
                Adopt Your First Bamboo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adoptions.map((adoption) => (
                <div key={adoption.adoption.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      {adoption.plant?.plantCode || 'Unknown Plant'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      adoption.plant?.status === 'growing' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {adoption.plant?.status || 'Unknown'}
                    </span>
                  </div>
                  
                  {/* Package Information */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">Package Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-600">Package:</span>
                        <span className="font-medium">{adoption.adoption.packageDetails?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Price:</span>
                        <span className="font-medium">RM{adoption.adoption.packageDetails?.price || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Period:</span>
                        <span className="font-medium">{adoption.adoption.packageDetails?.period || 'N/A'}</span>
                      </div>
                    </div>
                    {adoption.adoption.packageDetails?.features && adoption.adoption.packageDetails.features.length > 0 && (
                      <div className="mt-2">
                        <span className="text-blue-600 text-sm">Features:</span>
                        <ul className="text-xs text-blue-700 mt-1">
                          {adoption.adoption.packageDetails.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1 h-1 bg-blue-600 rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Location Information */}
                  <div className="bg-green-50 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-green-800 mb-2">Location Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-600">Location:</span>
                        <span className="font-medium">{adoption.adoption.locationDetails?.name || 'N/A'}</span>
                      </div>
                      {adoption.adoption.locationDetails?.address && (
                        <div className="text-green-600 text-xs">
                          {adoption.adoption.locationDetails.address}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{adoption.plant?.location || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Height:</span>
                      <span className="font-medium">{adoption.plant?.currentHeight || '0'}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CO₂ Absorbed:</span>
                      <span className="font-medium text-green-600">{adoption.plant?.co2Absorbed || '0'}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adopted:</span>
                      <span className="font-medium">
                        {new Date(adoption.adoption.adoptionDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg transition-colors">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}