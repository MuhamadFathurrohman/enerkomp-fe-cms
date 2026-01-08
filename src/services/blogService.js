// src/services/blogService.js
import { dataService } from "./dataService";
import { baseService } from "./baseService";

export const blogService = {
  _getFullImageUrl: (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    const apiBaseUrl = import.meta.env.VITE_PHOTO_URL || "";

    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${apiBaseUrl}${cleanPath}`;
  },

  validateBlogData: (translations, isUpdate = false, hasImage = false) => {
    const errors = [];

    const enTranslation = translations.find((t) => t.language === "EN");
    const idTranslation = translations.find((t) => t.language === "ID");

    // English is always required
    if (!enTranslation) {
      errors.push("English translation is required");
    } else {
      if (!enTranslation.title?.trim()) {
        errors.push("English title is required");
      }
      if (!enTranslation.content?.trim()) {
        errors.push("English content is required");
      }
    }

    // Indonesian is optional but must be complete if provided
    if (idTranslation) {
      if (!idTranslation.title?.trim()) {
        errors.push(
          "Indonesian title is required when Indonesian translation is provided"
        );
      }
      if (!idTranslation.content?.trim()) {
        errors.push(
          "Indonesian content is required when Indonesian translation is provided"
        );
      }
    }

    // Image required only on create
    if (!isUpdate && !hasImage) {
      errors.push("Blog image is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  getPaginated: async (
    page = 1,
    limit = 8,
    search = "",
    filters = {},
    language = "EN",
    bypassCache = false
  ) => {
    try {
      const result = await dataService.blogs.getAll({
        page,
        limit,
        search,
        deletedAt: null,
        ...filters,
        bypassCache, // ✅ Pass ke dataService → generalApiService
      });

      if (!result.success) {
        return result;
      }

      const processedBlogs = result.data.map((blog) => {
        const translation = blog.translations?.find(
          (t) => t.language === language
        );

        return {
          ...blog,
          imageUrl: blogService._getFullImageUrl(blog.image || null),
          title: translation?.title || "",
          excerpt: translation?.excerpt || "",
          content: translation?.content || "",
          createdAtFormatted: blog.createdAt
            ? baseService.formatDateTime(blog.createdAt)
            : "N/A",
          updatedAtFormatted: blog.updatedAt
            ? baseService.formatDateTime(blog.updatedAt)
            : null,
        };
      });

      return {
        success: true,
        data: processedBlogs,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in blogService.getPaginated:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the blogs. Please try again",
      };
    }
  },

  // ✅ UPDATED: Support language parameter like itemService
  getById: async (id, language = "EN") => {
    try {
      if (!id) {
        return { success: false, message: "Blog ID is required" };
      }

      const result = await dataService.blogs.getById(id);

      if (!result.success || !result.data) {
        return { success: false, message: "Blog not found" };
      }

      const blog = result.data;

      // ✅ Get translation for requested language
      const translation = blog.translations?.find(
        (t) => t.language === language
      );

      // ✅ Fallback to EN if requested language not found
      const enTranslation = blog.translations?.find((t) => t.language === "EN");
      const fallback = translation || enTranslation || {};

      return {
        success: true,
        data: {
          id: blog.id,
          image: blog.image,
          imageUrl: blogService._getFullImageUrl(blog.image || null),
          isPublished: blog.isPublished,
          isFeatured: blog.isFeatured,
          viewCount: blog.viewCount || 0,

          // ✅ Dynamic translation based on language
          title: fallback.title || "",
          excerpt: fallback.excerpt || "",
          content: fallback.content || "",
          metaTitle: fallback.metaTitle || "",
          metaDescription: fallback.metaDescription || "",
          metaKeywords: fallback.metaKeywords || "",
          tags: Array.isArray(fallback.tags) ? fallback.tags : [],

          // ✅ Include all translations for edit form
          translations: blog.translations || [],

          // ✅ For edit form - separate EN and ID
          titleEn:
            blog.translations?.find((t) => t.language === "EN")?.title || "",
          contentEn:
            blog.translations?.find((t) => t.language === "EN")?.content || "",
          excerptEn:
            blog.translations?.find((t) => t.language === "EN")?.excerpt || "",
          metaTitleEn:
            blog.translations?.find((t) => t.language === "EN")?.metaTitle ||
            "",
          metaDescriptionEn:
            blog.translations?.find((t) => t.language === "EN")
              ?.metaDescription || "",
          metaKeywordsEn:
            blog.translations?.find((t) => t.language === "EN")?.metaKeywords ||
            "",
          tagsEn:
            blog.translations?.find((t) => t.language === "EN")?.tags || [],

          titleId:
            blog.translations?.find((t) => t.language === "ID")?.title || "",
          contentId:
            blog.translations?.find((t) => t.language === "ID")?.content || "",
          excerptId:
            blog.translations?.find((t) => t.language === "ID")?.excerpt || "",
          metaTitleId:
            blog.translations?.find((t) => t.language === "ID")?.metaTitle ||
            "",
          metaDescriptionId:
            blog.translations?.find((t) => t.language === "ID")
              ?.metaDescription || "",
          metaKeywordsId:
            blog.translations?.find((t) => t.language === "ID")?.metaKeywords ||
            "",
          tagsId:
            blog.translations?.find((t) => t.language === "ID")?.tags || [],

          // ✅ Formatted dates
          createdAtFormatted: blog.createdAt
            ? baseService.formatDateTime(blog.createdAt)
            : "N/A",
          updatedAtFormatted: blog.updatedAt
            ? baseService.formatDateTime(blog.updatedAt)
            : null,
        },
      };
    } catch (error) {
      console.error("Error in blogService.getById:", error);
      return {
        success: false,
        message:
          error.message ||
          "Oops! We couldn't load the blog details. Please try again",
      };
    }
  },

  create: async (blogData, currentUserId) => {
    try {
      if (!currentUserId) {
        return { success: false, message: "User ID is required" };
      }

      const validation = blogService.validateBlogData(
        blogData.translations,
        false,
        blogData.image instanceof File
      );

      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }

      return await dataService.blogs.create(blogData);
    } catch (error) {
      console.error("Error in blogService.create:", error);
      let message = "Oops! We couldn't create the blog. Please try again.";
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    }
  },

  update: async (id, blogData) => {
    try {
      if (!id) {
        return { success: false, message: "Blog ID is required" };
      }

      const validation = blogService.validateBlogData(
        blogData.translations,
        true,
        blogData.image instanceof File || typeof blogData.image === "string"
      );

      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }

      return await dataService.blogs.update(id, blogData);
    } catch (error) {
      console.error("Error in blogService.update:", error);
      let message = "Oops! We couldn't update the blog. Please try again.";
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    }
  },

  softDelete: async (id) => {
    try {
      return await dataService.blogs.softDelete(id);
    } catch (error) {
      console.error("Error in blogService.softDelete:", error);
      return {
        success: false,
        message: "Oops! We couldn't delete the blog. Please try again",
      };
    }
  },

  hardDelete: async (id) => {
    try {
      return await dataService.blogs.hardDelete(id);
    } catch (error) {
      console.error("Error in blogService.hardDelete:", error);
      return {
        success: false,
        message:
          "Oops! We couldn't delete the blog permanently. Please try again",
      };
    }
  },
};
