import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
}

const conversionOptions: ConversionOption[] = [
  {
    id: 'toPdf',
    icon: 'document',
    title: 'Convert to PDF',
    description: 'DOCX, PPTX, Images → PDF',
    fromTypes: ['docx', 'pptx', 'jpg', 'png'],
    toType: 'pdf',
  },
  {
    id: 'toImage',
    icon: 'image',
    title: 'PDF to Images',
    description: 'Extract pages as JPG/PNG',
    fromTypes: ['pdf'],
    toType: 'jpg',
  },
  {
    id: 'merge',
    icon: 'git-merge',
    title: 'Merge PDFs',
    description: 'Combine multiple PDFs into one',
    fromTypes: ['pdf'],
    toType: 'pdf',
  },
  {
    id: 'split',
    icon: 'git-branch',
    title: 'Split PDF',
    description: 'Extract specific pages',
    fromTypes: ['pdf'],
    toType: 'pdf',
  },
  {
    id: 'compress',
    icon: 'contract',
    title: 'Compress PDF',
    description: 'Reduce file size for upload',
    fromTypes: ['pdf'],
    toType: 'pdf',
  },
];

export default function ConvertScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documents, addDocument } = useDocumentsStore();
  const { addActivity } = useActivityStore();
  const { user } = useUserStore();

  const [selectedOperation, setSelectedOperation] = useState<ConvertOperation | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const pdfDocuments = documents.filter((d) => d.mimeType === 'application/pdf');

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
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
        multiple: selectedOperation === 'merge',
      });

      if (!result.canceled && result.assets.length > 0) {
        // Process imported files
        Alert.alert('Files Selected', `${result.assets.length} file(s) ready for conversion`);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleConvert = async () => {
    if (!selectedOperation || selectedDocuments.length === 0) return;

    setIsConverting(true);
    try {
      // Simulate conversion
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const sourceDoc = documents.find((d) => d.id === selectedDocuments[0]);
      if (!sourceDoc) throw new Error('Document not found');

      const newDocId = generateId();
      const baseName = sourceDoc.name.replace(/\.[^/.]+$/, '');
      let newName = baseName;

      switch (selectedOperation) {
        case 'toPdf':
          newName = `${baseName}.pdf`;
          break;
        case 'toImage':
          newName = `${baseName}_page1.jpg`;
          break;
        case 'merge':
          newName = `Merged_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'split':
          newName = `${baseName}_extracted.pdf`;
          break;
        case 'compress':
          newName = `${baseName}_compressed.pdf`;
          break;
      }

      const newDocument = {
        id: newDocId,
        userId: user?.id || 'guest',
        name: newName,
        type: 'converted' as const,
        filePath: sourceDoc.filePath,
        thumbnailPath: sourceDoc.thumbnailPath,
        pagesCount: sourceDoc.pagesCount,
        fileSize: Math.floor(sourceDoc.fileSize * 0.7), // Simulated compression
        mimeType: 'application/pdf',
        sourceDocumentId: sourceDoc.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addDocument(newDocument);

      addActivity({
        id: generateId(),
        userId: user?.id || 'guest',
        type: 'convert',
        documentId: newDocId,
        title: `Converted document`,
        description: `${selectedOperation}: ${newName}`,
        createdAt: new Date(),
      });

      Alert.alert('Success', 'Document converted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setSelectedOperation(null);
            setSelectedDocuments([]);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const renderOptionCard = ({ item }: { item: ConversionOption }) => (
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
          selectedOperation === item.id && styles.optionIconSelected,
        ]}
      >
        <Ionicons
          name={item.icon}
          size={28}
          color={selectedOperation === item.id ? colors.primary : colors.textSecondary}
        />
      </View>
      <View style={styles.optionInfo}>
        <Text style={styles.optionTitle}>{item.title}</Text>
        <Text style={styles.optionDescription}>{item.description}</Text>
      </View>
      {selectedOperation === item.id ? (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={[
        styles.documentCard,
        selectedDocuments.includes(item.id) && styles.documentCardSelected,
      ]}
      onPress={() => handleSelectDocument(item.id)}
    >
      <View style={styles.documentThumbnail}>
        <Ionicons name="document-text" size={24} color={colors.primary} />
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.documentMeta}>{item.pagesCount} pages</Text>
      </View>
      {selectedDocuments.includes(item.id) && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark" size={16} color={colors.textInverse} />
        </View>
      )}
    </TouchableOpacity>
  );

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
          data={pdfDocuments}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.selectionHeader}>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => setSelectedOperation(null)}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={styles.changeText}>Change Operation</Text>
              </TouchableOpacity>
              <Text style={styles.selectionTitle}>
                {conversionOptions.find((o) => o.id === selectedOperation)?.title}
              </Text>
              <Text style={styles.selectionSubtitle}>
                {selectedOperation === 'merge'
                  ? 'Select multiple documents'
                  : 'Select a document'}
              </Text>
              <TouchableOpacity style={styles.importButton} onPress={handleImport}>
                <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                <Text style={styles.importText}>Import from Files</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No PDF documents available</Text>
              <Text style={styles.emptySubtext}>Import a document to convert</Text>
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
              <Text style={styles.sectionTitle}>Choose Conversion Type</Text>
            </View>
          }
        />
      )}

      {/* Convert Button */}
      {selectedOperation && selectedDocuments.length > 0 && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[styles.convertButton, isConverting && styles.buttonDisabled]}
            onPress={handleConvert}
            disabled={isConverting}
          >
            <Ionicons
              name={isConverting ? 'hourglass-outline' : 'swap-horizontal'}
              size={20}
              color={colors.textInverse}
            />
            <Text style={styles.convertButtonText}>
              {isConverting ? 'Converting...' : `Convert ${selectedDocuments.length} file(s)`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  optionIconSelected: {
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
  selectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  selectionSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  importText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
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
    backgroundColor: colors.surfaceSecondary,
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
  bottomAction: {
    padding: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
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
});
