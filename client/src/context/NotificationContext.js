import React, { createContext, useContext, useState, useCallback } from "react";
import NotificationContainer from "../components/NotificationContainer";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = Date.now() + Math.random();
      const notification = { id, message, type, duration };

      setNotifications((prev) => [...prev, notification]);

      return id;
    },
    []
  );

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message, duration) => {
      return showNotification(message, "success", duration);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message, duration) => {
      return showNotification(message, "error", duration);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message, duration) => {
      return showNotification(message, "warning", duration);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message, duration) => {
      return showNotification(message, "info", duration);
    },
    [showNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        removeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};
