"use client"

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
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/notifications/admin", {
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
    const socket = io(process.env.REACT_APP_API_URL || "http://localhost:5000");
    socket.on("connect", () => {
      const token = localStorage.getItem("token");
      if (token) {
        socket.emit("join-admin-channel", token);
      }
    });

    // Listen for admin notifications
    socket.on("admin-notification", (notification) => {
      setAdminNotifications((prev) => {
        // Prevent duplicate notifications
        if (prev.some((n) => n._id === notification._id)) return prev;
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
        _id: reviewData._id || `review-${Date.now()}`,
        type: "review",
        message: `New review submitted by ${reviewData.userName || "a user"}`,
        relatedId: reviewData.reviewId,
        createdAt: new Date().toISOString(),
        isRead: false,
        // Additional metadata about the review
        reviewRating: reviewData.rating,
        productId: reviewData.productId,
        productName: reviewData.productName
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
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/notifications/admin/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAdminNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadAdminCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark admin notification as read", error);
    }
  };

  const markAllAdminNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/notifications/admin/read-all", {
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
    markAdminNotificationAsRead(notification._id);
    setShowDropdown(false);
    
    // Navigate based on notification type
    if (notification.type === "event") {
      navigate(`/admin/events/${notification.relatedId}`);
    } else if (notification.type === "review") {
      navigate(`/admin/reviews/${notification.relatedId}`);
    }
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-purple-100"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Admin Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-purple-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadAdminCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-purple-600 rounded-full">
            {unreadAdminCount > 99 ? "99+" : unreadAdminCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-purple-200">
          <div className="flex justify-between items-center px-4 py-2 bg-purple-100">
            <h3 className="text-lg font-medium text-purple-800">Admin Notifications</h3>
            {unreadAdminCount > 0 && (
              <button
                className="text-sm text-purple-600 hover:text-purple-800"
                onClick={markAllAdminNotificationsAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {adminNotifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">No admin notifications</div>
            ) : (
              <ul>
                {adminNotifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={`px-4 py-3 border-b hover:bg-gray-50 ${
                      notification.isRead ? "bg-white" : "bg-purple-50"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.type === "event" && (
                          <a
                            href={`/admin/events/${notification.relatedId}`}
                            className="text-xs text-purple-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Manage Event
                          </a>
                        )}
                        {notification.type === "review" && (
                          <a
                            href={`/admin/reviews/${notification.relatedId}`}
                            className="text-xs text-purple-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Review Report
                          </a>
                        )}
                        {notification.type === "review" && notification.reviewRating && (
                          <p className="text-xs text-gray-600">
                            Rating: {notification.reviewRating} ★
                          </p>
                        )}
                      </div>
                      {!notification.isRead && (
                        <span className="inline-block w-2 h-2 bg-purple-600 rounded-full"></span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationIcon;