"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"

const NotificationIcon = ({ notifications, markAsRead, markAllAsRead }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    setShowDropdown(false)

    // Navigate based on notification type
    if (notification.type === "event") {
      navigate(`/event/${notification.relatedId}`)
    } else if (notification.type === "review") {
      navigate(`/response/${notification.relatedId}`)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="notification-icon position-relative me-3">
      <i
        className="bi bi-bell-fill text-white"
        style={{ fontSize: "24px", cursor: "pointer" }}
        onClick={() => setShowDropdown(!showDropdown)}
      ></i>
      {unreadCount > 0 && (
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {unreadCount}
        </span>
      )}

      {showDropdown && (
        <div
          className="notification-dropdown bg-white text-dark p-3 rounded position-absolute end-0"
          style={{ width: "300px", maxHeight: "400px", overflowY: "auto", zIndex: 1000 }}
        >
          {notifications.length > 0 ? (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item d-flex justify-content-between align-items-center mb-2 p-2 ${notification.isRead ? "" : "bg-light"}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: "pointer" }}
                >
                  <p className="m-0">{notification.message}</p>
                  {!notification.isRead && <span className="badge bg-primary">New</span>}
                </div>
              ))}
              <button className="btn btn-sm btn-primary w-100" onClick={() => markAllAsRead()}>
                Mark All as Read
              </button>
            </>
          ) : (
            <p className="text-center m-0">No notifications</p>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationIcon

