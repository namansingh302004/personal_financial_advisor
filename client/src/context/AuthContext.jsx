import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('finwise_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData) => {
    localStorage.setItem('finwise_token', userData.token);
    localStorage.setItem('finwise_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('finwise_token');
    localStorage.removeItem('finwise_user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    localStorage.setItem('finwise_user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
