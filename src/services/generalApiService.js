// services/generalApiService.js
import apiClient from "./api";

const generalApiService = {
  get: async (url) => {
    try {
      const response = await apiClient.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`GET ${url} error:`, error);
      return {
        success: false,
        message: "Oops! We couldn't load the data. Try refreshing the page.",
      };
    }
  },

  getAll: async (endpoint, params = {}) => {
    try {
      const { bypassCache, ...queryParams } = params;

      const requestParams = bypassCache
        ? { ...queryParams, _t: Date.now() }
        : queryParams;

      const response = await apiClient.get(endpoint, { params: requestParams });

      if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data) &&
        Array.isArray(response.data.data) &&
        response.data.meta
      ) {
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      }

      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }

      if (response.data && typeof response.data === "object") {
        return { success: true, data: response.data };
      }

      console.warn(
        `[generalApiService] Unrecognized response format for ${endpoint}`,
        response.data
      );
      return { success: false, message: "Invalid data format from server." };
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      return {
        success: false,
        message: "Oops! We couldn't load the data. Try refreshing the page.",
      };
    }
  },

  create: async (endpoint, data) => {
    try {
      const response = await apiClient.post(endpoint, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      return {
        success: false,
        message:
          "Something went wrong while adding your data. Please try again.",
      };
    }
  },

  update: async (urlOrEndpoint, idOrData, data) => {
    try {
      let url, payload;

      if (typeof idOrData === "object" && data === undefined) {
        url = urlOrEndpoint;
        payload = idOrData;
      } else if (typeof idOrData === "string" || typeof idOrData === "number") {
        url = `${urlOrEndpoint}/${idOrData}`;
        payload = data;
      } else {
        throw new Error("Invalid update parameters");
      }

      const response = await apiClient.put(url, payload);

      return { success: true, data: response.data };
    } catch (error) {
      console.error(`PUT ${urlOrEndpoint} error:`, error);
      return {
        success: false,
        message: "We couldn't update your data. Try again in a moment",
      };
    }
  },

  delete: async (urlOrEndpoint, id) => {
    try {
      const url =
        typeof id !== "undefined" ? `${urlOrEndpoint}/${id}` : urlOrEndpoint;
      await apiClient.delete(url);
      return { success: true };
    } catch (error) {
      console.error(`DELETE ${urlOrEndpoint} error:`, error);
      return {
        success: false,
        message: "Unable to delete this data. Please try again",
      };
    }
  },

  patch: async (endpoint, data = {}) => {
    try {
      const response = await apiClient.patch(endpoint, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Request failed",
      };
    }
  },

  exportData: async (entity, format) => {
    try {
      // ✅ Tambahkan mapping untuk entitas yang menggunakan bentuk plural di backend
      const entityMap = {
        brand: "brands",
        product: "products",
        users: "users",
      };
      const routeEntity = entityMap[entity] || entity;

      // ✅ Validasi berdasarkan routeEntity (bentuk yang benar)
      const validEntities = ["users", "brands", "products"]; // sesuaikan dengan route backend
      const validFormats = ["pdf", "excel"];

      if (!validEntities.includes(routeEntity)) {
        throw new Error(`Invalid entity: ${entity}`);
      }
      if (!validFormats.includes(format)) {
        throw new Error(`Invalid format: ${format}`);
      }

      // ✅ Gunakan routeEntity di URL
      const response = await apiClient.get(`/${routeEntity}/export/${format}`, {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"];
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `${routeEntity}_export.${
        format === "excel" ? "xlsx" : "pdf"
      }`;

      // Ekstrak filename dari header jika tersedia
      if (contentDisposition) {
        const match = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, "");
        }
      }

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, fileName };
    } catch (error) {
      console.error(`Export ${entity} to ${format} failed:`, error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Oops! We couldn't export the data. Please try again.",
      };
    }
  },

  downloadFile: async (url, params = {}, fallbackFilename = "download") => {
    try {
      const response = await apiClient.get(url, {
        params,
        responseType: "blob",
      });

      const contentType = response.headers["content-type"];
      const contentDisposition = response.headers["content-disposition"];
      let fileName = fallbackFilename;

      // Ekstrak filename dari header jika tersedia
      if (contentDisposition) {
        const match = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, "");
        }
      } else {
        // Jika tidak ada header, pastikan ekstensi sesuai konten
        const ext = contentType?.includes("pdf")
          ? "pdf"
          : contentType?.includes("excel") ||
            contentType?.includes("spreadsheet")
          ? "xlsx"
          : "bin";
        fileName = `${fallbackFilename}.${ext}`;
      }

      const blob = new Blob([response.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, fileName };
    } catch (error) {
      console.error(`DOWNLOAD ${url} failed:`, error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Oops! We couldn't export the data. Please try again.",
      };
    }
  },
};

export default generalApiService;
