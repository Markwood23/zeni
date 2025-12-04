import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const STORAGE_DATA = [
  { label: 'Documents', size: 45.2, color: '#017DE9' },
  { label: 'Scans', size: 23.8, color: '#34C759' },
  { label: 'Faxes', size: 12.1, color: '#FF9500' },
  { label: 'Cache', size: 8.5, color: '#FF3B30' },
  { label: 'Other', size: 5.4, color: '#8E8E93' },
];

export default function StorageScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const totalUsed = STORAGE_DATA.reduce((sum, item) => sum + item.size, 0);
  const totalStorage = 200; // MB
  const usedPercentage = (totalUsed / totalStorage) * 100;

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will free up 8.5 MB of storage. Your documents will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Success', 'Cache cleared successfully') },
      ]
    );
  };

  const handleDeleteAllFaxes = () => {
    Alert.alert(
      'Delete All Faxes',
      'This will permanently delete all your sent and received faxes. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Success', 'All faxes deleted') },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Storage</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Storage Overview */}
        <View style={[styles.storageCard, { backgroundColor: colors.surface }]}>
          <View style={styles.storageHeader}>
            <View>
              <Text style={[styles.usedText, { color: colors.textPrimary }]}>{totalUsed.toFixed(1)} MB</Text>
              <Text style={[styles.totalText, { color: colors.textTertiary }]}>of {totalStorage} MB used</Text>
            </View>
            <View style={styles.percentCircle}>
              <Text style={[styles.percentText, { color: colors.primary }]}>{usedPercentage.toFixed(0)}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
            {STORAGE_DATA.map((item, index) => {
              const widthPercent = (item.size / totalStorage) * 100;
              return (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    { width: `${widthPercent}%`, backgroundColor: item.color },
                  ]}
                />
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {STORAGE_DATA.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Storage Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BREAKDOWN</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {STORAGE_DATA.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.breakdownItem, 
                { borderBottomColor: colors.borderLight },
                index === STORAGE_DATA.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
              <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.breakdownSize, { color: colors.textSecondary }]}>{item.size} MB</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MANAGE STORAGE</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: colors.borderLight }]}
            onPress={handleClearCache}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Clear Cache</Text>
              <Text style={[styles.actionDesc, { color: colors.textTertiary }]}>Free up 8.5 MB</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: colors.borderLight }]}
            onPress={handleDeleteAllFaxes}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF9500' + '15' }]}>
              <Ionicons name="document-text-outline" size={20} color="#FF9500" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Delete All Faxes</Text>
              <Text style={[styles.actionDesc, { color: colors.textTertiary }]}>Free up 12.1 MB</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Backup to Cloud</Text>
              <Text style={[styles.actionDesc, { color: colors.textTertiary }]}>Save your documents online</Text>
            </View>
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
  },
  storageCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  usedText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  totalText: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  percentCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#017DE9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressSegment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  legendLabel: {
    fontSize: typography.fontSize.xs,
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
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  breakdownSize: {
    fontSize: typography.fontSize.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: typography.fontSize.sm,
  },
});
