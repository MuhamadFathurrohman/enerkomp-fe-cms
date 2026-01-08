// src/hooks/useDateRangeFilter.js
import { useState, useEffect } from "react";

// ✅ Helper: format Date → YYYY-MM-DD (tanpa zona waktu)
const formatDateForBackend = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Hook untuk mengelola rentang tanggal dengan URL + sessionStorage
 */
export const useDateRangeFilter = (
  defaultDaysBack = 6,
  storageKey = "dateRangeFilter"
) => {
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fungsi internal: dapatkan rentang default menggunakan tanggal lokal
  const getDefaultDateRange = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - defaultDaysBack);
    return {
      startDate: formatDateForBackend(start),
      endDate: formatDateForBackend(today),
    };
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let startFromUrl = urlParams.get("startDate");
    let endFromUrl = urlParams.get("endDate");

    let start, end;

    // 1. Coba dari URL (harus format YYYY-MM-DD valid)
    if (startFromUrl && endFromUrl) {
      const startD = new Date(startFromUrl);
      const endD = new Date(endFromUrl);
      if (
        !isNaN(startD.getTime()) &&
        !isNaN(endD.getTime()) &&
        startD <= endD &&
        /^\d{4}-\d{2}-\d{2}$/.test(startFromUrl) &&
        /^\d{4}-\d{2}-\d{2}$/.test(endFromUrl)
      ) {
        start = startFromUrl;
        end = endFromUrl;
      }
    }

    // 2. Coba dari sessionStorage
    if (!start || !end) {
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            parsed.startDate &&
            parsed.endDate &&
            /^\d{4}-\d{2}-\d{2}$/.test(parsed.startDate) &&
            /^\d{4}-\d{2}-\d{2}$/.test(parsed.endDate)
          ) {
            const startD = new Date(parsed.startDate);
            const endD = new Date(parsed.endDate);
            if (
              !isNaN(startD.getTime()) &&
              !isNaN(endD.getTime()) &&
              startD <= endD
            ) {
              start = parsed.startDate;
              end = parsed.endDate;
            }
          }
        }
      } catch (e) {
        console.warn("Failed to parse sessionStorage date range", e);
      }
    }

    // 3. Fallback ke default
    if (!start || !end) {
      const defaultRange = getDefaultDateRange();
      start = defaultRange.startDate;
      end = defaultRange.endDate;
    }

    setStartDate(start);
    setEndDate(end);
    setTempStartDate(start);
    setTempEndDate(end);
  }, [defaultDaysBack, storageKey]);

  /**
   * applyFilter
   * - Jika dipanggil tanpa argumen -> gunakan tempStartDate/tempEndDate (UI custom date)
   * - Jika dipanggil dengan (start, end) -> langsung apply kedua tanggal itu (berguna untuk preset)
   */
  const applyFilter = (startArg, endArg) => {
    let s = startArg || tempStartDate;
    let e = endArg || tempEndDate;

    if (!s || !e) return;

    const startD = new Date(s);
    const endD = new Date(e);
    if (isNaN(startD.getTime()) || isNaN(endD.getTime()) || startD > endD)
      return;

    // Set both temp and actual so caller tidak perlu menunggu state update
    setTempStartDate(s);
    setTempEndDate(e);
    setStartDate(s);
    setEndDate(e);

    // Persist ke sessionStorage
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        startDate: s,
        endDate: e,
      })
    );

    // Update URL (replace state, bukan push)
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("startDate", s);
    newUrl.searchParams.set("endDate", e);
    window.history.replaceState(null, "", newUrl);
  };

  const resetToDefault = () => {
    const defaultRange = getDefaultDateRange();
    setStartDate(defaultRange.startDate);
    setEndDate(defaultRange.endDate);
    setTempStartDate(defaultRange.startDate);
    setTempEndDate(defaultRange.endDate);

    sessionStorage.removeItem(storageKey);

    const newUrl = new URL(window.location);
    newUrl.searchParams.delete("startDate");
    newUrl.searchParams.delete("endDate");
    window.history.replaceState(null, "", newUrl);
  };

  const isAppliedAtDefault = () => {
    const defaultRange = getDefaultDateRange();
    return (
      startDate === defaultRange.startDate && endDate === defaultRange.endDate
    );
  };

  const isTempAtDefault = () => {
    const defaultRange = getDefaultDateRange();
    return (
      tempStartDate === defaultRange.startDate &&
      tempEndDate === defaultRange.endDate
    );
  };

  return {
    startDate,
    endDate,
    tempStartDate,
    tempEndDate,
    setTempStartDate,
    setTempEndDate,
    applyFilter, // now supports applyFilter(start, end)
    resetToDefault,
    isTempAtDefault,
    isAppliedAtDefault,
  };
};
