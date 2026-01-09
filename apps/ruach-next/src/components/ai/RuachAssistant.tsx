'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const RuachAssistantPanel = dynamic(() => import("./RuachAssistantPanel"), {
  ssr: false,
  loading: () => null,
});

export function RuachAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
        aria-label="Open Ruach AI Assistant"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
          AI
        </span>
      </button>
    );
  }

  return <RuachAssistantPanel onClose={() => setIsOpen(false)} />;
}
