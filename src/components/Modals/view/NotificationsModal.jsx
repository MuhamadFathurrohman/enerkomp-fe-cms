// src/components/Modals/view/NotificationsModal.jsx
import React, { useState, useEffect } from "react";
import { notificationService } from "../../../services/notificationService";
import { baseService } from "../../../services/baseService";
import "../../../sass/components/Modals/NotificationsModal/NotificationsModal.css";

const NotificationsModal = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllNotifications = async () => {
      setLoading(true);

      try {
        const result = await notificationService.getNotifications(1, 50);

        if (result.success && Array.isArray(result.data)) {
          const notificationsWithDefaults = result.data.map((n) => ({
            ...n,
            priority: n.priority || "medium",
            isRead: n.isRead !== false, // default ke true jika undefined
          }));
          setNotifications(notificationsWithDefaults);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllNotifications();
  }, []);

  return (
    <div className="nm-content">
      <div className="nm-list-wrapper">
        {loading ? (
          <div className="nm-loading">
            <div className="nm-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="nm-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`nm-item ${!notification.isRead ? "nm-unread" : ""}`}
              >
                <div
                  className="nm-priority-dot"
                  data-priority={notification.priority}
                ></div>

                <div className="nm-content-row">
                  <div className="nm-text">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                  </div>
                  <span className="nm-time">
                    {baseService.timeAgo(notification.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="nm-no-data">
            <Bell size={48} className="nm-no-data-icon" />
            <p>No notifications available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsModal;
