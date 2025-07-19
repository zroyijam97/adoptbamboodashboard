'use client';

import { useState } from 'react';

export default function TestPollingPage() {
  const [billCode, setBillCode] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePoll = async () => {
    if (!billCode || !referenceNo) {
      alert('Please enter both Bill Code and Reference No');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payment/poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billCode,
          referenceNo,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error polling payment:', error);
      setResult({ error: 'Failed to poll payment status' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!billCode || !referenceNo) {
      alert('Please enter both Bill Code and Reference No');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/payment/poll?billCode=${billCode}&referenceNo=${referenceNo}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error checking status:', error);
      setResult({ error: 'Failed to check payment status' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Test Payment Polling
        </h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="billCode" className="block text-sm font-medium text-gray-700">
              Bill Code
            </label>
            <input
              type="text"
              id="billCode"
              value={billCode}
              onChange={(e) => setBillCode(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Enter bill code"
            />
          </div>
          
          <div>
            <label htmlFor="referenceNo" className="block text-sm font-medium text-gray-700">
              Reference No
            </label>
            <input
              type="text"
              id="referenceNo"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Enter reference number"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handlePoll}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Poll & Process'}
            </button>
            
            <button
              onClick={handleCheckStatus}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </div>
        
        {result && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}