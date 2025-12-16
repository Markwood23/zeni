import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const TEAM_MEMBERS = [
  { name: 'Kwame Asante', role: 'Founder & CEO' },
  { name: 'Ama Mensah', role: 'Lead Developer' },
  { name: 'Kofi Owusu', role: 'Product Designer' },
];

const CHANGELOG = [
  {
    version: '1.0.0',
    date: 'January 2025',
    changes: [
      'Initial release of Zeni',
      'Smart document scanning with edge detection',
      'PDF generation and editing',
      'Fax sending to worldwide destinations',
      'AI-powered document assistant',
      'Custom folder organization with icons',
      'Signature creation and management',
      'Student verification system',
      'Dark mode support',
    ],
  },
  {
    version: '0.9.0 (Beta)',
    date: 'December 2024',
    changes: [
      'Beta testing with select users',
      'Performance optimizations',
      'Bug fixes and stability improvements',
    ],
  },
];

export default function AboutScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [showChangelog, setShowChangelog] = useState(false);

  const handleRateApp = () => {
    Alert.alert(
      'Rate Zeni',
      'Would you like to rate Zeni on the App Store?',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Rate Now',
          onPress: () => {
            // In production, use StoreReview.requestReview() or open store link
            Linking.openURL('https://apps.apple.com/app/zeni/id123456789');
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out Zeni - Your Student Document Workspace! Download it for free: https://zenigh.online/download',
        title: 'Share Zeni',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share the app');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo & Version */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>Z</Text>
          </View>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>Zeni</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Your Student Document Workspace
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleRateApp}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="star" size={22} color={colors.warning} />
            </View>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Rate App</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleShareApp}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.shareIcon + '20' }]}>
              <Ionicons name="share" size={22} color={colors.shareIcon} />
            </View>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Share App</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowChangelog(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="document-text" size={22} color={colors.success} />
            </View>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Changelog</Text>
          </TouchableOpacity>
        </View>

        {/* Mission */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Our Mission</Text>
          <Text style={[styles.missionText, { color: colors.textSecondary }]}>
            Zeni empowers Ghanaian students with powerful document management tools. 
            We believe every student deserves access to professional-grade scanning, 
            faxing, and document organization capabilities.
          </Text>
        </View>

        {/* Features */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>KEY FEATURES</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={[styles.featureItem, { borderBottomColor: colors.borderLight }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.scanIcon + '15' }]}>
              <Ionicons name="scan-outline" size={22} color={colors.scanIcon} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Smart Scanning</Text>
              <Text style={[styles.featureDesc, { color: colors.textTertiary }]}>
                Auto-detect edges, enhance quality, and save as PDF
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderBottomColor: colors.borderLight }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.faxedIcon + '15' }]}>
              <Ionicons name="send-outline" size={22} color={colors.faxedIcon} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Fax Anywhere</Text>
              <Text style={[styles.featureDesc, { color: colors.textTertiary }]}>
                Send documents to fax machines worldwide
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderBottomColor: colors.borderLight }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.folderIcon + '15' }]}>
              <Ionicons name="folder-outline" size={22} color={colors.folderIcon} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Organization</Text>
              <Text style={[styles.featureDesc, { color: colors.textTertiary }]}>
                Custom folders with icons and colors
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.askAiIcon + '15' }]}>
              <Ionicons name="sparkles-outline" size={22} color={colors.askAiIcon} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>AI Assistant</Text>
              <Text style={[styles.featureDesc, { color: colors.textTertiary }]}>
                Summarize, translate, and analyze documents
              </Text>
            </View>
          </View>
        </View>

        {/* Team */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>THE TEAM</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {TEAM_MEMBERS.map((member, index) => (
            <View 
              key={index} 
              style={[
                styles.teamItem, 
                { borderBottomColor: colors.borderLight },
                index === TEAM_MEMBERS.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.borderLight }]}>
                <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.teamInfo}>
                <Text style={[styles.teamName, { color: colors.textPrimary }]}>{member.name}</Text>
                <Text style={[styles.teamRole, { color: colors.textTertiary }]}>{member.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Links */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LINKS</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.linkItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => Linking.openURL('https://zenigh.online')}
          >
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Website</Text>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => Linking.openURL('https://zenigh.online/privacy.html')}
          >
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => Linking.openURL('https://zenigh.online/terms.html')}
          >
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Terms of Service</Text>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkItem, { borderBottomWidth: 0 }]}
            onPress={() => Linking.openURL('https://github.com/zeniapp')}
          >
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Open Source Licenses</Text>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Made with ❤️ in Ghana
          </Text>
          <Text style={[styles.copyright, { color: colors.textTertiary }]}>
            © 2025 Zeni. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* Changelog Modal */}
      <Modal
        visible={showChangelog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangelog(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Changelog</Text>
            <TouchableOpacity 
              onPress={() => setShowChangelog(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {CHANGELOG.map((release, index) => (
              <View key={index} style={[styles.releaseItem, { backgroundColor: colors.surface }]}>
                <View style={styles.releaseHeader}>
                  <View style={[styles.versionTag, { backgroundColor: colors.primary }]}>
                    <Text style={styles.versionTagText}>{release.version}</Text>
                  </View>
                  <Text style={[styles.releaseDate, { color: colors.textSecondary }]}>{release.date}</Text>
                </View>
                {release.changes.map((change, changeIndex) => (
                  <View key={changeIndex} style={styles.changeItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={[styles.changeText, { color: colors.textSecondary }]}>{change}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
  },
  appName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  tagline: {
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
  },
  versionBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  versionText: {
    fontSize: typography.fontSize.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  section: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  missionText: {
    fontSize: typography.fontSize.md,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  featureDesc: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  teamRole: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  linkText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  footerText: {
    fontSize: typography.fontSize.md,
  },
  copyright: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  releaseItem: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  releaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  versionTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  versionTagText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  releaseDate: {
    fontSize: typography.fontSize.sm,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  changeText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
});
