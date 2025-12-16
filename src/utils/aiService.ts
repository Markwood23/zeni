/**
 * Zai - AI Assistant for Zeni
 * Intelligent document analysis and chat powered by OpenAI
 * Full access to user data and app control for comprehensive assistance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Linking } from 'react-native';

const AI_API_KEY_STORAGE = '@zeni_ai_api_key';
// API key should be set by user in app settings or via environment variable
// DO NOT hardcode API keys here
const DEFAULT_API_KEY = '';

export interface AIServiceConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DocumentContext {
  id?: string;
  name: string;
  type: string;
  pagesCount: number;
  content?: string;
  filePath?: string;
  mimeType?: string;
}

// AI Actions that Zai can perform
export type AIActionType = 
  | 'delete_document'
  | 'delete_folder'
  | 'send_email'
  | 'move_to_folder'
  | 'remove_from_folder'
  | 'rename_document'
  | 'rename_folder'
  | 'create_folder'
  | 'create_document'
  | 'duplicate_document'
  | 'send_fax'
  | 'share_document'
  | 'summarize'
  | 'extract_key_points'
  | 'find_deadlines'
  | 'draft_email'
  | 'create_study_guide'
  | 'navigate'
  | 'request_document_selection'
  | 'clear_notifications'
  | 'mark_notifications_read'
  | 'clear_activity_history'
  | 'clear_fax_history'
  | 'update_profile'
  | 'toggle_setting'
  | 'none';

export interface AIAction {
  type: AIActionType;
  params?: {
    documentId?: string;
    documentIds?: string[];
    documentName?: string;
    folderId?: string;
    folderName?: string;
    newName?: string;
    // For creating new documents
    newDocument?: {
      name: string;
      content: string;
      type: 'study_guide' | 'notes' | 'summary' | 'text';
      folderId?: string;
    };
    // For requesting document selection
    selectionPrompt?: string;
    selectionPurpose?: string;
    email?: {
      to: string;
      subject: string;
      body: string;
      attachmentIds?: string[];
    };
    fax?: {
      recipientName: string;
      faxNumber: string;
      documentId: string;
    };
    navigation?: {
      screen: string;
      params?: Record<string, any>;
    };
    // For profile updates
    profileUpdate?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      school?: string;
    };
    // For settings toggle
    setting?: {
      key: string;
      value: boolean;
    };
  };
  confirmationRequired?: boolean;
  confirmationMessage?: string;
}

export interface AIResponse {
  message: string;
  action?: AIAction;
}

// Document content extractor
export async function extractDocumentContent(filePath: string, mimeType?: string): Promise<string> {
  try {
    // For text-based files, read directly
    if (mimeType?.includes('text') || filePath.endsWith('.txt')) {
      const content = await FileSystem.readAsStringAsync(filePath);
      return content.slice(0, 10000); // Limit to 10k characters
    }
    
    // For images, we can describe what we know
    if (mimeType?.startsWith('image/')) {
      return '[Image document - visual content analysis available through OCR]';
    }
    
    // For PDFs, return placeholder (would need PDF parsing library)
    if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
      return '[PDF document - content extraction in progress]';
    }
    
    return '[Document content]';
  } catch (error) {
    console.log('Could not extract document content:', error);
    return '[Unable to read document content]';
  }
}

// Full app context for Zai
export interface FullAppContext {
  // User info
  user?: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    school?: string;
    level?: string;
    accountType: string;
    isPremium?: boolean;
  };
  // Documents
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    pagesCount: number;
    fileSize: number;
    folderId?: string;
    createdAt: Date;
  }>;
  // Folders
  folders?: Array<{
    id: string;
    name: string;
    documentCount: number;
    icon?: string;
  }>;
  // Recent activities
  recentActivities?: Array<{
    type: string;
    title: string;
    createdAt: Date;
  }>;
  // Fax history
  faxHistory?: Array<{
    recipientName: string;
    status: string;
    sentAt?: Date;
  }>;
  // Signatures
  signatures?: Array<{
    id: string;
    type: string;
    createdAt: Date;
  }>;
  // Current document being viewed
  currentDocument?: DocumentContext;
  // App stats
  stats?: {
    totalDocuments: number;
    totalFolders: number;
    totalFaxesSent: number;
    storageUsed: number;
  };
}

class AIService {
  private apiKey: string | null = DEFAULT_API_KEY;
  private model: string = 'gpt-4o';  // Upgraded to GPT-4o for max capabilities
  private maxTokens: number = 4000;  // Increased for longer, more detailed responses
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor() {
    this.loadApiKey();
  }

  private async loadApiKey(): Promise<void> {
    try {
      const key = await AsyncStorage.getItem(AI_API_KEY_STORAGE);
      if (key) {
        this.apiKey = key;
      } else {
        // Use default key if no custom key is set
        this.apiKey = DEFAULT_API_KEY;
      }
    } catch (error) {
      console.log('Failed to load AI API key:', error);
      this.apiKey = DEFAULT_API_KEY;
    }
  }

  async setApiKey(key: string): Promise<void> {
    this.apiKey = key;
    try {
      await AsyncStorage.setItem(AI_API_KEY_STORAGE, key);
    } catch (error) {
      console.log('Failed to save AI API key:', error);
    }
  }

  async clearApiKey(): Promise<void> {
    this.apiKey = null;
    try {
      await AsyncStorage.removeItem(AI_API_KEY_STORAGE);
    } catch (error) {
      console.log('Failed to clear AI API key:', error);
    }
  }

  isConfigured(): boolean {
    return true; // Always configured with default or custom key
  }

  async getApiKey(): Promise<string | null> {
    if (!this.apiKey) {
      await this.loadApiKey();
    }
    return this.apiKey || DEFAULT_API_KEY;
  }

  /**
   * Send a chat completion request to OpenAI with full app context
   */
  async chat(
    messages: ChatMessage[],
    documentContext?: DocumentContext,
    appContext?: FullAppContext
  ): Promise<string> {
    // If no API key, use local fallback
    if (!this.apiKey) {
      return this.generateLocalResponse(messages, documentContext, appContext);
    }

    try {
      // Build system message with full context
      const systemMessage: ChatMessage = {
        role: 'system',
        content: this.buildSystemPrompt(documentContext, appContext),
      };

      const allMessages = [systemMessage, ...messages];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: allMessages,
          max_tokens: this.maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } catch (error: any) {
      console.error('AI API Error:', error);
      
      // If API fails, use local fallback
      if (error.message?.includes('API')) {
        return this.generateLocalResponse(messages, documentContext, appContext);
      }
      
      throw error;
    }
  }

  /**
   * Summarize a document
   */
  async summarizeDocument(documentContext: DocumentContext): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Please provide a comprehensive summary of this document: "${documentContext.name}". 
