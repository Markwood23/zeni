import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import ThemedTextInput from '../../components/ThemedTextInput';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface GuideItem {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  steps: string[];
}

const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Tap "Get Started" on the welcome screen, enter your phone number or email, create a password, and fill in your profile details including your name and school information.',
  },
  {
    category: 'Getting Started',
    question: 'Is Zeni free to use?',
    answer: 'Yes! Zeni is free for basic features including document scanning, editing, and organizing. Premium features like unlimited faxing and cloud storage require a subscription.',
  },
  // Scanning
  {
    category: 'Scanning',
    question: 'How do I scan a document?',
    answer: 'Tap the Scan button on the home screen, position your document within the frame, and tap capture. You can adjust the corners and apply filters (Auto, B&W, Grayscale) before saving.',
  },
  {
    category: 'Scanning',
    question: 'How do I scan multiple pages?',
    answer: 'After scanning the first page, tap "Add Page" to continue scanning. When done, tap "Save" to combine all pages into a single document.',
  },
  {
    category: 'Scanning',
    question: 'What filters are available for scanned documents?',
    answer: 'Zeni offers four scan filters: Original (no changes), Auto (automatic enhancement), Black & White (high contrast), and Grayscale (removes color but keeps tones).',
  },
  // Editing
  {
    category: 'Editing',
    question: 'How do I add my signature to a document?',
    answer: 'Open any document, tap Edit, then select the Signature tool. You can draw your signature, type it with a custom font, or upload an image of your signature.',
  },
  {
    category: 'Editing',
    question: 'Can I add text to my documents?',
    answer: 'Yes! In the Edit mode, select the Text tool to add text boxes anywhere on your document. You can customize font, size, color, and alignment.',
  },
  {
    category: 'Editing',
    question: 'How do I annotate a document?',
    answer: 'Use the Pen tool for freehand annotations, Highlighter for emphasis, or Shapes to add rectangles, circles, and arrows. All annotations are saved automatically.',
  },
  // Faxing
  {
    category: 'Faxing',
    question: 'How do I send a fax?',
    answer: 'Go to the Fax section, select or scan a document, enter the recipient fax number with country code (e.g., +1 for USA), add an optional cover page, and tap Send.',
  },
  {
    category: 'Faxing',
    question: 'How much does it cost to send a fax?',
    answer: 'Fax credits depend on the destination. Domestic faxes (within Ghana) use 1 credit, international faxes use 2-5 credits depending on the country. Check pricing in the app.',
  },
  {
    category: 'Faxing',
    question: 'How do I know if my fax was delivered?',
    answer: 'You\'ll receive a notification when your fax is delivered or if delivery fails. You can also check the status in the Fax History section.',
  },
  // Organization
  {
    category: 'Organization',
    question: 'How do I create a folder?',
    answer: 'In the Documents tab, tap "New Folder" at the top. Name your folder and customize its icon (emoji) and background color to make it easy to identify.',
  },
  {
    category: 'Organization',
    question: 'How do I add documents to a folder?',
    answer: 'Open a folder, tap "Add Documents", then select the documents you want to add. You can also use the "Add to Folder" option from any document\'s action menu.',
  },
  {
    category: 'Organization',
    question: 'Can I customize folder appearance?',
    answer: 'Yes! Tap on a folder, then tap the folder icon in the header. You can choose from 48 different emoji icons and 12 background colors.',
  },
  // AI Features
  {
    category: 'AI Assistant',
    question: 'What can Ask AI do?',
    answer: 'Ask AI can summarize documents, explain complex content, extract key information, create study notes, draft emails, answer questions about your documents, and more.',
  },
  {
    category: 'AI Assistant',
    question: 'Is my data safe when using AI?',
    answer: 'Your documents are processed securely and not stored on external servers. AI analysis is performed in compliance with privacy regulations and your data is never shared.',
  },
  // Security
  {
    category: 'Security & Privacy',
    question: 'Is my data secure?',
    answer: 'Yes! All your documents are encrypted using AES-256 encryption. We never share your data with third parties. You can also enable biometric login (Face ID/Touch ID) for extra security.',
  },
  {
    category: 'Security & Privacy',
    question: 'How do I enable biometric login?',
    answer: 'Go to Profile > Privacy & Security > Enable Face ID/Touch ID. Once enabled, you\'ll use biometrics to unlock the app.',
  },
  // Account
  {
    category: 'Account',
    question: 'How do I change my profile picture?',
    answer: 'Go to Profile > Account Settings > tap your avatar. You can take a new photo, choose from your gallery, or use your initials.',
  },
  {
    category: 'Account',
    question: 'How do I delete my account?',
    answer: 'Go to Profile > Privacy & Security > Delete Account. This action is permanent and will delete all your documents and data.',
  },
];

