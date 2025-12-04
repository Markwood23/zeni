import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'How do I scan a document?',
    answer: 'Tap the Scan button on the home screen, position your document within the frame, and tap capture. You can adjust the corners and apply filters before saving.',
  },
  {
    question: 'How do I send a fax?',
    answer: 'Go to the Fax section, select or scan a document, enter the recipient fax number with country code, and tap Send. Credits are required for sending faxes.',
  },
  {
    question: 'How do I create a folder?',
    answer: 'In the Documents tab, tap the folder icon in the top right, then tap "Create New Folder". You can customize the folder name, icon, and color.',
  },
  {
    question: 'How do I sign a document?',
    answer: 'Open any document, tap Edit, then select the Signature tool. You can draw, type, or upload a signature to add to your document.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes! All your documents are encrypted and stored securely. We never share your data with third parties. You can also enable biometric login for extra security.',
  },
];

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const filteredFAQs = FAQ_DATA.filter(
    faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@zeniapp.com?subject=Zeni Support Request');
  };

  const handleOpenDocs = () => {
    Linking.openURL('https://docs.zeniapp.com');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search help articles..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={handleContactSupport}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="mail-outline" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Email Support</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={handleOpenDocs}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#34C759' + '15' }]}>
              <Ionicons name="book-outline" size={24} color="#34C759" />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Documentation</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {filteredFAQs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No results found</Text>
            </View>
          ) : (
            filteredFAQs.map((faq, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.faqItem,
                  { borderBottomColor: colors.borderLight },
                  index === filteredFAQs.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, { color: colors.textPrimary }]}>{faq.question}</Text>
                  <Ionicons 
                    name={expandedFAQ === index ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textTertiary} 
                  />
                </View>
                {expandedFAQ === index && (
                  <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Contact Options */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GET IN TOUCH</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.contactItem, { borderBottomColor: colors.borderLight }]}
            onPress={handleContactSupport}
          >
            <View style={[styles.contactIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="mail-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Email Us</Text>
              <Text style={[styles.contactDesc, { color: colors.textTertiary }]}>support@zeniapp.com</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.contactItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => Linking.openURL('https://twitter.com/zeniapp')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#1DA1F2' + '15' }]}>
              <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Twitter</Text>
              <Text style={[styles.contactDesc, { color: colors.textTertiary }]}>@zeniapp</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.contactItem, { borderBottomWidth: 0 }]}
            onPress={() => Linking.openURL('https://zeniapp.com/feedback')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#FF9500' + '15' }]}>
              <Ionicons name="chatbubble-outline" size={22} color="#FF9500" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Send Feedback</Text>
              <Text style={[styles.contactDesc, { color: colors.textTertiary }]}>We'd love to hear from you</Text>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    paddingVertical: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
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
  emptyText: {
    fontSize: typography.fontSize.md,
    marginTop: spacing.md,
  },
  faqItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  faqAnswer: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  contactDesc: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
});
