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
  Share,
  Clipboard,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { DocumentsStackParamList, Document, ShareDuration, ShareAccessType, FolderShareLink, Folder } from '../../types';
import { useDocumentsStore, useFolderShareStore, useUserStore } from '../../store';
import DocumentThumbnail from '../../components/DocumentThumbnail';

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
  { name: 'Blue', value: '#017DE9', light: 'rgba(1, 125, 233, 0.12)' },
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

// Share duration options
const SHARE_DURATIONS: { label: string; value: ShareDuration; description: string }[] = [
  { label: '1 Hour', value: '1h', description: 'Link expires in 1 hour' },
  { label: '24 Hours', value: '24h', description: 'Link expires in 24 hours' },
  { label: '7 Days', value: '7d', description: 'Link expires in 7 days' },
  { label: '30 Days', value: '30d', description: 'Link expires in 30 days' },
  { label: 'No Expiry', value: 'permanent', description: 'Link never expires' },
];

export default function FolderViewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FolderViewRouteProp>();
  const { folderId } = route.params;
  const { folders, documents, deleteFolder, updateFolder, addDocumentToFolder, removeDocumentFromFolder } = useDocumentsStore();
  const { createShareLink, getShareLinksForFolder, deleteShareLink, deactivateShareLink } = useFolderShareStore();
  const { user } = useUserStore();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showAddDocuments, setShowAddDocuments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showManageShares, setShowManageShares] = useState(false);
  const [pickerTab, setPickerTab] = useState<'emoji' | 'color'>('emoji');
  
  // Share settings state
  const [shareDuration, setShareDuration] = useState<ShareDuration>('7d');
  const [shareAccessType, setShareAccessType] = useState<ShareAccessType>('view');
  const [sharePassword, setSharePassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [maxViews, setMaxViews] = useState<string>('');
  const [useMaxViews, setUseMaxViews] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState<FolderShareLink | null>(null);
  
  const { colors } = useTheme();

  const folder = folders.find((f: Folder) => f.id === folderId);

  const folderDocuments = useMemo(() => {
    if (!folder) return [];
    return documents.filter((d: Document) => folder.documentIds.includes(d.id));
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
      case 'shared':
        return 'send';
      case 'imported':
        return 'download';
      case 'converted':
        return 'swap-horizontal';
      default:
        return 'document-text';
    }
  };

  const getDocumentIconColor = (type: string): string => {
    switch (type) {
      case 'scanned':
        return colors.scanIcon;
      case 'uploaded':
        return colors.uploadedIcon;
      case 'edited':
        return colors.editIcon;
      case 'shared':
        return colors.primary;
      case 'imported':
        return colors.importedIcon;
      case 'converted':
        return colors.convertIcon;
      default:
        return colors.primary;
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
    return documents.filter((d: Document) => !folder.documentIds.includes(d.id));
  }, [folder, documents]);

  // Get existing share links for this folder
  const existingShareLinks = useMemo(() => {
    return getShareLinksForFolder(folderId);
  }, [folderId, getShareLinksForFolder]);

  // Calculate expiry date from duration
  const getExpiryDate = (duration: ShareDuration): Date | undefined => {
    if (duration === 'permanent') return undefined;
    const now = new Date();
    switch (duration) {
      case '1h': return new Date(now.getTime() + 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default: return undefined;
    }
  };

  // Format remaining time for share link
  const formatTimeRemaining = (expiresAt?: Date): string => {
    if (!expiresAt) return 'Never expires';
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m remaining`;
  };

  // Generate share link
  const handleGenerateShareLink = () => {
    const link = createShareLink({
      folderId,
      userId: user?.id || 'guest',
      accessType: shareAccessType,
      password: usePassword && sharePassword ? sharePassword : undefined,
      expiresAt: getExpiryDate(shareDuration),
      maxViews: useMaxViews && maxViews ? parseInt(maxViews, 10) : undefined,
      recipientEmail: recipientEmail || undefined,
    });
    setGeneratedLink(link);
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (generatedLink) {
      Clipboard.setString(generatedLink.shareUrl);
      Alert.alert('Copied!', 'Share link copied to clipboard');
    }
  };

  // Share link via system share
  const handleShareLink = async () => {
    if (generatedLink) {
      try {
        await Share.share({
          message: `View my shared folder "${folder.name}": ${generatedLink.shareUrl}${usePassword ? '\nPassword: ' + sharePassword : ''}`,
          title: `Share: ${folder.name}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  // Reset share modal state
  const resetShareModal = () => {
    setShareDuration('7d');
    setShareAccessType('view');
    setSharePassword('');
    setUsePassword(false);
    setMaxViews('');
    setUseMaxViews(false);
    setRecipientEmail('');
    setGeneratedLink(null);
  };

  // Handle revoking a share link
  const handleRevokeLink = (linkId: string) => {
    Alert.alert(
      'Revoke Share Link',
      'This will permanently deactivate this share link. Anyone with this link will no longer be able to access the folder.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => deactivateShareLink(linkId),
        },
      ]
    );
  };

  const handleMoreOptions = () => {
    Alert.alert(
      folder.name,
      'Choose an action',
      [
        { text: 'Share Folder', onPress: () => setShowShareModal(true) },
        { text: 'Manage Shares', onPress: () => setShowManageShares(true) },
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
      <DocumentThumbnail 
        type={item.type as any}
        thumbnailPath={item.thumbnailPath}
        size="medium"
      />
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
      <View style={[styles.gridThumbnailContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <DocumentThumbnail 
          type={item.type as any}
          thumbnailPath={item.thumbnailPath}
          size="large"
        />
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
                {availableDocuments.map((doc: Document) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.addDocItem, { borderBottomColor: colors.borderLight }]}
                    onPress={() => handleAddDocument(doc.id)}
                  >
                    <View style={[styles.addDocIcon, { backgroundColor: getDocumentIconColor(doc.type) + '15' }]}>
                      <Ionicons name={getDocumentIcon(doc.type)} size={20} color={getDocumentIconColor(doc.type)} />
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

      {/* Share Folder Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowShareModal(false);
          resetShareModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {generatedLink ? 'Share Link Ready' : 'Share Folder'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowShareModal(false);
                resetShareModal();
              }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {!generatedLink ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Access Type */}
                <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>ACCESS TYPE</Text>
                <View style={styles.accessTypeRow}>
                  <TouchableOpacity
                    style={[
                      styles.accessTypeButton,
                      { backgroundColor: colors.surfaceSecondary },
                      shareAccessType === 'view' && { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1 }
                    ]}
                    onPress={() => setShareAccessType('view')}
                  >
                    <Ionicons name="eye-outline" size={24} color={shareAccessType === 'view' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.accessTypeText, { color: shareAccessType === 'view' ? colors.primary : colors.textPrimary }]}>View Only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.accessTypeButton,
                      { backgroundColor: colors.surfaceSecondary },
                      shareAccessType === 'download' && { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1 }
                    ]}
                    onPress={() => setShareAccessType('download')}
                  >
                    <Ionicons name="download-outline" size={24} color={shareAccessType === 'download' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.accessTypeText, { color: shareAccessType === 'download' ? colors.primary : colors.textPrimary }]}>Download</Text>
                  </TouchableOpacity>
                </View>

                {/* Duration */}
                <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>LINK EXPIRES</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.durationScroll}>
                  {SHARE_DURATIONS.map((duration) => (
                    <TouchableOpacity
                      key={duration.value}
                      style={[
                        styles.durationChip,
                        { backgroundColor: colors.surfaceSecondary },
                        shareDuration === duration.value && { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1 }
                      ]}
                      onPress={() => setShareDuration(duration.value)}
                    >
                      <Text style={[
                        styles.durationChipText,
                        { color: shareDuration === duration.value ? colors.primary : colors.textPrimary }
                      ]}>{duration.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Password Protection */}
                <View style={styles.optionRow}>
                  <View style={styles.optionInfo}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Password Protection</Text>
                  </View>
                  <Switch
                    value={usePassword}
                    onValueChange={setUsePassword}
                    trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                    thumbColor={usePassword ? colors.primary : colors.textTertiary}
                  />
                </View>
                {usePassword && (
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary }]}
                    placeholder="Enter password"
                    placeholderTextColor={colors.textTertiary}
                    value={sharePassword}
                    onChangeText={setSharePassword}
                    secureTextEntry
                  />
                )}

                {/* View Limit */}
                <View style={styles.optionRow}>
                  <View style={styles.optionInfo}>
                    <Ionicons name="eye-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Limit Views</Text>
                  </View>
                  <Switch
                    value={useMaxViews}
                    onValueChange={setUseMaxViews}
                    trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                    thumbColor={useMaxViews ? colors.primary : colors.textTertiary}
                  />
                </View>
                {useMaxViews && (
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary }]}
                    placeholder="Max number of views"
                    placeholderTextColor={colors.textTertiary}
                    value={maxViews}
                    onChangeText={setMaxViews}
                    keyboardType="number-pad"
                  />
                )}

                {/* Recipient Email (optional) */}
                <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>SHARE WITH (OPTIONAL)</Text>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary }]}
                  placeholder="Enter recipient email"
                  placeholderTextColor={colors.textTertiary}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Generate Button */}
                <TouchableOpacity
                  style={[styles.generateButton, { backgroundColor: colors.primary }]}
                  onPress={handleGenerateShareLink}
                >
                  <Ionicons name="link-outline" size={20} color="#FFF" />
                  <Text style={styles.generateButtonText}>Generate Share Link</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              /* Link Generated View */
              <View style={styles.linkGeneratedContainer}>
                <View style={[styles.successIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.success || '#4CAF50'} />
                </View>
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Link Created!</Text>
                <Text style={[styles.successDescription, { color: colors.textSecondary }]}>
                  {shareDuration === 'permanent' 
                    ? 'This link will never expire' 
                    : `This link will expire in ${SHARE_DURATIONS.find(d => d.value === shareDuration)?.label.toLowerCase()}`}
                </Text>

                <View style={[styles.linkBox, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.linkText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {generatedLink.shareUrl}
                  </Text>
                </View>

                {usePassword && (
                  <View style={[styles.passwordInfo, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                    <Ionicons name="key-outline" size={16} color={colors.warning || '#FF9800'} />
                    <Text style={[styles.passwordInfoText, { color: colors.textSecondary }]}>
                      Password: {sharePassword}
                    </Text>
                  </View>
                )}

                <View style={styles.shareActions}>
                  <TouchableOpacity
                    style={[styles.shareActionButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={handleCopyLink}
                  >
                    <Ionicons name="copy-outline" size={20} color={colors.textPrimary} />
                    <Text style={[styles.shareActionText, { color: colors.textPrimary }]}>Copy Link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.shareActionButton, { backgroundColor: colors.primary }]}
                    onPress={handleShareLink}
                  >
                    <Ionicons name="share-outline" size={20} color="#FFF" />
                    <Text style={[styles.shareActionText, { color: '#FFF' }]}>Share</Text>
                  </TouchableOpacity>
                </View>

                {/* Preview Button */}
                <TouchableOpacity
                  style={[styles.previewLinkButton, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
                  onPress={() => {
                    if (generatedLink?.shareToken) {
                      setShowShareModal(false);
                      // Use the token from the link
                      const token = generatedLink.shareToken;
                      (navigation as any).navigate('SharedFolderView', { 
                        shareToken: token,
                        password: usePassword ? sharePassword : undefined 
                      });
                    }
                  }}
                >
                  <Ionicons name="eye-outline" size={20} color={colors.success} />
                  <Text style={[styles.previewLinkText, { color: colors.success }]}>Preview Shared Folder</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.createAnotherLink}
                  onPress={resetShareModal}
                >
                  <Text style={[styles.createAnotherLinkText, { color: colors.primary }]}>Create Another Link</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Manage Shares Modal */}
      <Modal
        visible={showManageShares}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManageShares(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Active Share Links</Text>
              <TouchableOpacity onPress={() => setShowManageShares(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {existingShareLinks.length === 0 ? (
              <View style={styles.noSharesState}>
                <Ionicons name="link-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.noSharesText, { color: colors.textSecondary }]}>
                  No active share links for this folder
                </Text>
                <TouchableOpacity
                  style={[styles.createShareButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setShowManageShares(false);
                    setShowShareModal(true);
                  }}
                >
                  <Text style={styles.createShareButtonText}>Create Share Link</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {existingShareLinks.map((link: FolderShareLink) => (
                  <View key={link.id} style={[styles.shareLinkCard, { backgroundColor: colors.surfaceSecondary }]}>
                    <View style={styles.shareLinkHeader}>
                      <View style={styles.shareLinkInfo}>
                        <Ionicons 
                          name={link.accessType === 'view' ? 'eye-outline' : 'download-outline'} 
                          size={16} 
                          color={colors.textSecondary} 
                        />
                        <Text style={[styles.shareLinkType, { color: colors.textSecondary }]}>
                          {link.accessType === 'view' ? 'View Only' : 'Download'}
                        </Text>
                        {link.password && (
                          <View style={[styles.passwordBadge, { backgroundColor: colors.warning || '#FF9800' }]}>
                            <Ionicons name="lock-closed" size={10} color="#FFF" />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.shareLinkViews, { color: colors.textTertiary }]}>
                        {link.viewCount} view{link.viewCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    
                    <Text style={[styles.shareLinkUrl, { color: colors.textPrimary }]} numberOfLines={1}>
                      {link.shareUrl}
                    </Text>
                    
                    <View style={styles.shareLinkFooter}>
                      <Text style={[styles.shareLinkExpiry, { color: colors.textTertiary }]}>
                        {formatTimeRemaining(link.expiresAt)}
                      </Text>
                      <View style={styles.shareLinkActions}>
                        <TouchableOpacity
                          style={styles.shareLinkAction}
                          onPress={() => {
                            Clipboard.setString(link.shareUrl);
                            Alert.alert('Copied!', 'Link copied to clipboard');
                          }}
                        >
                          <Ionicons name="copy-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.shareLinkAction}
                          onPress={() => handleRevokeLink(link.id)}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
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
  documentInfo: {
    flex: 1,
    marginLeft: spacing.md,
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
  gridThumbnailContainer: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  // Share modal styles
  shareLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  accessTypeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  accessTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  accessTypeText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  durationScroll: {
    marginBottom: spacing.md,
  },
  durationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
  },
  durationChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  passwordInput: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  linkGeneratedContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  successDescription: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  linkBox: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  linkText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
  },
  passwordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  passwordInfoText: {
    fontSize: typography.fontSize.sm,
  },
  shareActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  shareActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  shareActionText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  previewLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  previewLinkText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  createAnotherLink: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  createAnotherLinkText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  noSharesState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  noSharesText: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  createShareButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  createShareButtonText: {
    color: '#FFF',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  shareLinkCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  shareLinkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  shareLinkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  shareLinkType: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  passwordBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  shareLinkViews: {
    fontSize: typography.fontSize.sm,
  },
  shareLinkUrl: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  shareLinkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareLinkExpiry: {
    fontSize: typography.fontSize.xs,
  },
  shareLinkActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shareLinkAction: {
    padding: spacing.xs,
  },
});
