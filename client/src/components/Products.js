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
  const [brands, setBrands] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price_per_square_meter: '',
    square_meters: '',
    description: '',
    currency: '',
    brand: ''
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showError('Error loading products');
    }
  }, [showError]);

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
    fetchProducts();
    fetchBrands();
  }, [fetchProducts, fetchBrands]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price_per_square_meter: parseFloat(formData.price_per_square_meter),
        square_meters: parseFloat(formData.square_meters) || 0,
        currencyId: formData.currency || null,
        brandId: formData.brand || null
      };
      delete data.currency;
      delete data.brand;

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
      currency: product.currency?.id || product.currencyId || '',
      brand: product.brand?.id || product.brandId || ''
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
          const errorMessage = error.response?.data?.message || "Error deleting product";
          showError(errorMessage);
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
      currency: '',
      brand: ''
    });
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const filteredProducts = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Activate selection mode and select all
    setShowSelectionMode(true);
    setSelectedItems(filteredProducts.map(p => p.id));
  };

  const handleCancelSelection = () => {
    setShowSelectionMode(false);
    setSelectedItems([]);
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedItems.length} selected product(s)?`,
      onConfirm: async () => {
        try {
          const results = await Promise.allSettled(
            selectedItems.map(id => apiClient.delete(`/api/products/${id}`))
          );
          
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected');
          
          if (failed.length > 0) {
            // Show error messages for failed deletions
            failed.forEach((result, idx) => {
              const errorMessage = result.reason?.response?.data?.message || "Error deleting product";
              showError(errorMessage);
            });
            
            if (successful > 0) {
              showSuccess(`${successful} product(s) deleted successfully!`);
            }
          } else {
            showSuccess(`${selectedItems.length} product(s) deleted successfully!`);
          }
          
          setSelectedItems([]);
          setShowSelectionMode(false);
          fetchProducts();
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Error deleting products";
          showError(errorMessage);
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        }
      },
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
          {products.filter((product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
          ).length > 0 && !showSelectionMode && (
            <button 
              className="btn btn-secondary" 
              onClick={handleSelectAll}
            >
              Select All
            </button>
          )}
          {showSelectionMode && (
            <button 
              className="btn btn-secondary" 
              onClick={handleCancelSelection}
            >
              Unselect
            </button>
          )}
          {selectedItems.length > 0 && showSelectionMode && (
            <button 
              className="btn btn-danger" 
              onClick={handleBulkDelete}
              title={`Delete ${selectedItems.length} selected item(s)`}
            >
              🗑️ Delete Selected ({selectedItems.length})
            </button>
          )}
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
          <div key={product.id} className={`product-card ${selectedItems.includes(product.id) && showSelectionMode ? 'selected' : ''}`}>
            <div className="product-header">
              {showSelectionMode && (
                <label className="product-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(product.id)}
                    onChange={() => handleSelectItem(product.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span></span>
                </label>
              )}
              <h3>{product.name}</h3>
              <div className="product-actions">
                <button className="btn-icon" onClick={() => handleEdit(product)}>✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(product.id)}>🗑️</button>
              </div>
            </div>
            <div className="product-info">
              <p><strong>Barcode:</strong> {product.barcode}</p>
              {product.brand && <p><strong>Brand:</strong> {product.brand.name}</p>}
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

              <div className="form-row">
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
                  <label>Brand *</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
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

