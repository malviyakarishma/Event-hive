import React, { useState, useEffect, useRef, useContext } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../helpers/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const UserNotificationIcon = () => {
  const { authState } = useContext(AuthContext);
  const [userNotifications, setUserNotifications] = useState([]);
  const [unreadUserCount, setUnreadUserCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current !== event.target
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!authState.status) return;

    const fetchUserNotifications = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        const response = await fetch("http://localhost:3001/notifications", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUserNotifications(data);
          setUnreadUserCount(data.filter((n) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchUserNotifications();

    socketRef.current = io("http://localhost:3001");

    socketRef.current.on("connect", () => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken && authState.id) {
        socketRef.current.emit("authenticate", { token: accessToken, userId: authState.id });
        socketRef.current.emit("join-user-room", authState.id);
      }
    });

    socketRef.current.on("user-notification", (notification) => {
      setUserNotifications((prev) => 
        prev.some((n) => n.id === notification.id) ? prev : [notification, ...prev]
      );
      setUnreadUserCount((prev) => prev + 1);
    });

    return () => socketRef.current && socketRef.current.disconnect();
  }, [authState.status, authState.id]);

  const markUserNotificationAsRead = async (notificationId) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(`http://localhost:3001/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        setUserNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadUserCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  return (
    <div className="position-relative">
      <button
        ref={buttonRef}
        className="btn btn-light position-relative"
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        <i className="bi bi-bell-fill fs-5"></i>
        {unreadUserCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadUserCount > 99 ? "99+" : unreadUserCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="dropdown-menu dropdown-menu-end shadow-sm p-2 show"
          style={{
            width: "320px",
            position: "absolute",
            right: 0,
            top: "100%",
            zIndex: 1050,
          }}
        >
          <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
            <span className="fw-bold">Notifications</span>
            {unreadUserCount > 0 && (
              <button
                className="btn btn-sm btn-link text-decoration-none"
                onClick={() => {
                  setUserNotifications((prev) =>
                    prev.map((n) => ({ ...n, isRead: true }))
                  );
                  setUnreadUserCount(0);
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="list-group list-group-flush" style={{ maxHeight: "300px", overflowY: "auto" }}>
            {userNotifications.length === 0 ? (
              <div className="text-center text-muted py-3">No notifications</div>
            ) : (
              userNotifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${notification.isRead ? "bg-white" : "bg-light"}`}
                  onClick={() => markUserNotificationAsRead(notification.id)}
                >
                  <div className="w-100">
                    <p className="mb-1 text-truncate" title={notification.message}>{notification.message}</p>
                    <small className="text-muted">{new Date(notification.createdAt).toLocaleTimeString()}</small>
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

export default UserNotificationIcon;
