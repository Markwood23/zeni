import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, Document } from '../../types';
import { useDocumentsStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Edit'>;

const editTools = [
  { id: 'text', icon: 'text' as keyof typeof Ionicons.glyphMap, title: 'Add Text', description: 'Insert text fields' },
  { id: 'sign', icon: 'pencil' as keyof typeof Ionicons.glyphMap, title: 'eSign', description: 'Add your signature' },
  { id: 'markup', icon: 'brush' as keyof typeof Ionicons.glyphMap, title: 'Mark Up', description: 'Draw & highlight' },
  { id: 'shapes', icon: 'shapes' as keyof typeof Ionicons.glyphMap, title: 'Shapes', description: 'Checkmarks, lines' },
];

export default function EditScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documents } = useDocumentsStore();

  const editableDocuments = documents.filter(
    (d) => d.mimeType === 'application/pdf' || d.mimeType.startsWith('image/')
  );

  const handleSelectDocument = (documentId: string) => {
    navigation.navigate('EditDocument', { documentId });
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        // Would create document and navigate to edit
        console.log('Selected file:', result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => handleSelectDocument(item.id)}
    >
      <View style={styles.documentThumbnail}>
        <Ionicons name="document-text" size={28} color={colors.primary} />
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.documentMeta}>{item.pagesCount} pages</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
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
        <Text style={styles.headerTitle}>Edit</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={editableDocuments}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Tools Overview */}
            <View style={styles.toolsSection}>
              <Text style={styles.sectionTitle}>Available Tools</Text>
              <View style={styles.toolsGrid}>
                {editTools.map((tool) => (
                  <View key={tool.id} style={styles.toolCard}>
                    <View style={styles.toolIcon}>
                      <Ionicons
                        name={tool.icon}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolDescription}>{tool.description}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Import Button */}
            <View style={styles.importSection}>
              <TouchableOpacity style={styles.importButton} onPress={handleImport}>
                <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                <Text style={styles.importText}>Import from Files</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Documents */}
            <View style={styles.documentsSection}>
              <Text style={styles.sectionTitle}>Select a Document to Edit</Text>
              {editableDocuments.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="folder-open-outline"
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.emptyText}>No documents to edit</Text>
                  <Text style={styles.emptySubtext}>
                    Scan or import a document first
                  </Text>
                </View>
              )}
            </View>
          </>
        }
      />
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
    paddingBottom: spacing.xxl,
  },
  toolsSection: {
    padding: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  toolCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  toolTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  toolDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  importSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: spacing.md,
  },
  importText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  documentsSection: {
    paddingHorizontal: spacing.xxl,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  documentThumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
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
});
