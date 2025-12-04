import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme, PRESET_COLORS, DEFAULT_PRIMARY_COLOR } from '../../context/ThemeContext';

export default function AppearanceScreen() {
  const navigation = useNavigation();
  const { colors, isDark, themeMode, setThemeMode, primaryColor, setPrimaryColor } = useTheme();

  const themeOptions = [
    { key: 'light', label: 'Light', icon: 'sunny-outline' as const },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' as const },
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Appearance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Theme Mode */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>THEME</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {themeOptions.map((option, index) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.themeOption,
                { borderBottomColor: colors.borderLight },
                index === themeOptions.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => setThemeMode(option.key as 'light' | 'dark' | 'system')}
            >
              <View style={[styles.themeIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name={option.icon} size={22} color={colors.textPrimary} />
              </View>
              <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>{option.label}</Text>
              {themeMode === option.key && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Accent Color */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCENT COLOR</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.colorInfo}>
            <Text style={[styles.colorInfoText, { color: colors.textSecondary }]}>
              Choose a color to personalize buttons, icons, and highlights throughout the app.
            </Text>
          </View>
          
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((preset) => (
              <TouchableOpacity
                key={preset.color}
                style={[
                  styles.colorButton,
                  { borderColor: primaryColor === preset.color ? colors.textPrimary : 'transparent' },
                ]}
                onPress={() => setPrimaryColor(preset.color)}
              >
                <View style={[styles.colorCircle, { backgroundColor: preset.color }]}>
                  {primaryColor === preset.color && (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[styles.colorName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREVIEW</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.previewContainer}>
            <View style={styles.previewRow}>
              <TouchableOpacity style={[styles.previewButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.previewButtonText}>Primary Button</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.previewOutlineButton, { borderColor: colors.primary }]}>
                <Text style={[styles.previewOutlineButtonText, { color: colors.primary }]}>Outline</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.previewRow}>
              <View style={[styles.previewChip, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="document" size={16} color={colors.primary} />
                <Text style={[styles.previewChipText, { color: colors.primary }]}>Document</Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.previewBadgeText}>3</Text>
              </View>
              <Ionicons name="heart" size={24} color={colors.primary} />
              <Ionicons name="star" size={24} color={colors.primary} />
            </View>

            {/* Icon Colors Preview */}
            <View style={[styles.iconPreviewSection, { borderTopColor: colors.borderLight }]}>
              <Text style={[styles.iconPreviewTitle, { color: colors.textSecondary }]}>Action Icons</Text>
              <View style={styles.iconPreviewRow}>
                <View style={styles.iconPreviewItem}>
                  <View style={[styles.iconPreviewCircle, { backgroundColor: colors.scanIcon + '15' }]}>
                    <Ionicons name="scan" size={22} color={colors.scanIcon} />
                  </View>
                  <Text style={[styles.iconPreviewLabel, { color: colors.textTertiary }]}>Scan</Text>
                </View>
                <View style={styles.iconPreviewItem}>
                  <View style={[styles.iconPreviewCircle, { backgroundColor: colors.editIcon + '15' }]}>
                    <Ionicons name="create" size={22} color={colors.editIcon} />
                  </View>
                  <Text style={[styles.iconPreviewLabel, { color: colors.textTertiary }]}>Edit</Text>
                </View>
                <View style={styles.iconPreviewItem}>
                  <View style={[styles.iconPreviewCircle, { backgroundColor: colors.convertIcon + '15' }]}>
                    <Ionicons name="swap-horizontal" size={22} color={colors.convertIcon} />
                  </View>
                  <Text style={[styles.iconPreviewLabel, { color: colors.textTertiary }]}>Convert</Text>
                </View>
                <View style={styles.iconPreviewItem}>
                  <View style={[styles.iconPreviewCircle, { backgroundColor: colors.askAiIcon + '15' }]}>
                    <Ionicons name="sparkles" size={22} color={colors.askAiIcon} />
                  </View>
                  <Text style={[styles.iconPreviewLabel, { color: colors.textTertiary }]}>AI</Text>
                </View>
              </View>
            </View>

            <View style={[styles.previewCard, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="folder" size={28} color={colors.primary} />
              <Text style={[styles.previewCardTitle, { color: colors.textPrimary }]}>Sample Folder</Text>
              <Text style={[styles.previewCardSubtitle, { color: colors.textSecondary }]}>5 Files</Text>
            </View>
          </View>
        </View>

        {/* Reset */}
        <TouchableOpacity
          style={[styles.resetButton, { borderColor: colors.border }]}
          onPress={() => setPrimaryColor(DEFAULT_PRIMARY_COLOR)}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>Reset to Default</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  section: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  themeIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  themeLabel: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  colorInfo: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  colorInfoText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  colorButton: {
    width: '23%',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  colorName: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  previewContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  previewOutlineButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  previewOutlineButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    gap: spacing.xs,
  },
  previewChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  previewBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  previewCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'flex-start',
  },
  previewCardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  previewCardSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  iconPreviewSection: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
  },
  iconPreviewTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  iconPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconPreviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconPreviewCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconPreviewLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  resetButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
});
