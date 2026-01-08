// src/components/Modal/AlertModal.jsx
import React from "react";
import Modal from "../Modals/Modal";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Info,
} from "lucide-react";
import "../../sass/components/Alerts/AlertModal/AlertModal.css";

const AlertModal = ({
  title,
  message,
  onClose,
  onConfirm,
  onCancel,
  type = "success", // "success", "error", "warning", "delete", "info"
  showActions = false, // false = simple (1 button), true = confirmation (2 buttons)
  confirmText,
  cancelText = "Cancel",
}) => {
  // Icon berdasarkan type
  const renderIcon = () => {
    const iconProps = {
      size: 32,
      strokeWidth: 2,
    };

    switch (type) {
      case "success":
        return <CheckCircle {...iconProps} />;
      case "error":
        return <XCircle {...iconProps} />;
      case "warning":
        return <AlertTriangle {...iconProps} />;
      case "delete":
        return <Trash2 {...iconProps} />;
      case "info":
        return <Info {...iconProps} />;
      default:
        return <CheckCircle {...iconProps} />;
    }
  };

  // Default title jika tidak disediakan
  const defaultTitle = {
    success: "Success!",
    error: "Error",
    warning: "Warning",
    delete: "Delete?",
    info: "Information",
  };

  // Default confirm text jika tidak disediakan
  const defaultConfirmText = {
    success: "OK",
    error: "OK",
    warning: "Continue",
    delete: "Delete",
    info: "OK",
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      title={title || defaultTitle[type]}
      showHeader={false}
      showCloseButton={!showActions} // Hide close button jika ada 2 tombol action
      onClose={onClose}
      size="small"
      className={`alert-modal alert-${type}`}
    >
      <div className="alert-content">
        <div className="alert-icon-wrapper">
          <div className="alert-icon">{renderIcon()}</div>
        </div>
        <h3 className="alert-title">{title || defaultTitle[type]}</h3>
        <p className="alert-message">{message}</p>
      </div>

      <div className="alert-actions">
        {showActions ? (
          <>
            <button
              className="alert-btn alert-btn-cancel"
              onClick={handleCancel}
              type="button"
            >
              {cancelText}
            </button>
            <button
              className="alert-btn alert-btn-primary"
              onClick={handleConfirm}
              type="button"
            >
              {confirmText || defaultConfirmText[type]}
            </button>
          </>
        ) : (
          // Simple mode: 1 button (OK)
          <button
            className="alert-btn alert-btn-primary alert-btn-single"
            onClick={handleConfirm}
            type="button"
          >
            {confirmText || defaultConfirmText[type]}
          </button>
        )}
      </div>
    </Modal>
  );
};

export default AlertModal;