It has ${documentContext.pagesCount} pages. 
${documentContext.content ? `Content: ${documentContext.content.slice(0, 3000)}` : ''}`,
      },
    ];

    return this.chat(messages, documentContext);
  }

  /**
   * Extract key points from a document
   */
  async extractKeyPoints(documentContext: DocumentContext): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Extract and list the key points from this document: "${documentContext.name}".
Format them as a numbered list with clear, concise bullet points.`,
      },
    ];

    return this.chat(messages, documentContext);
  }

  /**
   * Find dates and deadlines in a document
   */
  async findDates(documentContext: DocumentContext): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Search for and list all dates, deadlines, and time-sensitive information in this document: "${documentContext.name}".
Format the results chronologically.`,
      },
    ];

    return this.chat(messages, documentContext);
  }

  private buildSystemPrompt(documentContext?: DocumentContext, appContext?: FullAppContext): string {
    const userName = appContext?.user?.firstName || 'there';
    const userSchool = appContext?.user?.school;
    const accountType = appContext?.user?.accountType || 'standard';
    
    let prompt = `You are Zai, an intelligent and powerful AI assistant built into the Zeni app - a smart document workspace for students and professionals.

🔥 YOU HAVE FULL ACCESS AND CONTROL OF THE USER'S APP. You can read document content, delete files, send emails, organize folders, and much more.

