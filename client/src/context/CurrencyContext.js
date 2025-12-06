import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "../utils/axiosConfig";
import { useUserContext } from "./UserContext";

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const { userId } = useUserContext() || {};
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrencies = useCallback(async () => {
    // Only fetch if user is logged in
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get("/api/currencies");
      setCurrencies(res.data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const formatPrice = (price, currencySymbol = "$") => {
    return `${currencySymbol}${parseFloat(price).toFixed(2)}`;
  };

  const refreshCurrencies = () => {
    fetchCurrencies();
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        formatPrice,
        refreshCurrencies,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

