'use client';

import { useChat } from '@ai-sdk/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function RuachAssistantPanel({ onClose }: { onClose: () => void }) {
  const { messages: uiMessages, sendMessage, status, error: chatError } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const isLoading = status === 'streaming' || status === 'submitted';

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

        return { id: message.id, role: message.role, content: text };
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
          parts: [{ type: 'text', text: trimmed }],
        });
      } catch (err) {
        console.error('Failed to send chat message:', err);
      }
    },
    [sendMessage]
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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <h3 className="font-semibold text-white">Ruach AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 transition-colors hover:text-white"
          aria-label="Close assistant"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

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
              Ask me about spiritual topics, find content, or get recommendations
            </p>
            <div className="space-y-2 text-left">
              <button
                onClick={() => handleSuggestionClick('What is the latest series?')}
                className="w-full rounded-lg border border-white/10 p-3 text-left text-sm text-white/80 transition-colors hover:bg-white/5"
              >
                What is the latest series?
              </button>
              <button
                onClick={() => handleSuggestionClick('Recommend videos about prayer')}
                className="w-full rounded-lg border border-white/10 p-3 text-left text-sm text-white/80 transition-colors hover:bg-white/5"
              >
                Recommend videos about prayer
              </button>
            </div>
          </div>
        ) : (
          <>
            {simplifiedMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user' ? 'bg-amber-500 text-white' : 'bg-white/10 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-white/10 px-4 py-2">
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
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error.message || 'Something went wrong. Please try again.'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleFormSubmit} className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-white/40">
          Press <kbd className="rounded bg-white/10 px-1.5 py-0.5">⌘/</kbd> to toggle assistant
        </p>
      </form>
    </div>
  );
}

