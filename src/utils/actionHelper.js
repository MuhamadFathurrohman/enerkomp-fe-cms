// src/utils/actionHelper.js

/**
 * Format nama action dari snake_case ke Title Case
 * Contoh: "CREATE_PRODUCT" → "Create Product"
 * @param {string} action - Nama action dari database
 * @returns {string} - Nama action yang diformat
 */
export const formatActionName = (action) => {
  if (!action) return "—";
  return action
    .replace(/_/g, " ") // Ganti underscore dengan spasi
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize setiap kata
};

/**
 * Tentukan class CSS untuk badge action
 * Berdasarkan kategori: create, update, delete, auth, etc.
 * @param {string} action - Nama action dari database
 * @returns {string} - Class CSS untuk badge
 */
export const getActionBadgeClass = (action) => {
  if (!action) return "unknown";

  const normalized = action.toLowerCase();

  // Auth-related actions
  if (
    normalized.includes("login") ||
    normalized.includes("logout") ||
    normalized.includes("forgot_password") ||
    normalized.includes("reset_password")
  ) {
    return "auth";
  }

  // Create actions
  if (normalized.startsWith("create")) {
    return "create";
  }

  // Update actions
  if (normalized.startsWith("update")) {
    return "update";
  }

  // Delete actions
  if (normalized.startsWith("delete")) {
    return "delete";
  }

  // Restore actions
  if (normalized.startsWith("restore")) {
    return "restore";
  }

  // Default
  return "other";
};
