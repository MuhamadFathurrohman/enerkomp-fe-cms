// services/auditLogService.js
import { dataService } from "./dataService";
import { baseService } from "./baseService";

export const auditLogService = {
  getPaginated: async (page = 1, limit = 10, search = "") => {
    try {
      const params = { page, limit };
      if (search) params.search = search;

      const result = await dataService.auditLogs.getAll(params);
      if (!result.success) return result;

      // Hanya proses dasar (tanpa resolve referensi)
      const processedLogs = result.data.map((log) =>
        auditLogService.processSingle(log)
      );

      return {
        success: true,
        data: processedLogs,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in auditLogService.getPaginated:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the audit logs. Please try again",
      };
    }
  },

  processSingle: (log) => {
    const oldValues =
      typeof log.oldValues === "string"
        ? JSON.parse(log.oldValues)
        : log.oldValues || {};

    const newValues =
      typeof log.newValues === "string"
        ? JSON.parse(log.newValues)
        : log.newValues || {};

    // Tidak perlu resolve referensi di sini
    // Karena sudah di-handle oleh getWithReferences

    const filteredOldValues = auditLogService.filterValues(oldValues);
    const filteredNewValues = auditLogService.filterValues(newValues);

    // Hapus prefix "is" dari key
    const cleanedOldValues = auditLogService.removeIsPrefix(filteredOldValues);
    const cleanedNewValues = auditLogService.removeIsPrefix(filteredNewValues);

    return {
      ...log,
      createdAtFormatted: baseService.formatDateTime(log.createdAt),
      userName: (() => {
        // Deteksi: CREATE client dari website company profile
        if (
          log.tableName === "Client" &&
          (log.action === "CREATE_CLIENT" || log.action === "CREATE") &&
          (!log.userId || log.userId === null)
        ) {
          return "Website (Company Profile)";
        }

        // Fallback normal
        return log.userName || log.user?.name || "System";
      })(),
      description: auditLogService.generateDescription(
        log.action,
        log.tableName,
        cleanedOldValues,
        cleanedNewValues
      ),
      oldValues: auditLogService.formatValues(cleanedOldValues),
      newValues: auditLogService.formatValues(cleanedNewValues),
      changes: auditLogService.getChangeSummary(
        cleanedOldValues,
        cleanedNewValues
      ),
    };
  },

  // BARU: Hapus prefix "is" dari key
  removeIsPrefix: (values) => {
    if (!values || typeof values !== "object") return values;

    const cleaned = {};
    for (const [key, value] of Object.entries(values)) {
      if (
        key.startsWith("is") &&
        key.length > 2 &&
        key[2] === key[2].toUpperCase()
      ) {
        const newKey = key[2].toLowerCase() + key.slice(3);
        cleaned[newKey] = value;
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  },

  // Filter out fields yang tidak ingin ditampilkan
  filterValues: (values) => {
    if (!values || typeof values !== "object") return {};

    const fieldsToSkip = [
      "slug",
      "sku",
      "password",
      "token",
      "secret",
      "translations",
      "permissions",
      "id",
    ];
    const filtered = {};

    for (const [key, value] of Object.entries(values)) {
      if (!fieldsToSkip.includes(key.toLowerCase())) {
        filtered[key] = value;
      }
    }

    return filtered;
  },

  generateDescription: (action, tableName, oldValues, newValues) => {
    if (!action) return "Unknown action";

    const { baseAction, targetTable } = auditLogService.parseAction(
      action,
      tableName
    );

    const tableNameClean = auditLogService.humanizeTableName(
      targetTable || tableName
    );

    const recordName = auditLogService.getRecordIdentifier(
      baseAction === "DELETE" || baseAction === "REMOVE" ? oldValues : newValues
    );

    switch (baseAction) {
      case "CREATE":
      case "INSERT":
      case "ADD":
        return `Created new ${tableNameClean}${
          recordName ? ` "${recordName}"` : ""
        }`;

      case "UPDATE":
      case "EDIT":
      case "MODIFY":
      case "CHANGE":
        const changedFields = Object.keys(newValues).filter(
          (key) =>
            JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
        );

        if (changedFields.length === 0) {
          return `Updated ${tableNameClean} record`;
        }

        if (changedFields.length === 1) {
          const fieldName = auditLogService.humanizeFieldName(changedFields[0]);
          return `Changed ${fieldName} in ${tableNameClean}`;
        }

        return `Updated ${changedFields.length} fields in ${tableNameClean}`;

      case "DELETE":
      case "REMOVE":
      case "DESTROY":
        return `Deleted ${tableNameClean}${
          recordName ? ` "${recordName}"` : " record"
        }`;

      case "LOGIN":
      case "SIGNIN":
        return `User logged in to the system`;

      case "LOGOUT":
      case "SIGNOUT":
        return `User logged out from the system`;

      case "RESTORE":
        return `Restored ${tableNameClean}${
          recordName ? ` "${recordName}"` : " record"
        }`;

      case "ARCHIVE":
        return `Archived ${tableNameClean}${
          recordName ? ` "${recordName}"` : " record"
        }`;

      case "APPROVE":
        return `Approved ${tableNameClean}${
          recordName ? ` "${recordName}"` : " record"
        }`;

      case "REJECT":
        return `Rejected ${tableNameClean}${
          recordName ? ` "${recordName}"` : " record"
        }`;

      case "ACTIVATE":
      case "ENABLE":
        return `Activated ${tableNameClean}${
          recordName ? ` "${recordName}"` : " record"
        }`;

      case "DEACTIVATE":
      case "DISABLE":
        return `Deactivated ${tableNameClean}${
          recordName ? ` "${recordName}"` : " record"
        }`;

      case "EXPORT":
        return `Exported ${tableNameClean} data`;

      case "IMPORT":
        return `Imported ${tableNameClean} data`;

      case "DOWNLOAD":
        return `Downloaded ${tableNameClean}${
          recordName ? ` "${recordName}"` : " file"
        }`;

      case "UPLOAD":
        return `Uploaded ${tableNameClean}${
          recordName ? ` "${recordName}"` : " file"
        }`;

      case "SEND":
        return `Sent ${tableNameClean}${recordName ? ` "${recordName}"` : ""}`;

      case "RECEIVE":
        return `Received ${tableNameClean}${
          recordName ? ` "${recordName}"` : ""
        }`;

      default:
        const actionHumanized = auditLogService.humanizeAction(baseAction);
        return `${actionHumanized} ${tableNameClean}${
          recordName ? ` "${recordName}"` : ""
        }`;
    }
  },

  parseAction: (action, fallbackTable) => {
    if (!action) return { baseAction: "UNKNOWN", targetTable: null };

    const actionUpper = action.toUpperCase();

    if (actionUpper.includes("_")) {
      const parts = actionUpper.split("_");

      if (parts.length === 2) {
        return {
          baseAction: parts[0],
          targetTable: parts[1],
        };
      }

      return {
        baseAction: parts.slice(0, -1).join("_"),
        targetTable: parts[parts.length - 1],
      };
    }

    return {
      baseAction: actionUpper,
      targetTable: fallbackTable,
    };
  },

  getRecordIdentifier: (values) => {
    if (!values || typeof values !== "object") return null;

    const identifierFields = [
      "name",
      "title",
      "username",
      "email",
      "code",
      "id",
    ];

    for (const field of identifierFields) {
      if (values[field] && typeof values[field] === "string") {
        const value = values[field];
        return value.length > 30 ? value.substring(0, 30) + "..." : value;
      }
    }

    return null;
  },

  humanizeAction: (action) => {
    if (!action) return "Action";

    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  },

  formatValues: (values) => {
    if (!values || typeof values !== "object") return {};

    const formatted = {};

    for (const [key, value] of Object.entries(values)) {
      if (["password", "token", "secret"].includes(key.toLowerCase())) {
        formatted[key] = "[Hidden]";
        continue;
      }

      formatted[key] = auditLogService.formatValue(value);
    }

    return formatted;
  },

  formatValue: (value) => {
    if (value === null) return "(empty)";
    if (value === undefined) return "(none)";

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        return baseService.formatDateTime(value);
      } catch {
        return value;
      }
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return "(empty)";
      return value.join(", ");
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    if (typeof value === "number") {
      return value.toLocaleString("en-US");
    }

    if (value === "") return "(empty)";

    return value;
  },

  getChangeSummary: (oldValues, newValues) => {
    if (!oldValues || !newValues) return [];

    const changes = [];

    for (const key of Object.keys(newValues)) {
      const oldVal = oldValues[key];
      const newVal = newValues[key];

      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;
      if (["password", "token", "secret"].includes(key.toLowerCase())) continue;

      changes.push({
        field: key,
        oldValue: auditLogService.formatValue(oldVal),
        newValue: auditLogService.formatValue(newVal),
      });
    }

    return changes;
  },

  humanizeTableName: (tableName) => {
    if (!tableName) return "Record";

    return tableName.charAt(0).toUpperCase() + tableName.slice(1);
  },

  humanizeFieldName: (fieldName) => {
    if (!fieldName) return "Unknown";

    // Daftar field yang sudah dipetakan
    const fieldNames = {
      name: "Name",
      email: "Email",
      phone: "Phone Number",
      address: "Address",
      status: "Status",
      quantity: "Quantity",
      description: "Description",
      role: "Role",
      author: "Author",
      category: "Category",
      brand: "Brand",
      catalog: "Catalog",
      repliedBy: "Replied By",
      active: "Active",
      deleted: "Deleted",
      published: "Published",
      createdAt: "Created At",
      updatedAt: "Updated At",
      deletedAt: "Deleted At",
      lastLoginAt: "Last Login At",
      repliedAt: "Replied At",
    };

    // Return jika field sudah dipetakan
    if (fieldNames[fieldName]) {
      return fieldNames[fieldName];
    }

    //  Humanisasi camelCase yang lebih baik (termasuk angka)
    return fieldName
      .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase: firstName → firstName
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // PascalCase: HTTPServer → HTTP Server
      .replace(/(\d)([a-zA-Z])/g, "$1 $2") // Angka: field1Name → field1 Name
      .replace(/([a-zA-Z])(\d)/g, "$1 $2") // Angka: version2 → version 2
      .replace(/_/g, " ") // underscore
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
      .trim();
  },
};
