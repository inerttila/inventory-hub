import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await axios.get("/api/currencies");
      setCurrencies(res.data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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

