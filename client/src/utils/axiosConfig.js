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
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
