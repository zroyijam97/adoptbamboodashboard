'use client';

import { useState, useEffect } from 'react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingLocation: any;
}

export default function LocationModal({ isOpen, onClose, onSave, editingLocation }: LocationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    capacity: '',
    currentCount: '',
    soilType: '',
    areaCondition: '',
    features: [''],
    image: '',
    coordinates: '',
    availability: '',
    isActive: true
  });

  useEffect(() => {
    if (editingLocation) {
      setFormData({
        name: editingLocation.name || '',
        address: editingLocation.address || '',
        latitude: editingLocation.latitude || '',
        longitude: editingLocation.longitude || '',
        description: editingLocation.description || '',
        capacity: editingLocation.capacity || '',
        currentCount: editingLocation.currentCount || '',
        soilType: editingLocation.soilType || '',
        areaCondition: editingLocation.areaCondition || '',
        features: editingLocation.features ? JSON.parse(editingLocation.features) : [''],
        image: editingLocation.image || '',
        coordinates: editingLocation.coordinates || '',
        availability: editingLocation.availability || '',
        isActive: editingLocation.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        description: '',
        capacity: '',
        currentCount: '',
        soilType: '',
        areaCondition: '',
        features: [''],
        image: '',
        coordinates: '',
        availability: '',
        isActive: true
      });
    }
  }, [editingLocation, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingLocation ? 'PUT' : 'POST';
      const body = editingLocation 
        ? { ...formData, id: editingLocation.id }
        : formData;

      const response = await fetch('/api/admin/locations', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        onSave();
        onClose();
      }
    } catch (err) {
      console.error('Error saving location:', err);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lokasi
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapasiti
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bilangan Semasa
              </label>
              <input
                type="number"
                value={formData.currentCount}
                onChange={(e) => setFormData(prev => ({ ...prev, currentCount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Tanah
              </label>
              <input
                type="text"
                value={formData.soilType}
                onChange={(e) => setFormData(prev => ({ ...prev, soilType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: Tanah liat, Tanah berpasir"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keadaan Kawasan
              </label>
              <input
                type="text"
                value={formData.areaCondition}
                onChange={(e) => setFormData(prev => ({ ...prev, areaCondition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: Berbukit, Rata, Berhutan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Gambar
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Koordinat (Format: lat,lng)
              </label>
              <input
                type="text"
                value={formData.coordinates}
                onChange={(e) => setFormData(prev => ({ ...prev, coordinates: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="3.1390,101.6869"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Ketersediaan
            </label>
            <select
              value={formData.availability}
              onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Pilih Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Terhad">Terhad</option>
              <option value="Penuh">Penuh</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelebihan Lokasi
            </label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Masukkan kelebihan lokasi"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Hapus
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFeature}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Tambah Kelebihan
            </button>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Lokasi Aktif</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {editingLocation ? 'Kemaskini' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}