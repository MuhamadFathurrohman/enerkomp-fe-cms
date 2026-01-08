// src/pages/Clients/Clients.jsx
import React from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { clientService } from "../services/clientService";
import { useModalContext } from "../contexts/ModalContext";
import { canManage, canExport, isSuperAdmin } from "../utils/permissions";
import { useAutoRefetch } from "../hooks/useAutoRefetch";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { generatePageNumbers } from "../utils/pagination";
import ExportModal from "../components/Modals/ExportModal";
import Modal from "../components/Modals/Modal";
import ClientForm from "../components/Modals/Form/ClientForm";
import AlertModal from "../components/Alerts/AlertModal";
import "../sass/views/Clients/Clients.scss";

const Clients = () => {
  const { user: currentUser } = useAuth();
  const { openModal, closeModal } = useModalContext();

  // ✅ UPDATE: Tambah parameter bypassCache
  const {
    searchTerm,
    setSearchTerm,
    data: clients,
    loading,
    error,
    currentPage,
    totalPages,
    goToPage,
    refresh,
  } = useDebouncedSearch(
    async (page, limit, search, bypassCache = false) => {
      // ← Tambah parameter ke-4
      return await clientService.getPaginated(
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
  const canManageClients =
    isSuper || canManage(currentUser?.permissions, "client");
  const canExportClients =
    isSuper || canExport(currentUser?.permissions, "client");

  // ✅ TAMBAH: refreshWithPageValidation
  const refreshWithPageValidation = async (bypassCache = false) => {
    try {
      const result = await clientService.getPaginated(
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
      console.error("❌ Clients.jsx: Auto-refetch failed:", error);
    }
  };

  useAutoRefetch(handleAutoRefetch);

  // === Handlers ===
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleExport = () => {
    if (!canExportClients) return;
    openModal(
      "exportClients",
      <Modal
        title="Export Client Data"
        showHeader={true}
        showCloseButton={true}
        size="small"
        onClose={() => closeModal("exportClients")}
      >
        <ExportModal
          mode="clients"
          onSuccess={() => closeModal("exportClients")}
          onClose={() => closeModal("exportClients")}
        />
      </Modal>
    );
  };

  // ✅ UPDATE: handleEdit dengan refreshWithPageValidation
  const handleEdit = (id) => {
    if (!canManageClients) return;
    const client = clients.find((c) => c.id === id);
    if (!client) return;

    openModal(
      "clientEditModal",
      <Modal
        title="Edit Client"
        showHeader={true}
        showCloseButton={true}
        onClose={() => closeModal("clientEditModal")}
        size="large"
      >
        <ClientForm
          initialData={client}
          onSuccess={() => {
            closeModal("clientEditModal");
            refreshWithPageValidation(true);
          }}
        />
      </Modal>
    );
  };

  // UPDATE: handleDelete dengan refreshWithPageValidation
  const handleDelete = (client) => {
    if (!canManageClients) return;
    openModal(
      "deleteClientConfirm",
      <AlertModal
        type="delete"
        title="Delete Client?"
        message={
          <>
            Are you sure you want to delete{" "}
            <span className="highlighted-name">{client.company}</span>? This
            action cannot be undone.
          </>
        }
        showActions={true}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          closeModal("deleteClientConfirm");
          try {
            const result = await clientService.softDelete(
              client.id,
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
                      Client{" "}
                      <span className="highlighted-name">{client.company}</span>{" "}
                      has been successfully deleted.
                    </>
                  }
                  onClose={() => {
                    closeModal("deleteSuccessAlert");
                    refreshWithPageValidation(true);
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
                    "Failed to delete client. Please try again."
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
                message="An error occurred while deleting client."
                onClose={() => closeModal("deleteErrorAlert")}
              />,
              "small"
            );
          }
        }}
        onCancel={() => closeModal("deleteClientConfirm")}
      />,
      "small"
    );
  };

  const handleAddClient = () => {
    if (!canManageClients) return;
    openModal(
      "clientFormModal",
      <Modal
        title="Add New Client"
        showHeader={true}
        showCloseButton={true}
        onClose={() => closeModal("clientFormModal")}
        size="large"
      >
        <ClientForm
          onSuccess={() => {
            closeModal("clientFormModal");
            refresh(); // Add tidak perlu bypass cache
          }}
        />
      </Modal>
    );
  };

  const renderNoDataMessage = () => {
    if (searchTerm.trim()) {
      // Jika sedang search
      return (
        <>
          No client found matching "<strong>{searchTerm}</strong>".
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
          No clients available.
          {canManageClients && (
            <>
              <br />
              <span style={{ fontSize: "0.9em", opacity: 0.8 }}>
                Click "Add New Client" to create your first client.
              </span>
            </>
          )}
        </>
      );
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  // === Render ===
  return (
    <div className="page-clients">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Users size={28} /> Clients
          </h1>
          <p>Manage client inquiries from company profile</p>
        </div>

        <div className="header-actions">
          {canExportClients && (
            <button className="btn-secondary" onClick={handleExport}>
              <Download size={16} />
              Export Data
            </button>
          )}

          {canManageClients && (
            <button className="btn-primary" onClick={handleAddClient}>
              <Plus size={16} />
              Add New Client
            </button>
          )}
        </div>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by company, contact..."
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
        <table className="client-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Company</th>
              <th>Contact Person</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created At</th>
              {canManageClients && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManageClients ? 7 : 6} className="loading-cell">
                  <div className="loading-spinner"></div>
                  <p>Loading clients...</p>
                </td>
              </tr>
            ) : Array.isArray(clients) && clients.length > 0 ? (
              clients.map((client, index) => (
                <tr key={client.id}>
                  <td>{(currentPage - 1) * 8 + index + 1}</td>
                  <td>
                    <div className="company-name">{client.company || "-"}</div>
                  </td>
                  <td>
                    <div className="contact-person">
                      <div>
                        <div className="person-name">{client.name || "-"}</div>
                        <div className="person-email">
                          {client.email || "-"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge type ${client.formType}`}>
                      {client.typeLabel}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge status ${
                        client.isReplied ? "replied" : "not-replied"
                      }`}
                    >
                      {client.statusText}
                    </span>
                  </td>
                  <td>{client.joinDateFormatted}</td>
                  {canManageClients && (
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(client.id)}
                          aria-label="Edit client"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(client)}
                          aria-label="Delete client"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canManageClients ? 7 : 6} className="no-data">
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
            className={`pagination-arrow ${
              currentPage === 1 ? "disabled" : ""
            }`}
            onClick={goToPrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <div className="pagination-pages">
            {pageNumbers.map((page, idx) =>
              page === "..." ? (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
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

export default Clients;
