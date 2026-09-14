import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import ConfirmModal from "../components/ConfirmModal/ConfirmModal";

const ConfirmContext = createContext(null);

/**
 * ConfirmProvider
 * Provides a global, Promise-based confirmation dialog hook (`useConfirm`).
 * Replaces native, blocking `window.confirm()` calls with modern, accessible UI modals.
 */
export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "primary", // "primary" | "danger" | "warning" | "success"
    details: null
  });

  const resolverRef = useRef(null);

  /**
   * Promisified confirm invocation
   * @param {Object} options
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Main prompt text
   * @param {string} [options.confirmText="Confirm"] - Confirm button label
   * @param {string} [options.cancelText="Cancel"] - Cancel button label
   * @param {"primary"|"danger"|"warning"|"success"} [options.variant="primary"] - Visual style accent
   * @param {string} [options.details] - Optional extra description or warning note
   * @returns {Promise<boolean>} Resolves true on confirmation, false on cancellation
   */
  const confirm = useCallback(
    ({
      title = "Confirm Action",
      message = "Are you sure you want to proceed?",
      confirmText = "Confirm",
      cancelText = "Cancel",
      variant = "primary",
      details = null
    } = {}) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setModalState({
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          variant,
          details
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        details={modalState.details}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

/**
 * useConfirm hook
 * Usage:
 *   const { confirm } = useConfirm();
 *   const isConfirmed = await confirm({
 *     title: "Approve Gate Pass",
 *     message: "Are you sure you want to approve this gate pass?",
 *     variant: "success",
 *     confirmText: "Approve"
 *   });
 *   if (!isConfirmed) return;
 */
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Fallback in case rendered outside ConfirmProvider
    console.warn("useConfirm was called outside ConfirmProvider. Falling back to native confirm.");
    return {
      confirm: async ({ message = "Are you sure?" } = {}) => {
        // eslint-disable-next-line no-alert
        return window.confirm(message);
      }
    };
  }
  return context;
};

export default ConfirmContext;
