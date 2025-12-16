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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, Document } from '../../types';
import { useDocumentsStore, useFaxStore, useActivityStore, generateId, useUserStore } from '../../store';
import faxService from '../../utils/faxService';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'FaxSend'>;
type RouteType = RouteProp<HomeStackParamList, 'FaxSend'>;

export default function FaxSendScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documentId } = route.params;
  const { documents } = useDocumentsStore();
  const { addFaxJob } = useFaxStore();
  const { addActivity } = useActivityStore();
  const { user } = useUserStore();

  const [selectedDocumentId, setSelectedDocumentId] = useState(documentId || '');
  const [recipientName, setRecipientName] = useState('');
  const [faxNumber, setFaxNumber] = useState('');
  const [coverSubject, setCoverSubject] = useState('');
  const [coverMessage, setCoverMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showDocumentPicker, setShowDocumentPicker] = useState(!documentId);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [faxApiMode, setFaxApiMode] = useState<string>('simulation');

  const selectedDocument = documents.find((d: Document) => d.id === selectedDocumentId);
  const pdfDocuments = documents.filter((d: Document) => d.mimeType === 'application/pdf' || d.mimeType?.startsWith('image/'));

  useEffect(() => {
    setFaxApiMode(faxService.getApiType());
  }, []);

  useEffect(() => {
    if (selectedDocument) {
      const isInternational = faxNumber.startsWith('+') && !faxNumber.startsWith('+1');
      setEstimatedCost(faxService.estimateCost(selectedDocument.pagesCount, isInternational));
    }
  }, [selectedDocument, faxNumber]);

  const validateAndSend = () => {
    // Validate fax number
    const validation = faxService.validateFaxNumber(faxNumber);
    if (!validation.valid) {
      Alert.alert('Invalid Fax Number', validation.message);
      return;
    }
    
    handleSend();
  };

  const handleSend = async () => {
    if (!selectedDocumentId || !recipientName || !faxNumber) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setIsSending(true);
    try {
      // Use fax service to send
      const result = await faxService.sendFax({
        documentPath: selectedDocument?.filePath || '',
        recipientNumber: faxNumber,
        recipientName,
        coverPage: coverSubject || coverMessage ? {
          subject: coverSubject,
          message: coverMessage,
          fromName: user?.firstName || 'Zeni User',
        } : undefined,
        pagesCount: selectedDocument?.pagesCount || 1,
      });

      if (result.success) {
        const faxJobId = result.jobId || generateId();
        addFaxJob({
          id: faxJobId,
          documentId: selectedDocumentId,
          userId: user?.id || 'guest',
          recipientName,
          recipientFaxNumber: faxService.formatFaxNumber(faxNumber),
          coverPageSubject: coverSubject,
          coverPageMessage: coverMessage,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        addActivity({
          id: generateId(),
          userId: user?.id || 'guest',
          type: 'fax',
          documentId: selectedDocumentId,
          title: 'Fax sent',
          description: `Sent to ${recipientName}`,
          createdAt: new Date(),
        });

        Alert.alert(
          'Fax Queued',
          `${result.message}\n\nEstimated delivery: ${result.estimatedDeliveryTime || 10} minutes`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('HomeScreen'),
            },
          ]
        );
      } else {
        Alert.alert('Fax Failed', result.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send fax. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectDocument = (docId: string) => {
    setSelectedDocumentId(docId);
    setShowDocumentPicker(false);
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
        <Text style={styles.headerTitle}>Send Fax</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Document Selection */}
        {showDocumentPicker ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Document *</Text>
            {pdfDocuments.length === 0 ? (
              <View style={styles.emptyDocuments}>
                <Ionicons name="document-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No documents available</Text>
                <Text style={styles.emptySubtext}>Scan or upload a document first</Text>
              </View>
            ) : (
              pdfDocuments.map((doc: Document) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.documentOption,
                    selectedDocumentId === doc.id && styles.documentOptionSelected,
                  ]}
                  onPress={() => handleSelectDocument(doc.id)}
                >
                  <View style={[styles.documentIcon, { backgroundColor: colors.faxedIcon + '15' }]}>
                    <Ionicons name="document-text" size={24} color={colors.faxedIcon} />
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
              <View style={[styles.documentIcon, { backgroundColor: colors.faxedIcon + '15' }]}>
                <Ionicons name="document-text" size={24} color={colors.faxedIcon} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={1}>
                  {selectedDocument?.name || 'Select document'}
                </Text>
                {selectedDocument && (
                  <Text style={styles.documentMeta}>
                    {selectedDocument.pagesCount} pages
                  </Text>
                )}
              </View>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recipient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. UG Academic Affairs"
              placeholderTextColor={colors.textTertiary}
              value={recipientName}
              onChangeText={setRecipientName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fax Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+233-30-XXXXXXX"
              placeholderTextColor={colors.textTertiary}
              value={faxNumber}
              onChangeText={setFaxNumber}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Cover Page (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Page (Optional)</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Transcript Request"
              placeholderTextColor={colors.textTertiary}
              value={coverSubject}
              onChangeText={setCoverSubject}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a note (your name, index number, reason...)"
              placeholderTextColor={colors.textTertiary}
              value={coverMessage}
              onChangeText={setCoverMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            {faxApiMode === 'simulation' 
              ? 'Simulation Mode: Faxes will be queued but not actually sent.'
              : 'Fax delivery typically takes 5-15 minutes. You\'ll receive a notification once delivered.'}
          </Text>
        </View>

        {/* Cost Estimation */}
        {selectedDocument && estimatedCost > 0 && (
          <View style={styles.costBox}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Estimated Cost:</Text>
              <Text style={styles.costValue}>${estimatedCost.toFixed(2)}</Text>
            </View>
            <Text style={styles.costNote}>
              Based on {selectedDocument.pagesCount} page(s) at standard rates
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Send Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!selectedDocumentId || !recipientName || !faxNumber || isSending) &&
              styles.buttonDisabled,
          ]}
          onPress={validateAndSend}
          disabled={!selectedDocumentId || !recipientName || !faxNumber || isSending}
        >
          <Ionicons
            name={isSending ? 'hourglass-outline' : 'send'}
            size={20}
            color={colors.textInverse}
          />
          <Text style={styles.sendButtonText}>
            {isSending ? 'Sending...' : 'Send Fax'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: spacing.huge,
  },
  section: {
    padding: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  documentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  documentOptionSelected: {
    borderColor: colors.primary,
  },
  selectedDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
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
    marginBottom: spacing.xs,
  },
  documentMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  changeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyDocuments: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.info + '15',
    marginHorizontal: spacing.xxl,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.info,
    lineHeight: 20,
  },
  costBox: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  costValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.success,
  },
  costNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  bottomAction: {
    padding: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
