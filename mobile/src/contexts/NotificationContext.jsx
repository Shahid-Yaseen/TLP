import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notificationService from '../services/notifications';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useRef(null);

  useEffect(() => {
    initializeNotifications();
    return () => {
      notificationService.removeListeners();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      // Request permissions and register for push notifications
      const token = await notificationService.registerForPushNotifications();
      setExpoPushToken(token);

      // Load stored notifications
      await loadNotifications();

      // Set up notification listeners
      notificationService.setupListeners(
        handleNotificationReceived,
        handleNotificationTapped
      );
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const stored = await notificationService.getNotifications();
      setNotifications(stored);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationReceived = useCallback((notification) => {
    // Add notification to list when received
    const newNotification = {
      id: notification.request.identifier,
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const handleNotificationTapped = useCallback((response) => {
    const { notification } = response;
    const data = notification.request.content.data;

    // Mark as read
    if (notification.request.identifier) {
      markAsRead(notification.request.identifier);
    }

    // Navigation will be handled by the AppNavigator's notification listener
    // Store the notification data for navigation
    if (data) {
      // You can emit an event or use a navigation service here
      // For now, navigation will be handled manually when user opens the app
    }
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.clearNotifications();
      await loadNotifications();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const scheduleLaunchNotification = async (launch, minutesBefore = 60) => {
    try {
      const notificationId = await notificationService.scheduleLaunchNotification(
        launch,
        minutesBefore
      );
      if (notificationId) {
        await loadNotifications();
      }
      return notificationId;
    } catch (error) {
      console.error('Error scheduling launch notification:', error);
      return null;
    }
  };

  const cancelNotification = async (notificationId) => {
    try {
      await notificationService.cancelNotification(notificationId);
      await loadNotifications();
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  };

  const setNavigationRef = (ref) => {
    navigationRef.current = ref;
  };

  const value = {
    notifications,
    unreadCount,
    expoPushToken,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    scheduleLaunchNotification,
    cancelNotification,
    refreshNotifications: loadNotifications,
    setNavigationRef,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

