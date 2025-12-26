import React from 'react';
import ReactDOM from 'react-dom/client';
import { Crypto } from '@peculiar/webcrypto';
import './index.css';
import App from './App';

// Initialize Web Crypto API polyfill for Stack Auth
// This is needed for OAuth and cryptographic operations, especially on HTTP (non-HTTPS) connections
if (typeof window !== 'undefined') {
  try {
    // Check if crypto.subtle is available (required for digest operations)
    // On HTTP connections or older browsers, the native crypto.subtle might not be available
    if (!window.crypto || !window.crypto.subtle) {
      const polyfill = new Crypto();
      if (!window.crypto) {
        window.crypto = polyfill;
      } else {
        window.crypto.subtle = polyfill.subtle;
      }
    }
  } catch (error) {
    console.warn('Failed to initialize Web Crypto polyfill:', error);
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

