import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, AIMessage, Document } from '../../types';
import { useAIStore, useDocumentsStore, generateId } from '../../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'AIChat'>;
type RouteType = RouteProp<HomeStackParamList, 'AIChat'>;

export default function AIChatScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const { conversationId, documentId } = route.params || {};
  const { conversations, updateConversation } = useAIStore();
  const { documents } = useDocumentsStore();

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedDocument, setAttachedDocument] = useState<Document | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const messages = conversation?.messages || [];

  useEffect(() => {
    if (documentId) {
      const doc = documents.find((d) => d.id === documentId);
      if (doc) setAttachedDocument(doc);
    }
  }, [documentId, documents]);

  const handleSend = async () => {
    if (!message.trim() || !conversation) return;

    const userMessage: AIMessage = {
      id: generateId(),
      conversationId: conversation.id,
      role: 'user',
      content: message.trim(),
      attachedDocumentId: attachedDocument?.id,
      createdAt: new Date(),
    };

    const newMessages = [...messages, userMessage];
    updateConversation(conversation.id, {
      messages: newMessages,
      title: messages.length === 0 ? message.trim().slice(0, 30) + '...' : conversation.title,
    });

    setMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: generateId(),
        conversationId: conversation.id,
        role: 'assistant',
        content: generateAIResponse(userMessage.content, attachedDocument),
        createdAt: new Date(),
      };

      updateConversation(conversation.id, {
        messages: [...newMessages, aiResponse],
      });
      setIsLoading(false);
      setAttachedDocument(null);
    }, 1500);
  };

  const generateAIResponse = (userMessage: string, doc: Document | null): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (doc) {
      if (lowerMessage.includes('summar')) {
        return `Here's a summary of "${doc.name}":\n\nThis document contains ${doc.pagesCount} pages of content. Based on my analysis, the key points include:\n\n1. Main topic and objectives outlined in the introduction\n2. Supporting details and evidence in the body sections\n3. Conclusions and recommendations in the final section\n\nWould you like me to go into more detail about any specific section?`;
      }
      if (lowerMessage.includes('deadline') || lowerMessage.includes('date')) {
        return `I've scanned "${doc.name}" for dates and deadlines:\n\n• No specific deadlines were found in this document.\n• However, I recommend reviewing any dates mentioned in context.\n\nWould you like me to help with something else?`;
      }
    }

    if (lowerMessage.includes('help') && lowerMessage.includes('email')) {
      return `I'd be happy to help you write a professional email! Here's a template to get you started:\n\n**Subject:** [Clear, specific subject]\n\n**Body:**\nDear [Recipient's Name],\n\nI hope this email finds you well. I am writing to [state your purpose].\n\n[Main content - keep it concise]\n\n[Call to action or next steps]\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]\n[Your Contact Information]\n\nWould you like me to customize this for a specific purpose?`;
      }

    if (lowerMessage.includes('explain')) {
      return "I'd be happy to explain! Could you share the specific text or concept you'd like me to break down into simpler terms? You can:\n\n1. Attach a document\n2. Paste the text directly\n3. Describe what you need explained\n\nI'll make sure to use clear, simple language.";
    }

    // Default helpful response
    return "I'm here to help! I can assist you with:\n\n📄 **Document Analysis**\n• Summarize documents\n• Extract key points\n• Find deadlines and dates\n\n✍️ **Writing Help**\n• Draft emails\n• Improve your writing\n• Format documents\n\n📚 **Study Assistance**\n• Explain concepts\n• Create revision questions\n• Organize notes\n\nJust ask your question or attach a document to get started!";
  };

  const handleAttachDocument = () => {
    // Would open document picker
    console.log('Attach document');
  };

  const renderMessage = ({ item }: { item: AIMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color={colors.askAiIcon} />
          </View>
        )}
        <View style={[styles.messageBubble, isUser && styles.userBubble]}>
          {item.attachedDocumentId && (
            <View style={styles.attachmentBadge}>
              <Ionicons name="document-attach" size={14} color={colors.primary} />
              <Text style={styles.attachmentText}>Document attached</Text>
            </View>
          )}
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation?.title || 'AI Chat'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isLoading ? 'AI is typing...' : 'Powered by AI'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View style={styles.emptyChatIcon}>
                <Ionicons name="sparkles" size={32} color={colors.askAiIcon} />
              </View>
              <Text style={styles.emptyChatTitle}>Start a conversation</Text>
              <Text style={styles.emptyChatSubtitle}>
                Ask me anything about your documents or studies
              </Text>
            </View>
          }
        />

        {/* Attached Document Preview */}
        {attachedDocument && (
          <View style={styles.attachedPreview}>
            <View style={styles.attachedInfo}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={styles.attachedName} numberOfLines={1}>
                {attachedDocument.name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setAttachedDocument(null)}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttachDocument}
          >
            <Ionicons name="attach" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything..."
              placeholderTextColor={colors.textTertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={2000}
              keyboardAppearance={isDark ? 'dark' : 'light'}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() && !isLoading ? colors.textInverse : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: colors.primary,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  attachmentText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  messageText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.textInverse,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  emptyChatIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyChatTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyChatSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  attachedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  attachedName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 120,
  },
  input: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
});
