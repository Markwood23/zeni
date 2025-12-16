import React, { useMemo } from 'react';
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
import { useDocumentsStore, useShareStore, useSignaturesStore } from '../../store';

export default function StorageScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const { documents } = useDocumentsStore();
  const { shareJobs, clearAllShares } = useShareStore();
  const { signatures } = useSignaturesStore();

  // Calculate actual storage usage from store data
  const storageData = useMemo(() => {
    // Calculate document sizes (estimate ~500KB per document)
    const scannedDocs = documents.filter(d => d.type === 'scanned');
    const uploadedDocs = documents.filter(d => d.type === 'uploaded');
    
    const documentsSize = uploadedDocs.length * 0.5; // MB
    const scansSize = scannedDocs.length * 0.3; // MB
    const sharesSize = shareJobs.length * 0.2; // MB
    const signaturesSize = signatures.length * 0.01; // MB
    const cacheSize = 2.5; // Estimated cache size
    
    return [
      { label: 'Documents', size: Math.max(documentsSize, 0.1), color: colors.uploadedIcon, count: uploadedDocs.length },
      { label: 'Scans', size: Math.max(scansSize, 0.1), color: colors.scanIcon, count: scannedDocs.length },
      { label: 'Shares', size: Math.max(sharesSize, 0.1), color: colors.primary, count: shareJobs.length },
      { label: 'Signatures', size: Math.max(signaturesSize, 0.01), color: colors.accent, count: signatures.length },
      { label: 'Cache', size: cacheSize, color: colors.error, count: null },
    ];
  }, [documents, shareJobs, signatures, colors]);

  const totalUsed = storageData.reduce((sum, item) => sum + item.size, 0);
  const totalStorage = 200; // MB (simulated limit)
  const usedPercentage = (totalUsed / totalStorage) * 100;

  const handleClearCache = () => {
    const cacheItem = storageData.find(s => s.label === 'Cache');
    Alert.alert(
      'Clear Cache',
      `This will free up ${cacheItem?.size.toFixed(1)} MB of storage. Your documents will not be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Success', 'Cache cleared successfully') },
      ]
    );
  };

  const handleDeleteAllShares = () => {
    if (shareJobs.length === 0) {
      Alert.alert('No Shares', 'You have no share history to delete.');
      return;
    }
    
    const shareItem = storageData.find(s => s.label === 'Shares');
    Alert.alert(
      'Delete All Shares',
      `This will permanently delete all ${shareJobs.length} share records and free up ${shareItem?.size.toFixed(1)} MB. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            clearAllShares();
            Alert.alert('Success', 'All share history deleted');
          }
        },
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
            <View style={[styles.percentCircle, { borderColor: colors.primary }]}>
              <Text style={[styles.percentText, { color: colors.primary }]}>{usedPercentage.toFixed(0)}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
            {storageData.map((item, index) => {
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
            {storageData.map((item, index) => (
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
          {storageData.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.breakdownItem, 
                { borderBottomColor: colors.borderLight },
                index === storageData.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
              <View style={styles.breakdownInfo}>
                <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                {item.count !== null && (
                  <Text style={[styles.breakdownCount, { color: colors.textTertiary }]}>{item.count} items</Text>
                )}
              </View>
              <Text style={[styles.breakdownSize, { color: colors.textSecondary }]}>{item.size.toFixed(1)} MB</Text>
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
            onPress={handleDeleteAllShares}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="send-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Delete Share History</Text>
              <Text style={[styles.actionDesc, { color: colors.textTertiary }]}>Clear share records</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.uploadedIcon + '15' }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.uploadedIcon} />
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
    borderColor: '#017DE9', // Will be set inline with colors.primary
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
  breakdownInfo: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  breakdownCount: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
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
