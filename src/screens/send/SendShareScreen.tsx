import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, Document, ShareAccessType } from '../../types';
import { useDocumentsStore, useShareStore, useActivityStore, generateId, useUserStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'SendShare'>;
type RouteType = RouteProp<HomeStackParamList, 'SendShare'>;

type ShareMethod = 'email' | 'whatsapp' | 'link';
type ExpiryOption = '1h' | '24h' | '7d' | '30d' | 'never';

export default function SendShareScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documentId } = route.params;
  const { documents } = useDocumentsStore();
  const { addShareJob } = useShareStore();
  const { addActivity } = useActivityStore();
  const { user } = useUserStore();

  const [selectedDocumentId, setSelectedDocumentId] = useState(documentId || '');
  const [shareMethod, setShareMethod] = useState<ShareMethod>('link');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [accessType, setAccessType] = useState<ShareAccessType>('view');
  const [expiry, setExpiry] = useState<ExpiryOption>('7d');
  const [password, setPassword] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showDocumentPicker, setShowDocumentPicker] = useState(!documentId);
  const [generatedLink, setGeneratedLink] = useState('');

  const selectedDocument = documents.find((d: Document) => d.id === selectedDocumentId);
  const allDocuments = documents.filter((d: Document) => d.mimeType === 'application/pdf' || d.mimeType?.startsWith('image/'));

  const generateShareLink = () => {
    const token = Math.random().toString(36).substring(2, 10);
    return `https://zenigh.online/s/${token}`;
  };

  const handleShare = async () => {
    if (!selectedDocumentId) {
      Alert.alert('Missing Document', 'Please select a document to share');
      return;
    }

    if (shareMethod === 'email' && !recipientEmail) {
      Alert.alert('Missing Email', 'Please enter recipient email address');
      return;
    }

    setIsSending(true);
    try {
      const shareLink = generateShareLink();
      setGeneratedLink(shareLink);

      const shareJobId = generateId();
      
      // Add to share store
      addShareJob({
        id: shareJobId,
        documentId: selectedDocumentId,
        userId: user?.id || 'guest',
        recipientName: recipientName || recipientEmail,
        recipientEmail: recipientEmail || undefined,
        shareMethod,
        shareLink,
        accessType,
        message,
        status: 'delivered',
        sentAt: new Date(),
        deliveredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add activity
      addActivity({
        id: generateId(),
        userId: user?.id || 'guest',
        type: 'share',
        documentId: selectedDocumentId,
        title: 'Document shared',
        description: shareMethod === 'link' 
          ? 'Created shareable link' 
          : `Shared via ${shareMethod} to ${recipientEmail || recipientName}`,
        createdAt: new Date(),
      });

      // Handle different share methods
      if (shareMethod === 'email') {
        // Would integrate with email service
        Alert.alert(
          'Email Sent!',
          `Document shared with ${recipientEmail}. They'll receive a link to view it.`,
          [{ text: 'OK', onPress: () => navigation.navigate('HomeScreen') }]
        );
      } else if (shareMethod === 'whatsapp') {
        try {
          await Share.share({
            message: `${message || 'Check out this document!'}\n\n${shareLink}`,
          });
        } catch (error) {
          // User cancelled share
        }
      } else {
        // Link sharing - show the generated link
        Alert.alert(
          'Link Created!',
          `Your share link is ready:\n${shareLink}`,
          [
            { text: 'Copy Link', onPress: () => handleCopyLink(shareLink) },
            { text: 'Done', onPress: () => navigation.navigate('HomeScreen') },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share document. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = (link: string) => {
    Clipboard.setString(link);
    Alert.alert('Copied!', 'Link copied to clipboard', [
      { text: 'OK', onPress: () => navigation.navigate('HomeScreen') }
    ]);
  };

  const handleSelectDocument = (docId: string) => {
    setSelectedDocumentId(docId);
    setShowDocumentPicker(false);
  };

  const expiryOptions: { value: ExpiryOption; label: string }[] = [
    { value: '1h', label: '1 hour' },
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: 'never', label: 'Never' },
  ];

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
        <Text style={styles.headerTitle}>Share Document</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Document Selection */}
        {showDocumentPicker ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Document *</Text>
            {allDocuments.length === 0 ? (
              <View style={styles.emptyDocuments}>
                <Ionicons name="document-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No documents available</Text>
                <Text style={styles.emptySubtext}>Scan or upload a document first</Text>
              </View>
            ) : (
              allDocuments.map((doc: Document) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.documentOption,
                    selectedDocumentId === doc.id && styles.documentOptionSelected,
                  ]}
                  onPress={() => handleSelectDocument(doc.id)}
                >
                  <View style={[styles.documentIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="document-text" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text style={styles.documentMeta}>{doc.pagesCount} pages</Text>
                  </View>
                  {selectedDocumentId === doc.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document</Text>
            <TouchableOpacity
              style={styles.selectedDocument}
              onPress={() => setShowDocumentPicker(true)}
            >
              <View style={[styles.documentIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={1}>
                  {selectedDocument?.name || 'Select document'}
                </Text>
                {selectedDocument && (
                  <Text style={styles.documentMeta}>{selectedDocument.pagesCount} pages</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Share Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share via</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[
                styles.methodOption,
                shareMethod === 'email' && styles.methodOptionSelected,
              ]}
              onPress={() => setShareMethod('email')}
            >
              <Ionicons 
                name="mail-outline" 
                size={24} 
                color={shareMethod === 'email' ? colors.surface : '#ef4444'} 
              />
              <Text style={[
                styles.methodText,
                shareMethod === 'email' && styles.methodTextSelected,
              ]}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodOption,
                shareMethod === 'whatsapp' && styles.methodOptionSelected,
              ]}
              onPress={() => setShareMethod('whatsapp')}
            >
              <Ionicons 
                name="logo-whatsapp" 
                size={24} 
                color={shareMethod === 'whatsapp' ? colors.surface : '#22c55e'} 
              />
              <Text style={[
                styles.methodText,
                shareMethod === 'whatsapp' && styles.methodTextSelected,
              ]}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodOption,
                shareMethod === 'link' && styles.methodOptionSelected,
              ]}
              onPress={() => setShareMethod('link')}
            >
              <Ionicons 
                name="link-outline" 
                size={24} 
                color={shareMethod === 'link' ? colors.surface : colors.primary} 
              />
              <Text style={[
                styles.methodText,
                shareMethod === 'link' && styles.methodTextSelected,
              ]}>Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recipient Info (for email) */}
        {shareMethod === 'email' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipient</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Recipient name (optional)"
                placeholderTextColor={colors.textTertiary}
                value={recipientName}
                onChangeText={setRecipientName}
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Email address *"
                placeholderTextColor={colors.textTertiary}
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        )}

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message (optional)</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Add a message for the recipient..."
            placeholderTextColor={colors.textTertiary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <View style={styles.permissionRow}>
            <TouchableOpacity
              style={[
                styles.permissionOption,
                accessType === 'view' && styles.permissionOptionSelected,
              ]}
              onPress={() => setAccessType('view')}
            >
              <Ionicons 
                name="eye-outline" 
                size={20} 
                color={accessType === 'view' ? colors.surface : colors.primary} 
              />
              <Text style={[
                styles.permissionText,
                accessType === 'view' && styles.permissionTextSelected,
              ]}>View only</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.permissionOption,
                accessType === 'download' && styles.permissionOptionSelected,
              ]}
              onPress={() => setAccessType('download')}
            >
              <Ionicons 
                name="download-outline" 
                size={20} 
                color={accessType === 'download' ? colors.surface : colors.primary} 
              />
              <Text style={[
                styles.permissionText,
                accessType === 'download' && styles.permissionTextSelected,
              ]}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Link Expiry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Link expires</Text>
          <View style={styles.expiryRow}>
            {expiryOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.expiryChip,
                  expiry === option.value && styles.expiryChipSelected,
                ]}
                onPress={() => setExpiry(option.value)}
              >
                <Text style={[
                  styles.expiryText,
                  expiry === option.value && styles.expiryTextSelected,
                ]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Password Protection */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.toggleRow}
            onPress={() => setIsPasswordProtected(!isPasswordProtected)}
          >
            <View style={styles.toggleInfo}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.toggleLabel}>Password protect</Text>
            </View>
            <View style={[
              styles.toggle,
              isPasswordProtected && styles.toggleActive,
            ]}>
              <View style={[
                styles.toggleKnob,
                isPasswordProtected && styles.toggleKnobActive,
              ]} />
            </View>
          </TouchableOpacity>
          {isPasswordProtected && (
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={20} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          )}
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={[styles.shareButton, isSending && styles.shareButtonDisabled]}
          onPress={handleShare}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={colors.surface} />
              <Text style={styles.shareButtonText}>
                {shareMethod === 'link' ? 'Create Link' : `Share via ${shareMethod === 'email' ? 'Email' : 'WhatsApp'}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  placeholder: {
    width: 40,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyDocuments: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  documentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  documentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  selectedDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  documentMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  methodOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  methodOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  methodTextSelected: {
    color: colors.surface,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  messageInput: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  permissionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  permissionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  permissionOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  permissionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  permissionTextSelected: {
    color: colors.surface,
  },
  expiryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  expiryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  expiryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  expiryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  expiryTextSelected: {
    color: colors.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.surface,
  },
});
