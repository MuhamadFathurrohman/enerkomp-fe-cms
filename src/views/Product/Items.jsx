// Items.jsx
import React, { useMemo } from "react";
import {
  Eye,
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { itemService } from "../../services/itemService";
import { useModalContext } from "../../contexts/ModalContext";
import Modal from "../../components/Modals/Modal";
import ItemsForm from "../../components/Modals/Form/ItemsForm";
import ItemViewModal from "../../components/Modals/view/ItemViewModal";
import { useAutoRefetch } from "../../hooks/useAutoRefetch";
import { useDebouncedSearch } from "../../hooks/useDebouncedSearch";
import { generatePageNumbers } from "../../utils/pagination";
import SkeletonItem from "../../components/Loaders/SkeletonItem";
import AlertModal from "../../components/Alerts/AlertModal";
import { canManage, canExport, isSuperAdmin } from "../../utils/permissions";
import ExportDropdown from "../../components/ExportDropdown";
import "../../sass/views/Items/Items.css";

const Items = () => {
  const { user: currentUser } = useAuth();
  const { openModal, closeModal } = useModalContext();

  // ✅ UPDATE: Tambah parameter bypassCache
  const {
    searchTerm,
    setSearchTerm,
    data: items,
    loading,
    error,
    currentPage,
    totalPages,
    goToPage,
    refresh,
  } = useDebouncedSearch(
    async (page, limit, search, bypassCache = false) => {
      // ← Tambah parameter ke-4
      return await itemService.getPaginated(
        page,
        limit,
        search,
        bypassCache // ← Pass bypassCache
      );
    },
    1,
    10,
    800
  );

  // ✅ UPDATE: refreshWithPageValidation dengan bypassCache
  const refreshWithPageValidation = async (bypassCache = false) => {
    try {
      const result = await itemService.getPaginated(
        1,
        10,
        searchTerm,
        bypassCache // ← Pass bypassCache
      );

      if (result.success) {
        const newTotalPages = result.pagination?.totalPages || 1;
        const targetPage = Math.min(currentPage, newTotalPages);

        if (targetPage === currentPage) {
          refresh(bypassCache); // ← Pass bypassCache ke refresh
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
      console.error("❌ Items.jsx: Auto-refetch failed:", error);
    }
  };

  useAutoRefetch(handleAutoRefetch);

  // === Permission Logic ===//
  const isSuper = isSuperAdmin(currentUser);
  const canManageItems =
    isSuper || canManage(currentUser?.permissions, "product");
  const canExportItems =
    isSuper || canExport(currentUser?.permissions, "product");

  const pageNumbers = useMemo(() => {
    return generatePageNumbers(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddItem = () => {
    if (!canManageItems) return;
    openModal(
      "addItem",
      <Modal
        title="Add New Item"
        showHeader={true}
        showCloseButton={true}
        onClose={() => closeModal("addItem")}
      >
        <ItemsForm
          onClose={() => closeModal("addItem")}
          onSuccess={() => {
            closeModal("addItem");
            refresh(); // Add tidak perlu bypass cache
          }}
        />
      </Modal>
    );
  };

  const handleViewItem = (item) => {
    openModal(
      "view-item",
      <Modal
        title="Item Details"
        showHeader={true}
        showCloseButton={true}
        onClose={() => closeModal("view-item")}
        size="large"
      >
        <ItemViewModal
          itemId={item.id}
          onClose={() => closeModal("view-item")}
        />
      </Modal>
    );
  };

  // ✅ UPDATE: handleEditItem dengan refreshWithPageValidation
  const handleEditItem = async (item) => {
    if (!canManageItems) return;

    try {
      const result = await itemService.getById(item.id);

      if (!result.success || !result.data) {
        openModal(
          "fetchError",
          <AlertModal
            type="error"
            title="Error"
            message={result.message || "Failed to load item details."}
            showActions={true}
            confirmText="OK"
            onConfirm={() => closeModal("fetchError")}
            onCancel={() => closeModal("fetchError")}
          />,
          "small"
        );
        return;
      }

      openModal(
        `editItem-${item.id}`,
        <Modal
          title="Edit Item"
          showHeader={true}
          showCloseButton={true}
          onClose={() => closeModal(`editItem-${item.id}`)}
        >
          <ItemsForm
            item={result.data}
            onClose={() => closeModal(`editItem-${item.id}`)}
            onSuccess={() => {
              closeModal(`editItem-${item.id}`);
              refreshWithPageValidation(true); // ✅ UPDATE: Bypass cache
            }}
          />
        </Modal>
      );
    } catch (err) {
      openModal(
        "fetchError",
        <AlertModal
          type="error"
          title="Error"
          message="Failed to load item details."
          showActions={true}
          confirmText="OK"
          onConfirm={() => closeModal("fetchError")}
          onCancel={() => closeModal("fetchError")}
        />,
        "small"
      );
    }
  };

  // handleDeleteItem dengan refreshWithPageValidation
  const handleDeleteItem = (item) => {
    if (!canManageItems) return;
    openModal(
      "deleteItemConfirm",
      <AlertModal
        type="delete"
        title="Delete Item?"
        message={
          <>
            Are you sure you want to delete{" "}
            <span className="highlighted-name">{item.name}</span>? This action
            cannot be undone.
          </>
        }
        showActions={true}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          closeModal("deleteItemConfirm");
          try {
            const result = await itemService.softDelete(
              item.id,
              currentUser.id
            );
            if (result.success) {
              openModal(
                "deleteSuccess",
                <AlertModal
                  type="success"
                  title="Deleted!"
                  message={
                    <>
                      Item <span className="highlighted-name">{item.name}</span>{" "}
                      has been successfully deleted.
                    </>
                  }
                  onClose={() => {
                    closeModal("deleteSuccess");
                    refreshWithPageValidation(true);
                  }}
                />,
                "small"
              );
            } else {
              openModal(
                "deleteError",
                <AlertModal
                  type="error"
                  title="Error"
                  message={result.message || "Failed to delete item."}
                  onClose={() => closeModal("deleteError")}
                />,
                "small"
              );
            }
          } catch (err) {
            openModal(
              "deleteError",
              <AlertModal
                type="error"
                title="Error"
                message="An error occurred while deleting item."
                onClose={() => closeModal("deleteError")}
              />,
              "small"
            );
          }
        }}
        onCancel={() => closeModal("deleteItemConfirm")}
      />,
      "small"
    );
  };

  const renderNoDataMessage = () => {
    if (searchTerm.trim()) {
      // Jika ada filter aktif
      return (
        <>
          <Package size={48} />
          <p>
            No items found matching "<strong>{searchTerm}</strong>"
          </p>
          <p className="no-data-subtitle">
            Try adjusting your search criteria.
          </p>
        </>
      );
    } else {
      // Jika tidak ada filter
      return (
        <>
          <Package size={48} />
          <p>No items product available.</p>
          {canManageItems && (
            <>
              <br />
              <p className="no-data-subtitle">
                Click "Add New Item" to create your first item.
              </p>
            </>
          )}
        </>
      );
    }
  };

  // Skeleton Item Component
  const ItemSkeleton = () => (
    <div className="item skeleton-loading">
      <div className="item-image-wrapper">
        <SkeletonItem
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "12px 12px 0 0",
          }}
        />
      </div>
      <div className="item-info">
        <SkeletonItem
          style={{
            width: "70%",
            height: "18px",
            marginBottom: "12px",
            borderRadius: "6px",
          }}
        />
        <div
          className="item-meta"
          style={{ display: "flex", gap: "8px", alignItems: "center" }}
        >
          <SkeletonItem
            style={{ width: "45%", height: "13px", borderRadius: "4px" }}
          />
          <SkeletonItem
            style={{ width: "35%", height: "22px", borderRadius: "15px" }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-items">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Package size={28} /> Item Management
          </h1>
          <p>Manage and organize item images for website display.</p>
        </div>
        <div className="header-actions">
          {canExportItems && (
            <div className="item-export-dropdown-wrapper">
              <ExportDropdown entity="product" />
            </div>
          )}
          {canManageItems && (
            <button className="btn-primary" onClick={handleAddItem}>
              <Plus size={18} /> Add New Item
            </button>
          )}
        </div>
      </div>

      <div className="items-filters">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
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

      <div className="items-container">
        {loading ? (
          <div className="items-grid">
            {[...Array(8)].map((_, index) => (
              <ItemSkeleton key={index} />
            ))}
          </div>
        ) : Array.isArray(items) && items.length > 0 ? (
          <div className="items-grid">
            {items.map((item) => (
              <div key={item.id} className="item">
                <div className="item-image-wrapper">
                  {item.primaryPhoto ? (
                    <img
                      src={item.primaryPhoto}
                      alt={item.name}
                      className="item-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="item-placeholder">
                      <Image size={48} />
                      <span>No Image</span>
                    </div>
                  )}

                  <div className="item-overlay">
                    <div className="item-actions">
                      <button
                        className="item-action-btn view-btn"
                        title="View details"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewItem(item);
                        }}
                      >
                        <Eye size={16} />
                      </button>

                      {canManageItems && (
                        <>
                          <button
                            className="item-action-btn edit-btn"
                            title="Edit item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditItem(item);
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="item-action-btn delete-btn"
                            title="Delete item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="item-info">
                  <h3 className="item-title">{item.name}</h3>
                  <div className="item-meta">
                    <span className="item-date">
                      {item.createdAtFormatted}{" "}
                    </span>
                    <span
                      className={`item-status ${
                        item.isActive ? "active" : "inactive"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">{renderNoDataMessage()}</div>
        )}
      </div>

      {!loading &&
        Array.isArray(items) &&
        items.length > 0 &&
        totalPages > 1 && (
          <div className="pagination-controls">
            <button
              className={`pagination-arrow ${
                currentPage === 1 ? "disabled" : ""
              }`}
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
              <span>Prev</span>
            </button>

            <div className="pagination-pages">
              {pageNumbers.map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="pagination-ellipsis"
                  >
                    ...
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
              className={`pagination-arrow ${
                currentPage === totalPages ? "disabled" : ""
              }`}
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
    </div>
  );
};

export default Items;