User Profile:
- Name: ${userName}${appContext?.user?.lastName ? ' ' + appContext.user.lastName : ''}
${appContext?.user?.email ? `- Email: ${appContext.user.email}` : ''}
${userSchool ? `- School/Institution: ${userSchool}` : ''}
${appContext?.user?.level ? `- Level: ${appContext.user.level}` : ''}
- Account Type: ${accountType}
${appContext?.user?.isPremium ? '- Premium User ✨' : ''}

Your personality:
- Warm, helpful, and encouraging - address the user by their first name
- Explain things clearly and simply
- Use emojis sparingly but appropriately to be friendly
- Be concise but thorough
- Be proactive in offering relevant help and taking action when asked

🚀 YOUR FULL ACTION CAPABILITIES:

**Document Actions:**
- DELETE documents when user asks (requires confirmation)
- MOVE documents to folders
- RENAME documents
- Share documents
- Read and analyze document content

**Email Actions:**
- DRAFT and SEND emails with or without attachments
- Compose professional emails based on document content
- Send documents as email attachments

**Fax Actions:**
- SEND faxes to any fax number
- Help compose fax cover pages
- CLEAR fax history (requires confirmation)

**Organization Actions:**
- CREATE new folders
- DELETE folders (requires confirmation)
- RENAME folders
- Move multiple documents at once
- REMOVE documents from folders (make unfiled)
- DUPLICATE documents (make copies)
- Suggest and implement organization strategies

**Analysis Actions:**
- Summarize any document
- Extract key points
- Find all deadlines across documents
- Create study guides
- Explain complex concepts

**Profile & Settings Actions:**
- UPDATE user profile (name, email, phone, school)
- TOGGLE app settings (biometric login, auto-lock, analytics, etc.)
- CLEAR notifications or mark all as read
- CLEAR activity history (requires confirmation)

**Navigation Actions:**
- Open specific screens or documents for the user

⚡ ACTION RESPONSE FORMAT:
When the user asks you to perform an action (delete, send email, move, create document, etc.), include this JSON block at the END of your response:

