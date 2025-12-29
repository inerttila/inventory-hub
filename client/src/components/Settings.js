import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../utils/axiosConfig";
import "./Settings.css";
import { useNotification } from "../context/NotificationContext";
import { useCurrency } from "../context/CurrencyContext";
import ConfirmDialog from "./ConfirmDialog";

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

  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/currencies");
      setCurrencies(res.data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      showError("Error loading currencies");
    }
  }, [showError]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/clients");
      setClients(res.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      showError("Error loading clients");
    }
  }, [showError]);

  useEffect(() => {
    fetchCurrencies();
    fetchClients();
  }, [fetchCurrencies, fetchClients]);

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
          <h2>⚙️ Management</h2>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-section">
          <div
            className="section-header clickable"
            onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
          >
            <h3>Currency Management</h3>
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
              {currencies.length === 0 ? (
                <p className="no-currencies">No currencies added yet.</p>
              ) : (
                currencies.map((currency) => (
                  <div key={currency.id} className="currency-item">
                    <div className="currency-info">
                      <div className="currency-main">
                        <span className="currency-symbol">
                          {currency.symbol}
                        </span>
                        <div>
                          <strong>{currency.name}</strong>
                          <span className="currency-code">
                            ({currency.code})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="currency-actions">
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => handleEdit(currency)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(currency.id)}
                      >
                        Delete
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
        <div className="settings-section">
          <div
            className="section-header clickable"
            onClick={() => setIsClientsOpen(!isClientsOpen)}
          >
            <h3>Clients</h3>
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
              {clients.length === 0 ? (
                <p className="no-currencies">No clients added yet.</p>
              ) : (
                clients.map((client) => (
                  <div key={client.id} className="currency-item">
                    <div className="currency-info">
                      <div className="currency-main">
                        <div>
                          <strong>{client.fullName}</strong>
                          {client.number && (
                            <span className="currency-code">
                              {" "}
                              ({client.number})
                            </span>
                          )}
                        </div>
                        {client.email && (
                          <div style={{ fontSize: "0.8rem", color: "#666" }}>
                            {client.email}
                          </div>
                        )}
                        {client.address && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#999",
                              marginTop: "0.25rem",
                            }}
                          >
                            {client.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="currency-actions">
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => handleClientEdit(client)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleClientDelete(client.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
