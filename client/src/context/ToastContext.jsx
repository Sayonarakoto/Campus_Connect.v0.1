import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import ToastContainer from "../components/Toast/ToastContainer";

const ToastContext = createContext(null);

/**
 * Toast Provider Component
 * Wraps the application to provide toast notification context and renders
 * the fixed bottom-right ToastContainer automatically.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info", duration = 4000, title = null) => {
    if (!message) return;

    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newToast = {
      id,
      message,
      type, // 'success' | 'error' | 'warning' | 'info'
      title
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  // Convenience methods
  const success = useCallback((msg, duration = 4000, title = null) => {
    return showToast(msg, "success", duration, title);
  }, [showToast]);

  const error = useCallback((msg, duration = 5000, title = null) => {
    return showToast(msg, "error", duration, title);
  }, [showToast]);

  const warning = useCallback((msg, duration = 4500, title = null) => {
    return showToast(msg, "warning", duration, title);
  }, [showToast]);

  const info = useCallback((msg, duration = 4000, title = null) => {
    return showToast(msg, "info", duration, title);
  }, [showToast]);

  // Attach convenience helpers directly to the showToast function
  showToast.success = success;
  showToast.error = error;
  showToast.warning = warning;
  showToast.info = info;

  const contextValue = useMemo(() => ({
    showToast,
    success,
    error,
    warning,
    info,
    toasts,
    removeToast
  }), [showToast, success, error, warning, info, toasts, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook
 * Single-line hook to trigger notification toasts anywhere in the client.
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast("Action completed", "success");
 *   showToast.error("An error occurred");
 *   showToast.warning("Please check this field");
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside ToastProvider to prevent crash
    console.warn("useToast was called outside of a ToastProvider. Falling back to alert.");
    const fallbackFn = (msg) => alert(msg);
    fallbackFn.success = fallbackFn;
    fallbackFn.error = fallbackFn;
    fallbackFn.warning = fallbackFn;
    fallbackFn.info = fallbackFn;
    return {
      showToast: fallbackFn,
      success: fallbackFn,
      error: fallbackFn,
      warning: fallbackFn,
      info: fallbackFn,
      toasts: [],
      removeToast: () => {}
    };
  }
  return context;
};

export default ToastContext;
