// contexts/OverlayContext.jsx (CLEANED VERSION)
import React, { createContext, useContext, useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import LoaderMain from "../components/Loaders/LoaderMain";

const OverlayContext = createContext();

// Overlay types enum
export const OVERLAY_TYPES = {
  EXPANDING_LABEL: "expanding-label",
  SUBMENU_OVERLAY: "submenu-overlay",
  SUBMENU_REGULAR: "submenu-regular",
  EMAIL_TOOLTIP: "email-tooltip",
  LOADER_OVERLAY: "loader-overlay",
};

// Base z-index values
const Z_INDEX_BASE = {
  EXPANDING_LABEL: 1000,
  SUBMENU_OVERLAY: 1100,
  SUBMENU_REGULAR: 900,
  LOADER_OVERLAY: 9999,
};

const EmailTooltipOverlay = ({ overlay }) => (
  <div
    className="email-tooltip-overlay"
    data-overlay-id={overlay.id}
    data-overlay-type={overlay.type}
    style={{
      position: "fixed",
      top: `${overlay.position.top}px`,
      left: `${overlay.position.left}px`,
      zIndex: overlay.zIndex,
      transform: "translate(-50%, -100%)", // Rata tengah atas
      marginTop: "-8px", // Jarak dari elemen target
    }}
  >
    <div className="email-tooltip">
      <span className="tooltip-text">{overlay.content.email}</span>
    </div>
  </div>
);

// Overlay components
const ExpandingLabelOverlay = ({ overlay }) => (
  <div
    className="expanding-label-overlay"
    data-overlay-id={overlay.id}
    data-overlay-type={overlay.type}
    style={{
      position: "fixed",
      top: `${overlay.position.top}px`,
      left: `${overlay.position.left}px`,
      zIndex: overlay.zIndex,
    }}
  >
    <div className="expanding-label">
      <span className="label-text">{overlay.content.label}</span>
    </div>
  </div>
);

const SubmenuOverlayComponent = ({ overlay, onSubmenuClick }) => (
  <div
    className="submenu-overlay-container"
    data-overlay-id={overlay.id}
    data-overlay-type={overlay.type}
    style={{
      position: "fixed",
      top: `${overlay.position.top}px`,
      left: `${overlay.position.left}px`,
      zIndex: overlay.zIndex,
    }}
    onMouseEnter={overlay.onMouseEnter}
    onMouseLeave={overlay.onMouseLeave}
  >
    <ul className="submenu-list submenu-overlay">
      {overlay.content.submenuItems.map((subItem) => (
        <li key={subItem.id} className="submenu-item">
          <NavLink
            to={subItem.path}
            className={({ isActive }) =>
              `submenu-link ${isActive ? "active" : ""}`
            }
            onClick={onSubmenuClick}
          >
            <span className="submenu-label">{subItem.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  </div>
);

const LoaderOverlay = ({ overlay }) => (
  <div
    className="loader-overlay"
    data-overlay-id={overlay.id}
    data-overlay-type={overlay.type}
  >
    <LoaderMain variant="light" size={180} />
  </div>
);

// Overlay Renderer Component
const OverlayRenderer = ({ overlays, onSubmenuClick }) => {
  return (
    <>
      {overlays.map((overlay) => {
        switch (overlay.type) {
          case OVERLAY_TYPES.EXPANDING_LABEL:
            return <ExpandingLabelOverlay key={overlay.id} overlay={overlay} />;

          case OVERLAY_TYPES.SUBMENU_OVERLAY:
            return (
              <SubmenuOverlayComponent
                key={overlay.id}
                overlay={overlay}
                onSubmenuClick={onSubmenuClick}
              />
            );

          case OVERLAY_TYPES.EMAIL_TOOLTIP:
            return <EmailTooltipOverlay key={overlay.id} overlay={overlay} />;

          case OVERLAY_TYPES.LOADER_OVERLAY:
            return <LoaderOverlay key={overlay.id} overlay={overlay} />;

          default:
            return null;
        }
      })}
    </>
  );
};

// CLEANED: Overlay Provider Component - Removed unused functions
export const OverlayProvider = ({ children, onSubmenuClick }) => {
  const [overlays, setOverlays] = useState(new Map());

  const showOverlay = useCallback((id, config) => {
    setOverlays((prev) => {
      const newMap = new Map(prev);

      // Auto assign z-index based on type
      const zIndex =
        Z_INDEX_BASE[config.type.toUpperCase().replace("-", "_")] || 1000;

      newMap.set(id, {
        id,
        zIndex: zIndex + newMap.size,
        createdAt: Date.now(),
        ...config,
      });

      return newMap;
    });
  }, []);

  const hideOverlay = useCallback((id) => {
    setOverlays((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const clearAllOverlays = useCallback(() => {
    setOverlays(new Map());
  }, []);

  const contextValue = {
    overlays: Array.from(overlays.values()),
    showOverlay,
    hideOverlay,
    clearAllOverlays,
  };

  return (
    <OverlayContext.Provider value={contextValue}>
      {children}
      <OverlayRenderer
        overlays={Array.from(overlays.values())}
        onSubmenuClick={onSubmenuClick}
      />
    </OverlayContext.Provider>
  );
};

// Custom hook - CLEANED
export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return context;
};
