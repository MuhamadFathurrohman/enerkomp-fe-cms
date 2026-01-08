// src/components/modals/ExportModal.jsx
import React, { useState } from "react";
import { analyticsService } from "../../services/analyticsService";
import { clientService } from "../../services/clientService";
import PulseDots from "../Loaders/PulseDots";
import "../../sass/components/Modals/ExportModal/ExportModal.scss";
import AlertModal from "../Alerts/AlertModal";
import { useModalContext } from "../../contexts/ModalContext";

const ExportModal = ({ mode = "analytics", onSuccess, onClose }) => {
  const { openModal, closeModal } = useModalContext();
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [format, setFormat] = useState("excel");
  const [isExporting, setIsExporting] = useState(false);

  const [monthError, setMonthError] = useState("");
  const [yearError, setYearError] = useState("");

  const validateMonth = (value) => {
    if (value === "" || value === null) return "Month is required";
    if (isNaN(value)) return "Month must be a number";
    const num = Number(value);
    if (num < 1 || num > 12) return "Month must be between 1-12";
    return "";
  };

  const validateYear = (value) => {
    if (value === "" || value === null) return "Year is required";
    if (isNaN(value)) return "Year must be a number";
    const num = Number(value);
    if (num < 1900 || num > currentYear + 10) return "Invalid year";
    return "";
  };

  // Helper: show error alert
  const showErrorAlert = (message) => {
    // Close export modal first
    if (onClose) onClose();
    // Show alert after modal closed
    setTimeout(() => {
      openModal(
        "exportErrorAlert",
        <AlertModal
          type="error"
          message={message}
          onClose={() => closeModal("exportErrorAlert")}
        />,
        "small"
      );
    }, 300);
  };

  // Helper: show success alert
  const showSuccessAlert = () => {
    if (onSuccess) onSuccess();
    setTimeout(() => {
      openModal(
        "exportSuccessAlert",
        <AlertModal
          type="success"
          message="Data exported successfully!"
          onClose={() => closeModal("exportSuccessAlert")}
        />,
        "small"
      );
    }, 300);
  };

  const handleExport = async () => {
    const mErr = validateMonth(month);
    const yErr = validateYear(year);
    setMonthError(mErr);
    setYearError(yErr);
    if (mErr || yErr) return;

    const numMonth = Number(month);
    const numYear = Number(year);

    setIsExporting(true);
    try {
      let result;
      if (mode === "clients") {
        result = await clientService.exportData(numMonth, numYear, format);
      } else {
        result = await analyticsService.exportData(numMonth, numYear, format);
      }

      if (result?.success) {
        showSuccessAlert();
      } else {
        showErrorAlert(result.error || "Failed to export data.");
      }
    } catch (error) {
      console.error("Unexpected export error:", error);
      showErrorAlert("An unexpected error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-modal-content">
      <div className="form-group">
        <label className="form-label">Month</label>
        <div className="input-wrapper">
          <input
            type="number"
            className={`form-input ${monthError ? "error" : ""}`}
            placeholder="Example: 5"
            value={month}
            onChange={(e) => {
              const val = e.target.value === "" ? "" : Number(e.target.value);
              setMonth(val);
              setMonthError(validateMonth(val));
            }}
          />
          {monthError && <div className="error-tooltip">{monthError}</div>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Year</label>
        <div className="input-wrapper">
          <input
            type="number"
            className={`form-input ${yearError ? "error" : ""}`}
            placeholder="Example: 2023"
            value={year}
            onChange={(e) => {
              const val = e.target.value === "" ? "" : Number(e.target.value);
              setYear(val);
              setYearError(validateYear(val));
            }}
          />
          {yearError && <div className="error-tooltip">{yearError}</div>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Format</label>
        <div className="format-options">
          {[
            { value: "excel", label: "Excel (.xlsx)" },
            { value: "pdf", label: "PDF" },
          ].map((opt) => (
            <label key={opt.value} className="format-option">
              <input
                type="radio"
                name="format"
                value={opt.value}
                checked={format === opt.value}
                onChange={(e) => setFormat(e.target.value)}
                className="export-radio-input"
              />
              <span className="export-radio-label">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="export-modal-footer">
        <button
          className="btn-secondary"
          onClick={onClose}
          disabled={isExporting}
        >
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <span className="btn-loading">
              <PulseDots size="sm" color="#ffffff" count={3} />
            </span>
          ) : (
            "Export"
          )}
        </button>
      </div>
    </div>
  );
};

export default ExportModal;