const GUIDES: GuideItem[] = [
  {
    title: 'Scan Your First Document',
    description: 'Learn how to scan documents with professional quality',
    icon: 'scan',
    color: '#5856D6',
    steps: [
      'Tap the "Scan" tile on the home screen',
      'Position your document within the camera frame',
      'The app will automatically detect edges',
      'Tap the capture button to scan',
      'Adjust corners if needed by dragging the handles',
      'Choose a filter (Auto recommended)',
      'Tap "Save" to save your document',
    ],
  },
  {
    title: 'Send a Fax',
    description: 'Step-by-step guide to sending faxes worldwide',
    icon: 'print',
    color: '#FF9500',
    steps: [
      'Tap "Send Fax" from the home screen',
      'Select a document or scan a new one',
      'Enter the recipient fax number with country code',
      'Optionally add a cover page with subject and message',
      'Review the fax preview',
      'Tap "Send Fax" to submit',
      'Track delivery status in notifications',
    ],
  },
  {
    title: 'Organize with Folders',
    description: 'Keep your documents organized and accessible',
    icon: 'folder',
    color: '#34C759',
    steps: [
      'Go to the Documents tab',
      'Tap "New Folder" to create a folder',
      'Enter a name for your folder',
      'Tap the folder icon to customize appearance',
      'Choose an emoji icon and background color',
      'Open the folder and tap "Add Documents"',
      'Select documents to add to the folder',
    ],
  },
  {
    title: 'Use AI Assistant',
    description: 'Get intelligent help with your documents',
    icon: 'sparkles',
    color: '#AF52DE',
    steps: [
      'Tap "Ask AI" from the home screen',
      'Start a new conversation or continue an existing one',
      'Type your question or select a quick prompt',
      'Optionally attach a document for analysis',
      'AI will process and respond to your request',
      'Use follow-up questions for more details',
      'Save or share AI-generated content',
    ],
  },
];

const CATEGORIES = ['All', 'Getting Started', 'Scanning', 'Editing', 'Faxing', 'Organization', 'AI Assistant', 'Security & Privacy', 'Account'];

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFAQs = FAQ_DATA.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@zeniapp.com?subject=Zeni Support Request');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/233000000000?text=Hi, I need help with Zeni app');
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <ThemedTextInput
            style={styles.searchInput}
            placeholder="Search help articles..."
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
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Email Us</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={handleWhatsApp}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#25D366' + '15' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Start Guides */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUICK START GUIDES</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {GUIDES.map((guide, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.guideItem,
                { borderBottomColor: colors.borderLight },
                index === GUIDES.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => setExpandedGuide(expandedGuide === index ? null : index)}
            >
              <View style={styles.guideHeader}>
                <View style={[styles.guideIcon, { backgroundColor: guide.color + '15' }]}>
                  <Ionicons name={guide.icon} size={24} color={guide.color} />
                </View>
                <View style={styles.guideInfo}>
                  <Text style={[styles.guideTitle, { color: colors.textPrimary }]}>{guide.title}</Text>
                  <Text style={[styles.guideDesc, { color: colors.textTertiary }]}>{guide.description}</Text>
                </View>
                <Ionicons 
                  name={expandedGuide === index ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.textTertiary} 
                />
              </View>
              {expandedGuide === index && (
                <View style={styles.guideSteps}>
                  {guide.steps.map((step, stepIndex) => (
                    <View key={stepIndex} style={styles.stepRow}>
                      <View style={[styles.stepNumber, { backgroundColor: guide.color }]}>
                        <Text style={styles.stepNumberText}>{stepIndex + 1}</Text>
                      </View>
                      <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Filter */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FREQUENTLY ASKED QUESTIONS</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                { backgroundColor: selectedCategory === category ? colors.primary : colors.surface }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === category ? colors.textInverse : colors.textSecondary }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, marginTop: spacing.md }]}>
          {filteredFAQs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No results found</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                Try a different search term or category
              </Text>
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
                  <>
                    <Text style={[styles.faqCategory, { color: colors.primary }]}>{faq.category}</Text>
                    <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
                  </>
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
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Email Support</Text>
              <Text style={[styles.contactDesc, { color: colors.textTertiary }]}>support@zeniapp.com</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.contactItem, { borderBottomColor: colors.borderLight }]}
            onPress={handleWhatsApp}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#25D366' + '15' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>WhatsApp Support</Text>
              <Text style={[styles.contactDesc, { color: colors.textTertiary }]}>Chat with us directly</Text>
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
              <Text style={[styles.contactDesc, { color: colors.textTertiary }]}>Help us improve Zeni</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            Zeni v1.0.0 (Build 1)
          </Text>
          <Text style={[styles.versionSubtext, { color: colors.textTertiary }]}>
            Made with ❤️ in Ghana
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
    paddingBottom: spacing.xxl * 2,
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
  // Guide styles
  guideItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  guideInfo: {
    flex: 1,
  },
  guideTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  guideDesc: {
    fontSize: typography.fontSize.sm,
  },
  guideSteps: {
    marginTop: spacing.lg,
    paddingLeft: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    paddingTop: 2,
  },
  // Category filter
  categoryContainer: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  // FAQ styles
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
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
  faqCategory: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqAnswer: {
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  // Contact styles
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
  // Version info
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  versionText: {
    fontSize: typography.fontSize.sm,
  },
  versionSubtext: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});
