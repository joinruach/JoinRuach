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
    citationCoverage: number;
    guardrailCompliance: number;
  };
}

export default function RuachAssistantFullPage() {
  const { messages: uiMessages, sendMessage, status, error: chatError } = useChat({
    api: '/api/assistant',
  } as any);

  const { toast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AssistantMode>('Q&A');
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const [sessionHistory, setSessionHistory] = useState<
    { id: string; timestamp: string; message: string }[]
  >([]);
  const [savedSessions, setSavedSessions] = useState<
    { id: string; title: string; timestamp: string; mode: AssistantMode }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
          {
            id: `msg-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            message: trimmed,
          },
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

  const saveSession = useCallback(() => {
    const sessionId = `session-${Date.now()}`;
    const firstQuestion = sessionHistory[0]?.message || 'Untitled';
    const title = firstQuestion.substring(0, 50) + (firstQuestion.length > 50 ? '...' : '');

    setSavedSessions((prev) => [
      ...prev,
      {
        id: sessionId,
        title,
        timestamp: new Date().toLocaleDateString(),
        mode,
      },
    ]);

    toast({
      title: 'Session Saved',
      description: 'Your conversation has been saved.',
      variant: 'success',
    });
  }, [sessionHistory, mode, toast]);

  const startNewSession = useCallback(() => {
    setSessionHistory([]);
    setExpandedCitations(new Set());
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simplifiedMessages]);

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
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-white/10 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-white/60 dark:hover:bg-white/10"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Ruach AI Assistant</h1>
            <p className="text-sm text-zinc-600 dark:text-white/60">
              {mode === 'Q&A' && 'Ask about Scripture, theology, or spiritual topics'}
              {mode === 'Study Guide' && 'Create comprehensive study materials and resources'}
              {mode === 'Sermon Prep' && 'Develop sermon outlines and teaching content'}
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          {(['Q&A', 'Study Guide', 'Sermon Prep'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-amber-500 text-white'
                  : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 border-r border-zinc-200 bg-zinc-50 p-4 overflow-y-auto dark:border-white/10 dark:bg-zinc-950">
            {/* New Session Button */}
            <button
              onClick={startNewSession}
              className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 mb-6"
            >
              <svg
                className="mr-2 inline h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Session
            </button>

            {/* Saved Sessions */}
            {savedSessions.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-semibold uppercase text-zinc-600 dark:text-white/60">
                  Saved Sessions
                </h3>
                <div className="space-y-2">
                  {savedSessions.map((session) => (
                    <button
                      key={session.id}
                      className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-left text-sm transition-colors hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <p className="font-medium text-zinc-900 dark:text-white">{session.title}</p>
                      <p className="text-xs text-zinc-600 dark:text-white/60">{session.timestamp}</p>
                      <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                        {session.mode}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Session History */}
            {sessionHistory.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase text-zinc-600 dark:text-white/60">
                  Session History
                </h3>
                <button
                  onClick={saveSession}
                  className="mb-3 w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-900/30 dark:bg-green-950/30 dark:text-green-300 dark:hover:bg-green-950/50"
                >
                  Save This Session
                </button>
                <div className="space-y-2">
                  {sessionHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-zinc-200 bg-white p-2 text-xs dark:border-white/10 dark:bg-white/5"
                    >
                      <p className="truncate font-medium text-zinc-900 dark:text-white">{item.message}</p>
                      <p className="text-zinc-600 dark:text-white/50">{item.timestamp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto bg-white p-6 dark:bg-zinc-950">
            {simplifiedMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-amber-500/10 p-6">
                  <svg className="h-10 w-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                  How can I help you today?
                </h2>
                <p className="mb-8 max-w-md text-zinc-600 dark:text-white/60">
                  {mode === 'Q&A' && 'Ask about Scripture, theology, or spiritual topics'}
                  {mode === 'Study Guide' && 'Create comprehensive study materials and resources'}
                  {mode === 'Sermon Prep' && 'Develop sermon outlines and teaching content'}
                </p>
                <div className="grid w-full max-w-2xl gap-3">
                  {getSuggestionsByMode().map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left transition-colors hover:border-amber-500 hover:bg-amber-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-amber-600 dark:hover:bg-amber-950/20"
                    >
                      <svg
                        className="mb-2 h-4 w-4 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                      <p className="font-medium text-zinc-900 dark:text-white">{suggestion}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {simplifiedMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xl rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>

                      {/* Quality Score Badge */}
                      {msg.qualityScore && msg.role === 'assistant' && (
                        <div className="mt-3 flex gap-4 border-t border-current border-opacity-10 pt-3 text-xs text-current text-opacity-70">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-current" />
                            Citations: {msg.qualityScore.citationCoverage}%
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-current" />
                            Guardrail: {msg.qualityScore.guardrailCompliance}%
                          </div>
                        </div>
                      )}

                      {/* Citations */}
                      {msg.citations && msg.citations.length > 0 && msg.role === 'assistant' && (
                        <div className="mt-3 border-t border-current border-opacity-10 pt-3">
                          <button
                            onClick={() => toggleCitationExpansion(msg.id)}
                            className="text-xs font-medium text-current hover:text-current hover:opacity-80 transition-opacity"
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
                    <div className="rounded-lg bg-zinc-100 px-4 py-3 dark:bg-white/10">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-600 dark:bg-white/60" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-600 dark:bg-white/60 [animation-delay:0.2s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-600 dark:bg-white/60 [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {chatError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
                <p className="font-semibold">Error</p>
                <p>{chatError.message || 'Something went wrong. Please try again.'}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
            <form onSubmit={handleFormSubmit} className="space-y-2">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-white/40 dark:focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-lg bg-amber-500 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-zinc-600 dark:text-white/50">
                Tip: Use ⌘+Enter (or Ctrl+Enter) to send quickly
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
