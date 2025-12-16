import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
  Share,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, borderRadius } from '../../constants/theme';
import { useDocumentsStore, useFolderShareStore, useUserStore } from '../../store';
import { Document, Folder, FolderShareLink } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DocumentsStackParamList } from '../../types';

const { width } = Dimensions.get('window');
const gridItemWidth = (width - spacing.lg * 3) / 2;

type Props = NativeStackScreenProps<DocumentsStackParamList, 'SharedFolderView'>;

export default function SharedFolderViewScreen({ navigation, route }: Props) {
  const { shareToken, password: providedPassword } = route.params;
  const { colors } = useTheme();
  const { documents, folders } = useDocumentsStore();
  const { shareLinks, incrementViewCount, getShareLinkByToken } = useFolderShareStore();
  const { user } = useUserStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [shareLink, setShareLink] = useState<FolderShareLink | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [folderDocuments, setFolderDocuments] = useState<Document[]>([]);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState(providedPassword || '');
  const [passwordError, setPasswordError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSharedFolder();
  }, [shareToken]);

  const loadSharedFolder = () => {
    setIsLoading(true);
    
    // Find the share link by token using the store function
    const foundLink = getShareLinkByToken(shareToken);
    
    if (!foundLink) {
      setError('This share link is invalid or has been removed.');
      setIsLoading(false);
      return;
    }
    
    // Check if link is active
    if (!foundLink.isActive) {
      setError('This share link has been deactivated.');
      setIsLoading(false);
      return;
    }
    
    // Check if link is expired
    if (foundLink.expiresAt && new Date(foundLink.expiresAt) < new Date()) {
      setError('This share link has expired.');
      setIsLoading(false);
      return;
    }
    
    // Check max views
    if (foundLink.maxViews && foundLink.viewCount >= foundLink.maxViews) {
      setError('This share link has reached its maximum view limit.');
      setIsLoading(false);
      return;
    }
    
    setShareLink(foundLink);
    
    // Check if password is required
    if (foundLink.password && !isUnlocked) {
      setRequiresPassword(true);
      setIsLoading(false);
      return;
    }
    
    // Find the folder
    const foundFolder = folders.find((f: Folder) => f.id === foundLink.folderId);
    if (!foundFolder) {
      setError('The shared folder could not be found.');
      setIsLoading(false);
      return;
    }
    
    setFolder(foundFolder);
    
    // Get documents in this folder
    const docs = documents.filter((doc: Document) => doc.folderId === foundLink.folderId);
    setFolderDocuments(docs);
    
    // Increment view count
    incrementViewCount(foundLink.id);
    
    setIsLoading(false);
  };

  const handleUnlock = () => {
    if (!shareLink) return;
    
    if (password === shareLink.password) {
      setIsUnlocked(true);
      setRequiresPassword(false);
      setPasswordError('');
      loadSharedFolder();
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handleDownload = (doc: Document) => {
    if (shareLink?.accessType === 'view') {
      Alert.alert('View Only', 'This folder is shared for viewing only. Downloads are not permitted.');
      return;
    }
    
    // Simulate download - in a real app, this would trigger an actual download
    Alert.alert('Download Started', `Downloading ${doc.name}...`);
  };

  const handleViewDocument = (doc: Document) => {
    navigation.navigate('DocumentView', { documentId: doc.id });
  };

  const getTimeRemaining = () => {
    if (!shareLink?.expiresAt) return 'Never expires';
    
    const expiry = new Date(shareLink.expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `Expires in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Expires in ${hours} hour${hours > 1 ? 's' : ''}`;
    return `Expires in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDocumentIcon = (mimeType?: string) => {
    if (!mimeType) return { name: 'document-outline', color: colors.textSecondary };
    if (mimeType.includes('pdf')) return { name: 'document-text', color: '#E53935' };
    if (mimeType.includes('image')) return { name: 'image', color: '#43A047' };
    if (mimeType.includes('word')) return { name: 'document', color: '#1E88E5' };
    return { name: 'document-outline', color: colors.textSecondary };
  };

  // Error State
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Unable to Load</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.errorButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading shared folder...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Password Required State
  if (requiresPassword) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Shared Folder</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.passwordContainer}>
          <View style={[styles.passwordIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Ionicons name="lock-closed" size={48} color={colors.warning || '#F59E0B'} />
          </View>
          <Text style={[styles.passwordTitle, { color: colors.textPrimary }]}>Password Protected</Text>
          <Text style={[styles.passwordSubtitle, { color: colors.textSecondary }]}>
            Enter the password to view this shared folder
          </Text>
          
          <TextInput
            style={[styles.passwordInput, { 
              backgroundColor: colors.surfaceSecondary,
              borderColor: passwordError ? colors.error : colors.borderLight,
              color: colors.textPrimary
            }]}
            placeholder="Enter password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleUnlock}
          />
          
          {passwordError ? (
            <Text style={[styles.passwordErrorText, { color: colors.error }]}>{passwordError}</Text>
          ) : null}
          
          <TouchableOpacity
            style={[styles.unlockButton, { backgroundColor: colors.primary }]}
            onPress={handleUnlock}
          >
            <Text style={styles.unlockButtonText}>Unlock Folder</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Folder Content
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {folder?.name || 'Shared Folder'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Shared with you
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Expiry Banner */}
      {shareLink?.expiresAt && (
        <View style={[styles.expiryBanner, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
          <Ionicons name="time-outline" size={18} color={colors.warning || '#F59E0B'} />
          <Text style={[styles.expiryText, { color: colors.warning || '#F59E0B' }]}>
            {getTimeRemaining()}
          </Text>
        </View>
      )}

      {/* Folder Info Card */}
      <View style={[styles.folderInfoCard, { backgroundColor: colors.surface }]}>
        <View style={styles.folderIconContainer}>
          <Text style={styles.folderIcon}>{folder?.icon || '📁'}</Text>
        </View>
        <View style={styles.folderDetails}>
          <Text style={[styles.folderName, { color: colors.textPrimary }]}>{folder?.name}</Text>
          <Text style={[styles.folderStats, { color: colors.textSecondary }]}>
            {folderDocuments.length} document{folderDocuments.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={[styles.accessBadge, { 
          backgroundColor: shareLink?.accessType === 'download' 
            ? 'rgba(16, 185, 129, 0.1)'
            : colors.primaryLight 
        }]}>
          <Ionicons 
            name={shareLink?.accessType === 'download' ? 'download-outline' : 'eye-outline'} 
            size={14} 
            color={shareLink?.accessType === 'download' ? colors.success : colors.primary} 
          />
          <Text style={[styles.accessText, { 
            color: shareLink?.accessType === 'download' ? colors.success : colors.primary 
          }]}>
            {shareLink?.accessType === 'download' ? 'Can Download' : 'View Only'}
          </Text>
        </View>
      </View>

      {/* Documents List */}
      {folderDocuments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Documents</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            This folder is empty
          </Text>
        </View>
      ) : (
        <FlatList
          data={folderDocuments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.documentsList}
          renderItem={({ item }) => {
            const icon = getDocumentIcon(item.mimeType);
            return (
              <TouchableOpacity
                style={[styles.documentCard, { backgroundColor: colors.surface }]}
                onPress={() => handleViewDocument(item)}
                activeOpacity={0.7}
              >
                {item.thumbnailPath ? (
                  <Image source={{ uri: item.thumbnailPath }} style={styles.documentThumbnail} />
                ) : (
                  <View style={[styles.documentIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name={icon.name as any} size={28} color={icon.color} />
                  </View>
                )}
                <View style={styles.documentInfo}>
                  <Text style={[styles.documentName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.documentMeta, { color: colors.textTertiary }]}>
                    {formatFileSize(item.fileSize)} • {formatDate(item.createdAt)}
                  </Text>
                </View>
                {shareLink?.accessType === 'download' && (
                  <TouchableOpacity
                    style={[styles.downloadButton, { backgroundColor: colors.primaryLight }]}
                    onPress={() => handleDownload(item)}
                  >
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  errorButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  passwordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  passwordIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  passwordTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  passwordSubtitle: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  passwordInput: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
  },
  passwordErrorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  unlockButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  unlockButtonText: {
    color: '#FFF',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  expiryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  folderInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  folderIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  folderIcon: {
    fontSize: 28,
  },
  folderDetails: {
    flex: 1,
  },
  folderName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: 2,
  },
  folderStats: {
    fontSize: typography.fontSize.sm,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  accessText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  documentsList: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  documentThumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: typography.fontSize.sm,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
  },
});
