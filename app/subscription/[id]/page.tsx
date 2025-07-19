'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CurrencyFormatter } from '@/lib/formatters';

interface GrowthRecord {
  id: number;
  height: string;
  diameter?: string;
  notes?: string;
  photoUrl?: string;
  recordedDate: string;
  recordedBy?: string;
}

interface GrowthStats {
  totalGrowth: number;
  averageGrowthPerDay: number;
  co2PerDay: number;
  nextMilestone: {
    height: number;
    daysToReach: number;
  };
}

interface SubscriptionDetails {
  adoption: {
    id: number;
    adoptionDate: string;
    adoptionPrice: string;
    isActive: boolean;
    packageDetails: {
      id: string;
      name: string;
      price: string;
      period: string;
      features: string[];
    };
    locationDetails: {
      id: string;
      name: string;
      address?: string;
      coordinates?: string;
      image?: string;
    };
    subscriptionImage?: string;
  };
  plant: {
    id: number;
    plantCode: string;
    species: string;
    location: string;
    currentHeight: string;
    status: string;
    co2Absorbed: string;
    daysSincePlanting?: number;
    plantingDate?: string;
  } | null;
  growthRecords?: GrowthRecord[];
}

export default function SubscriptionDetails() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [growthStats, setGrowthStats] = useState<GrowthStats | null>(null);

  // Calculate growth statistics
  const calculateGrowthStats = (records: GrowthRecord[], plant: any): GrowthStats => {
    if (!records || records.length === 0 || !plant.daysSincePlanting) {
      return {
        totalGrowth: 0,
        averageGrowthPerDay: 0,
        co2PerDay: 0,
        nextMilestone: { height: 0, daysToReach: 0 }
      };
    }

    const currentHeight = parseFloat(plant.currentHeight) || 0;
    const daysSincePlanting = plant.daysSincePlanting || 1;
    const co2Absorbed = parseFloat(plant.co2Absorbed) || 0;

    // Calculate average growth per day
    const averageGrowthPerDay = currentHeight / daysSincePlanting;
    const co2PerDay = co2Absorbed / daysSincePlanting;

    // Calculate next milestone (next 5m increment)
    const nextMilestoneHeight = Math.ceil(currentHeight / 5) * 5;
    const remainingGrowth = nextMilestoneHeight - currentHeight;
    const daysToReach = averageGrowthPerDay > 0 ? Math.ceil(remainingGrowth / averageGrowthPerDay) : 0;

    return {
      totalGrowth: currentHeight,
      averageGrowthPerDay: Math.round(averageGrowthPerDay * 1000) / 1000,
      co2PerDay: Math.round(co2PerDay * 1000) / 1000,
      nextMilestone: {
        height: nextMilestoneHeight,
        daysToReach
      }
    };
  };

  // Get growth stage based on height
  const getGrowthStage = (height: number): { stage: string; color: string; description: string } => {
    if (height < 1) {
      return { stage: 'Seedling', color: 'text-green-400', description: 'Tunas baru' };
    } else if (height < 10) {
      return { stage: 'Juvenile', color: 'text-green-500', description: 'Pertumbuhan pesat' };
    } else if (height < 20) {
      return { stage: 'Mature', color: 'text-green-600', description: 'Hampir matang' };
    } else {
      return { stage: 'Full-grown', color: 'text-green-700', description: 'Matang sepenuhnya' };
    }
  };

  useEffect(() => {
    if (isLoaded && user && params.id) {
      fetchSubscriptionDetails();
    }
  }, [isLoaded, user, params.id]);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch(`/api/user/subscription/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubscription(data.data);
          
          // Calculate growth statistics if plant data exists
          if (data.data.plant && data.data.growthRecords) {
            const stats = calculateGrowthStats(data.data.growthRecords, data.data.plant);
            setGrowthStats(stats);
          }
        } else {
          setError(data.message || 'Failed to fetch subscription details');
        }
      } else {
        setError('Failed to fetch subscription details');
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      setError('An error occurred while fetching subscription details');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (adoptionId: number, plantCode: string) => {
    try {
      const response = await fetch(`/api/user/certificate/${adoptionId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `bamboo-certificate-${plantCode}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download certificate');
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('An error occurred while downloading the certificate');
    }
  };

  const openGoogleMaps = (coordinates: string) => {
    // Parse coordinates (assuming format like "5.4164, 100.3327" or "5.4164,100.3327")
    const coords = coordinates.replace(/\s/g, '').split(',');
    if (coords.length === 2) {
      const lat = coords[0].trim();
      const lng = coords[1].trim();
      const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      alert('Invalid coordinates format');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Subscription not found'}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Subscription Details</h1>
            <p className="text-gray-600 mt-2">View your bamboo adoption details</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscription Image Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Subscription Image</h2>
            <p className="text-gray-600 text-sm mb-4">The photo of your bamboo growth will be shown here.</p>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
              <img 
                src={subscription.adoption.subscriptionImage || '/default-subscription.svg'} 
                alt="Subscription Image"
                className="w-full h-full object-cover"
              />
              {!subscription.adoption.subscriptionImage && (
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                  <p className="text-gray-500 text-xs bg-white bg-opacity-75 px-2 py-1 rounded">
                    Default subscription illustration
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Package Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Package Name:</span>
                <span className="font-medium text-green-600">{subscription.adoption.packageDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-blue-600">
                  {CurrencyFormatter.format(parseFloat(subscription.adoption.packageDetails.price))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Period:</span>
                <span className="font-medium capitalize">{subscription.adoption.packageDetails.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Adoption Date:</span>
                <span className="font-medium">
                  {new Date(subscription.adoption.adoptionDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${subscription.adoption.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {subscription.adoption.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Package Features */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Package Features</h3>
              <ul className="space-y-2">
                {subscription.adoption.packageDetails.features && Array.isArray(subscription.adoption.packageDetails.features) ? (
                  subscription.adoption.packageDetails.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 italic">No features available</li>
                )}
              </ul>
            </div>
          </div>

          {/* Plant Details */}
          {subscription.plant && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Plant Information</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plant Code:</span>
                  <span className="font-medium text-green-600">{subscription.plant.plantCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Species:</span>
                  <span className="font-medium">{subscription.plant.species}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Height:</span>
                  <span className="font-medium text-blue-600">{subscription.plant.currentHeight}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Growth Stage:</span>
                  <span className={`font-medium ${getGrowthStage(parseFloat(subscription.plant.currentHeight) || 0).color}`}>
                    {getGrowthStage(parseFloat(subscription.plant.currentHeight) || 0).stage}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">{subscription.plant.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CO₂ Absorbed:</span>
                  <span className="font-medium text-green-600">{subscription.plant.co2Absorbed} kg</span>
                </div>
                {subscription.plant.daysSincePlanting !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Growing:</span>
                    <span className="font-medium text-green-600">{subscription.plant.daysSincePlanting} days</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Growth Analytics */}
          {subscription.plant && growthStats && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Growth Analytics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{growthStats.totalGrowth}m</div>
                  <div className="text-sm text-gray-600">Total Height</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{growthStats.averageGrowthPerDay}m</div>
                  <div className="text-sm text-gray-600">Growth/Day</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{growthStats.co2PerDay}kg</div>
                  <div className="text-sm text-gray-600">CO₂/Day</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{growthStats.nextMilestone.daysToReach}</div>
                  <div className="text-sm text-gray-600">Days to {growthStats.nextMilestone.height}m</div>
                </div>
              </div>
              
              {/* Growth Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress to next milestone</span>
                  <span>{growthStats.nextMilestone.height}m target</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (growthStats.totalGrowth / growthStats.nextMilestone.height) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((growthStats.totalGrowth / growthStats.nextMilestone.height) * 100)}% complete
                </div>
              </div>
            </div>
          )}

          {/* Growth Tracking */}
          {subscription.plant && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Growth Tracking</h2>
              {subscription.growthRecords && subscription.growthRecords.length > 0 ? (
                <div className="space-y-4">
                  {subscription.growthRecords.map((record, index) => {
                    const isAutoGenerated = record.recordedBy?.includes('System') || record.recordedBy?.includes('Auto-generated');
                    return (
                      <div key={record.id} className={`border-l-4 ${isAutoGenerated ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'} pl-4 py-3 rounded-r-lg`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-800">
                              Record #{subscription.growthRecords!.length - index}
                            </h3>
                            {isAutoGenerated && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                Auto-generated
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(record.recordedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Height:</span>
                            <span className={`font-medium ml-2 ${isAutoGenerated ? 'text-blue-600' : 'text-green-600'}`}>
                              {record.height}m
                            </span>
                          </div>
                          {record.diameter && (
                            <div>
                              <span className="text-gray-600">Diameter:</span>
                              <span className={`font-medium ml-2 ${isAutoGenerated ? 'text-blue-600' : 'text-green-600'}`}>
                                {record.diameter}cm
                              </span>
                            </div>
                          )}
                        </div>
                        {record.notes && (
                          <div className="mt-2">
                            <span className="text-gray-600 text-sm">Notes:</span>
                            <p className="text-gray-700 text-sm mt-1">{record.notes}</p>
                          </div>
                        )}
                        {record.photoUrl && (
                          <div className="mt-3">
                            <img 
                              src={record.photoUrl} 
                              alt={`Growth record ${index + 1}`}
                              className="w-full max-w-xs h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        {record.recordedBy && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Recorded by: {record.recordedBy}
                            </span>
                            {isAutoGenerated && (
                              <span className="text-xs text-blue-500 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Algorithm-based
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>No growth records available yet</p>
                  <p className="text-sm mt-1">Growth tracking data will appear here as your bamboo grows</p>
                </div>
              )}
            </div>
          )}

          {/* Location Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Location Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium text-green-600">{subscription.adoption.locationDetails.name}</span>
              </div>
              {subscription.adoption.locationDetails.address && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium">{subscription.adoption.locationDetails.address}</span>
                </div>
              )}
              {subscription.adoption.locationDetails.coordinates && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coordinates:</span>
                    <span className="font-medium">{subscription.adoption.locationDetails.coordinates}</span>
                  </div>
                  <button
                    onClick={() => openGoogleMaps(subscription.adoption.locationDetails.coordinates!)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Open in Google Maps</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button 
            onClick={() => downloadCertificate(subscription.adoption.id, subscription.plant?.plantCode || 'Unknown')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download Certificate</span>
          </button>
        </div>


      </div>
    </div>
  );
}