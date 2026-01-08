// src/components/ExportDropdown/ExportDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import generalApiService from "../services/generalApiService";
import { useModalContext } from "../contexts/ModalContext";
import AlertModal from "../components/Alerts/AlertModal";
import PulseDots from "../components/Loaders/PulseDots";
import "../sass/components/ExportDropdown/ExportDropdown.css";

const ExportDropdown = ({ entity, className = "", onSuccess, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const optionsRef = useRef([]);
  const { openModal, closeModal } = useModalContext();

  const formats = [
    { key: "pdf", label: "PDF", icon: FileText },
    { key: "excel", label: "Excel", icon: FileSpreadsheet },
  ];

  // ============================================
  // CLICK OUTSIDE HANDLER
  // ============================================
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
      setFocusedIndex(0);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(0);
        buttonRef.current?.focus();
        break;

      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < formats.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        if (formats[focusedIndex] && loading === "") {
          handleExport(formats[focusedIndex].key);
        }
        break;

      case "Tab":
        setIsOpen(false);
        setFocusedIndex(0);
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    if (isOpen && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex].focus();
    }
  }, [focusedIndex, isOpen]);

  // ============================================
  // EXPORT HANDLER — DIPERBARUI HANYA DI SINI
  // ============================================
  const handleExport = async (format) => {
    setLoading(format);

    try {
      // ✅ Tambahkan mapping entitas untuk sesuaikan dengan route backend
      const entityMap = {
        brand: "brands",
        product: "products",
        users: "users",
      };
      const exportEntity = entityMap[entity] || entity;

      const result = await generalApiService.exportData(exportEntity, format);

      if (result.success) {
        setIsOpen(false);
        setFocusedIndex(0);

        openModal(
          "exportSuccess",
          <AlertModal
            type="success"
            title="Export Successful!"
            message={`Your ${format.toUpperCase()} file has been downloaded successfully.`}
            showActions={true}
            confirmText="OK"
            onConfirm={() => closeModal("exportSuccess")}
            onCancel={() => closeModal("exportSuccess")}
          />,
          "small"
        );

        if (onSuccess) {
          onSuccess(format);
        }
      } else {
        setIsOpen(false);
        setFocusedIndex(0);

        openModal(
          "exportError",
          <AlertModal
            type="error"
            title="Export Failed"
            message={
              result.error ||
              `Failed to export ${format.toUpperCase()}. Please try again.`
            }
            showActions={true}
            confirmText="OK"
            onConfirm={() => closeModal("exportError")}
            onCancel={() => closeModal("exportError")}
          />,
          "small"
        );

        if (onError) {
          onError(result.error || "Export failed");
        }
      }
    } catch (err) {
      console.error("Export error:", err);
      setIsOpen(false);
      setFocusedIndex(0);

      openModal(
        "exportError",
        <AlertModal
          type="error"
          title="Error"
          message="An unexpected error occurred during export. Please try again."
          showActions={true}
          confirmText="OK"
          onConfirm={() => closeModal("exportError")}
          onCancel={() => closeModal("exportError")}
        />,
        "small"
      );

      if (onError) {
        onError(err.message || "Unexpected error");
      }
    } finally {
      setLoading("");
    }
  };

  // ============================================
  // TOGGLE DROPDOWN
  // ============================================
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setFocusedIndex(0);
    }
  };

  return (
    <div
      className={`export-dropdown ${className}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        className="export-button"
        onClick={toggleDropdown}
        disabled={loading !== ""}
        aria-label="Export data"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Download size={16} />
        <span>Export Data</span>
      </button>

      {isOpen && (
        <div className="export-dropdown-menu" role="menu">
          {formats.map((fmt, index) => {
            const Icon = fmt.icon;
            const isLoading = loading === fmt.key;
            const isFocused = focusedIndex === index;

            return (
              <button
                key={fmt.key}
                ref={(el) => (optionsRef.current[index] = el)}
                className={`export-option ${
                  isFocused ? "keyboard-focused" : ""
                }`}
                onClick={() => handleExport(fmt.key)}
                disabled={isLoading || loading !== ""}
                role="menuitem"
                tabIndex={isFocused ? 0 : -1}
                aria-label={`Export as ${fmt.label}`}
              >
                <Icon size={16} />
                <span className="option-label">
                  {isLoading ? (
                    <>
                      Exporting
                      <PulseDots size="xs" color="#f3994b" count={3} />
                    </>
                  ) : (
                    fmt.label
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
