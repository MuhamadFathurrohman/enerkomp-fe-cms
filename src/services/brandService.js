// brandService.js
import { dataService } from "./dataService";
import { baseService } from "./baseService";

export const brandService = {
  _getFullLogoUrl: (logoPath) => {
    if (!logoPath) return null;

    if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) {
      return logoPath;
    }
    const apiBaseUrl = import.meta.env.VITE_PHOTO_URL || "";

    const cleanPath = logoPath.startsWith("/") ? logoPath : `/${logoPath}`;
    return `${apiBaseUrl}${cleanPath}`;
  },

  processList: (brands) => {
    return brands.map((brand) => ({
      ...brand,
      logoUrl: brandService._getFullLogoUrl(brand.logo),
      createdAtFormatted: baseService.formatDateTime(brand.createdAt),
      updatedAtFormatted: brand.updatedAt
        ? baseService.formatDateTime(brand.updatedAt)
        : null,
      sortOrder: brand.sortOrder || 0,
    }));
  },

  processSingle: (brand) => {
    if (!brand) return null;
    return {
      ...brand,
      logoUrl: brandService._getFullLogoUrl(brand.logo),
      createdAtFormatted: baseService.formatDateTime(brand.createdAt),
      updatedAtFormatted: brand.updatedAt
        ? baseService.formatDateTime(brand.updatedAt)
        : null,
      sortOrder: brand.sortOrder || 0,
    };
  },

  getAll: async () => {
    try {
      const result = await dataService.brands.getAll();
      if (!result.success) return result;
      return {
        success: true,
        data: brandService.processList(result.data),
      };
    } catch (error) {
      console.error("Error in brandService.getAll:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the brands. Please try again",
      };
    }
  },

  getById: async (id) => {
    try {
      const result = await dataService.brands.getById(id);
      if (!result.success) return result;
      return {
        success: true,
        data: brandService.processSingle(result.data),
      };
    } catch (error) {
      return {
        success: false,
        message: "Oops! We couldn't load the brand details. Please try again",
      };
    }
  },

  // ✅ UPDATE: Tambah parameter bypassCache
  getPaginated: async (
    page = 1,
    limit = 10,
    search = "",
    filters = {},
    bypassCache = false // ← Tambah parameter
  ) => {
    try {
      const params = {
        page,
        limit,
        deletedAt: null,
        bypassCache, // ← Pass ke dataService
      };

      if (search) {
        params.search = search;
      }

      if (filters.isPublished !== undefined) {
        params.isPublished = filters.isPublished;
      }
      if (filters.type) {
        params.type = filters.type;
      }

      const result = await dataService.brands.getAll(params);

      if (!result.success) {
        return result;
      }

      const processedBrands = brandService.processList(result.data);

      return {
        success: true,
        data: processedBrands,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in brandService.getPaginated:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the brands. Please try again",
      };
    }
  },

  create: async (brandData) => {
    try {
      if (!brandData.name?.trim()) {
        return { success: false, message: "Brand name is required" };
      }

      const processedData = {
        name: brandData.name.trim(),
        type: brandData.type || "PRODUCT",
        sortOrder: Number(brandData.sortOrder) || 0,
        logo: brandData.logo || null,
      };

      return await dataService.brands.create(processedData);
    } catch (error) {
      console.error("Error in brandService.create:", error);
      return {
        success: false,
        message: "Oops! We couldn't create the brand. Please try again",
      };
    }
  },

  update: async (id, brandData) => {
    try {
      if (!id) {
        return { success: false, message: "Brand ID is required" };
      }

      if (!brandData.name?.trim()) {
        return { success: false, message: "Brand name is required" };
      }

      // Siapkan data yang bersih untuk dikirim ke dataService
      const processedData = {
        name: brandData.name.trim(),
        type: brandData.type || "PRODUCT",
        // sortOrder tetap number — dataService akan handle konversi saat membuat FormData
        sortOrder: Number(brandData.sortOrder) || 0,
        logo: brandData.logo ?? null, // bisa File, string path, atau null
        // Penting: convert isActive ke STRING "true"/"false"
        isActive:
          typeof brandData.isActive === "boolean"
            ? brandData.isActive
              ? "true"
              : "false"
            : // kalau sudah string (mis. "true"/"false") biarkan saja
            typeof brandData.isActive === "string"
            ? brandData.isActive
            : undefined,
      };

      // Hapus field yang undefined supaya tidak terkirim
      Object.keys(processedData).forEach((k) => {
        if (processedData[k] === undefined) delete processedData[k];
      });

      // Panggil dataService (yang akan memilih FormData atau JSON)
      return await dataService.brands.update(id, processedData);
    } catch (error) {
      console.error("Error in brandService.update:", error);
      return {
        success: false,
        message: "Oops! We couldn't update the brand. Please try again",
      };
    }
  },

  softDelete: async (id) => {
    try {
      const result = await dataService.brands.softDelete(id);
      if (result.success) {
        return {
          success: true,
          message: "Brand successfully deleted",
        };
      }

      return result;
    } catch (error) {
      console.error("Error in delete:", error);
      return {
        success: false,
        message: "Oops! We couldn't delete the brand. Please try again",
      };
    }
  },

  hardDelete: async (id) => {
    try {
      const result = await dataService.brands.hardDelete(id);
      if (result.success) {
        return {
          success: true,
          message: "Brand successfully deleted",
        };
      }

      return result;
    } catch (error) {
      console.error("Error in delete:", error);
      return {
        success: false,
        message:
          "Oops! We couldn't delete the brand permanently. Please try again",
      };
    }
  },
};
