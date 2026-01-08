// hooks/useSidebarOverlay.js (FIXED VERSION)
import { useCallback } from "react";
import { useOverlay, OVERLAY_TYPES } from "../contexts/OverlayContext";
import { useSidebarContext } from "../contexts/SidebarContext";

export const useSidebarOverlay = () => {
  const { showOverlay, hideOverlay, clearAllOverlays } = useOverlay();
  const { collapsed, isMobile, closeMobileSidebar } = useSidebarContext();

  // Show expanding label
  const showExpandingLabel = useCallback(
    (itemId, label, position) => {
      if (collapsed && !isMobile) {
        showOverlay(`expanding-label-${itemId}`, {
          type: OVERLAY_TYPES.EXPANDING_LABEL,
          content: { label },
          position,
        });
      }
    },
    [collapsed, isMobile, showOverlay]
  );

  // Hide expanding label
  const hideExpandingLabel = useCallback(
    (itemId) => {
      hideOverlay(`expanding-label-${itemId}`);
    },
    [hideOverlay]
  );

  // FIXED: Hide all submenu overlays (for when mouse enters different nav item)
  const hideAllSubmenuOverlays = useCallback(() => {
    // Get all overlays and hide only submenu overlays
    const allOverlays = document.querySelectorAll(
      '[data-overlay-type="submenu-overlay"]'
    );
    allOverlays.forEach((overlay) => {
      const overlayId = overlay.getAttribute("data-overlay-id");
      if (overlayId) {
        hideOverlay(overlayId);
      }
    });
  }, [hideOverlay]);

  // Show submenu overlay for collapsed sidebar
  const showSubmenuOverlay = useCallback(
    (item, position, handlers = {}) => {
      if (collapsed && !isMobile) {
        // FIXED: Hide all other submenu overlays first
        hideAllSubmenuOverlays();

        showOverlay(`submenu-overlay-${item.id}`, {
          type: OVERLAY_TYPES.SUBMENU_OVERLAY,
          content: {
            submenuItems: item.submenu,
            parentLabel: item.label,
          },
          position,
          onMouseEnter: handlers.onMouseEnter || (() => {}),
          onMouseLeave: handlers.onMouseLeave || (() => {}),
        });
      }
    },
    [collapsed, isMobile, showOverlay, hideAllSubmenuOverlays]
  );

  // Hide submenu overlay
  const hideSubmenuOverlay = useCallback(
    (itemId) => {
      hideOverlay(`submenu-overlay-${itemId}`);
    },
    [hideOverlay]
  );

  // Handle submenu click - close mobile sidebar and clear overlays
  const handleSubmenuNavigation = useCallback(() => {
    if (isMobile) {
      closeMobileSidebar();
    }
    clearAllOverlays();
  }, [isMobile, closeMobileSidebar, clearAllOverlays]);

  // Get position from mouse event
  const getPositionFromEvent = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.right,
    };
  }, []);

  // OPTIMIZED: More precise mouse over detection
  const isMouseOverElement = useCallback((mouseEvent, elementSelector) => {
    const element = document.querySelector(elementSelector);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const mouseX = mouseEvent.clientX || mouseEvent.pageX;
    const mouseY = mouseEvent.clientY || mouseEvent.pageY;

    return (
      mouseX >= rect.left &&
      mouseX <= rect.right &&
      mouseY >= rect.top &&
      mouseY <= rect.bottom
    );
  }, []);

  // FIXED: More precise mouse leave detection for specific nav item
  const isMouseOverSpecificNavItem = useCallback(
    (mouseEvent, itemId) => {
      const navItemSelector = `[data-nav-item-id="${itemId}"]`;
      return isMouseOverElement(mouseEvent, navItemSelector);
    },
    [isMouseOverElement]
  );

  // FIXED: Smart mouse leave handler with better logic
  const handleSubmenuMouseLeave = useCallback(
    (itemId, mouseEvent, delay = 100) => {
      // Reduced delay from 150ms to 100ms
      setTimeout(() => {
        // More specific selectors
        const specificNavItemSelector = `[data-nav-item-id="${itemId}"]`;
        const submenuSelector = `[data-overlay-id="submenu-overlay-${itemId}"]`;

        const isOverSpecificNavItem = isMouseOverElement(
          mouseEvent,
          specificNavItemSelector
        );
        const isOverSubmenu = isMouseOverElement(mouseEvent, submenuSelector);

        // FIXED: Only keep overlay if mouse is over the SPECIFIC nav item or its submenu
        if (!isOverSpecificNavItem && !isOverSubmenu) {
          hideSubmenuOverlay(itemId);
        }
      }, delay);
    },
    [hideSubmenuOverlay, isMouseOverElement]
  );

  // FIXED: Handle mouse enter for nav items (hide other overlays when entering different nav item)
  const handleNavItemMouseEnter = useCallback(
    (item, position) => {
      if (collapsed && !isMobile) {
        // Always hide all expanding labels first when entering any nav item
        const allExpandingLabels = document.querySelectorAll(
          '[data-overlay-type="expanding-label"]'
        );
        allExpandingLabels.forEach((overlay) => {
          const overlayId = overlay.getAttribute("data-overlay-id");
          if (overlayId && !overlayId.includes(item.id)) {
            hideOverlay(overlayId);
          }
        });

        if (item.submenu && item.submenu.length > 0) {
          // Show submenu overlay (this will hide others automatically)
          showSubmenuOverlay(item, position, {
            onMouseLeave: (mouseEvent) =>
              handleSubmenuMouseLeave(item.id, mouseEvent),
          });
        } else {
          // Hide all submenu overlays when entering non-submenu item
          hideAllSubmenuOverlays();
          // Show expanding label
          showExpandingLabel(item.id, item.label, position);
        }
      }
    },
    [
      collapsed,
      isMobile,
      showSubmenuOverlay,
      showExpandingLabel,
      hideOverlay,
      hideAllSubmenuOverlays,
      handleSubmenuMouseLeave,
    ]
  );

  return {
    // State
    collapsed,
    isMobile,

    // Label methods
    showExpandingLabel,
    hideExpandingLabel,

    // Submenu methods
    showSubmenuOverlay,
    hideSubmenuOverlay,
    hideAllSubmenuOverlays, // NEW: Added for cleaning all submenu overlays

    // Navigation
    handleSubmenuNavigation,

    // FIXED: Enhanced mouse handling
    handleNavItemMouseEnter, // NEW: Better mouse enter handling
    getPositionFromEvent,
    handleSubmenuMouseLeave,
  };
};