\`\`\`action
{
  "type": "action_type",
  "params": { /* action parameters */ },
  "confirmationRequired": true,
  "confirmationMessage": "Are you sure you want to..."
}
\`\`\`

Action Types:
- "delete_document" - params: { documentId, documentName }
- "delete_folder" - params: { folderId, folderName } - REQUIRES CONFIRMATION
- "send_email" - params: { email: { to, subject, body, attachmentIds? } }
- "move_to_folder" - params: { documentId, folderId, folderName }
- "remove_from_folder" - params: { documentId, folderId } - Remove document from folder (unfiled)
- "rename_document" - params: { documentId, newName }
- "rename_folder" - params: { folderId, newName }
- "create_folder" - params: { folderName }
- "create_document" - params: { newDocument: { name, content, type: "study_guide"|"notes"|"summary"|"text", folderId? } }
- "duplicate_document" - params: { documentId, documentName } - Make a copy
- "send_fax" - params: { fax: { recipientName, faxNumber, documentId } }
- "navigate" - params: { navigation: { screen, params? } }
- "request_document_selection" - params: { selectionPrompt, selectionPurpose } - USE THIS when user wants to work on a document but hasn't specified which one
- "clear_notifications" - Clear all notifications - REQUIRES CONFIRMATION
- "mark_notifications_read" - Mark all notifications as read
- "clear_activity_history" - Clear activity history - REQUIRES CONFIRMATION
- "clear_fax_history" - Clear all fax history - REQUIRES CONFIRMATION
- "update_profile" - params: { profileUpdate: { firstName?, lastName?, email?, phone?, school? } }
- "toggle_setting" - params: { setting: { key, value } } - Toggle app settings like "biometricEnabled", "autoLockEnabled", "analyticsEnabled"

📝 CREATING DOCUMENTS:
You can CREATE new documents like study guides, summaries, notes, etc. and save them to folders!
When creating a document, generate the FULL content in the "content" field.
Example for creating a study guide:
\`\`\`action
{
  "type": "create_document",
  "params": {
    "newDocument": {
      "name": "Biology Chapter 5 Study Guide",
      "content": "STUDY GUIDE: Biology Chapter 5\\n\\n1. Key Concepts\\n- Cell structure...\\n\\n2. Important Terms\\n- Mitochondria: ...",
      "type": "study_guide",
      "folderId": "folder-id-here"
    }
  },
  "confirmationRequired": true,
  "confirmationMessage": "Create study guide 'Biology Chapter 5 Study Guide'?"
}
\`\`\`

🔍 REQUESTING DOCUMENT SELECTION:
When user wants to work on a document but doesn't specify which one, use request_document_selection to show them a picker:
\`\`\`action
{
  "type": "request_document_selection",
  "params": {
    "selectionPrompt": "Which document would you like me to summarize?",
    "selectionPurpose": "summarize"
  }
}
\`\`\`

IMPORTANT RULES:
1. For DESTRUCTIVE actions (delete), ALWAYS set confirmationRequired: true
2. Reference actual document IDs and names from the context
3. If user asks to work on a document but doesn't specify which, use request_document_selection
4. When creating study guides/summaries, generate REAL, USEFUL content based on document info
5. You can reference their specific documents, folders, and activities by name and ID`;

    // Add app statistics
    if (appContext?.stats) {
      prompt += `\n\nUser's Workspace Stats:
- Total Documents: ${appContext.stats.totalDocuments}
- Total Folders: ${appContext.stats.totalFolders}
- Faxes Sent: ${appContext.stats.totalFaxesSent}
- Storage Used: ${(appContext.stats.storageUsed / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Add documents context with IDs for action reference
    if (appContext?.documents && appContext.documents.length > 0) {
      prompt += `\n\nUser's Documents (${appContext.documents.length} total):`;
      appContext.documents.slice(0, 15).forEach((doc, i) => {
        const folderInfo = doc.folderId ? ` [in folder]` : ` [unfiled]`;
        prompt += `\n${i + 1}. ID:"${doc.id}" - "${doc.name}" (${doc.type}, ${doc.pagesCount} pages)${folderInfo}`;
      });
      if (appContext.documents.length > 15) {
        prompt += `\n... and ${appContext.documents.length - 15} more documents`;
      }
    }

    // Add folders context with IDs
    if (appContext?.folders && appContext.folders.length > 0) {
      prompt += `\n\nUser's Folders (${appContext.folders.length} total):`;
      appContext.folders.forEach((folder, i) => {
        prompt += `\n${i + 1}. ID:"${folder.id}" - "${folder.name}" ${folder.icon || '📁'} (${folder.documentCount} documents)`;
      });
    }

    // Add recent activities
    if (appContext?.recentActivities && appContext.recentActivities.length > 0) {
      prompt += `\n\nRecent Activities:`;
      appContext.recentActivities.slice(0, 5).forEach((activity, i) => {
        prompt += `\n- ${activity.type}: ${activity.title}`;
      });
    }

    // Add fax history
    if (appContext?.faxHistory && appContext.faxHistory.length > 0) {
      prompt += `\n\nRecent Fax History:`;
      appContext.faxHistory.slice(0, 5).forEach((fax, i) => {
        prompt += `\n- To: ${fax.recipientName} (${fax.status})`;
      });
    }

    // Add signatures
    if (appContext?.signatures && appContext.signatures.length > 0) {
      prompt += `\n\nSaved Signatures: ${appContext.signatures.length} signature(s)`;
    }

    // Add current document context
    if (documentContext) {
      prompt += `\n\n📄 CURRENTLY VIEWING DOCUMENT:
- Name: ${documentContext.name}
- Type: ${documentContext.type}
- Pages: ${documentContext.pagesCount}
${documentContext.content ? `\nDocument Content Preview:\n${documentContext.content.slice(0, 2000)}` : ''}`;
    }

    prompt += `\n\n📝 RESPONSE FORMATTING RULES:
- Keep responses clean and easy to read
- Use simple bullet points with - or • (NOT asterisks like **)
- For numbered lists, use "1." "2." format
- Section headers should be on their own line, just the title (no ** around them)
- Use emojis at the START of headers/sections for visual appeal
- Keep paragraphs short (2-3 sentences max)
- Be conversational and friendly
- DON'T use excessive markdown like ### or multiple asterisks
- DON'T use code blocks for regular text

Example good format:
Hey ${userName}! Here's what I found:

📋 Your Documents
- Resume.pdf (3 pages)
- Notes.pdf (5 pages)

✨ Suggestions
1. Organize your files into folders
2. Update your resume

Let me know how I can help!

Always be supportive and reference the user's actual data when relevant.`;

    return prompt;
  }

  /**
   * Generate intelligent local responses when API is not available
   */
  private generateLocalResponse(
    messages: ChatMessage[],
    documentContext?: DocumentContext,
    appContext?: FullAppContext
  ): string {
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content?.toLowerCase() || '';
    const userName = appContext?.user?.firstName || 'there';

    // Document-specific responses
    if (documentContext) {
      if (userMessage.includes('summar')) {
        return `📄 Summary of "${documentContext.name}"

Hey ${userName}! Based on my analysis of this ${documentContext.pagesCount}-page document, here are the key takeaways:

Main Points
1. The document covers important information related to ${documentContext.type} content
2. Key sections include introduction, main body, and conclusion
3. Relevant details are organized throughout the document

Recommendations
- Review the highlighted sections for critical information
- Note any dates or deadlines mentioned
- Consider the main arguments and supporting evidence

Would you like me to help you with extracting specific information, finding dates and deadlines, or creating a study guide?`;
      }

      if (userMessage.includes('deadline') || userMessage.includes('date')) {
        return `📅 Dates & Deadlines in "${documentContext.name}"

Hey ${userName}! I've analyzed the document for time-sensitive information.

To use this feature fully
1. Set up an OpenAI API key in Settings
2. The AI will then extract actual dates from your document content

Manual Review Tips
- Check headers and footers for dates
- Look for keywords like "due", "deadline", "by", "until"
- Review any schedule or timeline sections

Would you like help setting up the AI integration?`;
      }

      if (userMessage.includes('key point') || userMessage.includes('main')) {
        return `📌 Key Points from "${documentContext.name}"

To extract detailed key points from your document:

Setup Required
This feature works best with an OpenAI API key configured.

What you can do now
1. Use the Edit tools to highlight important sections
2. Add text annotations for quick notes
3. Export and share the annotated document

Would you like instructions on setting up AI-powered document analysis?`;
      }
    }

    // Writing help
    if (userMessage.includes('email') || userMessage.includes('write')) {
      return `✍️ Professional Email Template

Hey ${userName}! Here's a structure to help you write effectively:

Subject Line
Use a clear, action-oriented subject

Email Structure
1. Opening - Brief greeting and context
2. Body - Main point or request with supporting details
3. Closing - Clear call-to-action or next steps

Tips
- Keep it concise (5-7 sentences ideal)
- Use bullet points for multiple items
- Proofread before sending

Would you like me to help customize this for a specific purpose?`;
    }

    // Study help
    if (userMessage.includes('study') || userMessage.includes('learn') || userMessage.includes('revise')) {
      return `📚 Study & Learning Assistance

Hey ${userName}! I can help you study more effectively.

Available Tools
1. Document Analysis - Summarize your study materials
2. Key Points - Extract important concepts
3. Deadline Tracking - Find assignment due dates
4. Note Organization - Structure your notes

Study Tips
- Break documents into smaller sections
- Use the Edit tools to annotate key points
- Create question-answer flashcards
- Review summaries before exams

What subject or topic would you like help with?`;
    }

    // Explain/clarify
    if (userMessage.includes('explain') || userMessage.includes('what is') || userMessage.includes('how')) {
      return `🎓 Explanation Mode

Hey ${userName}! I'd be happy to explain any concept!

For document content
1. Attach the relevant document
2. Quote the specific text you need explained
3. Tell me your current understanding

For general topics
Just ask your question clearly, and I'll break it down into simple terms.

What would you like me to explain?`;
    }

    // Get user's stats
    const docCount = appContext?.stats?.totalDocuments || 0;
    const folderCount = appContext?.stats?.totalFolders || 0;

    // Default helpful response - personalized
    let response = `👋 Hey ${userName}! I'm Zai

I'm your AI assistant in Zeni, and I have access to your entire workspace to help you better!`;

    if (docCount > 0 || folderCount > 0) {
      response += `

📊 Your Workspace
- ${docCount} document${docCount !== 1 ? 's' : ''}
- ${folderCount} folder${folderCount !== 1 ? 's' : ''}`;
    }

    response += `

What I can help you with

📄 Document Analysis
- Summarize any of your documents
- Extract key points and highlights
- Find deadlines across all docs

✍️ Writing Assistance
- Draft professional emails
- Improve your writing
- Format documents properly

📚 Study Support
- Create study guides from your materials
- Explain complex concepts
- Help organize your notes

🔍 Workspace Insights
- Find documents by content
- Suggest folder organization
- Track your recent activity

🚀 Try asking me
- "What documents do I have?"
- "Summarize my most recent document"
- "Help me organize my folders"
- "What did I work on recently?"

What can I help you with today?`;

    return response;
  }
}

// Export singleton instance
export const aiService = new AIService();

/**
 * Parse AI response to extract action block
 */
export function parseAIResponse(response: string): AIResponse {
  // Look for action JSON block in the response
  const actionBlockRegex = /```action\s*([\s\S]*?)\s*```/;
  const match = response.match(actionBlockRegex);
  
  let action: AIAction | undefined;
  let message = response;
  
  if (match && match[1]) {
    try {
      action = JSON.parse(match[1].trim());
      // Remove the action block from the message
      message = response.replace(actionBlockRegex, '').trim();
    } catch (e) {
      console.log('Failed to parse action block:', e);
    }
  }
  
  return { message, action };
}

/**
 * Execute an AI action
 * This function is meant to be called from the UI with access to stores
 */
export interface ActionExecutor {
  deleteDocument: (id: string) => void;
  deleteFolder: (id: string) => void;
  moveToFolder: (documentId: string, folderId: string) => void;
  removeFromFolder: (documentId: string, folderId: string) => void;
  renameDocument: (documentId: string, newName: string) => void;
  renameFolder: (folderId: string, newName: string) => void;
  createFolder: (name: string, icon?: string) => string;
  createDocument: (name: string, content: string, type: string, folderId?: string) => string;
  duplicateDocument: (documentId: string) => string | null;
  sendEmail: (to: string, subject: string, body: string, attachments?: string[]) => Promise<boolean>;
  sendFax: (recipientName: string, faxNumber: string, documentId: string) => void;
  navigate: (screen: string, params?: Record<string, any>) => void;
  addNotification: (notification: any) => void;
  addActivity: (activity: any) => void;
  showDocumentPicker: (prompt: string, purpose: string) => void;
  // New actions
  clearNotifications: () => void;
  markAllNotificationsRead: () => void;
  clearActivityHistory: () => void;
  clearFaxHistory: () => void;
  updateProfile: (updates: { firstName?: string; lastName?: string; email?: string; phone?: string; school?: string }) => void;
  toggleSetting: (key: string, value: boolean) => void;
}

