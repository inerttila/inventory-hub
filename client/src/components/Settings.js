import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../utils/axiosConfig";
import "./Settings.css";
import { useNotification } from "../context/NotificationContext";
import { useCurrency } from "../context/CurrencyContext";
import ConfirmDialog from "./ConfirmDialog";
import Spinner from "./Spinner";

const Settings = ({ onClose }) => {
  const { showSuccess, showError } = useNotification();
  const { refreshCurrencies } = useCurrency();
  const [currencies, setCurrencies] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    symbol: "",
  });
  const [clientFormData, setClientFormData] = useState({
    fullName: "",
    number: "",
    email: "",
    address: "",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isClientsOpen, setIsClientsOpen] = useState(false);
  const [isBrandsOpen, setIsBrandsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [brandFormData, setBrandFormData] = useState({
    name: "",
    description: "",
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
  });

  const fetchCurrencies = useCallback(async () => {
    try {
      setLoadingCurrencies(true);
      const res = await apiClient.get("/api/currencies");
      setCurrencies(res.data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      showError("Error loading currencies");
    } finally {
      setLoadingCurrencies(false);
    }
  }, [showError]);

  const fetchClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      const res = await apiClient.get("/api/clients");
      setClients(res.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      showError("Error loading clients");
    } finally {
      setLoadingClients(false);
    }
  }, [showError]);

  const fetchBrands = useCallback(async () => {
    try {
      setLoadingBrands(true);
      const res = await apiClient.get("/api/brands");
      setBrands(res.data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      showError("Error loading brands");
    } finally {
      setLoadingBrands(false);
    }
  }, [showError]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await apiClient.get("/api/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showError("Error loading categories");
    } finally {
      setLoadingCategories(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchCurrencies();
    fetchClients();
    fetchBrands();
    fetchCategories();
  }, [fetchCurrencies, fetchClients, fetchBrands, fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCurrency) {
        await apiClient.put(`/api/currencies/${editingCurrency.id}`, formData);
        showSuccess("Currency updated successfully!");
      } else {
        await apiClient.post("/api/currencies", formData);
        showSuccess("Currency created successfully!");
      }
      setShowModal(false);
      setEditingCurrency(null);
      resetForm();
      fetchCurrencies();
      refreshCurrencies();
    } catch (error) {
      showError(error.response?.data?.message || "Error saving currency");
    }
  };

  const handleEdit = (currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: "Are you sure you want to delete this currency?",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/currencies/${id}`);
          showSuccess("Currency deleted successfully!");
          fetchCurrencies();
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        } catch (error) {
          showError("Error deleting currency");
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      symbol: "",
    });
  };

  const resetClientForm = () => {
    setClientFormData({
      fullName: "",
      number: "",
      email: "",
      address: "",
    });
  };

  const resetBrandForm = () => {
    setBrandFormData({
      name: "",
      description: "",
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      description: "",
    });
  };

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await apiClient.put(`/api/brands/${editingBrand.id}`, brandFormData);
        showSuccess("Brand updated successfully!");
      } else {
        await apiClient.post("/api/brands", brandFormData);
        showSuccess("Brand created successfully!");
      }
      setShowBrandModal(false);
      setEditingBrand(null);
      resetBrandForm();
      fetchBrands();
    } catch (error) {
      showError(error.response?.data?.message || "Error saving brand");
    }
  };

  const handleBrandEdit = (brand) => {
    setEditingBrand(brand);
    setBrandFormData({
      name: brand.name,
      description: brand.description || "",
    });
    setShowBrandModal(true);
  };

  const handleBrandDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: "Are you sure you want to delete this brand?",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/brands/${id}`);
          showSuccess("Brand deleted successfully!");
          fetchBrands();
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        } catch (error) {
          showError(error.response?.data?.message || "Error deleting brand");
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await apiClient.put(`/api/categories/${editingCategory.id}`, categoryFormData);
        showSuccess("Category updated successfully!");
      } else {
        await apiClient.post("/api/categories", categoryFormData);
        showSuccess("Category created successfully!");
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      resetCategoryForm();
      fetchCategories();
    } catch (error) {
      showError(error.response?.data?.message || "Error saving category");
    }
  };

  const handleCategoryEdit = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowCategoryModal(true);
  };

  const handleCategoryDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: "Are you sure you want to delete this category?",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/categories/${id}`);
          showSuccess("Category deleted successfully!");
          fetchCategories();
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        } catch (error) {
          showError(error.response?.data?.message || "Error deleting category");
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await apiClient.put(`/api/clients/${editingClient.id}`, clientFormData);
        showSuccess("Client updated successfully!");
      } else {
        await apiClient.post("/api/clients", clientFormData);
        showSuccess("Client created successfully!");
      }
      setShowClientModal(false);
      setEditingClient(null);
      resetClientForm();
      fetchClients();
    } catch (error) {
      showError(error.response?.data?.message || "Error saving client");
    }
  };

  const handleClientEdit = (client) => {
    setEditingClient(client);
    setClientFormData({
      fullName: client.fullName || "",
      number: client.number || "",
      email: client.email || "",
      address: client.address || "",
    });
    setShowClientModal(true);
  };

  const handleClientDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: "Are you sure you want to delete this client?",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/clients/${id}`);
          showSuccess("Client deleted successfully!");
          fetchClients();
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        } catch (error) {
          showError("Error deleting client");
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-content" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-header-content">
            <div className="settings-header-icon">⚙️</div>
            <div>
              <h2>Management</h2>
              <p className="settings-subtitle">Manage your system settings and configurations</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-sections-container">
        <div className={`settings-section ${isCurrencyOpen ? "active" : ""}`}>
          <div
            className={`section-header clickable ${isCurrencyOpen ? "active" : ""}`}
            onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
          >
            <div className="section-header-left">
              <div className="section-icon currency-icon">💱</div>
              <div>
                <h3>Currency Management</h3>
                <p className="section-description">Manage currencies and exchange rates</p>
              </div>
            </div>
            <div className="section-header-right">
              <button
                className="btn btn-primary btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                  setEditingCurrency(null);
                  resetForm();
                }}
              >
                + Add Currency
              </button>
              <span className={`section-arrow ${isCurrencyOpen ? "open" : ""}`}>
                ▼
              </span>
            </div>
          </div>

          {isCurrencyOpen && (
            <div className="currencies-list">
              {loadingCurrencies ? (
                <div className="section-loading">
                  <Spinner size={24} />
                </div>
              ) : currencies.length === 0 ? (
                <p className="no-currencies">No currencies added yet.</p>
              ) : (
                currencies.map((currency) => (
                  <div key={currency.id} className="management-item">
                    <div className="management-item-content">
                      <div className="management-item-icon">
                        <span className="item-symbol">{currency.symbol}</span>
                      </div>
                      <div className="management-item-info">
                        <div className="management-item-title">
                          <strong>{currency.name}</strong>
                          <span className="management-item-badge">
                            {currency.code}
                          </span>
                        </div>
                        {currency.isActive && (
                          <span className="active-indicator">Active</span>
                        )}
                      </div>
                    </div>
                    <div className="management-item-actions">
                      <button
                        className="btn btn-icon btn-edit"
                        onClick={() => handleEdit(currency)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-icon btn-delete"
                        onClick={() => handleDelete(currency.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {showModal && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowModal(false);
              setEditingCurrency(null);
              resetForm();
            }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>{editingCurrency ? "Edit Currency" : "Add New Currency"}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Currency Code * (e.g., USD, EUR, ALL)</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    required
                    maxLength="3"
                    placeholder="USD"
                  />
                </div>

                <div className="form-group">
                  <label>Currency Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="US Dollar"
                  />
                </div>

                <div className="form-group">
                  <label>Symbol *</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) =>
                      setFormData({ ...formData, symbol: e.target.value })
                    }
                    required
                    placeholder="$"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCurrency(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCurrency ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Clients Section */}
        <div className={`settings-section ${isClientsOpen ? "active" : ""}`}>
          <div
            className={`section-header clickable ${isClientsOpen ? "active" : ""}`}
            onClick={() => setIsClientsOpen(!isClientsOpen)}
          >
            <div className="section-header-left">
              <div className="section-icon client-icon">👥</div>
              <div>
                <h3>Clients</h3>
                <p className="section-description">Manage your client database</p>
              </div>
            </div>
            <div className="section-header-right">
              <button
                className="btn btn-primary btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowClientModal(true);
                  setEditingClient(null);
                  resetClientForm();
                }}
              >
                + Add Client
              </button>
              <span className={`section-arrow ${isClientsOpen ? "open" : ""}`}>
                ▼
              </span>
            </div>
          </div>

          {isClientsOpen && (
            <div className="currencies-list">
              {loadingClients ? (
                <div className="section-loading">
                  <Spinner size={24} />
                </div>
              ) : clients.length === 0 ? (
                <p className="no-currencies">No clients added yet.</p>
              ) : (
                clients.map((client) => (
                  <div key={client.id} className="management-item">
                    <div className="management-item-content">
                      <div className="management-item-icon client-item-icon">
                        <span>👤</span>
                      </div>
                      <div className="management-item-info">
                        <div className="management-item-title">
                          <strong>{client.fullName}</strong>
                          {client.number && (
                            <span className="management-item-badge">
                              {client.number}
                            </span>
                          )}
                        </div>
                        {client.email && (
                          <div className="management-item-detail">
                            📧 {client.email}
                          </div>
                        )}
                        {client.address && (
                          <div className="management-item-detail">
                            📍 {client.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="management-item-actions">
                      <button
                        className="btn btn-icon btn-edit"
                        onClick={() => handleClientEdit(client)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-icon btn-delete"
                        onClick={() => handleClientDelete(client.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Brands Section */}
        <div className={`settings-section ${isBrandsOpen ? "active" : ""}`}>
          <div
            className={`section-header clickable ${isBrandsOpen ? "active" : ""}`}
            onClick={() => setIsBrandsOpen(!isBrandsOpen)}
          >
            <div className="section-header-left">
              <div className="section-icon brand-icon">🏷️</div>
              <div>
                <h3>Brands</h3>
                <p className="section-description">Manage product brands</p>
              </div>
            </div>
            <div className="section-header-right">
              <button
                className="btn btn-primary btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBrandModal(true);
                  setEditingBrand(null);
                  resetBrandForm();
                }}
              >
                + Add Brand
              </button>
              <span className={`section-arrow ${isBrandsOpen ? "open" : ""}`}>
                ▼
              </span>
            </div>
          </div>

          {isBrandsOpen && (
            <div className="currencies-list">
              {loadingBrands ? (
                <div className="section-loading">
                  <Spinner size={24} />
                </div>
              ) : brands.length === 0 ? (
                <p className="no-currencies">No brands added yet.</p>
              ) : (
                brands.map((brand) => (
                  <div key={brand.id} className="management-item">
                    <div className="management-item-content">
                      <div className="management-item-icon brand-item-icon">
                        <span>🏷️</span>
                      </div>
                      <div className="management-item-info">
                        <div className="management-item-title">
                          <strong>{brand.name}</strong>
                        </div>
                        {brand.description && (
                          <div className="management-item-detail">
                            {brand.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="management-item-actions">
                      <button
                        className="btn btn-icon btn-edit"
                        onClick={() => handleBrandEdit(brand)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-icon btn-delete"
                        onClick={() => handleBrandDelete(brand.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div className={`settings-section ${isCategoriesOpen ? "active" : ""}`}>
          <div
            className={`section-header clickable ${isCategoriesOpen ? "active" : ""}`}
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
          >
            <div className="section-header-left">
              <div className="section-icon category-icon">📁</div>
              <div>
                <h3>Categories</h3>
                <p className="section-description">Organize products by categories</p>
              </div>
            </div>
            <div className="section-header-right">
              <button
                className="btn btn-primary btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryModal(true);
                  setEditingCategory(null);
                  resetCategoryForm();
                }}
              >
                + Add Category
              </button>
              <span className={`section-arrow ${isCategoriesOpen ? "open" : ""}`}>
                ▼
              </span>
            </div>
          </div>

          {isCategoriesOpen && (
            <div className="currencies-list">
              {loadingCategories ? (
                <div className="section-loading">
                  <Spinner size={24} />
                </div>
              ) : categories.length === 0 ? (
                <p className="no-currencies">No categories added yet.</p>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="management-item">
                    <div className="management-item-content">
                      <div className="management-item-icon category-item-icon">
                        <span>📁</span>
                      </div>
                      <div className="management-item-info">
                        <div className="management-item-title">
                          <strong>{category.name}</strong>
                        </div>
                        {category.description && (
                          <div className="management-item-detail">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="management-item-actions">
                      <button
                        className="btn btn-icon btn-edit"
                        onClick={() => handleCategoryEdit(category)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-icon btn-delete"
                        onClick={() => handleCategoryDelete(category.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        </div>

        {/* Client Modal */}
        {showClientModal && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowClientModal(false);
              setEditingClient(null);
              resetClientForm();
            }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>{editingClient ? "Edit Client" : "Add New Client"}</h3>
              <form onSubmit={handleClientSubmit}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={clientFormData.fullName}
                    onChange={(e) =>
                      setClientFormData({
                        ...clientFormData,
                        fullName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Number</label>
                  <input
                    type="text"
                    value={clientFormData.number}
                    onChange={(e) =>
                      setClientFormData({
                        ...clientFormData,
                        number: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={clientFormData.email}
                    onChange={(e) =>
                      setClientFormData({
                        ...clientFormData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={clientFormData.address}
                    onChange={(e) =>
                      setClientFormData({
                        ...clientFormData,
                        address: e.target.value,
                      })
                    }
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowClientModal(false);
                      setEditingClient(null);
                      resetClientForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingClient ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Brand Modal */}
        {showBrandModal && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowBrandModal(false);
              setEditingBrand(null);
              resetBrandForm();
            }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>{editingBrand ? "Edit Brand" : "Add New Brand"}</h3>
              <form onSubmit={handleBrandSubmit}>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={brandFormData.name}
                    onChange={(e) =>
                      setBrandFormData({
                        ...brandFormData,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={brandFormData.description}
                    onChange={(e) =>
                      setBrandFormData({
                        ...brandFormData,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowBrandModal(false);
                      setEditingBrand(null);
                      resetBrandForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingBrand ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
              resetCategoryForm();
            }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>{editingCategory ? "Edit Category" : "Add New Category"}</h3>
              <form onSubmit={handleCategorySubmit}>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCategoryModal(false);
                      setEditingCategory(null);
                      resetCategoryForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCategory ? "Update" : "Create"}
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
          onCancel={() =>
            setConfirmDialog({ isOpen: false, message: "", onConfirm: null })
          }
        />
      </div>
    </div>
  );
};

export default Settings;
