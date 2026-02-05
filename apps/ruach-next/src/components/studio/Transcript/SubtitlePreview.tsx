'use client';

import React, { useMemo, useState } from 'react';
import type { TranscriptSegment } from '@/lib/studio';

interface SubtitlePreviewProps {
  segments: TranscriptSegment[];
  speakerMap?: Record<string, string>;
  format?: 'srt' | 'vtt';
}

export function SubtitlePreview({
  segments,
  speakerMap = {},
  format = 'srt',
}: SubtitlePreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState<'srt' | 'vtt'>(format);

  const formatTime = (seconds: number, formatType: 'srt' | 'vtt'): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const separator = formatType === 'srt' ? ',' : '.';

    return (
      hours.toString().padStart(2, '0') +
      ':' +
      mins.toString().padStart(2, '0') +
      ':' +
      secs.toString().padStart(2, '0') +
      separator +
      ms.toString().padStart(3, '0')
    );
  };

  const generateSRT = (): string => {
    return segments
      .map((segment, index) => {
        const speakerName = segment.speaker ? (speakerMap[segment.speaker] || segment.speaker) : 'Unknown';
        const lines = [
          (index + 1).toString(),
          formatTime(segment.startMs, 'srt') + ' --> ' + formatTime(segment.endMs, 'srt'),
          '[' + speakerName + '] ' + segment.text,
          '',
        ];
        return lines.join('\n');
      })
      .join('\n');
  };

  const generateVTT = (): string => {
    const header = 'WEBVTT\n\n';
    const content = segments
      .map((segment, index) => {
        const speakerName = segment.speaker ? (speakerMap[segment.speaker] || segment.speaker) : 'Unknown';
        const lines = [
          (index + 1).toString(),
          formatTime(segment.startMs, 'vtt') + ' --> ' + formatTime(segment.endMs, 'vtt'),
          '<v ' + speakerName + '>' + segment.text,
          '',
        ];
        return lines.join('\n');
      })
      .join('\n');
    return header + content;
  };

  const previewContent = useMemo(() => {
    return selectedFormat === 'srt' ? generateSRT() : generateVTT();
  }, [segments, speakerMap, selectedFormat]);

  const handleDownload = () => {
    const content = previewContent;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = 'transcript-' + timestamp + '.' + selectedFormat;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewContent);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Subtitle Preview</h3>
            <p className="text-sm text-gray-500 mt-1">
              Preview and download formatted subtitles
            </p>
          </div>

          {/* Format Toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Format:</label>
            <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setSelectedFormat('srt')}
                className={
                  'px-4 py-2 text-sm font-medium transition-colors ' +
                  (selectedFormat === 'srt'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50')
                }
              >
                SRT
              </button>
              <button
                onClick={() => setSelectedFormat('vtt')}
                className={
                  'px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ' +
                  (selectedFormat === 'vtt'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50')
                }
              >
                VTT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-6">
        {segments.length > 0 ? (
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
              {previewContent}
            </pre>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No transcript segments to preview
          </div>
        )}
      </div>

      {/* Actions */}
      {segments.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {segments.length} segments • {selectedFormat.toUpperCase()} format
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </div>
              </button>

              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download {selectedFormat.toUpperCase()}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
