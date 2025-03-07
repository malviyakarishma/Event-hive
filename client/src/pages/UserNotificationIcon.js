import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const UserNotificationIcon = () => {
  const [userNotifications, setUserNotifications] = useState([]);
  const [unreadUserCount, setUnreadUserCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUserNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/notifications/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserNotifications(data);
          setUnreadUserCount(data.filter((n) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Failed to fetch user notifications", error);
      }
    };

    fetchUserNotifications();

    // Socket connection setup
    const socket = io(process.env.REACT_APP_API_URL || "http://localhost:5000");
    socket.on("connect", () => {
      const token = localStorage.getItem("token");
      if (token) {
        socket.emit("authenticate", token);
      }
    });

    // Listen for user notifications
    socket.on("user-notification", (notification) => {
      setUserNotifications((prev) => {
        // Prevent duplicate notifications
        if (prev.some((n) => n._id === notification._id)) return prev;
        return [notification, ...prev];
      });
      setUnreadUserCount((prev) => prev + 1);

      // Play notification sound
      try {
        const userSound = new Audio("/user-notification.mp3");
        userSound.play();
      } catch (e) {
        console.log("Audio play error:", e);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markUserNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/notifications/user/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUserNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadUserCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark user notification as read", error);
    }
  };

  const markAllUserNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/notifications/user/read-all", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUserNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadUserCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all user notifications as read", error);
    }
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-blue-100"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="User Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-blue-600"
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

        {unreadUserCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full">
            {unreadUserCount > 99 ? "99+" : unreadUserCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-blue-200">
          <div className="flex justify-between items-center px-4 py-2 bg-blue-100">
            <h3 className="text-lg font-medium text-blue-800">User Notifications</h3>
            {unreadUserCount > 0 && (
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={markAllUserNotificationsAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {userNotifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">No user notifications</div>
            ) : (
              <ul>
                {userNotifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={`px-4 py-3 border-b hover:bg-gray-50 ${
                      notification.isRead ? "bg-white" : "bg-blue-50"
                    }`}
                    onClick={() => markUserNotificationAsRead(notification._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.type === "event" && (
                          <a
                            href={`/event/${notification.relatedId}`}
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Event
                          </a>
                        )}
                      </div>
                      {!notification.isRead && (
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
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

export default UserNotificationIcon;