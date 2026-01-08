// src/services/categoriesService.js
import { dataService } from "./dataService";
import { baseService } from "./baseService";

export const categoriesService = {
  // Process list of categories, adding formatted dates
  processList: (categories) => {
    return categories.map((category) => ({
      ...category,
      createdAtFormatted: baseService.formatDateTime(category.createdAt),
      updatedAtFormatted: category.updatedAt
        ? baseService.formatDateTime(category.updatedAt)
        : null,
    }));
  },

  // Process single category (optional, bisa digunakan di getById)
  processSingle: (category) => {
    return {
      ...category,
      createdAtFormatted: baseService.formatDateTime(category.createdAt),
      updatedAtFormatted: category.updatedAt
        ? baseService.formatDateTime(category.updatedAt)
        : null,
    };
  },

  getAll: async () => {
    try {
      const result = await dataService.categories.getAll();
      if (!result.success) return result;
      return {
        success: true,
        data: categoriesService.processList(result.data),
      };
    } catch (error) {
      return {
        success: false,
        message: "Oops! we couldn't load the categories. Please try again",
      };
    }
  },

  getById: async (id) => {
    try {
      const result = await dataService.categories.getById(id);
      if (!result.success) return result;

      return {
        success: true,
        data: categoriesService.processSingle(result.data),
      };
    } catch (error) {
      return {
        success: false,
        message:
          "Oops! we couldn't load the category details. Please try again",
      };
    }
  },

  // ✅ UPDATE: Tambah parameter bypassCache
  getPaginated: async (
    page = 1,
    limit = 10,
    search = "",
    filters = {},
    bypassCache = false
  ) => {
    try {
      const params = {
        page,
        limit,
        deletedAt: null,
        bypassCache,
      };

      if (search) {
        params.search = search;
      }

      if (filters.isActive !== undefined) {
        params.isActive = filters.isActive;
      }

      const result = await dataService.categories.getAll(params);

      if (!result.success) {
        return result;
      }

      const processedCategories = categoriesService.processList(result.data);

      return {
        success: true,
        data: processedCategories,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in categoriesService.getPaginated:", error);
      return {
        success: false,
        message: "Oops! we couldn't load the categories. Please try again",
      };
    }
  },

  create: async (categoryData) => {
    try {
      const newCategory = {
        name: categoryData.name,
        description: categoryData.description || null,
        isActive: categoryData.isActive,
      };

      const result = await dataService.categories.create(newCategory);

      if (result.success && result.data) {
        result.data = categoriesService.processSingle(result.data);
      }

      return result;
    } catch (error) {
      console.error("Error in create:", error);
      return {
        success: false,
        message: "Oops! We couldn't create the category. Please try again",
      };
    }
  },

  update: async (id, categoryData) => {
    try {
      const updateData = {
        name: categoryData.name,
        description: categoryData.description || null,
        isActive: categoryData.isActive,
      };

      const result = await dataService.categories.update(id, updateData);

      if (result.success && result.data) {
        result.data = categoriesService.processSingle(result.data);
      }

      return result;
    } catch (error) {
      console.error("Error in update:", error);
      return {
        success: false,
        message: "Oops! We couldn't update the category. Please try again",
      };
    }
  },

  // Soft delete
  softDelete: async (id) => {
    try {
      const result = await dataService.categories.softDelete(id);
      if (result.success) {
        return {
          success: true,
          message: "Category successfully deleted",
        };
      }

      return result;
    } catch (error) {
      console.error("Error in delete:", error);
      return {
        success: false,
        message: "Oops! We couldn't delete the category. Please try again",
      };
    }
  },

  hardDelete: async (id) => {
    try {
      const result = await dataService.categories.hardDelete(id);
      if (result.success) {
        return {
          success: true,
          message: "Category successfully deleted",
        };
      }

      return result;
    } catch (error) {
      console.error("Error in delete:", error);
      return {
        success: false,
        message:
          "Oops! We couldn't delete the category permanently. Please try again",
      };
    }
  },
};
