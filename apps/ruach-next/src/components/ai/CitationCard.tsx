'use client';

import { useState } from 'react';

export interface ScriptureCitation {
  type: 'scripture';
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation?: string;
}

export interface LibraryCitation {
  type: 'library';
  title: string;
  author: string;
  page?: number;
  pages?: string;
  excerpt?: string;
  url?: string;
}

export type Citation = ScriptureCitation | LibraryCitation;

interface CitationCardProps {
  citation: Citation;
  index?: number;
}

export function CitationCard({ citation, index }: CitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy citation:', err);
    }
  };

  if (citation.type === 'scripture') {
    const citationText = `${citation.book} ${citation.chapter}:${citation.verse}`;
    const fullText = `${citationText} (${citation.translation || 'Bible'})`;

    return (
      <div className="relative mb-2 rounded-lg border border-amber-300/20 bg-amber-50/5 p-3 dark:bg-amber-950/20">
        {/* Scripture indicator */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Scripture
            </span>
            {index !== undefined && (
              <span className="ml-2 text-xs text-white/60 dark:text-white/50">
                [{index + 1}]
              </span>
            )}
          </div>
          <button
            onClick={() => copyToClipboard(fullText)}
            className="rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white dark:text-white/60 dark:hover:bg-white/5"
            title="Copy citation"
            aria-label="Copy scripture citation"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>

        {/* Citation reference */}
        <p className="mb-2 font-semibold text-amber-700 dark:text-amber-300">
          {citationText}
          {citation.translation && (
            <span className="ml-2 text-xs font-normal text-white/70 dark:text-white/50">
              {citation.translation}
            </span>
          )}
        </p>

        {/* Scripture text */}
        <p className="text-sm text-white/80 leading-relaxed italic dark:text-white/80">
          "{citation.text}"
        </p>
      </div>
    );
  }

  // Library citation
  const libraryCitation = citation as LibraryCitation;
  const pageText = libraryCitation.page ? `p. ${libraryCitation.page}` :
    libraryCitation.pages ? `pp. ${libraryCitation.pages}` : null;

  return (
    <div className="mb-2 rounded-lg border border-white/10 bg-white/5 p-3 dark:bg-white/5">
      {/* Library indicator */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            Library
          </span>
          {index !== undefined && (
            <span className="ml-2 text-xs text-white/60 dark:text-white/50">
              [{index + 1}]
            </span>
          )}
        </div>
        <button
          onClick={() => {
            const citationText = `${libraryCitation.title} by ${libraryCitation.author}${pageText ? `, ${pageText}` : ''}`;
            copyToClipboard(citationText);
          }}
          className="rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white dark:text-white/60 dark:hover:bg-white/5"
          title="Copy citation"
          aria-label="Copy library citation"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {/* Title and author */}
      <div className="mb-2">
        <p className="font-semibold text-white dark:text-white">
          {libraryCitation.title}
        </p>
        <p className="text-sm text-white/70 dark:text-white/70">
          by {libraryCitation.author}
        </p>
      </div>

      {/* Page reference */}
      {pageText && (
        <p className="mb-2 text-xs text-white/60 dark:text-white/50">
          {pageText}
        </p>
      )}

      {/* Excerpt with expand button */}
      {libraryCitation.excerpt && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-500 transition-colors hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isExpanded ? 'Hide' : 'Show'} excerpt
          </button>
          {isExpanded && (
            <p className="mt-2 text-sm text-white/80 leading-relaxed italic dark:text-white/80">
              "{libraryCitation.excerpt}"
            </p>
          )}
        </div>
      )}

      {/* Source URL */}
      {libraryCitation.url && (
        <a
          href={libraryCitation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center text-xs text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View source
          <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}
    </div>
  );
}
