import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import apiClient from "../utils/axiosConfig";
import * as XLSX from "xlsx-js-style";
import "./FinalProducts.css";
import { useNotification } from "../context/NotificationContext";
import { useCurrency } from "../context/CurrencyContext";
import ConfirmDialog from "./ConfirmDialog";
import Spinner from "./Spinner";

const FinalProducts = () => {
  const { showSuccess, showError, showWarning } = useNotification();
  const { formatPrice, currencies } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const [finalProducts, setFinalProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    currency: "",
    client: "",
    date: "",
    applyTVSH: true,
    components: [],
  });
  const [viewingImage, setViewingImage] = useState(null);
  const [clients, setClients] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState({});
  const [uploadingImages, setUploadingImages] = useState({}); // { index: progress }
  const [loading, setLoading] = useState(true);
  const cardRefs = useRef({});

  const fetchFinalProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/final-products");
      setFinalProducts(res.data);
    } catch (error) {
      console.error("Error fetching final products:", error);
      showError("Error loading final products");
    } finally {
      setLoading(false);
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

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, []);

  useEffect(() => {
    fetchFinalProducts();
    fetchProducts();
    fetchClients();
  }, [fetchFinalProducts, fetchProducts, fetchClients]);

  // Handle URL parameter to expand and scroll to specific product
  useEffect(() => {
    const productId = searchParams.get("id");
    if (productId && finalProducts.length > 0) {
      const id = parseInt(productId);
      const product = finalProducts.find((p) => p.id === id);
      if (product) {
        // Expand the card
        setExpandedCards((prev) => ({
          ...prev,
          [id]: true,
        }));
        
        // Scroll to the card after a short delay to ensure it's rendered
        setTimeout(() => {
          const cardElement = cardRefs.current[id];
          if (cardElement) {
            cardElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
        
        // Remove the id parameter from URL after handling
        searchParams.delete("id");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [finalProducts, searchParams, setSearchParams]);

  const handleAddComponent = () => {
    setFormData({
      ...formData,
      components: [
        ...formData.components,
        { product: "", length: "", quantity: "1", width: "", image: "" },
      ],
    });
  };

  const handleComponentChange = (index, field, value) => {
    const updatedComponents = [...formData.components];
    updatedComponents[index][field] = value;

    // Recalculate square_meters and total_meters when product, length, width, or quantity changes
    if (
      field === "product" ||
      field === "length" ||
      field === "width" ||
      field === "quantity"
    ) {
      const length = parseFloat(updatedComponents[index].length) || 0;
      const width = parseFloat(updatedComponents[index].width) || 0;
      const quantity = parseFloat(updatedComponents[index].quantity) || 1;

      if (length > 0 && width > 0) {
        const calculatedSquareMeters = length * width; // Square meters per unit
        const calculatedTotalMeters = quantity * calculatedSquareMeters; // Total square meters
        updatedComponents[index].square_meters =
          calculatedSquareMeters.toFixed(2);
        updatedComponents[index].total_meters =
          calculatedTotalMeters.toFixed(2);

        // Validate against product's available square_meters
        const selectedProductId = updatedComponents[index].product;
        if (selectedProductId) {
          const selectedProduct = products.find(
            (p) => p.id === parseInt(selectedProductId)
          );
          if (selectedProduct) {
            const availableSquareMeters =
              parseFloat(selectedProduct.square_meters) || 0;

            if (calculatedTotalMeters > availableSquareMeters) {
              showWarning(
                `Total square meters (${calculatedTotalMeters.toFixed(
                  2
                )}) exceeds available square meters (${availableSquareMeters.toFixed(
                  2
                )}) for product ${selectedProduct.name}`
              );
              // Reset quantity to max available
              const maxQuantity = Math.floor(
                availableSquareMeters / calculatedSquareMeters
              );
              updatedComponents[index].quantity =
                maxQuantity > 0 ? maxQuantity.toString() : "1";
              updatedComponents[index].total_meters = (
                maxQuantity * calculatedSquareMeters
              ).toFixed(2);
            }
          }
        }
      } else {
        updatedComponents[index].square_meters = "0.00";
        updatedComponents[index].total_meters = "0.00";
      }
    }

    setFormData({ ...formData, components: updatedComponents });
  };

  const handleRemoveComponent = (index) => {
    const updatedComponents = formData.components.filter((_, i) => i !== index);
    setFormData({ ...formData, components: updatedComponents });
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;

    // Set initial upload progress
    setUploadingImages((prev) => ({ ...prev, [index]: 0 }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const response = await apiClient.post(
        "/api/upload/component-image",
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadingImages((prev) => ({ ...prev, [index]: percentCompleted }));
          },
        }
      );

      const updatedComponents = [...formData.components];
      updatedComponents[index].image = response.data.imagePath;
      setFormData({ ...formData, components: updatedComponents });
      
      // Clear upload progress
      setUploadingImages((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
      
      showSuccess("Image uploaded successfully!");
    } catch (error) {
      // Clear upload progress on error
      setUploadingImages((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
      showError(error.response?.data?.message || "Error uploading image");
    }
  };

  const calculateComponentTotalPrice = (component) => {
    const selectedProductId = component.product;
    if (!selectedProductId) return 0;

    const selectedProduct = products.find(
      (p) => p.id === parseInt(selectedProductId)
    );
    if (!selectedProduct) return 0;

    const totalMeters =
      parseFloat(component.total_meters) ||
      parseFloat(component.square_meters) ||
      0;
    const pricePerSquareMeter =
      parseFloat(selectedProduct.price_per_square_meter) || 0;

    return totalMeters * pricePerSquareMeter;
  };

  const calculateTotalPrice = () => {
    return formData.components.reduce((sum, comp) => {
      return sum + calculateComponentTotalPrice(comp);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.components.length === 0) {
      showWarning("Please add at least one component");
      return;
    }

    // Validate all components
    for (const comp of formData.components) {
      if (!comp.product || !comp.length || !comp.width || !comp.quantity) {
        showWarning("Please fill in all fields for all components");
        return;
      }

      const selectedProduct = products.find(
        (p) => p.id === parseInt(comp.product)
      );
      if (selectedProduct) {
        const totalMeters = parseFloat(comp.total_meters) || 0;
        const availableSquareMeters =
          parseFloat(selectedProduct.square_meters) || 0;

        if (totalMeters > availableSquareMeters) {
          showWarning(
            `Total square meters exceeds available for product ${selectedProduct.name}`
          );
          return;
        }
      }
    }

    try {
      const data = {
        ...formData,
        currencyId: formData.currency || null,
        clientId: formData.client || null,
        components: formData.components.map((comp) => ({
          product: comp.product,
          length: parseFloat(comp.length),
          width: parseFloat(comp.width),
          quantity: parseFloat(comp.quantity) || 1,
          image: comp.image || null,
        })),
      };
      delete data.currency;
      delete data.client;

      if (editingProduct) {
        await apiClient.put(`/api/final-products/${editingProduct.id}`, data);
      } else {
        await apiClient.post("/api/final-products", data);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchFinalProducts();
      showSuccess(
        editingProduct
          ? "Final product updated successfully!"
          : "Final product created successfully!"
      );
    } catch (error) {
      showError(error.response?.data?.message || "Error saving final product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product); // This includes the status field
    setFormData({
      name: product.name,
      code: product.code,
      description: product.description || "",
      currency: product.currency?.id || product.currencyId || "",
      client: product.client?.id || product.clientId || "",
      date: product.date || "",
      applyTVSH: product.applyTVSH !== undefined ? product.applyTVSH : true,
      components: product.components.map((comp) => ({
        product: comp.product?.id || comp.productId || comp.product,
        length: comp.length || "",
        width: comp.width || "",
        quantity: comp.quantity || "1",
        square_meters: comp.square_meters || "",
        total_meters: comp.total_meters || "",
        image: comp.image || "",
      })),
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: "Are you sure you want to delete this final product?",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/final-products/${id}`);
          fetchFinalProducts();
          showSuccess("Final product deleted successfully!");
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        } catch (error) {
          showError("Error deleting final product");
          setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  const handleSetToDone = async (id) => {
    try {
      await apiClient.put(`/api/final-products/${id}/done`);
      fetchFinalProducts();
      showSuccess("Final product marked as done!");
    } catch (error) {
      showError("Error updating final product status");
    }
  };

  const handleReset = async (id) => {
    try {
      await apiClient.put(`/api/final-products/${id}/reset`);
      fetchFinalProducts();
      showSuccess("Final product reset to pending!");
    } catch (error) {
      showError("Error resetting final product status");
    }
  };

  const handleExportToExcel = (product) => {
    try {
      const currencySymbol = product.currency?.symbol || "$";

      // Calculate totals
      const totalCost = product.components.reduce(
        (sum, comp) => sum + parseFloat(comp.total_price || 0),
        0
      );
      const applyTVSH =
        product.applyTVSH !== undefined ? product.applyTVSH : true;
      const tvsh = applyTVSH ? totalCost * 0.2 : 0;
      const totalWithTVSH = applyTVSH ? totalCost * 1.2 : totalCost;

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Final Product Info Section
      const productInfo = [
        [" PREVENTIV"],
        [],
        [`Name:`, product.name],
        ["Code:", product.code],
        [
          "Currency:",
          product.currency
            ? `${product.currency.symbol} - ${product.currency.code}`
            : "N/A",
        ],
        [
          "Client:",
          product.client
            ? `${product.client.fullName}${
                product.client.number ? ` (${product.client.number})` : ""
              }`
            : "N/A",
        ],
        [
          "Date:",
          product.date ? new Date(product.date).toLocaleDateString() : "N/A",
        ],
        ["Description:", product.description || "N/A"],
        [], // Empty line after description
        [], // Additional empty line for spacing
      ];

      // Components Header
      const componentsHeader = [
        [
          {
            v: "Components:",
            s: { font: { color: { rgb: "0000FF" }, bold: true } },
          },
        ],
        [],
        [
          "Product Name",
          "Barcode",
          "Length (m)",
          "Width (m)",
          "Quantity",
          "m² per unit",
          "Total m²",
          "Price/m²",
          "Total Price",
          "Product Description",
        ],
      ];

      // Components Data
      const componentsData = product.components.map((comp) => [
        comp.product?.name || "N/A",
        comp.product?.barcode || "N/A",
        parseFloat(comp.length || 0).toFixed(2),
        parseFloat(comp.width || 0).toFixed(2),
        parseFloat(comp.quantity || 0).toFixed(2),
        parseFloat(comp.square_meters || 0).toFixed(2),
        parseFloat(comp.total_meters || 0).toFixed(2),
        formatPrice(
          comp.product?.price_per_square_meter || 0,
          comp.product?.currency?.symbol || "$"
        ),
        formatPrice(
          parseFloat(comp.total_price || 0),
          comp.product?.currency?.symbol || "$"
        ),
        comp.product?.description || "N/A",
      ]);

      // Summary Section
      const summary = [
        [],
        [
          {
            v: "Summary:",
            s: { font: { color: { rgb: "0000FF" }, bold: true } },
          },
        ],
        ["Total Cost:", formatPrice(totalCost, currencySymbol)],
        ["TVSH (20%):", formatPrice(tvsh, currencySymbol)],
        [
          {
            v: "Total Cost with TVSH:",
            s: { font: { color: { rgb: "0000FF" }, bold: true } },
          },
          {
            v: formatPrice(totalWithTVSH, currencySymbol),
            s: { font: { color: { rgb: "0000FF" }, bold: true } },
          },
        ],
      ];

      // Combine all data
      const wsData = [
        ...productInfo,
        ...componentsHeader,
        ...componentsData,
        ...summary,
      ];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Define styles
      const blueHeaderStyle = {
        font: { color: { rgb: "0066CC" }, bold: true, sz: 14 },
      };
      const tableHeaderStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        fill: { fgColor: { rgb: "0066CC" } }, // Blue background
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
      const tableCellStyle = {
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      // Style "Final Product Report" header (row 0)
      const reportHeaderCell = ws["A1"];
      if (reportHeaderCell) {
        ws["A1"].s = blueHeaderStyle;
      }

      // Style final product info as a table (rows 3-8, indices 2-7)
      const productInfoStartRow = 2; // Array index 2 (Excel row 3)
      const productInfoEndRow = 7; // Array index 7 (Excel row 8)
      for (let row = productInfoStartRow; row <= productInfoEndRow; row++) {
        const labelCell = ws[`A${row + 1}`];
        const valueCell = ws[`B${row + 1}`];
        if (labelCell) {
          labelCell.s = { ...tableCellStyle, font: { bold: true } };
        }
        if (valueCell) {
          valueCell.s = tableCellStyle;
        }
      }

      // Style "Components:" header - same style as "Final Product Report"
      // productInfo now has 10 rows (added extra empty line), so "Components:" is at index 10 (Excel row 11)
      const componentsHeaderRow = productInfo.length - 1; // Array index 10 (Excel row 11)
      const componentsHeaderCell = ws[`A${componentsHeaderRow + 1}`];
      if (componentsHeaderCell && componentsHeaderCell.v === "Components:") {
        ws[`A${componentsHeaderRow + 1}`].s = blueHeaderStyle; // Same style as Final Product Report
      }

      // Style components table header (row after "Components:" and empty row)
      // componentsHeader has 3 rows, so header is at index 10 + 2 = 12 (Excel row 13)
      const componentsTableHeaderRow = componentsHeaderRow + 2;
      const headerColumns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
      headerColumns.forEach((col, idx) => {
        const cellRef = `${col}${componentsTableHeaderRow + 1}`;
        const cell = ws[cellRef];
        if (cell) {
          cell.s = tableHeaderStyle;
        }
      });

      // Style components data rows
      const componentsDataStartRow = componentsTableHeaderRow + 1;
      const componentsDataEndRow =
        componentsDataStartRow + componentsData.length - 1;
      for (
        let row = componentsDataStartRow;
        row <= componentsDataEndRow;
        row++
      ) {
        headerColumns.forEach((col) => {
          const cell = ws[`${col}${row + 1}`];
          if (cell) {
            cell.s = tableCellStyle;
          }
        });
      }

      // Style "Summary:" header
      // Calculate summary start: productInfo + componentsHeader + componentsData + 1 (empty row)
      const summaryStartRow =
        productInfo.length + componentsHeader.length + componentsData.length;
      const summaryHeaderCell = ws[`A${summaryStartRow + 1}`];
      if (summaryHeaderCell) {
        ws[`A${summaryStartRow + 1}`].s = blueHeaderStyle;
      }

      // Style summary totals as a table (3 data rows after "Summary:")
      const summaryDataStartRow = summaryStartRow + 1; // After "Summary:" row
      const summaryDataEndRow = summaryStartRow + 3; // 3 data rows
      for (let row = summaryDataStartRow; row <= summaryDataEndRow; row++) {
        const labelCell = ws[`A${row + 1}`];
        const valueCell = ws[`B${row + 1}`];
        if (labelCell) {
          labelCell.s = { ...tableCellStyle, font: { bold: true } };
        }
        if (valueCell) {
          valueCell.s = tableCellStyle;
        }
      }

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Product Name
        { wch: 25 }, // Barcode
        { wch: 12 }, // Length
        { wch: 12 }, // Width
        { wch: 12 }, // Quantity
        { wch: 12 }, // m² per unit
        { wch: 12 }, // Total m²
        { wch: 15 }, // Price/m²
        { wch: 15 }, // Total Price
        { wch: 40 }, // Product Description
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Final Product");

      // Generate filename (sanitize product name and code)
      const sanitizeFilename = (str) =>
        str.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const filename = `${sanitizeFilename(product.name)}_${sanitizeFilename(
        product.code
      )}_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      showSuccess("Excel report generated successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      showError("Error generating Excel report");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      currency: "",
      client: "",
      date: "",
      applyTVSH: true,
      components: [],
    });
  };

  const totalPrice = calculateTotalPrice();

  if (loading) {
    return (
      <div className="final-products-container">
        <div className="loading-spinner">
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="final-products-container">
      <div className="page-header">
        <h2>Final Products</h2>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowModal(true);
              setEditingProduct(null);
              resetForm();
            }}
          >
            + Add Final Product
          </button>
        </div>
      </div>

      <div className="final-products-grid">
        {finalProducts
          .filter((product) => {
            const matchesName = product.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
            const matchesClient = product.client
              ? product.client.fullName
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              : false;
            return matchesName || matchesClient;
          })
          .map((product) => {
            const isExpanded = expandedCards[product.id] || false;
            const totalPrice = product.components.reduce(
              (sum, comp) => sum + parseFloat(comp.total_price || 0),
              0
            );
            const finalTotal =
              product.applyTVSH !== false ? totalPrice * 1.2 : totalPrice;

            return (
              <div
                key={product.id}
                ref={(el) => (cardRefs.current[product.id] = el)}
                className={`final-product-card ${
                  isExpanded ? "expanded" : "collapsed"
                }`}
              >
                <div className="final-product-header">
                  <div className="product-actions">
                    {product.status !== "done" ? (
                      <button
                        className="btn btn-success btn-small"
                        onClick={() => handleSetToDone(product.id)}
                        title="Set to done"
                      >
                        ✓ Set to done
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => handleReset(product.id)}
                        title="Reset to pending"
                      >
                        ↻ Reset
                      </button>
                    )}
                    <button
                      className="btn-icon"
                      onClick={() => handleExportToExcel(product)}
                      title="Export to Excel"
                    >
                      📄
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(product)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      🗑️
                    </button>
                  </div>
                  <div
                    className="product-title-section clickable-title"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCards((prev) => ({
                        ...prev,
                        [product.id]: !prev[product.id],
                      }));
                    }}
                  >
                    <h3>{product.name}</h3>
                    {product.status === "done" && (
                      <span className="status-badge done">Done</span>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <div className="final-product-info">
                    <div className="final-product-details-grid">
                      <div className="final-product-detail-item">
                        <span className="detail-label">Code:</span>
                        <span className="detail-value">{product.code}</span>
                      </div>
                      {product.currency && (
                        <div className="final-product-detail-item">
                          <span className="detail-label">Currency:</span>
                          <span className="detail-value">
                            {product.currency.symbol} - {product.currency.code}
                          </span>
                        </div>
                      )}
                      {product.client && (
                        <div className="final-product-detail-item">
                          <span className="detail-label">Client:</span>
                          <span className="detail-value">
                            {product.client.fullName}{" "}
                            {product.client.number &&
                              `(${product.client.number})`}
                          </span>
                        </div>
                      )}
                      {product.date && (
                        <div className="final-product-detail-item">
                          <span className="detail-label">Date:</span>
                          <span className="detail-value">
                            {new Date(product.date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {product.description && (
                      <div className="final-product-description-box">
                        <span className="detail-label">Description:</span>
                        <p>{product.description}</p>
                      </div>
                    )}
                    <div className="components-list">
                      <strong>Components:</strong>
                      <ul>
                        {product.components.map((comp, idx) => {
                          const componentTotal = parseFloat(
                            comp.total_price || 0
                          );
                          return (
                            <li key={idx} className="component-item-card">
                              <div className="component-header">
                                <strong>{comp.product?.name || "N/A"}</strong>
                              </div>
                              <div className="component-details-grid">
                                <div className="component-detail-item">
                                  <span className="detail-label">Length:</span>
                                  <span className="detail-value">
                                    {comp.length}m
                                  </span>
                                </div>
                                <div className="component-detail-item">
                                  <span className="detail-label">Width:</span>
                                  <span className="detail-value">
                                    {comp.width}m
                                  </span>
                                </div>
                                <div className="component-detail-item">
                                  <span className="detail-label">
                                    Quantity:
                                  </span>
                                  <span className="detail-value">
                                    {comp.quantity}
                                  </span>
                                </div>
                                <div className="component-detail-item">
                                  <span className="detail-label">m²/unit:</span>
                                  <span className="detail-value">
                                    {parseFloat(
                                      comp.square_meters || 0
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div className="component-detail-item">
                                  <span className="detail-label">
                                    Total m²:
                                  </span>
                                  <span className="detail-value">
                                    {parseFloat(comp.total_meters || 0).toFixed(
                                      2
                                    )}
                                  </span>
                                </div>
                                <div className="component-detail-item">
                                  <span className="detail-label">
                                    Price/m²:
                                  </span>
                                  <span className="detail-value">
                                    {formatPrice(
                                      comp.product?.price_per_square_meter || 0,
                                      comp.product?.currency?.symbol || "$"
                                    )}
                                  </span>
                                </div>
                                <div className="component-detail-item total-item">
                                  <span className="detail-label">Total:</span>
                                  <span className="detail-value total-value">
                                    {formatPrice(
                                      componentTotal,
                                      comp.product?.currency?.symbol || "$"
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="component-image-description-wrapper">
                                {comp.image && (
                                  <div className="component-image-display">
                                    <img
                                      src={comp.image}
                                      alt="Component"
                                      className="component-image-thumbnail"
                                      onClick={() =>
                                        setViewingImage(comp.image)
                                      }
                                    />
                                  </div>
                                )}
                                {comp.product?.description && (
                                  <div className="component-description-box">
                                    <strong>Product Description:</strong>
                                    <p>{comp.product.description}</p>
                                  </div>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="total-price-section">
                        <strong>
                          Total {product.applyTVSH !== false ? "with TVSH" : ""}
                          :{" "}
                          {formatPrice(
                            product.components.reduce(
                              (sum, comp) =>
                                sum + parseFloat(comp.total_price || 0),
                              0
                            ) * (product.applyTVSH !== false ? 1.2 : 1),
                            product.currency?.symbol || "$"
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="collapsed-summary">
                    <div className="collapsed-total">
                      <strong>
                        Total {product.applyTVSH !== false ? "with TVSH" : ""}:{" "}
                        {formatPrice(
                          finalTotal,
                          product.currency?.symbol || "$"
                        )}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowModal(false);
            setEditingProduct(null);
            resetForm();
          }}
        >
          <div
            className="modal-content large-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {editingProduct ? "Edit Final Product" : "Add New Final Product"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                  >
                    <option value="">Select Currency</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.symbol} - {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Client</label>
                  <select
                    value={formData.client}
                    onChange={(e) =>
                      setFormData({ ...formData, client: e.target.value })
                    }
                  >
                    <option value="">Select Client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.fullName}{" "}
                        {client.number && `(${client.number})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.applyTVSH}
                    onChange={(e) =>
                      setFormData({ ...formData, applyTVSH: e.target.checked })
                    }
                  />
                  <span>Apply TVSH</span>
                </label>
              </div>

              <div className="components-section">
                <div className="components-header">
                  <h4>Components *</h4>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={handleAddComponent}
                  >
                    + Add Component
                  </button>
                </div>

                {formData.components.map((component, index) => {
                  const selectedProduct = products.find(
                    (p) => p.id === parseInt(component.product)
                  );
                  const squareMeters = parseFloat(component.square_meters) || 0;
                  const componentTotal =
                    calculateComponentTotalPrice(component);

                  return (
                    <div key={index} className="component-item">
                      <div className="form-group">
                        <label>Product *</label>
                        <select
                          value={component.product}
                          onChange={(e) =>
                            handleComponentChange(
                              index,
                              "product",
                              e.target.value
                            )
                          }
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} (Available:{" "}
                              {parseFloat(prod.square_meters || 0).toFixed(2)}{" "}
                              m², {prod.currency?.symbol || "$"}
                              {parseFloat(
                                prod.price_per_square_meter || 0
                              ).toFixed(2)}
                              /m²)
                            </option>
                          ))}
                        </select>
                        {selectedProduct && (
                          <div className="product-info-hint">
                            Available:{" "}
                            {parseFloat(
                              selectedProduct.square_meters || 0
                            ).toFixed(2)}{" "}
                            m² | Price:{" "}
                            {selectedProduct.currency?.symbol || "$"}
                            {parseFloat(
                              selectedProduct.price_per_square_meter || 0
                            ).toFixed(2)}
                            /m²
                          </div>
                        )}
                      </div>

                      <div className="form-row component-fields-row">
                        <div className="form-group form-group-small">
                          <label>Quantity *</label>
                          <input
                            type="number"
                            step="1"
                            value={component.quantity}
                            onChange={(e) =>
                              handleComponentChange(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            required
                            min="1"
                          />
                        </div>

                        <div className="form-group form-group-small">
                          <label>Length (m) *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={component.length}
                            onChange={(e) =>
                              handleComponentChange(
                                index,
                                "length",
                                e.target.value
                              )
                            }
                            required
                            min="0.01"
                          />
                        </div>

                        <div className="form-group form-group-small">
                          <label>Width (m) *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={component.width}
                            onChange={(e) =>
                              handleComponentChange(
                                index,
                                "width",
                                e.target.value
                              )
                            }
                            required
                            min="0.01"
                          />
                        </div>

                        <div className="form-group form-group-small">
                          <label>m² per unit</label>
                          <input
                            type="text"
                            value={squareMeters.toFixed(2)}
                            disabled
                            className="subtotal-input"
                          />
                        </div>

                        <div className="form-group form-group-small">
                          <label>Total m²</label>
                          <input
                            type="text"
                            value={(
                              parseFloat(component.total_meters) || 0
                            ).toFixed(2)}
                            disabled
                            className="subtotal-input"
                          />
                        </div>

                        <div className="form-group form-group-small">
                          <label>Price/m²</label>
                          <input
                            type="text"
                            value={
                              selectedProduct
                                ? `${
                                    selectedProduct.currency?.symbol || ""
                                  }${parseFloat(
                                    selectedProduct.price_per_square_meter || 0
                                  ).toFixed(2)}`
                                : "0.00"
                            }
                            disabled
                            className="subtotal-input"
                          />
                        </div>

                        <div className="form-group form-group-small">
                          <label>Total Price</label>
                          <input
                            type="text"
                            value={`${
                              selectedProduct?.currency?.symbol || ""
                            }${componentTotal.toFixed(2)}`}
                            disabled
                            className="subtotal-input"
                          />
                        </div>

                        <div className="form-group form-group-full">
                          <label>Image & Description</label>
                          <div className="image-description-container">
                            <div className="image-upload-section">
                              <input
                                type="file"
                                accept="image/*"
                                id={`image-upload-${index}`}
                                style={{ display: "none" }}
                                disabled={uploadingImages[index] !== undefined}
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    handleImageUpload(index, file);
                                  }
                                }}
                              />
                              <div className="image-upload-wrapper">
                                <label
                                  htmlFor={`image-upload-${index}`}
                                  className={`image-upload-btn ${uploadingImages[index] !== undefined ? 'uploading' : ''}`}
                                  title="Upload image"
                                  style={{ 
                                    opacity: uploadingImages[index] !== undefined ? 0.6 : 1,
                                    cursor: uploadingImages[index] !== undefined ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {uploadingImages[index] !== undefined ? '⏳' : '📷'}
                                </label>
                                {uploadingImages[index] !== undefined && (
                                  <div className="upload-progress-container">
                                    <div className="upload-progress-bar">
                                      <div 
                                        className="upload-progress-fill"
                                        style={{ width: `${uploadingImages[index]}%` }}
                                      ></div>
                                    </div>
                                    <span className="upload-progress-text">
                                      {uploadingImages[index]}%
                                    </span>
                                  </div>
                                )}
                              </div>
                              {component.image && (
                                <div className="image-preview-container">
                                  <img
                                    src={component.image}
                                    alt="Component"
                                    className="component-image-preview"
                                    onClick={() =>
                                      setViewingImage(component.image)
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="remove-image-btn"
                                    onClick={() => {
                                      const updatedComponents = [
                                        ...formData.components,
                                      ];
                                      updatedComponents[index].image = "";
                                      setFormData({
                                        ...formData,
                                        components: updatedComponents,
                                      });
                                    }}
                                    title="Remove image"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                            {selectedProduct?.description && (
                              <div className="product-description-box">
                                <strong>Product Description:</strong>
                                <p>{selectedProduct.description}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="form-group form-group-small">
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
                  );
                })}

                {formData.components.length === 0 && (
                  <p className="no-components">
                    No components added. Click "Add Component" to add one.
                  </p>
                )}
              </div>

              <div className="price-summary">
                <div className="summary-row">
                  <span>
                    <strong>Total Cost:</strong>
                  </span>
                  <span className="total-cost">
                    {formatPrice(
                      totalPrice,
                      formData.currency
                        ? currencies.find(
                            (c) => c.id === parseInt(formData.currency)
                          )?.symbol || "$"
                        : editingProduct?.currency?.symbol || "$"
                    )}
                  </span>
                </div>
                <div className="summary-row">
                  <span>
                    <strong>TVSH (20%):</strong>
                  </span>
                  <span>
                    {formatPrice(
                      formData.applyTVSH ? totalPrice * 0.2 : 0,
                      formData.currency
                        ? currencies.find(
                            (c) => c.id === parseInt(formData.currency)
                          )?.symbol || "$"
                        : editingProduct?.currency?.symbol || "$"
                    )}
                  </span>
                </div>
                <div className="summary-row">
                  <span>
                    <strong>
                      Total Cost {formData.applyTVSH ? "with TVSH" : ""}:
                    </strong>
                  </span>
                  <span className="total-cost-with-tvsh">
                    {formatPrice(
                      formData.applyTVSH ? totalPrice * 1.2 : totalPrice,
                      formData.currency
                        ? currencies.find(
                            (c) => c.id === parseInt(formData.currency)
                          )?.symbol || "$"
                        : editingProduct?.currency?.symbol || "$"
                    )}
                  </span>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                {editingProduct && (
                  <>
                    {editingProduct.status !== "done" ? (
                      <button
                        type="button"
                        className="btn btn-success btn-small"
                        onClick={async () => {
                          try {
                            await handleSetToDone(editingProduct.id);
                            setShowModal(false);
                            setEditingProduct(null);
                            resetForm();
                          } catch (error) {
                            // Error already handled in handleSetToDone
                          }
                        }}
                      >
                        ✓ Set to done
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={async () => {
                          try {
                            await handleReset(editingProduct.id);
                            setShowModal(false);
                            setEditingProduct(null);
                            resetForm();
                          } catch (error) {
                            // Error already handled in handleReset
                          }
                        }}
                      >
                        ↻ Reset
                      </button>
                    )}
                  </>
                )}
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="image-viewer-overlay"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="image-viewer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="image-viewer-close"
              onClick={() => setViewingImage(null)}
            >
              ×
            </button>
            <img
              src={viewingImage}
              alt="Component"
              className="image-viewer-img"
            />
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
  );
};

export default FinalProducts;
