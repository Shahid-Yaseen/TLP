import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { theme } from '../../styles/theme';
import { useState } from 'react';

const Header = ({ title, showBack = false }) => {
  const navigation = useNavigation();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={theme.colors.text} 
              />
            </TouchableOpacity>
          )}
          <Image 
            source={require('../../../assets/tlp-helmet.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>TLP Network Inc.</Text>
        </View>
        <View style={styles.rightSection}>
          {isAuthenticated && (
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons 
                name="notifications-outline" 
                size={22} 
                color={theme.colors.text} 
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {isAuthenticated ? (
            <View style={styles.profileMenuContainer}>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => setShowProfileMenu(true)}
              >
                <Ionicons 
                  name="person-circle-outline" 
                  size={24} 
                  color={theme.colors.text} 
                />
              </TouchableOpacity>
              <Modal
                visible={showProfileMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowProfileMenu(false)}
              >
                <View style={styles.modalOverlay}>
                  <Pressable 
                    style={StyleSheet.absoluteFill}
                    onPress={() => setShowProfileMenu(false)}
                  />
                  <View style={styles.profileMenu}>
                    <View style={styles.profileMenuHeader}>
                      <Text style={styles.profileMenuEmail}>
                        {user?.full_name || user?.email || 'User'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.profileMenuItem}
                      onPress={() => {
                        setShowProfileMenu(false);
                        navigation.navigate('ProfileTab');
                      }}
                    >
                      <Ionicons name="person-outline" size={20} color={theme.colors.text} />
                      <Text style={styles.profileMenuItemText}>Profile</Text>
                    </TouchableOpacity>
                    <View style={styles.profileMenuDivider} />
                    <TouchableOpacity
                      style={styles.profileMenuItem}
                      onPress={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                    >
                      <Ionicons name="log-out-outline" size={20} color={theme.colors.text} />
                      <Text style={styles.profileMenuItemText}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>LOGIN</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {title && (
        <View style={styles.titleBar}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: theme.spacing.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  notificationButton: {
    position: 'relative',
    padding: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  brand: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xs,
    fontWeight: '600',
  },
  link: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.xs,
    fontWeight: '600',
  },
  separator: {
    color: theme.colors.border,
    fontSize: theme.fontSizes.xs,
  },
  titleBar: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderTopWidth: 2,
    borderTopColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  profileMenuContainer: {
    position: 'relative',
  },
  profileButton: {
    padding: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: theme.spacing.md,
    position: 'relative',
  },
  profileMenu: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 1000,
  },
  profileMenuHeader: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileMenuEmail: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  profileMenuItemText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    fontWeight: '500',
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
});

export default Header;

