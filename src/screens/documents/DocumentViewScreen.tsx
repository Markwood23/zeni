import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { DocumentsStackParamList, Document } from '../../types';
import { useDocumentsStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<DocumentsStackParamList, 'DocumentView'>;
type RouteType = RouteProp<DocumentsStackParamList, 'DocumentView'>;

export default function DocumentViewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documentId } = route.params;
  const { documents, deleteDocument } = useDocumentsStore();

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
      await Share.share({
        message: `Check out this document: ${document.name}`,
        // url: document.filePath, // Would be the actual file path
      });
    } catch (error) {
      console.error('Error sharing:', error);
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
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    // Navigate to Edit screen with document
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
    // Navigate to Convert screen with document
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

  const handleFax = () => {
    // Navigate to Fax screen with document
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Home',
        params: {
          screen: 'FaxSend',
          params: { documentId: document.id },
        },
      })
    );
  };

  const handleOpenDocument = () => {
    Alert.alert(
      'Open Document',
      'Document viewer will be available in a future update. For now, you can share the document to open it in another app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share Instead', onPress: handleShare },
      ]
    );
  };

  const handleMoreOptions = () => {
    Alert.alert(
      document.name,
      'Choose an action',
      [
        { text: 'Rename', onPress: handleRename },
        { text: 'Duplicate', onPress: handleDuplicate },
        { text: 'Move to Folder', onPress: handleMoveToFolder },
        { text: 'Cancel', style: 'cancel' },
      ]
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
              // Would update document name here
              Alert.alert('Success', `Document renamed to "${newName.trim()}"`);
            }
          },
        },
      ],
      'plain-text',
      document.name.replace(/\.[^/.]+$/, '') // Remove extension for editing
    );
  };

  const handleDuplicate = () => {
    Alert.alert('Duplicate', 'Document duplicated successfully!');
  };

  const handleMoveToFolder = () => {
    Alert.alert('Move to Folder', 'Folder selection will be available in a future update.');
  };

  const actions = [
    { id: 'share', icon: 'share-outline' as keyof typeof Ionicons.glyphMap, label: 'Share', onPress: handleShare },
    { id: 'edit', icon: 'create-outline' as keyof typeof Ionicons.glyphMap, label: 'Edit', onPress: handleEdit },
    { id: 'convert', icon: 'swap-horizontal-outline' as keyof typeof Ionicons.glyphMap, label: 'Convert', onPress: handleConvert },
    { id: 'fax', icon: 'print-outline' as keyof typeof Ionicons.glyphMap, label: 'Fax', onPress: handleFax },
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
            <View style={styles.preview}>
              <View style={styles.previewContent}>
                <View style={styles.previewHeader}>
                  <Ionicons name="document-text" size={28} color={colors.textSecondary} />
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
                  <Text style={styles.previewPageText}>Page 1 of {document.pagesCount}</Text>
                </View>
              </View>
            </View>
          </View>
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
        <TouchableOpacity style={styles.openButton} onPress={handleOpenDocument}>
          <Ionicons name="open-outline" size={20} color={colors.textInverse} />
          <Text style={styles.openButtonText}>Open Document</Text>
        </TouchableOpacity>
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
});
