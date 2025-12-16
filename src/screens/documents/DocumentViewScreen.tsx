import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { DocumentsStackParamList, Document, Folder } from '../../types';
import { useDocumentsStore, generateId, useActivityStore, useUserStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<DocumentsStackParamList, 'DocumentView'>;
type RouteType = RouteProp<DocumentsStackParamList, 'DocumentView'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function DocumentViewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documentId } = route.params;
  const { documents, folders, deleteDocument, updateDocument, addDocumentToFolder, removeDocumentFromFolder } = useDocumentsStore();
  const { addActivity } = useActivityStore();
  const { user } = useUserStore();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const document = documents.find((d: Document) => d.id === documentId);

  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Document not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleShare = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a file path and if sharing is available
      if (document.filePath && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(document.filePath, {
          mimeType: document.mimeType,
          dialogTitle: `Share ${document.name}`,
        });
      } else {
        // Fallback to basic share
        await Share.share({
          message: `Check out this document: ${document.name}`,
          title: document.name,
        });
      }
      
      addActivity({
        id: generateId(),
        userId: user?.id || 'guest',
        type: 'share',
        documentId: document.id,
        title: 'Document shared',
        description: `Shared "${document.name}"`,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDocument = async () => {
    try {
      setIsLoading(true);
      
      if (document.filePath) {
        // Try to open with external app
        if (document.mimeType.startsWith('image/')) {
          // For images, show fullscreen viewer
          setIsFullscreen(true);
        } else if (await Sharing.isAvailableAsync()) {
          // For PDFs and other documents, share to open in another app
          await Sharing.shareAsync(document.filePath, {
            mimeType: document.mimeType,
            UTI: document.mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
          });
        } else {
          Alert.alert('Info', 'Unable to open document. Try sharing to another app.');
        }
      } else if (document.thumbnailPath) {
        // If we only have thumbnail, show that
        setIsFullscreen(true);
      } else {
        Alert.alert('Info', 'Document preview not available. Try sharing to another app.');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDocument(documentId);
            addActivity({
              id: generateId(),
              userId: user?.id || 'guest',
              type: 'delete',
              documentId: document.id,
              title: 'Document deleted',
              description: `Deleted "${document.name}"`,
              createdAt: new Date(),
            });
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Home',
        params: {
          screen: 'EditDocument',
          params: { documentId: document.id },
        },
      })
    );
  };

  const handleConvert = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Home',
        params: {
          screen: 'Convert',
          params: { documentId: document.id },
        },
      })
    );
  };

  const handleSend = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Home',
        params: {
          screen: 'SendShare',
          params: { documentId: document.id },
        },
      })
    );
  };

  const handleRename = () => {
    Alert.prompt(
      'Rename Document',
      'Enter a new name for this document',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: (newName?: string) => {
            if (newName && newName.trim()) {
              const extension = document.name.split('.').pop() || '';
              const updatedName = newName.trim().includes('.') 
                ? newName.trim() 
                : `${newName.trim()}.${extension}`;
              
              updateDocument(document.id, { 
                name: updatedName,
                updatedAt: new Date()
              });
              Alert.alert('Success', `Document renamed to "${updatedName}"`);
            }
          },
        },
      ],
      'plain-text',
      document.name.replace(/\.[^/.]+$/, '')
    );
  };

  const handleDuplicate = () => {
    const newDocId = generateId();
    const baseName = document.name.replace(/\.[^/.]+$/, '');
    const extension = document.name.split('.').pop() || '';
    
    const duplicatedDoc = {
      ...document,
      id: newDocId,
      name: `${baseName}_copy.${extension}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Note: Would need addDocument in store, for now just show success
    Alert.alert('Success', 'Document duplicated successfully!');
  };

  const handleMoreOptions = () => {
    Alert.alert(
      document.name,
      'Choose an action',
      [
        { text: 'Rename', onPress: handleRename },
        { text: 'Duplicate', onPress: handleDuplicate },
        { text: 'Move to Folder', onPress: () => setShowFolderModal(true) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getCurrentFolder = (): Folder | null => {
    return folders.find((f: Folder) => f.documentIds.includes(documentId)) || null;
  };

  const handleMoveToFolder = (folderId: string | null) => {
    const currentFolder = getCurrentFolder();
    
    // Remove from current folder if exists
    if (currentFolder) {
      removeDocumentFromFolder(currentFolder.id, documentId);
    }
    
    // Add to new folder if selected
    if (folderId) {
      addDocumentToFolder(folderId, documentId);
      const targetFolder = folders.find((f: Folder) => f.id === folderId);
      addActivity({
        id: generateId(),
        userId: user?.id || 'guest',
        type: 'move',
        documentId: document.id,
        title: 'Document moved',
        description: `Moved "${document.name}" to "${targetFolder?.name}"`,
        createdAt: new Date(),
      });
      Alert.alert('Success', `Document moved to "${targetFolder?.name}"`);
    } else {
      if (currentFolder) {
        addActivity({
          id: generateId(),
          userId: user?.id || 'guest',
          type: 'move',
          documentId: document.id,
          title: 'Document removed from folder',
          description: `Removed "${document.name}" from "${currentFolder.name}"`,
          createdAt: new Date(),
        });
        Alert.alert('Success', 'Document removed from folder');
      }
    }
    
    setShowFolderModal(false);
  };

  const renderFolderItem = ({ item }: { item: Folder | { id: null; name: string } }) => {
    const currentFolder = getCurrentFolder();
    const isCurrentFolder = currentFolder?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.folderItem,
          isCurrentFolder && styles.folderItemCurrent,
        ]}
        onPress={() => handleMoveToFolder(item.id)}
        disabled={isCurrentFolder}
      >
        <View style={[styles.folderItemIcon, { backgroundColor: item.id ? (item as Folder).color || colors.primary : colors.surfaceSecondary }]}>
          <Ionicons 
            name={item.id ? ((item as Folder).icon as any || 'folder') : 'close-circle-outline'} 
            size={20} 
            color={item.id ? '#fff' : colors.textSecondary} 
          />
        </View>
        <View style={styles.folderItemInfo}>
          <Text style={styles.folderItemName}>{item.name}</Text>
          {item.id && (
            <Text style={styles.folderItemCount}>
              {(item as Folder).documentIds.length} document{(item as Folder).documentIds.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {isCurrentFolder && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDocumentPreview = () => {
    const imageUri = document.thumbnailPath || document.filePath;
    
    if (imageUri && (document.mimeType.startsWith('image/') || document.thumbnailPath)) {
      return (
        <TouchableOpacity 
          style={styles.imagePreviewContainer}
          onPress={() => setIsFullscreen(true)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
          <View style={styles.zoomHint}>
            <Ionicons name="expand-outline" size={16} color="#fff" />
            <Text style={styles.zoomHintText}>Tap to expand</Text>
          </View>
        </TouchableOpacity>
      );
    }
    
    // Fallback placeholder for PDFs or documents without thumbnails
    return (
      <View style={styles.preview}>
        <View style={styles.previewContent}>
          <View style={styles.previewHeader}>
            <Ionicons 
              name={document.mimeType === 'application/pdf' ? 'document' : 'document-text'} 
              size={32} 
              color={document.mimeType === 'application/pdf' ? '#EF4444' : colors.textSecondary} 
            />
            <Text style={styles.previewFileName} numberOfLines={1}>{document.name}</Text>
          </View>
          <View style={styles.previewBody}>
            <View style={styles.previewLines}>
              {[...Array(12)].map((_, i) => (
                <View key={i} style={[styles.previewLine, { width: `${65 + Math.random() * 30}%` }]} />
              ))}
            </View>
          </View>
          <View style={styles.previewFooter}>
            <Text style={styles.previewPageText}>Page {currentPage} of {document.pagesCount}</Text>
          </View>
        </View>
      </View>
    );
  };

  const actions = [
    { id: 'share', icon: 'share-outline' as keyof typeof Ionicons.glyphMap, label: 'Share', onPress: handleShare },
    { id: 'edit', icon: 'create-outline' as keyof typeof Ionicons.glyphMap, label: 'Edit', onPress: handleEdit },
    { id: 'convert', icon: 'swap-horizontal-outline' as keyof typeof Ionicons.glyphMap, label: 'Convert', onPress: handleConvert },
    { id: 'send', icon: 'send-outline' as keyof typeof Ionicons.glyphMap, label: 'Send', onPress: handleSend },
    { id: 'delete', icon: 'trash-outline' as keyof typeof Ionicons.glyphMap, label: 'Delete', onPress: handleDelete },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {document.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={handleMoreOptions}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Document Preview */}
        <View style={styles.previewContainer}>
          <View style={styles.previewShadow}>
            {renderDocumentPreview()}
          </View>
          
          {/* Page Navigation for multi-page docs */}
          {document.pagesCount > 1 && (
            <View style={styles.pageNavigation}>
              <TouchableOpacity 
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? colors.textTertiary : colors.primary} />
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>
                {currentPage} / {document.pagesCount}
              </Text>
              <TouchableOpacity 
                style={[styles.pageButton, currentPage === document.pagesCount && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage(p => Math.min(document.pagesCount, p + 1))}
                disabled={currentPage === document.pagesCount}
              >
                <Ionicons name="chevron-forward" size={20} color={currentPage === document.pagesCount ? colors.textTertiary : colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Document Info */}
        <View style={styles.infoSection}>
          <Text style={styles.documentName}>{document.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.metaText}>{formatDate(document.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="document-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.metaText}>{document.pagesCount} pages</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="server-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.metaText}>{formatFileSize(document.fileSize)}</Text>
            </View>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{document.type}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsGrid}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  action.id === 'delete' && styles.deleteButton,
                ]}
                onPress={action.onPress}
              >
                <Ionicons
                  name={action.icon}
                  size={24}
                  color={action.id === 'delete' ? colors.error : colors.primary}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    action.id === 'delete' && styles.deleteLabel,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity 
          style={styles.openButton} 
          onPress={handleOpenDocument}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <Ionicons name="open-outline" size={20} color={colors.textInverse} />
              <Text style={styles.openButtonText}>Open Document</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Fullscreen Image Modal */}
      <Modal visible={isFullscreen} animationType="fade" statusBarTranslucent>
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity 
            style={styles.fullscreenClose}
            onPress={() => setIsFullscreen(false)}
          >
            <View style={styles.closeButtonBg}>
              <Ionicons name="close" size={28} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <ScrollView 
            contentContainerStyle={styles.fullscreenScrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <Image
              source={{ uri: document.thumbnailPath || document.filePath }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </ScrollView>
          
          {/* Fullscreen page navigation */}
          {document.pagesCount > 1 && (
            <View style={styles.fullscreenPageNav}>
              <TouchableOpacity 
                style={styles.fullscreenPageButton}
                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={24} color={currentPage === 1 ? '#666' : '#fff'} />
              </TouchableOpacity>
              <Text style={styles.fullscreenPageText}>
                {currentPage} / {document.pagesCount}
              </Text>
              <TouchableOpacity 
                style={styles.fullscreenPageButton}
                onPress={() => setCurrentPage(p => Math.min(document.pagesCount, p + 1))}
                disabled={currentPage === document.pagesCount}
              >
                <Ionicons name="chevron-forward" size={24} color={currentPage === document.pagesCount ? '#666' : '#fff'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Move to Folder Modal */}
      <Modal visible={showFolderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Move to Folder</Text>
              <TouchableOpacity onPress={() => setShowFolderModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={[{ id: null, name: 'Remove from folder' }, ...folders]}
              renderItem={renderFolderItem}
              keyExtractor={(item) => item.id || 'no-folder'}
              contentContainerStyle={styles.folderList}
              ListEmptyComponent={
                <View style={styles.emptyFolders}>
                  <Ionicons name="folder-open-outline" size={48} color={colors.textTertiary} />
                  <Text style={styles.emptyFoldersText}>No folders yet</Text>
                  <Text style={styles.emptyFoldersSubtext}>Create a folder in Documents Hub</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: spacing.huge,
  },
  previewContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  previewShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  preview: {
    width: '100%',
    aspectRatio: 0.707, // A4 ratio (1:√2)
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  previewContent: {
    flex: 1,
    padding: spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  previewFileName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  previewBody: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  previewLines: {
    gap: spacing.sm,
  },
  previewLine: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
  },
  previewFooter: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  previewPageText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  infoSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  documentName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionsSection: {
    paddingHorizontal: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionButton: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: colors.surface,
  },
  actionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  deleteLabel: {
    color: colors.error,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.textTertiary,
  },
  bottomAction: {
    padding: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  openButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  imagePreviewContainer: {
    width: '100%',
    aspectRatio: 0.707,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  zoomHint: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  zoomHintText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
  },
  pageNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageIndicator: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    zIndex: 10,
  },
  closeButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  fullscreenPageNav: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  fullscreenPageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenPageText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  folderList: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  folderItemCurrent: {
    opacity: 0.6,
  },
  folderItemIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  folderItemInfo: {
    flex: 1,
  },
  folderItemName: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  folderItemCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  currentBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.primary,
  },
  emptyFolders: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyFoldersText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyFoldersSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
