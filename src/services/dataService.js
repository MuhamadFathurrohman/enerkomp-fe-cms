import generalApiService from "./generalApiService";
import { separateImages } from "../utils/imageUtils";

const normalizePaginatedResponse = (response) => {
  if (response.success === false) {
    return {
      success: false,
      message: response.message || "Failed to fetch data",
    };
  }

  // Handle response dengan pagination (seperti products, users, dll)
  if (response.meta) {
    return {
      success: true,
      data: response.data,
      pagination: {
        currentPage: response.meta.page,
        totalPages: response.meta.lastPage,
        totalItems: response.meta.total,
        itemsPerPage: response.meta.perPage,
      },
    };
  }

  // Handle kasus lain
  return {
    success: true,
    data: Array.isArray(response.data) ? response.data : [response.data],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: Array.isArray(response.data) ? response.data.length : 1,
      itemsPerPage: 10,
    },
  };
};

/**Ini adalah method users dari data service */
export const dataService = {
  // =============================================
  // USERS
  // =============================================
  users: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/users", {
        ...params,
        deletedAt: null,
      });
      return normalizePaginatedResponse(response);
    },

    getById: async (id) => {
      return await generalApiService.get(`/users/${id}`);
    },

    // CREATE - Hanya kirim data profil (tanpa avatar)
    create: async (userData) => {
      // Hapus avatar dari payload
      const { avatar, ...profileData } = userData;

      // Validasi minimal
      if (
        !profileData.name ||
        !profileData.email ||
        !profileData.password ||
        !profileData.roleId
      ) {
        return {
          success: false,
          message: "Name, email, password, and role are required",
        };
      }

      return await generalApiService.create("/users", profileData);
    },

    // UPDATE - Hanya kirim data profil (tanpa avatar)
    update: async (id, userData) => {
      // Hapus avatar dari payload
      const { avatar, ...profileData } = userData;

      // Hapus password jika kosong
      if (!profileData.password) {
        delete profileData.password;
      }

      return await generalApiService.update("/users", id, profileData);
    },

    softDelete: async (id) => {
      return await generalApiService.delete(`/users/${id}`);
    },

    hardDelete: async (id) => {
      return await generalApiService.delete(`/users/${id}/hard`);
    },

    // AVATAR: Upload avatar untuk diri sendiri
    uploadAvatarSelf: async (avatarFile) => {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      return await generalApiService.patch("/auth/me/avatar", formData);
    },

    // AVATAR: Hapus avatar untuk diri sendiri
    deleteAvatarSelf: async () => {
      return await generalApiService.delete("/auth/me/avatar");
    },

    // AVATAR: Upload avatar untuk user lain (by ID)
    uploadAvatarById: async (id, avatarFile) => {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      return await generalApiService.patch(`/users/avatar/${id}`, formData);
    },

    // AVATAR: Hapus avatar untuk user lain (by ID)
    deleteAvatarById: async (id) => {
      return await generalApiService.delete(`/users/avatar/${id}`);
    },

    getCurrentUser: async () => {
      return await generalApiService.get("/auth/me");
    },
  },

  // =============================================
  // CLIENTS
  // =============================================
  clients: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/clients", {
        ...params,
        deletedAt: null,
      });
      return normalizePaginatedResponse(response);
    },
    getById: async (id) => {
      return await generalApiService.get(`/clients/${id}`);
    },
    create: async (clientData) => {
      return await generalApiService.create("/clients", clientData);
    },
    update: async (id, clientData) => {
      return await generalApiService.update("/clients", id, clientData);
    },
    reply: async (id) => {
      return await generalApiService.create(`/clients/${id}/reply`);
    },
    softDelete: async (id) => {
      return await generalApiService.delete(`/clients/${id}`);
    },
    hardDelete: async (id) => {
      return await generalApiService.delete(`/clients/${id}/hard`);
    },
  },

  // =============================================
  // CATALOGS
  // =============================================
  catalogs: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/catalogs", {
        ...params,
        deletedAt: null,
      });
      return normalizePaginatedResponse(response);
    },
    getById: async (id) => {
      return await generalApiService.get(`/catalogs/${id}`);
    },
    create: async (catalogData) => {
      return await generalApiService.create("/catalogs", catalogData);
    },
    update: async (id, catalogData) => {
      return await generalApiService.update("/catalogs", id, catalogData);
    },
    softDelete: async (id) => {
      return await generalApiService.delete(`/catalogs/${id}`);
    },
    hardDelete: async (id) => {
      return await generalApiService.delete(`/catalogs/${id}/hard`);
    },
  },

  // =============================================
  // BLOGS
  // =============================================
  blogs: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/blogs", {
        ...params,
        deletedAt: null,
      });
      return normalizePaginatedResponse(response);
    },

    getById: async (id) => {
      return await generalApiService.get(`/blogs/${id}`);
    },

    create: async (blogData) => {
      const formData = new FormData();

      Object.entries(blogData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === "translations") {
            formData.append(key, JSON.stringify(value));
          } else if (key === "image") {
            // Handle both File and String
            if (value instanceof File) {
              formData.append("image", value); // Multer → req.file
            } else if (typeof value === "string") {
              formData.append("image", value); // String → req.body.image
            }
          } else if (key === "isPublished" || key === "isFeatured") {
            formData.append(key, String(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      return await generalApiService.create("/blogs", formData);
    },

    update: async (id, blogData) => {
      const hasNewFile = blogData.image instanceof File;

      if (hasNewFile) {
        // Ada file baru → Kirim FormData
        const formData = new FormData();

        Object.entries(blogData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (key === "translations") {
              formData.append(key, JSON.stringify(value));
            } else if (key === "image") {
              if (value instanceof File) {
                formData.append("image", value);
              }
            } else if (key === "isPublished" || key === "isFeatured") {
              formData.append(key, String(value));
            } else {
              formData.append(key, value);
            }
          }
        });

        return await generalApiService.update("/blogs", id, formData);
      } else {
        // Tidak ada file baru → Kirim JSON
        const payload = {
          image: blogData.image, // String path
          isPublished: blogData.isPublished, // Boolean
          isFeatured: blogData.isFeatured, // Boolean
          translations: blogData.translations, // Array
        };

        // Remove undefined values
        Object.keys(payload).forEach((key) => {
          if (payload[key] === undefined) {
            delete payload[key];
          }
        });

        return await generalApiService.update("/blogs", id, payload);
      }
    },

    softDelete: async (id) => {
      return await generalApiService.delete(`/blogs/${id}`);
    },

    hardDelete: async (id) => {
      return await generalApiService.delete(`/blogs/${id}/hard`);
    },
  },

  notifications: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/notifications", params);
      return normalizePaginatedResponse(response);
    },

    markAsRead: async (id) => {
      return await generalApiService.patch(`/notifications/${id}/read`);
    },

    getUnreadCount: async () => {
      const response = await generalApiService.get(
        "/notifications/unread-count"
      );
      return {
        success: true,
        count: response.data?.count || 0,
      };
    },
  },

  // =============================================
  // PRODUCTS
  // =============================================
  products: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/products", {
        ...params,
        deletedAt: null,
      });
      return normalizePaginatedResponse(response);
    },

    getById: async (id) => {
      return await generalApiService.get(`/products/${id}`);
    },

    create: async (productData) => {
      const formData = new FormData();

      // Extract image files from array of objects
      let imageFiles = [];
      if (Array.isArray(productData.images) && productData.images.length > 0) {
        imageFiles = productData.images
          .map((img) => {
            // Handle object with file property
            if (img && img.file instanceof File) {
              return img.file;
            }
            // Handle direct File
            else if (img instanceof File) {
              return img;
            }
            return null;
          })
          .filter(Boolean);
      }

      // Build FormData
      Object.entries(productData).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        if (key === "translations") {
          formData.append("translations", JSON.stringify(value));
        } else if (key === "images") {
          // Append extracted files
          imageFiles.forEach((file, index) => {
            formData.append("images", file);
          });
        } else if (key === "isActive" || key === "isFeatured") {
          formData.append(key, value ? "true" : "false");
        } else if (key === "sortOrder") {
          // Always append sortOrder
          formData.append(key, String(value));
        } else {
          formData.append(key, value);
        }
      });

      return await generalApiService.create("/products", formData);
    },

    update: async (id, productData) => {
      const formData = new FormData();

      // Separate new files and existing paths
      let newFiles = [];
      let existingPaths = [];

      if (Array.isArray(productData.images) && productData.images.length > 0) {
        const result = separateImages(productData.images);
        newFiles = result.newFiles;
        existingPaths = result.existingPaths;
      }

      // Build FormData
      Object.entries(productData).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        if (key === "translations") {
          formData.append("translations", JSON.stringify(value));
        } else if (key === "images") {
          // Send existing paths as JSON string
          if (existingPaths.length > 0) {
            formData.append("images", JSON.stringify(existingPaths));
          }

          // Append new files
          if (newFiles.length > 0) {
            newFiles.forEach((file, index) => {
              formData.append("images", file);
            });
          }
        } else if (key === "isActive" || key === "isFeatured") {
          formData.append(key, value ? "true" : "false");
        } else if (key === "sortOrder") {
          // Always append sortOrder
          formData.append(key, String(value));
        } else {
          formData.append(key, value);
        }
      });

      return await generalApiService.update("/products", id, formData);
    },

    softDelete: async (id) => {
      return await generalApiService.delete(`/products/${id}`);
    },
    hardDelete: async (id) => {
      return await generalApiService.delete(`/products/${id}/hard`);
    },
  },

  // =============================================
  // CATEGORIES
  // =============================================
  categories: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/categories", params);
      return normalizePaginatedResponse(response);
    },
    getById: async (id) => {
      return await generalApiService.get(`/categories/${id}`);
    },
    create: async (categoryData) => {
      return await generalApiService.create("/categories", categoryData);
    },

    update: async (id, categoryData) => {
      return await generalApiService.update("/categories", id, categoryData);
    },
    softDelete: async (id) => {
      return await generalApiService.delete(`/categories/${id}`);
    },
    hardDelete: async (id) => {
      return await generalApiService.delete(`/categories/${id}/hard`);
    },
    getByStatus: async (status) => {
      const response = await generalApiService.getAll("/categories", {
        isActive: status === "active",
        deletedAt: null,
      });
      return normalizePaginatedResponse(response);
    },
  },

  // =============================================
  // BRANDS
  // =============================================
  // dataService.js - brands section (FIXED)

  brands: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/brands", {
        ...params,
        deletedAt: null,
      });
      return normalizePaginatedResponse(response);
    },

    getById: async (id) => {
      return await generalApiService.get(`/brands/${id}`);
    },

    create: async (brandData) => {
      const formData = new FormData();

      // Append fields dalam urutan yang benar
      Object.entries(brandData).forEach(([key, value]) => {
        // Skip null/undefined
        if (value === null || value === undefined) {
          return;
        }

        // Handle logo file upload (File object)
        if (key === "logo" && value instanceof File) {
          formData.append("logo", value);
        }
        // Handle sortOrder - KIRIM SEBAGAI STRING NUMBER
        else if (key === "sortOrder") {
          formData.append("sortOrder", String(value));
        }
        // Handle fields lainnya (name, type, slug)
        else if (key !== "logo") {
          // Skip logo jika bukan File
          formData.append(key, String(value));
        }
      });

      return await generalApiService.create("/brands", formData);
    },

    update: async (id, brandData) => {
      // === Jika logo berupa FILE → HARUS FormData ===
      if (brandData.logo instanceof File) {
        const formData = new FormData();

        Object.entries(brandData).forEach(([key, value]) => {
          if (value === undefined) return;

          // sortOrder kirim sebagai string
          if (key === "sortOrder") {
            formData.append("sortOrder", String(value));
            return;
          }

          // logo FILE → langsung append
          formData.append(key, value);
        });

        return await generalApiService.update("/brands", id, formData);
      }

      // === Selain File → JSON biasa ===
      const payload = {};

      Object.entries(brandData).forEach(([key, value]) => {
        if (value === undefined) return;

        // Jika logo bukan File dan berupa object kosong → abaikan
        if (
          key === "logo" &&
          typeof value === "object" &&
          value !== null &&
          !(value instanceof File)
        ) {
          return;
        }

        // sortOrder tetap angka
        if (key === "sortOrder") {
          payload.sortOrder = Number(value);
          return;
        }

        payload[key] = value;
      });

      return await generalApiService.update("/brands", id, payload);
    },

    softDelete: async (id) => {
      return await generalApiService.delete(`/brands/${id}`);
    },

    hardDelete: async (id) => {
      return await generalApiService.delete(`/brands/${id}/hard`);
    },
  },

  // =============================================
  // ANALYTICS
  // =============================================

  analytics: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/analytics", params);
      return normalizePaginatedResponse(response);
    },

    getByDateRange: async (startDate, endDate) => {
      const response = await generalApiService.getAll("/analytics", {
        startDate,
        endDate,
      });
      return normalizePaginatedResponse(response);
    },

    getPageViews: async (params = {}) => {
      const response = await generalApiService.getAll(
        "/analytics/page-views",
        params
      );
      return normalizePaginatedResponse(response);
    },

    getPageViewsByDateRange: async (startDate, endDate) => {
      const response = await generalApiService.getAll("/analytics/page-views", {
        startDate,
        endDate,
      });
      return normalizePaginatedResponse(response);
    },
  },

  // =============================================
  // GALLERY
  // =============================================
  gallery: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/galleries", {
        ...params,
        deletedAt: null,
      });
      return normalizePaginatedResponse(response);
    },
    getById: async (id) => {
      return await generalApiService.get(`/galleries/${id}`);
    },
    create: async (galleryData) => {
      const formData = new FormData();

      //  Pastikan image adalah File object
      if (!(galleryData.image instanceof File)) {
        throw new Error("Image must be a File object");
      }

      formData.append("image", galleryData.image);

      return await generalApiService.create("/galleries", formData);
    },

    // update: async (id, galleryData) => {
    //   // Selalu gunakan FormData untuk gallery
    //   const formData = new FormData();

    //   if (!(galleryData.image instanceof File)) {
    //     throw new Error("Image must be a File object");
    //   }

    //   formData.append("image", galleryData.image);

    //   return await generalApiService.update("/galleries", id, formData);
    // },
    softDelete: async (id) => {
      return await generalApiService.delete(`/galleries/${id}`);
    },
    hardDelete: async (id) => {
      return await generalApiService.delete(`/galleries/${id}/hard`);
    },
  },

  // =============================================
  // ROLES
  // =============================================
  roles: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/roles", {
        ...params,
        deletedAt: null,
      });
      return normalizePaginatedResponse(response);
    },
    getById: async (id) => {
      return await generalApiService.get(`/roles/${id}`);
    },
    create: async (data) => {
      return await generalApiService.create("/roles", data);
    },
    update: async (id, data) => {
      return await generalApiService.update("/roles", id, data);
    },
    softDelete: async (id) => {
      return await generalApiService.delete(`/roles/${id}`);
    },
    hardDelete: async (id) => {
      return await generalApiService.delete(`/roles/${id}/hard`);
    },
  },

  // =============================================
  // AUDIT LOGS
  // =============================================
  auditLogs: {
    getAll: async (params = {}) => {
      const response = await generalApiService.getAll("/audit-logs", params);
      return normalizePaginatedResponse(response);
    },
  },
};
