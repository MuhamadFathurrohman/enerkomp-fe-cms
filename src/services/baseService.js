export const baseService = {
  // Date formatting utilities
  formatDate: (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  },

  // src/services/baseService.js
  formatDateTime: (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  },

  timeAgo: (date) => {
    if (!date) return "N/A";
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = diffMs / (1000 * 60 * 60); // keep as float for precise 7-hour check

    // Jika kurang dari 2 menit → "Just now"
    if (diffMinutes < 2) {
      return "Just now";
    }

    // Jika kurang dari 7 jam → format relatif (Bahasa Inggris)
    if (diffHours < 7) {
      const hours = Math.floor(diffHours);
      if (diffMinutes < 60) {
        return diffMinutes === 1
          ? "1 minute ago"
          : `${diffMinutes} minutes ago`;
      }
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }

    // Jika >= 7 jam → format absolut
    return baseService.formatDateTime(date);
  },

  formatNumber: (number, options = {}) => {
    if (number === null || number === undefined) return "0";
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      ...options,
    }).format(number);
  },

  calculatePercentage: (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  // Status utilities
  getStatusColor: (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "warning";
      case "SUSPENDED":
        return "error";
      default:
        return "default";
    }
  },

  // Validation utilities
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Array utilities
  groupBy: (array, key) => {
    if (!Array.isArray(array)) return {};
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {});
  },
};
