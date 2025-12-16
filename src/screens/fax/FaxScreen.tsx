import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, Institution, Document, FaxJob } from '../../types';
import { useDocumentsStore, useFaxStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Fax'>;

const institutions: Institution[] = [
  { id: '1', name: 'UG Academic Affairs', faxNumber: '+233-30-2500123', department: 'Academic Affairs', category: 'university' },
  { id: '2', name: 'KNUST Admissions', faxNumber: '+233-32-2060321', department: 'Admissions Office', category: 'university' },
  { id: '3', name: 'UCC Registry', faxNumber: '+233-33-2130901', department: 'Registry', category: 'university' },
  { id: '4', name: 'Ghana Immigration Service', faxNumber: '+233-30-2258250', department: 'Passport Office', category: 'government' },
  { id: '5', name: 'NSS Headquarters', faxNumber: '+233-30-2683561', department: 'National Service', category: 'government' },
  { id: '6', name: 'US Embassy Ghana', faxNumber: '+233-30-2741389', department: 'Visa Section', category: 'embassy' },
];

export default function FaxScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<HomeStackParamList, 'Fax'>>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documents } = useDocumentsStore();
  const { faxJobs } = useFaxStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['university', 'government', 'embassy'];
  
  const filteredInstitutions = institutions.filter((inst) => {
    const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || inst.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const recentFaxes = faxJobs.slice(0, 5);

  const handleSelectInstitution = (institution: Institution) => {
    // Navigate to document selection then fax send
    navigation.navigate('FaxSend', { documentId: route.params?.documentId || '' });
  };

  const handleManualEntry = () => {
    navigation.navigate('FaxSend', { documentId: route.params?.documentId || '' });
  };

  const getStatusColor = (status: FaxJob['status']) => {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'university':
        return colors.primary; // Blue for education
      case 'embassy':
        return '#06b6d4'; // Cyan for international
      case 'government':
        return '#64748b'; // Slate for government
      default:
        return colors.faxedIcon;
    }
  };

  const renderInstitution = ({ item }: { item: Institution }) => {
    const categoryColor = getCategoryColor(item.category);
    return (
    <TouchableOpacity
      style={styles.institutionCard}
      onPress={() => handleSelectInstitution(item)}
    >
      <View style={[styles.institutionIcon, { backgroundColor: categoryColor + '15' }]}>
        <Ionicons
          name={
            item.category === 'university'
              ? 'school-outline'
              : item.category === 'embassy'
              ? 'globe-outline'
              : 'business-outline'
          }
          size={24}
          color={categoryColor}
        />
      </View>
      <View style={styles.institutionInfo}>
        <Text style={styles.institutionName}>{item.name}</Text>
        <Text style={styles.institutionDept}>{item.department}</Text>
        <Text style={styles.institutionFax}>{item.faxNumber}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
  };

  const renderFaxHistory = ({ item }: { item: FaxJob }) => {
    const doc = documents.find((d) => d.id === item.documentId);
    return (
      <TouchableOpacity style={styles.faxHistoryCard}>
        <View style={[styles.faxHistoryIcon, { backgroundColor: colors.faxedIcon + '15' }]}>
          <Ionicons name="document-text-outline" size={20} color={colors.faxedIcon} />
        </View>
        <View style={styles.faxHistoryInfo}>
          <Text style={styles.faxHistoryName} numberOfLines={1}>
            {doc?.name || 'Document'}
          </Text>
          <Text style={styles.faxHistoryRecipient}>{item.recipientName}</Text>
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
        <Text style={styles.headerTitle}>Fax Center</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={filteredInstitutions}
        renderItem={renderInstitution}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.heroSection}>
              <View style={[styles.heroIcon, { backgroundColor: colors.faxedIcon + '15' }]}>
                <Ionicons name="print" size={32} color={colors.faxedIcon} />
              </View>
              <Text style={styles.heroTitle}>Send Documents via Fax</Text>
              <Text style={styles.heroSubtitle}>
                Deliver documents to institutions that accept fax
              </Text>
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search institutions..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Categories */}
            <View style={styles.categoriesRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && styles.categoryChipActive,
                  ]}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Manual Entry */}
            <TouchableOpacity style={styles.manualEntry} onPress={handleManualEntry}>
              <Ionicons name="keypad-outline" size={24} color={colors.accent} />
              <View style={styles.manualEntryInfo}>
                <Text style={styles.manualEntryTitle}>Enter Fax Number Manually</Text>
                <Text style={styles.manualEntrySubtitle}>
                  Send to any fax number
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* Fax History */}
            {recentFaxes.length > 0 && (
              <View style={styles.historySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Faxes</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('AllDocuments', { initialFilter: 'faxed' } as any)}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                {recentFaxes.map((fax) => (
                  <View key={fax.id}>{renderFaxHistory({ item: fax })}</View>
                ))}
              </View>
            )}

            {/* Institutions Header */}
            <View style={styles.institutionsHeader}>
              <Text style={styles.sectionTitle}>Institution Directory</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No institutions found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
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
  listContent: {
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
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  manualEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  manualEntryInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  manualEntryTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  manualEntrySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  historySection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  faxHistoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  faxHistoryIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  faxHistoryInfo: {
    flex: 1,
  },
  faxHistoryName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  faxHistoryRecipient: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  institutionsHeader: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  institutionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  institutionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  institutionInfo: {
    flex: 1,
  },
  institutionName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  institutionDept: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  institutionFax: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
