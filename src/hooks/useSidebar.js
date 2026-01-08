// src/hooks/useSidebar.js
import { useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSidebarContext } from "../contexts/SidebarContext";
import {
  filterMenuByPermission,
  findMenuByPath,
  sidebarMenuConfig,
} from "../config/sidebarConfig";

export const useSidebar = (currentPath) => {
  const { user } = useAuth();

  const {
    collapsed,
    activeSubmenu,
    toggleSubmenu,
    toggleSidebar,
    closeAllSubmenus,
  } = useSidebarContext();

  // FILTER MENU BERDASARKAN PERMISSION (BUKAN ROLE)
  const menuItems = useMemo(() => {
    return filterMenuByPermission(sidebarMenuConfig, user?.permissions);
  }, [user?.permissions]);

  // Cari menu aktif berdasarkan path
  const activeMenu = useMemo(() => {
    return currentPath ? findMenuByPath(menuItems, currentPath) : null;
  }, [menuItems, currentPath]);

  // Toggle sidebar collapse
  const toggleCollapse = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  return {
    // State dari context
    collapsed,
    activeSubmenu,

    // Nilai yang dihitung
    menuItems,
    activeMenu,

    // Fungsi aksi
    toggleCollapse,
    toggleSubmenu,
    closeAllSubmenus,
  };
};
