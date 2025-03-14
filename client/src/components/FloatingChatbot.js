import React, { useEffect, useState } from 'react';
import ChatbotUI from './ChatbotUI';

export default function FloatingChatbot() {
  const [isMounted, setIsMounted] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Function to check admin status using multiple methods
    const checkAdminStatus = () => {
      console.log('Checking admin status...');
      
      // Try multiple storage locations and formats
      const storageKeys = ['token', 'authToken', 'user', 'userData', 'currentUser'];
      const storageTypes = [localStorage, sessionStorage];
      
      // Variable to track if we found admin status
      let isAdmin = false;
      let methodUsed = '';
      
      // Check direct admin flag in window or global object
      if (window.isAdmin === true) {
        console.log('Found admin flag in window object');
        isAdmin = true;
        methodUsed = 'window.isAdmin';
      }
      
      // Method 1: Try to find token in different storage locations
      if (!isAdmin) {
        for (const storage of storageTypes) {
          for (const key of storageKeys) {
            const item = storage.getItem(key);
            if (item) {
              console.log(`Found item in ${storage === localStorage ? 'localStorage' : 'sessionStorage'}: ${key}`);
              
              // Try parsing as JSON
              try {
                const parsed = JSON.parse(item);
                
                // Check for admin in parsed object
                if (parsed.isAdmin === true) {
                  console.log(`Found isAdmin=true in ${key}`);
                  isAdmin = true;
                  methodUsed = `${storage === localStorage ? 'localStorage' : 'sessionStorage'}.${key}.isAdmin`;
                  break;
                }
                
                // Check for role in parsed object
                if (parsed.role === 'admin' || parsed.userRole === 'admin') {
                  console.log(`Found role=admin in ${key}`);
                  isAdmin = true;
                  methodUsed = `${storage === localStorage ? 'localStorage' : 'sessionStorage'}.${key}.role`;
                  break;
                }
              } catch (e) {
                // Not JSON, try to check if it's a JWT token
                if (item.includes('.')) {
                  try {
                    const parts = item.split('.');
                    if (parts.length === 3) {
                      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                      if (payload.isAdmin === true) {
                        console.log(`Found isAdmin=true in JWT token from ${key}`);
                        isAdmin = true;
                        methodUsed = `${storage === localStorage ? 'localStorage' : 'sessionStorage'}.${key} (JWT)`;
                        break;
                      }
                    }
                  } catch (tokenError) {
                    console.log(`Error parsing possible token from ${key}:`, tokenError);
                  }
                }
              }
            }
          }
          if (isAdmin) break;
        }
      }
      
      // Method 2: Check URL for admin indicators
      if (!isAdmin) {
        const url = window.location.href.toLowerCase();
        if (url.includes('/admin') || url.includes('admin=true') || url.includes('role=admin')) {
          console.log('Found admin indicator in URL');
          isAdmin = true;
          methodUsed = 'URL pattern';
        }
      }
    
      // IMPORTANT: Set the opposite of isAdmin to control chatbot visibility
      setShowChatbot(!isAdmin);
      
      console.log('Admin detection complete:');
      console.log('- Is admin:', isAdmin);
      console.log('- Method used:', methodUsed);
      console.log('- Show chatbot:', !isAdmin);
      
      // Force value to be definitely false if we're in admin section
      if (window.location.pathname.includes('/admin')) {
        console.log('Force hiding chatbot because we are in admin section');
        setShowChatbot(false);
      }
    };
    
    // Initial check
    checkAdminStatus();
    
    // Also check when URL changes
    const handleUrlChange = () => {
      console.log('URL changed, rechecking admin status');
      checkAdminStatus();
    };
    
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);
  
  // Don't render if not mounted or shouldn't show chatbot
  if (!isMounted || !showChatbot) {
    return null;
  }
  
  return <ChatbotUI />;
}