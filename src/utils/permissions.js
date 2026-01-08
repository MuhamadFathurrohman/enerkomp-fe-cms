export const canRead = (userPermissions, resource) => {
  // ✅ Jika resource null/undefined, beri akses (karena berarti "tidak perlu permission")
  if (resource === null || resource === undefined) {
    return true;
  }

  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  const perm = userPermissions.find((p) => p.resource === resource);
  if (!perm) return false;

  return perm.access === "read" || perm.access === "manage";
};

export const canManage = (userPermissions, resource) => {
  if (!userPermissions || !Array.isArray(userPermissions) || !resource) {
    return false;
  }

  const perm = userPermissions.find((p) => p.resource === resource);
  return perm?.access === "manage";
};

export const canExport = (userPermissions, resource) => {
  const exportableResources = [
    "user",
    "client",
    "analytics",
    "brand",
    "product",
  ];
  if (!exportableResources.includes(resource)) {
    return false;
  }
  return canRead(userPermissions, resource);
};

export const hasPermission = (userPermissions, requiredPermission) => {
  if (requiredPermission === null || requiredPermission === undefined) {
    return true;
  }

  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  const { resource, access } = requiredPermission;
  return access === "read"
    ? canRead(userPermissions, resource)
    : canManage(userPermissions, resource);
};

export const isSuperAdmin = (user) => {
  return user?.roleName === "super_admin";
};
