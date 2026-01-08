import { dataService } from "./dataService";

export const notificationService = {
  // ✅ Gunakan dataService untuk getNotifications
  async getNotifications(page = 1, limit = 20) {
    try {
      const result = await dataService.notifications.getAll({
        page,
        limit,
      });

      if (result.success) {
        // ✅ Tambahkan priority jika belum ada
        const notificationsWithPriority = result.data.map((notif) => ({
          ...notif,
          priority: notif.priority || "medium",
        }));

        return {
          success: true,
          data: notificationsWithPriority,
          pagination: result.pagination,
        };
      }
      return { success: false, data: [], pagination: {} };
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return { success: false, data: [], pagination: {} };
    }
  },

  // ✅ Gunakan dataService untuk markAsRead
  async markAsRead(notificationId) {
    try {
      const result = await dataService.notifications.markAsRead(notificationId);
      return { success: result.success };
    } catch (error) {
      console.error("Failed to mark as read:", error);
      return { success: false };
    }
  },

  // ✅ Gunakan dataService untuk getUnreadCount
  async getUnreadCount() {
    try {
      const result = await dataService.notifications.getUnreadCount();
      return {
        success: true,
        count: result.count || 0,
      };
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
      return { success: false, count: 0 };
    }
  },
};
