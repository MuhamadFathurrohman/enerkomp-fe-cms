import { dataService } from "./dataService";
import { baseService } from "./baseService";

const COMMON_RESOURCES = [
  "user",
  "client",
  "analytics",
  "blog",
  "gallery",
  "product",
  "category",
  "brand",
  "audit_log",
  "catalog",
];
const ALL_VALID_RESOURCES = [...COMMON_RESOURCES];
const VALID_ACCESS_LEVELS = ["none", "read", "manage"];

export const roleService = {
  getAllResources(isSuperAdmin = false) {
    return isSuperAdmin ? ALL_VALID_RESOURCES : COMMON_RESOURCES;
  },

  processList: (roles) => {
    return roles.map((role) => ({
      ...role,
      createdAtFormatted: baseService.formatDate(role.createdAt),
      updatedAtFormatted: baseService.formatDate(role.updatedAt),
      permissionCount: role.permissions ? role.permissions.length : 0,
    }));
  },

  getAll: async () => {
    try {
      const result = await dataService.roles.getAll({ deletedAt: null });
      if (!result.success) return result;

      const processedRoles = roleService.processList(result.data);
      return {
        success: true,
        data: processedRoles,
      };
    } catch (error) {
      console.error("Error in getAll roles:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the roles. Please try again.",
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

      if (filters.isSystem !== undefined) {
        params.isSystem = filters.isSystem;
      }

      const result = await dataService.roles.getAll(params);

      if (!result.success) {
        return result;
      }

      const processedRoles = roleService.processList(result.data);

      return {
        success: true,
        data: processedRoles,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in getPaginated roles:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the roles. Please try again.",
      };
    }
  },

  create: async (roleData, permissions, isSuperAdmin = false) => {
    try {
      if (!roleData.name || roleData.name.trim() === "") {
        return {
          success: false,
          message: "Please enter a role name",
        };
      }

      if (!Array.isArray(permissions)) {
        return {
          success: false,
          message: "Something went wrong with permissions format",
        };
      }

      // Validasi permissions
      for (const perm of permissions) {
        const { resource, action } = perm;

        if (!ALL_VALID_RESOURCES.includes(resource)) {
          return {
            success: false,
            message: `'${resource}' is not a valid resource`,
          };
        }

        if (!VALID_ACCESS_LEVELS.includes(action)) {
          return {
            success: false,
            message: `Invalid permission for ${resource}. Please choose: None, Read, or Manage`,
          };
        }

        if (resource === "role" && !isSuperAdmin) {
          return {
            success: false,
            message: "Only Super Admins can manage role permissions",
          };
        }
      }

      const validPermissions = permissions.filter(
        (perm) => perm.action !== "none"
      );

      const rolePayload = {
        name: roleData.name.trim(),
        description: roleData.description?.trim() || null,
        permissions: validPermissions,
      };

      const createResult = await dataService.roles.create(rolePayload);

      if (!createResult.success) {
        return createResult;
      }

      return {
        success: true,
        data: createResult.data,
        message: "Role created successfully!",
      };
    } catch (error) {
      console.error("Error in create role:", error);
      return {
        success: false,
        message: "Oops! We couldn't create the role. Please try again.",
      };
    }
  },

  update: async (id, roleData, permissions, isSuperAdmin = false) => {
    try {
      if (!roleData.name || roleData.name.trim() === "") {
        return {
          success: false,
          message: "Please enter a role name",
        };
      }

      if (!Array.isArray(permissions)) {
        return {
          success: false,
          message: "Something went wrong with permissions format",
        };
      }

      // Validasi permissions
      for (const perm of permissions) {
        const { resource, action } = perm;

        if (!ALL_VALID_RESOURCES.includes(resource)) {
          return {
            success: false,
            message: `'${resource}' is not a valid resource`,
          };
        }

        if (!VALID_ACCESS_LEVELS.includes(action)) {
          return {
            success: false,
            message: `Invalid permission for ${resource}. Please choose: None, Read, or Manage`,
          };
        }

        if (resource === "role" && !isSuperAdmin) {
          return {
            success: false,
            message: "Only Super Admin can manage role permissions",
          };
        }
      }

      const validPermissions = permissions.filter(
        (perm) => perm.action !== "none"
      );

      const updatePayload = {
        name: roleData.name.trim(),
        description: roleData.description?.trim() || null,
        permissions: validPermissions,
      };

      const updateResult = await dataService.roles.update(id, updatePayload);

      if (!updateResult.success) {
        return updateResult;
      }

      return {
        success: true,
        data: updateResult.data,
        message: "Role successfully updated",
      };
    } catch (error) {
      console.error("Error in update role:", error);
      return {
        success: false,
        message: "Oops! We couldn't update the role. Please try again.",
      };
    }
  },

  softDelete: async (id, isSuperAdmin = false, roleResult) => {
    try {
      const role = roleResult.data;
      if (role && !isSuperAdmin) {
        return { success: false, message: "Can't delete system role" };
      }

      const result = await dataService.roles.softDelete(id);

      if (result.success) {
        return {
          success: true,
          message: "Role successfully deleted",
        };
      }
      return result;
    } catch (error) {
      console.error("Error in delete role:", error);
      return {
        success: false,
        message: "Oops! We couldn't delete the role. Please try again.",
      };
    }
  },

  hardDelete: async (id, isSuperAdmin = false, roleResult, isSystem) => {
    try {
      const role = roleResult.data;
      if (role && !isSuperAdmin) {
        return { success: false, message: "Can't delete system role" };
      }

      const result = await dataService.roles.hardDelete(id);

      if (result.success) {
        return {
          success: true,
          message: "Role successfully deleted permanently",
        };
      }
      return result;
    } catch (error) {
      console.error("Error in delete role:", error);
      return {
        success: false,
        message:
          "Oops! We couldn't delete the role permanently. Please try again.",
      };
    }
  },

  getById: async (id, isSuperAdmin = false) => {
    try {
      const roleResult = await dataService.roles.getById(id);
      if (!roleResult.success) return roleResult;

      const embeddedPermissions = roleResult.data.permissions || [];

      const savedPermMap = new Map();
      embeddedPermissions.forEach((p) => {
        savedPermMap.set(p.resource, p.action);
      });

      const allResources = roleService.getAllResources(isSuperAdmin);
      const fullPermissions = allResources.map((resource) => ({
        resource,
        action: savedPermMap.get(resource) || "none",
      }));

      const roleWithPermissions = {
        ...roleResult.data,
        permissions: fullPermissions,
        rawPermissions: embeddedPermissions,
      };

      const processedRole = roleService.processList([roleWithPermissions])[0];

      return {
        success: true,
        data: processedRole,
      };
    } catch (error) {
      console.error("Error in getById role:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the role details. Please try again.",
      };
    }
  },

  getResourceList(isSuperAdmin = false) {
    return roleService.getAllResources(isSuperAdmin);
  },
};
