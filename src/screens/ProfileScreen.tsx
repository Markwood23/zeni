import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography, shadows } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useUserStore, useDocumentsStore } from '../store';
import type { ProfileStackParamList, Document } from '../types';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const { user, logout, setOnboarded } = useUserStore();
  const { documents } = useDocumentsStore();
  const { colors, isDark, themeMode, setThemeMode, primaryColor, hasSeenColorPicker, setHasSeenColorPicker } = useTheme();

  // Show color picker alert for new users
  useEffect(() => {
    if (!hasSeenColorPicker) {
      setTimeout(() => {
        Alert.alert(
          '🎨 Personalize Your App',
          'You can customize Zeni with your favorite accent color! Head to Appearance settings to make it yours.',
          [
            { text: 'Maybe Later', style: 'cancel', onPress: () => setHasSeenColorPicker(true) },
            { 
              text: 'Customize Now', 
              onPress: () => {
                setHasSeenColorPicker(true);
                navigation.navigate('Appearance');
              }
            },
          ]
        );
      }, 1000);
    }
  }, [hasSeenColorPicker]);

  const scannedCount = documents.filter((d: Document) => d.type === 'scanned').length;
  const editedCount = documents.filter((d: Document) => d.type === 'edited').length;
  const convertedCount = documents.filter((d: Document) => d.type === 'converted').length;

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'account',
      icon: 'person-outline',
      title: 'Account Settings',
      subtitle: 'Edit profile, change password',
      screen: 'AccountSettings' as keyof ProfileStackParamList,
      color: colors.profileIcon,
    },
    {
      id: 'storage',
      icon: 'cloud-outline',
      title: 'Storage & Sync',
      subtitle: 'Manage cloud storage',
      screen: 'Storage' as keyof ProfileStackParamList,
      color: colors.uploadedIcon,
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      screen: 'Notifications' as keyof ProfileStackParamList,
      color: colors.notificationIcon,
    },
    {
      id: 'signatures',
      icon: 'pencil-outline',
      title: 'My Signatures',
      subtitle: 'Manage saved signatures',
      screen: 'Signatures' as keyof ProfileStackParamList,
      color: colors.editIcon,
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      title: 'Privacy & Security',
      subtitle: 'Data protection settings',
      screen: 'PrivacySecurity' as keyof ProfileStackParamList,
      color: colors.success,
    },
    {
      id: 'help',
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'FAQs, contact us',
      screen: 'HelpSupport' as keyof ProfileStackParamList,
      color: colors.askAiIcon,
    },
    {
      id: 'about',
      icon: 'information-circle-outline',
      title: 'About Zeni',
      subtitle: 'Version 1.0.0',
      screen: 'About' as keyof ProfileStackParamList,
      color: colors.settingsIcon,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
            <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
              <Ionicons name="camera" size={14} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {user?.firstName || 'User'}
              </Text>
              {user?.verification?.status === 'verified' && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                </View>
              )}
            </View>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {user?.email || 'user@example.com'}
            </Text>
            {user?.school && (
              <View style={[styles.schoolBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="school" size={12} color={colors.primary} />
                <Text style={[styles.schoolText, { color: colors.primary }]}>{user.school}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Student Verification Banner */}
        {user?.verification?.status === 'pending' ? (
          <TouchableOpacity 
            style={[styles.verificationBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }]}
            onPress={() => navigation.navigate('StudentVerification')}
            activeOpacity={0.8}
          >
            <View style={[styles.verificationIcon, { backgroundColor: colors.warning }]}>
              <Ionicons name="mail-unread" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.verificationContent}>
              <Text style={[styles.verificationTitle, { color: colors.textPrimary }]}>
                Verify your email
              </Text>
              <Text style={[styles.verificationSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                Check {user?.verification?.verifiedEmail} to unlock premium
              </Text>
            </View>
            <View style={[styles.verificationArrow, { backgroundColor: colors.warning }]}>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) : user?.verification?.status !== 'verified' && (
          <TouchableOpacity 
            style={[styles.verificationBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}
            onPress={() => navigation.navigate('StudentVerification')}
            activeOpacity={0.8}
          >
            <View style={[styles.verificationIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="school" size={20} color={colors.textInverse} />
            </View>
            <View style={styles.verificationContent}>
              <Text style={[styles.verificationTitle, { color: colors.textPrimary }]}>
                Are you a student?
              </Text>
              <Text style={[styles.verificationSubtitle, { color: colors.textSecondary }]}>
                Verify with .edu email for free premium
              </Text>
            </View>
            <View style={[styles.verificationArrow, { backgroundColor: colors.primary }]}>
              <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
            </View>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{scannedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Scanned</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{editedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Edited</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{convertedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Converted</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{documents.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total</Text>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={[styles.themeSection, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={styles.themeRow} 
            onPress={() => navigation.navigate('Appearance')}
          >
            <View style={styles.menuIcon}>
              <Ionicons
                name="color-palette-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.themeContent}>
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Appearance</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textTertiary }]}>Theme & accent color</Text>
            </View>
            <View style={styles.colorPreview}>
              <View style={[styles.colorDot, { backgroundColor: primaryColor }]} />
              <View style={styles.themeToggle}>
                <View
                  style={[
                    styles.themeOption,
                    !isDark && styles.themeOptionActive,
                    { backgroundColor: !isDark ? colors.primary : colors.surfaceSecondary }
                  ]}
                >
                  <Ionicons name="sunny" size={14} color={!isDark ? colors.textInverse : colors.textTertiary} />
                </View>
                <View
                  style={[
                    styles.themeOption,
                    isDark && styles.themeOptionActive,
                    { backgroundColor: isDark ? colors.primary : colors.surfaceSecondary }
                  ]}
                >
                  <Ionicons name="moon" size={14} color={isDark ? colors.textInverse : colors.textTertiary} />
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                { borderBottomColor: colors.borderLight },
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuIcon}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={item.color}
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textTertiary }]}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.error + '30' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>Zeni v1.0.0</Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>Made with ❤️ for students</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  profileName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmail: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  schoolText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  verificationTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  verificationSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  verificationArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xxl,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  themeSection: {
    marginTop: spacing.xxl,
    marginHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  themeContent: {
    flex: 1,
  },
  themeToggle: {
    flexDirection: 'row',
    gap: 2,
  },
  themeOption: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeOptionActive: {},
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  menuSection: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  menuSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xxl,
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
});
