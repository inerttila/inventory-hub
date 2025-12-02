import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FinalProducts.css';

const FinalProducts = () => {
  const [finalProducts, setFinalProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    product_code: '',
    barcode: '',
    category: '',
    description: '',
    profit_margin: '',
    components: []
  });

  useEffect(() => {
    fetchFinalProducts();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchFinalProducts = async () => {
    try {
      const res = await axios.get('/api/final-products');
      setFinalProducts(res.data);
    } catch (error) {
      console.error('Error fetching final products:', error);
      alert('Error loading final products');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddComponent = () => {
    setFormData({
      ...formData,
      components: [...formData.components, { product: '', quantity: '', unit_price: '' }]
    });
  };

  const handleComponentChange = (index, field, value) => {
    const updatedComponents = [...formData.components];
    updatedComponents[index][field] = value;
    
    // Auto-fill unit_price from selected product
    if (field === 'product' && value) {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        updatedComponents[index].unit_price = parseFloat(selectedProduct.price || 0);
      }
    }
    
    setFormData({ ...formData, components: updatedComponents });
  };

  const handleRemoveComponent = (index) => {
    const updatedComponents = formData.components.filter((_, i) => i !== index);
    setFormData({ ...formData, components: updatedComponents });
  };

  const calculateTotalPrice = () => {
    return formData.components.reduce((sum, comp) => {
      const qty = parseFloat(comp.quantity) || 0;
      const price = parseFloat(comp.unit_price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.components.length === 0) {
      alert('Please add at least one component');
      return;
    }

    try {
      const totalPrice = calculateTotalPrice();
      const data = {
        ...formData,
        total_price: totalPrice,
        profit_margin: parseFloat(formData.profit_margin) || 0,
        components: formData.components.map(comp => ({
          product: comp.product,
          quantity: parseFloat(comp.quantity),
          unit_price: parseFloat(comp.unit_price)
        }))
      };

      if (editingProduct) {
        await axios.put(`/api/final-products/${editingProduct.id}`, data);
      } else {
        await axios.post('/api/final-products', data);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchFinalProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving final product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      product_code: product.product_code,
      barcode: product.barcode || '',
      category: product.category?.id || product.categoryId || product.category,
      description: product.description || '',
      profit_margin: product.profit_margin || '',
      components: product.components.map(comp => ({
        product: comp.product?.id || comp.productId || comp.product,
        quantity: comp.quantity,
        unit_price: comp.unit_price
      }))
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this final product?')) return;
    
    try {
      await axios.delete(`/api/final-products/${id}`);
      fetchFinalProducts();
    } catch (error) {
      alert('Error deleting final product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      product_code: '',
      barcode: '',
      category: '',
      description: '',
      profit_margin: '',
      components: []
    });
  };

  const totalPrice = calculateTotalPrice();
  const profitMargin = parseFloat(formData.profit_margin) || 0;
  const finalSellingPrice = totalPrice * (1 + profitMargin / 100);

  return (
    <div className="final-products-container">
      <div className="page-header">
        <h2>Final Products</h2>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setEditingProduct(null); resetForm(); }}>
          + Add Final Product
        </button>
      </div>

      <div className="final-products-grid">
        {finalProducts.map(product => (
          <div key={product.id} className="final-product-card">
            <div className="final-product-header">
              <h3>{product.name}</h3>
              <div className="product-actions">
                <button className="btn-icon" onClick={() => handleEdit(product)}>✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(product.id)}>🗑️</button>
              </div>
            </div>
            <div className="final-product-info">
              <p><strong>Code:</strong> {product.product_code}</p>
              {product.barcode && <p><strong>Barcode:</strong> {product.barcode}</p>}
              <p><strong>Category:</strong> {product.category?.name || 'N/A'}</p>
              <div className="price-section">
                <p className="total-price"><strong>Total Cost:</strong> ${parseFloat(product.total_price || 0).toFixed(2)}</p>
                {product.profit_margin > 0 && (
                  <p className="selling-price"><strong>Selling Price:</strong> ${parseFloat(product.final_selling_price || 0).toFixed(2)}</p>
                )}
                {product.profit_margin > 0 && (
                  <p className="margin"><strong>Profit Margin:</strong> {product.profit_margin}%</p>
                )}
              </div>
              {product.description && <p className="description">{product.description}</p>}
              <div className="components-list">
                <strong>Components:</strong>
                <ul>
                  {product.components.map((comp, idx) => (
                    <li key={idx}>
                      {comp.product?.name || 'N/A'} - Qty: {comp.quantity} @ ${parseFloat(comp.unit_price || 0).toFixed(2)} = ${(parseFloat(comp.quantity || 0) * parseFloat(comp.unit_price || 0)).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingProduct(null); resetForm(); }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Final Product' : 'Add New Final Product'}</h3>
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

              <div className="form-row">
                <div className="form-group">
                  <label>Product Code *</label>
                  <input
                    type="text"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Profit Margin (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.profit_margin}
                    onChange={(e) => setFormData({ ...formData, profit_margin: e.target.value })}
                    placeholder="e.g., 20 for 20%"
                  />
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

              <div className="components-section">
                <div className="components-header">
                  <h4>Components *</h4>
                  <button type="button" className="btn btn-secondary btn-small" onClick={handleAddComponent}>
                    + Add Component
                  </button>
                </div>

                {formData.components.map((component, index) => (
                  <div key={index} className="component-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Product</label>
                        <select
                          value={component.product}
                          onChange={(e) => handleComponentChange(index, 'product', e.target.value)}
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map(prod => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} (${parseFloat(prod.price || 0).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Quantity</label>
                        <input
                          type="number"
                          step="0.01"
                          value={component.quantity}
                          onChange={(e) => handleComponentChange(index, 'quantity', e.target.value)}
                          required
                          min="0.01"
                        />
                      </div>

                      <div className="form-group">
                        <label>Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={component.unit_price}
                          onChange={(e) => handleComponentChange(index, 'unit_price', e.target.value)}
                          required
                          min="0"
                        />
                      </div>

                      <div className="form-group">
                        <label>Subtotal</label>
                        <input
                          type="text"
                          value={`$${((parseFloat(component.quantity) || 0) * (parseFloat(component.unit_price) || 0)).toFixed(2)}`}
                          disabled
                          className="subtotal-input"
                        />
                      </div>

                      <div className="form-group">
                        <label>&nbsp;</label>
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => handleRemoveComponent(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {formData.components.length === 0 && (
                  <p className="no-components">No components added. Click "Add Component" to add one.</p>
                )}
              </div>

              <div className="price-summary">
                <div className="summary-row">
                  <span><strong>Total Cost:</strong></span>
                  <span className="total-cost">${totalPrice.toFixed(2)}</span>
                </div>
                {profitMargin > 0 && (
                  <>
                    <div className="summary-row">
                      <span><strong>Profit Margin:</strong></span>
                      <span>{profitMargin}%</span>
                    </div>
                    <div className="summary-row">
                      <span><strong>Final Selling Price:</strong></span>
                      <span className="selling-price">${finalSellingPrice.toFixed(2)}</span>
                    </div>
                  </>
                )}
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
    </div>
  );
};

export default FinalProducts;

