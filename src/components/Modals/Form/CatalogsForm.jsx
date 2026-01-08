// src/components/Modals/Form/CatalogsForm.jsx
import React, { useState, useEffect } from "react";
import PulseDots from "../../Loaders/PulseDots";
import catalogService from "../../../services/catalogService";
import { useModalContext } from "../../../contexts/ModalContext";
import AlertModal from "../../Alerts/AlertModal";
import "../../../sass/components/Modals/CatalogsForm/CatalogsForm.css";

const CatalogsForm = ({ initialData = null, onSuccess, onCancel }) => {
  const { openModal, closeModal } = useModalContext();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: "", // Google Drive URL (string)
  });

  const [embedUrl, setEmbedUrl] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract FILE_ID from Google Drive share URL
  const extractFileIdFromDriveUrl = (url) => {
    const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Convert share URL to embed URL
  const convertToEmbedUrl = (shareUrl) => {
    const fileId = extractFileIdFromDriveUrl(shareUrl);
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
  };

  // Validate: only Google Drive file URLs
  const isValidGoogleDriveUrl = (url) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== "drive.google.com") return false;
      if (!parsed.pathname.startsWith("/file/d/")) return false;
      return extractFileIdFromDriveUrl(url) !== null;
    } catch {
      return false;
    }
  };

  // Update embed URL and reset preview error when file input changes
  useEffect(() => {
    setPreviewError(false);
    if (formData.file && isValidGoogleDriveUrl(formData.file)) {
      const embed = convertToEmbedUrl(formData.file);
      setEmbedUrl(embed);
      if (errors.file) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.file;
          return newErrors;
        });
      }
    } else {
      setEmbedUrl("");
    }
  }, [formData.file, errors.file]);

  // Initialize form for edit mode
  useEffect(() => {
    if (initialData) {
      const initialFileUrl = initialData.file || "";
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        file: initialFileUrl,
      });
      if (initialFileUrl && isValidGoogleDriveUrl(initialFileUrl)) {
        setEmbedUrl(convertToEmbedUrl(initialFileUrl));
      }
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Catalog name is required.";
    } else if (formData.name.length > 200) {
      newErrors.name = "Catalog name must not exceed 200 characters.";
    }

    if (!formData.file.trim()) {
      newErrors.file = "Google Drive link is required.";
    } else if (!isValidGoogleDriveUrl(formData.file)) {
      newErrors.file = "Please enter a valid Google Drive file sharing URL.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        file: formData.file.trim(),
      };

      let result;
      if (initialData) {
        result = await catalogService.update(initialData.id, payload);
      } else {
        result = await catalogService.create(payload);
      }

      // ✅ Perbaiki kondisi success
      if (result && (result.success === true || result.data)) {
        onCancel?.();
        openModal(
          "catalogSaveSuccess",
          <AlertModal
            type="success"
            title={initialData ? "Updated!" : "Created!"}
            message={`Catalog "${formData.name}" has been successfully ${
              initialData ? "updated" : "created"
            }.`}
            onClose={() => {
              closeModal("catalogSaveSuccess");
              onSuccess?.();
            }}
          />,
          "small"
        );
      } else {
        throw new Error(result?.message || "Failed to save catalog.");
      }
    } catch (err) {
      openModal(
        "catalogSaveError",
        <AlertModal
          type="error"
          title="Failed to Save"
          message={
            err.message || "An unknown error occurred. Please try again."
          }
          onClose={() => closeModal("catalogSaveError")}
        />,
        "small"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="catalog-form">
      {/* Name */}
      <div className="form-group">
        <label htmlFor="catalog-name">Catalog Name *</label>
        <input
          id="catalog-name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={errors.name ? "input-error" : ""}
          maxLength={200}
        />
        {errors.name && (
          <div className="error-message">
            <span>{errors.name}</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="catalog-description">Description</label>
        <textarea
          id="catalog-description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
        />
      </div>

      {/* Google Drive Link */}
      <div className="form-group">
        <label htmlFor="catalog-file">Google Drive Link *</label>
        <input
          id="catalog-file"
          type="text"
          name="file"
          placeholder="https://drive.google.com/file/d/FILE_ID/view"
          value={formData.file}
          onChange={handleInputChange}
          className={errors.file ? "input-error" : ""}
        />
        {errors.file && (
          <div className="error-message">
            <span>{errors.file}</span>
          </div>
        )}
        <small className="form-hint">
          Ensure the file is set to{" "}
          <strong>"Anyone with the link can view"</strong>.
        </small>

        {/* Preview */}
        {embedUrl && (
          <div className="embed-preview">
            <p className="preview-label">Preview:</p>
            <div className="preview-frame">
              <embed
                src={embedUrl}
                width="100%"
                height="300"
                title="Catalog Preview"
                onLoad={() => setPreviewError(false)}
                onError={() => setPreviewError(true)}
              />
            </div>
            {previewError && (
              <div className="error-message preview-error">
                <span>
                  ❌ Preview failed. Ensure the Google Drive file is set to{" "}
                  <strong>"Anyone with the link can view"</strong>.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <PulseDots size={6} spacing={4} />
          ) : initialData ? (
            "Update"
          ) : (
            "Create"
          )}
        </button>
      </div>
    </form>
  );
};

export default CatalogsForm;
