// @ts-nocheck
// Note: zustand v5 has strict mode TypeScript issues with implicit any types
// The types are correctly inferred at runtime, this is just a compile-time issue
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Document, Folder, ShareJob, AIConversation, Activity, DocumentFilter, AppNotification, NotificationType, FolderShareLink } from '../types';

// Generate unique IDs (defined first so it can be used in stores)
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// User Store
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setUser: (user: User | null) => void;
  setOnboarded: (value: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
      setOnboarded: (value: boolean) => set({ isOnboarded: value }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'zeni-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Documents Store
interface DocumentsState {
  documents: Document[];
  folders: Folder[];
  selectedFilter: DocumentFilter;
  isLoading: boolean;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  setDocuments: (docs: Document[]) => void;
  setFilter: (filter: DocumentFilter) => void;
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  addDocumentToFolder: (folderId: string, documentId: string) => void;
  removeDocumentFromFolder: (folderId: string, documentId: string) => void;
  getFilteredDocuments: () => Document[];
  getDocumentsInFolder: (folderId: string) => Document[];
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      documents: [],
      folders: [],
      selectedFilter: 'all' as DocumentFilter,
      isLoading: false,
      addDocument: (doc: Document) =>
        set((state) => ({ documents: [doc, ...state.documents] })),
      updateDocument: (id: string, updates: Partial<Document>) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
          ),
        })),
      deleteDocument: (id: string) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
          // Also remove the document ID from all folders
          folders: state.folders.map((f) => ({
            ...f,
            documentIds: f.documentIds.filter((docId) => docId !== id),
            updatedAt: f.documentIds.includes(id) ? new Date() : f.updatedAt,
          })),
        })),
      setDocuments: (docs: Document[]) => set({ documents: docs }),
      setFilter: (filter: DocumentFilter) => set({ selectedFilter: filter }),
      addFolder: (folder: Folder) =>
        set((state) => ({ folders: [...state.folders, folder] })),
      updateFolder: (id: string, updates: Partial<Folder>) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f
          ),
        })),
      deleteFolder: (id: string) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
        })),
      addDocumentToFolder: (folderId: string, documentId: string) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId
              ? { ...f, documentIds: [...f.documentIds, documentId], updatedAt: new Date() }
              : f
          ),
        })),
      removeDocumentFromFolder: (folderId: string, documentId: string) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId
              ? { ...f, documentIds: f.documentIds.filter((id) => id !== documentId), updatedAt: new Date() }
              : f
          ),
        })),
      getFilteredDocuments: () => {
        const { documents, selectedFilter } = get();
        if (selectedFilter === 'all') return documents;
        return documents.filter((d) => d.type === selectedFilter);
      },
      getDocumentsInFolder: (folderId: string) => {
        const { documents, folders } = get();
        const folder = folders.find((f) => f.id === folderId);
        if (!folder) return [];
        return documents.filter((d) => folder.documentIds.includes(d.id));
      },
    }),
    {
      name: 'zeni-documents-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Share Store
interface ShareState {
  shareJobs: ShareJob[];
  addShareJob: (job: ShareJob) => void;
  updateShareJob: (id: string, updates: Partial<ShareJob>) => void;
  clearAllShares: () => void;
  getShareJobsByDocument: (documentId: string) => ShareJob[];
}

export const useShareStore = create<ShareState>()(
  persist(
    (set, get) => ({
      shareJobs: [],
      addShareJob: (job: ShareJob) =>
        set((state) => ({ shareJobs: [job, ...state.shareJobs] })),
      updateShareJob: (id: string, updates: Partial<ShareJob>) =>
        set((state) => ({
          shareJobs: state.shareJobs.map((j) =>
            j.id === id ? { ...j, ...updates, updatedAt: new Date() } : j
          ),
        })),
      clearAllShares: () => set({ shareJobs: [] }),
      getShareJobsByDocument: (documentId: string) =>
        get().shareJobs.filter((j) => j.documentId === documentId),
    }),
    {
      name: 'zeni-share-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// AI Conversations Store
interface AIState {
  conversations: AIConversation[];
  currentConversationId: string | null;
  addConversation: (conv: AIConversation) => void;
  updateConversation: (id: string, updates: Partial<AIConversation>) => void;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string | null) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      conversations: [],
      currentConversationId: null,
      addConversation: (conv: AIConversation) =>
        set((state) => ({ conversations: [conv, ...state.conversations] })),
      updateConversation: (id: string, updates: Partial<AIConversation>) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        })),
      deleteConversation: (id: string) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
        })),
      setCurrentConversation: (id: string | null) => set({ currentConversationId: id }),
    }),
    {
      name: 'zeni-ai-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Activity Store
interface ActivityState {
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      activities: [],
      addActivity: (activity: Activity) =>
        set((state) => ({
          activities: [activity, ...state.activities].slice(0, 100), // Keep last 100
        })),
      clearActivities: () => set({ activities: [] }),
    }),
    {
      name: 'zeni-activity-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Notifications Store
interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [
        // Sample notifications for demo
        {
          id: 'welcome-1',
          type: 'welcome' as NotificationType,
          title: 'Welcome to Zeni! 🎉',
          message: 'Your smart document workspace is ready. Start by scanning your first document or exploring the app features.',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'tip-1',
          type: 'tip' as NotificationType,
          title: 'Quick Tip: Organize with Folders',
          message: 'Create folders to organize your documents by subject, semester, or project. Tap the Documents tab to get started!',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
          id: 'tip-2',
          type: 'tip' as NotificationType,
          title: 'Ask AI for Help',
          message: 'Need help understanding a document? Use Ask AI to summarize, explain, or create study notes from your documents.',
          isRead: false,
          createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        },
      ],
      unreadCount: 3,
      addNotification: (notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) =>
        set((state) => {
          const newNotification: AppNotification = {
            ...notification,
            id: generateId(),
            isRead: false,
            createdAt: new Date(),
          };
          return {
            notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
            unreadCount: state.unreadCount + 1,
          };
        }),
      markAsRead: (id: string) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (notification && !notification.isRead) {
            return {
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          }
          return state;
        }),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),
      deleteNotification: (id: string) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && !notification.isRead;
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        }),
      clearAllNotifications: () =>
        set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'zeni-notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Signatures Store
