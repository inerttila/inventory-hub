import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Products from './components/Products';
import FinalProducts from './components/FinalProducts';
import Categories from './components/Categories';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">📦 Inventory App</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">Products</Link>
              <Link to="/categories" className="nav-link">Categories</Link>
              <Link to="/final-products" className="nav-link">Final Products</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/final-products" element={<FinalProducts />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

