import { createContext, useState, useEffect, useContext } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Error fetching notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      
      // Set up polling for new notifications
      const interval = setInterval(fetchNotifications, 60000); // every minute
      
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark notification as read
  const markAsRead = async (id) => {
    if (!isAuthenticated) return;

    try {
      await notificationService.markAsRead(id);
      
      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification._id === id
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      setError(err.response?.data?.message || 'Error marking notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isAuthenticated || unreadCount === 0) return;

    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(
        notifications.map((notification) => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Error marking all notifications as read');
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  try {
    const context = useContext(NotificationContext);
    if (!context) {
      console.warn('useNotifications used outside NotificationProvider, returning fallback values');
      // Return a fallback object with empty values to prevent errors
      return {
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        fetchNotifications: () => {},
        markAsRead: () => {},
        markAllAsRead: () => {},
      };
    }
    return context;
  } catch (error) {
    console.error('Error in useNotifications hook:', error);
    // Return fallback values in case of any errors
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      fetchNotifications: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
    };
  }
};

export default NotificationContext;
