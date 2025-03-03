import React, { useState } from 'react';
import { useNotifications } from '../helpers/NotificationContext';

const NotificationIcon = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  return (
    <div className="relative">
      <button 
        className="relative p-2 rounded-full hover:bg-gray-100" 
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
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
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 transition-all duration-200">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-100">
            <h3 className="text-lg font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">No notifications yet</div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li 
                    key={notification._id} 
                    className={`px-4 py-3 border-b hover:bg-gray-50 ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}
                    onClick={() => markAsRead(notification._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.type === 'event' && (
                          <a 
                            href={`/event/${notification.relatedId}`}
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                          >
                            View Event
                          </a>
                        )}
                        {notification.type === 'review' && (
                          <a 
                            href={`/review/${notification.relatedId}`}
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                          >
                            View Review
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

export default NotificationIcon;
