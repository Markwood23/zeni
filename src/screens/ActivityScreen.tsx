import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useActivityStore, useDocumentsStore } from '../store';
import { Activity, MainTabParamList, HomeStackParamList, Document } from '../types';

// Composite navigation type for navigating from tab to nested stack
type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Activity'>,
  NativeStackNavigationProp<HomeStackParamList>
>;

export default function ActivityScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { activities, clearActivities } = useActivityStore();
  const { documents } = useDocumentsStore();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Scroll to top
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getActivityIcon = (type: Activity['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'scan':
        return 'scan-outline';
      case 'edit':
        return 'create-outline';
      case 'convert':
        return 'swap-horizontal-outline';
      case 'send':
        return 'send-outline';
      case 'share':
        return 'share-outline';
      case 'ai_chat':
        return 'sparkles-outline';
      case 'upload':
        return 'cloud-upload-outline';
      case 'delete':
        return 'trash-outline';
      case 'move':
        return 'folder-outline';
      case 'import':
        return 'download-outline';
      default:
        return 'document-outline';
    }
  };

  const getActivityColor = (type: Activity['type']): string => {
    switch (type) {
      case 'scan':
        return colors.scanIcon;
      case 'edit':
        return colors.editIcon;
      case 'convert':
        return colors.convertIcon;
      case 'send':
        return colors.primary;
      case 'share':
        return colors.shareIcon;
      case 'ai_chat':
        return colors.askAiIcon;
      case 'upload':
        return colors.uploadedIcon;
      case 'delete':
        return colors.deleteIcon;
      case 'move':
        return colors.folderIcon;
      case 'import':
        return colors.importedIcon;
      default:
        return colors.primary;
    }
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
    const doc = item.documentId ? documents.find((d: Document) => d.id === item.documentId) : null;
    const iconColor = getActivityColor(item.type);

    const handlePress = () => {
      if (doc) {
        // Navigate to Home tab's DocumentView screen
        navigation.navigate('Home', { 
          screen: 'DocumentView', 
          params: { documentId: doc.id } 
        } as any);
      }
    };

    return (
      <TouchableOpacity 
        style={styles.activityCard}
        onPress={handlePress}
        disabled={!doc}
      >
        {/* Document Thumbnail */}
        {doc && doc.thumbnail ? (
          <View style={styles.thumbnailContainer}>
            <Image 
              source={{ uri: doc.thumbnail }} 
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={[styles.activityIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }]}>
            <Ionicons name={getActivityIcon(item.type)} size={20} color={iconColor} />
          </View>
        )}
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          {doc && (
            <Text style={styles.documentName} numberOfLines={1}>
              {doc.name}
            </Text>
          )}
          {item.description && !doc && (
            <Text style={styles.activityDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          <View style={styles.activityMeta}>
            <Ionicons name={getActivityIcon(item.type)} size={12} color={colors.textTertiary} />
            <Text style={styles.activityTime}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        {doc && (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        )}
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
        ref={flatListRef}
        data={groupedActivities}
        renderItem={renderSection}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
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
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  thumbnailContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  documentName: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
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
