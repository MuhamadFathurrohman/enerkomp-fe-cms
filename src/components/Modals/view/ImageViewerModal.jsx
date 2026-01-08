import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import "../../../sass/components/Modals/ImageViewerModal/ImageViewerModal.css";

const ImageViewerModal = ({ imageUrl, alt, date, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleEsc = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    const handleEscKey = (e) => handleEsc(e);
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [handleEsc]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className="image-viewer-modal"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div className="image-viewer-backdrop" />

      <button
        className="image-viewer-close"
        onClick={onClose}
        aria-label="Close image viewer"
      >
        <X size={24} />
      </button>

      <div className="image-viewer-content">
        {loading && (
          <div className="image-viewer-loading">
            <div className="image-viewer-spinner"></div>
            <p>Loading image...</p>
          </div>
        )}

        {error ? (
          <div className="image-viewer-error">
            <p>Failed to load image</p>
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={alt && typeof alt === "string" ? alt : "Gallery Image"}
            className="image-viewer-img"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {!loading && !error && date && (
          <div className="image-viewer-info">
            <span className="image-viewer-date">{date}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageViewerModal;
