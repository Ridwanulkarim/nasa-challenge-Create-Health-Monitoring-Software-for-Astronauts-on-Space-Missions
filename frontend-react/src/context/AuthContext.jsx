import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    const saved = api.getUser();
    if (saved) return saved;
    // Default demo session for astronaut
    const defaultUser = {
      astronautId: 'AST-001',
      username: 'sajid',
      firstName: 'Sajid',
      lastName: '',
      role: 'ASTRONAUT',
      callsign: 'Orion-Lead'
    };
    api.setUser(defaultUser);
    return defaultUser;
  });

  const login = async (username, password, extra = {}) => {
    const res = await api.login(username, password, extra);
    if (res.user) {
      setUserState(res.user);
    }
    return res;
  };

  const logout = () => {
    api.logout();
    setUserState(null);
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    api.setUser(merged);
    setUserState(merged);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
