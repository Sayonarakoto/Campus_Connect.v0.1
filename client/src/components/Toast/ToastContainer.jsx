import React from "react";
import "./Toast.css";

const ToastIcons = {
  success: <i className="fas fa-check-circle" aria-hidden="true"></i>,
  error: <i className="fas fa-exclamation-circle" aria-hidden="true"></i>,
  warning: <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>,
  info: <i className="fas fa-info-circle" aria-hidden="true"></i>
};

const DefaultTitles = {
  success: "Success",
  error: "Notice",
  warning: "Attention",
  info: "Information"
};

/**
 * ToastContainer Component
 * Renders floating toast notifications in the bottom-right viewport.
 */
const ToastContainer = ({ toasts = [], onDismiss }) => {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const type = toast.type || "info";
        const title = toast.title || DefaultTitles[type] || "Notice";

        return (
          <div
            key={toast.id}
            className={`toast-item toast-${type}`}
            role="alert"
            aria-live="assertive"
          >
            <div className="toast-icon-wrap" aria-hidden="true">
              {ToastIcons[type] || ToastIcons.info}
            </div>

            <div className="toast-content">
              <h4 className="toast-title">{title}</h4>
              <p className="toast-message">{toast.message}</p>
            </div>

            <button
              type="button"
              className="toast-close-btn"
              onClick={() => onDismiss(toast.id)}
              aria-label="Close notification"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
