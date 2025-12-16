import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, Document, ShareJob } from '../../types';
import { useDocumentsStore, useShareStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Send'>;

interface ShareOption {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
}

const shareOptions: ShareOption[] = [
  {
    id: 'email',
    name: 'Email',
    icon: 'mail-outline',
    color: '#ef4444',
    description: 'Send directly to any email address',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#22c55e',
    description: 'Share via WhatsApp message',
  },
  {
    id: 'link',
    name: 'Zeni Link',
    icon: 'link-outline',
    color: '#017DE9',
    description: 'Create a shareable link with permissions',
  },
];

export default function SendScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<HomeStackParamList, 'Send'>>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documents } = useDocumentsStore();
  const { shareJobs } = useShareStore();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const recentShares = shareJobs.slice(0, 5);

  const handleSelectOption = (option: ShareOption) => {
    setSelectedOption(option.id);
    // Navigate to send/share screen with the selected method
    navigation.navigate('SendShare', { documentId: route.params?.documentId || '' });
  };

  const getStatusColor = (status: ShareJob['status']) => {
    switch (status) {
      case 'delivered':
        return colors.success;
      case 'failed':
        return colors.error;
      case 'sending':
        return colors.warning;
      default:
        return colors.textTertiary;
    }
  };

  const renderShareOption = ({ item }: { item: ShareOption }) => (
    <TouchableOpacity
      style={styles.optionCard}
      onPress={() => handleSelectOption(item)}
    >
      <View style={[styles.optionIcon, { backgroundColor: item.color + '15' }]}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <View style={styles.optionInfo}>
        <Text style={styles.optionName}>{item.name}</Text>
        <Text style={styles.optionDesc}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  const renderShareHistory = ({ item }: { item: ShareJob }) => {
    const doc = documents.find((d) => d.id === item.documentId);
    return (
      <TouchableOpacity style={styles.historyCard}>
        <View style={[styles.historyIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.historyName} numberOfLines={1}>
            {doc?.name || 'Document'}
          </Text>
          <Text style={styles.historyRecipient}>{item.recipientName || item.recipientEmail}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send & Share</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="send" size={32} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Share Documents Instantly</Text>
          <Text style={styles.heroSubtitle}>
            Send via email, WhatsApp, or create a shareable Zeni link
          </Text>
        </View>

        {/* Share Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose how to share</Text>
          {shareOptions.map((option) => (
            <View key={option.id}>
              {renderShareOption({ item: option })}
            </View>
          ))}
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Zeni Link Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="eye-outline" size={18} color={colors.success} />
              </View>
              <Text style={styles.featureText}>Set view-only or download permissions</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="time-outline" size={18} color={colors.warning} />
              </View>
              <Text style={styles.featureText}>Add expiration dates to links</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.featureText}>Password protect your shares</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="analytics-outline" size={18} color={colors.error} />
              </View>
              <Text style={styles.featureText}>Track who viewed your document</Text>
            </View>
          </View>
        </View>

        {/* Share History */}
        {recentShares.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Shares</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllDocuments', { initialFilter: 'shared' } as any)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentShares.map((share) => (
              <View key={share.id}>{renderShareHistory({ item: share })}</View>
            ))}
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  featuresSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  featuresList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  historyRecipient: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
