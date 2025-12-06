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
import Categories from "./components/Categories";
import FinalProducts from "./components/FinalProducts";
import Products from "./components/Products";
import Settings from "./components/Settings";
import { CurrencyProvider } from "./context/CurrencyContext";
import { NotificationProvider } from "./context/NotificationContext";
import { UserProvider } from "./context/UserContext";
import { stackClientApp } from "./stack/client";

function HandlerRoutes() {
  const location = useLocation();

  return (
    <StackHandler app={stackClientApp} location={location.pathname} fullPage />
  );
}

function Navbar({ onSettingsClick }) {
  const user = useUser();

  return (
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
            onClick={() => window.location.reload()}
          />
          <span style={{ verticalAlign: "middle" }}>Koli Duroplast</span>
        </h1>
        <div className="nav-right">
          <div className="nav-links">
            <Link to="/" className="nav-link">
              Products
            </Link>
            {/* <Link to="/categories" className="nav-link">
                      Categories
                    </Link> */}
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
          <Route path="/" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
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
