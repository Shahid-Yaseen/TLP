import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NOTIFICATION_STORAGE_KEY = '@tlp_notifications';
const EXPO_PUSH_TOKEN_KEY = '@tlp_expo_push_token';

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get Expo Push Token
   */
  async registerForPushNotifications() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get existing token from storage
      const storedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
      if (storedToken) {
        this.expoPushToken = storedToken;
        return storedToken;
      }

      // Register for push notifications
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // You may need to set this in app.json
      });

      this.expoPushToken = token.data;
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token.data);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8B1A1A',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(title, body, data = {}, trigger = null) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: trigger || null, // null means show immediately
      });

      // Save notification to storage
      await this.saveNotification({
        id: notificationId,
        title,
        body,
        data,
        createdAt: new Date().toISOString(),
        read: false,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for upcoming launch
   */
  async scheduleLaunchNotification(launch, minutesBefore = 60) {
    try {
      if (!launch.launch_date && !launch.net) {
        return null;
      }

      const launchDate = new Date(launch.launch_date || launch.net);
      const notificationTime = new Date(launchDate.getTime() - minutesBefore * 60 * 1000);
      const now = new Date();

      // Only schedule if notification time is in the future
      if (notificationTime <= now) {
        return null;
      }

      const title = `🚀 Launch Alert: ${launch.name || 'Upcoming Launch'}`;
      const body = `Launch scheduled in ${minutesBefore} minutes!`;

      const trigger = {
        date: notificationTime,
      };

      return await this.scheduleNotification(title, body, {
        type: 'launch',
        launchId: launch.id,
        launchName: launch.name,
      }, trigger);
    } catch (error) {
      console.error('Error scheduling launch notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.deleteNotification(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await this.clearNotifications();
      return true;
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return false;
    }
  }

  /**
   * Get all notifications from storage
   */
  async getNotifications() {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Save notification to storage
   */
  async saveNotification(notification) {
    try {
      const notifications = await this.getNotifications();
      notifications.unshift(notification); // Add to beginning
      // Keep only last 100 notifications
      const limited = notifications.slice(0, 100);
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(limited));
      return notification;
    } catch (error) {
      console.error('Error saving notification:', error);
      return null;
    }
  }

  /**
   * Delete notification from storage
   */
  async deleteNotification(notificationId) {
    try {
      const notifications = await this.getNotifications();
      const filtered = notifications.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount() {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Set up notification listeners
   */
  setupListeners(onNotificationReceived, onNotificationTapped) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });
  }

  /**
   * Remove notification listeners
   */
  removeListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Clear all notifications from storage
   */
  async clearNotifications() {
    try {
      await AsyncStorage.removeItem(NOTIFICATION_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }
}

export default new NotificationService();

