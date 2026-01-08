// src/services/galleryService.js
import { dataService } from "./dataService";
import { baseService } from "./baseService";

export const galleryService = {
  _getFullImageUrl: (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    const apiBaseUrl = import.meta.env.VITE_PHOTO_URL || "";

    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${apiBaseUrl}${cleanPath}`;
  },

  // ✅ UPDATE: Tambah parameter bypassCache
  getPaginated: async (
    page = 1,
    limit = 10,
    bypassCache = false // ← Tambah parameter
  ) => {
    try {
      const params = {
        page,
        limit,
        deletedAt: null,
        bypassCache, // ← Pass ke dataService
      };

      const result = await dataService.gallery.getAll(params);

      if (!result.success) {
        return result;
      }

      const processedData = result.data.map((item) => ({
        ...item,
        imageUrl: galleryService._getFullImageUrl(item.image),
        createdAtFormatted: baseService.formatDateTime(item.createdAt),
        deletedAtFormatted: item.deletedAt
          ? baseService.formatDateTime(item.deletedAt)
          : null,
      }));

      return {
        success: true,
        data: processedData,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in galleryService.getPaginated:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the gallery. Please try again.",
      };
    }
  },

  getAll: async () => {
    try {
      const result = await dataService.gallery.getAll();
      if (!result.success) return result;

      const data = (result.data || []).map((item) => ({
        ...item,
        imageUrl: galleryService._getFullImageUrl(item.image),
        createdAtFormatted: baseService.formatDateTime(item.createdAt),
        deletedAtFormatted: item.deletedAt
          ? baseService.formatDateTime(item.deletedAt)
          : null,
      }));

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error in galleryService.getAll:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the gallery. Please try again.",
      };
    }
  },

  getById: async (id) => {
    try {
      const result = await dataService.gallery.getById(id);
      if (!result.success) return result;

      const processedData = {
        ...result.data,
        imageUrl: galleryService._getFullImageUrl(result.data.image),
        createdAtFormatted: baseService.formatDateTime(result.data.createdAt),
        deletedAtFormatted: result.data.deletedAt
          ? baseService.formatDateTime(result.data.deletedAt)
          : null,
      };

      return {
        success: true,
        data: processedData,
      };
    } catch (error) {
      console.error("Error in galleryService.getById:", error);
      return {
        success: false,
        message:
          "Oops! We couldn't load the gallery details. Please try again.",
      };
    }
  },

  create: async (galleryData) => {
    try {
      if (!galleryData.image || !(galleryData.image instanceof File)) {
        return {
          success: false,
          message: "Image is required and must be a file",
        };
      }

      return await dataService.gallery.create(galleryData);
    } catch (error) {
      console.error("Error in galleryService.create:", error);
      return {
        success: false,
        message: "Oops! We couldn't create the gallery. Please try again.",
      };
    }
  },

  update: async (id, galleryData) => {
    try {
      if (!galleryData.image || !(galleryData.image instanceof File)) {
        return {
          success: false,
          message: "Image is required and must be a file",
        };
      }

      return await dataService.gallery.update(id, galleryData);
    } catch (error) {
      console.error("Error in galleryService.update:", error);
      return {
        success: false,
        message: "Oops! We couldn't update the gallery. Please try again.",
      };
    }
  },

  softDelete: async (id) => {
    try {
      return await dataService.gallery.softDelete(id);
    } catch (error) {
      console.error("Error in galleryService.delete:", error);
      return {
        success: false,
        message: "Oops! We couldn't delete the gallery. Please try again.",
      };
    }
  },

  hardDelete: async (id) => {
    try {
      return await dataService.gallery.hardDelete(id);
    } catch (error) {
      console.error("Error in galleryService.delete:", error);
      return {
        success: false,
        message:
          "Oops! We couldn't delete the gallery permanently. Please try again.",
      };
    }
  },
};
