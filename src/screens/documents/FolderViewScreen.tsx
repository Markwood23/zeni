import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { DocumentsStackParamList, Document } from '../../types';
import { useDocumentsStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<DocumentsStackParamList, 'FolderView'>;
type FolderViewRouteProp = RouteProp<DocumentsStackParamList, 'FolderView'>;

const { width } = Dimensions.get('window');
const gridItemWidth = (width - spacing.xxl * 2 - spacing.md) / 2;

// Common emojis for folder icons
const FOLDER_EMOJIS = [
  '📁', '📂', '🗂️', '📚', '📖', '📝', '✏️', '📎',
  '🎓', '🏫', '📐', '🔬', '🧪', '💼', '🏠', '💡',
  '⭐', '❤️', '🔥', '✨', '🎯', '🚀', '💎', '🌟',
  '🎨', '🎵', '📷', '🎬', '🎮', '⚽', '🏀', '🎾',
  '💰', '💳', '🏦', '📊', '📈', '💻', '📱', '🖥️',
  '🔒', '🔑', '⚙️', '🛠️', '📌', '🏷️', '📋', '📑',
];

// Color options for folder backgrounds
const FOLDER_COLORS = [
  { name: 'Blue', value: '#3A7CFF', light: 'rgba(58, 124, 255, 0.12)' },
  { name: 'Purple', value: '#7C4DFF', light: 'rgba(124, 77, 255, 0.12)' },
  { name: 'Pink', value: '#E91E63', light: 'rgba(233, 30, 99, 0.12)' },
  { name: 'Red', value: '#F44336', light: 'rgba(244, 67, 54, 0.12)' },
  { name: 'Orange', value: '#FF9800', light: 'rgba(255, 152, 0, 0.12)' },
  { name: 'Yellow', value: '#FFC107', light: 'rgba(255, 193, 7, 0.12)' },
  { name: 'Green', value: '#4CAF50', light: 'rgba(76, 175, 80, 0.12)' },
  { name: 'Teal', value: '#009688', light: 'rgba(0, 150, 136, 0.12)' },
  { name: 'Cyan', value: '#00BCD4', light: 'rgba(0, 188, 212, 0.12)' },
  { name: 'Indigo', value: '#3F51B5', light: 'rgba(63, 81, 181, 0.12)' },
  { name: 'Brown', value: '#795548', light: 'rgba(121, 85, 72, 0.12)' },
  { name: 'Gray', value: '#607D8B', light: 'rgba(96, 125, 139, 0.12)' },
];

export default function FolderViewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FolderViewRouteProp>();
  const { folderId } = route.params;
  const { folders, documents, deleteFolder, updateFolder, addDocumentToFolder, removeDocumentFromFolder } = useDocumentsStore();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showAddDocuments, setShowAddDocuments] = useState(false);
  const [pickerTab, setPickerTab] = useState<'emoji' | 'color'>('emoji');
  const { colors } = useTheme();

  const folder = folders.find((f) => f.id === folderId);

  const folderDocuments = useMemo(() => {
    if (!folder) return [];
    return documents.filter((d) => folder.documentIds.includes(d.id));
  }, [folder, documents]);

  if (!folder) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Folder Not Found</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Folder not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  const handleDeleteFolder = () => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"? Documents inside will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteFolder(folderId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleRenameFolder = () => {
    Alert.prompt(
      'Rename Folder',
      'Enter a new name for this folder',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: (newName?: string) => {
            if (newName && newName.trim()) {
              updateFolder(folderId, { name: newName.trim() });
            }
          },
        },
      ],
      'plain-text',
      folder.name
    );
  };

  const handleChangeIcon = (emoji: string) => {
    updateFolder(folderId, { icon: emoji, iconType: 'emoji' });
  };

  const handleResetIcon = () => {
    updateFolder(folderId, { icon: undefined, iconType: 'default', backgroundColor: undefined });
  };

  const handleChangeColor = (colorValue: string, lightValue: string) => {
    updateFolder(folderId, { color: colorValue, backgroundColor: lightValue });
  };

  const handleAddDocument = (documentId: string) => {
    addDocumentToFolder(folderId, documentId);
  };

  const handleRemoveDocument = (documentId: string) => {
    Alert.alert(
      'Remove from Folder',
      'Remove this document from the folder? The document will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeDocumentFromFolder(folderId, documentId),
        },
      ]
    );
  };

  // Documents not in this folder (for adding)
  const availableDocuments = useMemo(() => {
    if (!folder) return [];
    return documents.filter((d) => !folder.documentIds.includes(d.id));
  }, [folder, documents]);

  const handleMoreOptions = () => {
    Alert.alert(
      folder.name,
      'Choose an action',
      [
        { text: 'Customize', onPress: () => setShowIconPicker(true) },
        { text: 'Add Documents', onPress: () => setShowAddDocuments(true) },
        { text: 'Rename', onPress: handleRenameFolder },
        { text: 'Delete', style: 'destructive', onPress: handleDeleteFolder },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Render folder icon (emoji or default)
  const renderFolderIcon = (size: number = 20) => {
    if (folder.iconType === 'emoji' && folder.icon) {
      return <Text style={{ fontSize: size }}>{folder.icon}</Text>;
    }
    return <Ionicons name="folder" size={size} color={colors.primary} />;
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={[styles.documentCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('DocumentView', { documentId: item.id })}
    >
      <View style={[styles.documentThumbnail, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={[styles.thumbnailInner, { backgroundColor: '#fff' }]}>
          <View style={styles.thumbnailHeader}>
            <Ionicons
              name={getDocumentIcon(item.type)}
              size={14}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.thumbnailLines}>
            <View style={[styles.thumbnailLine, { backgroundColor: colors.border, width: '80%' }]} />
            <View style={[styles.thumbnailLine, { backgroundColor: colors.border, width: '90%' }]} />
            <View style={[styles.thumbnailLine, { backgroundColor: colors.border, width: '70%' }]} />
            <View style={[styles.thumbnailLine, { backgroundColor: colors.border, width: '85%' }]} />
          </View>
        </View>
      </View>
      <View style={styles.documentInfo}>
        <Text style={[styles.documentName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.documentMeta, { color: colors.textTertiary }]}>
          {formatDate(item.createdAt)} • {item.pagesCount} pages • {formatFileSize(item.fileSize)}
        </Text>
      </View>
      <TouchableOpacity style={styles.moreButton} onPress={() => handleRemoveDocument(item.id)}>
        <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderGridItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('DocumentView', { documentId: item.id })}
    >
      <View style={[styles.gridThumbnail, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={[styles.gridThumbnailInner, { backgroundColor: '#fff' }]}>
          <View style={styles.gridThumbnailHeader}>
            <Ionicons
              name={getDocumentIcon(item.type)}
              size={18}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.gridThumbnailLines}>
            <View style={[styles.thumbnailLine, { backgroundColor: colors.border, width: '80%' }]} />
            <View style={[styles.thumbnailLine, { backgroundColor: colors.border, width: '90%' }]} />
            <View style={[styles.thumbnailLine, { backgroundColor: colors.border, width: '70%' }]} />
            <View style={[styles.thumbnailLine, { backgroundColor: colors.border, width: '85%' }]} />
            <View style={[styles.thumbnailLine, { backgroundColor: colors.border, width: '75%' }]} />
          </View>
        </View>
      </View>
      <View style={styles.gridInfo}>
        <Text style={[styles.gridName, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.gridMeta, { color: colors.textTertiary }]}>
          {item.pagesCount} pages
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No documents</Text>
      <Text style={[styles.emptyDescription, { color: colors.textTertiary }]}>
        This folder is empty. Add documents from the documents list.
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
        <View style={styles.headerCenter}>
          <View style={styles.folderTitleRow}>
            <TouchableOpacity onPress={() => setShowIconPicker(true)}>
              {renderFolderIcon(20)}
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {folder.name}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {folderDocuments.length} {folderDocuments.length === 1 ? 'file' : 'files'}
          </Text>
        </View>
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
          <TouchableOpacity style={styles.moreButton} onPress={handleMoreOptions}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Documents List */}
      <FlatList
        key={viewMode}
        data={folderDocuments}
        renderItem={viewMode === 'list' ? renderDocumentItem : renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={viewMode === 'list' ? styles.documentsList : styles.documentsGrid}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Customize Folder Modal */}
      <Modal
        visible={showIconPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIconPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Customize Folder</Text>
              <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Current Preview */}
            <View style={[styles.iconPreview, { backgroundColor: folder.backgroundColor || colors.primaryLight }]}>
              {folder.iconType === 'emoji' && folder.icon ? (
                <Text style={styles.previewEmoji}>{folder.icon}</Text>
              ) : (
                <Ionicons name="folder" size={48} color={colors.primary} />
              )}
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>{folder.name}</Text>
            </View>

            {/* Tabs */}
            <View style={[styles.pickerTabs, { backgroundColor: colors.surfaceSecondary }]}>
              <TouchableOpacity 
                style={[styles.pickerTab, pickerTab === 'emoji' && { backgroundColor: colors.surface }]}
                onPress={() => setPickerTab('emoji')}
              >
                <Text style={[styles.pickerTabText, { color: pickerTab === 'emoji' ? colors.primary : colors.textSecondary }]}>Icon</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.pickerTab, pickerTab === 'color' && { backgroundColor: colors.surface }]}
                onPress={() => setPickerTab('color')}
              >
                <Text style={[styles.pickerTabText, { color: pickerTab === 'color' ? colors.primary : colors.textSecondary }]}>Color</Text>
              </TouchableOpacity>
            </View>

            {/* Reset to Default */}
            <TouchableOpacity 
              style={[styles.resetButton, { borderColor: colors.border }]}
              onPress={handleResetIcon}
            >
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={[styles.resetButtonText, { color: colors.textPrimary }]}>Reset to Default</Text>
            </TouchableOpacity>

            <ScrollView 
              style={styles.emojiScrollView}
              showsVerticalScrollIndicator={false}
            >
              {pickerTab === 'emoji' ? (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Emoji</Text>
                  <View style={styles.emojiGrid}>
                    {FOLDER_EMOJIS.map((emoji, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.emojiButton,
                          { backgroundColor: colors.surfaceSecondary },
                          folder.icon === emoji && { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 2 }
                        ]}
                        onPress={() => handleChangeIcon(emoji)}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Color</Text>
                  <View style={styles.colorGrid}>
                    {FOLDER_COLORS.map((color, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.colorButton,
                          { backgroundColor: color.light },
                          folder.backgroundColor === color.light && { borderColor: color.value, borderWidth: 3 }
                        ]}
                        onPress={() => handleChangeColor(color.value, color.light)}
                      >
                        <View style={[styles.colorDot, { backgroundColor: color.value }]} />
                        <Text style={[styles.colorName, { color: colors.textSecondary }]}>{color.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Documents Modal */}
      <Modal
        visible={showAddDocuments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddDocuments(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Documents</Text>
              <TouchableOpacity onPress={() => setShowAddDocuments(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {availableDocuments.length === 0 ? (
              <View style={styles.noDocsState}>
                <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.noDocsText, { color: colors.textSecondary }]}>
                  All documents are already in this folder or no documents available.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.addDocsList} showsVerticalScrollIndicator={false}>
                {availableDocuments.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.addDocItem, { borderBottomColor: colors.borderLight }]}
                    onPress={() => handleAddDocument(doc.id)}
                  >
                    <View style={[styles.addDocIcon, { backgroundColor: colors.surfaceSecondary }]}>
                      <Ionicons name={getDocumentIcon(doc.type)} size={20} color={colors.textSecondary} />
                    </View>
                    <View style={styles.addDocInfo}>
                      <Text style={[styles.addDocName, { color: colors.textPrimary }]} numberOfLines={1}>{doc.name}</Text>
                      <Text style={[styles.addDocMeta, { color: colors.textTertiary }]}>{doc.pagesCount} pages</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerCenter: {
    flex: 1,
  },
  folderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
    marginLeft: 28,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  viewToggle: {
    padding: spacing.sm,
  },
  moreButton: {
    padding: spacing.sm,
  },
  documentsList: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  documentsGrid: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  gridRow: {
    gap: spacing.md,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  documentThumbnail: {
    width: 56,
    height: 72,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  thumbnailInner: {
    width: '85%',
    height: '90%',
    borderRadius: 4,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  thumbnailHeader: {
    marginBottom: 6,
  },
  thumbnailLines: {
    gap: 3,
  },
  thumbnailLine: {
    height: 3,
    borderRadius: 1.5,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  documentMeta: {
    fontSize: typography.fontSize.sm,
  },
  gridCard: {
    width: gridItemWidth,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  gridThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gridThumbnailInner: {
    width: '75%',
    height: '85%',
    borderRadius: 4,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  gridThumbnailHeader: {
    marginBottom: 8,
  },
  gridThumbnailLines: {
    gap: 4,
  },
  gridInfo: {
    paddingHorizontal: spacing.xs,
  },
  gridName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  gridMeta: {
    fontSize: typography.fontSize.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl * 2,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
  },
  iconPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  previewEmoji: {
    fontSize: 48,
  },
  previewLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  resetButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emojiScrollView: {
    maxHeight: 250,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  // Tab styles
  pickerTabs: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  pickerTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  pickerTabText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  // Color picker styles
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorButton: {
    width: (width - spacing.xl * 2 - spacing.sm * 3) / 4,
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  colorName: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  // Add documents modal styles
  noDocsState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  noDocsText: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  addDocsList: {
    maxHeight: 400,
  },
  addDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  addDocIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  addDocInfo: {
    flex: 1,
  },
  addDocName: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  addDocMeta: {
    fontSize: typography.fontSize.sm,
  },
});
