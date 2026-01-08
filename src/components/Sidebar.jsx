// components/Sidebar.jsx (ENHANCED ANIMATION VERSION)
import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../hooks/useSidebar";
import { useSidebarContext } from "../contexts/SidebarContext";
import { useSidebarOverlay } from "../hooks/useSidebarOverlay";
import { brandConfig, hasSubmenu, iconConfig } from "../config/sidebarConfig";
import Logo from "../assets/images/logo1.png";
import PulseDots from "../components/Loaders/PulseDots";
import "../sass/components/Sidebar/Sidebar.css";

const Sidebar = () => {
  const { logout } = useAuth();
  const { menuItems } = useSidebar();
  const { mobileOpen, closeMobileSidebar, activeSubmenu, setActiveSubmenu } =
    useSidebarContext();

  const {
    collapsed,
    isMobile,
    showExpandingLabel,
    hideExpandingLabel,
    handleNavItemMouseEnter,
    handleSubmenuNavigation,
    getPositionFromEvent,
    handleSubmenuMouseLeave,
  } = useSidebarOverlay();

  // State untuk mengelola animasi closing
  const [closingSubmenu, setClosingSubmenu] = useState(null);
  const [submenuTimeouts, setSubmenuTimeouts] = useState({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Ref untuk mendeteksi klik di luar submenu
  const sidebarRef = useRef(null);
  const handleClickOutsideRef = useRef();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Enhanced submenu closing dengan animasi
  const closeSubmenuWithAnimation = (submenuId) => {
    if (submenuId && activeSubmenu === submenuId) {
      setClosingSubmenu(submenuId);

      if (submenuTimeouts[submenuId]) {
        clearTimeout(submenuTimeouts[submenuId]);
      }

      const timeoutId = setTimeout(() => {
        // Pastikan submenu masih dalam proses closing
        if (closingSubmenu === submenuId) {
          setActiveSubmenu(null);
          setClosingSubmenu(null);
        }
        setSubmenuTimeouts((prev) => {
          const newTimeouts = { ...prev };
          delete newTimeouts[submenuId];
          return newTimeouts;
        });
      }, 350);

      setSubmenuTimeouts((prev) => ({
        ...prev,
        [submenuId]: timeoutId,
      }));
    }
  };

  // Handler untuk menutup submenu saat klik di luar
  useEffect(() => {
    handleClickOutsideRef.current = (event) => {
      // 🔥 Tambahkan pengecekan tambahan: apakah event target adalah bagian dari modal?
      // Ini adalah solusi alternatif jika stopPropagation tidak cukup
      if (
        event.target.closest(".modal-overlay") ||
        event.target.closest(".modal-content") ||
        event.target.closest(".modal-backdrop") // Jika modal Anda menggunakan class ini
      ) {
        // Jangan tutup sidebar jika klik di dalam modal
        return;
      }

      if (
        activeSubmenu &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        closeSubmenuWithAnimation(activeSubmenu);
      }
    };
  }, [activeSubmenu]);

  useEffect(() => {
    const handleClick = (event) => {
      if (handleClickOutsideRef.current) {
        handleClickOutsideRef.current(event);
      }
    };

    if (activeSubmenu) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [activeSubmenu]);

  // Cleanup timeouts saat component unmount
  useEffect(() => {
    return () => {
      Object.values(submenuTimeouts).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, [submenuTimeouts]);

  const handleMenuClick = (item, e) => {
    if (hasSubmenu(item)) {
      e.preventDefault();

      if (collapsed && !isMobile) {
        return;
      }

      if (closingSubmenu === item.id) {
        // Batalkan timeout penutupan
        if (submenuTimeouts[item.id]) {
          clearTimeout(submenuTimeouts[item.id]);
          setSubmenuTimeouts((prev) => {
            const newTimeouts = { ...prev };
            delete newTimeouts[item.id];
            return newTimeouts;
          });
        }
        // Reset state closing
        setClosingSubmenu(null);
        // Langsung buka kembali
        setActiveSubmenu(item.id);
        return; // Keluar dari fungsi
      }

      if (activeSubmenu === item.id) {
        // Tutup submenu yang sama
        closeSubmenuWithAnimation(item.id);
      } else {
        // 🔹 BERSIHKAN SUBMENU SEBELUMNYA (termasuk yang sedang closing)
        // Batalkan *semua* timeout yang ada
        Object.values(submenuTimeouts).forEach((timeoutId) => {
          clearTimeout(timeoutId);
        });
        setSubmenuTimeouts({}); // Kosongkan state timeouts
        setClosingSubmenu(null); // Reset state closing

        // Jika ada submenu aktif (bukan closing), set ke null sekarang
        if (activeSubmenu) {
          setActiveSubmenu(null);
        }
        // 🔹 LANGSUNG BUKA SUBMENU BARU
        setActiveSubmenu(item.id);
      }
    } else {
      if (activeSubmenu) {
        closeSubmenuWithAnimation(activeSubmenu);
      }
      closeMobileSidebar();
    }
  };

  const handleMouseEnter = (item, e) => {
    if (collapsed && !isMobile) {
      const position = getPositionFromEvent(e);
      handleNavItemMouseEnter(item, position);
    }
  };

  const handleMouseLeave = (item, e) => {
    if (collapsed && !isMobile) {
      if (hasSubmenu(item)) {
        handleSubmenuMouseLeave(item.id, e);
      } else {
        hideExpandingLabel(item.id);
      }
    }
  };

  const handleLogoutMouseEnter = (e) => {
    if (collapsed && !isMobile) {
      const position = getPositionFromEvent(e);
      showExpandingLabel("logout", "Sign Out", position);
    }
  };

  const handleLogoutMouseLeave = () => {
    if (collapsed && !isMobile) {
      hideExpandingLabel("logout");
    }
  };

  // Handler untuk submenu item click - TIDAK menutup submenu
  const handleSubmenuClick = (e) => {
    // Jangan tutup submenu saat mengklik submenu-link
    // Hanya handle navigation
    handleSubmenuNavigation();

    // Tutup mobile sidebar jika mobile
    if (isMobile) {
      closeMobileSidebar();
    }
  };

  // Helper function untuk menentukan class submenu
  const getSubmenuClass = (itemId) => {
    const classes = ["submenu-list"];

    if (activeSubmenu === itemId && closingSubmenu !== itemId) {
      classes.push("open");
    }

    if (closingSubmenu === itemId) {
      classes.push("closing");
    }

    return classes.join(" ");
  };

  // Determine sidebar classes
  const sidebarClasses = [
    "sidebar",
    collapsed && !isMobile ? "collapsed" : "",
    isMobile && mobileOpen ? "open" : "",
    isMobile ? "mobile" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && mobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobileSidebar} />
      )}

      <aside className={sidebarClasses} ref={sidebarRef}>
        {/* Logo Section */}
        <div className="sidebar-logo-section">
          <div className="logo-container">
            <div className="logo-icon">
              <img src={Logo} alt="Logo" className="sidebar-logo" />
            </div>

            <div className="brand-text">
              {(!collapsed || isMobile) && <h3>{brandConfig.brandName}</h3>}
              <div className="brand-underline"></div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => {
              const isSubmenuOpen =
                activeSubmenu === item.id && closingSubmenu !== item.id;
              const isSubmenuClosing = closingSubmenu === item.id;

              return (
                <li key={item.id} className="nav-item">
                  <div className="nav-link-container">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""} ${
                          hasSubmenu(item) ? "has-submenu" : ""
                        }`
                      }
                      data-nav-item-id={item.id}
                      onClick={(e) => handleMenuClick(item, e)}
                      onMouseEnter={(e) => handleMouseEnter(item, e)}
                      onMouseLeave={(e) => handleMouseLeave(item, e)}
                    >
                      <img
                        src={item.icon}
                        alt={item.label}
                        className="nav-icon"
                      />
                      {(!collapsed || isMobile) && (
                        <>
                          <span className="nav-label">{item.label}</span>
                          {hasSubmenu(item) && (
                            <img
                              src={iconConfig.ArrowDown}
                              alt="Arrow"
                              className={`submenu-arrow ${
                                isSubmenuOpen ? "rotated" : ""
                              }`}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  </div>

                  {/* Enhanced submenu with animation states */}
                  {hasSubmenu(item) &&
                    (!collapsed || isMobile) &&
                    (isSubmenuOpen || isSubmenuClosing) && (
                      <ul
                        className={getSubmenuClass(item.id)}
                        data-submenu-id={item.id}
                      >
                        {item.submenu.map((subItem) => (
                          <li key={subItem.id} className="submenu-item">
                            <NavLink
                              to={subItem.path}
                              className={({ isActive }) =>
                                `submenu-link ${isActive ? "active" : ""}`
                              }
                              onClick={handleSubmenuClick}
                            >
                              <span className="submenu-label">
                                {subItem.label}
                              </span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                </li>
              );
            })}
          </ul>

          {/* Logout Button */}
          <div className="sidebar-footer">
            <div className="logout-container">
              <button
                className="logout-button"
                onClick={handleLogout}
                onMouseEnter={handleLogoutMouseEnter}
                onMouseLeave={handleLogoutMouseLeave}
                disabled={isLoggingOut} // 🔥 Nonaktifkan tombol saat loading
              >
                {isLoggingOut ? (
                  <PulseDots
                    size="sm"
                    color="#ffffff"
                    count={6}
                    className="pulse-dots--sidebar-logout"
                  />
                ) : (
                  <img
                    src={iconConfig.LogOut}
                    alt="Logout"
                    className="logout-icon"
                  />
                )}
                {(!collapsed || isMobile) && (
                  <span className="logout-label">
                    {isLoggingOut ? "" : "Sign Out"}{" "}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
