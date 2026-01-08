// components/Forms/GalleryForm.jsx
import React, { useState, useRef, useEffect } from "react";
import { Pencil, X, Upload } from "lucide-react";
import { galleryService } from "../../../services/galleryService";
import { useAuth } from "../../../contexts/AuthContext";
import { uploadService } from "../../../services/uploadService";
import { useModalContext } from "../../../contexts/ModalContext";
import PulseDots from "../../Loaders/PulseDots";
import AlertModal from "../../Alerts/AlertModal";
import "../../../sass/components/Modals/GalleryForm/GalleryForm.css";

const GalleryForm = ({ item, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const { openModal, closeModal } = useModalContext();
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Hapus error saat fokus ke form lain
  useEffect(() => {
    const handleFocus = (e) => {
      if (formRef.current && formRef.current.contains(e.target)) {
        if (!e.target.closest(".image-upload-area")) {
          setError("");
        }
      }
    };

    document.addEventListener("focusin", handleFocus);
    return () => {
      document.removeEventListener("focusin", handleFocus);
    };
  }, []);

  // ✅ Load data saat edit - menggunakan helper dari galleryService
  useEffect(() => {
    if (item) {
      const previewUrl =
        item.imageUrl || galleryService._getFullImageUrl(item.image);
      setImagePreview(previewUrl);
      setImageFile(null);
    } else {
      setImagePreview(null);
      setImageFile(null);
      setError("");
    }
  }, [item]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ✅ Validasi file sebelum diproses
      const validation = uploadService.validateFile(file);
      if (!validation.isValid) {
        setError(validation.error);
        // Reset file input
        e.target.value = "";
        return;
      }

      // Jika validasi lolos, lanjutkan proses
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError(""); // Bersihkan error sebelumnya
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ✅ Handler untuk ganti gambar saat edit
  const handleChangeImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // GalleryForm.jsx → handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi: harus ada image saat create
    if (!item && !imageFile) {
      setError("Image is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let result;
      if (item) {
        if (imageFile instanceof File) {
          result = await galleryService.update(
            item.id,
            { image: imageFile },
            currentUser.id
          );
        } else {
          result = { success: true };
        }
      } else {
        if (imageFile instanceof File) {
          result = await galleryService.create(
            { image: imageFile },
            currentUser.id
          );
        } else {
          throw new Error("Image must be a File object");
        }
      }

      if (result.success) {
        const modalId = item ? "edit-gallery" : "add-gallery";
        closeModal(modalId);

        setTimeout(() => {
          openModal(
            "gallerySuccessAlert",
            <AlertModal
              title={item ? "Updated!" : "Success!"}
              type="success"
              message={`Gallery item successfully ${
                item ? "updated" : "created"
              }!`}
              onClose={() => {
                closeModal("gallerySuccessAlert");
                if (onSuccess) onSuccess();
              }}
            />,
            "small"
          );
        }, 300);
      } else {
        throw new Error(
          result.message ||
            (item ? "Failed to update gallery" : "Failed to create gallery")
        );
      }
    } catch (err) {
      openModal(
        "galleryErrorAlert",
        <AlertModal
          title="Error"
          type="error"
          message={
            err.message ||
            (item
              ? "An error occurred while updating gallery"
              : "An error occurred while creating gallery")
          }
          onClose={() => closeModal("galleryErrorAlert")}
        />,
        "small"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gallery-form">
      <form ref={formRef} onSubmit={handleSubmit} className="form-content">
        <div className="form-group">
          <label>Image Upload *</label>
          <div className="image-upload-area">
            {imagePreview ? (
              <div className="image-preview-container">
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <div className="image-actions">
                    <button
                      type="button"
                      className="change-image-btn"
                      onClick={handleChangeImage}
                      title="Change image"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                  style={{ display: "none" }}
                />
              </div>
            ) : (
              <label className="upload-placeholder">
                <Upload size={24} />
                <span>Click to upload image</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                  required={!item}
                />
              </label>
            )}
            {error && <div className="upload-error-tooltip">{error}</div>}
          </div>
        </div>

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
                <PulseDots size="sm" color="#ffffff" count={3} />
              </span>
            ) : item ? (
              "Update Gallery"
            ) : (
              "Add Gallery"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GalleryForm;
