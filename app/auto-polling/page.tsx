'use client';

import { useState, useEffect } from 'react';

export default function AutoPollingPage() {
  const [statistics, setStatistics] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Dapatkan statistik semasa
  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/payment/auto-poll');
      const data = await response.json();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Jalankan auto-polling manual
  const runAutoPoll = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment/auto-poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setLastResult(data);
      
      // Refresh statistik selepas polling
      await fetchStatistics();
    } catch (error) {
      console.error('Error running auto-poll:', error);
      setLastResult({ error: 'Failed to run auto-poll' });
    } finally {
      setLoading(false);
    }
  };

  // Load statistik pada page load
  useEffect(() => {
    fetchStatistics();
    
    // Auto-refresh statistik setiap 30 saat
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🤖 Auto-Polling Dashboard
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statistics && (
              <>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="text-sm font-medium text-yellow-800">Pembayaran Pending</h3>
                  <p className="text-2xl font-bold text-yellow-900">{statistics.pendingPayments}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-medium text-green-800">Pembayaran Berjaya</h3>
                  <p className="text-2xl font-bold text-green-900">{statistics.successfulPayments}</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-800">Total Adoption</h3>
                  <p className="text-2xl font-bold text-blue-900">{statistics.totalAdoptions}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-800">Semakan Terakhir</h3>
                  <p className="text-sm text-gray-900">
                    {new Date(statistics.lastChecked).toLocaleString('ms-MY')}
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={runAutoPoll}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? '🔄 Memproses...' : '▶️ Jalankan Auto-Poll'}
            </button>
            
            <button
              onClick={fetchStatistics}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              🔄 Refresh Statistik
            </button>
          </div>
        </div>
        
        {/* Status Auto-Polling */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Status Sistem</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800 mb-2">Auto-Polling Aktif</h3>
              <p className="text-sm text-green-700">
                ✅ Sistem auto-polling berjalan setiap 5 minit secara automatik
              </p>
              <p className="text-xs text-green-600 mt-1">
                Sistem akan memeriksa pembayaran pending dan memproses adoption secara automatik
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Ciri-ciri Sistem</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Pemprosesan automatik pembayaran berjaya</li>
                <li>• Pencegahan duplikasi adoption</li>
                <li>• Pengemaskinian dashboard real-time</li>
                <li>• Logging dan error handling</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Hasil Auto-Poll Terakhir */}
        {lastResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Hasil Auto-Poll Terakhir</h2>
            
            {lastResult.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="text-sm font-medium text-green-800">Diproses</h4>
                    <p className="text-lg font-bold text-green-900">{lastResult.processedCount}</p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800">Sudah Diproses</h4>
                    <p className="text-lg font-bold text-blue-900">{lastResult.alreadyProcessedCount}</p>
                  </div>
                  
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <h4 className="text-sm font-medium text-red-800">Error</h4>
                    <p className="text-lg font-bold text-red-900">{lastResult.errorCount}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Mesej:</h4>
                  <p className="text-sm text-gray-700">{lastResult.message}</p>
                </div>
                
                {lastResult.results && lastResult.results.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Detail Hasil:</h4>
                    <div className="max-h-64 overflow-y-auto">
                      <pre className="text-xs text-gray-600">
                        {JSON.stringify(lastResult.results, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <h4 className="text-sm font-medium text-red-800">Error:</h4>
                <p className="text-sm text-red-700">{lastResult.error || 'Unknown error'}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Panduan */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📖 Panduan Penggunaan</h2>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-medium text-gray-900">Sistem Auto-Polling:</h3>
              <p>Sistem akan secara automatik memeriksa pembayaran pending setiap 5 minit dan memproses adoption jika pembayaran berjaya.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Manual Polling:</h3>
              <p>Anda boleh klik butang "Jalankan Auto-Poll" untuk memproses pembayaran pending secara manual pada bila-bila masa.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Monitoring:</h3>
              <p>Statistik akan dikemaskini secara automatik setiap 30 saat. Anda juga boleh refresh secara manual.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}