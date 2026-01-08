// src/config/sidebarConfig.jsx
import HomeIcon from "../assets/icons/Home.svg";
import UsersIcon from "../assets/icons/Users.svg";
import ClientIcon from "../assets/icons/Client.svg";
import AnalyticIcon from "../assets/icons/Analytic.svg";
import ContentIcon from "../assets/icons/Content.svg";
import AuditIcon from "../assets/icons/Audit.svg";
import SettingsIcon from "../assets/icons/Settings.svg";
import LogOutIcon from "../assets/icons/LogOut.svg";
import ArrowDownIcon from "../assets/icons/ArrowDown.svg";
import ProductsIcon from "../assets/icons/Product.svg";
import CatalogIcon from "../assets/icons/Catalog.svg";
import ShieldIcon from "../assets/icons/Shield.svg";
import { canRead } from "../utils/permissions";

// 🔸 MENU UTAMA — BERBASIS PERMISSION
export const sidebarMenuConfig = [
  {
    id: "home",
    path: "/dashboard/home",
    icon: HomeIcon,
    label: "Home",
    requiredPermission: null,
    category: "main",
  },
  {
    id: "users",
    path: "/dashboard/users",
    icon: UsersIcon,
    label: "Users",
    requiredPermission: "user",
    category: "management",
  },
  {
    id: "roles",
    path: "/dashboard/roles",
    icon: ShieldIcon,
    label: "Roles & Permissions",
    requiredPermission: "role",
    category: "system",
  },
  {
    id: "clients",
    path: "/dashboard/clients",
    icon: ClientIcon,
    label: "Clients",
    requiredPermission: "client",
    category: "management",
  },
  {
    id: "catalog",
    path: "/dashboard/catalog",
    icon: CatalogIcon,
    label: "Catalog",
    requiredPermission: "catalog",
    category: "management",
  },
  {
    id: "analytics",
    path: "/dashboard/analytics",
    icon: AnalyticIcon,
    label: "Analytics",
    requiredPermission: "analytics",
    category: "insights",
  },
  {
    id: "content",
    path: "/dashboard/content",
    icon: ContentIcon,
    label: "Content",
    requiredPermission: "blog",
    category: "management",
    hasSubmenu: true,
    submenu: [
      {
        id: "gallery",
        path: "/dashboard/content/gallery",
        label: "Gallery",
        requiredPermission: "gallery",
      },
      {
        id: "blogs",
        path: "/dashboard/content/blogs",
        label: "Blogs",
        requiredPermission: "blog",
      },
    ],
  },
  {
    id: "products",
    path: "/dashboard/products",
    icon: ProductsIcon,
    label: "Products",
    requiredPermission: "product",
    category: "management",
    hasSubmenu: true,
    submenu: [
      {
        id: "categories",
        path: "/dashboard/products/categories",
        label: "Categories",
        requiredPermission: "category",
      },
      {
        id: "brands",
        path: "/dashboard/products/brands",
        label: "Brands & Clients",
        requiredPermission: "brand",
      },
      {
        id: "items",
        path: "/dashboard/products/items",
        label: "Items",
        requiredPermission: "product",
      },
    ],
  },
  {
    id: "auditlog",
    path: "/dashboard/auditlog",
    icon: AuditIcon,
    label: "Audit Log",
    requiredPermission: "audit_log",
    category: "system",
  },
];

// Icon configuration
export const iconConfig = {
  Home: HomeIcon,
  Users: UsersIcon,
  Client: ClientIcon,
  Analytic: AnalyticIcon,
  Content: ContentIcon,
  Products: ProductsIcon,
  Audit: AuditIcon,
  Settings: SettingsIcon,
  LogOut: LogOutIcon,
  ArrowDown: ArrowDownIcon,
};

// Brand configuration
export const brandConfig = {
  brandName: "ENERKOMP PERSADA RAYA",
  shortName: "EPR",
};

// Sidebar behavior configuration
export const sidebarConfig = {
  collapsedWidth: 70,
  expandedWidth: 280,
  animationDuration: "0.3s",
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200,
  },
};

// 🔸 FILTER BERDASARKAN PERMISSION (BUKAN ROLE NAME)
export const filterMenuByPermission = (menuItems, userPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return [];
  }

  return menuItems
    .map((item) => {
      let filteredSubmenu = [];
      if (item.submenu) {
        filteredSubmenu = item.submenu.filter((subItem) =>
          canRead(userPermissions, subItem.requiredPermission)
        );
      }

      if (item.hasSubmenu) {
        if (filteredSubmenu.length > 0) {
          return { ...item, submenu: filteredSubmenu };
        }
        if (canRead(userPermissions, item.requiredPermission)) {
          return { ...item, submenu: [] };
        }
        return null;
      }

      return canRead(userPermissions, item.requiredPermission) ? item : null;
    })
    .filter(Boolean);
};

// Utility functions lain tetap sama
export const getMenuByCategory = (menuItems, category) => {
  return menuItems.filter((item) => item.category === category);
};

export const findMenuByPath = (menuItems, path) => {
  let foundItem = menuItems.find((item) => item.path === path);

  if (!foundItem) {
    for (const item of menuItems) {
      if (item.submenu) {
        foundItem = item.submenu.find((subItem) => subItem.path === path);
        if (foundItem) {
          return { parent: item, submenu: foundItem };
        }
      }
    }
  }

  return foundItem;
};

export const hasSubmenu = (menuItem) => {
  return menuItem.hasSubmenu && menuItem.submenu && menuItem.submenu.length > 0;
};

export const isMenuActive = (menuItem, currentPath) => {
  if (menuItem.path === currentPath) {
    return true;
  }

  if (menuItem.submenu) {
    return menuItem.submenu.some((subItem) => subItem.path === currentPath);
  }

  return false;
};
