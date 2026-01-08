import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Globe,
} from "lucide-react";
import { itemService } from "../../../services/itemService";
import SkeletonItem from "../../Loaders/SkeletonItem";
import "../../../sass/components/Modals/ItemViewModal/ItemViewModal.css";

const ItemViewModal = ({ itemId }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState("EN");

  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Pass language parameter
        const result = await itemService.getById(itemId, currentLanguage);

        if (result.success) {
          setItem(result.data);
        } else {
          setError(result.message || "Failed to load item details.");
        }
      } catch (err) {
        console.error("Error fetching item:", err);
        setError("An error occurred while loading item details.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId, currentLanguage]);

  const images = item?.images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // ✅ Handle language change
  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
  };

  // Loading State
  if (loading) {
    return (
      <div className="item-view-content">
        <div className="view-left">
          <SkeletonItem
            style={{ width: "100%", height: "100%", borderRadius: "16px" }}
          />
        </div>
        <div className="view-right">
          <div className="product-header">
            <SkeletonItem
              style={{
                width: "70%",
                height: "32px",
                marginBottom: "16px",
                borderRadius: "8px",
              }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <SkeletonItem
                style={{ width: "100px", height: "32px", borderRadius: "16px" }}
              />
              <SkeletonItem
                style={{ width: "140px", height: "32px", borderRadius: "16px" }}
              />
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div>
              <SkeletonItem
                style={{
                  width: "30%",
                  height: "20px",
                  marginBottom: "12px",
                  borderRadius: "6px",
                }}
              />
              <SkeletonItem
                style={{ width: "100%", height: "60px", borderRadius: "8px" }}
              />
            </div>
            <div>
              <SkeletonItem
                style={{
                  width: "40%",
                  height: "20px",
                  marginBottom: "12px",
                  borderRadius: "6px",
                }}
              />
              <SkeletonItem
                style={{ width: "100%", height: "100px", borderRadius: "8px" }}
              />
            </div>
            <div>
              <SkeletonItem
                style={{
                  width: "35%",
                  height: "20px",
                  marginBottom: "12px",
                  borderRadius: "6px",
                }}
              />
              <SkeletonItem
                style={{ width: "100%", height: "80px", borderRadius: "8px" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="item-view-content">
        <div className="view-error">
          <XCircle size={64} />
          <h3>Failed to Load Item</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="item-view-content">
      {/* Left Side - Image Gallery */}
      <div className="view-left">
        <div className="image-gallery">
          {images.length > 0 ? (
            <>
              <div className="main-image">
                <img
                  src={images[currentImageIndex]}
                  alt={`${item.name} - ${currentImageIndex + 1}`}
                  className="gallery-image"
                />

                {hasMultipleImages && (
                  <>
                    <button className="gallery-nav prev" onClick={prevImage}>
                      <ChevronLeft size={24} />
                    </button>
                    <button className="gallery-nav next" onClick={nextImage}>
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {hasMultipleImages && (
                  <div className="image-counter">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {hasMultipleImages && (
                <div className="thumbnail-strip">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className={`thumbnail ${
                        index === currentImageIndex ? "active" : ""
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img src={img} alt={`Thumbnail ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-image-placeholder">
              <Package size={64} />
              <p>No Image Available</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Product Details */}
      <div className="view-right">
        {/* ✅ Language Switcher with Icon */}
        <div className="view-language-switcher">
          <Globe size={16} />
          <button
            className={`lang-btn ${currentLanguage === "EN" ? "active" : ""}`}
            onClick={() => handleLanguageChange("EN")}
          >
            EN
          </button>
          <button
            className={`lang-btn ${currentLanguage === "ID" ? "active" : ""}`}
            onClick={() => handleLanguageChange("ID")}
          >
            ID
          </button>
        </div>

        <div className="product-header">
          <h2 className="product-title">{item.name}</h2>
          <div className="product-meta">
            <span
              className={`status-badge ${
                item.isActive ? "active" : "inactive"
              }`}
            >
              {item.isActive ? (
                <>
                  <CheckCircle size={14} /> Active
                </>
              ) : (
                <>
                  <XCircle size={14} /> Inactive
                </>
              )}
            </span>
            <span className="date-info">
              <Calendar size={14} />
              {item.createdAtFormatted}
            </span>
          </div>
        </div>

        <div className="product-details">
          {/* Short Description */}
          <div className="detail-section">
            <h3 className="section-title">Overview</h3>
            {item.shortDescription ? (
              <p className="short-description">{item.shortDescription}</p>
            ) : (
              <p className="no-data-text">
                No overview available for{" "}
                {currentLanguage === "EN" ? "English" : "Indonesian"}
              </p>
            )}
          </div>

          {/* Long Description */}
          <div className="detail-section">
            <h3 className="section-title">Description</h3>
            {item.longDescription ? (
              <div className="long-description">
                {item.longDescription.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="no-data-text">
                No detailed description available for{" "}
                {currentLanguage === "EN" ? "English" : "Indonesian"}
              </p>
            )}
          </div>

          {/* Features */}
          {item.features && item.features.length > 0 ? (
            <div className="detail-section">
              <h3 className="section-title">Key Features</h3>
              <ul className="features-list">
                {item.features.map((feature, index) => (
                  <li key={index}>
                    <CheckCircle size={16} className="feature-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="detail-section">
              <h3 className="section-title">Key Features</h3>
              <p className="no-data-text">
                No features available for{" "}
                {currentLanguage === "EN" ? "English" : "Indonesian"}
              </p>
            </div>
          )}

          {/* Specifications */}
          {item.specifications &&
          Object.keys(item.specifications).length > 0 ? (
            <div className="detail-section">
              <h3 className="section-title">Specifications</h3>
              <div className="specifications-grid">
                {Object.entries(item.specifications).map(([key, value]) => (
                  <div key={key} className="spec-item">
                    <span className="spec-label">{key}:</span>
                    <span className="spec-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="detail-section">
              <h3 className="section-title">Specifications</h3>
              <p className="no-data-text">
                No specifications available for{" "}
                {currentLanguage === "EN" ? "English" : "Indonesian"}
              </p>
            </div>
          )}

          {/* Additional Info */}
          <div className="detail-section additional-info">
            <div className="info-row">
              <span className="info-label">Sort Order:</span>
              <span className="info-value">{item.sortOrder}</span>
            </div>
            {item.updatedAtFormatted && (
              <div className="info-row">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">{item.updatedAtFormatted}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemViewModal;
