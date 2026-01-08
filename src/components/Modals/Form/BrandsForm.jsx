// components/Modals/Form/BrandsForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { brandService } from "../../../services/brandService";
import { uploadService } from "../../../services/uploadService";
import { useModalContext } from "../../../contexts/ModalContext";
import AlertModal from "../../Alerts/AlertModal";
import PulseDots from "../../Loaders/PulseDots";
import "../../../sass/components/Modals/BrandsForm/BrandsForm.scss";

const BrandsForm = ({ item = null, onClose, onSuccess }) => {
  const { openModal, closeModal } = useModalContext();
  const isEditing = !!item;

  // ✅ useRef untuk cleanup blob URL
  const logoPreviewUrlRef = useRef(null);

  // Original data dari backend
  const originalLogoPath = item?.logo || null;
  const originalLogoUrl = item?.logoUrl || null;

  const [formData, setFormData] = useState({
    name: "",
    logo: null, // File object baru atau null
    type: "PRODUCT",
    isActive: true,
    sortOrder: 0,
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [isLogoRemoved, setIsLogoRemoved] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && item) {
      setFormData({
        name: item.name || "",
        logo: null,
        type: item.type || "PRODUCT",
        isActive: item.isActive !== undefined ? item.isActive : true,
        sortOrder: item.sortOrder !== undefined ? item.sortOrder : 0,
      });

      // Set logo preview dari backend
      if (originalLogoUrl) {
        setLogoPreview(originalLogoUrl);
      } else {
        setLogoPreview(null);
      }
    } else {
      // Mode create
      setFormData({
        name: "",
        logo: null,
        type: "PRODUCT",
        isActive: true,
        sortOrder: 0,
      });
      setLogoPreview(null);
    }

    setIsLogoRemoved(false);
    setLogoError("");
  }, [item, isEditing, originalLogoUrl]);

  // ✅ Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (
        logoPreviewUrlRef.current &&
        logoPreviewUrlRef.current.startsWith("blob:")
      ) {
        URL.revokeObjectURL(logoPreviewUrlRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setLogoError("");
      return;
    }

    // Validasi file
    const validation = uploadService.validateFile(file);
    if (!validation.isValid) {
      setLogoError(validation.error);
      setFormData((prev) => ({ ...prev, logo: null }));
      setLogoPreview(null);
      return;
    }

    // File valid
    setLogoError("");
    setIsLogoRemoved(false);
    setFormData((prev) => ({ ...prev, logo: file }));

    // ✅ Cleanup old blob URL
    if (
      logoPreviewUrlRef.current &&
      logoPreviewUrlRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(logoPreviewUrlRef.current);
    }

    // Create new preview
    const previewUrl = URL.createObjectURL(file);
    logoPreviewUrlRef.current = previewUrl;
    setLogoPreview(previewUrl);
  };

  const handleRemoveLogo = () => {
    setIsLogoRemoved(true);
    setFormData((prev) => ({ ...prev, logo: null }));
    setLogoPreview(null);
    setLogoError("");

    // ✅ Cleanup blob URL
    if (
      logoPreviewUrlRef.current &&
      logoPreviewUrlRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(logoPreviewUrlRef.current);
      logoPreviewUrlRef.current = null;
    }

    // ✅ Reset file input
    const fileInput = document.getElementById("brand-logo-upload");
    if (fileInput) fileInput.value = "";
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type: type,
    }));
  };

  const handleStatusChange = (status) => {
    setFormData((prev) => ({
      ...prev,
      isActive: status,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLogoError("");

    try {
      // ✅ Prepare payload dengan validasi tipe data
      const payload = {
        name: formData.name.trim(),
        type: formData.type, // "PRODUCT" atau "CLIENT"
        isActive: formData.isActive === true, // ✅ PASTIKAN BOOLEAN
        sortOrder: Number(formData.sortOrder) || 0, // ✅ PASTIKAN NUMBER
      };

      // ✅ Handle logo
      if (formData.logo instanceof File) {
        // New file upload
        payload.logo = formData.logo;
      } else if (isEditing && !isLogoRemoved && originalLogoPath) {
        // Keep existing logo (send path string)
        payload.logo = originalLogoPath;
      } else {
        // No logo or removed
        payload.logo = null;
      }

      // ✅ Call service (signature yang benar: 1-2 params only)
      let result;
      if (isEditing) {
        result = await brandService.update(item.id, payload);
      } else {
        result = await brandService.create(payload);
      }

      const label = formData.type === "CLIENT" ? "Client" : "Brand";

      if (result.success) {
        // Close form modal
        const formModalId = isEditing ? "edit-brand" : "add-brand";
        closeModal(formModalId);

        // Show success modal
        openModal(
          "brandSuccessAlert",
          <AlertModal
            type="success"
            title={isEditing ? "Updated!" : "Created!"}
            message={`${label} has been successfully ${
              isEditing ? "updated" : "created"
            }.`}
            showActions={true}
            confirmText="OK"
            onConfirm={() => {
              closeModal("brandSuccessAlert");
              if (onSuccess) onSuccess();
            }}
            onCancel={() => closeModal("brandSuccessAlert")}
          />,
          "small"
        );
      } else {
        // Show error modal
        openModal(
          "brandErrorAlert",
          <AlertModal
            type="error"
            title="Failed to Save"
            message={
              result.message ||
              `Failed to ${
                isEditing ? "update" : "create"
              } ${label.toLowerCase()}. Please try again.`
            }
            showActions={true}
            confirmText="OK"
            onConfirm={() => closeModal("brandErrorAlert")}
            onCancel={() => closeModal("brandErrorAlert")}
          />,
          "small"
        );
      }
    } catch (err) {
      console.error("Submit error:", err);

      // Show error modal
      openModal(
        "brandErrorAlert",
        <AlertModal
          type="error"
          title="Error"
          message={`An error occurred while saving ${label.toLowerCase()}. Please try again.`}
          showActions={true}
          confirmText="OK"
          onConfirm={() => closeModal("brandErrorAlert")}
          onCancel={() => closeModal("brandErrorAlert")}
        />,
        "small"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brands-form">
      <form onSubmit={handleSubmit}>
        {/* Brand Name */}
        <div className="form-group">
          <label>
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter brand or client name"
            className="form-input"
          />
        </div>

        {/* Logo Upload */}
        <div className="form-group">
          <label>Logo</label>
          <div className="image-upload">
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleLogoChange}
              id="brand-logo-upload"
              className="image-input"
            />
            <label htmlFor="brand-logo-upload" className="image-label">
              {logoPreview ? "Change Logo" : "Choose Logo"}
            </label>

            {/* Logo Preview */}
            {logoPreview && (
              <div className="image-preview">
                <img src={logoPreview} alt="Logo preview" />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={handleRemoveLogo}
                  aria-label="Remove logo"
                >
                  Remove Logo
                </button>
              </div>
            )}

            {/* Logo Error Tooltip */}
            {logoError && (
              <div className="upload-error-tooltip">
                <X size={14} />
                <span>{logoError}</span>
              </div>
            )}

            <small className="field-hint">Only PNG or JPG. Max 2MB.</small>
          </div>
        </div>

        {/* Type Toggle (Product / Client) */}
        <div className="form-group">
          <label>Type</label>
          <div className="type-toggle">
            <button
              type="button"
              className={formData.type === "PRODUCT" ? "active" : ""}
              onClick={() => handleTypeChange("PRODUCT")}
            >
              Product
            </button>
            <button
              type="button"
              className={formData.type === "CLIENT" ? "active" : ""}
              onClick={() => handleTypeChange("CLIENT")}
            >
              Client
            </button>
          </div>
        </div>

        {/* Status Toggle */}
        <div className="form-group">
          <label>Status</label>
          <div className="status-toggle">
            <button
              type="button"
              className={formData.isActive === true ? "active" : ""}
              onClick={() => handleStatusChange(true)}
            >
              Active
            </button>
            <button
              type="button"
              className={formData.isActive === false ? "active" : ""}
              onClick={() => handleStatusChange(false)}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Sort Order (Optional) */}
        <div className="form-group">
          <label>Sort Order</label>
          <input
            type="number"
            name="sortOrder"
            value={formData.sortOrder}
            onChange={handleInputChange}
            min="0"
            placeholder="0"
            className="form-input"
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <PulseDots size="sm" color="#ffffff" count={6} />
              </span>
            ) : isEditing ? (
              "Update"
            ) : (
              "Create"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandsForm;
