import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsStore } from '../../store';

export default function PrivacySecurityScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const {
    biometricEnabled,
    autoLockEnabled,
    saveActivityHistory,
    analyticsEnabled,
    setSecuritySetting,
  } = useSettingsStore();
  
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
    
    if (compatible) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType(Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
      }
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value && biometricAvailable) {
      // Authenticate before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType}`,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
      });
      
      if (result.success) {
        setSecuritySetting('biometricEnabled', true);
        Alert.alert('Success', `${biometricType} enabled successfully`);
      } else {
        Alert.alert('Authentication Failed', 'Could not verify your identity');
      }
    } else if (value && !biometricAvailable) {
      Alert.alert(
        'Biometric Not Available',
        'Please set up Face ID or Touch ID in your device settings first.'
      );
    } else {
      setSecuritySetting('biometricEnabled', false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear App Data',
      'This will clear all cached data. Your documents and account will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Success', 'Cache cleared') },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data export will be prepared and sent to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Success', 'Data export requested. Check your email.') },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Security */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SECURITY</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="finger-print" size={22} color={biometricAvailable ? colors.primary : colors.textTertiary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{biometricType} Login</Text>
              <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                {biometricAvailable ? `Use ${biometricType} to unlock` : 'Not available on this device'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={biometricEnabled ? colors.primary : colors.textTertiary}
              disabled={!biometricAvailable}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.settingsIcon} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Auto-Lock</Text>
              <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>Lock when app goes to background</Text>
            </View>
            <Switch
              value={autoLockEnabled}
              onValueChange={(value) => setSecuritySetting('autoLockEnabled', value)}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={autoLockEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
        </View>

        {/* Privacy */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRIVACY</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="time-outline" size={22} color={colors.notificationIcon} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Save Activity History</Text>
              <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>Keep record of your actions</Text>
            </View>
            <Switch
              value={saveActivityHistory}
              onValueChange={(value) => setSecuritySetting('saveActivityHistory', value)}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={saveActivityHistory ? colors.primary : colors.textTertiary}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="analytics-outline" size={22} color={colors.info} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Analytics</Text>
              <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>Help improve Zeni</Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={(value) => setSecuritySetting('analyticsEnabled', value)}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={analyticsEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
        </View>

        {/* Data */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATA</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: colors.borderLight }]}
            onPress={handleExportData}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="download-outline" size={22} color={colors.uploadedIcon} />
            </View>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Export My Data</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomWidth: 0 }]}
            onPress={handleClearData}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </View>
            <Text style={[styles.actionText, { color: colors.error }]}>Clear App Cache</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LEGAL</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => Linking.openURL('https://zenigh.online/privacy.html')}
          >
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomWidth: 0 }]}
            onPress={() => Linking.openURL('https://zenigh.online/terms.html')}
          >
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Terms of Service</Text>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: typography.fontSize.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  actionText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
});
