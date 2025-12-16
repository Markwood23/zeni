import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path, G } from 'react-native-svg';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useSignaturesStore, generateId } from '../../store';
import SignatureCanvas, { SignatureData } from '../../components/SignatureCanvas';

export default function SignaturesScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const { signatures, addSignature, deleteSignature, setDefaultSignature } = useSignaturesStore();
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasInitialTab, setCanvasInitialTab] = useState<'draw' | 'type' | 'upload'>('draw');

  const openCanvasWithTab = (tab: 'draw' | 'type' | 'upload') => {
    setCanvasInitialTab(tab);
    setShowCanvas(true);
  };

  const handleSaveSignature = (signatureData: SignatureData) => {
    addSignature({
      id: signatureData.id || generateId(),
      name: signatureData.name,
      type: signatureData.type,
      data: signatureData.data,
      createdAt: signatureData.createdAt || new Date(),
    });
    setShowCanvas(false);
    Alert.alert('Success', 'Signature saved successfully!');
  };

  const handleDeleteSignature = (id: string, name: string) => {
    Alert.alert(
      'Delete Signature',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteSignature(id)
        },
      ]
    );
  };

  const handleSetDefault = (id: string) => {
    setDefaultSignature(id);
    Alert.alert('Success', 'Default signature updated');
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSignatureIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'drawn': return 'create';
      case 'typed': return 'text';
      case 'image': return 'image';
      default: return 'pencil';
    }
  };

  // Render signature preview based on type
  const renderSignaturePreview = (sig: { type: string; data: string }) => {
    try {
      if (sig.type === 'image') {
        return (
          <Image 
            source={{ uri: sig.data }} 
            style={styles.signatureImage}
            resizeMode="contain"
          />
        );
      } else if (sig.type === 'drawn') {
        const drawData = JSON.parse(sig.data);
        const { paths, color = '#000000', width = 2 } = drawData;
        return (
          <Svg width="100%" height="100%" viewBox="0 0 280 200" style={styles.signatureSvg}>
            <G>
              {paths && paths.map((path: string, index: number) => (
                <Path
                  key={index}
                  d={path}
                  stroke={color}
                  strokeWidth={width}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </G>
          </Svg>
        );
      } else if (sig.type === 'typed') {
        const typedData = JSON.parse(sig.data);
        const { text, font } = typedData;
        const fontStyles: { [key: string]: { fontStyle: 'normal' | 'italic'; fontWeight: '300' | '400' | '600' } } = {
          script: { fontStyle: 'italic', fontWeight: '300' },
          formal: { fontStyle: 'normal', fontWeight: '600' },
          casual: { fontStyle: 'normal', fontWeight: '400' },
        };
        const style = fontStyles[font] || fontStyles.casual;
        return (
          <Text 
            style={[
              styles.signaturePreviewText, 
              { color: colors.textPrimary, ...style }
            ]}
            numberOfLines={1}
          >
            {text}
          </Text>
        );
      }
    } catch (e) {
      // Fallback for unparseable data
      return (
        <Ionicons name="document-text-outline" size={24} color={colors.textTertiary} />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Signatures</Text>
        <TouchableOpacity onPress={() => setShowCanvas(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Your signatures are stored securely and can be used to sign documents.
          </Text>
        </View>

        {/* Signatures List */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>YOUR SIGNATURES</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {signatures.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="create-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Signatures</Text>
              <Text style={[styles.emptyDesc, { color: colors.textTertiary }]}>
                Add a signature to sign documents quickly
              </Text>
            </View>
          ) : (
            signatures.map((sig: { id: string; name: string; type: string; data: string; isDefault: boolean; createdAt: Date }, index: number) => (
              <View 
                key={sig.id} 
                style={[
                  styles.signatureItem, 
                  { borderBottomColor: colors.borderLight },
                  index === signatures.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={[styles.signaturePreview, { backgroundColor: colors.background }]}>
                  {renderSignaturePreview(sig)}
                </View>
                <View style={styles.signatureInfo}>
                  <View style={styles.signatureHeader}>
                    <Text style={[styles.signatureName, { color: colors.textPrimary }]}>{sig.name}</Text>
                    {sig.isDefault && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.signatureMeta}>
                    <Ionicons name={getSignatureIcon(sig.type) as any} size={12} color={colors.textTertiary} />
                    <Text style={[styles.signatureDate, { color: colors.textTertiary }]}>
                      {sig.type.charAt(0).toUpperCase() + sig.type.slice(1)} • {formatDate(sig.createdAt)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.moreButton}
                  onPress={() => {
                    Alert.alert(
                      sig.name,
                      'Choose an action',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Set as Default', onPress: () => handleSetDefault(sig.id) },
                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteSignature(sig.id, sig.name) },
                      ]
                    );
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Add Button */}
        <TouchableOpacity 
          style={[styles.addSignatureButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCanvas(true)}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Create New Signature</Text>
        </TouchableOpacity>

        {/* Signature Options */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CREATE SIGNATURE</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.optionItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => openCanvasWithTab('type')}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.editIcon + '15' }]}>
              <Ionicons name="text-outline" size={22} color={colors.editIcon} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Type Signature</Text>
              <Text style={[styles.optionDesc, { color: colors.textTertiary }]}>Type your name and choose a font</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => openCanvasWithTab('draw')}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="create-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Draw Signature</Text>
              <Text style={[styles.optionDesc, { color: colors.textTertiary }]}>Draw with your finger or stylus</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionItem, { borderBottomWidth: 0 }]}
            onPress={() => openCanvasWithTab('upload')}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="image-outline" size={22} color={colors.success} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Upload Image</Text>
              <Text style={[styles.optionDesc, { color: colors.textTertiary }]}>Use an existing signature image</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Signature Canvas */}
      <SignatureCanvas
        visible={showCanvas}
        onClose={() => setShowCanvas(false)}
        onSave={handleSaveSignature}
        initialTab={canvasInitialTab}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  addButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  section: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyDesc: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  signatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  signaturePreview: {
    width: 70,
    height: 45,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  signatureSvg: {
    backgroundColor: 'transparent',
  },
  signaturePreviewText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  signatureInfo: {
    flex: 1,
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signatureName: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  signatureMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  defaultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  defaultText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  signatureDate: {
    fontSize: typography.fontSize.sm,
  },
  moreButton: {
    padding: spacing.sm,
  },
  addSignatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  optionDesc: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
});
