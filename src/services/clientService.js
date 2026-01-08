// clientService.js
import { dataService } from "./dataService";
import { baseService } from "./baseService";
import generalApiService from "./generalApiService";

export const clientService = {
  // Process client list untuk detailed view
  processList: (clients) => {
    return clients.map((client) => {
      const status = client.isReplied ? "replied" : "not_replied";

      return {
        ...client,
        joinDateFormatted: baseService.formatDateTime(client.createdAt),
        statusColor: baseService.getStatusColor(
          status === "replied" ? "active" : "pending"
        ),
        statusText:
          {
            replied: "Replied",
            not_replied: "Not Replied",
          }[status] || "Not Replied",
        phoneFormatted: client.phone || "N/A",
        typeLabel: client.formType === "CATALOG" ? "Catalog" : "Contact",
      };
    });
  },

  // ✅ UPDATE: Tambah parameter bypassCache
  getPaginated: async (
    page = 1,
    limit = 10,
    search = "",
    filters = {},
    bypassCache = false // ← Tambah parameter
  ) => {
    try {
      const params = {
        page,
        limit,
        bypassCache, // ← Pass ke dataService
      };

      // Filter deleted (default: false)
      if (filters.deleted !== undefined) {
        params.deleted = filters.deleted;
      } else {
        params.deleted = "false";
      }

      // Search
      if (search) {
        params.search = search;
      }

      // Filter isReplied
      if (filters.isReplied !== undefined) {
        params.isReplied = filters.isReplied;
      }

      // Filter formType
      if (filters.formType) {
        params.formType = filters.formType;
      }

      const result = await dataService.clients.getAll(params);

      if (!result.success) {
        return result;
      }

      const processedClients = clientService.processList(result.data);

      return {
        success: true,
        data: processedClients,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in getPaginated:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the clients. Please try again.",
      };
    }
  },

  create: async (clientData) => {
    try {
      // Validasi email
      if (clientData.email && !baseService.isValidEmail(clientData.email)) {
        return { success: false, message: "Invalid email format" };
      }

      // ✅ Validasi required fields (sesuai backend)
      if (
        !clientData.name ||
        !clientData.email ||
        !clientData.message ||
        !clientData.formType
      ) {
        return {
          success: false,
          message: "Name, email, message, and form type are required",
        };
      }

      // ✅ Validasi formType
      if (!["CATALOG", "CONTACT"].includes(clientData.formType)) {
        return {
          success: false,
          message: "Invalid form type. Use CATALOG or CONTACT",
        };
      }

      const createResult = await dataService.clients.create(clientData);

      if (!createResult.success) {
        return createResult;
      }

      return {
        success: true,
        data: createResult.data,
        message: createResult.message || "Client created successfully",
      };
    } catch (error) {
      console.error("Error creating client:", error);
      return {
        success: false,
        message: "Oops! We couldn't create the client. Please try again.",
      };
    }
  },

  update: async (id, clientData) => {
    try {
      if (clientData.email && !baseService.isValidEmail(clientData.email)) {
        return { success: false, message: "Invalid email format" };
      }

      const updateResult = await dataService.clients.update(id, clientData);
      if (!updateResult.success) {
        return updateResult;
      }
      return {
        success: true,
        data: updateResult.data,
        message: "Client updated successfully",
      };
    } catch (error) {
      console.error("Error updating client:", error);
      return {
        success: false,
        message: "Oops! We couldn't update the client. Please try again.",
      };
    }
  },

  // ✅ Method untuk mark as replied
  reply: async (id) => {
    try {
      const result = await dataService.clients.reply(id);
      if (!result.success) {
        return result;
      }
      return {
        success: true,
        data: result.data,
        message: "Client marked as replied",
      };
    } catch (error) {
      console.error("Error replying to client:", error);
      return {
        success: false,
        message:
          "Oops! We couldn't mark the client as replied. Please try again.",
      };
    }
  },

  softDelete: async (id) => {
    try {
      const result = await dataService.clients.softDelete(id);
      if (!result.success) {
        return result;
      }
      return {
        success: true,
        message: "Client successfully deleted",
      };
    } catch (error) {
      console.error("Error deleting client:", error);
      return {
        success: false,
        message: "Oops! We couldn't delete the client. Please try again.",
      };
    }
  },

  hardDelete: async (id) => {
    try {
      const result = await dataService.clients.hardDelete(id);
      if (!result.success) {
        return result;
      }
      return {
        success: true,
        message: "Client successfully deleted",
      };
    } catch (error) {
      console.error("Error deleting client:", error);
      return {
        success: false,
        message:
          "Oops! We couldn't delete the client permanently. Please try again.",
      };
    }
  },

  getById: async (id) => {
    try {
      const result = await dataService.clients.getById(id);

      if (!result.success) {
        return result;
      }

      const processedClient = clientService.processList([result.data])[0];

      return {
        success: true,
        data: processedClient,
      };
    } catch (error) {
      console.error("Error getting client:", error);
      return {
        success: false,
        message: "Oops! We couldn't load the client details. Please try again.",
      };
    }
  },

  exportData: async (month, year, format) => {
    const url = `/clients/export/${format}`;
    const params = { month, year };
    const fallbackFilename = `clients_export_${year}_${String(month).padStart(
      2,
      "0"
    )}`;
    return await generalApiService.downloadFile(url, params, fallbackFilename);
  },

  getTotalCount: async () => {
    try {
      const result = await dataService.clients.getAll({
        page: 1,
        limit: 1,
        deleted: "false",
        bypassCache: true,
      });
      if (!result.success) {
        return { success: false, total: 0 };
      }
      return {
        success: true,
        total: result.pagination?.totalItems || 0,
      };
    } catch (error) {
      console.error("Error in clientService.getTotalCount:", error);
      return { success: false, total: 0 };
    }
  },
};
