import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
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

export default function AboutScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

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
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="scan-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Smart Scanning</Text>
              <Text style={[styles.featureDesc, { color: colors.textTertiary }]}>
                Auto-detect edges, enhance quality, and save as PDF
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderBottomColor: colors.borderLight }]}>
            <View style={[styles.featureIcon, { backgroundColor: '#34C759' + '15' }]}>
              <Ionicons name="send-outline" size={22} color="#34C759" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Fax Anywhere</Text>
              <Text style={[styles.featureDesc, { color: colors.textTertiary }]}>
                Send documents to fax machines worldwide
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderBottomColor: colors.borderLight }]}>
            <View style={[styles.featureIcon, { backgroundColor: '#FF9500' + '15' }]}>
              <Ionicons name="folder-outline" size={22} color="#FF9500" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Organization</Text>
              <Text style={[styles.featureDesc, { color: colors.textTertiary }]}>
                Custom folders with icons and colors
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.featureIcon, { backgroundColor: '#AF52DE' + '15' }]}>
              <Ionicons name="sparkles-outline" size={22} color="#AF52DE" />
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
            onPress={() => Linking.openURL('https://zeniapp.com')}
          >
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Website</Text>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => Linking.openURL('https://zeniapp.com/privacy')}
          >
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => Linking.openURL('https://zeniapp.com/terms')}
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
});
