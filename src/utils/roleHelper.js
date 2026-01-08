// /**
//  * Format tampilan nama role
//  * Contoh: "super_admin" → "Super Admin"
//  * @param {string} roleName - Nama role dari database
//  * @returns {string} - Nama role yang diformat
//  */
export const formatRoleName = (roleName) => {
  if (!roleName || roleName === "unknown") return "Unknown";
  return roleName
    .replace(/_/g, " ") // Ganti underscore dengan spasi
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize setiap kata
};

// /**
//  * Tentukan class CSS untuk badge role
//  * - "super_admin" → "super-admin"
//  * - "admin" → "admin"
//  * - Semua role lain → "user" (warna default)
//  * @param {string} roleName - Nama role dari database
//  * @returns {string} - Class CSS untuk badge
//  */
export const getRoleBadgeClass = (roleName) => {
  const normalized = (roleName || "").toLowerCase();
  if (normalized === "super admin") return "super-admin";
  if (normalized === "admin") return "admin";
  return "user";
};
