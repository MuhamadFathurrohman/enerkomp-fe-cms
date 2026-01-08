// src/components/Modal/UserForm.jsx
import React, { useState, useRef, useEffect } from "react";
import { usersService } from "../../../services/usersService";
import { uploadService } from "../../../services/uploadService";
import { useModalContext } from "../../../contexts/ModalContext";
import { useAuth } from "../../../contexts/AuthContext";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import "../../../sass/components/Modals/UserForm/UserForm.css";
import defaultAvatar from "../../../assets/images/default-avatar.png";
import AlertModal from "../../Alerts/AlertModal";
import PulseDots from "../../Loaders/PulseDots";

const DEFAULT_AVATAR = defaultAvatar;

const UserForm = ({
  onSuccess,
  onCancel,
  initialData = null,
  isProfileMode = false,
  roles = [],
}) => {
  const { closeModal, openModal } = useModalContext();
  const { user: currentUser } = useAuth();
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const roleSelectRef = useRef(null);
  const statusSelectRef = useRef(null);
  const avatarPreviewUrlRef = useRef(null);

  const originalAvatarUrl =
    initialData?.avatarUrl || initialData?.avatar || null;
  const hasOriginalAvatar = !!originalAvatarUrl;

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    roleId: initialData?.roleId ? String(initialData.roleId) : "",
    password: "",
    confirmPassword: "",
    avatar: null,
    status: initialData?.status || "ACTIVE",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(
    originalAvatarUrl || DEFAULT_AVATAR
  );
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const roleOptions = roles.map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  const statusOptions = [
    { value: "ACTIVE", label: "ACTIVE" },
    { value: "INACTIVE", label: "INACTIVE" },
    { value: "SUSPENDED", label: "SUSPENDED" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleSelectRef.current && !roleSelectRef.current.contains(e.target)) {
        setIsRoleOpen(false);
      }
      if (
        statusSelectRef.current &&
        !statusSelectRef.current.contains(e.target)
      ) {
        setIsStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleFocus = (e) => {
      if (formRef.current && formRef.current.contains(e.target)) {
        if (!e.target.closest(".avatar-upload-group")) {
          setError("");
        }
        if (!e.target.closest(".password-input-wrapper")) {
          setPasswordError("");
          setConfirmPasswordError("");
        }
      }
    };

    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, []);

  useEffect(() => {
    return () => {
      if (
        avatarPreviewUrlRef.current &&
        avatarPreviewUrlRef.current.startsWith("blob:")
      ) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "password") {
      if (value.length > 0 && value.length < 6) {
        setPasswordError("Password must be at least 6 characters");
      } else {
        if (value === formData.confirmPassword) {
          setConfirmPasswordError("");
        }
        setPasswordError("");
      }
    }

    if (name === "confirmPassword") {
      if (value !== formData.password && value.length > 0) {
        setConfirmPasswordError("Password and confirmation do not match");
      } else {
        setConfirmPasswordError("");
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = uploadService.validateFile(file);
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }

      setIsAvatarRemoved(false);
      setFormData((prev) => ({ ...prev, avatar: file }));

      if (
        avatarPreviewUrlRef.current &&
        avatarPreviewUrlRef.current.startsWith("blob:")
      ) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current);
      }

      const previewUrl = URL.createObjectURL(file);
      avatarPreviewUrlRef.current = previewUrl;
      setAvatarPreview(previewUrl);
      setError("");
    }
  };

  const handleRemoveAvatar = () => {
    setIsAvatarRemoved(true);
    setFormData((prev) => ({ ...prev, avatar: null }));
    setAvatarPreview(DEFAULT_AVATAR);

    if (
      avatarPreviewUrlRef.current &&
      avatarPreviewUrlRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(avatarPreviewUrlRef.current);
      avatarPreviewUrlRef.current = null;
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (passwordError || confirmPasswordError) {
      return;
    }

    // Validasi password
    if (!initialData) {
      if (!formData.password.trim()) {
        setPasswordError("Password is required");
        return;
      }
      if (!formData.confirmPassword.trim()) {
        setConfirmPasswordError("Please confirm your password");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setConfirmPasswordError("Password and confirmation do not match");
        return;
      }
    } else if (isProfileMode) {
      if (formData.password || formData.confirmPassword) {
        if (!formData.password.trim()) {
          setPasswordError("Please enter a password");
          return;
        }
        if (!formData.confirmPassword.trim()) {
          setConfirmPasswordError("Please confirm your password");
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setConfirmPasswordError("Password and confirmation do not match");
          return;
        }
      }
    }

    setLoading(true);

    try {
      // Bangun data profil saja (tanpa avatar)
      const profileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        roleId: formData.roleId,
        ...(!isProfileMode && initialData ? { status: formData.status } : {}),
      };

      // Handle password
      if ((!initialData || isProfileMode) && formData.password) {
        profileData.password = formData.password;
      }

      let result;
      if (initialData) {
        // Update profil
        result = await usersService.update(
          initialData.id,
          profileData,
          isProfileMode
        );

        // Handle avatar terpisah setelah update profil sukses
        if (isAvatarRemoved) {
          if (isProfileMode) {
            await usersService.deleteAvatarSelf();
          } else {
            await usersService.deleteAvatarById(initialData.id);
          }
        } else if (formData.avatar instanceof File) {
          if (isProfileMode) {
            await usersService.uploadAvatarSelf(formData.avatar);
          } else {
            await usersService.uploadAvatarById(
              initialData.id,
              formData.avatar
            );
          }
        }
      } else {
        // Create user
        result = await usersService.create(profileData);

        // Handle avatar setelah user dibuat
        if (formData.avatar instanceof File && result.success) {
          await usersService.uploadAvatarById(result.data.id, formData.avatar);
        }
      }

      if (result.success) {
        let alertTitle, alertMessage;
        if (isProfileMode) {
          alertTitle = "Updated!";
          alertMessage = "Your profile has been successfully updated!";
        } else if (initialData) {
          alertTitle = "Updated!";
          alertMessage = "User successfully updated!";
        } else {
          alertTitle = "Success!";
          alertMessage = "User successfully created!";
        }

        closeModal(initialData ? "userEditModal" : "userFormModal");

        setTimeout(() => {
          openModal(
            "userSuccessAlert",
            <AlertModal
              title={alertTitle}
              type="success"
              message={alertMessage}
              onClose={() => {
                closeModal("userSuccessAlert");

                if (onSuccess) {
                  // Ambil data terbaru setelah operasi avatar
                  const fetchFreshData = async () => {
                    if (initialData) {
                      const fresh = await usersService.getById(initialData.id);
                      if (fresh.success) {
                        onSuccess(fresh.data);
                        return;
                      }
                    }
                    onSuccess(result.data);
                  };

                  fetchFreshData();
                }
              }}
            />,
            "small"
          );
        }, 300);
      } else {
        throw new Error(result.message || "Failed to save user data");
      }
    } catch (err) {
      console.error("❌ Error saving user:", err);

      let errorMessage;
      if (isProfileMode) {
        errorMessage =
          err.message || "An error occurred while updating your profile.";
      } else if (initialData) {
        errorMessage = err.message || "An error occurred while updating user.";
      } else {
        errorMessage = err.message || "An error occurred while creating user.";
      }

      openModal(
        "userErrorAlert",
        <AlertModal
          title="Error"
          type="error"
          message={errorMessage}
          onClose={() => closeModal("userErrorAlert")}
        />,
        "small"
      );
    } finally {
      setLoading(false);
    }
  };

  const shouldShowRemoveButton =
    hasOriginalAvatar || formData.avatar instanceof File;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="user-form">
      <div className="form-layout">
        <div className="form-column avatar-column">
          <div className="form-group avatar-upload-group">
            <label>Profile Picture</label>
            <div className="avatar-preview-container">
              <img
                src={avatarPreview}
                alt="Preview"
                className="avatar-preview clickable-avatar"
                onClick={() => fileInputRef.current?.click()}
              />
              <div className="avatar-actions">
                <input
                  id="avatar-upload-input"
                  name="avatar"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="avatar-file-input"
                />
                <button
                  type="button"
                  className="btn-secondary-choose btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Image
                </button>
                {shouldShowRemoveButton && (
                  <button
                    type="button"
                    className="btn-secondary-remove btn-sm btn-remove visible"
                    onClick={handleRemoveAvatar}
                  >
                    Remove
                  </button>
                )}
              </div>
              {error && <div className="avatar-error-tooltip">{error}</div>}
            </div>
          </div>
        </div>

        <div className="form-column fields-column">
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <div
                ref={roleSelectRef}
                className={`custom-select role-select ${
                  isRoleOpen ? "custom-select--open" : ""
                } ${isProfileMode ? "custom-select--disabled" : ""}`}
                tabIndex={0}
              >
                <div
                  className={`custom-select__control ${
                    isProfileMode ? "custom-select__control--disabled" : ""
                  }`}
                  onClick={() => !isProfileMode && setIsRoleOpen(!isRoleOpen)}
                >
                  <span>
                    {isProfileMode
                      ? initialData.roleName
                      : formData.roleId
                      ? roleOptions.find((opt) => opt.value === formData.roleId)
                          ?.label
                      : "Select role..."}
                  </span>
                  {!isProfileMode && (
                    <ChevronDown
                      size={20}
                      className={`custom-select__arrow ${
                        isRoleOpen ? "rotated" : ""
                      }`}
                    />
                  )}
                </div>

                {!isProfileMode && isRoleOpen && (
                  <ul className="custom-select__menu">
                    {roleOptions.map((option) => (
                      <li
                        key={option.value}
                        className="custom-select__option"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            roleId: option.value,
                          }));
                          setIsRoleOpen(false);
                        }}
                      >
                        {option.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {initialData && !isProfileMode && (
              <div className="form-group">
                <label>Status</label>
                <div
                  ref={statusSelectRef}
                  className={`custom-select status-select ${
                    isStatusOpen ? "custom-select--open" : ""
                  }`}
                  tabIndex={0}
                >
                  <div
                    className="custom-select__control"
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                  >
                    <span>
                      {formData.status
                        ? statusOptions.find(
                            (opt) => opt.value === formData.status
                          )?.label
                        : "Select status..."}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`custom-select__arrow ${
                        isStatusOpen ? "rotated" : ""
                      }`}
                    />
                  </div>

                  {isStatusOpen && (
                    <ul className="custom-select__menu">
                      {statusOptions.map((option) => (
                        <li
                          key={option.value}
                          className="custom-select__option"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              status: option.value,
                            }));
                            setIsStatusOpen(false);
                          }}
                        >
                          {option.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+6281234567890"
              />
            </div>

            {(!initialData || isProfileMode) && (
              <>
                <div className="form-group password-group">
                  <label>{isProfileMode ? "New Password" : "Password"}</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!isProfileMode}
                      className={`password-input ${
                        passwordError ? "input-error" : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordError && (
                    <div className="password-error-tooltip">
                      {passwordError}
                    </div>
                  )}
                  {isProfileMode && (
                    <p className="form-hint">
                      *Leave blank to keep current password
                    </p>
                  )}
                </div>

                <div className="form-group confirm-password-group">
                  <label>
                    {isProfileMode
                      ? "Confirm New Password"
                      : "Confirm Password"}
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required={!isProfileMode}
                      className={`password-input ${
                        confirmPasswordError ? "input-error" : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <div className="confirm-password-error-tooltip">
                      {confirmPasswordError}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <span className="btn-loading">
              <PulseDots size="sm" color="#ffffff" count={6} />
            </span>
          ) : isProfileMode ? (
            "Update Profile"
          ) : initialData ? (
            "Update User"
          ) : (
            "Save User"
          )}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
