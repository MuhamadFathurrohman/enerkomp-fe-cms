// src/views/Roles/Roles.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useModalContext } from "../contexts/ModalContext";
import { canRead, canManage } from "../utils/permissions";
import { formatRoleName, getRoleBadgeClass } from "../utils/roleHelper";
import "../sass/views/Roles/Roles.css";
import {
  Eye,
  Edit2,
  Trash2,
  Plus,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Modal from "../components/Modals/Modal";
import AlertModal from "../components/Alerts/AlertModal";
import RoleDetail from "../components/Modals/view/RoleDetail";
import RoleForm from "../components/Modals/Form/RoleForm";
import { roleService } from "../services/roleService";
import { usersService } from "../services/usersService";
import { useAutoRefetch } from "../hooks/useAutoRefetch";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { generatePageNumbers } from "../utils/pagination";

const Roles = () => {
  const { user: currentUser } = useAuth();
  const searchInputRef = useRef(null);
  const { openModal, closeModal } = useModalContext();
  const [userCounts, setUserCounts] = useState({});
  const [userCountsLoading, setUserCountsLoading] = useState(true);

  const isSuperAdmin = canManage(currentUser?.permissions, "role");
  const canCreate = canManage(currentUser?.permissions, "role");
  const canUpdate = canManage(currentUser?.permissions, "role");
  const canDelete = canManage(currentUser?.permissions, "role");
  const canReadPage = canRead(currentUser?.permissions, "role");

  // Fetch user counts (independent dari search/pagination)
  const fetchUserCounts = async () => {
    setUserCountsLoading(true);
    try {
      const usersResult = await usersService.getPaginated();
      if (usersResult.success && Array.isArray(usersResult.data)) {
        const counts = {};
        usersResult.data.forEach((u) => {
          counts[u.roleId] = (counts[u.roleId] || 0) + 1;
        });
        setUserCounts(counts);
      }
    } catch (err) {
      console.error("Error fetching user counts:", err);
    } finally {
      setUserCountsLoading(false);
    }
  };

  // ✅ UPDATE: Tambah parameter bypassCache
  const {
    searchTerm,
    setSearchTerm,
    data: roles,
    loading,
    error,
    currentPage,
    totalPages,
    goToPage,
    refresh,
  } = useDebouncedSearch(
    async (page, limit, search, bypassCache = false) => {
      // ← Tambah parameter ke-4
      return await roleService.getPaginated(
        page,
        limit,
        search,
        {}, // filters
        bypassCache // ← Pass bypassCache
      );
    },
    1,
    8,
    800
  );

  useEffect(() => {
    if (canReadPage) {
      fetchUserCounts();
    }
  }, [canReadPage]);

  const handleAutoRefetch = async () => {
    try {
      // Refetch users data (bypass cache untuk data fresh)
      await refreshWithPageValidation(true);

      // Refetch roles data
      await fetchUserCounts();
    } catch (error) {
      console.error("❌ Roles.jsx: Auto-refetch failed:", error);
    }
  };

  useAutoRefetch(handleAutoRefetch);

  // ✅ TAMBAH: refreshWithPageValidation
  const refreshWithPageValidation = async (bypassCache = false) => {
    try {
      const result = await roleService.getPaginated(
        1,
        10,
        searchTerm,
        {},
        bypassCache
      );

      if (result.success) {
        const newTotalPages = result.pagination?.totalPages || 1;
        const targetPage = Math.min(currentPage, newTotalPages);

        if (targetPage === currentPage) {
          refresh(bypassCache);
        } else {
          goToPage(targetPage);
        }
      } else {
        refresh(bypassCache);
      }
    } catch (error) {
      console.error("Error in refreshWithPageValidation:", error);
      refresh(bypassCache);
    }
  };

  const handleAddRole = () => {
    openModal(
      "addRole",
      <Modal
        title="Create New Role"
        showHeader={true}
        showCloseButton={true}
        onClose={() => closeModal("addRole")}
      >
        <RoleForm
          isSuperAdmin={isSuperAdmin}
          onSuccess={() => {
            closeModal("addRole");
            refresh(); // Add tidak perlu bypass cache
            fetchUserCounts();
          }}
        />
      </Modal>
    );
  };

  // ✅ UPDATE: handleEditRole dengan refreshWithPageValidation
  const handleEditRole = (role) => {
    openModal(
      `editRole-${role.id}`,
      <Modal
        title="Edit Role"
        showHeader={true}
        showCloseButton={true}
        onClose={() => closeModal(`editRole-${role.id}`)}
      >
        <RoleForm
          role={role}
          isSuperAdmin={isSuperAdmin}
          onSuccess={() => {
            closeModal(`editRole-${role.id}`);
            refreshWithPageValidation(true); // ✅ UPDATE: Bypass cache
            fetchUserCounts();
          }}
        />
      </Modal>
    );
  };

  const handleViewDetail = (role) => {
    openModal(
      `role-detail-${role.id}`,
      <Modal
        title="Role Details"
        showHeader={true}
        showCloseButton={true}
        onClose={() => closeModal(`role-detail-${role.id}`)}
      >
        <RoleDetail role={role} />
      </Modal>
    );
  };

  // ✅ UPDATE: handleDeleteRole dengan refreshWithPageValidation
  const handleDeleteRole = (role) => {
    if (!canDelete) return;

    openModal(
      "deleteRoleConfirm",
      <AlertModal
        type="delete"
        title="Delete Role?"
        message={
          <>
            Are you sure you want to delete{" "}
            <span className="highlighted-name">
              {formatRoleName(role.name)}
            </span>
            ? This action cannot be undone.
          </>
        }
        showActions={true}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          closeModal("deleteRoleConfirm");
          try {
            const result = await roleService.softDelete(
              role.id,
              isSuperAdmin,
              currentUser.id
            );
            if (result.success) {
              openModal(
                "deleteSuccessAlert",
                <AlertModal
                  type="success"
                  title="Deleted!"
                  message={
                    <>
                      Role{" "}
                      <span className="highlighted-name">
                        {formatRoleName(role.name)}
                      </span>{" "}
                      has been successfully deleted.
                    </>
                  }
                  onClose={() => {
                    closeModal("deleteSuccessAlert");
                    refreshWithPageValidation(true); // ✅ UPDATE: Bypass cache
                    fetchUserCounts();
                  }}
                />,
                "small"
              );
            } else {
              openModal(
                "deleteErrorAlert",
                <AlertModal
                  type="error"
                  title="Failed to Delete"
                  message={
                    result.message || "Failed to delete role. Please try again."
                  }
                  onClose={() => closeModal("deleteErrorAlert")}
                />,
                "small"
              );
            }
          } catch (err) {
            openModal(
              "deleteErrorAlert",
              <AlertModal
                type="error"
                title="Error"
                message="An error occurred while deleting role."
                onClose={() => closeModal("deleteErrorAlert")}
              />,
              "small"
            );
          }
        }}
        onCancel={() => closeModal("deleteRoleConfirm")}
      />,
      "small"
    );
  };

  const renderNoDataMessage = () => {
    if (searchTerm.trim()) {
      // Jika sedang search
      return (
        <>
          No role found matching "<strong>{searchTerm}</strong>".
          <br />
          <span style={{ fontSize: "0.9em", opacity: 0.8 }}>
            Try adjusting your search criteria.
          </span>
        </>
      );
    } else {
      // Jika tidak ada search
      return (
        <>
          No roles available.
          {canManage && (
            <>
              <br />
              <span style={{ fontSize: "0.9em", opacity: 0.8 }}>
                Click "Add New Role" to create your first role.
              </span>
            </>
          )}
        </>
      );
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  return (
    <div className="page-roles">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Shield size={28} /> Roles & Permissions
          </h1>
          <p>Manage user roles and their permissions</p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={handleAddRole}>
            <Plus size={18} />
            Add New Role
          </button>
        )}
      </div>

      <div className="search-wrapper">
        <div className="search-input-container">
          <Search
            size={19}
            stroke="currentColor"
            className="search-icon"
            onClick={() => searchInputRef.current?.focus()}
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          {loading && searchTerm && (
            <div className="search-input-spinner"></div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={refresh} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="table-container">
        <table className="role-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Description</th>
              <th>Users</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="loading-cell">
                  <div className="loading-spinner"></div>
                  <p>Loading roles...</p>
                </td>
              </tr>
            ) : roles.length > 0 ? (
              roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <span
                      className={`badge role ${getRoleBadgeClass(role.name)}`}
                    >
                      {formatRoleName(role.name)}
                    </span>
                  </td>
                  <td>{role.description || "—"}</td>
                  <td>
                    {userCountsLoading ? (
                      <span className="loading-dots">...</span>
                    ) : (
                      userCounts[role.id] || 0
                    )}
                  </td>
                  <td className="action-buttons">
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetail(role)}
                      title="View Permissions"
                    >
                      <Eye size={18} />
                    </button>
                    {canUpdate && (
                      <button
                        className="btn-edit"
                        title="Edit Role"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="btn-delete"
                        title="Delete Role"
                        onClick={() => handleDeleteRole(role)}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">
                  {renderNoDataMessage()}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-arrow"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <div className="pagination-pages">
            {pageNumbers.map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={page}
                  className={`pagination-page ${
                    currentPage === page ? "active" : ""
                  }`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            className="pagination-arrow"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Roles;
