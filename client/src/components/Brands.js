import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/axiosConfig';
import './Brands.css';
import { useNotification } from '../context/NotificationContext';
import ConfirmDialog from './ConfirmDialog';

const Brands = () => {
  const { showSuccess, showError } = useNotification();
  const [brands, setBrands] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  const fetchBrands = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/brands');
      setBrands(res.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
      showError('Error loading brands');
    }
  }, [showError]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await apiClient.put(`/api/brands/${editingBrand.id}`, formData);
      } else {
        await apiClient.post('/api/brands', formData);
      }

      setShowModal(false);
      setEditingBrand(null);
      setFormData({ name: '', description: '' });
      fetchBrands();
      showSuccess(editingBrand ? 'Brand updated successfully!' : 'Brand created successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Error saving brand');
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: "Are you sure you want to delete this brand?",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/brands/${id}`);
          fetchBrands();
          showSuccess('Brand deleted successfully!');
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        } catch (error) {
          showError(error.response?.data?.message || 'Error deleting brand');
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  return (
    <div className="brands-container">
      <div className="page-header">
        <h2>Brands</h2>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setEditingBrand(null); setFormData({ name: '', description: '' }); }}>
          + Add Brand
        </button>
      </div>

      <div className="brands-grid">
        {brands.map(brand => (
          <div key={brand.id} className="brand-card">
            <div className="brand-header">
              <h3>{brand.name}</h3>
              <div className="brand-actions">
                <button className="btn-icon" onClick={() => handleEdit(brand)}>✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(brand.id)}>🗑️</button>
              </div>
            </div>
            {brand.description && (
              <p className="brand-description">{brand.description}</p>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingBrand(null); setFormData({ name: '', description: '' }); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingBrand(null); setFormData({ name: '', description: '' }); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBrand ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, message: "", onConfirm: null })}
      />
    </div>
  );
};

export default Brands;

