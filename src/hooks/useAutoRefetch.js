// src/hooks/useAutoRefetch.js
import { useEffect, useCallback } from "react";
import { onSessionRefreshed } from "../services/api";

/**
 * Hook untuk auto-refetch data setelah session di-extend
 *
 * @param {Function} refetchFn - Function untuk refetch data (e.g., fetchData, refetch dari react-query)
 * @param {Array} deps - Dependencies (optional, default [])
 *
 * @example
 * // Dengan custom fetch function
 * useAutoRefetch(fetchUserData);
 *
 * @example
 * // Dengan React Query
 * const { data, refetch } = useQuery(['users'], fetchUsers);
 * useAutoRefetch(refetch);
 */
export const useAutoRefetch = (refetchFn, deps = []) => {
  const handleRefetch = useCallback(() => {
    if (typeof refetchFn === "function") {
      try {
        refetchFn();
      } catch (error) {
        console.error("❌ Error refetching data:", error);
      }
    }
  }, [refetchFn, ...deps]);

  useEffect(() => {
    const unsubscribe = onSessionRefreshed(handleRefetch);
    return () => unsubscribe();
  }, [handleRefetch]);
};
