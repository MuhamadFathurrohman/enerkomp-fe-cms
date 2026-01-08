// components/Modals/Form/CategoriesForm.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { categoriesService } from "../../../services/categoriesService";
import { useModalContext } from "../../../contexts/ModalContext";
import AlertModal from "../../Alerts/AlertModal";
import PulseDots from "../../Loaders/PulseDots";
import "../../../sass/components/Modals/CategoriesForm/CategoriesForm.css";

const CategoriesForm = ({ item = null, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const { openModal, closeModal } = useModalContext();
  const isEditing = !!item;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        isActive: Boolean(item.isActive),
      });
    }
  }, [item, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    try {
      let result;
      const payload = {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
      };

      if (isEditing) {
        result = await categoriesService.update(
          item.id,
          payload,
          currentUser.id
        );
      } else {
        result = await categoriesService.create(payload, currentUser.id);
      }

      if (result.success) {
        // Tutup form modal
        const formModalId = isEditing ? "edit-category" : "add-category";
        closeModal(formModalId);

        // Tunggu sebentar sebelum membuka modal sukses (opsional)
        setTimeout(() => {
          openModal(
            "categorySuccessAlert",
            <AlertModal
              type="success"
              title={isEditing ? "Updated!" : "Success!"}
              message={`Category successfully ${
                isEditing ? "updated" : "created"
              }!`}
              onClose={() => {
                closeModal("categorySuccessAlert");
                if (onSuccess) onSuccess();
              }}
            />,
            "small"
          );
        }, 300);
      } else {
        // Jika service mengembalikan pesan error
        throw new Error(
          result.message ||
            (isEditing
              ? "Failed to update category"
              : "Failed to create category")
        );
      }
    } catch (err) {
      // Tangani error (termasuk error dari service atau error runtime)
      openModal(
        "categoryErrorAlert",
        <AlertModal
          type="error"
          title="Error"
          message={err.message || "An error occurred while saving data."}
          onClose={() => closeModal("categoryErrorAlert")}
        />,
        "small"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="categories-form">
      <form onSubmit={handleSubmit}>
        {/* Nama Kategori */}
        <div className="form-group">
          <label>Category Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter category name"
            className="form-input"
          />
        </div>

        {/* Deskripsi */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter description (optional)"
            rows={4}
            className="form-textarea"
          />
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

        {/* Tombol Aksi */}
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
            {loading ? ( // Tampilkan PulseDots saat loading
              <span className="btn-loading">
                <PulseDots size="sm" color="#ffffff" count={3} />
              </span>
            ) : // Tampilkan teks saat tidak loading
            isEditing ? (
              "Update Category"
            ) : (
              "Create Category"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoriesForm;
