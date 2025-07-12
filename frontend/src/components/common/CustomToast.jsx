import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { initializeToast } from '../../utils/toast';
import './CustomToast.css';

// Create a context for toast notifications
export const ToastContext = createContext(null);

// Toast types
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

// Custom Toast Provider component
export const CustomToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const addToast = (message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
    return id;
  };

  // Remove a toast by id
  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // Helper functions for different toast types
  const success = (message, duration) => addToast(message, TOAST_TYPES.SUCCESS, duration);
  const error = (message, duration) => addToast(message, TOAST_TYPES.ERROR, duration);
  const info = (message, duration) => addToast(message, TOAST_TYPES.INFO, duration);
  const warning = (message, duration) => addToast(message, TOAST_TYPES.WARNING, duration);

  // Initialize the toast utility with our functions
  useEffect(() => {
    initializeToast({ success, error, info, warning });
    // No cleanup needed as we want the toast functions to remain available
  }, []);

  // Value for the context
  const contextValue = {
    addToast,
    removeToast,
    success,
    error,
    info,
    warning
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <div className="custom-toast-container">
          {toasts.map((toast) => (
            <Toast 
              key={toast.id} 
              {...toast} 
              onClose={() => removeToast(toast.id)} 
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// Individual Toast component
const Toast = ({ id, message, type, duration, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`custom-toast custom-toast-${type}`}>
      <div className="custom-toast-content">{message}</div>
      <button className="custom-toast-close" onClick={onClose}>×</button>
    </div>
  );
};

// Hook to use toast in components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a CustomToastProvider');
  }
  return context;
};

// Don't export toast from here to avoid conflicts with utils/toast.js
// The utils/toast.js is the primary export for toast functionality
