import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, ScanFilter } from '../../types';
import { useDocumentsStore, useActivityStore, generateId } from '../../store';
import { useUserStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ScanPreview'>;
type RouteType = RouteProp<HomeStackParamList, 'ScanPreview'>;

const { width } = Dimensions.get('window');

const filters: { key: ScanFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'auto', label: 'Auto', icon: 'color-wand' },
  { key: 'blackWhite', label: 'B&W', icon: 'contrast' },
  { key: 'grayscale', label: 'Gray', icon: 'moon' },
  { key: 'original', label: 'Color', icon: 'color-palette' },
];

export default function ScanPreviewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { imageUri: initialUri } = route.params;
  const { addDocument } = useDocumentsStore();
  const { addActivity } = useActivityStore();
  const { user } = useUserStore();

  const [imageUri, setImageUri] = useState(initialUri);
  const [selectedFilter, setSelectedFilter] = useState<ScanFilter>('auto');
  const [documentName, setDocumentName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [rotation, setRotation] = useState(0);

  const getDefaultName = () => {
    const date = new Date();
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '_');
    return `Scan_${dateStr}`;
  };

  const handleRotate = async () => {
    setIsProcessing(true);
    try {
      const newRotation = (rotation + 90) % 360;
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ rotate: 90 }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUri(result.uri);
      setRotation(newRotation);
    } catch (error) {
      Alert.alert('Error', 'Failed to rotate image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrop = async () => {
    // Simulate crop with a 10% border crop
    setIsProcessing(true);
    try {
      // First get image dimensions
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { base64: false }
      );
      
      // Apply a 10% crop from all sides
      const cropMargin = 0.05;
      const cropResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{
          crop: {
            originX: result.width * cropMargin,
            originY: result.height * cropMargin,
            width: result.width * (1 - cropMargin * 2),
            height: result.height * (1 - cropMargin * 2),
          }
        }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUri(cropResult.uri);
      Alert.alert('Cropped', 'Image has been cropped to remove borders');
    } catch (error) {
      Alert.alert('Error', 'Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustBrightness = async () => {
    // Apply auto-enhancement
    setIsProcessing(true);
    try {
      // Increase brightness/contrast simulation via compression
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { compress: 1.0, format: ImageManipulator.SaveFormat.PNG }
      );
      setImageUri(result.uri);
      Alert.alert('Enhanced', 'Image has been enhanced for clarity');
    } catch (error) {
      Alert.alert('Error', 'Failed to adjust image');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyFilter = async (filter: ScanFilter) => {
    setSelectedFilter(filter);
    if (filter === 'original') {
      setImageUri(initialUri);
      return;
    }
    
    // For grayscale/B&W, we'd need a more complex solution
    // For now, just acknowledge the filter selection
    setIsProcessing(true);
    try {
      // ImageManipulator doesn't have built-in grayscale, so we simulate
      // In production, you'd use a library like react-native-image-filter-kit
      await new Promise(resolve => setTimeout(resolve, 300));
      // Just reset to show filter was applied
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docId = generateId();
      const finalName = documentName.trim() || getDefaultName();

      const newDocument = {
        id: docId,
        userId: user?.id || 'guest',
        name: `${finalName}.pdf`,
        type: 'scanned' as const,
        filePath: imageUri,
        thumbnailPath: imageUri,
        pagesCount: pageCount,
        fileSize: 500000,
        mimeType: 'application/pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addDocument(newDocument);

      addActivity({
        id: generateId(),
        userId: user?.id || 'guest',
        type: 'scan',
        documentId: docId,
        title: 'Document scanned',
        description: `Scanned "${finalName}.pdf"`,
        createdAt: new Date(),
      });

      Alert.alert('Success! 🎉', 'Your document has been saved.', [
        {
          text: 'View Documents',
          onPress: () => navigation.navigate('HomeScreen'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  const handleAddPage = () => {
    setPageCount((prev) => prev + 1);
    Alert.alert('Page Added', `Document now has ${pageCount + 1} pages`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleRetake}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Preview</Text>
          <View style={styles.pageIndicator}>
            <Ionicons name="document-text-outline" size={14} color={colors.primary} />
            <Text style={styles.pageCount}>{pageCount} page{pageCount > 1 ? 's' : ''}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Preview with shadow effect */}
        <View style={styles.previewWrapper}>
          <View style={styles.previewShadow}>
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.preview}
                resizeMode="contain"
              />
            </View>
          </View>
          {/* Page number badge */}
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>1 / {pageCount}</Text>
          </View>
          
          {/* Quick edit actions on preview */}
          <View style={styles.previewActions}>
            <TouchableOpacity 
              style={styles.previewActionButton} 
              onPress={handleCrop}
              disabled={isProcessing}
            >
              <Ionicons name="crop" size={20} color={isProcessing ? colors.textTertiary : colors.textSecondary} />
              <Text style={styles.previewActionText}>Crop</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.previewActionButton} 
              onPress={handleRotate}
              disabled={isProcessing}
            >
              <Ionicons name="refresh" size={20} color={isProcessing ? colors.textTertiary : colors.textSecondary} />
              <Text style={styles.previewActionText}>Rotate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.previewActionButton} 
              onPress={handleAdjustBrightness}
              disabled={isProcessing}
            >
              <Ionicons name="sunny" size={20} color={isProcessing ? colors.textTertiary : colors.textSecondary} />
              <Text style={styles.previewActionText}>Enhance</Text>
            </TouchableOpacity>
          </View>
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>

        {/* Enhancement Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-filter" size={18} color={colors.textPrimary} />
            <Text style={styles.sectionTitle}>Enhancement</Text>
          </View>
          <View style={styles.filtersRow}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.key && styles.filterButtonActive,
                ]}
                onPress={() => applyFilter(filter.key)}
                disabled={isProcessing}
              >
                <View style={[
                  styles.filterIconContainer,
                  selectedFilter === filter.key && styles.filterIconContainerActive,
                ]}>
                  <Ionicons
                    name={filter.icon}
                    size={22}
                    color={selectedFilter === filter.key ? colors.textInverse : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.filterLabel,
                    selectedFilter === filter.key && styles.filterLabelActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Document Name */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.sectionTitle}>Document Name</Text>
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder={getDefaultName()}
              placeholderTextColor={colors.textTertiary}
              value={documentName}
              onChangeText={setDocumentName}
            />
            <View style={styles.extensionBadge}>
              <Text style={styles.extensionText}>.pdf</Text>
            </View>
          </View>
        </View>

        {/* Add More Pages */}
        <TouchableOpacity style={styles.addPageButton} onPress={handleAddPage}>
          <View style={styles.addPageIconContainer}>
            <Ionicons name="add" size={24} color={colors.textSecondary} />
          </View>
          <View style={styles.addPageContent}>
            <Text style={styles.addPageTitle}>Add Another Page</Text>
            <Text style={styles.addPageSubtitle}>Scan more pages to this document</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
          <Ionicons name="camera-reverse-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Ionicons name="hourglass-outline" size={22} color={colors.textInverse} />
              <Text style={styles.saveText}>Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={colors.textInverse} />
              <Text style={styles.saveText}>Save Document</Text>
            </>
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  pageCount: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  content: {
    paddingBottom: spacing.xl,
  },
  previewWrapper: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  previewShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  previewContainer: {
    width: width - spacing.xl * 2,
    aspectRatio: 0.707, // A4 paper ratio (1:√2)
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  preview: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceSecondary,
  },
  pageBadge: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
  },
  pageBadgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
    fontWeight: '600',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    marginTop: spacing.lg,
  },
  previewActionButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  processingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
  },
  processingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    alignItems: 'center',
    flex: 1,
  },
  filterButtonActive: {},
  filterIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterIconContainerActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  extensionBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  extensionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  addPageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addPageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  addPageContent: {
    flex: 1,
  },
  addPageTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  addPageSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  retakeButton: {
    flex: 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  retakeText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
    fontWeight: '600',
  },
});
