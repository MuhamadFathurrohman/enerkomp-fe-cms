// src/pages/Analytics.jsx

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  TrendingUp,
  Eye,
  Users,
  ArrowUp,
  ArrowDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { canExport, isSuperAdmin } from "../utils/permissions";
import { analyticsService } from "../services/analyticsService";
import { useModalContext } from "../contexts/ModalContext";
import { useDateRangeFilter } from "../hooks/useDateRangeFilter";
import { useAutoRefetch } from "../hooks/useAutoRefetch";
import { generatePageNumbers } from "../utils/pagination";
import VisitorsModal from "../components/Modals/Chart/VisitorsModal";
import PageViewsModal from "../components/Modals/Chart/PageViewsModal";
import BounceRateModal from "../components/Modals/Chart/BounceRateModal";
import AvgSessionModal from "../components/Modals/Chart/AvgSessionModal";
import "../sass/views/Analytics/Analytics.css";
import Modal from "../components/Modals/Modal";
import ExportModal from "../components/Modals/ExportModal";
import SkeletonItem from "../components/Loaders/SkeletonItem";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Helper: format Date → YYYY-MM-DD (without timezone)
const formatDateForBackend = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Analytics = () => {
  const { openModal, closeModal } = useModalContext();
  const [visitorView, setVisitorView] = useState("new");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const presetRef = useRef(null);
  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);

  // === State untuk UI label saja (tidak dipakai untuk logika trend) ===
  const [activePreset, setActivePreset] = useState("7d");
  const [isCustomRange, setIsCustomRange] = useState(false);

  const { user: currentUser } = useAuth();
  const isSuper = isSuperAdmin(currentUser);
  const canExportAnalytics =
    isSuper || canExport(currentUser?.permissions, "analytics");

  // date range hook
  const {
    startDate,
    endDate,
    tempStartDate,
    tempEndDate,
    setTempStartDate,
    setTempEndDate,
    applyFilter,
    resetToDefault,
    isAppliedAtDefault,
  } = useDateRangeFilter(6, "analyticsDateRange"); // default last 7 days

  const presetOptions = [
    { value: "today", label: "Today" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
  ];

  const [stats, setStats] = useState({
    totalPageViews: 0,
    totalNewVisitors: 0,
    totalReturningVisitors: 0,
    totalBounceRate: 0,
    avgSessionDuration: 0,
    avgSessionDurationFormatted: "0m 0s",
  });

  const [trends, setTrends] = useState({
    newVisitors: 0,
    returningVisitors: 0,
    pageViews: 0,
    bounceRate: 0,
    avgSession: 0,
  });

  const [fullData, setFullData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(fullData.length / itemsPerPage));

  const isDataUnavailable = useMemo(() => {
    return (
      stats.totalPageViews === 0 &&
      stats.totalNewVisitors === 0 &&
      stats.totalReturningVisitors === 0 &&
      stats.totalBounceRate === 0
    );
  }, [stats]);

  // === Deteksi otomatis jenis filter untuk UI label ===
  useEffect(() => {
    if (startDate && endDate) {
      const today = new Date();
      const todayStr = formatDateForBackend(today);
      const d7 = formatDateForBackend(new Date(today - 6 * 86400000));
      const d30 = formatDateForBackend(new Date(today - 29 * 86400000));

      if (startDate === todayStr && endDate === todayStr) {
        setActivePreset("today");
        setIsCustomRange(false);
      } else if (startDate === d7 && endDate === todayStr) {
        setActivePreset("7d");
        setIsCustomRange(false);
      } else if (startDate === d30 && endDate === todayStr) {
        setActivePreset("30d");
        setIsCustomRange(false);
      } else {
        setIsCustomRange(true);
        setActivePreset(null);
      }
    } else {
      setActivePreset("7d");
      setIsCustomRange(false);
    }
  }, [startDate, endDate]);

  // === Fetch data utama + hitung trend dengan 2 panggilan ===
  const fetchDataForRange = useCallback(async (start, end) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Ambil data periode sekarang (untuk UI)
      const currentResult = await analyticsService.getByDateRange(start, end);
      if (!currentResult.success) {
        throw new Error("Failed to load current period data");
      }

      setFullData(currentResult.data || []);
      setStats(currentResult.stats || {});

      // 2. Hitung periode sebelumnya
      const startObj = new Date(start);
      const endObj = new Date(end);
      const durationMs = endObj - startObj;

      const prevEndObj = new Date(startObj);
      prevEndObj.setDate(prevEndObj.getDate() - 1);
      const prevStartObj = new Date(prevEndObj.getTime() - durationMs);

      const prevStart = prevStartObj.toISOString().split("T")[0];
      const prevEnd = prevEndObj.toISOString().split("T")[0];

      // 3. Ambil data periode sebelumnya (hanya untuk trend)
      const previousResult = await analyticsService.getByDateRange(
        prevStart,
        prevEnd
      );
      const previousData = previousResult.success ? previousResult.data : [];

      // 4. Siapkan data mentah
      const currentRaw = (currentResult.data || []).map((item) => ({
        date: item.date,
        visitor: item.visitor || 0,
        uniqueVisitor: item.uniqueVisitor || 0,
        pageViews: item.pageViews || 0,
        sessions: item.sessions || 0,
        bounceRate: item.bounceRate || "0",
        avgSessionTime: item.avgSessionTime || 0,
      }));

      const previousRaw = previousData.map((item) => ({
        date: item.date,
        visitor: item.visitor || 0,
        uniqueVisitor: item.uniqueVisitor || 0,
        pageViews: item.pageViews || 0,
        sessions: item.sessions || 0,
        bounceRate: item.bounceRate || "0",
        avgSessionTime: item.avgSessionTime || 0,
      }));

      // 5. Hitung trend
      const trends = analyticsService.calculateTrendsFromTwoPeriods(
        currentRaw,
        previousRaw
      );
      setTrends(trends);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError("Failed to load analytics data. Please try again.");
      setFullData([]);
      setStats({
        totalPageViews: 0,
        totalNewVisitors: 0,
        totalReturningVisitors: 0,
        totalBounceRate: 0,
        avgSessionDuration: 0,
        avgSessionDurationFormatted: "0m 0s",
      });
      setTrends({
        newVisitors: 0,
        returningVisitors: 0,
        pageViews: 0,
        bounceRate: 0,
        avgSession: 0,
      });
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAutoRefetch = useCallback(() => {
    if (startDate && endDate) {
      fetchDataForRange(startDate, endDate);
    } else {
      const today = new Date();
      const start = formatDateForBackend(new Date(today - 6 * 86400000));
      const end = formatDateForBackend(today);
      fetchDataForRange(start, end);
    }
  }, [startDate, endDate, fetchDataForRange]);

  useAutoRefetch(handleAutoRefetch);

  useEffect(() => {
    if (startDate && endDate) {
      fetchDataForRange(startDate, endDate);
    } else {
      const today = new Date();
      const start = formatDateForBackend(new Date(today - 6 * 86400000));
      const end = formatDateForBackend(today);
      fetchDataForRange(start, end);
    }
  }, [startDate, endDate, fetchDataForRange]);

  // --- Pagination helpers ---
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return fullData.slice(startIndex, startIndex + itemsPerPage);
  }, [fullData, currentPage]);

  const pageNumbers = useMemo(() => {
    return generatePageNumbers(currentPage, totalPages);
  }, [currentPage, totalPages]);

  // --- Actions ---
  const applyPreset = (preset) => {
    const today = new Date();
    let start, end;

    switch (preset) {
      case "today":
        start = end = formatDateForBackend(today);
        break;
      case "7d":
        start = formatDateForBackend(new Date(today - 6 * 86400000));
        end = formatDateForBackend(today);
        break;
      case "30d":
        start = formatDateForBackend(new Date(today - 29 * 86400000));
        end = formatDateForBackend(today);
        break;
      default:
        return;
    }

    applyFilter(start, end);
    setActivePreset(preset);
    setIsCustomRange(false);
    setIsPresetOpen(false);
  };

  const handleApplyFilter = () => {
    const maxRangeDays = 90;
    if (!tempStartDate || !tempEndDate) return;

    const diffTime = Math.abs(new Date(tempEndDate) - new Date(tempStartDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > maxRangeDays) {
      alert("Date range cannot exceed 90 days.");
      return;
    }

    applyFilter(tempStartDate, tempEndDate);
    setActivePreset(null);
    setIsCustomRange(true);
  };

  const handleReset = () => {
    resetToDefault();
    setActivePreset("7d");
    setIsCustomRange(false);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const refresh = () => {
    if (startDate && endDate) {
      fetchDataForRange(startDate, endDate);
    } else {
      const today = new Date();
      const start = formatDateForBackend(new Date(today - 6 * 86400000));
      const end = formatDateForBackend(today);
      fetchDataForRange(start, end);
    }
  };

  // --- Modal handlers ---
  const handleCardClick = (type) => {
    const modals = {
      visitors: VisitorsModal,
      pageViews: PageViewsModal,
      bounceRate: BounceRateModal,
      avgSession: AvgSessionModal,
    };
    const titles = {
      visitors: "Visitors Insight",
      pageViews: "Page Views Insight",
      bounceRate: "Bounce Rate Insight",
      avgSession: "Average Session Insight",
    };
    const ModalComponent = modals[type];
    openModal(
      `${type}-detail`,
      <Modal
        title={titles[type]}
        showHeader={true}
        showCloseButton={true}
        onClose={() => closeModal(`${type}-detail`)}
      >
        <ModalComponent
          startDate={startDate}
          endDate={endDate}
          onClose={() => closeModal(`${type}-detail`)}
        />
      </Modal>
    );
  };

  const handleClose = () => closeModal("exportAnalytics");
  const handleExportClick = () => {
    openModal(
      "exportAnalytics",
      <Modal
        title="Export Analytics Data"
        showHeader={true}
        showCloseButton={true}
        size="small"
        onClose={handleClose}
      >
        <ExportModal
          mode="analytics"
          onSuccess={handleClose}
          onClose={handleClose}
        />
      </Modal>
    );
  };

  // --- Click outside preset dropdown ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (presetRef.current && !presetRef.current.contains(e.target)) {
        setIsPresetOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Visitor stats selector ---
  const visitorStats = useMemo(() => {
    return {
      count:
        visitorView === "new"
          ? stats.totalNewVisitors
          : stats.totalReturningVisitors,
      trend:
        visitorView === "new" ? trends.newVisitors : trends.returningVisitors,
    };
  }, [visitorView, stats, trends]);

  // --- Process table rows ---
  const processedAnalytics = useMemo(() => {
    return currentData.map((item, index) => {
      const totalVisitor = (item.visitor || 0) + (item.uniqueVisitor || 0);
      return {
        ...item,
        totalVisitor,
        id: item.id || item.date || index,
        dateFormatted: item.dateFormatted || item.date || "-",
        pageViewsFormatted:
          typeof item.pageViews !== "undefined"
            ? String(item.pageViews).toLocaleString()
            : "0",
        bounceRateFormatted: item.bounceRatePercentage
          ? `${item.bounceRatePercentage}%`
          : item.bounceRate
          ? `${Math.round(parseFloat(item.bounceRate) || 0)}%`
          : "0%",
        sessionDurationFormatted:
          item.sessionDurationFormatted ||
          (item.avgSessionTime
            ? `${Math.floor(item.avgSessionTime / 60)}m ${
                item.avgSessionTime % 60
              }s`
            : "0s"),
      };
    });
  }, [currentData]);

  return (
    <div className="page-analytics">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <BarChart3 size={28} /> Website Analytics
          </h1>
          <p>
            Monitor traffic, engagement, and user behavior across your website
          </p>
        </div>

        <div className="header-actions">
          <div className="custom-preset-dropdown" ref={presetRef}>
            <button
              type="button"
              className="preset-toggle"
              onClick={() => setIsPresetOpen((s) => !s)}
              aria-haspopup="true"
              aria-expanded={isPresetOpen}
            >
              {(() => {
                if (!startDate || !endDate) return "Custom";
                const today = new Date();
                const todayStr = formatDateForBackend(today);
                const d7 = formatDateForBackend(new Date(today - 6 * 86400000));
                const d30 = formatDateForBackend(
                  new Date(today - 29 * 86400000)
                );
                if (startDate === todayStr && endDate === todayStr)
                  return "Today";
                if (startDate === d7 && endDate === todayStr)
                  return "Last 7 Days";
                if (startDate === d30 && endDate === todayStr)
                  return "Last 30 Days";
                return "Custom";
              })()}
              <ChevronDownIcon
                size={14}
                style={{
                  marginLeft: "6px",
                  transform: isPresetOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>
            {isPresetOpen && (
              <div className="preset-menu">
                {presetOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="preset-option"
                    onClick={() => applyPreset(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {canExportAnalytics && (
            <button className="btn-export" onClick={handleExportClick}>
              <Download size={16} /> Export Data
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="stats-grid">
        {/* Card 1: Total Visitors */}
        <div className="stat-card" onClick={() => handleCardClick("visitors")}>
          {loading ? (
            // ... skeleton same as before ...
            <>
              <div className="card-header">
                <SkeletonItem
                  className="skeleton-line skeleton-line--header"
                  style={{ width: "40%" }}
                />
                <div className="card-toggle">
                  <SkeletonItem
                    className="skeleton-line skeleton-line--toggle"
                    style={{ marginBottom: "10px" }}
                  />
                  <SkeletonItem
                    className="skeleton-line skeleton-line--toggle"
                    style={{ marginBottom: "10px" }}
                  />
                </div>
              </div>
              <SkeletonItem
                className="skeleton-line skeleton-line--value"
                style={{ width: "40%", marginBottom: "8px" }}
              />
              <SkeletonItem
                className="skeleton-line skeleton-line--trend"
                style={{ width: "50%" }}
              />
              <div className="card-icon icon-users">
                <SkeletonItem
                  className="skeleton-circle"
                  style={{ width: "35px", height: "35px" }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="card-header">
                <span className="card-title">Total Visitors</span>
                <div className="card-toggle">
                  <button
                    className={visitorView === "new" ? "active" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      setVisitorView("new");
                    }}
                  >
                    New
                  </button>
                  <button
                    className={visitorView === "returning" ? "active" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      setVisitorView("returning");
                    }}
                  >
                    Returning
                  </button>
                </div>
              </div>
              <div className="card-value-wrapper">
                <span className="card-value-number">
                  {String(visitorStats.count || 0).toLocaleString()}
                </span>
                {isDataUnavailable && <span className="card-info-icon">ⓘ</span>}
              </div>
              <div
                className={`card-trend ${
                  visitorStats.trend > 0
                    ? "trend-up"
                    : visitorStats.trend < 0
                    ? "trend-down"
                    : "trend-neutral"
                }`}
                style={{
                  color:
                    visitorStats.trend > 0
                      ? "#10b981"
                      : visitorStats.trend < 0
                      ? "#ef4444"
                      : "#6b7280",
                }}
              >
                {visitorStats.trend > 0 ? (
                  <ArrowUp size={16} />
                ) : visitorStats.trend < 0 ? (
                  <ArrowDown size={16} />
                ) : (
                  <TrendingUp size={16} />
                )}{" "}
                {Math.abs(visitorStats.trend).toFixed(1)}%
              </div>
              {isDataUnavailable && (
                <div className="card-data-unavailable">
                  Data not available for the selected period.
                </div>
              )}
              <div className="card-icon icon-users">
                <Users size={60} />
              </div>
            </>
          )}
        </div>

        {/* Card 2: Total Page Views */}
        <div className="stat-card" onClick={() => handleCardClick("pageViews")}>
          {loading ? (
            // ... skeleton same as before ...
            <>
              <div className="card-header">
                <SkeletonItem
                  className="skeleton-line skeleton-line--header"
                  style={{ width: "70%" }}
                />
              </div>
              <SkeletonItem
                className="skeleton-line skeleton-line--value"
                style={{ width: "40%", marginBottom: "8px" }}
              />
              <SkeletonItem
                className="skeleton-line skeleton-line--trend"
                style={{ width: "50%" }}
              />
              <div className="card-icon icon-eye">
                <SkeletonItem
                  className="skeleton-circle"
                  style={{ width: "35px", height: "35px" }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="card-header">
                <span className="card-title">Total Page Views</span>
              </div>
              <div className="card-value-wrapper">
                <span className="card-value-number">
                  {String(stats.totalPageViews || 0).toLocaleString()}
                </span>
                {isDataUnavailable && <span className="card-info-icon">ⓘ</span>}
              </div>
              <div
                className={`card-trend ${
                  trends.pageViews > 0
                    ? "trend-up"
                    : trends.pageViews < 0
                    ? "trend-down"
                    : "trend-neutral"
                }`}
                style={{
                  color:
                    trends.pageViews > 0
                      ? "#10b981"
                      : trends.pageViews < 0
                      ? "#ef4444"
                      : "#6b7280",
                }}
              >
                {trends.pageViews > 0 ? (
                  <ArrowUp size={16} />
                ) : trends.pageViews < 0 ? (
                  <ArrowDown size={16} />
                ) : (
                  <TrendingUp size={16} />
                )}{" "}
                {Math.abs(trends.pageViews).toFixed(1)}%
              </div>
              {isDataUnavailable && (
                <div className="card-data-unavailable">
                  Data not available for the selected period.
                </div>
              )}
              <div className="card-icon icon-eye">
                <Eye size={60} />
              </div>
            </>
          )}
        </div>

        {/* Card 3: Avg. Bounce Rate */}
        <div
          className="stat-card"
          onClick={() => handleCardClick("bounceRate")}
        >
          {loading ? (
            // ... skeleton same as before ...
            <>
              <div className="card-header">
                <SkeletonItem
                  className="skeleton-line skeleton-line--header"
                  style={{ width: "50%" }}
                />
              </div>
              <SkeletonItem
                className="skeleton-line skeleton-line--value"
                style={{ width: "40%", marginBottom: "8px" }}
              />
              <SkeletonItem
                className="skeleton-line skeleton-line--trend"
                style={{ width: "50%" }}
              />
              <div className="card-icon icon-trend">
                <SkeletonItem
                  className="skeleton-circle"
                  style={{ width: "35px", height: "35px" }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="card-header">
                <span className="card-title">Avg. Bounce Rate</span>
              </div>
              <div className="card-value-wrapper">
                <span className="card-value-number">
                  {String(stats.totalBounceRate || 0)}%
                </span>
                {isDataUnavailable && <span className="card-info-icon">ⓘ</span>}
              </div>
              <div
                className={`card-trend ${
                  trends.bounceRate > 0
                    ? "trend-up"
                    : trends.bounceRate < 0
                    ? "trend-down"
                    : "trend-neutral"
                }`}
                style={{
                  color:
                    trends.bounceRate > 0
                      ? "#10b981"
                      : trends.bounceRate < 0
                      ? "#ef4444"
                      : "#6b7280",
                }}
              >
                {trends.bounceRate > 0 ? (
                  <ArrowUp size={16} />
                ) : trends.bounceRate < 0 ? (
                  <ArrowDown size={16} />
                ) : (
                  <TrendingUp size={16} />
                )}{" "}
                {Math.abs(trends.bounceRate).toFixed(1)}%
              </div>
              {isDataUnavailable && (
                <div className="card-data-unavailable">
                  Data not available for the selected period.
                </div>
              )}
              <div className="card-icon icon-trend">
                <TrendingUp size={60} color="#f59e0b" />
              </div>
            </>
          )}
        </div>

        {/* Card 4: Avg. Session Duration */}
        <div
          className="stat-card"
          onClick={() => handleCardClick("avgSession")}
        >
          {loading ? (
            // ... skeleton same as before ...
            <>
              <div className="card-header">
                <SkeletonItem
                  className="skeleton-line skeleton-line--header"
                  style={{ width: "60%" }}
                />
              </div>
              <SkeletonItem
                className="skeleton-line skeleton-line--value"
                style={{ width: "40%", marginBottom: "8px" }}
              />
              <SkeletonItem
                className="skeleton-line skeleton-line--trend"
                style={{ width: "50%" }}
              />
              <div className="card-icon icon-clock">
                <SkeletonItem
                  className="skeleton-circle"
                  style={{ width: "35px", height: "35px" }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="card-header">
                <span className="card-title">Avg. Session Duration</span>
              </div>
              <div className="card-value-wrapper">
                <span className="card-value-number">
                  {stats.avgSessionDurationFormatted || "0m 0s"}
                </span>
                {isDataUnavailable && <span className="card-info-icon">ⓘ</span>}
              </div>
              <div
                className={`card-trend ${
                  trends.avgSession > 0
                    ? "trend-up"
                    : trends.avgSession < 0
                    ? "trend-down"
                    : "trend-neutral"
                }`}
                style={{
                  color:
                    trends.avgSession > 0
                      ? "#10b981"
                      : trends.avgSession < 0
                      ? "#ef4444"
                      : "#6b7280",
                }}
              >
                {trends.avgSession > 0 ? (
                  <ArrowUp size={16} />
                ) : trends.avgSession < 0 ? (
                  <ArrowDown size={16} />
                ) : (
                  <TrendingUp size={16} />
                )}{" "}
                {Math.abs(trends.avgSession).toFixed(1)}%
              </div>
              {isDataUnavailable && (
                <div className="card-data-unavailable">
                  Data not available for the selected period.
                </div>
              )}
              <div className="card-icon icon-clock">
                <Clock size={60} color="#8b5cf6" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Container */}
      <div className="filter-container">
        <div className="date-filters">
          <div className="date-group">
            <label>Start Date</label>
            <div className="date-input-wrapper">
              <DatePicker
                ref={startDatePickerRef}
                selected={tempStartDate ? new Date(tempStartDate) : null}
                onChange={(date) =>
                  setTempStartDate(date ? formatDateForBackend(date) : "")
                }
                maxDate={new Date()}
                dateFormat="dd/MM/yyyy"
                className="date-input"
                placeholderText="DD/MM/YYYY"
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
              />
              <button
                type="button"
                className="date-input-icon"
                onClick={() => startDatePickerRef.current.setOpen(true)}
              >
                <Calendar size={18} />
              </button>
            </div>
          </div>

          <div className="date-group">
            <label>End Date</label>
            <div className="date-input-wrapper">
              <DatePicker
                ref={endDatePickerRef}
                selected={tempEndDate ? new Date(tempEndDate) : null}
                onChange={(date) =>
                  setTempEndDate(date ? formatDateForBackend(date) : "")
                }
                minDate={tempStartDate ? new Date(tempStartDate) : null}
                maxDate={new Date()}
                dateFormat="dd/MM/yyyy"
                className="date-input"
                placeholderText="DD/MM/YYYY"
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
              />
              <button
                type="button"
                className="date-input-icon"
                onClick={() => endDatePickerRef.current.setOpen(true)}
              >
                <Calendar size={18} />
              </button>
            </div>
          </div>

          <div className="button-filter">
            {isAppliedAtDefault() ? (
              <button
                type="button"
                className="btn-filter"
                onClick={handleApplyFilter}
                disabled={
                  !tempStartDate ||
                  !tempEndDate ||
                  (tempStartDate === startDate && tempEndDate === endDate)
                }
              >
                Apply Filter
              </button>
            ) : (
              <button
                type="button"
                className="btn-filter btn-reset"
                onClick={handleReset}
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={refresh} className="retry-btn">
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Date</th>
              <th>Total Visitor</th>
              <th>Page Views</th>
              <th>Bounce Rate</th>
              <th>Avg. Session</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="loading-cell">
                  <div className="loading-spinner"></div>
                  <p>Loading analytics data...</p>
                </td>
              </tr>
            ) : processedAnalytics.length > 0 ? (
              processedAnalytics.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1 + (currentPage - 1) * itemsPerPage}</td>
                  <td>{item.dateFormatted}</td>
                  <td>{String(item.totalVisitor || 0).toLocaleString()}</td>
                  <td>{item.pageViewsFormatted}</td>
                  <td>{item.bounceRateFormatted}</td>
                  <td>{item.sessionDurationFormatted}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  No analytics data found for the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`pagination-btn pagination-arrow ${
              currentPage === 1 ? "disabled" : ""
            }`}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <div className="pagination-pages">
            {pageNumbers.map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`pagination-page ${
                    currentPage === page ? "active" : ""
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`pagination-btn pagination-arrow ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Analytics;
