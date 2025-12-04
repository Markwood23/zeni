import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { DocumentsStackParamList, Document, DocumentFilter, Folder } from '../../types';
import { useDocumentsStore, generateId, useUserStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<DocumentsStackParamList, 'DocumentsHub'>;
type DocumentsHubRouteProp = RouteProp<DocumentsStackParamList, 'DocumentsHub'>;

const { width } = Dimensions.get('window');
const gridItemWidth = (width - spacing.xxl * 2 - spacing.md) / 2;

const filters: { key: DocumentFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scanned', label: 'Scanned' },
  { key: 'uploaded', label: 'Uploaded' },
  { key: 'edited', label: 'Edited' },
  { key: 'faxed', label: 'Faxed' },
];

export default function DocumentsHubScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DocumentsHubRouteProp>();
  const { documents, folders, selectedFilter, setFilter, addFolder } = useDocumentsStore();
  const { user } = useUserStore();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Auto-open search when navigated with openSearch param
  useEffect(() => {
    if (route.params?.openSearch) {
      setIsSearching(true);
    }
  }, [route.params?.openSearch]);

  // Filter documents by type and search query
  const filteredDocuments = useMemo(() => {
    let docs = selectedFilter === 'all'
      ? documents
      : documents.filter((d) => d.type === selectedFilter);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter((d) => 
        d.name.toLowerCase().includes(query)
      );
    }
    
    return docs;
  }, [documents, selectedFilter, searchQuery]);

  // Get folder with document count
  const foldersWithCount = useMemo(() => {
    return folders.map((folder) => ({
      ...folder,
      count: folder.documentIds.length,
    }));
  }, [folders]);

  const handleCreateFolder = () => {
    Alert.prompt(
      'New Folder',
      'Enter a name for your new folder',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (folderName?: string) => {
            if (folderName && folderName.trim()) {
              const newFolder: Folder = {
                id: generateId(),
                userId: user?.id || 'guest',
                name: folderName.trim(),
                documentIds: [],
                // Don't set color - will use dynamic primary from theme
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              addFolder(newFolder);
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
      default:
        return 'document-text';
    }
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => navigation.navigate('DocumentView', { documentId: item.id })}
    >
      <View style={styles.documentThumbnail}>
        <View style={styles.thumbnailInner}>
          <View style={styles.thumbnailHeader}>
            <Ionicons
              name={getDocumentIcon(item.type)}
              size={14}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.thumbnailLines}>
            <View style={[styles.thumbnailLine, { width: '80%' }]} />
            <View style={[styles.thumbnailLine, { width: '90%' }]} />
            <View style={[styles.thumbnailLine, { width: '70%' }]} />
            <View style={[styles.thumbnailLine, { width: '85%' }]} />
          </View>
        </View>
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.documentMeta}>
          {formatDate(item.createdAt)} • {item.pagesCount} pages • {formatFileSize(item.fileSize)}
        </Text>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Grid view render
  const renderDocumentGridItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => navigation.navigate('DocumentView', { documentId: item.id })}
    >
      <View style={styles.gridThumbnail}>
        <View style={styles.gridThumbnailInner}>
          <View style={styles.gridThumbnailHeader}>
            <Ionicons
              name={getDocumentIcon(item.type)}
              size={18}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.gridThumbnailLines}>
            <View style={[styles.thumbnailLine, { width: '80%' }]} />
            <View style={[styles.thumbnailLine, { width: '90%' }]} />
            <View style={[styles.thumbnailLine, { width: '70%' }]} />
            <View style={[styles.thumbnailLine, { width: '85%' }]} />
            <View style={[styles.thumbnailLine, { width: '75%' }]} />
          </View>
        </View>
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.gridMeta}>
          {item.pagesCount} pages
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="folder-open-outline" size={64} color={colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No documents yet</Text>
      <Text style={styles.emptyDescription}>
        Scan, upload, or create your first document to see it here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {!isSearching ? (
          <>
            <Text style={styles.headerTitle}>Documents</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.viewToggle}
                onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                <Ionicons
                  name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => setIsSearching(true)}
              >
                <Ionicons name="search-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search documents..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity 
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Folders Quick Access */}
      <View style={styles.foldersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Folders</Text>
          <TouchableOpacity onPress={handleCreateFolder}>
            <View style={styles.newFolderButton}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.viewAllText, { marginLeft: 4 }]}>New Folder</Text>
            </View>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={foldersWithCount}
          contentContainerStyle={styles.foldersList}
          ListEmptyComponent={
            <TouchableOpacity 
              style={[styles.folderCard, styles.emptyFolderCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              onPress={handleCreateFolder}
            >
              <Ionicons name="add-circle-outline" size={32} color={colors.textTertiary} />
              <Text style={[styles.folderName, { color: colors.textTertiary }]}>Create Folder</Text>
              <Text style={[styles.folderCount, { color: colors.textTertiary }]}>Tap to add</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.folderCard, { backgroundColor: item.backgroundColor || colors.primaryLight, borderColor: item.backgroundColor || colors.primaryLight }]}
              onPress={() => navigation.navigate('FolderView', { folderId: item.id })}
            >
              {item.iconType === 'emoji' && item.icon ? (
                <Text style={styles.folderEmoji}>{item.icon}</Text>
              ) : (
                <Ionicons name="folder" size={32} color={colors.primary} />
              )}
              <Text style={[styles.folderName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.folderCount, { color: colors.textSecondary }]}>{item.count} {item.count === 1 ? 'File' : 'Files'}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* Filters */}
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
                selectedFilter === item.key && styles.filterChipActive,
              ]}
              onPress={() => setFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
        />
      </View>

      {/* Documents List/Grid */}
      <View style={styles.documentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Results (${filteredDocuments.length})` : 'Recent Files'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllDocuments')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          key={viewMode}
          data={filteredDocuments}
          renderItem={viewMode === 'list' ? renderDocumentItem : renderDocumentGridItem}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={viewMode === 'list' ? styles.documentsList : styles.documentsGrid}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  foldersSection: {
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
  newFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foldersList: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  folderCard: {
    width: 140,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyFolderCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderEmoji: {
    fontSize: 32,
  },
  folderName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  folderCount: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  filtersContainer: {
    marginBottom: spacing.lg,
  },
  filtersList: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.textInverse,
  },
  documentsSection: {
    flex: 1,
  },
  documentsList: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  documentThumbnail: {
    width: 56,
    height: 72,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  thumbnailInner: {
    flex: 1,
    padding: spacing.xs,
  },
  thumbnailHeader: {
    marginBottom: spacing.xs,
  },
  thumbnailLines: {
    flex: 1,
    gap: 3,
  },
  thumbnailLine: {
    height: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 2,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  documentMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surfaceSecondary,
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
    maxWidth: 280,
  },
  // Grid view styles
  documentsGrid: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gridCard: {
    width: gridItemWidth,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gridThumbnail: {
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  gridThumbnailInner: {
    flex: 1,
    padding: spacing.md,
  },
  gridThumbnailHeader: {
    marginBottom: spacing.sm,
  },
  gridThumbnailLines: {
    flex: 1,
    gap: 4,
  },
  gridInfo: {
    padding: spacing.md,
  },
  gridName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  gridMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
});
