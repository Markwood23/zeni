import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsStore } from '../../store';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const {
    pushNotificationsEnabled,
    emailNotificationsEnabled,
    scanCompleteNotifications,
    shareStatusNotifications,
    aiResponseNotifications,
    tipsNotifications,
    updateNotifications,
    setNotificationSetting,
  } = useSettingsStore();

  const notifications = [
    {
      id: 'pushNotificationsEnabled',
      title: 'Push Notifications',
      description: 'Receive notifications on your device',
      value: pushNotificationsEnabled,
    },
    {
      id: 'emailNotificationsEnabled',
      title: 'Email Notifications',
      description: 'Receive updates via email',
      value: emailNotificationsEnabled,
    },
  ];

  const activityNotifications = [
    {
      id: 'scanCompleteNotifications',
      title: 'Scan Complete',
      description: 'When document scanning finishes',
      value: scanCompleteNotifications,
    },
    {
      id: 'shareStatusNotifications',
      title: 'Share Status',
      description: 'Updates on document sharing',
      value: shareStatusNotifications,
    },
    {
      id: 'aiResponseNotifications',
      title: 'AI Responses',
      description: 'When AI finishes processing',
      value: aiResponseNotifications,
    },
  ];

  const otherNotifications = [
    {
      id: 'tipsNotifications',
      title: 'Tips & Tutorials',
      description: 'Learn how to use Zeni better',
      value: tipsNotifications,
    },
    {
      id: 'updateNotifications',
      title: 'App Updates',
      description: 'New features and improvements',
      value: updateNotifications,
    },
  ];

  const renderNotificationItem = (item: any) => (
    <View 
      key={item.id}
      style={[styles.notificationItem, { borderBottomColor: colors.borderLight }]}
    >
      <View style={styles.notificationInfo}>
        <Text style={[styles.notificationTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.notificationDesc, { color: colors.textTertiary }]}>{item.description}</Text>
      </View>
      <Switch
        value={item.value}
        onValueChange={(value) => setNotificationSetting(item.id, value)}
        trackColor={{ false: colors.border, true: colors.primary + '50' }}
        thumbColor={item.value ? colors.primary : colors.textTertiary}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* General Notifications */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GENERAL</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {notifications.map(renderNotificationItem)}
        </View>

        {/* Activity Notifications */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIVITY</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {activityNotifications.map(renderNotificationItem)}
        </View>

        {/* Other Notifications */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>OTHER</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {otherNotifications.map(renderNotificationItem)}
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  section: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: typography.fontSize.sm,
  },
});
