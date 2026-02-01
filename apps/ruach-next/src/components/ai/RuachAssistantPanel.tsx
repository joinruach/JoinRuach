'use client';

import { useChat } from '@ai-sdk/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ruach/toast/useToast';
import { CitationCard, type Citation } from './CitationCard';

type AssistantMode = 'Q&A' | 'Study Guide' | 'Sermon Prep';

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  qualityScore?: {
    citationCoverage: number; // 0-100
    guardrailCompliance: number; // 0-100
  };
}

export default function RuachAssistantPanel({ onClose }: { onClose: () => void }) {
  const { messages: uiMessages, sendMessage, status, error: chatError } = useChat({
    api: '/api/assistant',
  } as any);

  const { toast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AssistantMode>('Q&A');
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const [sessionHistory, setSessionHistory] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const isLoading = status === 'streaming' || status === 'submitted';

  // Prepare messages for display
  const simplifiedMessages = useMemo(
    () =>
      uiMessages.map((message) => {
        const text = message.parts
          .map((part) => {
            const partText = (part as { text?: string }).text;
            if (typeof partText === 'string') return partText;
            const partUrl = (part as { url?: string }).url;
            if (typeof partUrl === 'string') return `[Attachment] ${partUrl}`;
            return '';
          })
          .filter(Boolean)
          .join('\n');

        return {
          id: message.id,
          role: message.role,
          content: text,
          // Parse citations from metadata if available
          citations: (message as any).metadata?.citations || [],
          qualityScore: (message as any).metadata?.qualityScore,
        } as AssistantMessage;
      }),
    [uiMessages]
  );

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      try {
        await sendMessage({
          role: 'user',
          parts: [
            {
              type: 'text',
              text: `[Mode: ${mode}]\n\n${trimmed}`,
            },
          ],
        });

        // Add to session history
        setSessionHistory((prev) => [
          ...prev,
          `${new Date().toLocaleTimeString()}: ${trimmed}`,
        ]);
      } catch (err) {
        console.error('Failed to send chat message:', err);
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'error',
        });
      }
    },
    [sendMessage, mode, toast]
  );

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  }, []);

  const handleFormSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;
      await sendUserMessage(trimmed);
      setInput('');
    },
    [input, sendUserMessage]
  );

  const handleSuggestionClick = useCallback(
    (prompt: string) => {
      void sendUserMessage(prompt);
    },
    [sendUserMessage]
  );

  const toggleCitationExpansion = useCallback((citationId: string) => {
    setExpandedCitations((prev) => {
      const next = new Set(prev);
      if (next.has(citationId)) {
        next.delete(citationId);
      } else {
        next.add(citationId);
      }
      return next;
    });
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simplifiedMessages]);

  // Close shortcut: Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const error = chatError;

  const getSuggestionsByMode = () => {
    const suggestions: Record<AssistantMode, string[]> = {
      'Q&A': [
        'What is the biblical view on prayer?',
        'Explain the Gospel message',
        'What does the Bible say about faith?',
      ],
      'Study Guide': [
        'Create a study guide on Romans 8',
        'Explain the Beatitudes with study questions',
        'Design a small group study on discipleship',
      ],
      'Sermon Prep': [
        'Outline a sermon on John 3:16',
        'Create a devotional message on Psalm 23',
        'Develop a teaching series on the Fruit of the Spirit',
      ],
    };
    return suggestions[mode] || suggestions['Q&A'];
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[420px] flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl dark:border-white/10 dark:from-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <h3 className="font-semibold text-white">Ruach AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Settings"
            title="Settings"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close assistant"
            title="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-white/10 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Assistant Mode
            </label>
            <div className="flex gap-2">
              {(['Q&A', 'Study Guide', 'Sermon Prep'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    mode === m
                      ? 'bg-amber-500 text-white'
                      : 'border border-white/10 text-white/60 hover:bg-white/5'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-white/50">
            {mode === 'Q&A' && 'Get quick answers to biblical and theological questions'}
            {mode === 'Study Guide' && 'Create comprehensive study materials and resources'}
            {mode === 'Sermon Prep' && 'Develop sermon outlines and teaching content'}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {simplifiedMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-amber-500/10 p-4">
              <svg className="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-lg font-semibold text-white">How can I help you today?</h4>
            <p className="mb-6 text-sm text-white/60">
              {mode === 'Q&A' && 'Ask about Scripture, theology, or spiritual topics'}
              {mode === 'Study Guide' && 'I can create study guides and learning materials'}
              {mode === 'Sermon Prep' && 'I can help you develop sermons and teaching content'}
            </p>
            <div className="w-full space-y-2">
              {getSuggestionsByMode().map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full rounded-lg border border-white/10 p-3 text-left text-sm text-white/80 transition-colors hover:bg-white/5"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {simplifiedMessages.map((msg, idx) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%]">
                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>

                  {/* Quality Score Badge */}
                  {msg.qualityScore && msg.role === 'assistant' && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        <span>
                          Citations: {msg.qualityScore.citationCoverage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        <span>
                          Guardrail: {msg.qualityScore.guardrailCompliance}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && msg.role === 'assistant' && (
                    <div className="mt-3 space-y-1">
                      <button
                        onClick={() => toggleCitationExpansion(msg.id)}
                        className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {expandedCitations.has(msg.id)
                          ? `Hide ${msg.citations.length} citation${msg.citations.length !== 1 ? 's' : ''}`
                          : `Show ${msg.citations.length} citation${msg.citations.length !== 1 ? 's' : ''}`}
                      </button>
                      {expandedCitations.has(msg.id) && (
                        <div className="mt-2 space-y-2">
                          {msg.citations.map((citation, citationIdx) => (
                            <CitationCard
                              key={`${msg.id}-${citationIdx}`}
                              citation={citation}
                              index={citationIdx}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/10 px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/60 [animation-delay:0.2s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/60 [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {chatError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <p className="font-semibold">Error</p>
            <p>{chatError.message || 'Something went wrong. Please try again.'}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleFormSubmit} className="border-t border-white/10 p-4 space-y-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50 dark:bg-white/5 dark:focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
            title="Send message (Ctrl+Enter)"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-white/40">
          <kbd className="rounded bg-white/10 px-1.5 py-0.5">⌘/</kbd> to toggle •{' '}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5">Esc</kbd> to close
        </p>
      </form>
    </div>
  );
}
