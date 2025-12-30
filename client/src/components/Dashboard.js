import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx-js-style';
import apiClient from '../utils/axiosConfig';
import './Dashboard.css';
import { useNotification } from '../context/NotificationContext';
import { useCurrency } from '../context/CurrencyContext';

const Dashboard = () => {
  const { showError, showSuccess } = useNotification();
  const { formatPrice } = useCurrency();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalFinalProducts: 0,
    pendingFinalProducts: 0,
    doneFinalProducts: 0,
    totalClients: 0,
    totalCategories: 0,
    totalBrands: 0,
    totalSquareMeters: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentFinalProducts, setRecentFinalProducts] = useState([]);
  const [salesChartData, setSalesChartData] = useState([]);
  const [stockChartData, setStockChartData] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDateRange, setReportDateRange] = useState('lastMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [allFinalProducts, setAllFinalProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [productsRes, finalProductsRes, clientsRes, categoriesRes, brandsRes] = await Promise.all([
        apiClient.get('/api/products'),
        apiClient.get('/api/final-products'),
        apiClient.get('/api/clients'),
        apiClient.get('/api/categories'),
        apiClient.get('/api/brands'),
      ]);
      
      // Store all final products and products for report generation
      setAllFinalProducts(finalProductsRes.data);
      setAllProducts(productsRes.data);

      const products = productsRes.data;
      const finalProducts = finalProductsRes.data;
      const clients = clientsRes.data;
      const categories = categoriesRes.data;
      const brands = brandsRes.data;

      // Calculate statistics
      const totalSquareMeters = products.reduce((sum, p) => {
        return sum + (parseFloat(p.square_meters) || 0);
      }, 0);

      const totalValue = products.reduce((sum, p) => {
        const squareMeters = parseFloat(p.square_meters) || 0;
        const pricePerM2 = parseFloat(p.price_per_square_meter) || 0;
        return sum + (squareMeters * pricePerM2);
      }, 0);

      const pendingFinalProducts = finalProducts.filter(fp => fp.status !== 'done').length;
      const doneFinalProducts = finalProducts.filter(fp => fp.status === 'done').length;

      // Get recent final products (last 5)
      const recent = finalProducts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setStats({
        totalProducts: products.length,
        totalFinalProducts: finalProducts.length,
        pendingFinalProducts,
        doneFinalProducts,
        totalClients: clients.length,
        totalCategories: categories.length,
        totalBrands: brands.length,
        totalSquareMeters,
        totalValue,
      });

      setRecentFinalProducts(recent);

      // Process data for charts
      const salesData = processSalesData(finalProducts);
      const stockData = processStockData(products);
      
      setSalesChartData(salesData);
      setStockChartData(stockData);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Process sales data (done final products) for last 6 months
  const processSalesData = (finalProducts) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Get done final products
    const doneProducts = finalProducts.filter(fp => fp.status === 'done');
    
    // Initialize last 6 months with zeros
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        month: monthNames[date.getMonth()],
        monthKey,
        totalPrice: 0,
      });
    }
    
    // Group done products by month
    doneProducts.forEach(product => {
      // Use date field if available, otherwise use updatedAt
      const productDate = product.date 
        ? new Date(product.date) 
        : new Date(product.updatedAt);
      
      if (productDate >= sixMonthsAgo) {
        const monthKey = `${productDate.getFullYear()}-${String(productDate.getMonth() + 1).padStart(2, '0')}`;
        const monthData = months.find(m => m.monthKey === monthKey);
        
        if (monthData) {
          const totalPrice = product.components.reduce(
            (sum, comp) => sum + parseFloat(comp.total_price || 0),
            0
          );
          const finalTotal = product.applyTVSH !== false ? totalPrice * 1.2 : totalPrice;
          monthData.totalPrice += finalTotal;
        }
      }
    });
    
    return months.map(m => ({
      month: m.month,
      price: parseFloat(m.totalPrice.toFixed(2)),
    }));
  };

  // Process stock data (products) for last 6 months
  const processStockData = (products) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Initialize last 6 months with zeros
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        month: monthNames[date.getMonth()],
        monthKey,
        totalM2: 0,
      });
    }
    
    // Group products by creation month
    products.forEach(product => {
      const productDate = new Date(product.createdAt);
      
      if (productDate >= sixMonthsAgo) {
        const monthKey = `${productDate.getFullYear()}-${String(productDate.getMonth() + 1).padStart(2, '0')}`;
        const monthData = months.find(m => m.monthKey === monthKey);
        
        if (monthData) {
          const squareMeters = parseFloat(product.square_meters) || 0;
          monthData.totalM2 += squareMeters;
        }
      }
    });
    
    return months.map(m => ({
      month: m.month,
      m2: parseFloat(m.totalM2.toFixed(2)),
    }));
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (reportDateRange) {
      case 'lastMonth':
        // First day of last month to last day of last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'last3Months':
        // From 3 months ago to today
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'last6Months':
        // From 6 months ago to today
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          return null;
        }
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return null;
    }

    return { startDate, endDate };
  };

  const handleGenerateReport = () => {
    try {
      const dateRange = getDateRange();
      if (!dateRange) {
        showError('Please select a valid date range');
        return;
      }

      const { startDate, endDate } = dateRange;

      // Filter final products by date range
      const filteredProducts = allFinalProducts.filter(product => {
        const productDate = product.date 
          ? new Date(product.date) 
          : new Date(product.createdAt);
        
        return productDate >= startDate && productDate <= endDate;
      });

      if (filteredProducts.length === 0) {
        showError('No final products found in the selected date range');
        return;
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Header
      const header = [
        [{ v: "General report", s: { font: { color: { rgb: "0000FF" }, bold: true, sz: 16 } } }],
        [],
        [
          { v: "Final Product", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
          { v: "Date", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
          { v: "State", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
          { v: "Total", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
        ],
      ];

      // Data rows
      let grandTotal = 0;
      const dataRows = filteredProducts.map(product => {
        const totalPrice = product.components.reduce(
          (sum, comp) => sum + parseFloat(comp.total_price || 0),
          0
        );
        const finalTotal = product.applyTVSH !== false ? totalPrice * 1.2 : totalPrice;
        grandTotal += finalTotal;
        const currencySymbol = product.currency?.symbol || '$';
        
        return [
          product.name,
          product.date ? new Date(product.date).toLocaleDateString() : (product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'),
          product.status === 'done' ? 'Done' : 'Pending',
          formatPrice(finalTotal, currencySymbol),
        ];
      });

      // Total row - empty row for spacing, then total row
      const totalRow = [
        [],
        [
          { v: "TOTAL", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } } } },
          { v: "", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } } } },
          { v: "", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } } } },
          { v: formatPrice(grandTotal, '$'), s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } } } },
        ],
      ];

      // Combine header, data, and total row
      const wsData = [...header, ...dataRows, ...totalRow];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Style header row
      const headerRow = 2; // Row 3 (0-indexed is 2)
      ['A', 'B', 'C', 'D'].forEach((col, idx) => {
        const cellRef = `${col}${headerRow + 1}`;
        const cell = ws[cellRef];
        if (cell) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
            fill: { fgColor: { rgb: "0066CC" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          };
        }
      });

      // Style data rows
      const dataStartRow = headerRow + 1;
      const dataEndRow = dataStartRow + dataRows.length - 1;
      for (let row = dataStartRow; row <= dataEndRow; row++) {
        ['A', 'B', 'C', 'D'].forEach((col) => {
          const cellRef = `${col}${row + 1}`;
          const cell = ws[cellRef];
          if (cell) {
            cell.s = {
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            };
          }
        });
      }

      // Style total row
      const totalRowIndex = dataEndRow + 2; // +1 for empty row, +1 for total row
      ['A', 'B', 'C', 'D'].forEach((col) => {
        const cellRef = `${col}${totalRowIndex + 1}`;
        const cell = ws[cellRef];
        if (cell) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
            fill: { fgColor: { rgb: "0066CC" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          };
        }
      });

      // Set column widths
      ws['!cols'] = [
        { wch: 30 }, // Final Product
        { wch: 15 }, // Date
        { wch: 12 }, // State
        { wch: 18 }, // Total
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "General Report");

      // Generate filename
      const dateRangeStr = reportDateRange === 'custom' 
        ? `${customStartDate}_to_${customEndDate}`
        : reportDateRange;
      const filename = `general_report_${dateRangeStr}_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      showSuccess("Excel report generated successfully!");
      setShowReportModal(false);
    } catch (error) {
      console.error("Error generating report:", error);
      showError("Error generating Excel report");
    }
  };

  const handleGenerateProductsReport = async () => {
    try {
      if (allProducts.length === 0) {
        showError('No products found in inventory');
        return;
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Header
      const header = [
        [{ v: "Products Inventory Report", s: { font: { color: { rgb: "0000FF" }, bold: true, sz: 16 } } }],
        [],
        [
          { v: "Name", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
          { v: "Code", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
          { v: "Price per m²", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
          { v: "Square Meters (m²)", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
          { v: "Brand", s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "0066CC" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
        ],
      ];

      // Data rows
      const dataRows = allProducts.map(product => {
        const pricePerM2 = parseFloat(product.price_per_square_meter || 0);
        const squareMeters = parseFloat(product.square_meters || 0);
        const currencySymbol = product.currency?.symbol || '$';
        const brandName = product.brand?.name || 'N/A';
        
        return [
          product.name,
          product.barcode || product.code || 'N/A',
          formatPrice(pricePerM2, currencySymbol),
          squareMeters.toFixed(2),
          brandName,
        ];
      });

      // Combine header and data
      const wsData = [...header, ...dataRows];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Style header row
      const headerRow = 2; // Row 3 (0-indexed is 2)
      ['A', 'B', 'C', 'D', 'E'].forEach((col, idx) => {
        const cellRef = `${col}${headerRow + 1}`;
        const cell = ws[cellRef];
        if (cell) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
            fill: { fgColor: { rgb: "0066CC" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          };
        }
      });

      // Style data rows
      const dataStartRow = headerRow + 1;
      const dataEndRow = dataStartRow + dataRows.length - 1;
      for (let row = dataStartRow; row <= dataEndRow; row++) {
        ['A', 'B', 'C', 'D', 'E'].forEach((col) => {
          const cellRef = `${col}${row + 1}`;
          const cell = ws[cellRef];
          if (cell) {
            cell.s = {
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            };
          }
        });
      }

      // Set column widths
      ws['!cols'] = [
        { wch: 30 }, // Name
        { wch: 20 }, // Code
        { wch: 18 }, // Price per m²
        { wch: 20 }, // Square Meters (m²)
        { wch: 20 }, // Brand
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Products Inventory");

      // Generate filename
      const filename = `products_inventory_report_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      showSuccess("Products inventory report generated successfully!");
    } catch (error) {
      console.error("Error generating products report:", error);
      showError("Error generating products inventory report");
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Welcome to Service Inventory Management</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Products</h3>
            <p className="stat-value">{stats.totalProducts}</p>
            <Link to="/products" className="stat-link">View Products →</Link>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Final Products</h3>
            <p className="stat-value">{stats.totalFinalProducts}</p>
            <div className="stat-breakdown">
              <span className="breakdown-item pending">{stats.pendingFinalProducts} Pending</span>
              <span className="breakdown-item done">{stats.doneFinalProducts} Done</span>
            </div>
            <Link to="/final-products" className="stat-link">View Final Products →</Link>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Clients</h3>
            <p className="stat-value">{stats.totalClients}</p>
            <p className="stat-description">Use Settings ⚙️ to manage</p>
          </div>
        </div>

        <div className="stat-card-group">
          <div className="stat-card stat-card-warning stat-card-small">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <h3>Categories</h3>
              <p className="stat-value">{stats.totalCategories}</p>
            </div>
          </div>

          <div className="stat-card stat-card-info stat-card-small">
            <div className="stat-icon">🏷️</div>
            <div className="stat-content">
              <h3>Brands</h3>
              <p className="stat-value">{stats.totalBrands}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-secondary">
          <div className="stat-icon">📏</div>
          <div className="stat-content">
            <h3>Total Square Meters</h3>
            <p className="stat-value">{stats.totalSquareMeters.toFixed(2)} m²</p>
            <p className="stat-description">Available inventory</p>
          </div>
        </div>

        <div className="stat-card stat-card-accent">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Inventory Value</h3>
            <p className="stat-value">
              {formatPrice(stats.totalValue, '$')}
            </p>
            <p className="stat-description">Based on current prices</p>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h2>Sales Trend (Last 6 Months)</h2>
          <p className="chart-subtitle">Total revenue from completed final products</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                label={{angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => formatPrice(value, '$')}
              />
              <Tooltip 
                formatter={(value) => formatPrice(value, '$')}
                labelStyle={{ color: '#333' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#28a745" 
                strokeWidth={3}
                name="Total Sales"
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2>Stock Added (Last 6 Months)</h2>
          <p className="chart-subtitle">Square meters added to inventory</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                label={{angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value) => `${parseFloat(value).toFixed(2)} m²`}
                labelStyle={{ color: '#333' }}
              />
              <Legend />
              <Bar 
                dataKey="m2" 
                fill="#007bff" 
                name="Stock Added (m²)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>Recent Final Products</h2>
          {recentFinalProducts.length > 0 ? (
            <div className="recent-list">
              {recentFinalProducts
                .slice(0, 3)
                .map((product) => {
                  const totalPrice = product.components.reduce(
                    (sum, comp) => sum + parseFloat(comp.total_price || 0),
                    0
                  );
                  const finalTotal = product.applyTVSH !== false ? totalPrice * 1.2 : totalPrice;
                  
                  return (
                    <Link 
                      key={product.id} 
                      to={`/final-products?id=${product.id}`} 
                      className="recent-item"
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <div className="recent-item-main">
                        <h4>{product.name}</h4>
                        <span className={`status-badge ${product.status === 'done' ? 'done' : 'pending'}`}>
                          {product.status === 'done' ? 'Done' : 'Pending'}
                        </span>
                      </div>
                      <div className="recent-item-details">
                        <span>Code: {product.code}</span>
                        {product.client && (
                          <span>Client: {product.client.fullName}</span>
                        )}
                        <span className="recent-item-price">
                          Total: {formatPrice(finalTotal, product.currency?.symbol || '$')}
                        </span>
                      </div>
                      <div className="recent-item-link">View Details →</div>
                    </Link>
                  );
                })}
            </div>
          ) : (
            <p className="empty-state">No final products yet. Create your first one!</p>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/products" className="quick-action-card">
              <div className="quick-action-icon">➕</div>
              <h3>Add Product</h3>
              <p>Create a new product entry</p>
            </Link>
            <Link to="/final-products" className="quick-action-card">
              <div className="quick-action-icon">🏭</div>
              <h3>Create Final Product</h3>
              <p>Build a final product from components</p>
            </Link>
            <div className="quick-action-card" onClick={() => setShowReportModal(true)} style={{ cursor: 'pointer' }}>
              <div className="quick-action-icon">📊</div>
              <h3>Generate Report</h3>
              <p>Export all final products to Excel</p>
            </div>
            <div className="quick-action-card" onClick={handleGenerateProductsReport} style={{ cursor: 'pointer' }}>
              <div className="quick-action-icon">📦</div>
              <h3>Products Report</h3>
              <p>Export all products inventory to Excel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Generate General Report</h3>
            <div className="form-group">
              <label>Select Date Range</label>
              <select
                value={reportDateRange}
                onChange={(e) => setReportDateRange(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px' }}
              >
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
                <option value="last6Months">Last 6 Months</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {reportDateRange === 'custom' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateReport}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;