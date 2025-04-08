import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocalDatabase from '../services/LocalDatabase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize the local database
    const initializeApp = async () => {
      try {
        await LocalDatabase.initialize();
        const currentUser = await LocalDatabase.user.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error initializing app:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      const loggedInUser = await LocalDatabase.user.login(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setError('Failed to sign in: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName) => {
    try {
      setError('');
      setLoading(true);
      const newUser = await LocalDatabase.user.register(email, password, displayName);
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError('');
      setLoading(true);
      await LocalDatabase.user.logout();
      setUser(null);
    } catch (err) {
      setError('Failed to log out: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      setError('');
      setLoading(true);
      await LocalDatabase.user.resetPassword(email);
      return { success: true, message: 'Password reset instructions sent to your email' };
    } catch (err) {
      setError('Failed to reset password: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    resetPassword,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
};

export default AuthContext;
