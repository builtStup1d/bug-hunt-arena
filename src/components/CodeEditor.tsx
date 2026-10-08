'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Editor, { loader } from '@monaco-editor/react';

// Pin Monaco to 0.45.0 to avoid breaking changes in 0.50+ AMD module loader
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
  },
});

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
  height?: string;
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class EditorErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Monaco Editor error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function CodeEditor({
  code,
  onChange,
  language,
  readOnly = false,
  height = '400px',
}: CodeEditorProps) {
  const lineCount = Math.max(1, (code || '').split('\n').length);

  const fallbackEditor = (
    <div className="flex h-full w-full bg-[#1e1e1e] font-mono text-sm text-gray-200 overflow-hidden">
      <div className="py-4 px-3 bg-[#181818] text-gray-500 select-none text-right font-mono text-xs border-r border-gray-800 shrink-0">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1} className="leading-6">
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        className="w-full h-full p-4 bg-transparent resize-none outline-none font-mono text-sm leading-6 text-gray-100 selection:bg-indigo-500/30"
      />
    </div>
  );

  return (
    <div className="glass-card rounded-lg overflow-hidden flex flex-col" style={{ height }}>
      <div className="bg-gray-800 px-4 py-2 text-gray-300 text-sm font-semibold uppercase tracking-wider flex justify-between items-center border-b border-gray-700">
        <span>{language}</span>
        {readOnly && <span className="text-red-400 text-xs">Read Only</span>}
      </div>
      <div className="flex-1 relative">
        <EditorErrorBoundary fallback={fallbackEditor}>
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => onChange(value || '')}
            loading={
              <div className="flex items-center justify-center h-full text-gray-400 font-mono text-xs">
                Loading editor...
              </div>
            }
            options={{
              readOnly,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              roundedSelection: true,
              padding: { top: 16, bottom: 16 },
            }}
          />
        </EditorErrorBoundary>
      </div>
    </div>
  );
}
