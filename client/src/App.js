import {
  StackHandler,
  StackProvider,
  StackTheme,
  useUser,
  UserButton,
} from "@stackframe/react";
import React, { useState, useEffect } from "react";
import {
  Link,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import Dashboard from "./components/Dashboard";
import FinalProducts from "./components/FinalProducts";
import Products from "./components/Products";
import Settings from "./components/Settings";
import { CurrencyProvider } from "./context/CurrencyContext";
import { NotificationProvider } from "./context/NotificationContext";
import { UserProvider } from "./context/UserContext";
import { stackClientApp } from "./stack/client";

function HandlerRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAccountSettings = location.pathname === "/handler/account-settings";

  return (
    <div style={{ position: "relative" }}>
      {isAccountSettings && (
        <button
          onClick={() => navigate(-1)}
          className="go-back-btn"
        >
          <span>←</span> Go Back
        </button>
      )}
      <StackHandler app={stackClientApp} location={location.pathname} fullPage />
    </div>
  );
}

function Navbar({ onSettingsClick }) {
  const user = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-logo">
            <img
              src="https://skaitech.al/wp-content/uploads/2024/03/icons8-source-code-100.png"
              alt="Logo"
              style={{
                marginRight: "12px",
                verticalAlign: "middle",
                cursor: "pointer",
              }}
              onClick={() => window.location.href = "/"}
            />
            <span style={{ verticalAlign: "middle" }}>Service</span>
          </h1>
          <button 
            className="mobile-menu-btn" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <div className="nav-right">
            <div className="nav-links">
              <Link to="/" className="nav-link">
                Dashboard
              </Link>
              <Link to="/products" className="nav-link">
                Products
              </Link>
              <Link to="/final-products" className="nav-link">
                Final Products
              </Link>
            </div>
            {user && (
              <div className="user-profile-section">
                <UserButton
                  showUserInfo={true}
                  afterSignOutUrl="/handler/sign-in"
                  afterSignOut={() => {
                    // Clear the global user ID when user signs out
                    window.__stackUserId = null;
                  }}
                  appearance={{
                    elements: {
                      userButtonAvatarBox: {
                        width: "40px",
                        height: "40px",
                      },
                    },
                  }}
                />
              </div>
            )}
            <button
              className="settings-icon-btn"
              onClick={onSettingsClick}
              title="Settings"
            >
              <span>⚙</span>
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      ></div>
      
      {/* Mobile Menu Sidebar */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-header">
          <h2>Menu</h2>
        </div>
        <div className="mobile-menu-content">
          <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
            <span className="mobile-nav-icon">📊</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/products" className="mobile-nav-link" onClick={closeMobileMenu}>
            <span className="mobile-nav-icon">📦</span>
            <span>Products</span>
          </Link>
          <Link to="/final-products" className="mobile-nav-link" onClick={closeMobileMenu}>
            <span className="mobile-nav-icon">🏭</span>
            <span>Final Products</span>
          </Link>
          <div className="mobile-menu-divider"></div>
          {user && (
            <div className="mobile-user-section">
              <UserButton
                showUserInfo={true}
                afterSignOutUrl="/handler/sign-in"
                afterSignOut={() => {
                  window.__stackUserId = null;
                }}
                appearance={{
                  elements: {
                    userButtonAvatarBox: {
                      width: "40px",
                      height: "40px",
                    },
                  },
                }}
              />
            </div>
          )}
          <button
            className="mobile-settings-btn"
            onClick={() => {
              onSettingsClick();
              closeMobileMenu();
            }}
          >
            <span className="mobile-nav-icon">⚙</span>
            <span>Settings</span>
          </button>
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUser();
  const isAuthPage = location.pathname.startsWith("/handler");

  // Redirect to sign-in if user logs out while on protected pages
  useEffect(() => {
    if (!isAuthPage && !user) {
      // Clear user ID when user becomes null
      window.__stackUserId = null;
      navigate("/handler/sign-in", { replace: true });
    }
  }, [user, isAuthPage, navigate]);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/handler/*" element={<HandlerRoutes />} />
      </Routes>
    );
  }

  // Don't render protected content if user is not logged in
  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="App">
      <Navbar onSettingsClick={() => setShowSettings(true)} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/final-products" element={<FinalProducts />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <p>
          Made by{" "}
          <a
            href="https://inert.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            inerttila
          </a>
        </p>
      </footer>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <UserProvider>
              <CurrencyProvider>
                <AppContent />
              </CurrencyProvider>
            </UserProvider>
          </StackTheme>
        </StackProvider>
      </Router>
    </NotificationProvider>
  );
}

export default App;
