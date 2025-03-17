import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const AdminNotificationIcon = () => {
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminNotifications = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await fetch("http://localhost:3001/notifications/admin", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAdminNotifications(data);
          setUnreadAdminCount(data.filter((n) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Failed to fetch admin notifications", error);
      }
    };

    fetchAdminNotifications();

    // Socket connection setup
    const socket = io("http://localhost:3001");
    socket.on("connect", () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        socket.emit("join-admin-channel", token);
      }
    });

    // Listen for admin notifications
    socket.on("admin-notification", (notification) => {
      setAdminNotifications((prev) => {
        // Prevent duplicate notifications
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      setUnreadAdminCount((prev) => prev + 1);

      // Play notification sound
      try {
        const adminSound = new Audio("/admin-notification.mp3");
        adminSound.play();
      } catch (e) {
        console.log("Audio play error:", e);
      }
    });

    // Listen specifically for new review notifications
    socket.on("new-review", (reviewData) => {
      const notification = {
        id: reviewData._id || `review-${Date.now()}`,
        type: "review",
        message: `New review submitted by ${reviewData.userName || "a user"}`,
        relatedId: reviewData.reviewId,
        createdAt: new Date().toISOString(),
        isRead: false,
        // Additional metadata about the review
        metadata: {
          reviewId: reviewData.reviewId,
          eventId: reviewData.eventId,
          rating: reviewData.rating,
          productName: reviewData.productName
        }
      };
      
      setAdminNotifications((prev) => [notification, ...prev]);
      setUnreadAdminCount((prev) => prev + 1);
      
      // Play review notification sound
      try {
        const reviewSound = new Audio("/review-notification.mp3");
        reviewSound.play();
      } catch (e) {
        console.log("Audio play error:", e);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAdminNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`http://localhost:3001/notifications/admin/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAdminNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadAdminCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark admin notification as read", error);
    }
  };

  const markAllAdminNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:3001/notifications/admin/read-all", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAdminNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadAdminCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all admin notifications as read", error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAdminNotificationAsRead(notification.id);
    setShowDropdown(false);
    
    // Navigate based on notification type
    if (notification.type === "event") {
      navigate(`/admin/events/${notification.relatedId}`);
    } else if (notification.type === "review") {
      navigate(`/response/${notification.relatedId}`);
    }
  };

  return (
    <div className="position-relative">
      <button
        className="btn btn-light position-relative"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Admin Notifications"
      >
        <i className="bi bi-bell-fill fs-5 text-primary"></i>
        {unreadAdminCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadAdminCount > 99 ? "99+" : unreadAdminCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          className="dropdown-menu dropdown-menu-end shadow-sm show"
          style={{
            width: "320px",
            position: "absolute",
            right: 0,
            top: "100%",
            zIndex: 1050,
          }}
        >
          <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
            <span className="fw-bold">Admin Notifications</span>
            {unreadAdminCount > 0 && (
              <button className="btn btn-sm btn-link text-decoration-none" onClick={markAllAdminNotificationsAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="list-group list-group-flush" style={{ maxHeight: "300px", overflowY: "auto" }}>
            {adminNotifications.length === 0 ? (
              <div className="text-center text-muted py-3">No admin notifications</div>
            ) : (
              adminNotifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${
                    notification.isRead ? "bg-white" : "bg-light"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="w-100">
                    <p className="mb-1 text-truncate" title={notification.message}>
                      {notification.message}
                    </p>
                    <small className="text-muted">
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </small>
                    {notification.type === "review" && notification.metadata?.rating && (
                      <div className="mt-1">
                        <small className="text-muted">
                          Rating: {notification.metadata.rating} ★
                        </small>
                        {notification.metadata.productName && (
                          <small className="text-muted d-block">
                            Event: {notification.metadata.productName}
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                  {!notification.isRead && <span className="badge bg-primary rounded-pill">New</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationIcon;