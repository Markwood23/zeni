import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface Signature {
  id: string;
  name: string;
  createdAt: string;
}

export default function SignaturesScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [signatures, setSignatures] = useState<Signature[]>([
    { id: '1', name: 'Primary Signature', createdAt: 'Jan 15, 2025' },
    { id: '2', name: 'Initials', createdAt: 'Jan 20, 2025' },
  ]);

  const handleAddSignature = () => {
    Alert.alert(
      'Add Signature',
      'Choose how you want to create your signature',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Draw', onPress: () => Alert.alert('Coming Soon', 'Signature drawing will be available soon') },
        { text: 'Type', onPress: () => Alert.alert('Coming Soon', 'Typed signature will be available soon') },
      ]
    );
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
          onPress: () => setSignatures(prev => prev.filter(s => s.id !== id))
        },
      ]
    );
  };

  const handleSetDefault = (id: string) => {
    // Reorder to put selected at top
    setSignatures(prev => {
      const selected = prev.find(s => s.id === id);
      const others = prev.filter(s => s.id !== id);
      return selected ? [selected, ...others] : prev;
    });
    Alert.alert('Success', 'Default signature updated');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Signatures</Text>
        <TouchableOpacity onPress={handleAddSignature} style={styles.addButton}>
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
            signatures.map((sig, index) => (
              <View 
                key={sig.id} 
                style={[
                  styles.signatureItem, 
                  { borderBottomColor: colors.borderLight },
                  index === signatures.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={[styles.signaturePreview, { backgroundColor: colors.borderLight }]}>
                  <Ionicons name="pencil" size={24} color={colors.textTertiary} />
                </View>
                <View style={styles.signatureInfo}>
                  <View style={styles.signatureHeader}>
                    <Text style={[styles.signatureName, { color: colors.textPrimary }]}>{sig.name}</Text>
                    {index === 0 && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.signatureDate, { color: colors.textTertiary }]}>Created {sig.createdAt}</Text>
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
          onPress={handleAddSignature}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Create New Signature</Text>
        </TouchableOpacity>

        {/* Signature Options */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SIGNATURE OPTIONS</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={[styles.optionItem, { borderBottomColor: colors.borderLight }]}>
            <Ionicons name="text-outline" size={22} color={colors.primary} />
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>Type Signature</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionItem, { borderBottomColor: colors.borderLight }]}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>Draw Signature</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionItem, { borderBottomWidth: 0 }]}>
            <Ionicons name="image-outline" size={22} color={colors.primary} />
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>Upload Image</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    width: 60,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
    marginTop: 2,
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
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
});
