'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import PackageModal from './components/PackageModal';
import { CurrencyFormatter } from '@/lib/formatters';
import LocationModal from './components/LocationModal';
import UserModal from './components/UserModal';
import AdoptionModal from './components/AdoptionModal';

interface AnalyticsData {
  overview: {
    totalSubscribers: number;
    totalAdoptions: number;
    totalRevenue: number;
    totalBambooPlants: number;
  };
  daily: {
    adoptions: number;
    revenue: number;
  };
  monthly: {
    adoptions: number;
    revenue: number;
  };
  yearly: {
    adoptions: number;
    revenue: number;
  };
  recentAdoptions: any[];
}

const COLORS = ['#10B981', '#059669', '#047857', '#065F46'];

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analytics');
  const [packages, setPackages] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [adoptions, setAdoptions] = useState<any[]>([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingAdoption, setEditingAdoption] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.emailAddresses[0]?.emailAddress;
      if (userEmail !== 'azrulnizamazmi.usm@gmail.com') {
        redirect('/');
        return;
      }
      fetchAnalytics();
      fetchPackages();
      fetchLocations();
      fetchUsers();
      fetchAdoptions();
    }
  }, [isLoaded, user]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/packages');
      const data = await response.json();
      if (data.success) {
        setPackages(data.data);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/admin/locations');
      const data = await response.json();
      if (data.success) {
        setLocations(data.data);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchAdoptions = async () => {
    try {
      const response = await fetch('/api/admin/adoptions');
      const data = await response.json();
      if (data.success) {
        setAdoptions(data.data);
      }
    } catch (err) {
      console.error('Error fetching adoptions:', err);
    }
  };

  const deletePackage = async (id: number) => {
    if (confirm('Adakah anda pasti ingin memadam pakej ini?')) {
      try {
        const response = await fetch(`/api/admin/packages?id=${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          fetchPackages();
        }
      } catch (err) {
        console.error('Error deleting package:', err);
      }
    }
  };

  const deleteLocation = async (id: number) => {
    if (confirm('Adakah anda pasti ingin memadam lokasi ini?')) {
      try {
        const response = await fetch(`/api/admin/locations?id=${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          fetchLocations();
        }
      } catch (err) {
        console.error('Error deleting location:', err);
      }
    }
  };

  const openPackageModal = (pkg: any = null) => {
    setEditingPackage(pkg);
    setShowPackageModal(true);
  };

  const openLocationModal = (location: any = null) => {
    setEditingLocation(location);
    setShowLocationModal(true);
  };

  const openUserModal = (user: any = null) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const openAdoptionModal = (adoption: any = null) => {
    setEditingAdoption(adoption);
    setShowAdoptionModal(true);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Data Available</h1>
          <p className="text-gray-600">Please check back later.</p>
        </div>
      </div>
    );
  }



  // Chart data
  const revenueData = [
    { name: 'Daily', revenue: analytics.daily.revenue, adoptions: analytics.daily.adoptions },
    { name: 'Monthly', revenue: analytics.monthly.revenue, adoptions: analytics.monthly.adoptions },
    { name: 'Yearly', revenue: analytics.yearly.revenue, adoptions: analytics.yearly.adoptions },
  ];

  const pieData = [
    { name: 'Active Adoptions', value: analytics.overview.totalAdoptions },
    { name: 'Available Plants', value: analytics.overview.totalBambooPlants - analytics.overview.totalAdoptions },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <img className="h-8 w-8" src="/bamboo-logo.svg" alt="Adopt Bamboo" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 font-medium">Adopt Bamboo System Analytics</p>
              </div>
            </div>
            <div className="flex items-center bg-green-50 px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">Welcome, {user?.firstName || 'Admin'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'packages'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📦 Pengurusan Pakej
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'locations'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📍 Pengurusan Lokasi
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Pengurusan Pengguna
            </button>
            <button
              onClick={() => setActiveTab('adoptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'adoptions'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🌱 Pengurusan Adopsi
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analytics' && (
          <>
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-blue-100 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Subscribers</dt>
                    <dd className="text-2xl font-bold text-gray-900">{analytics.overview.totalSubscribers}</dd>
                    <dd className="text-xs text-blue-600 font-medium">Active Users</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-green-100 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Adoptions</dt>
                    <dd className="text-2xl font-bold text-gray-900">{analytics.overview.totalAdoptions}</dd>
                    <dd className="text-xs text-green-600 font-medium">Bamboo Adopted</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-yellow-100 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-2xl font-bold text-gray-900">{CurrencyFormatter.format(analytics.overview.totalRevenue)}</dd>
                    <dd className="text-xs text-orange-600 font-medium">Malaysian Ringgit</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-emerald-100 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Bamboo Plants</dt>
                    <dd className="text-2xl font-bold text-gray-900">{analytics.overview.totalBambooPlants}</dd>
                    <dd className="text-xs text-emerald-600 font-medium">Growing Strong</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full mr-3"></div>
              Revenue Analytics
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }} 
                />
                <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Adoption Distribution */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
              Plant Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Daily */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow-xl rounded-2xl border border-blue-100">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
              <h3 className="text-lg font-bold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Daily Analytics
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Adoptions Today</span>
                  <span className="text-lg font-bold text-blue-600">{analytics.daily.adoptions}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Revenue Today</span>
                  <span className="text-lg font-bold text-blue-600">{CurrencyFormatter.format(analytics.daily.revenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden shadow-xl rounded-2xl border border-green-100">
            <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600">
              <h3 className="text-lg font-bold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Monthly Analytics
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Adoptions This Month</span>
                  <span className="text-lg font-bold text-green-600">{analytics.monthly.adoptions}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Revenue This Month</span>
                  <span className="text-lg font-bold text-green-600">{CurrencyFormatter.format(analytics.monthly.revenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Yearly */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden shadow-xl rounded-2xl border border-purple-100">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600">
              <h3 className="text-lg font-bold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Yearly Analytics
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Adoptions This Year</span>
                  <span className="text-lg font-bold text-purple-600">{analytics.yearly.adoptions}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Revenue This Year</span>
                  <span className="text-lg font-bold text-purple-600">{CurrencyFormatter.format(analytics.yearly.revenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Adoptions */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-gray-500 to-gray-700 rounded-full mr-3"></div>
              Recent Adoptions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plant Code</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Adoption Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.recentAdoptions.map((adoption, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {(adoption.user?.firstName?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {adoption.user?.firstName} {adoption.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{adoption.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {adoption.plant?.plantCode || `BAMBOO-${adoption.adoption.id.toString().padStart(6, '0')}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {new Date(adoption.adoption.adoptionDate).toLocaleDateString('ms-MY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {CurrencyFormatter.format(parseFloat(adoption.adoption.adoptionPrice || '0') / 100)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                        adoption.adoption.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {adoption.adoption.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {/* Users Management Section */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Pengurusan Pengguna</h2>
              <div className="text-sm text-gray-600">
                Total: {users.length} pengguna
              </div>
            </div>

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pengguna
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Adopsi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Belanja
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adopsi Aktif
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarikh Daftar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tindakan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userRecord) => (
                      <tr key={userRecord.user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-green-800">
                                  {userRecord.user.firstName?.charAt(0) || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {userRecord.user.firstName} {userRecord.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {userRecord.user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userRecord.user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userRecord.totalAdoptions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {CurrencyFormatter.format(parseFloat(userRecord.totalSpent || '0'))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userRecord.activeAdoptions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(userRecord.user.createdAt).toLocaleDateString('ms-MY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openUserModal(userRecord)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Adoptions Management Section */}
        {activeTab === 'adoptions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Pengurusan Adopsi</h2>
              <div className="text-sm text-gray-600">
                Total: {adoptions.length} adopsi
              </div>
            </div>

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pengguna
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pakej
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lokasi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Harga
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarikh Adopsi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tindakan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adoptions.map((adoptionRecord) => (
                      <tr key={adoptionRecord.adoption.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-800">
                                  {adoptionRecord.user?.firstName?.charAt(0) || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {adoptionRecord.user?.firstName} {adoptionRecord.user?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {adoptionRecord.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {adoptionRecord.adoption.packageName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {adoptionRecord.adoption.packageId || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {adoptionRecord.adoption.locationName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {CurrencyFormatter.format(parseFloat(adoptionRecord.adoption.adoptionPrice || '0')/100)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(adoptionRecord.adoption.adoptionDate).toLocaleDateString('ms-MY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            adoptionRecord.adoption.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {adoptionRecord.adoption.isActive ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openAdoptionModal(adoptionRecord)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Packages Management Section */}
        {activeTab === 'packages' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Pengurusan Pakej</h2>
              <button
                onClick={() => {
                  setEditingPackage(null);
                  setShowPackageModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Tambah Pakej Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingPackage(pkg);
                          setShowPackageModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deletePackage(pkg.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l1.293 1.293a1 1 0 001.414-1.414L10.414 12l1.293-1.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{pkg.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Harga:</span>
                      <span className="font-bold text-green-600">{CurrencyFormatter.format(pkg.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Tempoh:</span>
                      <span className="font-medium">{pkg.period}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pkg.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>
                  {pkg.features && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Ciri-ciri:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {(() => {
                          try {
                            return JSON.parse(pkg.features).map((feature: string, index: number) => (
                              <li key={index}>• {feature}</li>
                            ));
                          } catch (error) {
                            return <li>Invalid features data</li>;
                          }
                        })()}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locations Management Section */}
        {activeTab === 'locations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Pengurusan Lokasi</h2>
              <button
                onClick={() => {
                  setEditingLocation(null);
                  setShowLocationModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Tambah Lokasi Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <div key={location.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{location.image || '📍'}</span>
                      <h3 className="text-lg font-bold text-gray-900">{location.name}</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingLocation(location);
                          setShowLocationModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteLocation(location.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l1.293 1.293a1 1 0 001.414-1.414L10.414 12l1.293-1.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{location.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Alamat:</span>
                      <span className="text-sm font-medium">{location.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Koordinat:</span>
                      <span className="text-sm font-medium">{location.coordinates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Kapasiti:</span>
                      <span className="font-medium">{location.capacity} slot</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Terisi:</span>
                      <span className="font-medium">{location.currentCount} slot</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Jenis Tanah:</span>
                      <span className="text-sm font-medium">{location.soilType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Keadaan:</span>
                      <span className="text-sm font-medium">{location.areaCondition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {location.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>
                  {location.features && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Kelebihan:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {(() => {
                          try {
                            return JSON.parse(location.features).map((feature: string, index: number) => (
                              <li key={index}>• {feature}</li>
                            ));
                          } catch (error) {
                            return <li>Invalid features data</li>;
                          }
                        })()}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PackageModal
        isOpen={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        onSave={fetchPackages}
        editingPackage={editingPackage}
      />
      
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSave={fetchLocations}
        editingLocation={editingLocation}
      />

      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSave={fetchUsers}
        editingUser={editingUser}
      />

      <AdoptionModal
        isOpen={showAdoptionModal}
        onClose={() => setShowAdoptionModal(false)}
        onSave={fetchAdoptions}
        editingAdoption={editingAdoption}
      />
    </div>
  );
}