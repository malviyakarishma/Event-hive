import React, { useEffect, useState } from 'react';
import ChatbotUI from './ChatbotUI';

export default function FloatingChatbot() {
  // Start with not determined status to prevent premature rendering
  const [adminStatus, setAdminStatus] = useState({ determined: false, isAdmin: false });
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Function to comprehensively check admin status
    const checkAdminStatus = () => {
      console.log('Running comprehensive admin status check...');
      
      // Try multiple storage locations and formats
      const storageKeys = ['token', 'authToken', 'user', 'userData', 'currentUser', 'auth', 'userInfo', 'profile'];
      const storageTypes = [localStorage, sessionStorage];
      
      // Variable to track if we found admin status
      let isAdmin = false;
      let methodUsed = 'Not found - assuming regular user';
      
      // Check direct admin flag in window or global object (expanded checks)
      if (window.isAdmin === true || 
          window.admin === true || 
          window.user?.isAdmin === true || 
          window.user?.role === 'admin' || 
          window.userData?.isAdmin === true) {
        console.log('Found admin flag in window object');
        isAdmin = true;
        methodUsed = 'window object';
      }
      
      // Method 1: Try to find token/user data in different storage locations
      if (!isAdmin) {
        storageLoop: for (const storage of storageTypes) {
          for (const key of storageKeys) {
            const item = storage.getItem(key);
            if (item) {
              console.log(`Found item in ${storage === localStorage ? 'localStorage' : 'sessionStorage'}: ${key}`);
              
              // Try parsing as JSON
              try {
                const parsed = JSON.parse(item);
                
                // Define a recursive function to search for admin flags
                const findAdminFlag = (obj, path = '') => {
                  if (!obj || typeof obj !== 'object') return false;
                  
                  // Check common admin indicators
                  if (obj.isAdmin === true || obj.admin === true || 
                      obj.role === 'admin' || obj.userRole === 'admin' ||
                      obj.type === 'admin' || obj.accountType === 'admin') {
                    console.log(`Found admin indicator at ${path}`);
                    return true;
                  }
                  
                  // Check nested objects (up to 3 levels deep to avoid excessive recursion)
                  for (const prop in obj) {
                    if (typeof obj[prop] === 'object' && obj[prop] !== null) {
                      if (findAdminFlag(obj[prop], `${path}.${prop}`)) {
                        return true;
                      }
                    }
                  }
                  
                  return false;
                };
                
                if (findAdminFlag(parsed, key)) {
                  isAdmin = true;
                  methodUsed = `${storage === localStorage ? 'localStorage' : 'sessionStorage'}.${key} (nested property)`;
                  break storageLoop;
                }
              } catch (e) {
                // Not JSON, try to check if it's a JWT token
                if (typeof item === 'string' && item.includes('.')) {
                  try {
                    const parts = item.split('.');
                    if (parts.length === 3) {
                      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                      if (payload.isAdmin === true || payload.admin === true || 
                          payload.role === 'admin' || payload.userRole === 'admin') {
                        console.log(`Found admin indicator in JWT token from ${key}`);
                        isAdmin = true;
                        methodUsed = `${storage === localStorage ? 'localStorage' : 'sessionStorage'}.${key} (JWT)`;
                        break storageLoop;
                      }
                    }
                  } catch (tokenError) {
                    console.log(`Error parsing possible token from ${key}:`, tokenError);
                  }
                }
              }
            }
          }
        }
      }
      
      // Method 2: Check URL for admin indicators (expanded checks)
      if (!isAdmin) {
        const url = window.location.href.toLowerCase();
        const path = window.location.pathname.toLowerCase();
        if (url.includes('/admin') || url.includes('admin=true') || 
            url.includes('role=admin') || path.includes('/admin') ||
            path.includes('/dashboard') || path.includes('/manage')) {
          console.log('Found admin indicator in URL');
          isAdmin = true;
          methodUsed = 'URL pattern';
        }
      }
      
      // Method 3: Check cookies for admin information
      if (!isAdmin && document.cookie) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if ((name.includes('admin') && value === 'true') ||
              (name.includes('role') && value === 'admin') ||
              (name.includes('user') && value.includes('admin'))) {
            console.log('Found admin indicator in cookies');
            isAdmin = true;
            methodUsed = 'cookies';
            break;
          }
        }
      }
      
      // Method 4: Check for DOM elements that might indicate admin interface
      if (!isAdmin) {
        const adminElements = document.querySelectorAll('.admin-panel, .admin-area, #admin-dashboard, [data-role="admin"]');
        if (adminElements.length > 0) {
          console.log('Found admin UI elements in DOM');
          isAdmin = true;
          methodUsed = 'DOM elements';
        }
      }
    
      console.log('Admin detection complete:');
      console.log('- Is admin:', isAdmin);
      console.log('- Method used:', methodUsed);
      
      // Update state with determined status
      setAdminStatus({ determined: true, isAdmin });
    };
    
    // Initial check
    checkAdminStatus();
    
    // Run the check again after a delay to catch any late-loading auth data
    const delayedCheck = setTimeout(() => {
      console.log('Running delayed admin check');
      checkAdminStatus();
    }, 1500);
    
    // Check when URL changes
    const handleUrlChange = () => {
      console.log('URL changed, rechecking admin status');
      checkAdminStatus();
    };
    
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    
    // Periodically check for changes (e.g., if user logs in as admin during the session)
    const periodicCheck = setInterval(() => {
      checkAdminStatus();
    }, 30000); // Every 30 seconds
    
    // Clean up event listeners and timers
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      clearTimeout(delayedCheck);
      clearInterval(periodicCheck);
    };
  }, []);
  
  // Rendering logic:
  // 1. Don't render while admin status is being determined
  if (!isMounted || !adminStatus.determined) {
    return null;
  }
  
  // 2. Don't render if user is an admin
  if (adminStatus.isAdmin) {
    console.log('Not rendering chatbot: user is admin');
    return null;
  }
  
  // 3. Only render for confirmed non-admin users
  console.log('Rendering chatbot for regular user');
  return <ChatbotUI />;
}