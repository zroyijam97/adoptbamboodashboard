'use client';

import { useState, useEffect } from 'react';

interface AdoptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adoptionData: any) => void;
  editingAdoption: any;
}

export default function AdoptionModal({ isOpen, onClose, onSave, editingAdoption }: AdoptionModalProps) {
  const [formData, setFormData] = useState({
    adoptionPrice: '',
    packageName: '',
    locationName: '',
    isActive: true,
    subscriptionImage: '',
  });

  useEffect(() => {
    if (editingAdoption) {
      setFormData({
        adoptionPrice: editingAdoption.adoption.adoptionPrice || '',
        packageName: editingAdoption.adoption.packageName || '',
        locationName: editingAdoption.adoption.locationName || '',
        isActive: editingAdoption.adoption.isActive || false,
        subscriptionImage: editingAdoption.adoption.subscriptionImage || '',
      });
    } else {
      setFormData({
        adoptionPrice: '',
        packageName: '',
        locationName: '',
        isActive: true,
        subscriptionImage: '',
      });
    }
  }, [editingAdoption]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/adoptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adoptionId: editingAdoption?.adoption.id,
          ...formData,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        onSave(result.data);
        onClose();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving adoption:', error);
      alert('Error saving adoption');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Edit Adoption
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adoption Price (RM)
            </label>
            <input
              type="text"
              value={formData.adoptionPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, adoptionPrice: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Name
            </label>
            <input
              type="text"
              value={formData.packageName}
              onChange={(e) => setFormData(prev => ({ ...prev, packageName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name
            </label>
            <input
              type="text"
              value={formData.locationName}
              onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Image URL
            </label>
            <input
              type="url"
              value={formData.subscriptionImage}
              onChange={(e) => setFormData(prev => ({ ...prev, subscriptionImage: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://example.com/image.jpg"
            />
            {formData.subscriptionImage && (
              <div className="mt-2">
                <img 
                  src={formData.subscriptionImage} 
                  alt="Subscription Preview" 
                  className="w-full h-32 object-cover rounded-md border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active Adoption
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Update Adoption
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}