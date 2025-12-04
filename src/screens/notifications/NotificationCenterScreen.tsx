import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useNotificationsStore } from '../../store';
import { AppNotification, NotificationType, HomeStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'NotificationCenter'>;

const getNotificationIcon = (type: NotificationType): { name: keyof typeof Ionicons.glyphMap; color: string } => {
  switch (type) {
    case 'fax_sent':
      return { name: 'paper-plane', color: '#017DE9' };
    case 'fax_delivered':
      return { name: 'checkmark-circle', color: '#34C759' };
    case 'fax_failed':
      return { name: 'alert-circle', color: '#FF3B30' };
    case 'scan_complete':
      return { name: 'scan', color: '#5856D6' };
    case 'convert_complete':
      return { name: 'swap-horizontal', color: '#FF9500' };
    case 'ai_complete':
      return { name: 'sparkles', color: '#AF52DE' };
    case 'document_shared':
      return { name: 'share', color: '#00C7BE' };
    case 'storage_warning':
      return { name: 'warning', color: '#FF9500' };
    case 'tip':
      return { name: 'bulb', color: '#FFCC00' };
    case 'update':
      return { name: 'rocket', color: '#017DE9' };
    case 'welcome':
      return { name: 'sparkles', color: '#FF2D55' };
    default:
      return { name: 'notifications', color: '#8E8E93' };
  }
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function NotificationCenterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAllNotifications 
  } = useNotificationsStore();

  const handleNotificationPress = (notification: AppNotification) => {
    // Navigate to notification detail
    navigation.navigate('NotificationDetail', { notificationId: notification.id });
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotification(id);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAllNotifications,
        },
      ]
    );
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const iconConfig = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: item.isRead ? colors.surface : colors.primaryLight },
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + '20' }]}>
          <Ionicons name={iconConfig.name} size={24} color={iconConfig.color} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text 
              style={[
                styles.notificationTitle, 
                { color: colors.textPrimary },
                !item.isRead && styles.unreadTitle
              ]} 
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.isRead && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
          <Text 
            style={[styles.notificationMessage, { color: colors.textSecondary }]} 
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="notifications-off-outline" size={48} color={colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Notifications</Text>
      <Text style={[styles.emptyDescription, { color: colors.textTertiary }]}>
        You're all caught up! Notifications about your{'\n'}documents and activities will appear here.
      </Text>
    </View>
  );

  const renderSectionHeader = () => {
    if (notifications.length === 0) return null;
    
    return (
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {unreadCount > 0 ? `${unreadCount} Unread` : 'All Notifications'}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent
        ]}
        ListHeaderComponent={renderSectionHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  clearButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyListContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  markAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  notificationTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
  },
  deleteButton: {
    padding: spacing.xs,
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
