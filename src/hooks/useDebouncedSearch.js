// src/hooks/useDebouncedSearch.js
import { useState, useEffect, useRef } from "react";

export const useDebouncedSearch = (
  fetchData,
  initialPage = 1,
  initialLimit = 8,
  debounceDelay = 800,
  dependencies = []
) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(initialLimit);

  const [stats, setStats] = useState({});
  const [trends, setTrends] = useState({});

  const searchTimeout = useRef(null);

  // ✅ UPDATE: Tambahkan parameter bypassCache
  const loadData = async (bypassCache = false) => {
    setLoading(true);
    try {
      // ✅ Pass bypassCache sebagai parameter ke-4
      const result = await fetchData(
        currentPage,
        limit,
        debouncedSearchTerm,
        bypassCache
      );

      if (result.success) {
        if (!Array.isArray(result.data)) {
          setData([]);
        } else {
          setData(result.data);
        }
        setTotalPages(result.pagination?.totalPages || 1);
        setError(null);

        setStats(result.stats || {});
        setTrends(result.trends || {});
      } else {
        if (result.message && result.message !== "No data found") {
          setError(result.message);
        } else {
          setError(null);
        }
        setData([]);
        setTotalPages(1);
        setStats({});
        setTrends({});
      }
    } catch (err) {
      setError("An error occurred while loading data");
      setData([]);
      setTotalPages(1);
      setStats({});
      setTrends({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [currentPage, debouncedSearchTerm, ...dependencies]);

  const handleSearch = (value) => {
    setSearchTerm(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
      setCurrentPage(1);
    }, debounceDelay);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ✅ UPDATE: refresh dengan optional bypassCache
  const refresh = (bypassCache = false) => {
    loadData(bypassCache);
  };

  return {
    searchTerm,
    setSearchTerm: handleSearch,
    data,
    loading,
    error,
    currentPage,
    totalPages,
    limit,
    goToPage,
    refresh,
    stats,
    trends,
  };
};
