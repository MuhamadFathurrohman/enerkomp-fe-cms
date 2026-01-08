import { dataService } from "./dataService";
import { baseService } from "./baseService";
import { uploadService } from "./uploadService";

export const usersService = {
  // ===================================================================
  // AVATAR URL HELPER
  // ===================================================================
  getFullAvatarUrl: (avatarPath) => {
    if (!avatarPath) return null;

    if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
      return avatarPath;
    }
    const apiBaseUrl = import.meta.env.VITE_PHOTO_URL || "";

    const cleanPath = avatarPath.startsWith("/")
      ? avatarPath
      : `/${avatarPath}`;

    return `${apiBaseUrl}${cleanPath}`;
  },

  // ===================================================================
  // PROCESS LIST - Transform user list dengan avatar URL
  // ===================================================================
  processList: (users) => {
    return users.map((user) => ({
      ...user,
      avatar: usersService.getFullAvatarUrl(user.avatar),
      createdAtFormatted: baseService.formatDate(user.createdAt),
      lastLoginFormatted: user.lastLoginAt
        ? baseService.timeAgo(user.lastLoginAt)
        : "-",
      statusColor: baseService.getStatusColor(user.status),
      statusText:
        user.status === "ACTIVE"
          ? "active"
          : user.status === "INACTIVE"
          ? "inactive"
          : user.status === "SUSPENDED"
          ? "suspended"
          : "unknown",
      role: user.role?.name || user.roleId || "user",
    }));
  },

  // ===================================================================
  // PROCESS SINGLE USER - Transform single user dengan avatar URL
  // ===================================================================
  processSingleUser: (user) => {
    if (!user) return null;

    return {
      ...user,
      avatar: user.avatar, // Keep original path
      avatarUrl: usersService.getFullAvatarUrl(user.avatar), // Add full URL
      createdAtFormatted: baseService.formatDate(user.createdAt),
      lastLoginFormatted: user.lastLoginAt
        ? baseService.timeAgo(user.lastLoginAt)
        : "-",
      statusColor: baseService.getStatusColor(user.status),
      statusText:
        user.status === "ACTIVE"
          ? "active"
          : user.status === "INACTIVE"
          ? "inactive"
          : user.status === "SUSPENDED"
          ? "suspended"
          : "unknown",
      roleName: user.role?.name || user.roleName || "User",
      roleId: user.role?.id || user.roleId,
    };
  },

  // ===================================================================
  // ✅ AVATAR: Upload dan Delete (BARU)
  // ===================================================================
  uploadAvatarSelf: async (avatarFile) => {
    try {
      const validation = uploadService.validateFile(avatarFile);
      if (!validation.isValid) {
        return { success: false, message: validation.error };
      }
      return await dataService.users.uploadAvatarSelf(avatarFile);
    } catch (error) {
      console.error("Error uploading self avatar:", error);
      return {
        success: false,
        message: "Oops! We couldn't upload your avatar. Please try again.",
      };
    }
  },

  deleteAvatarSelf: async () => {
    try {
      return await dataService.users.deleteAvatarSelf();
    } catch (error) {
      console.error("Error deleting self avatar:", error);
      return {
        success: false,
        message: "Oops! We couldn't delete your avatar. Please try again.",
      };
    }
  },

  uploadAvatarById: async (id, avatarFile) => {
    try {
      const validation = uploadService.validateFile(avatarFile);
      if (!validation.isValid) {
        return { success: false, message: validation.error };
      }
      return await dataService.users.uploadAvatarById(id, avatarFile);
    } catch (error) {
      console.error("Error uploading avatar by ID:", error);
      return {
        success: false,
        message: "Oops! We couldn't upload the avatar. Please try again.",
      };
    }
  },

  deleteAvatarById: async (id) => {
    try {
      return await dataService.users.deleteAvatarById(id);
    } catch (error) {
      console.error("Error deleting avatar by ID:", error);
      return {
        success: false,
        message: "Oops! We couldn't delete the avatar. Please try again.",
      };
    }
  },

  // ===================================================================
  // ✅ CREATE USER (Diperbarui: avatar di-handle terpisah)
  // ===================================================================
  create: async (userData) => {
    try {
      const { avatar, ...profileData } = userData;

      // Validasi file jika ada
      if (avatar instanceof File) {
        const validation = uploadService.validateFile(avatar);
        if (!validation.isValid) {
          return { success: false, message: validation.error };
        }
      }

      // Kirim hanya data profil
      const result = await dataService.users.create(profileData);
      if (!result.success) return result;

      // Jika ada avatar, upload terpisah
      if (avatar instanceof File) {
        const uploadResult = await dataService.users.uploadAvatarById(
          result.data.id,
          avatar
        );
        if (!uploadResult.success) {
          // Opsional: rollback? atau biarkan user retry
          console.warn(
            "Avatar upload failed, but user created:",
            uploadResult.message
          );
        }
      }

      // Ambil data terbaru setelah upload
      const freshUser = await dataService.users.getById(result.data.id);
      if (freshUser.success) {
        result.data = usersService.processSingleUser(freshUser.data);
      }

      return result;
    } catch (error) {
      console.error("Error in create user:", error);
      return {
        success: false,
        message: "Oops! We couldn't create the user. Please try again",
      };
    }
  },

  // ===================================================================
  // ✅ UPDATE USER (Diperbarui: avatar di-handle terpisah)
  // ===================================================================
  update: async (id, userData, isProfileMode = false) => {
    try {
      const { avatar, isAvatarRemoved, ...profileData } = userData;

      // Validasi data profil
      if (profileData.password && profileData.password.length < 6) {
        return {
          success: false,
          message: "Password must be at least 6 characters",
        };
      }
      if (profileData.email && !baseService.isValidEmail(profileData.email)) {
        return { success: false, message: "Invalid email format" };
      }
      if (
        profileData.status &&
        !["ACTIVE", "INACTIVE", "SUSPENDED"].includes(profileData.status)
      ) {
        return { success: false, message: "Invalid status" };
      }

      // Kirim hanya data profil
      const result = await dataService.users.update(id, profileData);
      if (!result.success) return result;

      // ✅ Handle avatar berdasarkan mode
      if (isAvatarRemoved) {
        if (isProfileMode) {
          await usersService.deleteAvatarSelf();
        } else {
          await usersService.deleteAvatarById(id);
        }
      } else if (avatar instanceof File) {
        if (isProfileMode) {
          await usersService.uploadAvatarSelf(avatar);
        } else {
          await usersService.uploadAvatarById(id, avatar);
        }
      }

      // ✅ Ambil data terbaru untuk memastikan avatar & profil sinkron
      const freshUser = await dataService.users.getById(id);
      if (freshUser.success) {
        result.data = usersService.processSingleUser(freshUser.data);
      }

      return result;
    } catch (error) {
      console.error("Error in update user:", error);
      return {
        success: false,
        message: "Ops! We couldn't update the user. Please try again",
      };
    }
  },

  // ===================================================================
  // GET CURRENT USER (Tidak berubah)
  // ===================================================================
  getCurrentUser: async () => {
    try {
      const result = await dataService.users.getCurrentUser();
      if (!result.success) {
        console.error("❌ usersService: Failed to fetch current user");
        return result;
      }
      const processedUser = usersService.processSingleUser(result.data);
      return { success: true, data: processedUser };
    } catch (error) {
      console.error("❌ usersService: Error fetching current user:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the user. Please try again",
      };
    }
  },

  // ===================================================================
  // GET PAGINATED USERS
  // ===================================================================
  getPaginated: async (
    page = 1,
    limit = 8,
    search = "",
    bypassCache = false
  ) => {
    try {
      const params = {
        page,
        limit,
        search,
        deletedAt: null,
        bypassCache,
      };

      const result = await dataService.users.getAll(params);

      if (!result.success) {
        return result;
      }

      const processedUsers = usersService.processList(result.data);

      return {
        success: true,
        data: processedUsers,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in getPaginated:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the users. Please try again.",
      };
    }
  },

  // ===================================================================
  // SOFT DELETE USER
  // ===================================================================
  softDelete: async (id) => {
    try {
      const result = await dataService.users.softDelete(id);
      return result;
    } catch (error) {
      console.error(`Failed to delete user with ID ${id}:`, error);
      return {
        success: false,
        message: "Oops! We couldn't delete the user. Please try again.",
      };
    }
  },

  // ===================================================================
  // HARD DELETE USER
  // ===================================================================
  hardDelete: async (id) => {
    try {
      const result = await dataService.users.hardDelete(id);

      if (result.success) {
        return {
          success: true,
          message: "User successfully deleted permanently",
        };
      }
      return result;
    } catch (error) {
      console.error("Error in delete user:", error);
      return {
        success: false,
        message:
          "Oops! We couldn't delete the user permanently. Please try again.",
      };
    }
  },

  // ===================================================================
  // GET USER BY ID
  // ===================================================================
  getById: async (id) => {
    try {
      const result = await dataService.users.getById(id);

      if (result.success && result.data) {
        result.data = usersService.processSingleUser(result.data);
      }

      return result;
    } catch (error) {
      console.error("Error in getById:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the user details. Please try again.",
      };
    }
  },

  // ===================================================================
  // GET TOTAL COUNT
  // ===================================================================
  getTotalCount: async () => {
    try {
      const result = await dataService.users.getAll({
        page: 1,
        limit: 1,
        bypassCache: true,
      });
      if (!result.success) {
        return { success: false, total: 0 };
      }
      return {
        success: true,
        total: result.pagination?.totalItems || 0,
      };
    } catch (error) {
      console.error("Error in usersService.getTotalCount:", error);
      return { success: false, total: 0 };
    }
  },
};
