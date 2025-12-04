import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, EditTool } from '../../types';
import { useDocumentsStore, useActivityStore, generateId, useUserStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'EditDocument'>;
type RouteType = RouteProp<HomeStackParamList, 'EditDocument'>;

const tools: { id: EditTool; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: 'select', icon: 'move-outline', label: 'Select' },
  { id: 'text', icon: 'text-outline', label: 'Text' },
  { id: 'pen', icon: 'brush-outline', label: 'Pen' },
  { id: 'highlighter', icon: 'color-fill-outline', label: 'Highlight' },
  { id: 'signature', icon: 'pencil-outline', label: 'Sign' },
  { id: 'shapes', icon: 'shapes-outline', label: 'Shapes' },
];

export default function EditDocumentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documentId } = route.params;
  const { documents, addDocument } = useDocumentsStore();
  const { addActivity } = useActivityStore();
  const { user } = useUserStore();

  const [selectedTool, setSelectedTool] = useState<EditTool>('select');
  const [isSaving, setIsSaving] = useState(false);

  const document = documents.find((d) => d.id === documentId);

  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Document not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create edited version
      const newDocId = generateId();
      const baseName = document.name.replace(/\.[^/.]+$/, '');
      const newDocument = {
        ...document,
        id: newDocId,
        name: `${baseName}_edited.pdf`,
        type: 'edited' as const,
        sourceDocumentId: document.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addDocument(newDocument);

      addActivity({
        id: generateId(),
        userId: user?.id || 'guest',
        type: 'edit',
        documentId: newDocId,
        title: 'Document edited',
        description: `Edited "${document.name}"`,
        createdAt: new Date(),
      });

      Alert.alert('Success', 'Edited document saved!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('HomeScreen'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {document.name}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Document Canvas */}
      <View style={styles.canvasContainer}>
        {document.thumbnailPath ? (
          <Image
            source={{ uri: document.thumbnailPath }}
            style={styles.documentImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderCanvas}>
            <View style={styles.placeholderDoc}>
              <View style={styles.placeholderDocHeader}>
                  <Ionicons name="document-text" size={32} color={colors.textSecondary} />
                  <Text style={styles.placeholderDocTitle} numberOfLines={1}>{document.name}</Text>
                </View>
              <View style={styles.placeholderDocBody}>
                {[...Array(10)].map((_, i) => (
                  <View key={i} style={[styles.placeholderDocLine, { width: `${60 + Math.random() * 35}%`, backgroundColor: colors.surfaceSecondary }]} />
                ))}
              </View>
              <View style={styles.placeholderDocFooter}>
                <Text style={styles.placeholderFooterText}>Page 1 of {document.pagesCount}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Page Navigation */}
        <View style={styles.pageNav}>
          <TouchableOpacity style={styles.pageButton}>
            <Ionicons name="chevron-back" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <Text style={styles.pageText}>Page 1 of {document.pagesCount}</Text>
          <TouchableOpacity style={styles.pageButton}>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[
              styles.toolButton,
              selectedTool === tool.id && styles.toolButtonActive,
            ]}
            onPress={() => setSelectedTool(tool.id)}
          >
            <Ionicons
              name={tool.icon}
              size={24}
              color={selectedTool === tool.id ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.toolLabel,
                selectedTool === tool.id && styles.toolLabelActive,
              ]}
            >
              {tool.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tool Options */}
      {selectedTool === 'text' && (
        <View style={styles.toolOptions}>
          <Text style={styles.toolOptionsTitle}>Tap on document to add text</Text>
        </View>
      )}
      {selectedTool === 'signature' && (
        <View style={styles.toolOptions}>
          <TouchableOpacity style={styles.createSignatureButton}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.createSignatureText}>Create Signature</Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  canvasContainer: {
    flex: 1,
  },
  documentImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholderCanvas: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  placeholderDoc: {
    flex: 1,
    padding: spacing.xl,
  },
  placeholderDocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  placeholderDocTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholderDocBody: {
    flex: 1,
    gap: spacing.md,
  },
  placeholderDocLine: {
    height: 12,
    borderRadius: 6,
  },
  placeholderDocFooter: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  placeholderFooterText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  toolButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 56,
  },
  toolButtonActive: {
  },
  toolLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  toolLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  toolOptions: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'center',
  },
  toolOptionsTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  createSignatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  createSignatureText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
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
});
