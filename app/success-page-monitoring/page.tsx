'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface PaymentRecord {
  id: number;
  referenceNo: string;
  billCode?: string;
  status: string;
  amount: string;
  customerName: string;
  customerEmail: string;
  packageType?: string;
  locationName?: string;
  createdAt: string;
  updatedAt?: string;
}

interface AdoptionRecord {
  id: number;
  paymentReferenceNo: string;
  status: string;
  adoptionDate: string;
}

interface MonitoringStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  adoptionsCreated: number;
  successPageDetections: number;
}

export default function SuccessPageMonitoringPage() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [recentAdoptions, setRecentAdoptions] = useState<AdoptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch payment statistics
      const statsResponse = await fetch('/api/payment/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent payments
      const paymentsResponse = await fetch('/api/payment/recent?limit=10');
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setRecentPayments(paymentsData.payments || []);
      }

      // Fetch recent adoptions
      const adoptionsResponse = await fetch('/api/adoptions/recent?limit=10');
      if (adoptionsResponse.ok) {
        const adoptionsData = await adoptionsResponse.json();
        setRecentAdoptions(adoptionsData.adoptions || []);
      }
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const testSuccessPageVisit = async () => {
    try {
      const testData = {
        referenceNo: 'TEST' + Date.now(),
        billCode: 'TEST_BILL_' + Date.now(),
        status: '1'
      };

      const response = await fetch('/api/payment/success-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      console.log('Test success page visit result:', result);
      alert(`Test result: ${result.success ? 'Success' : 'Failed'} - ${result.message}`);
    } catch (error) {
      console.error('Error testing success page visit:', error);
      alert('Test failed: ' + error);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchMonitoringData();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
          <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Success Page Monitoring</h1>
              <p className="text-gray-600 mt-2">
                Monitor payment success page visits and system performance
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={fetchMonitoringData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                onClick={testSuccessPageVisit}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Test Success Visit
              </button>
              <Link
                href="/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.totalPayments}</div>
              <div className="text-gray-600 text-sm">Total Payments</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">{stats.successfulPayments}</div>
              <div className="text-gray-600 text-sm">Successful</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
              <div className="text-gray-600 text-sm">Pending</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-red-600">{stats.failedPayments}</div>
              <div className="text-gray-600 text-sm">Failed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.adoptionsCreated}</div>
              <div className="text-gray-600 text-sm">Adoptions Created</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-indigo-600">{stats.successPageDetections}</div>
              <div className="text-gray-600 text-sm">Success Page Visits</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Recent Payments</h2>
            </div>
            <div className="p-6">
              {recentPayments.length > 0 ? (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{payment.referenceNo}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'success' 
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Customer: {payment.customerName}</div>
                        <div>Amount: RM {(parseInt(payment.amount) / 100).toFixed(2)}</div>
                        {payment.packageType && (
                          <div>Package: {payment.packageType}</div>
                        )}
                        {payment.locationName && (
                          <div>Location: {payment.locationName}</div>
                        )}
                        <div>Created: {new Date(payment.createdAt).toLocaleString()}</div>
                        {payment.updatedAt && (
                          <div>Updated: {new Date(payment.updatedAt).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent payments found</p>
              )}
            </div>
          </div>

          {/* Recent Adoptions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Recent Adoptions</h2>
            </div>
            <div className="p-6">
              {recentAdoptions.length > 0 ? (
                <div className="space-y-4">
                  {recentAdoptions.map((adoption) => (
                    <div key={adoption.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">Adoption #{adoption.id}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          adoption.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {adoption.status}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Payment Ref: {adoption.paymentReferenceNo}</div>
                        <div>Adoption Date: {new Date(adoption.adoptionDate).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent adoptions found</p>
              )}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How Success Page Detection Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">User Completes Payment</h3>
              <p className="text-sm text-gray-600">
                User is redirected to success page with payment parameters
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Success Page Visit Detected</h3>
              <p className="text-sm text-gray-600">
                System automatically processes the payment and creates adoption record
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Adoption Created</h3>
              <p className="text-sm text-gray-600">
                Bamboo adoption record is created with initial growth and environmental data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}