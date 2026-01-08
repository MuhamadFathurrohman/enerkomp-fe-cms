// contexts/SidebarContext.jsx (ENHANCED VERSION)
import React, { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext();

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Active submenu state
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Auto close mobile sidebar when clicking outside or navigating
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && mobileOpen) {
        const sidebar = document.querySelector(".sidebar");
        if (
          sidebar &&
          !sidebar.contains(event.target) &&
          !event.target.closest(".mobile-menu-toggle")
        ) {
          setMobileOpen(false);
        }
      }
    };

    if (isMobile && mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, mobileOpen]);

  // Clear submenu when switching to collapsed mode (desktop)
  useEffect(() => {
    if (collapsed && !isMobile) {
      // When collapsed (desktop), close regular submenus
      setActiveSubmenu(null);
    }
  }, [collapsed, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Enhanced toggle submenu function
  const toggleSubmenu = (menuId) => {
    setActiveSubmenu((prev) => {
      // If clicking the same submenu, close it
      if (prev === menuId) {
        return null;
      }
      // Otherwise, open the new submenu (closes previous one automatically)
      return menuId;
    });
  };

  // Function to close all submenus
  const closeAllSubmenus = () => {
    setActiveSubmenu(null);
  };

  // Function to check if a specific submenu is open
  const isSubmenuOpen = (menuId) => {
    return activeSubmenu === menuId;
  };

  const value = {
    // Core sidebar state
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen,
    isMobile,

    // Actions
    toggleSidebar,
    closeMobileSidebar,

    // Enhanced submenu state and actions
    activeSubmenu,
    setActiveSubmenu,
    toggleSubmenu,
    closeAllSubmenus,
    isSubmenuOpen,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};
