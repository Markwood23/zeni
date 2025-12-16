import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, AIConversation, QuickPrompt } from '../../types';
import { useAIStore, generateId } from '../../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'AskAI'>;

const quickPrompts: QuickPrompt[] = [
  {
    id: '1',
    label: 'Summarize document',
    prompt: 'Please summarize this document for me',
    icon: 'document-text-outline',
  },
  {
    id: '2',
    label: 'Explain in simpler terms',
    prompt: 'Can you explain this in simpler English?',
    icon: 'bulb-outline',
  },
  {
    id: '3',
    label: 'Help write an email',
    prompt: 'Help me write a professional email about',
    icon: 'mail-outline',
  },
  {
    id: '4',
    label: 'Create revision questions',
    prompt: 'Create revision questions from this content',
    icon: 'help-circle-outline',
  },
  {
    id: '5',
    label: 'Extract key points',
    prompt: 'What are the key points from this document?',
    icon: 'list-outline',
  },
  {
    id: '6',
    label: 'Find deadlines',
    prompt: 'Are there any deadlines or important dates mentioned?',
    icon: 'calendar-outline',
  },
  {
    id: '7',
    label: 'Delete old documents',
    prompt: 'Can you help me delete documents I no longer need?',
    icon: 'trash-outline',
  },
  {
    id: '8',
    label: 'Organize my files',
    prompt: 'Help me organize my documents into folders',
    icon: 'folder-outline',
  },
  {
    id: '9',
    label: 'Create & save study guide',
    prompt: 'Create a study guide from one of my documents and save it to a folder',
    icon: 'school-outline',
  },
  {
    id: '10',
    label: 'Send via email',
    prompt: 'Help me send a document via email',
    icon: 'send-outline',
  },
  {
    id: '11',
    label: 'Translate content',
    prompt: 'Can you translate this document?',
    icon: 'language-outline',
  },
  {
    id: '12',
    label: 'Find action items',
    prompt: 'What action items or tasks are mentioned in this document?',
    icon: 'checkbox-outline',
  },
  {
    id: '13',
    label: 'Compare documents',
    prompt: 'Can you compare two of my documents?',
    icon: 'git-compare-outline',
  },
  {
    id: '14',
    label: 'Create to-do list',
    prompt: 'Create a to-do list from my documents',
    icon: 'checkmark-circle-outline',
  },
  {
    id: '15',
    label: 'What\'s new?',
    prompt: 'What have I been working on recently?',
    icon: 'time-outline',
  },
  {
    id: '16',
    label: 'Check my storage',
    prompt: 'How much storage am I using?',
    icon: 'cloud-outline',
  },
];

export default function AskAIScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { conversations, addConversation, deleteConversation } = useAIStore();

  const handleNewChat = (initialPrompt?: string) => {
    const newConversation: AIConversation = {
      id: generateId(),
      userId: 'guest',
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addConversation(newConversation);
    navigation.navigate('AIChat', { conversationId: newConversation.id });
  };

  const handleSelectConversation = (conversationId: string) => {
    navigation.navigate('AIChat', { conversationId });
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const handleDeleteConversation = (conversationId: string, title: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteConversation(conversationId);
          },
        },
      ]
    );
  };

  const handleConversationLongPress = (item: AIConversation) => {
    Alert.alert(
      item.title,
      'What would you like to do?',
      [
        { 
          text: 'Open', 
          onPress: () => handleSelectConversation(item.id) 
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteConversation(item.id, item.title) 
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderQuickPrompt = ({ item }: { item: QuickPrompt }) => (
    <TouchableOpacity
      style={styles.promptChip}
      onPress={() => handleNewChat(item.prompt)}
    >
      <Ionicons name={item.icon as any} size={16} color={colors.textSecondary} />
      <Text style={styles.promptChipText}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderConversation = ({ item }: { item: AIConversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => handleSelectConversation(item.id)}
      onLongPress={() => handleConversationLongPress(item)}
    >
      <View style={styles.conversationIcon}>
        <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.conversationMeta}>
          {item.messages.length} messages • {formatDate(item.updatedAt)}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteConversationButton}
        onPress={() => handleDeleteConversation(item.id, item.title)}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Zai</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={() => handleNewChat()}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroIcon}>
                <Ionicons name="sparkles" size={40} color={colors.askAiIcon} />
              </View>
              <Text style={styles.heroTitle}>Meet Zai ✨</Text>
              <Text style={styles.heroSubtitle}>
                Your powerful AI assistant with full control - read documents, delete files, send emails, organize folders, and more!
              </Text>
            </View>

            {/* New Chat Button */}
            <TouchableOpacity
              style={styles.newChatCard}
              onPress={() => handleNewChat()}
            >
              <Ionicons name="chatbubbles-outline" size={24} color={colors.textInverse} />
              <Text style={styles.newChatText}>Chat with Zai</Text>
            </TouchableOpacity>

            {/* Quick Prompts */}
            <View style={styles.promptsSection}>
              <Text style={styles.sectionTitle}>Quick Prompts</Text>
              <FlatList
                data={quickPrompts}
                renderItem={renderQuickPrompt}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.promptsList}
              />
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.disclaimerText}>
                Zai is here to help, but always verify important information. AI responses may not always be 100% accurate.
              </Text>
            </View>

            {/* Conversations Header */}
            {conversations.length > 0 && (
              <View style={styles.conversationsHeader}>
                <Text style={styles.sectionTitle}>Recent Conversations</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>
              Start chatting with Zai to get help with anything
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  newChatButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  newChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  newChatText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  promptsSection: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  promptsList: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  conversationsHeader: {
    marginTop: spacing.xxl,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  conversationIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  conversationMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  deleteConversationButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
