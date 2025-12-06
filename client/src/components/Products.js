import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/axiosConfig';
import './Products.css';
import { useNotification } from '../context/NotificationContext';
import { useCurrency } from '../context/CurrencyContext';
import ConfirmDialog from './ConfirmDialog';

const Products = () => {
  const { showSuccess, showError } = useNotification();
  const { formatPrice, currencies } = useCurrency();
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price_per_square_meter: '',
    square_meters: '',
    description: '',
    currency: ''
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showError('Error loading products');
    }
  }, [showError]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price_per_square_meter: parseFloat(formData.price_per_square_meter),
        square_meters: parseFloat(formData.square_meters) || 0,
        currencyId: formData.currency || null
      };
      delete data.currency;

      if (editingProduct) {
        await apiClient.put(`/api/products/${editingProduct.id}`, data);
      } else {
        await apiClient.post('/api/products', data);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
      showSuccess(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      price_per_square_meter: product.price_per_square_meter || '',
      square_meters: product.square_meters || '',
      description: product.description || '',
      currency: product.currency?.id || product.currencyId || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: "Are you sure you want to delete this product?",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/products/${id}`);
          fetchProducts();
          showSuccess("Product deleted successfully!");
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        } catch (error) {
          showError("Error deleting product");
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      barcode: '',
      price_per_square_meter: '',
      square_meters: '',
      description: '',
      currency: ''
    });
  };

  return (
    <div className="products-container">
      <div className="page-header">
        <h2>Products</h2>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setEditingProduct(null); resetForm(); }}>
            + Add Product
          </button>
        </div>
      </div>

      <div className="products-grid">
        {products
          .filter((product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(product => (
          <div key={product.id} className="product-card">
            <div className="product-header">
              <h3>{product.name}</h3>
              <div className="product-actions">
                <button className="btn-icon" onClick={() => handleEdit(product)}>✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(product.id)}>🗑️</button>
              </div>
            </div>
            <div className="product-info">
              <p><strong>Barcode:</strong> {product.barcode}</p>
              <p><strong>Price per m²:</strong> {formatPrice(product.price_per_square_meter || 0, product.currency?.symbol || '$')}</p>
              <p><strong>Square Meters (m²):</strong> {parseFloat(product.square_meters || 0).toFixed(2)}</p>
              {product.description && <p className="description"><strong>Description:</strong> {product.description}</p>}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingProduct(null); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
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
                <label>Barcode *</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price per m² *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_per_square_meter}
                    onChange={(e) => setFormData({ ...formData, price_per_square_meter: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Square Meters (m²) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.square_meters}
                    onChange={(e) => setFormData({ ...formData, square_meters: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="">Select Currency</option>
                  {currencies.map(currency => (
                    <option key={currency.id} value={currency.id}>
                      {currency.symbol} - {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
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
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingProduct(null); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update' : 'Create'}
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

export default Products;

