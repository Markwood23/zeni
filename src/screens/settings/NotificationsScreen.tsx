import React, { useState } from 'react';
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

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [scanComplete, setScanComplete] = useState(true);
  const [faxStatus, setFaxStatus] = useState(true);
  const [aiResponses, setAiResponses] = useState(true);
  const [tips, setTips] = useState(false);
  const [updates, setUpdates] = useState(true);

  const notifications = [
    {
      id: 'push',
      title: 'Push Notifications',
      description: 'Receive notifications on your device',
      value: pushEnabled,
      onChange: setPushEnabled,
    },
    {
      id: 'email',
      title: 'Email Notifications',
      description: 'Receive updates via email',
      value: emailEnabled,
      onChange: setEmailEnabled,
    },
  ];

  const activityNotifications = [
    {
      id: 'scan',
      title: 'Scan Complete',
      description: 'When document scanning finishes',
      value: scanComplete,
      onChange: setScanComplete,
    },
    {
      id: 'fax',
      title: 'Fax Status',
      description: 'Updates on fax delivery',
      value: faxStatus,
      onChange: setFaxStatus,
    },
    {
      id: 'ai',
      title: 'AI Responses',
      description: 'When AI finishes processing',
      value: aiResponses,
      onChange: setAiResponses,
    },
  ];

  const otherNotifications = [
    {
      id: 'tips',
      title: 'Tips & Tutorials',
      description: 'Learn how to use Zeni better',
      value: tips,
      onChange: setTips,
    },
    {
      id: 'updates',
      title: 'App Updates',
      description: 'New features and improvements',
      value: updates,
      onChange: setUpdates,
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
        onValueChange={item.onChange}
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