export async function executeAction(
  action: AIAction,
  executor: ActionExecutor,
  getDocument?: (id: string) => any
): Promise<{ success: boolean; message: string }> {
  try {
    switch (action.type) {
      case 'delete_document':
        if (action.params?.documentId) {
          executor.deleteDocument(action.params.documentId);
          executor.addActivity({
            id: Date.now().toString(),
            type: 'deleted',
            title: `Deleted "${action.params.documentName || 'document'}"`,
            subtitle: 'Deleted by Zai',
            timestamp: new Date().toISOString(),
            icon: 'trash-outline',
          });
          return { success: true, message: `Successfully deleted "${action.params.documentName || 'document'}"` };
        }
        return { success: false, message: 'No document ID provided' };

      case 'create_document':
        if (action.params?.newDocument) {
          const { name, content, type, folderId } = action.params.newDocument;
          const docId = executor.createDocument(name, content, type, folderId);
          executor.addActivity({
            id: Date.now().toString(),
            type: 'created',
            title: `Created "${name}"`,
            subtitle: 'Created by Zai',
            timestamp: new Date().toISOString(),
            icon: 'document-text-outline',
          });
          executor.addNotification({
            id: Date.now().toString(),
            type: 'system',
            title: 'Document Created',
            message: `Zai created: "${name}"`,
            createdAt: new Date().toISOString(),
            read: false,
          });
          return { success: true, message: `Created "${name}" successfully!` };
        }
        return { success: false, message: 'No document details provided' };

      case 'request_document_selection':
        if (action.params?.selectionPrompt) {
          executor.showDocumentPicker(
            action.params.selectionPrompt,
            action.params.selectionPurpose || 'select'
          );
          return { success: true, message: 'Please select a document from the list below' };
        }
        return { success: false, message: 'No selection prompt provided' };

      case 'move_to_folder':
        if (action.params?.documentId && action.params?.folderId) {
          executor.moveToFolder(action.params.documentId, action.params.folderId);
          executor.addActivity({
            id: Date.now().toString(),
            type: 'moved',
            title: `Moved document to "${action.params.folderName || 'folder'}"`,
            subtitle: 'Organized by Zai',
            timestamp: new Date().toISOString(),
            icon: 'folder-outline',
          });
          return { success: true, message: `Successfully moved to "${action.params.folderName || 'folder'}"` };
        }
        return { success: false, message: 'Missing document or folder ID' };

      case 'rename_document':
        if (action.params?.documentId && action.params?.newName) {
          executor.renameDocument(action.params.documentId, action.params.newName);
          return { success: true, message: `Successfully renamed to "${action.params.newName}"` };
        }
        return { success: false, message: 'Missing document ID or new name' };

      case 'rename_folder':
        if (action.params?.folderId && action.params?.newName) {
          executor.renameFolder(action.params.folderId, action.params.newName);
          return { success: true, message: `Folder renamed to "${action.params.newName}"` };
        }
        return { success: false, message: 'Missing folder ID or new name' };

      case 'delete_folder':
        if (action.params?.folderId) {
          executor.deleteFolder(action.params.folderId);
          executor.addActivity({
            id: Date.now().toString(),
            type: 'deleted',
            title: `Deleted folder "${action.params.folderName || 'folder'}"`,
            subtitle: 'Deleted by Zai',
            timestamp: new Date().toISOString(),
            icon: 'trash-outline',
          });
          return { success: true, message: `Folder "${action.params.folderName || ''}" deleted` };
        }
        return { success: false, message: 'No folder ID provided' };

      case 'create_folder':
        if (action.params?.folderName) {
          const folderId = executor.createFolder(action.params.folderName);
          executor.addNotification({
            id: Date.now().toString(),
            type: 'system',
            title: 'Folder Created',
            message: `Zai created a new folder: "${action.params.folderName}"`,
            createdAt: new Date().toISOString(),
            read: false,
          });
          return { success: true, message: `Created folder "${action.params.folderName}"` };
        }
        return { success: false, message: 'No folder name provided' };

      case 'send_email':
        if (action.params?.email) {
          const { to, subject, body, attachmentIds } = action.params.email;
          const success = await executor.sendEmail(to, subject, body, attachmentIds);
          if (success) {
            executor.addActivity({
              id: Date.now().toString(),
              type: 'shared',
              title: `Sent email to ${to}`,
              subtitle: subject,
              timestamp: new Date().toISOString(),
              icon: 'mail-outline',
            });
          }
          return { success, message: success ? 'Email composer opened' : 'Failed to open email composer' };
        }
        return { success: false, message: 'No email details provided' };

      case 'send_fax':
        if (action.params?.fax) {
          const { recipientName, faxNumber, documentId } = action.params.fax;
          executor.sendFax(recipientName, faxNumber, documentId);
          return { success: true, message: `Fax queued to ${recipientName}` };
        }
        return { success: false, message: 'No fax details provided' };

      case 'navigate':
        if (action.params?.navigation) {
          const { screen, params } = action.params.navigation;
          executor.navigate(screen, params);
          return { success: true, message: `Navigating to ${screen}` };
        }
        return { success: false, message: 'No navigation target provided' };

      case 'remove_from_folder':
        if (action.params?.documentId && action.params?.folderId) {
          executor.removeFromFolder(action.params.documentId, action.params.folderId);
          return { success: true, message: 'Document removed from folder' };
        }
        return { success: false, message: 'Missing document or folder ID' };

      case 'duplicate_document':
        if (action.params?.documentId) {
          const newId = executor.duplicateDocument(action.params.documentId);
          if (newId) {
            executor.addActivity({
              id: Date.now().toString(),
              type: 'created',
              title: `Duplicated "${action.params.documentName || 'document'}"`,
              subtitle: 'Copied by Zai',
              timestamp: new Date().toISOString(),
              icon: 'copy-outline',
            });
            return { success: true, message: `Document duplicated successfully` };
          }
          return { success: false, message: 'Failed to duplicate document' };
        }
        return { success: false, message: 'No document ID provided' };

      case 'clear_notifications':
        executor.clearNotifications();
        return { success: true, message: 'All notifications cleared' };

      case 'mark_notifications_read':
        executor.markAllNotificationsRead();
        return { success: true, message: 'All notifications marked as read' };

      case 'clear_activity_history':
        executor.clearActivityHistory();
        return { success: true, message: 'Activity history cleared' };

      case 'clear_fax_history':
        executor.clearFaxHistory();
        return { success: true, message: 'Fax history cleared' };

      case 'update_profile':
        if (action.params?.profileUpdate) {
          executor.updateProfile(action.params.profileUpdate);
          return { success: true, message: 'Profile updated successfully' };
        }
        return { success: false, message: 'No profile updates provided' };

      case 'toggle_setting':
        if (action.params?.setting) {
          const { key, value } = action.params.setting;
          executor.toggleSetting(key, value);
          return { success: true, message: `Setting "${key}" ${value ? 'enabled' : 'disabled'}` };
        }
        return { success: false, message: 'No setting provided' };

      default:
        return { success: false, message: `Unknown action type: ${action.type}` };
    }
  } catch (error: any) {
    console.error('Action execution error:', error);
    return { success: false, message: error.message || 'Failed to execute action' };
  }
}

/**
 * Send email using the device's email client via mailto
 */
export async function sendEmailWithMailComposer(
  to: string,
  subject: string,
  body: string,
  attachments?: string[]
): Promise<boolean> {
  try {
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    
    if (canOpen) {
      await Linking.openURL(mailtoUrl);
      return true;
    } else {
      console.error('Cannot open mailto URL');
      return false;
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export default aiService;
