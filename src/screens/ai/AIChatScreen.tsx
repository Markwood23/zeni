import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, AIMessage, Document, AIConversation, Folder } from '../../types';
import { useAIStore, useDocumentsStore, useUserStore, useActivityStore, useShareStore, useSignaturesStore, useNotificationsStore, useSettingsStore, generateId } from '../../store';
import aiService, { ChatMessage, FullAppContext, parseAIResponse, executeAction, AIAction, sendEmailWithMailComposer } from '../../utils/aiService';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'AIChat'>;
type RouteType = RouteProp<HomeStackParamList, 'AIChat'>;

export default function AIChatScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const { conversationId, documentId } = route.params || {};
  
  // Get all stores for full context
  const { conversations, updateConversation } = useAIStore();
  const { documents, folders, deleteDocument, updateDocument, addFolder, updateFolder, deleteFolder, addDocument, addDocumentToFolder, removeDocumentFromFolder } = useDocumentsStore();
  const { user, setUser } = useUserStore();
  const { activities, addActivity, clearActivities } = useActivityStore();
  const { shareJobs, addShareJob, clearAllShares } = useShareStore();
  const { signatures } = useSignaturesStore();
  const { addNotification, clearAllNotifications, markAllAsRead } = useNotificationsStore();
  const { setNotificationSetting, setSecuritySetting } = useSettingsStore();

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedDocument, setAttachedDocument] = useState<Document | null>(null);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  const [pendingAction, setPendingAction] = useState<AIAction | null>(null);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [documentPickerPrompt, setDocumentPickerPrompt] = useState('');
  const [documentPickerPurpose, setDocumentPickerPurpose] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const conversation = conversations.find((c: AIConversation) => c.id === conversationId);
  const messages = conversation?.messages || [];

  // Organize documents by folders for the picker
  const organizedDocuments = useMemo(() => {
    const folderDocs: { folder: Folder; documents: Document[] }[] = [];
    const unfiledDocs: Document[] = [];
    
    // Get documents in each folder
    folders.forEach((folder: Folder) => {
      const docsInFolder = documents.filter((doc: Document) => 
        folder.documentIds.includes(doc.id) || doc.folderId === folder.id
      );
      if (docsInFolder.length > 0) {
        folderDocs.push({ folder, documents: docsInFolder });
      }
    });
    
    // Get unfiled documents
    const filedDocIds = new Set(folderDocs.flatMap(fd => fd.documents.map(d => d.id)));
    documents.forEach((doc: Document) => {
      if (!filedDocIds.has(doc.id) && !doc.folderId) {
        unfiledDocs.push(doc);
      }
    });
    
    return { folderDocs, unfiledDocs };
  }, [documents, folders]);

  // Action executor for Zai
  const actionExecutor = useMemo(() => ({
    deleteDocument: (id: string) => deleteDocument(id),
    moveToFolder: (documentId: string, folderId: string) => {
      // Find the document to check if it's already in a folder
      const doc = documents.find((d: Document) => d.id === documentId);
      const targetFolder = folders.find((f: Folder) => f.id === folderId);
      
      if (!doc || !targetFolder) return;
      
      // Remove from old folder if it was in one
      if (doc?.folderId) {
        removeDocumentFromFolder(doc.folderId, documentId);
      }
      
      // Update document's folderId
      updateDocument(documentId, { folderId });
      
      // Add to new folder's documentIds
      addDocumentToFolder(folderId, documentId);
    },
    renameDocument: (documentId: string, newName: string) => {
      updateDocument(documentId, { name: newName });
    },
    renameFolder: (folderId: string, newName: string) => {
      updateFolder(folderId, { name: newName });
    },
    deleteFolder: (id: string) => {
      deleteFolder(id);
    },
    createFolder: (name: string, icon?: string) => {
      const folderId = generateId();
      addFolder({ 
        id: folderId, 
        userId: user?.id || 'guest',
        name, 
        icon: icon || '📁', 
        documentIds: [], 
        createdAt: new Date(), 
        updatedAt: new Date() 
      });
      return folderId;
    },
    createDocument: (name: string, content: string, type: string, folderId?: string) => {
      const docId = generateId();
      const newDoc: Document = {
        id: docId,
        userId: user?.id || 'guest',
        name,
        type: 'uploaded' as any,
        filePath: `zai-created/${docId}.txt`,
        mimeType: 'text/plain',
        fileSize: content.length,
        pagesCount: Math.ceil(content.length / 3000), // Rough page estimate
        folderId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addDocument(newDoc);
      
      // Also add to folder's documentIds if folderId is provided
      if (folderId) {
        addDocumentToFolder(folderId, docId);
      }
      
      return docId;
    },
    sendEmail: async (to: string, subject: string, body: string, attachments?: string[]) => {
      return await sendEmailWithMailComposer(to, subject, body, attachments);
    },
    shareDocument: (recipientName: string, recipientEmail: string, documentId: string, shareMethod: 'email' | 'whatsapp' | 'link' = 'link') => {
      addShareJob({
        id: generateId(),
        documentId,
        userId: user?.id || 'guest',
        recipientName,
        recipientEmail,
        shareMethod,
        accessType: 'view',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
    showDocumentPicker: (prompt: string, purpose: string) => {
      setDocumentPickerPrompt(prompt);
      setDocumentPickerPurpose(purpose);
      setShowDocumentPicker(true);
    },
    navigate: (screen: string, params?: Record<string, any>) => {
      // @ts-ignore
      navigation.navigate(screen, params);
    },
    addNotification: (notification: any) => addNotification(notification),
    addActivity: (activity: any) => addActivity(activity),
    // New actions
    removeFromFolder: (documentId: string, folderId: string) => {
      removeDocumentFromFolder(folderId, documentId);
      updateDocument(documentId, { folderId: undefined });
    },
    duplicateDocument: (documentId: string) => {
      const doc = documents.find((d: Document) => d.id === documentId);
      if (!doc) return null;
      
      const newDocId = generateId();
      const newDoc: Document = {
        ...doc,
        id: newDocId,
        name: `${doc.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addDocument(newDoc);
      
      // If original was in a folder, add copy to same folder
      if (doc.folderId) {
        addDocumentToFolder(doc.folderId, newDocId);
      }
      
      return newDocId;
    },
    clearNotifications: () => clearAllNotifications(),
    markAllNotificationsRead: () => markAllAsRead(),
    clearActivityHistory: () => clearActivities(),
    clearShareHistory: () => clearAllShares(),
    updateProfile: (updates: { firstName?: string; lastName?: string; email?: string; phone?: string; school?: string }) => {
      if (user) {
        setUser({ ...user, ...updates });
      }
    },
    toggleSetting: (key: string, value: boolean) => {
      // Determine which setting type based on key
      const notificationSettings = ['pushNotificationsEnabled', 'emailNotificationsEnabled', 'scanCompleteNotifications', 'shareStatusNotifications', 'aiResponseNotifications', 'tipsNotifications', 'updateNotifications'];
      const securitySettings = ['biometricEnabled', 'autoLockEnabled', 'saveActivityHistory', 'analyticsEnabled'];
      
      if (notificationSettings.includes(key)) {
        setNotificationSetting(key, value);
      } else if (securitySettings.includes(key)) {
        setSecuritySetting(key, value);
      }
    },
  }), [documents, folders, user, deleteDocument, updateDocument, addFolder, updateFolder, deleteFolder, addDocument, addDocumentToFolder, removeDocumentFromFolder, addShareJob, navigation, addNotification, addActivity, clearAllNotifications, markAllAsRead, clearActivities, clearAllShares, setUser, setNotificationSetting, setSecuritySetting]);

  // Handle document selection from picker
  const handleDocumentSelect = useCallback((doc: Document) => {
    setShowDocumentPicker(false);
    setAttachedDocument(doc);
    
    // Auto-send a message about the selected document
    const selectionMessage = `I've selected "${doc.name}" for ${documentPickerPurpose}`;
    setMessage(selectionMessage);
    
    // Clear picker state
    setDocumentPickerPrompt('');
    setDocumentPickerPurpose('');
  }, [documentPickerPurpose]);

  // Execute an action and post result to chat
  const executeAndReportAction = useCallback(async (action: AIAction, currentMessages: AIMessage[]) => {
    if (!action || !conversation) return;
    
    const result = await executeAction(action, actionExecutor, (id) => documents.find((d: Document) => d.id === id));
    
    // Add result message to chat
    const resultMessage: AIMessage = {
      id: generateId(),
      conversationId: conversation.id,
      role: 'assistant',
      content: result.success 
        ? `✅ ${result.message}` 
        : `❌ ${result.message}`,
      createdAt: new Date(),
    };
    
    updateConversation(conversation.id, {
      messages: [...currentMessages, resultMessage],
    });
    
    setPendingAction(null);
  }, [conversation, actionExecutor, documents, updateConversation]);

  // Handle action confirmation from dialog (uses pendingAction state)
  const handleConfirmAction = useCallback(async () => {
    if (!pendingAction || !conversation) return;
    await executeAndReportAction(pendingAction, messages);
  }, [pendingAction, conversation, messages, executeAndReportAction]);

  const handleCancelAction = useCallback(() => {
    if (!conversation) return;
    
    const cancelMessage: AIMessage = {
      id: generateId(),
      conversationId: conversation.id,
      role: 'assistant',
      content: '👍 Action cancelled. Let me know if you need anything else!',
      createdAt: new Date(),
    };
    
    updateConversation(conversation.id, {
      messages: [...messages, cancelMessage],
    });
    
    setPendingAction(null);
  }, [conversation, messages, updateConversation]);

  // Build full app context for Zai
  const appContext: FullAppContext = useMemo(() => {
    const totalStorageUsed = documents.reduce((acc: number, doc: Document) => acc + (doc.fileSize || 0), 0);
    
    return {
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        school: user.school,
        level: user.level,
        accountType: user.accountType,
        isPremium: user.isPremium,
      } : undefined,
      documents: documents.map((doc: Document) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        pagesCount: doc.pagesCount,
        fileSize: doc.fileSize,
        folderId: doc.folderId,
        createdAt: doc.createdAt,
      })),
      folders: folders.map((folder: Folder) => ({
        id: folder.id,
        name: folder.name,
        documentCount: folder.documentIds.length,
        icon: folder.icon,
      })),
      recentActivities: activities.slice(0, 10).map((activity: any) => ({
        type: activity.type,
        title: activity.title,
        createdAt: activity.createdAt,
      })),
      shareHistory: shareJobs.slice(0, 10).map((share: any) => ({
        recipientName: share.recipientName,
        shareMethod: share.shareMethod || 'email',
        status: share.status,
        sentAt: share.sentAt,
      })),
      signatures: signatures.map((sig: any) => ({
        id: sig.id,
        type: sig.type,
        createdAt: sig.createdAt,
      })),
      stats: {
        totalDocuments: documents.length,
        totalFolders: folders.length,
        totalSharesSent: shareJobs.filter((s: any) => s.status === 'delivered').length,
        storageUsed: totalStorageUsed,
      },
    };
  }, [user, documents, folders, activities, shareJobs, signatures]);

  useEffect(() => {
    if (documentId) {
      const doc = documents.find((d: Document) => d.id === documentId);
      if (doc) setAttachedDocument(doc);
    }
  }, [documentId, documents]);

  useEffect(() => {
    // Check if AI is configured
    const key = aiService.getApiKey();
    setIsAiConfigured(!!key);
  }, []);

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

    try {
      // Build chat history for AI
      const chatHistory: ChatMessage[] = newMessages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Get document context if attached
      const documentContext = attachedDocument ? {
        id: attachedDocument.id,
        name: attachedDocument.name,
        type: attachedDocument.type,
        pagesCount: attachedDocument.pagesCount,
        filePath: attachedDocument.filePath,
        mimeType: attachedDocument.mimeType,
      } : undefined;

      // Call AI service with full app context
      const rawResponse = await aiService.chat(chatHistory, documentContext, appContext);
      
      // Parse response for action blocks
      const { message: responseMessage, action } = parseAIResponse(rawResponse);

      const aiResponse: AIMessage = {
        id: generateId(),
        conversationId: conversation.id,
        role: 'assistant',
        content: responseMessage,
        createdAt: new Date(),
      };

      updateConversation(conversation.id, {
        messages: [...newMessages, aiResponse],
      });

      // Handle action if present
      if (action && action.type !== 'none') {
        const updatedMessages = [...newMessages, aiResponse];
        
        if (action.confirmationRequired) {
          // Store action for confirmation dialog
          setPendingAction(action);
          
          // Show confirmation dialog
          Alert.alert(
            '🤖 Zai wants to perform an action',
            action.confirmationMessage || `Zai wants to: ${action.type.replace(/_/g, ' ')}`,
            [
              { text: 'Cancel', style: 'cancel', onPress: handleCancelAction },
              { text: 'Confirm', style: 'default', onPress: () => {
                // Execute with the action directly (not from state)
                executeAndReportAction(action, updatedMessages);
              }},
            ]
          );
        } else {
          // Execute immediately with action directly
          executeAndReportAction(action, updatedMessages);
        }
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      
      const errorMessage: AIMessage = {
        id: generateId(),
        conversationId: conversation.id,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message || 'Please try again.'}`,
        createdAt: new Date(),
      };

      updateConversation(conversation.id, {
        messages: [...newMessages, errorMessage],
      });
    } finally {
      setIsLoading(false);
      setAttachedDocument(null);
    }
  };

  const handleAttachDocument = async () => {
    // Show options: from library or from files
    Alert.alert(
      'Attach Document',
      'Choose a document to attach',
      [
        {
          text: 'From Your Documents',
          onPress: () => {
            // Show document picker from library
            if (documents.length === 0) {
              Alert.alert('No Documents', 'You have no documents yet. Scan or import a document first.');
              return;
            }
            // For now, pick the most recent document
            // A full implementation would show a picker modal
            const recentDoc = documents[0];
            setAttachedDocument(recentDoc);
          },
        },
        {
          text: 'Import New',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
              });

              if (!result.canceled && result.assets[0]) {
                // Create a temporary document reference
                const tempDoc: Document = {
                  id: generateId(),
                  userId: 'temp',
                  name: result.assets[0].name,
                  type: 'uploaded',
                  mimeType: result.assets[0].mimeType || 'application/pdf',
                  filePath: result.assets[0].uri,
                  thumbnailPath: result.assets[0].uri,
                  fileSize: result.assets[0].size || 0,
                  pagesCount: 1,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                setAttachedDocument(tempDoc);
              }
            } catch (error) {
              console.error('Error picking document:', error);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleConfigureAI = () => {
    Alert.prompt(
      'Configure AI',
      'Enter your OpenAI API key to enable advanced AI features. Your key is stored securely on your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (key?: string) => {
            if (key && key.trim().startsWith('sk-')) {
              await aiService.setApiKey(key.trim());
              setIsAiConfigured(true);
              Alert.alert('Success', 'AI API key configured successfully!');
            } else {
              Alert.alert('Invalid Key', 'Please enter a valid OpenAI API key starting with "sk-".');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  // Format AI response content with proper styling
  const renderFormattedContent = (content: string, isUser: boolean) => {
    if (isUser) {
      return (
        <Text style={[styles.messageText, styles.userMessageText]}>
          {content}
        </Text>
      );
    }

    // Parse and render formatted content for AI responses
    const elements: React.ReactNode[] = [];
    const lines = content.split('\n');
    let currentListItems: string[] = [];
    let currentListType: 'bullet' | 'number' | null = null;
    let listKey = 0;

    const flushList = () => {
      if (currentListItems.length > 0 && currentListType) {
        elements.push(
          <View key={`list-${listKey++}`} style={styles.listContainer}>
            {currentListItems.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                {currentListType === 'bullet' ? (
                  <View style={[styles.bulletPoint, { backgroundColor: colors.primary }]} />
                ) : (
                  <Text style={styles.listNumber}>{idx + 1}.</Text>
                )}
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </View>
        );
        currentListItems = [];
        currentListType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check for headers (## or **)
      const headerMatch = trimmedLine.match(/^#{1,3}\s+(.+)$/) || trimmedLine.match(/^\*\*(.+)\*\*$/);
      if (headerMatch) {
        flushList();
        elements.push(
          <Text key={`h-${index}`} style={styles.headerText}>
            {headerMatch[1].replace(/\*\*/g, '')}
          </Text>
        );
        return;
      }

      // Check for bold text sections (standalone **text**)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && !trimmedLine.includes(':')) {
        flushList();
        elements.push(
          <Text key={`bold-${index}`} style={styles.boldText}>
            {trimmedLine.replace(/\*\*/g, '')}
          </Text>
        );
        return;
      }

      // Check for bullet points (-, *, •)
      const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);
      if (bulletMatch) {
        if (currentListType !== 'bullet') {
          flushList();
          currentListType = 'bullet';
        }
        currentListItems.push(bulletMatch[1].replace(/\*\*/g, '').replace(/\*/g, ''));
        return;
      }

      // Check for numbered lists (1., 2., etc.)
      const numberMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
      if (numberMatch) {
        if (currentListType !== 'number') {
          flushList();
          currentListType = 'number';
        }
        currentListItems.push(numberMatch[1].replace(/\*\*/g, '').replace(/\*/g, ''));
        return;
      }

      // Regular text or empty line
      flushList();
      
      if (trimmedLine === '') {
        elements.push(<View key={`space-${index}`} style={styles.spacer} />);
      } else {
        // Clean up markdown artifacts and render as text
        const cleanedText = trimmedLine
          .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markers
          .replace(/\*(.+?)\*/g, '$1') // Remove italic markers
          .replace(/`(.+?)`/g, '$1'); // Remove code markers
        
        elements.push(
          <Text key={`p-${index}`} style={styles.messageText}>
            {cleanedText}
          </Text>
        );
      }
    });

    flushList();

    return <View style={styles.formattedContent}>{elements}</View>;
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
              <Ionicons name="document-attach" size={14} color={colors.uploadedIcon} />
              <Text style={styles.attachmentText}>Document attached</Text>
            </View>
          )}
          {renderFormattedContent(item.content, isUser)}
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
            {conversation?.title || 'Chat with Zai'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isLoading ? 'Zai is thinking...' : '✨ Powered by AI'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={() => {
          Alert.alert(
            'Zai Settings',
            'Your AI assistant is ready to help!',
            [
              { text: 'Got it', style: 'cancel' },
            ]
          );
        }}>
          <Ionicons name="sparkles" size={24} color={colors.askAiIcon} />
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
              <Text style={styles.emptyChatTitle}>Hey, I'm Zai! 👋</Text>
              <Text style={styles.emptyChatSubtitle}>
                Ask me anything about your documents, studies, or writing
              </Text>
            </View>
          }
        />

        {/* Attached Document Preview */}
        {attachedDocument && (
          <View style={styles.attachedPreview}>
            <View style={styles.attachedInfo}>
              <Ionicons name="document-text" size={20} color={colors.uploadedIcon} />
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
              placeholder="Ask Zai anything..."
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

      {/* Document Picker Modal */}
      <Modal
        visible={showDocumentPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDocumentPicker(false)}
      >
        <SafeAreaView style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Document</Text>
            <TouchableOpacity onPress={() => setShowDocumentPicker(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {documentPickerPrompt && (
            <View style={styles.pickerPrompt}>
              <Ionicons name="sparkles" size={20} color={colors.askAiIcon} />
              <Text style={styles.pickerPromptText}>{documentPickerPrompt}</Text>
            </View>
          )}

          <ScrollView style={styles.pickerContent}>
            {/* Folders with documents */}
            {organizedDocuments.folderDocs.map(({ folder, documents: folderDocuments }) => (
              <View key={folder.id} style={styles.folderSection}>
                <View style={styles.folderHeader}>
                  <Text style={styles.folderIcon}>{folder.icon || '📁'}</Text>
                  <Text style={styles.folderName}>{folder.name}</Text>
                  <Text style={styles.folderCount}>{folderDocuments.length}</Text>
                </View>
                {folderDocuments.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.documentItem}
                    onPress={() => handleDocumentSelect(doc)}
                  >
                    <View style={styles.documentIcon}>
                      <Ionicons 
                        name={doc.type === 'scanned' ? 'scan-outline' : 'document-text-outline'} 
                        size={20} 
                        color={colors.primary} 
                      />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
                      <Text style={styles.documentMeta}>{doc.pagesCount} page{doc.pagesCount !== 1 ? 's' : ''}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Unfiled documents */}
            {organizedDocuments.unfiledDocs.length > 0 && (
              <View style={styles.folderSection}>
                <View style={styles.folderHeader}>
                  <Text style={styles.folderIcon}>📄</Text>
                  <Text style={styles.folderName}>Unfiled Documents</Text>
                  <Text style={styles.folderCount}>{organizedDocuments.unfiledDocs.length}</Text>
                </View>
                {organizedDocuments.unfiledDocs.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.documentItem}
                    onPress={() => handleDocumentSelect(doc)}
                  >
                    <View style={styles.documentIcon}>
                      <Ionicons 
                        name={doc.type === 'scanned' ? 'scan-outline' : 'document-text-outline'} 
                        size={20} 
                        color={colors.primary} 
                      />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
                      <Text style={styles.documentMeta}>{doc.pagesCount} page{doc.pagesCount !== 1 ? 's' : ''}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Empty state */}
            {documents.length === 0 && (
              <View style={styles.emptyPicker}>
                <Ionicons name="document-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyPickerText}>No documents yet</Text>
                <Text style={styles.emptyPickerSubtext}>Scan or import a document first</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  // Formatted content styles
  formattedContent: {
    flexDirection: 'column',
  },
  headerText: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  boldText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  listContainer: {
    marginVertical: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: spacing.sm,
  },
  listNumber: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginRight: spacing.sm,
    minWidth: 20,
  },
  listItemText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  spacer: {
    height: spacing.sm,
  },
  // Document Picker Modal styles
  pickerModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  pickerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickerPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  pickerPromptText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.primary,
  },
  pickerContent: {
    flex: 1,
  },
  folderSection: {
    marginBottom: spacing.lg,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.sm,
  },
  folderIcon: {
    fontSize: 20,
  },
  folderName: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  folderCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  emptyPicker: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyPickerText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyPickerSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
