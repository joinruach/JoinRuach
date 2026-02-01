/**
 * Type definitions for Ruach AI Assistant components
 */

/**
 * Assistant conversation modes that affect response style and suggestions
 */
export type AssistantMode = 'Q&A' | 'Study Guide' | 'Sermon Prep';

/**
 * Scripture citation from the Bible
 */
export interface ScriptureCitation {
  type: 'scripture';
  book: string; // e.g., "Romans", "John", "Psalm"
  chapter: number;
  verse: number;
  text: string; // Full verse text
  translation?: string; // e.g., "NIV", "ESV", "NKJV"
}

/**
 * Library citation from books or resources
 */
export interface LibraryCitation {
  type: 'library';
  title: string; // Book title
  author: string; // Author name
  page?: number; // Single page reference
  pages?: string; // Page range e.g., "45-47"
  excerpt?: string; // Quote from the source
  url?: string; // Link to source
}

/**
 * Union type for all citation types
 */
export type Citation = ScriptureCitation | LibraryCitation;

/**
 * Quality score for an assistant response
 */
export interface QualityScore {
  citationCoverage: number; // 0-100: percentage of claims with citations
  guardrailCompliance: number; // 0-100: adherence to theological guardrails
  timestamp?: string;
}

/**
 * Single message in a conversation
 */
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  qualityScore?: QualityScore;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Request payload for assistant API
 */
export interface AssistantRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  mode?: AssistantMode;
  streaming?: boolean;
  userId?: string | number;
  userEmail?: string;
}

/**
 * Response from assistant API
 */
export interface AssistantResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  message?: string;
  citations?: Citation[];
  qualityScore?: QualityScore;
  metadata?: {
    userId?: string | number;
    timestamp?: string;
    processingTime?: number;
  };
}

/**
 * Session state for saving conversations
 */
export interface AssistantSession {
  id: string;
  title: string;
  mode: AssistantMode;
  messages: AssistantMessage[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata?: {
    tags?: string[];
    topic?: string;
    noteCount?: number;
  };
}

/**
 * Component props for RuachAssistantPanel
 */
export interface RuachAssistantPanelProps {
  onClose: () => void;
}

/**
 * Settings for the assistant
 */
export interface AssistantSettings {
  mode: AssistantMode;
  autoSave: boolean;
  showQualityScores: boolean;
  expandCitationsByDefault: boolean;
  enableStreaming: boolean;
  maxHistoryLength: number;
  theme: 'light' | 'dark' | 'auto';
}

/**
 * Error response from API
 */
export interface AssistantError {
  error: string;
  code?: string;
  details?: string;
  timestamp?: string;
  retryable?: boolean;
}

/**
 * Notification for user feedback
 */
export interface Toast {
  id?: number;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
  duration?: number;
}

/**
 * Citation formatting options
 */
export interface CitationFormat {
  format: 'APA' | 'MLA' | 'Chicago' | 'Bible';
  includeAccess?: boolean;
  includeDate?: boolean;
}

/**
 * Extended session with statistics
 */
export interface SessionWithStats extends AssistantSession {
  stats: {
    messageCount: number;
    questionCount: number;
    responseCount: number;
    averageResponseLength: number;
    totalCitations: number;
    averageQualityScore: number;
    estimatedReadingTime: number; // in minutes
  };
}

/**
 * User preferences for assistant
 */
export interface UserPreferences {
  userId: string;
  preferredMode: AssistantMode;
  enableNotifications: boolean;
  enableAutoSave: boolean;
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  savedSessionLimit: number;
}
