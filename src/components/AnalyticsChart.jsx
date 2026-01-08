// src/components/AnalyticsChart.jsx
import React, { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Warna yang digunakan di line chart
const COLORS = {
  newVisitors: "#3b82f6", // blue-500
  returningVisitors: "#D946ef", // fuchsia-500
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "12px",
        borderRadius: "8px",
        border: "rgba(45, 76, 82, 0.5) solid 1px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
        color: "black",
        fontSize: "14px",
        fontFamily: "Barlow, sans-serif",
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>
        {new Date(data.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        })}
      </p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ margin: 0, color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ✅ CUSTOM LEGEND COMPONENT
const CustomLegend = () => {
  return (
    <div className="analytics-legend">
      <div className="legend-item">
        <div
          className="legend-color"
          style={{ backgroundColor: COLORS.newVisitors }}
        ></div>
        <span className="legend-label">New Visitor</span>
      </div>
      <div className="legend-item">
        <div
          className="legend-color"
          style={{ backgroundColor: COLORS.returningVisitors }}
        ></div>
        <span className="legend-label">Returning Visitor</span>
      </div>
    </div>
  );
};

const AnalyticsChart = ({
  analyticsSnapshot,
  analyticsTrend = [],
  onChartClick,
}) => {
  const {
    totalPageViews = 0,
    totalBounceRate = 0,
    avgSessionDurationFormatted = "0m 0s",
  } = analyticsSnapshot || {};

  const trendData = useMemo(() => {
    if (!Array.isArray(analyticsTrend) || analyticsTrend.length === 0) {
      return [];
    }

    return analyticsTrend
      .map((item, index) => {
        if (!item?.date) return null;

        const date = new Date(item.date);
        if (isNaN(date)) return null;

        const newVisitors = Number(item.newVisitors) || 0;
        const returningVisitors = Number(item.returningVisitors) || 0;

        return {
          date: item.date,
          newVisitors,
          returningVisitors,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [analyticsTrend]);

  const maxYValue = useMemo(() => {
    if (!trendData.length) return 1;

    const max = Math.max(
      ...trendData.flatMap((d) => [d.newVisitors, d.returningVisitors])
    );

    if (max === 0) return 5;

    return Math.ceil(max * 1.2);
  }, [trendData]);

  const showChart = trendData.length > 0;

  return (
    <div
      className="home-dashboard-card home-chart-card home-analytics-card"
      onClick={onChartClick}
      style={{ cursor: "pointer" }}
    >
      <div className="home-chart-header">
        <h3>Website Analytics (30 Days)</h3>
        <BarChart3 size={20} />
      </div>

      <div className="home-chart-content">
        <div className="home-analytics-chart-container">
          {showChart ? (
            <>
              <div className="home-chart-wrapper line-chart">
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={trendData}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(dateStr) => {
                        const date = new Date(dateStr);
                        return date.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        });
                      }}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[0, maxYValue]}
                      allowDecimals={false}
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* ✅ HILANGKAN LEGEND BAWAAN */}
                    {/* <Legend /> */}
                    <Line
                      type="monotone"
                      dataKey="newVisitors"
                      name="New Visitor"
                      stroke={COLORS.newVisitors}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="returningVisitors"
                      name="Returning Visitor"
                      stroke={COLORS.returningVisitors}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* ✅ CUSTOM LEGEND DI KANAN ATAS CHART */}
              <CustomLegend />

              <div className="home-analytics-stats-horizontal">
                <div className="home-stat-item-horizontal">
                  <span className="home-stat-value-large">
                    {totalPageViews.toLocaleString()}
                  </span>
                  <span className="home-stat-label">Page Views</span>
                </div>
                <div className="home-stat-item-horizontal">
                  <span className="home-stat-value-large">
                    {totalBounceRate}%
                  </span>
                  <span className="home-stat-label">Bounce Rate</span>
                </div>
                <div className="home-stat-item-horizontal">
                  <span className="home-stat-value-large">
                    {avgSessionDurationFormatted}
                  </span>
                  <span className="home-stat-label">Avg Session</span>
                </div>
              </div>
            </>
          ) : (
            <div className="home-chart-empty">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;
