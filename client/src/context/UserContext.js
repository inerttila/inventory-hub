import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@stackframe/react";

const UserContext = createContext(null);

export const useUserContext = () => {
  const context = useContext(UserContext);
  return context;
};

export const UserProvider = ({ children }) => {
  const user = useUser();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (user) {
      setUserId(user.id);
      // Store user ID globally for axios interceptor
      window.__stackUserId = user.id;
    } else {
      setUserId(null);
      window.__stackUserId = null;
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, userId }}>
      {children}
    </UserContext.Provider>
  );
};

