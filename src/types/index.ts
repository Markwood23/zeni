// Type definitions for Zeni app

export type DocumentType = 'scanned' | 'uploaded' | 'edited' | 'converted' | 'faxed';

export type DocumentFilter = 'all' | DocumentType;

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  school?: string;
  level?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  type: DocumentType;
  filePath: string;
  thumbnailPath?: string;
  pagesCount: number;
  fileSize: number; // in bytes
  mimeType: string;
  sourceDocumentId?: string; // for versioning
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type FolderIconType = 'default' | 'emoji' | 'icon';

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  documentIds: string[];
  color?: string;
  backgroundColor?: string; // Custom background color for folder card
  icon?: string; // emoji character or icon name
  iconType?: FolderIconType;
  createdAt: Date;
  updatedAt: Date;
}

export type FaxStatus = 'pending' | 'sending' | 'delivered' | 'failed';

export interface FaxJob {
  id: string;
  documentId: string;
  userId: string;
  recipientName: string;
  recipientFaxNumber: string;
  coverPageSubject?: string;
  coverPageMessage?: string;
  status: FaxStatus;
  providerJobId?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Institution {
  id: string;
  name: string;
  faxNumber: string;
  department?: string;
  category: 'university' | 'college' | 'government' | 'embassy' | 'other';
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  attachedDocumentId?: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  attachedDocumentId?: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'scan' | 'edit' | 'convert' | 'fax' | 'share' | 'ai_chat' | 'upload';
  documentId?: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// App Notification types
export type NotificationType = 
  | 'fax_sent' 
  | 'fax_delivered' 
  | 'fax_failed'
  | 'scan_complete'
  | 'convert_complete'
  | 'ai_complete'
  | 'document_shared'
  | 'storage_warning'
  | 'tip'
  | 'update'
  | 'welcome';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  documentId?: string;
  actionLabel?: string;
  actionRoute?: string;
  createdAt: Date;
}

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  VerifyPhone: { phone: string };
};

export type MainTabParamList = {
  Home: undefined;
  Documents: undefined;
  Activity: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  Scan: undefined;
  ScanPreview: { imageUri: string };
  ScanResult: { documentId: string };
  Edit: { documentId?: string };
  EditDocument: { documentId: string };
  Convert: { documentId?: string };
  ConvertResult: { documentId: string };
  AskAI: undefined;
  AIChat: { conversationId?: string; documentId?: string };
  Fax: { documentId?: string };
  FaxSend: { documentId: string };
  AllDocuments: { initialFilter?: DocumentFilter } | undefined;
  DocumentView: { documentId: string };
  NotificationCenter: undefined;
  NotificationDetail: { notificationId: string };
  HelpSupport: undefined;
};

export type DocumentsStackParamList = {
  DocumentsHub: { openSearch?: boolean } | undefined;
  AllDocuments: { initialFilter?: DocumentFilter } | undefined;
  DocumentView: { documentId: string };
  FolderView: { folderId: string };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  AccountSettings: undefined;
  Notifications: undefined;
  Storage: undefined;
  Signatures: undefined;
  PrivacySecurity: undefined;
  HelpSupport: undefined;
  About: undefined;
  Appearance: undefined;
};

// Quick prompt chips for AI
export interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

// Scan filter types
export type ScanFilter = 'original' | 'blackWhite' | 'grayscale' | 'auto';

// Edit tool types
export type EditTool = 'select' | 'text' | 'pen' | 'highlighter' | 'signature' | 'shapes';

// Convert operation types
export type ConvertOperation = 'toPdf' | 'toImage' | 'merge' | 'split' | 'compress';
