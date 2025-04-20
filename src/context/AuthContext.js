import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

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
        const userJson = await AsyncStorage.getItem('current_user');
        const currentUser = userJson ? JSON.parse(userJson) : null;
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
      const loggedInUser = await ApiService.user.login({ email, password });
      
      // Store the user data
      await AsyncStorage.setItem('current_user', JSON.stringify(loggedInUser));
      
      // Store the JWT token separately for API requests
      if (loggedInUser && loggedInUser.token) {
        await AsyncStorage.setItem('token', loggedInUser.token);
      } else {
        console.warn('No token received from login response');
      }
      
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      // The ApiService now provides more specific error messages
      // Just use the error message directly
      setError(err.message || 'Failed to sign in. Please try again.');
      
      // Rethrow the error so the component can handle it
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName) => {
    try {
      setError('');
      setLoading(true);
      const newUser = await ApiService.user.register({ email, password, displayName: displayName });
      await AsyncStorage.setItem('current_user', JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError('Failed to create an account: ' + (err.response?.data?.message || err.message));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError('');
      setLoading(true);
      await AsyncStorage.removeItem('current_user');
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
      await ApiService.user.resetPassword(email);
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
