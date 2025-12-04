import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Document, Folder, FaxJob, AIConversation, Activity, DocumentFilter, AppNotification, NotificationType } from '../types';

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
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setOnboarded: (value) => set({ isOnboarded: value }),
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
      selectedFilter: 'all',
      isLoading: false,
      addDocument: (doc) =>
        set((state) => ({ documents: [doc, ...state.documents] })),
      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
          ),
        })),
      deleteDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),
      setDocuments: (docs) => set({ documents: docs }),
      setFilter: (filter) => set({ selectedFilter: filter }),
      addFolder: (folder) =>
        set((state) => ({ folders: [...state.folders, folder] })),
      updateFolder: (id, updates) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f
          ),
        })),
      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
        })),
      addDocumentToFolder: (folderId, documentId) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId
              ? { ...f, documentIds: [...f.documentIds, documentId], updatedAt: new Date() }
              : f
          ),
        })),
      removeDocumentFromFolder: (folderId, documentId) =>
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
      getDocumentsInFolder: (folderId) => {
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

// Fax Store
interface FaxState {
  faxJobs: FaxJob[];
  addFaxJob: (job: FaxJob) => void;
  updateFaxJob: (id: string, updates: Partial<FaxJob>) => void;
  getFaxJobsByDocument: (documentId: string) => FaxJob[];
}

export const useFaxStore = create<FaxState>()(
  persist(
    (set, get) => ({
      faxJobs: [],
      addFaxJob: (job) =>
        set((state) => ({ faxJobs: [job, ...state.faxJobs] })),
      updateFaxJob: (id, updates) =>
        set((state) => ({
          faxJobs: state.faxJobs.map((j) =>
            j.id === id ? { ...j, ...updates, updatedAt: new Date() } : j
          ),
        })),
      getFaxJobsByDocument: (documentId) =>
        get().faxJobs.filter((j) => j.documentId === documentId),
    }),
    {
      name: 'zeni-fax-storage',
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
      addConversation: (conv) =>
        set((state) => ({ conversations: [conv, ...state.conversations] })),
      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        })),
      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
        })),
      setCurrentConversation: (id) => set({ currentConversationId: id }),
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
      addActivity: (activity) =>
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
    (set, get) => ({
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
      addNotification: (notification) =>
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
      markAsRead: (id) =>
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
      deleteNotification: (id) =>
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

// Generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
