import React, { useEffect } from "react";
import "./ConfirmModal.css";

/**
 * ConfirmModal Component
 * Renders an animated, accessible modal dialog with backdrop blur and customizable action themes.
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  details,
  onConfirm,
  onCancel
}) {
  // Handle Escape key to cancel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Prevent accidental form submission outside modal
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <i className="fas fa-exclamation-triangle" />;
      case "success":
        return <i className="fas fa-check-circle" />;
      case "warning":
        return <i className="fas fa-exclamation-circle" />;
      case "primary":
      default:
        return <i className="fas fa-question-circle" />;
    }
  };

  return (
    <div className="confirm-modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div
        className={`confirm-modal-card confirm-variant-${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="confirm-modal-close"
          onClick={onCancel}
          aria-label="Close dialog"
        >
          &times;
        </button>

        <div className="confirm-modal-header">
          <div className={`confirm-icon-badge confirm-icon-${variant}`}>
            {getIcon()}
          </div>
          <h3 className="confirm-modal-title">{title}</h3>
        </div>

        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
          {details && <p className="confirm-modal-details">{details}</p>}
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-btn confirm-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-btn confirm-btn-action confirm-btn-${variant}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
