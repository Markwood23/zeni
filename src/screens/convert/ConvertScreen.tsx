import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, ConvertOperation, Document } from '../../types';
import { useDocumentsStore, useActivityStore, generateId, useUserStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Convert'>;

interface ConversionOption {
  id: ConvertOperation;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  fromTypes: string[];
  toType: string;
  colorKey: 'error' | 'success' | 'convertIcon' | 'warning' | 'accent'; // Use theme color keys
}

const conversionOptions: ConversionOption[] = [
  {
    id: 'toPdf',
    icon: 'document',
    title: 'Convert to PDF',
    description: 'Images, DOCX, TXT → PDF',
    fromTypes: ['jpg', 'jpeg', 'png', 'docx', 'txt', 'image'],
    toType: 'pdf',
    colorKey: 'error', // Red
  },
  {
    id: 'toImage',
    icon: 'image',
    title: 'PDF to Images',
    description: 'Extract pages as JPG/PNG',
    fromTypes: ['pdf'],
    toType: 'jpg',
    colorKey: 'success', // Green
  },
  {
    id: 'merge',
    icon: 'git-merge',
    title: 'Merge PDFs',
    description: 'Combine multiple PDFs into one',
    fromTypes: ['pdf'],
    toType: 'pdf',
    colorKey: 'convertIcon', // Purple (matches convert feature)
  },
  {
    id: 'split',
    icon: 'git-branch',
    title: 'Split PDF',
    description: 'Extract specific pages',
    fromTypes: ['pdf'],
    toType: 'pdf',
    colorKey: 'warning', // Amber/Orange
  },
  {
    id: 'compress',
    icon: 'contract',
    title: 'Compress PDF',
    description: 'Reduce file size for sharing',
    fromTypes: ['pdf'],
    toType: 'pdf',
    colorKey: 'accent', // Purple accent
  },
];

export default function ConvertScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<HomeStackParamList, 'Convert'>>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documents, addDocument } = useDocumentsStore();
  const { addActivity } = useActivityStore();
  const { user } = useUserStore();

  const [selectedOperation, setSelectedOperation] = useState<ConvertOperation | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const spinValue = useState(new Animated.Value(0))[0];

  // Get passed documentId from route params
  const preSelectedDocId = route.params?.documentId;

  useEffect(() => {
    if (preSelectedDocId) {
      const doc = documents.find((d: Document) => d.id === preSelectedDocId);
      if (doc) {
        // Auto-select operation based on document type
        if (doc.mimeType === 'application/pdf') {
          // PDF can do most operations
          setSelectedOperation('compress');
        } else if (doc.mimeType.startsWith('image/')) {
          setSelectedOperation('toPdf');
        } else {
          setSelectedOperation('toPdf');
        }
        setSelectedDocuments([preSelectedDocId]);
      }
    }
  }, [preSelectedDocId]);

  // Get documents compatible with selected operation
  const getCompatibleDocuments = () => {
    if (!selectedOperation) return documents;
    
    const option = conversionOptions.find(o => o.id === selectedOperation);
    if (!option) return documents;

    return documents.filter((d: Document) => {
      if (selectedOperation === 'toPdf') {
        // For toPdf, show images and scans, but not existing PDFs
        return d.mimeType.startsWith('image/') || d.type === 'scanned' || d.mimeType !== 'application/pdf';
      }
      // For other operations, only show PDFs
      return d.mimeType === 'application/pdf';
    });
  };

  const compatibleDocuments = getCompatibleDocuments();

  const handleSelectOperation = (operation: ConvertOperation) => {
    setSelectedOperation(operation);
    setSelectedDocuments([]);
  };

  const handleSelectDocument = (docId: string) => {
    if (selectedOperation === 'merge') {
      // Allow multiple selection for merge
      setSelectedDocuments((prev) =>
        prev.includes(docId)
          ? prev.filter((id) => id !== docId)
          : [...prev, docId]
      );
    } else {
      setSelectedDocuments([docId]);
    }
  };

  const handleImport = async () => {
    try {
      let mimeTypes: string[] = ['application/pdf'];
      
      if (selectedOperation === 'toPdf') {
        mimeTypes = [
          'image/*',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: mimeTypes,
        copyToCacheDirectory: true,
        multiple: selectedOperation === 'merge',
      });

      if (!result.canceled && result.assets.length > 0) {
        // Add imported files as documents
        const importedDocs: Document[] = result.assets.map(asset => ({
          id: generateId(),
          userId: user?.id || 'guest',
          name: asset.name,
          type: 'imported' as const,
          filePath: asset.uri,
          thumbnailPath: asset.mimeType?.startsWith('image/') ? asset.uri : undefined,
          pagesCount: 1,
          fileSize: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream',
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        importedDocs.forEach(doc => {
          addDocument(doc);
          addActivity({
            id: generateId(),
            userId: user?.id || 'guest',
            type: 'import',
            documentId: doc.id,
            title: 'File imported',
            description: `Imported "${doc.name}" for conversion`,
            createdAt: new Date(),
          });
        });

        // Select the imported documents
        setSelectedDocuments(importedDocs.map(d => d.id));
        Alert.alert('Success', `${importedDocs.length} file(s) imported and selected`);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to import file');
    }
  };

  const startSpinAnimation = () => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const handleConvert = async () => {
    if (!selectedOperation || selectedDocuments.length === 0) return;

    setIsConverting(true);
    setShowProgressModal(true);
    setConversionProgress(0);
    startSpinAnimation();

    try {
      // Simulate conversion with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        setConversionProgress(i);
      }

      const sourceDoc = documents.find((d: Document) => d.id === selectedDocuments[0]);
      if (!sourceDoc) throw new Error('Document not found');

      const newDocId = generateId();
      const baseName = sourceDoc.name.replace(/\.[^/.]+$/, '');
      let newName = baseName;
      let newMimeType = 'application/pdf';

      switch (selectedOperation) {
        case 'toPdf':
          newName = `${baseName}.pdf`;
          break;
        case 'toImage':
          newName = `${baseName}_page1.jpg`;
          newMimeType = 'image/jpeg';
          break;
        case 'merge':
          newName = `Merged_${selectedDocuments.length}_files.pdf`;
          break;
        case 'split':
          newName = `${baseName}_extracted.pdf`;
          break;
        case 'compress':
          newName = `${baseName}_compressed.pdf`;
          break;
      }

      const newDocument: Document = {
        id: newDocId,
        userId: user?.id || 'guest',
        name: newName,
        type: 'converted' as const,
        filePath: sourceDoc.filePath,
        thumbnailPath: sourceDoc.thumbnailPath,
        pagesCount: selectedOperation === 'merge' ? selectedDocuments.reduce((acc, id) => {
          const doc = documents.find((d: Document) => d.id === id);
          return acc + (doc?.pagesCount || 1);
        }, 0) : sourceDoc.pagesCount,
        fileSize: selectedOperation === 'compress' 
          ? Math.floor(sourceDoc.fileSize * 0.4) // 60% compression
          : sourceDoc.fileSize,
        mimeType: newMimeType,
        sourceDocumentId: sourceDoc.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addDocument(newDocument);

      const operationName = conversionOptions.find(o => o.id === selectedOperation)?.title || selectedOperation;
      addActivity({
        id: generateId(),
        userId: user?.id || 'guest',
        type: 'convert',
        documentId: newDocId,
        title: operationName,
        description: `Created "${newName}" from ${selectedDocuments.length} file(s)`,
        createdAt: new Date(),
      });

      setShowProgressModal(false);
      Alert.alert(
        'Conversion Complete! ✨',
        `Your file "${newName}" is ready.`,
        [
          {
            text: 'Convert Another',
            onPress: () => {
              setSelectedOperation(null);
              setSelectedDocuments([]);
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      setShowProgressModal(false);
      Alert.alert('Error', 'Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getColorWithOpacity = (hexColor: string, opacity: number = 0.12) => {
    // Convert hex to rgba for proper transparency
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Get color from theme based on colorKey
  const getOptionColor = (colorKey: string) => {
    return (colors as any)[colorKey] || colors.primary;
  };

  const renderOptionCard = ({ item }: { item: ConversionOption }) => {
    const itemColor = getOptionColor(item.colorKey);
    
    return (
      <TouchableOpacity
        style={[
          styles.optionCard,
          selectedOperation === item.id && styles.optionCardSelected,
        ]}
        onPress={() => handleSelectOperation(item.id)}
      >
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: getColorWithOpacity(itemColor) },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={28}
            color={itemColor}
          />
        </View>
      <View style={styles.optionInfo}>
        <Text style={styles.optionTitle}>{item.title}</Text>
        <Text style={styles.optionDescription}>{item.description}</Text>
      </View>
      {selectedOperation === item.id ? (
        <View style={[styles.checkCircle, { backgroundColor: itemColor }]}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
  };

  const getDocumentIcon = (doc: Document) => {
    if (doc.mimeType === 'application/pdf') return { name: 'document', color: colors.error };
    if (doc.mimeType.startsWith('image/')) return { name: 'image', color: colors.success };
    if (doc.mimeType.includes('word')) return { name: 'document-text', color: colors.info };
    if (doc.type === 'scanned') return { name: 'scan', color: colors.scanIcon };
    return { name: 'document-outline', color: colors.textSecondary };
  };

  const renderDocumentItem = ({ item }: { item: Document }) => {
    const iconInfo = getDocumentIcon(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.documentCard,
          selectedDocuments.includes(item.id) && styles.documentCardSelected,
        ]}
        onPress={() => handleSelectDocument(item.id)}
      >
        <View style={[styles.documentThumbnail, { backgroundColor: getColorWithOpacity(iconInfo.color) }]}>
          <Ionicons name={iconInfo.name as any} size={24} color={iconInfo.color} />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.documentMeta}>
            {item.pagesCount} page{item.pagesCount !== 1 ? 's' : ''} • {(item.fileSize / 1024).toFixed(0)} KB
          </Text>
        </View>
        {selectedDocuments.includes(item.id) && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={16} color={colors.textInverse} />
          </View>
        )}
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
        <Text style={styles.headerTitle}>Convert</Text>
        <View style={styles.placeholder} />
      </View>

      {selectedOperation ? (
        <FlatList
          data={compatibleDocuments}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.selectionHeader}>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => {
                  setSelectedOperation(null);
                  setSelectedDocuments([]);
                }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={styles.changeText}>Change Operation</Text>
              </TouchableOpacity>
              
              <View style={styles.operationBadge}>
                <View style={[styles.operationBadgeIcon, { backgroundColor: getColorWithOpacity(getOptionColor(conversionOptions.find(o => o.id === selectedOperation)?.colorKey || 'primary')) }]}>
                  <Ionicons 
                    name={conversionOptions.find(o => o.id === selectedOperation)?.icon as any}
                    size={24}
                    color={getOptionColor(conversionOptions.find(o => o.id === selectedOperation)?.colorKey || 'primary')}
                  />
                </View>
                <Text style={styles.selectionTitle}>
                  {conversionOptions.find((o) => o.id === selectedOperation)?.title}
                </Text>
              </View>
              
              <Text style={styles.selectionSubtitle}>
                {selectedOperation === 'merge'
                  ? `Select ${selectedDocuments.length > 0 ? `${selectedDocuments.length} selected` : 'multiple documents'}`
                  : selectedDocuments.length > 0 ? '1 document selected' : 'Select a document'}
              </Text>
              
              <TouchableOpacity style={styles.importButton} onPress={handleImport}>
                <View style={styles.importIconWrapper}>
                  <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.importTextWrapper}>
                  <Text style={styles.importTitle}>Import from Files</Text>
                  <Text style={styles.importSubtitle}>Browse your device storage</Text>
                </View>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
              
              {compatibleDocuments.length > 0 && (
                <Text style={styles.documentsHeader}>Your Documents</Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="document-outline" size={48} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyText}>No compatible documents</Text>
              <Text style={styles.emptySubtext}>
                {selectedOperation === 'toPdf' 
                  ? 'Import images or documents to convert to PDF'
                  : 'Import PDF files to perform this operation'}
              </Text>
              <TouchableOpacity style={styles.emptyImportButton} onPress={handleImport}>
                <Ionicons name="add" size={20} color={colors.textInverse} />
                <Text style={styles.emptyImportText}>Import Files</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={conversionOptions}
          renderItem={renderOptionCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <View style={styles.heroSection}>
                <View style={styles.heroIconWrapper}>
                  <Ionicons name="swap-horizontal" size={32} color={colors.primary} />
                </View>
                <Text style={styles.heroTitle}>Document Converter</Text>
                <Text style={styles.heroSubtitle}>
                  Convert, merge, split, and compress your documents
                </Text>
              </View>
              <Text style={styles.sectionTitle}>Choose Conversion Type</Text>
            </View>
          }
        />
      )}

      {/* Convert Button */}
      {selectedOperation && selectedDocuments.length > 0 && (
        <View style={styles.bottomAction}>
          <View style={styles.selectionSummary}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.selectionSummaryText}>
              {selectedDocuments.length} file{selectedDocuments.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.convertButton, isConverting && styles.buttonDisabled]}
            onPress={handleConvert}
            disabled={isConverting}
          >
            <Ionicons
              name="flash"
              size={20}
              color={colors.textInverse}
            />
            <Text style={styles.convertButtonText}>
              {conversionOptions.find(o => o.id === selectedOperation)?.title || 'Convert'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Modal */}
      <Modal visible={showProgressModal} transparent animationType="fade">
        <View style={styles.progressOverlay}>
          <View style={styles.progressContent}>
            <Animated.View style={[styles.progressIconWrapper, { transform: [{ rotate: spin }] }]}>
              <Ionicons name="sync" size={40} color={colors.primary} />
            </Animated.View>
            <Text style={styles.progressTitle}>Converting...</Text>
            <Text style={styles.progressSubtitle}>
              {conversionOptions.find(o => o.id === selectedOperation)?.title}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${conversionProgress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{conversionProgress}%</Text>
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
    paddingBottom: spacing.huge,
  },
  headerSection: {
    padding: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  heroIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: colors.primary,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  selectionHeader: {
    padding: spacing.xxl,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  changeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  operationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  operationBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  selectionSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  importIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  importTextWrapper: {
    flex: 1,
  },
  importTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  importSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  importText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  documentsHeader: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  documentCardSelected: {
    borderColor: colors.primary,
  },
  documentThumbnail: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
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
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  documentMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
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
    textAlign: 'center',
  },
  emptyImportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  emptyImportText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  bottomAction: {
    padding: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  selectionSummaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  convertButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    width: '80%',
  },
  progressIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  progressSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.md,
  },
});
