// src/hooks/useAuth.jsx
import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in (token exists)
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.login(email, password);
      const { token } = response;
      
      localStorage.setItem('token', token);
      localStorage.setItem('email',email)
      setUser({ token });
      navigate('/dashboard');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const register = async (email, password, name) => {
    try {
      setError(null);
      const response = await api.register(email, password, name);
      const { token } = response;
      
      localStorage.setItem('token', token);
      localStorage.setItem('email',email)

      setUser({ token });
      navigate('/dashboard');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      // Call the API to logout
      await api.logout();
    } catch (err) {
      console.error("Error during logout:", err.message);
    } finally {
      // Always clear local storage and user state
      localStorage.removeItem('token');
      localStorage.removeItem('email');

      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

