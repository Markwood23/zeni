import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useNotificationsStore } from '../../store';
import { NotificationType, HomeStackParamList, AppNotification } from '../../types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'NotificationDetail'>;
type RouteType = RouteProp<HomeStackParamList, 'NotificationDetail'>;

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

const getNotificationTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case 'fax_sent': return 'Fax';
    case 'fax_delivered': return 'Delivered';
    case 'fax_failed': return 'Failed';
    case 'scan_complete': return 'Scan';
    case 'convert_complete': return 'Convert';
    case 'ai_complete': return 'AI';
    case 'document_shared': return 'Shared';
    case 'storage_warning': return 'Storage';
    case 'tip': return 'Tip';
    case 'update': return 'Update';
    case 'welcome': return 'Welcome';
    default: return 'Info';
  }
};

const formatDate = (date: Date): string => {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return `Today, ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }
  
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  }) + `, ${timeStr}`;
};

export default function NotificationDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const { notificationId } = route.params;
  const { notifications, markAsRead, deleteNotification } = useNotificationsStore();

  const notification = notifications.find((n: AppNotification) => n.id === notificationId);

  // Mark as read when viewing
  React.useEffect(() => {
    if (notification && !notification.isRead) {
      markAsRead(notificationId);
    }
  }, [notificationId]);

  if (!notification) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
            Notification not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const iconConfig = getNotificationIcon(notification.type);

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNotification(notificationId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAction = () => {
    if (notification.actionRoute) {
      navigation.navigate(notification.actionRoute as any);
    } else if (notification.documentId) {
      navigation.navigate('DocumentView', { documentId: notification.documentId });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + Badge */}
        <View style={styles.topSection}>
          <View style={[styles.iconCircle, { backgroundColor: iconConfig.color + '12' }]}>
            <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
          </View>
          <View style={[styles.badge, { backgroundColor: iconConfig.color }]}>
            <Text style={styles.badgeText}>{getNotificationTypeLabel(notification.type)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {notification.title}
        </Text>

        {/* Time */}
        <Text style={[styles.time, { color: colors.textTertiary }]}>
          {formatDate(notification.createdAt)}
        </Text>

        {/* Divider line */}
        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

        {/* Message */}
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {notification.message}
        </Text>

        {/* Contextual hint - only show if relevant */}
        {(notification.type === 'fax_sent' || notification.type === 'fax_failed' || notification.type === 'storage_warning') && (
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            {notification.type === 'fax_sent' && "You'll be notified when it's delivered."}
            {notification.type === 'fax_failed' && "Check the number and try again."}
            {notification.type === 'storage_warning' && "Free up space or upgrade your plan."}
          </Text>
        )}

        {/* Actions */}
        {(notification.actionRoute || notification.documentId || notification.type === 'fax_failed' || notification.type === 'storage_warning') && (
          <View style={styles.actions}>
            {(notification.actionRoute || notification.documentId) && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={handleAction}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>
                  {notification.actionLabel || (notification.documentId ? 'View Document' : 'Open')}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            )}

            {notification.type === 'fax_failed' && (
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.borderLight }]}
                onPress={() => navigation.navigate('FaxSend' as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            )}

            {notification.type === 'storage_warning' && (
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.borderLight }]}
                onPress={() => navigation.navigate('Storage' as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                  Manage Storage
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  notFoundText: {
    fontSize: typography.fontSize.md,
  },
  // Top section with icon
  topSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Title
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  // Time
  time: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  // Divider
  divider: {
    height: 1,
    marginBottom: spacing.xl,
  },
  // Message
  message: {
    fontSize: typography.fontSize.md,
    lineHeight: 26,
    textAlign: 'center',
  },
  // Hint text
  hint: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
  // Actions
  actions: {
    marginTop: spacing.xl * 1.5,
    gap: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: spacing.sm,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
});
