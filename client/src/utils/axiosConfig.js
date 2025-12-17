import axios from "axios";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
});

// Add request interceptor to include user ID in headers
apiClient.interceptors.request.use(
  (config) => {
    // Get user ID from global variable set by UserContext
    // This avoids async operations that could cause React to suspend
    const userId = window.__stackUserId;
    
    if (userId) {
      config.headers["X-User-Id"] = userId;
    } else {
      console.warn("API request made without user ID. User may not be logged in.");
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        url: error.config?.url,
        userId: window.__stackUserId || "not set"
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error("API Request Error: No response received", {
        url: error.config?.url,
        baseURL: apiClient.defaults.baseURL
      });
    } else {
      // Something else happened
      console.error("API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
