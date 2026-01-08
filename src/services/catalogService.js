// catalogService.js
import { dataService } from "./dataService";
import { baseService } from "./baseService";

const catalogService = {
  // UPDATE: Tambah parameter bypassCache
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

      // Tambahkan filter lain jika perlu
      if (filters.status) {
        params.status = filters.status;
      }

      const result = await dataService.catalogs.getAll(params);

      if (!result.success) {
        return result;
      }

      const formattedData = result.data.map(
        catalogService.formatCatalogForDisplay
      );

      return {
        success: true,
        data: formattedData,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Failed to fetch catalogs:", error);
      return {
        success: false,
        message: "Oops! we couldn't load the catalogs. Please try again",
      };
    }
  },

  // Create new catalog
  create: async (catalogData) => {
    try {
      const result = await dataService.catalogs.create(catalogData);
      return result;
    } catch (error) {
      console.error("Failed to create new catalog:", error);
      return {
        success: false,
        message: "Oops! we couldn't create the catalog. Please try again",
      };
    }
  },

  // Update catalog
  update: async (id, updatedData) => {
    try {
      const result = await dataService.catalogs.update(id, updatedData);
      return result;
    } catch (error) {
      console.error(`Failed to update catalog with ID ${id}:`, error);
      return {
        success: false,
        message: "Oops! we couldn't update the catalog. Please try again",
      };
    }
  },

  softDelete: async (id) => {
    try {
      const result = await dataService.catalogs.softDelete(id);
      if (result.success) {
        return {
          success: true,
          message: "Catalog successfully deleted",
        };
      }
    } catch (error) {
      console.error(`Failed to delete catalog with ID ${id}:`, error);
      return {
        success: false,
        message: "Oops! we couldn't delete the catalog. Please try again",
      };
    }
  },

  hardDelete: async (id) => {
    try {
      const result = await dataService.catalogs.hardDelete(id);
      if (result.success) {
        return {
          success: true,
          message: "Catalog successfully deleted permanently",
        };
      }
      return result;
    } catch (error) {
      console.error(`Failed to delete catalog with ID ${id}:`, error);
      return {
        success: false,
        message:
          "Oops! we couldn't delete the catalog permanently. Please try again",
      };
    }
  },

  // Get catalog by ID
  getById: async (id) => {
    try {
      const result = await dataService.catalogs.getById(id);
      return result;
    } catch (error) {
      console.error(`Failed to fetch catalog with ID ${id}:`, error);
      return {
        success: false,
        message: "Oops! we couldn't load the catalog details. Please try again",
      };
    }
  },

  // Helper functions (dipertahankan)
  formatCatalogForDisplay: (catalog) => {
    const formattedCreatedAt = baseService.formatDateTime(catalog.createdAt);
    const formattedUpdatedAt = catalog.updatedAt
      ? baseService.formatDateTime(catalog.updatedAt)
      : null;

    return {
      ...catalog,
      formattedCreatedAt,
      formattedUpdatedAt,
    };
  },

  validateCatalogData: (catalogData) => {
    const errors = [];

    if (!catalogData.name || catalogData.name.trim().length === 0) {
      errors.push("Catalog name is required.");
    } else if (catalogData.name.length > 200) {
      errors.push("Catalog name must not exceed 200 characters.");
    }

    const fileUrl = catalogData.file?.trim();
    if (!fileUrl) {
      errors.push("Google Drive link is required.");
    } else {
      try {
        const parsed = new URL(fileUrl);
        if (parsed.hostname !== "drive.google.com") {
          errors.push("Only Google Drive links are allowed.");
        } else if (!parsed.pathname.startsWith("/file/d/")) {
          errors.push("Link must point to a valid Google Drive file.");
        } else {
          const fileId = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          if (!fileId) {
            errors.push("Invalid Google Drive file URL format.");
          }
        }
      } catch (e) {
        errors.push("Please enter a valid URL.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

export default catalogService;
