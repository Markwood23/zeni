import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useActivityStore, useDocumentsStore } from '../store';
import { Activity } from '../types';

export default function ActivityScreen() {
  const { activities, clearActivities } = useActivityStore();
  const { documents } = useDocumentsStore();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const getActivityIcon = (type: Activity['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'scan':
        return 'scan-outline';
      case 'edit':
        return 'create-outline';
      case 'convert':
        return 'swap-horizontal-outline';
      case 'fax':
        return 'print-outline';
      case 'share':
        return 'share-outline';
      case 'ai_chat':
        return 'sparkles-outline';
      case 'upload':
        return 'cloud-upload-outline';
      default:
        return 'document-outline';
    }
  };

  const getActivityColor = (type: Activity['type']): string => {
    // Grayscale design - use neutral colors for all activity icons
    return colors.textSecondary;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const groupActivitiesByDate = (activities: Activity[]) => {
    const groups: { [key: string]: Activity[] } = {};
    
    activities.forEach((activity) => {
      const date = new Date(activity.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(activity);
    });

    return Object.entries(groups).map(([date, items]) => ({ date, items }));
  };

  const groupedActivities = groupActivitiesByDate(activities);

  const renderActivityItem = ({ item }: { item: Activity }) => {
    const doc = item.documentId ? documents.find((d) => d.id === item.documentId) : null;
    const iconColor = getActivityColor(item.type);

    return (
      <TouchableOpacity style={styles.activityCard}>
        <View style={[styles.activityIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }]}>
          <Ionicons name={getActivityIcon(item.type)} size={20} color={iconColor} />
        </View>
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.activityDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          <Text style={styles.activityTime}>{formatDate(item.createdAt)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  const renderSection = ({ item }: { item: { date: string; items: Activity[] } }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{item.date}</Text>
      {item.items.map((activity) => (
        <View key={activity.id}>{renderActivityItem({ item: activity })}</View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        {activities.length > 0 && (
          <TouchableOpacity onPress={clearActivities}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Activity List */}
      <FlatList
        data={groupedActivities}
        renderItem={renderSection}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={64} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyDescription}>
              Your recent actions will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  clearText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textTertiary,
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  activityDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  activityTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.huge * 2,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