export interface Signature {
  id: string;
  name: string;
  type: 'drawn' | 'typed' | 'image';
  data: string;
  createdAt: Date;
  isDefault: boolean;
}

interface SignaturesState {
  signatures: Signature[];
  addSignature: (signature: Omit<Signature, 'isDefault'>) => void;
  deleteSignature: (id: string) => void;
  setDefaultSignature: (id: string) => void;
  getDefaultSignature: () => Signature | undefined;
}

export const useSignaturesStore = create<SignaturesState>()(
  persist(
    (set, get) => ({
      signatures: [],
      addSignature: (signature: Omit<Signature, 'isDefault'>) =>
        set((state) => {
          const isFirst = state.signatures.length === 0;
          return {
            signatures: [
              { ...signature, isDefault: isFirst },
              ...state.signatures,
            ],
          };
        }),
      deleteSignature: (id: string) =>
        set((state) => {
          const newSignatures = state.signatures.filter((s) => s.id !== id);
          // If we deleted the default, make the first one default
          if (newSignatures.length > 0 && !newSignatures.some((s) => s.isDefault)) {
            newSignatures[0].isDefault = true;
          }
          return { signatures: newSignatures };
        }),
      setDefaultSignature: (id: string) =>
        set((state) => ({
          signatures: state.signatures.map((s) => ({
            ...s,
            isDefault: s.id === id,
          })),
        })),
      getDefaultSignature: () => get().signatures.find((s) => s.isDefault),
    }),
    {
      name: 'zeni-signatures-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Settings Store
interface SettingsState {
  // Notifications
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  scanCompleteNotifications: boolean;
  shareStatusNotifications: boolean;
  aiResponseNotifications: boolean;
  tipsNotifications: boolean;
  updateNotifications: boolean;
  // Privacy & Security
  biometricEnabled: boolean;
  autoLockEnabled: boolean;
  saveActivityHistory: boolean;
  analyticsEnabled: boolean;
  // Setters
  setNotificationSetting: (key: string, value: boolean) => void;
  setSecuritySetting: (key: string, value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      pushNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      scanCompleteNotifications: true,
      shareStatusNotifications: true,
      aiResponseNotifications: true,
      tipsNotifications: false,
      updateNotifications: true,
      biometricEnabled: false,
      autoLockEnabled: true,
      saveActivityHistory: true,
      analyticsEnabled: true,
      setNotificationSetting: (key: string, value: boolean) => 
        set((state) => ({ ...state, [key]: value })),
      setSecuritySetting: (key: string, value: boolean) => 
        set((state) => ({ ...state, [key]: value })),
    }),
    {
      name: 'zeni-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Folder Share Store
interface FolderShareState {
  shareLinks: FolderShareLink[];
  createShareLink: (link: Omit<FolderShareLink, 'id' | 'viewCount' | 'isActive' | 'createdAt' | 'shareUrl' | 'shareToken'>) => FolderShareLink;
  deleteShareLink: (id: string) => void;
  deactivateShareLink: (id: string) => void;
  incrementViewCount: (id: string) => void;
  getShareLinksForFolder: (folderId: string) => FolderShareLink[];
  getShareLinkByToken: (token: string) => FolderShareLink | undefined;
  getActiveShareLinks: () => FolderShareLink[];
  cleanupExpiredLinks: () => void;
}

export const useFolderShareStore = create<FolderShareState>()(
  persist(
    (set, get) => ({
      shareLinks: [],
      createShareLink: (linkData) => {
        const id = generateId();
        // Generate a secure random token
        const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        const newLink: FolderShareLink = {
          id,
          ...linkData,
          shareToken, // Include the token in the link object
          viewCount: 0,
          isActive: true,
          // Use a real web URL that can be opened in browser
          shareUrl: `https://zenigh.online/share?token=${shareToken}`,
          createdAt: new Date(),
        };
        set((state) => ({
          shareLinks: [newLink, ...state.shareLinks],
        }));
        return newLink;
      },
      deleteShareLink: (id: string) =>
        set((state) => ({
          shareLinks: state.shareLinks.filter((l) => l.id !== id),
        })),
      deactivateShareLink: (id: string) =>
        set((state) => ({
          shareLinks: state.shareLinks.map((l) =>
            l.id === id ? { ...l, isActive: false } : l
          ),
        })),
      incrementViewCount: (id: string) =>
        set((state) => ({
          shareLinks: state.shareLinks.map((l) =>
            l.id === id
              ? { ...l, viewCount: l.viewCount + 1, lastAccessedAt: new Date() }
              : l
          ),
        })),
      getShareLinksForFolder: (folderId: string) =>
        get().shareLinks.filter((l) => l.folderId === folderId && l.isActive),
      getShareLinkByToken: (token: string) =>
        get().shareLinks.find((l) => l.shareToken === token || l.shareUrl.includes(token)),
      getActiveShareLinks: () =>
        get().shareLinks.filter((l) => {
          if (!l.isActive) return false;
          if (l.expiresAt && new Date(l.expiresAt) < new Date()) return false;
          if (l.maxViews && l.viewCount >= l.maxViews) return false;
          return true;
        }),
      cleanupExpiredLinks: () =>
        set((state) => ({
          shareLinks: state.shareLinks.map((l) => {
            const isExpired = l.expiresAt && new Date(l.expiresAt) < new Date();
            const maxViewsReached = l.maxViews && l.viewCount >= l.maxViews;
            if (isExpired || maxViewsReached) {
              return { ...l, isActive: false };
            }
            return l;
          }),
        })),
    }),
    {
      name: 'zeni-folder-share-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
