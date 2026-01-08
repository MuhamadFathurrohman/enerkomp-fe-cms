// src/components/Layout.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { SidebarProvider, useSidebarContext } from "../contexts/SidebarContext";
import { OverlayProvider, useOverlay } from "../contexts/OverlayContext";
import { ModalProvider } from "../contexts/ModalContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import SessionExpiredAlert from "./Alerts/SessionExpiredAlert";
import "../sass/components/Layout/Layout.css";
import "../sass/components/Overlays/SubmenuOverlay/SubmenuOverlay.css";
import "../sass/components/Overlays/ExpandingLabel/ExpandingLabel.css";
import "../sass/components/Overlays/LoaderOverlay/LoaderOverlay.css";
import "../sass/components/Overlays/EmailTooltip/EmailTooltip.css";

const LayoutContent = () => {
  const {
    isInitialized,
    user,
    logout,
    sessionExpired,
    sessionExpiredTooLong,
    extendSession,
    updateUser,
  } = useAuth();
  const navigate = useNavigate();
  const { collapsed, isMobile } = useSidebarContext();
  const { showOverlay, hideOverlay } = useOverlay();

  const [isExtending, setIsExtending] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Local state untuk user (optional, jika perlu immediate update)
  const [currentUser, setCurrentUser] = useState(user);

  // Sync currentUser dengan user dari AuthContext
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  // ======================================================
  // APP INITIALIZATION LOADER
  // ======================================================
  useEffect(() => {
    if (!isInitialized) {
      showOverlay("app-loader", {
        type: "loader-overlay",
        content: {},
        position: { top: 0, left: 0 },
      });
    } else {
      hideOverlay("app-loader");
    }
  }, [isInitialized, showOverlay, hideOverlay]);

  // ======================================================
  // ✅ USER UPDATE HANDLER untuk TopBar
  // ======================================================
  const handleUserUpdate = useCallback(
    (updatedUser) => {
      // Update local state untuk immediate feedback
      setCurrentUser(updatedUser);

      // Update AuthContext jika ada method updateUser
      if (updateUser && typeof updateUser === "function") {
        updateUser(updatedUser);
      }
    },
    [updateUser]
  );

  // ======================================================
  // EXTEND SESSION HANDLER
  // ======================================================
  const handleExtend = async () => {
    setIsExtending(true);
    try {
      await extendSession();
    } catch (error) {
      console.error("❌ Failed to extend session:", error);
    } finally {
      setIsExtending(false);
    }
  };

  // ======================================================
  // LOGOUT HANDLER
  // ======================================================
  const handleGoToLogin = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("❌ Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ======================================================
  // SIDEBAR CLASSES
  // ======================================================
  const getMainContentClass = () => {
    let classes = ["main-content"];
    if (!isMobile && collapsed) {
      classes.push("sidebar-collapsed");
    }
    return classes.join(" ");
  };

  return (
    <>
      <div className="layout-container">
        <Sidebar />
        <div className={getMainContentClass()}>
          <TopBar
            user={currentUser}
            onLogout={handleGoToLogin}
            onUserUpdate={handleUserUpdate} // ✅ Pass callback ke TopBar
          />
          <main className="page-content">
            <div className="content-wrapper">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* ✅ SESSION EXPIRED ALERT dengan Grace Period Support */}
      <SessionExpiredAlert
        isVisible={sessionExpired}
        onExtend={handleExtend}
        onGoToLogin={handleGoToLogin}
        isExtending={isExtending}
        isLoggingOut={isLoggingOut}
        sessionExpiredTooLong={sessionExpiredTooLong}
      />
    </>
  );
};

const Layout = () => {
  return (
    <SidebarProvider>
      <OverlayProvider>
        <ModalProvider>
          <LayoutContent />
        </ModalProvider>
      </OverlayProvider>
    </SidebarProvider>
  );
};

export default Layout;
