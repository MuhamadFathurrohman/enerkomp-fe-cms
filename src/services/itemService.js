// src/services/itemService.js
import { dataService } from "./dataService";
import { baseService } from "./baseService";

export const itemService = {
  // Helper untuk generate URL lengkap
  _getFullImageUrl: (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    const apiBaseUrl = import.meta.env.VITE_PHOTO_URL || "";

    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${apiBaseUrl}${cleanPath}`;
  },

  normalizeTranslations: (data) => {
    // Jika sudah dalam backend format (array translations)
    if (Array.isArray(data.translations)) {
      return data.translations;
    }

    // Jika format CMS (flatten)
    return [
      {
        language: "EN",
        shortDescription: data.shortDescription || "",
        longDescription: data.longDescription || "",
        specifications: data.specifications || {},
        features: data.features || [],
        metaTitle: data.metaTitle || "",
        metaDescription: data.metaDescription || "",
        metaKeywords: data.metaKeywords || "",
      },
      {
        language: "ID",
        shortDescription: data.shortDescriptionId || "",
        longDescription: data.longDescriptionId || "",
        specifications: data.specificationsId || {},
        features: data.featuresId || [],
        metaTitle: data.metaTitleId || "",
        metaDescription: data.metaDescriptionId || "",
        metaKeywords: data.metaKeywordsId || "",
      },
    ];
  },

  // ==================== VALIDATION ====================

  /**
   * Validate product data before create/update
   */
  validateItemData: (translations, isUpdate = false, hasImage = false) => {
    const errors = [];

    const enTranslation = translations.find((t) => t.language === "EN");
    const idTranslation = translations.find((t) => t.language === "ID");

    if (!enTranslation) {
      errors.push("English translation is required");
    } else {
      if (!enTranslation.shortDescription?.trim()) {
        errors.push("English short description is required");
      }
      if (!enTranslation.longDescription?.trim()) {
        errors.push("English long description is required");
      }
    }

    if (idTranslation) {
      if (!idTranslation.shortDescription?.trim()) {
        errors.push(
          "Indonesian short description is required when Indonesian translation is provided"
        );
      }
      if (!idTranslation.longDescription?.trim()) {
        errors.push(
          "Indonesian long description is required when Indonesian translation is provided"
        );
      }
    }

    if (!isUpdate && !hasImage) {
      errors.push("Product image is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // ==================== CREATE & UPDATE (via dataService) ====================

  create: async (productData, currentUserId) => {
    try {
      if (!currentUserId) {
        return { success: false, message: "User ID is required" };
      }

      const validation = itemService.validateItemData(
        productData.translations,
        false,
        productData.images && productData.images.length > 0
      );

      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }

      return await dataService.products.create(productData);
    } catch (error) {
      console.error("Error in itemService.create:", error);
      let message = "Oops! We couldn't create the product. Please try again.";
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    }
  },

  update: async (id, productData) => {
    try {
      if (!id) {
        return { success: false, message: "Product ID is required" };
      }

      // Validasi basic
      const validation = itemService.validateItemData(
        productData.translations,
        true,
        productData.images && productData.images.length > 0
      );

      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }

      // dataService will handle image conversion
      return await dataService.products.update(id, productData);
    } catch (error) {
      console.error("Error in itemService.update:", error);

      let message = "Oops! We couldn't update the product. Please try again.";
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }

      return { success: false, message };
    }
  },

  // ==================== READ & DELETE (via dataService) ====================

  getAll: async (language = "EN") => {
    try {
      const result = await dataService.products.getAll();
      if (!result.success) {
        return result;
      }

      const processedItems = itemService.processList(result.data, language);
      return {
        success: true,
        processedItems,
      };
    } catch (error) {
      console.error("Error in itemService.getAll:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the products. Please try again.",
      };
    }
  },

  getById: async (id, language = "EN") => {
    try {
      const result = await dataService.products.getById(id);

      if (!result.success || !result.data) {
        return { success: false, message: "Product not found" };
      }

      // --- NORMALISASI DATA BACKEND ---
      const raw = result.data;

      const data = {
        ...raw,
        translations: Array.isArray(raw.translations) ? raw.translations : [],
        images: Array.isArray(raw.images) ? raw.images : [],
        specifications: raw.specifications || {},
        features: raw.features || [],
      };

      // --- CARI TRANSLATION SESUAI LANGUAGE DAN FALLBACK EN ---
      const translation = data.translations.find(
        (t) => t.language === language
      );
      const enTranslation = data.translations.find((t) => t.language === "EN");

      const fallback = translation ||
        enTranslation || {
          shortDescription: "",
          longDescription: "",
          specifications: {},
          features: [],
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
        };

      // --- TRANSLATION ID ---
      const idTranslation = data.translations.find(
        (t) => t.language === "ID"
      ) || {
        shortDescription: "",
        longDescription: "",
        specifications: {},
        features: [],
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
      };

      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          categoryId: data.categoryId,
          brandId: data.brandId,

          // Images aman
          images: data.images.map((img) => itemService._getFullImageUrl(img)),

          isActive: data.isActive ?? false,
          isFeatured: data.isFeatured ?? false,
          sortOrder: data.sortOrder ?? 0,

          // Translation fallback EN -> ID -> default
          shortDescription: fallback.shortDescription || "",
          longDescription: fallback.longDescription || "",
          specifications: fallback.specifications || {},
          features: fallback.features || [],

          metaTitle: fallback.metaTitle || "",
          metaDescription: fallback.metaDescription || "",
          metaKeywords: fallback.metaKeywords || "",

          // Translations always array
          translations: data.translations,

          createdAtFormatted: data.createdAtFormatted || data.createdAt || "",
          updatedAtFormatted: data.updatedAtFormatted || data.updatedAt || "",

          // Translation ID fields
          shortDescriptionId: idTranslation.shortDescription || "",
          longDescriptionId: idTranslation.longDescription || "",
          specificationsId: idTranslation.specifications || {},
          featuresId: idTranslation.features || [],
          metaTitleId: idTranslation.metaTitle || "",
          metaDescriptionId: idTranslation.metaDescription || "",
          metaKeywordsId: idTranslation.metaKeywords || "",
        },
      };
    } catch (error) {
      console.error("Error in itemService.getById:", error);
      return {
        success: false,
        message:
          error.message || "Oops! something went wrong, please try again",
      };
    }
  },

  softDelete: async (id) => {
    try {
      const result = await dataService.products.softDelete(id);
      if (result.success) {
        return {
          success: true,
          message: "item product successfully deleted",
        };
      }
      return result;
    } catch (error) {
      console.error("Error in itemService.delete:", error);
      return {
        success: false,
        message: "Oops! We couldn't delete the product. Please try again.",
      };
    }
  },

  hardDelete: async (id) => {
    try {
      const result = await dataService.products.hardDelete(id);
      if (result.success) {
        return {
          success: true,
          message: "item product successfully deleted permanently",
        };
      }
      return result;
    } catch (error) {
      console.error("Error in itemService.delete:", error);
      return {
        success: false,
        message:
          "Oops! We couldn't delete the product permanently. Please try again.",
      };
    }
  },

  // ==================== PAGINATION & FILTERS ====================

  // ✅ UPDATE: Tambah parameter bypassCache
  getPaginated: async (
    page = 1,
    limit = 8,
    search = "",
    filters = {},
    bypassCache = false // ← Tambah parameter
  ) => {
    try {
      const params = {
        page,
        limit,
        search,
        deleted: "false",
        bypassCache, // ← Pass ke dataService
      };

      if (filters.brandId) params.brandId = filters.brandId;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.isActive !== undefined) params.isActive = filters.isActive;

      const result = await dataService.products.getAll(params);

      if (!result.success) {
        return result;
      }

      const processedItems = result.data.map((item) =>
        itemService.processSingle(item, "EN")
      );

      return {
        success: true,
        data: processedItems,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in itemService.getPaginated:", error);
      return {
        success: false,
        message: "Oops! something went wrong, please try again",
      };
    }
  },

  // ==================== HELPER FUNCTIONS ====================

  processList: (items, language = "EN") => {
    return items.map((item) => itemService.processSingle(item, language));
  },

  processSingle: (item, language = "EN") => {
    const translation = item.translations?.find((t) => t.language === language);

    return {
      ...item,
      sortOrder: item.sortOrder ?? 0,
      images: Array.isArray(item.images)
        ? item.images.map((img) => itemService._getFullImageUrl(img))
        : [],

      primaryPhoto:
        Array.isArray(item.images) && item.images.length > 0
          ? itemService._getFullImageUrl(item.images[0])
          : null,

      createdAtFormatted: baseService.formatDateTime(item.createdAt),
      updatedAtFormatted: item.updatedAt
        ? baseService.formatDateTime(item.updatedAt)
        : null,

      shortDescription:
        translation?.shortDescription || item.shortDescription || "",
      longDescription:
        translation?.longDescription || item.longDescription || "",
      specifications: translation?.specifications || item.specifications || {},
      features: Array.isArray(translation?.features)
        ? translation.features
        : Array.isArray(item.features)
        ? item.features
        : [],
      metaTitle: translation?.metaTitle || item.metaTitle || "",
      metaDescription:
        translation?.metaDescription || item.metaDescription || "",
      metaKeywords: translation?.metaKeywords || item.metaKeywords || "",
    };
  },
};
