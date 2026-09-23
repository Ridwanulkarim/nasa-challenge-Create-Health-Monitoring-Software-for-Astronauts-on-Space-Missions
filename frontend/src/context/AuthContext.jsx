/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Authentication Context: client/src/context/AuthContext.jsx
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => api.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = api.getUser();
    setUserState(storedUser);
    setLoading(false);
  }, []);

  const setUser = (newUser) => {
    api.setUser(newUser);
    setUserState(newUser);
  };

  const login = async (username, password, extra = {}) => {
    const res = await api.login({ username, password, ...extra });
    if (res.user) {
      setUserState(res.user);
    }
    return res;
  };

  const logout = () => {
    api.logout();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
