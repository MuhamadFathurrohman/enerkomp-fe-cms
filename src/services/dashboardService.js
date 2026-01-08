// src/services/dashboardService.js

import { usersService } from "./usersService";
import { clientService } from "./clientService";
import { analyticsService } from "./analyticsService";

export const dashboardService = {
  // getSummary() hanya untuk stats & trend — tanpa recent visitors
  getSummary: async () => {
    try {
      const [userRes, clientRes, snapshotRes, last30DaysTrendRes] =
        await Promise.all([
          usersService.getTotalCount(),
          clientService.getTotalCount(),
          analyticsService.getDashboardOverviewTrend(30),
          analyticsService.getLast30DaysTrend(30),
        ]);

      return {
        success: true,
        data: {
          users: { total: userRes.success ? userRes.total : 0 },
          clients: { total: clientRes.success ? clientRes.total : 0 },
          analytics: {
            snapshot: snapshotRes.success
              ? snapshotRes.data
              : {
                  totalPageViews: 0,
                  totalBounceRate: 0,
                  avgSessionDurationFormatted: "0m 0s",
                },
            trend: last30DaysTrendRes.success ? last30DaysTrendRes.data : [],
          },
        },
      };
    } catch (err) {
      console.error("dashboardService.getSummary error:", err);
      return { success: false };
    }
  },

  getRecentVisitors: async (limit = 20) => {
    try {
      const recentViewsRes =
        await analyticsService.getRecentPageViewsForDashboard(limit);
      if (recentViewsRes.success && Array.isArray(recentViewsRes.recentItems)) {
        return {
          success: true,
          data: recentViewsRes.recentItems.slice(0, limit),
        };
      }
      return { success: false, data: [] };
    } catch (err) {
      console.error("dashboardService.getRecentVisitors error:", err);
      return { success: false, data: [] };
    }
  },
};
