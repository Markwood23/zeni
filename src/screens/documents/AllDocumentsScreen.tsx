import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { DocumentsStackParamList, Document, DocumentFilter } from '../../types';
import { useDocumentsStore } from '../../store';
import DocumentThumbnail from '../../components/DocumentThumbnail';

type NavigationProp = NativeStackNavigationProp<DocumentsStackParamList, 'AllDocuments'>;
type AllDocumentsRouteProp = RouteProp<DocumentsStackParamList, 'AllDocuments'>;

const { width } = Dimensions.get('window');
const gridItemWidth = (width - spacing.xxl * 2 - spacing.md) / 2;

type SortOption = 'newest' | 'oldest' | 'name' | 'size';

const filters: { key: DocumentFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'documents-outline' },
  { key: 'scanned', label: 'Scanned', icon: 'scan-outline' },
  { key: 'uploaded', label: 'Uploaded', icon: 'cloud-upload-outline' },
  { key: 'edited', label: 'Edited', icon: 'create-outline' },
  { key: 'faxed', label: 'Faxed', icon: 'print-outline' },
];

const sortOptions: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'name', label: 'Name (A-Z)' },
  { key: 'size', label: 'Size' },
];

export default function AllDocumentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AllDocumentsRouteProp>();
  const { documents } = useDocumentsStore();
  const { colors, isDark } = useTheme();
  
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<DocumentFilter>(route.params?.initialFilter || 'all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let docs = [...documents];
    
    // Apply type filter
    if (selectedFilter !== 'all') {
      docs = docs.filter((d) => d.type === selectedFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter((d) => 
        d.name.toLowerCase().includes(query) ||
        d.type.toLowerCase().includes(query) ||
        d.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        docs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'name':
        docs.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'size':
        docs.sort((a, b) => b.fileSize - a.fileSize);
        break;
    }
    
    return docs;
  }, [documents, selectedFilter, searchQuery, sortBy]);

  const { deleteDocument } = useDocumentsStore();

  const handleDocumentActions = (doc: Document) => {
    Alert.alert(
      doc.name,
      'Choose an action',
      [
        {
          text: 'Share',
          onPress: async () => {
            try {
              await Share.share({
                message: `Check out this document: ${doc.name}`,
              });
            } catch (error) {
              console.error('Error sharing:', error);
            }
          },
        },
        {
          text: 'Edit',
          onPress: () => {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Home',
                params: {
                  screen: 'EditDocument',
                  params: { documentId: doc.id },
                },
              })
            );
          },
        },
        {
          text: 'Convert',
          onPress: () => {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Home',
                params: {
                  screen: 'Convert',
                  params: { documentId: doc.id },
                },
              })
            );
          },
        },
        {
          text: 'Fax',
          onPress: () => {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Home',
                params: {
                  screen: 'FaxSend',
                  params: { documentId: doc.id },
                },
              })
            );
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Document',
              `Are you sure you want to delete "${doc.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteDocument(doc.id),
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'scanned':
        return 'scan';
      case 'uploaded':
        return 'cloud-upload';
      case 'edited':
        return 'create';
      case 'faxed':
        return 'print';
      case 'imported':
        return 'download';
      case 'converted':
        return 'swap-horizontal';
      default:
        return 'document-text';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scanned':
        return colors?.scanIcon || colors?.primary;
      case 'uploaded':
        return colors?.uploadedIcon || colors?.primary;
      case 'edited':
        return colors?.editIcon || colors?.primary;
      case 'faxed':
        return colors?.faxedIcon || colors?.primary;
      case 'imported':
        return colors?.importedIcon || colors?.primary;
      case 'converted':
        return colors?.convertIcon || colors?.primary;
      default:
        return colors?.primary;
    }
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={[styles.documentCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('DocumentView', { documentId: item.id })}
    >
      <DocumentThumbnail 
        type={item.type as any}
        thumbnailPath={item.thumbnailPath}
        size="medium"
        iconColor={getTypeColor(item.type)}
      />
      <View style={styles.documentInfo}>
        <Text style={[styles.documentName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.documentMetaRow}>
          <View style={[styles.typeTag, { backgroundColor: `${getTypeColor(item.type)}15` }]}>
            <Text style={[styles.typeTagText, { color: getTypeColor(item.type) }]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
          <Text style={[styles.documentMeta, { color: colors.textTertiary }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <Text style={[styles.documentSize, { color: colors.textTertiary }]}>
          {item.pagesCount} {item.pagesCount === 1 ? 'page' : 'pages'} • {formatFileSize(item.fileSize)}
        </Text>
      </View>
      <TouchableOpacity style={styles.moreButton} onPress={() => handleDocumentActions(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderGridItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('DocumentView', { documentId: item.id })}
    >
      <View style={[styles.gridThumbnailContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <DocumentThumbnail 
          type={item.type as any}
          thumbnailPath={item.thumbnailPath}
          size="large"
          iconColor={getTypeColor(item.type)}
        />
      </View>
      <View style={styles.gridInfo}>
        <Text style={[styles.gridName, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={[styles.gridTypeTag, { backgroundColor: `${getTypeColor(item.type)}15` }]}>
          <Text style={[styles.gridTypeTagText, { color: getTypeColor(item.type) }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <Text style={[styles.gridMeta, { color: colors.textTertiary }]}>
          {item.pagesCount} pages • {formatFileSize(item.fileSize)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {searchQuery ? 'No results found' : 'No documents yet'}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textTertiary }]}>
        {searchQuery 
          ? `Try a different search term or adjust your filters`
          : 'Scan, upload, or create your first document to see it here'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.getParent()?.navigate('Home', { screen: 'Scan' })}
        >
          <Ionicons name="scan" size={18} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>Scan Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
        {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>All Documents</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            <Ionicons
              name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search documents..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          keyboardAppearance={isDark ? 'dark' : 'light'}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: colors.surface },
                selectedFilter === item.key && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Ionicons 
                name={item.icon} 
                size={16} 
                color={selectedFilter === item.key ? '#FFFFFF' : colors.textSecondary} 
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.textSecondary },
                  selectedFilter === item.key && { color: '#FFFFFF' },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
        />
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBarContainer}>
        <View style={[styles.sortBar, { borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Ionicons name="swap-vertical-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.sortButtonText, { color: colors.textSecondary }]}>
              {sortOptions.find(s => s.key === sortBy)?.label}
            </Text>
            <Ionicons 
              name={showSortMenu ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Sort Menu Dropdown */}
        {showSortMenu && (
          <View style={[styles.sortMenu, { backgroundColor: colors.surface }]}>
            {sortOptions.map((option, index) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortMenuItem,
                  { borderBottomColor: colors.borderLight },
                  index === sortOptions.length - 1 && { borderBottomWidth: 0 },
                  sortBy === option.key && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortMenu(false);
                }}
              >
                <Text 
                  style={[
                    styles.sortMenuItemText, 
                    { color: sortBy === option.key ? colors.primary : colors.textPrimary }
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Documents List/Grid */}
      <FlatList
        key={viewMode}
        data={filteredDocuments}
        renderItem={viewMode === 'list' ? renderDocumentItem : renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={viewMode === 'list' ? styles.documentsList : styles.documentsGrid}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        ListHeaderComponent={filteredDocuments.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    paddingVertical: spacing.xs,
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filtersList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  sortBarContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
    marginTop: spacing.xs,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  sortMenuItemText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  listHeader: {
    paddingVertical: spacing.md,
  },
  resultCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  documentsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  documentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  documentName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  documentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  typeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeTagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  documentMeta: {
    fontSize: typography.fontSize.xs,
  },
  documentSize: {
    fontSize: typography.fontSize.xs,
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Grid view styles
  documentsGrid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gridCard: {
    width: gridItemWidth,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  gridThumbnailContainer: {
    width: '100%',
    aspectRatio: 0.85,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  gridInfo: {
    padding: spacing.md,
  },
  gridName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  gridTypeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  gridTypeTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  gridMeta: {
    fontSize: typography.fontSize.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.huge * 2,
    paddingHorizontal: spacing.xxl,
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
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});
