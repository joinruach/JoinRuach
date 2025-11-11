'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type QuickResult = {
  id: string;
  title: string;
  type: string;
  url: string;
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<QuickResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Keyboard shortcut: Cmd+K or Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch quick results as user types
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        setResults(
          (data.results || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            url: r.url,
          }))
        );
      } catch (error) {
        console.error('Quick search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const result = results[selectedIndex];
      if (result) {
        router.push(result.url);
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  const typeLabels: Record<string, string> = {
    media: "Media",
    series: "Series",
    course: "Course",
    blog: "Blog",
    event: "Event",
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search... (⌘K)"
          className="w-full rounded-full border border-white/20 bg-white/10 py-2 pl-10 pr-4 text-sm text-white placeholder-white/50 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
          🔍
        </div>
      </form>

      {/* Quick Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 shadow-xl z-50 overflow-hidden"
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-white/50">Searching...</div>
          ) : results.length > 0 ? (
            <div>
              {results.map((result, index) => (
                <Link
                  key={result.id}
                  href={result.url}
                  onClick={() => {
                    setIsOpen(false);
                    inputRef.current?.blur();
                  }}
                  className={`flex items-center gap-3 border-b border-white/10 p-3 transition last:border-0 ${
                    index === selectedIndex
                      ? "bg-amber-400/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                    {typeLabels[result.type] || result.type}
                  </span>
                  <span className="flex-1 text-sm text-white truncate">{result.title}</span>
                </Link>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => {
                  setIsOpen(false);
                  inputRef.current?.blur();
                }}
                className="block border-t border-white/10 bg-white/5 p-3 text-center text-sm font-semibold text-amber-300 hover:text-amber-200"
              >
                See all results →
              </Link>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-white/50">
              No results found. Try different keywords.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
