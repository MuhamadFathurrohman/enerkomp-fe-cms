// src/components/Modal/Modal.jsx
import React from "react";
import "../../sass/components/Modals/Modal/Modal.css"; // Import SCSS

/**
 * Komponen Modal Generik
 * Digunakan untuk membungkus konten modal dengan header/footer konsisten
 */
const Modal = ({
  children,
  title,
  showHeader = true,
  showCloseButton = true,
  onClose,
  className = "",
}) => {
  return (
    <div className={className}>
      {showHeader && (
        <div className="modal-header">
          <h2>{title}</h2>
          {showCloseButton && (
            <button className="modal-close-btn" onClick={onClose}>
              &times;
            </button>
          )}
        </div>
      )}
      <div className="modal-body">{children}</div>
    </div>
  );
};

/**
 * Modal Shell - UI dasar untuk satu modal
 */
const ModalShell = ({ children, onClose, size = "medium", className = "" }) => {
  // Close on ESC
  React.useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const contentClass = `modal-content modal-size-${size} ${className}`.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={contentClass} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

/**
 * Renderer untuk semua modal aktif
 */
export const ModalRenderer = ({ modals, closeModal }) => {
  if (modals.length === 0) return null;

  return modals.map(({ key, content, size, className }) => (
    <ModalShell
      key={key}
      onClose={() => closeModal(key)}
      size={size}
      className={className || ""}
    >
      {content}
    </ModalShell>
  ));
};

export default Modal;
