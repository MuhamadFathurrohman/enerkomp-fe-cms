// src/views/Catalogs.jsx
import React, { useRef, useMemo } from "react";
import {
  FileText,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import catalogService from "../services/catalogService";
import { useAutoRefetch } from "../hooks/useAutoRefetch";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { generatePageNumbers } from "../utils/pagination";
import { useModalContext } from "../contexts/ModalContext";
import CatalogsForm from "../components/Modals/Form/CatalogsForm";
import Modal from "../components/Modals/Modal";
import AlertModal from "../components/Alerts/AlertModal";
import { canManage, isSuperAdmin } from "../utils/permissions";
import "../sass/views/Catalogs/Catalogs.css";

const Catalogs = () => {
  const { user: currentUser } = useAuth();
  const searchInputRef = useRef(null);
  const { openModal, closeModal } = useModalContext();

  // ✅ UPDATE: Tambah parameter bypassCache
  const {
    searchTerm,
    setSearchTerm,
    data: rawCatalogs,
    loading,
    error,
    currentPage,
    totalPages,
    goToPage,
    refresh,
  } = useDebouncedSearch(
    async (page, limit, search, bypassCache = false) => {
      // ← Tambah parameter ke-4
      return await catalogService.getPaginated(
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

  // === Permission Logic ===
  const isSuper = isSuperAdmin(currentUser);
  const canManageCatalog =
    isSuper || canManage(currentUser?.permissions, "catalog");

  // Format data for display
  const catalogs = useMemo(() => {
    return rawCatalogs.map(catalogService.formatCatalogForDisplay);
  }, [rawCatalogs]);

  // ✅ TAMBAH: refreshWithPageValidation
  const refreshWithPageValidation = async (bypassCache = false) => {
    try {
      const result = await catalogService.getPaginated(
        1,
        8,
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

  const handleAutoRefetch = async () => {
    try {
      // Refetch users data (bypass cache untuk data fresh)
      await refreshWithPageValidation(true);
    } catch (error) {
      console.error("❌ Catalogs.jsx: Auto-refetch failed:", error);
    }
  };

  useAutoRefetch(handleAutoRefetch);

  // === Handlers ===
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page) => {
    goToPage(page);
  };

  // ✅ UPDATE: handleEdit dengan refreshWithPageValidation
  const handleEdit = (catalog) => {
    if (!canManageCatalog) return;
    openModal(
      "catalogEditModal",
      <Modal
        title="Edit Catalog"
        showHeader={true}
        showCloseButton={true}
        size="large"
        onClose={() => closeModal("catalogEditModal")}
      >
        <CatalogsForm
          initialData={catalog}
          onSuccess={() => {
            closeModal("catalogEditModal");
            refreshWithPageValidation(true); // ✅ UPDATE: Bypass cache
          }}
          onCancel={() => closeModal("catalogEditModal")}
        />
      </Modal>
    );
  };

  // ✅ UPDATE: handleDelete dengan refreshWithPageValidation
  const handleDelete = (catalog) => {
    if (!canManageCatalog) return;
    openModal(
      "deleteCatalogConfirm",
      <AlertModal
        type="delete"
        title="Delete Catalog?"
        message={
          <>
            Are you sure you want to delete{" "}
            <span className="highlighted-name">{catalog.name}</span>? This
            action cannot be undone.
          </>
        }
        showActions={true}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          closeModal("deleteCatalogConfirm");
          try {
            const result = await catalogService.softDelete(catalog.id);
            if (result.success || result.data) {
              openModal(
                "deleteSuccessAlert",
                <AlertModal
                  type="success"
                  title="Deleted!"
                  message={
                    <>
                      Catalog{" "}
                      <span className="highlighted-name">{catalog.name}</span>{" "}
                      has been successfully deleted.
                    </>
                  }
                  onClose={() => {
                    closeModal("deleteSuccessAlert");
                    refreshWithPageValidation(true); // ✅ UPDATE: Bypass cache
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
                    result.message ||
                    "Failed to delete catalog. Please try again."
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
                message="An error occurred while deleting the catalog."
                onClose={() => closeModal("deleteErrorAlert")}
              />,
              "small"
            );
          }
        }}
        onCancel={() => closeModal("deleteCatalogConfirm")}
      />,
      "small"
    );
  };

  const handleAddCatalog = () => {
    if (!canManageCatalog) return;
    openModal(
      "catalogFormModal",
      <Modal
        title="Add New Catalog"
        showHeader={true}
        showCloseButton={true}
        size="large"
        onClose={() => closeModal("catalogFormModal")}
      >
        <CatalogsForm
          onSuccess={() => {
            closeModal("catalogFormModal");
            refresh(); // Add tidak perlu bypass cache
          }}
          onCancel={() => closeModal("catalogFormModal")}
        />
      </Modal>
    );
  };

  const renderNoDataMessage = () => {
    if (searchTerm.trim()) {
      // Jika sedang search
      return (
        <>
          No Catalog found matching "<strong>{searchTerm}</strong>".
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
          No Catalogs available.
          {canManageCatalog && (
            <>
              <br />
              <span style={{ fontSize: "0.9em", opacity: 0.8 }}>
                Click "Add New Catalog" to create your first Catalog.
              </span>
            </>
          )}
        </>
      );
    }
  };

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  // === Render ===
  return (
    <div className="page-catalogs">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <FileText size={28} /> Catalogs
          </h1>
          <p>Manage all product catalogs</p>
        </div>

        {canManageCatalog && (
          <button className="btn-primary" onClick={handleAddCatalog}>
            <Plus size={16} />
            Add New Catalog
          </button>
        )}
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <Search
            size={19}
            stroke="currentColor"
            className="search-icon"
            onClick={() => searchInputRef.current?.focus()}
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name..."
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
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      <div className="table-container">
        <table className="catalog-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Description</th>
              <th>Created At</th>
              {canManageCatalog && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManageCatalog ? 5 : 4} className="loading-cell">
                  <div className="loading-spinner"></div>
                  <p>Loading catalogs...</p>
                </td>
              </tr>
            ) : catalogs.length > 0 ? (
              catalogs.map((catalog, index) => (
                <tr key={catalog.id}>
                  <td>{index + 1 + (currentPage - 1) * 8}</td>
                  <td>{catalog.name}</td>
                  <td>{catalog.description || "-"}</td>
                  <td>{catalog.formattedCreatedAt}</td>
                  {canManageCatalog && (
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(catalog)}
                          aria-label="Edit catalog"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(catalog)}
                          aria-label="Delete catalog"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canManageCatalog ? 5 : 4} className="no-data">
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
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`pagination-btn pagination-arrow ${
              currentPage === 1 ? "disabled" : ""
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <div className="pagination-pages">
            {pageNumbers.map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`pagination-page ${
                    currentPage === page ? "active" : ""
                  }`}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`pagination-btn pagination-arrow ${
              currentPage === totalPages ? "disabled" : ""
            }`}
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Catalogs;
